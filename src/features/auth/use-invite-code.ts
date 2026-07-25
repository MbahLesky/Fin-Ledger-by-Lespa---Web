import { useEffect, useState } from "react";
import { readInviteCodeFromUrl } from "@/features/auth/invite-code";

/**
 * Reads the invite code carried in on the URL or held in session storage. Resolved
 * in an effect rather than during render so the value is read once, after mount.
 */
export function useInviteCode(): string {
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    setInviteCode(readInviteCodeFromUrl());
  }, []);

  return inviteCode;
}
