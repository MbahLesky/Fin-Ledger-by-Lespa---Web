const rawEnv = import.meta.env;

export const env = {
  firebase: {
    apiKey: rawEnv.VITE_FIREBASE_API_KEY?.trim() ?? "",
    authDomain: rawEnv.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
    projectId: rawEnv.VITE_FIREBASE_PROJECT_ID?.trim() ?? "",
    storageBucket: rawEnv.VITE_FIREBASE_STORAGE_BUCKET?.trim() ?? "",
    messagingSenderId: rawEnv.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "",
    appId: rawEnv.VITE_FIREBASE_APP_ID?.trim() ?? "",
    measurementId: rawEnv.VITE_FIREBASE_MEASUREMENT_ID?.trim() ?? ""
  },
  googleClientId: rawEnv.VITE_GOOGLE_CLIENT_ID?.trim() ?? "",
  appEnv: rawEnv.VITE_APP_ENV?.trim() ?? "development",
  enablePwa: rawEnv.VITE_ENABLE_PWA !== "false"
};

export const isFirebaseConfigured =
  env.firebase.apiKey.length > 0 && env.firebase.projectId.length > 0;
