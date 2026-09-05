/**
 * What to do with the workspace already on this browser when someone signs in.
 *
 * - `continue`: it is theirs (or nobody's) — carry on and sync.
 * - `clear-previous`: it belongs to someone else and the cloud already has all of
 *   it, so it can be wiped without losing anything.
 * - `ask`: it belongs to someone else and holds changes the cloud never received.
 *   Wiping would destroy them, so a person decides.
 */
export type AccountSwitchDecision = "continue" | "clear-previous" | "ask";

export function decideAccountSwitch({
  localOwnerId,
  userId,
  unsyncedCount
}: {
  localOwnerId: string | null;
  userId: string;
  unsyncedCount: number;
}): AccountSwitchDecision {
  if (!localOwnerId || localOwnerId === userId) {
    return "continue";
  }

  return unsyncedCount > 0 ? "ask" : "clear-previous";
}
