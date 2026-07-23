/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Declared so `import.meta.env` reads as `string | undefined` rather than the
// `any` from vite/client's index signature. Consumed via src/lib/env.ts.
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_ENABLE_PWA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
