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

