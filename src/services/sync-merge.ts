// Last-write-wins helpers, kept free of Dexie and Firebase so the merge rules can
// be reasoned about (and tested) on their own.

const EPOCH_ISO = new Date(0).toISOString();

/**
 * Normalises a remote `updatedAt` to an ISO string.
 *
 * Comparison is lexicographic on ISO strings, so a record written by another
 * client as a Firestore Timestamp (or a Date) would otherwise compare as an
 * object and silently win — or lose — every merge. A value with no usable
 * timestamp is treated as the oldest possible, so local edits are kept.
 */
export function toIsoTimestamp(value: unknown): string {
  if (typeof value === "string" && value) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return EPOCH_ISO;
    }
  }

  return EPOCH_ISO;
}

/**
 * Whether a pulled record replaces what is on this device. Ties go to the remote
 * copy: a record the device has never seen is missing entirely, and the seeded
 * placeholders are stamped at the epoch precisely so any real record outranks
 * them.
 */
export function shouldApplyRemoteRecord(remoteUpdatedAt: unknown, localUpdatedAt: unknown): boolean {
  if (localUpdatedAt === undefined || localUpdatedAt === null) {
    return true;
  }

  return toIsoTimestamp(remoteUpdatedAt) >= toIsoTimestamp(localUpdatedAt);
}
