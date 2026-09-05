import type { SyncEntityName, SyncOperationType } from "@/types/common";

export interface SyncOperationRecord {
  id: string;
  entityName: SyncEntityName;
  entityId: string;
  operation: SyncOperationType;
  status: "pending" | "processing" | "failed";
  payload?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  lastAttemptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncSummary {
  pending: number;
  failed: number;
  processing: boolean;
  lastSyncedAt?: string | null;
}


// Adds the pull outcome to the queue summary: a run that could not reach
// Firestore (offline, or a failed pull) leaves local data unverified, so callers
// must not act as though it reflects the account's real state.
export interface SyncRunResult extends SyncSummary {
  pulled: boolean;
}
