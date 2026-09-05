import type { SyncEntityName } from "@/types";

// Bumped from the old Supabase engine ("finance-ledger-*") so the one-time
// backend switch started each entity's pull cursor fresh.
const CHECKPOINT_PREFIX = "monilog-firestore-checkpoint";

export const SYNC_ENTITY_NAMES: SyncEntityName[] = [
  "accounts",
  "categories",
  "transactions",
  "transfers",
  "settings",
  "notificationPreferences"
];

/**
 * A pull cursor: the newest `updatedAt` already pulled for one entity of one
 * account.
 *
 * Scoped by uid because this browser is a single, unpartitioned store — an
 * unscoped cursor let whichever account synced last hide the next account's
 * entire history behind a `updatedAt >` filter that nothing could satisfy.
 */
function getCheckpointKey(entityName: SyncEntityName, userId: string) {
  return `${CHECKPOINT_PREFIX}:${userId}:${entityName}`;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    // Private-mode browsers can throw on access; a missing cursor only costs a
    // full pull.
    return null;
  }
}

export function getCheckpoint(entityName: SyncEntityName, userId: string): string | null {
  return getStorage()?.getItem(getCheckpointKey(entityName, userId)) ?? null;
}

export function setCheckpoint(entityName: SyncEntityName, userId: string, value: string): void {
  getStorage()?.setItem(getCheckpointKey(entityName, userId), value);
}

/**
 * Removes pull cursors — one account's when given a uid, otherwise every one.
 *
 * A cursor that outlives the rows it describes is what makes an account's ledger
 * look empty forever: the next pull is told everything older than the cursor is
 * already present, so the remote history is never fetched. Clear cursors whenever
 * the local rows they describe are gone.
 */
export function clearCheckpoints(userId?: string): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const prefix = userId ? `${CHECKPOINT_PREFIX}:${userId}:` : `${CHECKPOINT_PREFIX}:`;
  const keys: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(prefix)) {
      keys.push(key);
    }
  }

  keys.forEach((key) => storage.removeItem(key));
}

// Cursors written before checkpoints were scoped by uid ("<prefix>:<entity>").
// They cannot be attributed to an account, so they are dropped rather than
// migrated — at worst one full pull.
export function clearLegacyCheckpoints(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  SYNC_ENTITY_NAMES.forEach((entityName) => {
    storage.removeItem(`${CHECKPOINT_PREFIX}:${entityName}`);
  });
}
