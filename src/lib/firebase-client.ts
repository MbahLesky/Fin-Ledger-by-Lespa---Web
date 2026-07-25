import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore
} from "firebase/firestore";
import { env, isFirebaseConfigured } from "@/lib/env";

// Web-only Firebase (project monilog-28535, shared with the Flutter app + landing
// page for identity). Auth handles sign-in; Firestore is the cloud mirror that the
// planned WhatsApp chatbot will write into and the web syncs against. Dexie remains
// the local-first source of truth (see src/services/sync-engine.ts).
export const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(env.firebase)
  : null;

export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;

export const firestore: Firestore | null = firebaseApp
  ? initializeFirestore(firebaseApp, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    })
  : null;
