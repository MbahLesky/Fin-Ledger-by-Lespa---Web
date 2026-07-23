import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
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

function assertAuth() {
  if (!firebaseAuth) {
    throw new Error(
      "Authentication is unavailable until valid Firebase configuration is provided."
    );
  }

  return firebaseAuth;
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
