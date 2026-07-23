// Minimal typings for the Google Identity Services script loaded at runtime by
// src/features/auth/google-one-tap.tsx. Only the One Tap surface is described.
interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
  context?: "signin" | "signup" | "use";
  itp_support?: boolean;
}

interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void;
  prompt: () => void;
  cancel: () => void;
  disableAutoSelect: () => void;
}

interface Window {
  google?: {
    accounts?: {
      id?: GoogleAccountsId;
    };
  };
}
