import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { syncRepository } from "@/db/repositories/sync-repository";

/**
 * Warns before the tab closes while changes are still waiting to reach the cloud.
 *
 * Closing the tab does not lose them — they stay in this browser — but someone
 * who then opens the app elsewhere would not find them, so the moment to mention
 * it is before they walk away.
 */
export function useUnsyncedExitWarning() {
  const unsyncedCount = useLiveQuery(() => syncRepository.countUnsynced(), [], 0);

  useEffect(() => {
    if (unsyncedCount === 0) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      // Browsers show their own wording; a non-empty returnValue is what asks for
      // the prompt at all.
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsyncedCount]);

  return unsyncedCount;
}
