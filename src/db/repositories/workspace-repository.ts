import { accountsRepository } from "@/db/repositories/accounts-repository";
import { auditRepository } from "@/db/repositories/audit-repository";
import { categoriesRepository } from "@/db/repositories/categories-repository";
import { settingsRepository } from "@/db/repositories/settings-repository";
import {
  assertOnlineForSharedWrite,
  assertSupabaseClient,
  getAuthenticatedUserId
} from "@/services/supabase-data-service";
import { useRealtimeStore } from "@/store/realtime-store";

export const workspaceRepository = {
  async initializeForUser(userId?: string) {
    const ownerId = userId ?? (await getAuthenticatedUserId());
    await settingsRepository.ensureSeedData(ownerId);
    await Promise.all([
      accountsRepository.ensureDefaults(ownerId),
      categoriesRepository.ensureDefaults(ownerId)
    ]);
  },

  async resetAppData() {
    assertOnlineForSharedWrite();
    const userId = await getAuthenticatedUserId();
    const client = assertSupabaseClient();

    const tables = [
      "transfers",
      "transactions",
      "categories",
      "accounts",
      "notification_preferences",
      "settings"
    ] as const;

    for (const table of tables) {
      const { error } = await client.from(table).delete().eq("user_id", userId);
      if (error) {
        throw new Error(error.message);
      }
    }

    await auditRepository.clearHistory();
    await this.initializeForUser(userId);
    useRealtimeStore.getState().markLocalMutation("workspace");
  }
};
