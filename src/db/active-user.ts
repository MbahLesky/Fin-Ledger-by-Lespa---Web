/**
 * Who the local database is being read for.
 *
 * Local storage is one unpartitioned store shared by everyone who signs in on a
 * browser, so a row's `userId` is the only thing separating one person's ledger
 * from another's. Reads are scoped through here rather than trusting that the
 * previous account's rows were cleared: if a wipe is ever interrupted, or a row
 * survives one, it still never reaches the screen.
 *
 * Rows with no owner are the seeded defaults and anything created before sign-in
 * finished; they belong to whoever is signed in now.
 */
let activeUserId: string | null = null;

export function setActiveUserId(userId: string | null): void {
  activeUserId = userId;
}

export function getActiveUserId(): string | null {
  return activeUserId;
}

export function belongsToActiveUser(record: { userId?: string | null }): boolean {
  if (!record.userId) {
    return true;
  }

  return record.userId === activeUserId;
}
