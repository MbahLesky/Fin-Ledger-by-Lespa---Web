// Mirrors the `beta-codes` Firestore collection the landing page reads
// (Landing Page/lib/firestore-testers.js). Field names are the landing page's,
// including the British `organisation_name` spelling and snake_case.
export interface BetaCodeInfo {
  id: string;
  code: string;
  organisation_name?: string | null;
  max_testers?: number | null;
  type?: string | null;
  active: boolean;
}

// One document per Firebase user in the `testers` collection, shared with the
// landing page. `code` is "" for general (codeless) testers.
export interface TesterRecord {
  name: string;
  email: string;
  phone: string;
  code: string;
  createdAt?: string;
  agreement?: {
    version: string;
    signedName: string;
    acceptedAt: string;
  };
}

// Outcome of claiming a place as a beta tester.
//   registered  - tester document written (with or without a code)
//   invalid_code - the code does not exist, or is switched off
//   error       - Firestore refused the read/write
export type TesterRegistrationStatus = "registered" | "invalid_code" | "error";

export interface TesterRegistrationResult {
  status: TesterRegistrationStatus;
  code: BetaCodeInfo | null;
}
