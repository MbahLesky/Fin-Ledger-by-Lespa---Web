import type { SyncableEntity, TransactionType } from "@/types/common";

export interface Category extends SyncableEntity {
  name: string;
  type: TransactionType;
  iconKey?: string | null;
  colorKey?: string | null;
  isSystem: boolean;
  isActive: boolean;
}

