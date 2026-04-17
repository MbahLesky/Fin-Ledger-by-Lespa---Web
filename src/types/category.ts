import type { SharedEntity, TransactionType } from "@/types/common";

export interface Category extends SharedEntity {
  name: string;
  type: TransactionType;
  iconKey?: string | null;
  colorKey?: string | null;
  isSystem: boolean;
  isActive: boolean;
}
