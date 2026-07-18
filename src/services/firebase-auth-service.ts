import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User
} from "firebase/auth";
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
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  },

  async signUp(input: { fullName: string; email: string; password: string }) {
    const auth = assertAuth();
    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
    const fullName = input.fullName.trim();
    if (fullName) {
      await updateProfile(credential.user, { displayName: fullName });
    }
    return credential.user;
  },

  async signInWithGoogle() {
    const auth = assertAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const credential = await signInWithPopup(auth, provider);
    return credential.user;
  },

  async signOut() {
    const auth = assertAuth();
    await signOut(auth);
  },

  async sendPasswordReset(email: string) {
    const auth = assertAuth();
    await sendPasswordResetEmail(auth, email);
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
