import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from "firebase/firestore";
import { firestore } from "@/lib/firebase-client";
import { normalizeInviteCode } from "@/features/auth/invite-code";
import type { BetaCodeInfo, TesterRecord, TesterRegistrationResult } from "@/types";
import { nowIso } from "@/utils/date-utils";

// The beta-tester roster lives in two top-level collections shared with the
// landing page (Landing Page/lib/firestore-testers.js) rather than under
// users/{uid}, so a tester registered on either surface is recognised by both.
const TESTERS_COLLECTION = "testers";
const BETA_CODES_COLLECTION = "beta-codes";

function assertFirestore() {
  if (!firestore) {
    throw new Error("Firestore is unavailable until valid Firebase configuration is provided.");
  }

  return firestore;
}

export const betaTesterService = {
  // Looks a code up by its `code` field rather than document id, matching how the
  // landing page seeds the collection. Returns null when unknown.
  async getBetaCodeInfo(code: string): Promise<BetaCodeInfo | null> {
    const db = assertFirestore();
    const normalized = normalizeInviteCode(code);
    if (!normalized) {
      return null;
    }

    const snapshot = await getDocs(
      query(collection(db, BETA_CODES_COLLECTION), where("code", "==", normalized), limit(1))
    );

    const match = snapshot.docs[0];
    if (!match) {
      return null;
    }

    return { id: match.id, ...match.data() } as BetaCodeInfo;
  },

  async getTester(uid: string): Promise<TesterRecord | null> {
    const db = assertFirestore();
    const snapshot = await getDoc(doc(collection(db, TESTERS_COLLECTION), uid));
    return snapshot.exists() ? (snapshot.data() as TesterRecord) : null;
  },

  // Merged, so re-registering never clears fields written by the landing page —
  // notably the beta agreement acceptance.
  async storeTester(
    uid: string,
    { name, email, phone = "", code = "" }: Omit<TesterRecord, "createdAt" | "agreement">
  ): Promise<void> {
    const db = assertFirestore();
    await setDoc(
      doc(collection(db, TESTERS_COLLECTION), uid),
      {
        name: name || "",
        email: email || "",
        phone: phone || "",
        code: code || "",
        createdAt: nowIso()
      },
      { merge: true }
    );
  },

  /**
   * Claims a place on the beta roster for a signed-in user. A blank code joins the
   * general (codeless) pool, exactly as on the landing page; a supplied code must
   * exist and be active.
   *
   * Per-code capacity is NOT enforced here. The landing page's client path has the
   * same gap (its `registerTester` carries a TODO); the race-free cap lives in the
   * Supabase `register_tester` RPC, which needs a server to call it.
   */
  async registerTester(
    uid: string,
    { name = "", email = "", phone = "", code = "" }: Partial<Omit<TesterRecord, "createdAt">> = {}
  ): Promise<TesterRegistrationResult> {
    const normalized = normalizeInviteCode(code);
    let codeInfo: BetaCodeInfo | null = null;

    if (normalized) {
      try {
        codeInfo = await this.getBetaCodeInfo(normalized);
      } catch (lookupError) {
        console.error("Beta code lookup failed:", lookupError);
        return { status: "error", code: null };
      }

      if (!codeInfo?.active) {
        return { status: "invalid_code", code: null };
      }
    }

    try {
      await this.storeTester(uid, {
        name,
        email,
        phone,
        code: normalized ?? ""
      });
    } catch (storeError) {
      console.error("Failed to store tester:", storeError);
      return { status: "error", code: null };
    }

    return { status: "registered", code: codeInfo };
  }
};
