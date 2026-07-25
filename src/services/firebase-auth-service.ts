import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User
} from "firebase/auth";
import { withMappedAuthError } from "@/features/auth/auth-errors";
import { firebaseAuth } from "@/lib/firebase-client";

// Only roll back an account created moments ago, so a rejected invite code can
// never delete a pre-existing user who was merely signing in. Matches the guard in
// the landing page's register-tester route.
const JUST_CREATED_MS = 5 * 60 * 1000;

function assertAuth() {
  if (!firebaseAuth) {
    throw new Error(
      "Authentication is unavailable until valid Firebase configuration is provided."
    );
  }

  return firebaseAuth;
}

function wasJustCreated(user: User): boolean {
  const created = Date.parse(user.metadata.creationTime ?? "");
  if (Number.isNaN(created)) {
    return false;
  }

  return Date.now() - created < JUST_CREATED_MS;
}

export const firebaseAuthService = {
  getCurrentUser(): User | null {
    return firebaseAuth?.currentUser ?? null;
  },

  async signIn(email: string, password: string) {
    const auth = assertAuth();
    return withMappedAuthError(async () => {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    });
  },

  async signUp(input: { fullName: string; email: string; password: string }) {
    const auth = assertAuth();
    return withMappedAuthError(async () => {
      const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
      const fullName = input.fullName.trim();
      if (fullName) {
        await updateProfile(credential.user, { displayName: fullName });
      }
      return credential.user;
    });
  },

  async signInWithGoogle() {
    const auth = assertAuth();
    return withMappedAuthError(async () => {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      return credential.user;
    });
  },

  // Google One Tap hands back an ID token rather than opening a popup, so the
  // credential is exchanged directly for a Firebase session.
  async signInWithGoogleCredential(idToken: string) {
    const auth = assertAuth();
    return withMappedAuthError(async () => {
      const credential = await signInWithCredential(
        auth,
        GoogleAuthProvider.credential(idToken)
      );
      return credential.user;
    });
  },

  async signOut() {
    const auth = assertAuth();
    await signOut(auth);
  },

  /**
   * Removes the signed-in account when it was created within the last few minutes,
   * used to undo a sign-up that was rejected by the invite-code gate. Returns
   * false — leaving the account untouched — for anyone who existed beforehand.
   */
  async deleteJustCreatedUser(): Promise<boolean> {
    const auth = assertAuth();
    const current = auth.currentUser;
    if (!current || !wasJustCreated(current)) {
      return false;
    }

    try {
      await deleteUser(current);
      return true;
    } catch (error) {
      // Firebase requires a recent credential; if it refuses, the caller signs the
      // user out instead and the account simply remains.
      console.error("Failed to roll back rejected account:", error);
      return false;
    }
  },

  // Best-effort: a verification email that fails to send must never block a
  // freshly created account from reaching the app.
  async sendVerificationEmail() {
    const auth = assertAuth();
    if (!auth.currentUser || auth.currentUser.emailVerified) {
      return false;
    }

    try {
      await sendEmailVerification(auth.currentUser);
      return true;
    } catch {
      return false;
    }
  },

  async sendPasswordReset(email: string) {
    const auth = assertAuth();
    await withMappedAuthError(() => sendPasswordResetEmail(auth, email));
  },

  async updateDisplayName(displayName: string) {
    const auth = assertAuth();
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    const auth = assertAuth();
    return onAuthStateChanged(auth, callback);
  }
};
