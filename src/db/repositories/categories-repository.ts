import { createDefaultCategories } from "@/db/seed/default-records";
import {
  assertOnlineForSharedWrite,
  assertSupabaseClient,
  getAuthenticatedUserId,
  nowTimestamp,
  readBoolean,
  readNullableString,
  readString
} from "@/services/supabase-data-service";
import { useRealtimeStore } from "@/store/realtime-store";
import type { Category, TransactionType } from "@/types";
import { createUuid } from "@/utils/id";

function fromCategoryRow(row: Record<string, unknown>): Category {
  return {
    id: readString(row, "id"),
    userId: readString(row, "user_id"),
    name: readString(row, "name"),
    type: readString(row, "type") as TransactionType,
    iconKey: readNullableString(row, "icon_key"),
    colorKey: readNullableString(row, "color_key"),
    isSystem: readBoolean(row, "is_system"),
    isActive: readBoolean(row, "is_active", true),
    createdAt: readString(row, "created_at"),
    updatedAt: readString(row, "updated_at"),
    deletedAt: readNullableString(row, "deleted_at")
  };
}

function toCategoryPayload(category: Category) {
  return {
    id: category.id,
    user_id: category.userId,
    name: category.name,
    type: category.type,
    icon_key: category.iconKey ?? null,
    color_key: category.colorKey ?? null,
    is_system: category.isSystem,
    is_active: category.isActive,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
    deleted_at: category.deletedAt ?? null
  };
}

function notifyCategoriesChanged() {
  useRealtimeStore.getState().markLocalMutation("categories");
}

async function ensureDefaultCategories(userId: string) {
  const client = assertSupabaseClient();
  const { data: activeRows, error } = await client
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if ((activeRows ?? []).length > 0) {
    return;
  }

  const defaults = createDefaultCategories(userId);
  const defaultIds = defaults.map((category) => category.id);
  const { data: existingRows, error: existingError } = await client
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .in("id", defaultIds);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingIds = new Set((existingRows ?? []).map((row) => readString(row, "id")));
  const missingDefaults = defaults.filter((category) => !existingIds.has(category.id));

  if (missingDefaults.length > 0) {
    const { error: seedError } = await client
      .from("categories")
      .insert(missingDefaults.map(toCategoryPayload));

    if (seedError) {
      throw new Error(seedError.message);
    }

    notifyCategoriesChanged();
  }
}

async function fetchCategoryById(userId: string, id: string) {
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromCategoryRow(data) : undefined;
}

export const categoriesRepository = {
  async ensureDefaults(userId?: string) {
    await ensureDefaultCategories(userId ?? (await getAuthenticatedUserId()));
  },

  async listActive() {
    const userId = await getAuthenticatedUserId();
    await ensureDefaultCategories(userId);

    const client = assertSupabaseClient();
    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(fromCategoryRow);
  },

  async listByType(type: TransactionType) {
    const categories = await this.listActive();
    return categories.filter((category) => category.type === type);
  },

  async getById(id: string) {
    const userId = await getAuthenticatedUserId();
    await ensureDefaultCategories(userId);
    return fetchCategoryById(userId, id);
  },

  async findMatch(name: string, type: TransactionType) {
    const normalized = name.trim().toLowerCase();
    return (await this.listActive()).find(
      (category) =>
        category.type === type &&
        category.name.trim().toLowerCase() === normalized
    );
  },

  async createCategory(input: {
    name: string;
    type: TransactionType;
    colorKey?: string | null;
    iconKey?: string | null;
    userId?: string | null;
  }) {
    assertOnlineForSharedWrite();
    const userId = await getAuthenticatedUserId();
    const timestamp = nowTimestamp();
    const category: Category = {
      id: createUuid(),
      name: input.name.trim(),
      type: input.type,
      colorKey: input.colorKey ?? (input.type === "income" ? "success" : "danger"),
      iconKey: input.iconKey ?? null,
      isSystem: false,
      isActive: true,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null
    };

    const client = assertSupabaseClient();
    const { data, error } = await client
      .from("categories")
      .insert(toCategoryPayload(category))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyCategoriesChanged();
    return fromCategoryRow(data);
  },

  async updateCategory(
    id: string,
    updates: Partial<Pick<Category, "name" | "colorKey" | "iconKey" | "isActive" | "userId" | "deletedAt">>
  ) {
    assertOnlineForSharedWrite();
    const userId = await getAuthenticatedUserId();
    const current = await fetchCategoryById(userId, id);

    if (!current) {
      throw new Error("Category not found.");
    }

    const client = assertSupabaseClient();
    const { data, error } = await client
      .from("categories")
      .update(
        toCategoryPayload({
          ...current,
          ...updates,
          userId,
          updatedAt: nowTimestamp()
        })
      )
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyCategoriesChanged();
    return fromCategoryRow(data);
  },

  async softDelete(id: string) {
    const category = await this.getById(id);
    if (!category || category.isSystem) {
      return;
    }

    await this.updateCategory(id, {
      isActive: false,
      deletedAt: nowTimestamp()
    });
  }
};
