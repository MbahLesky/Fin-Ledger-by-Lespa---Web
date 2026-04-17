import { useEffect, useState, type DependencyList } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useRealtimeStore } from "@/store/realtime-store";

interface BackendQueryState<T> {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
}

export function useBackendQuery<T>(
  query: () => Promise<T>,
  dependencies: DependencyList = []
): BackendQueryState<T> {
  const authStatus = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const revision = useRealtimeStore((state) => state.revision);
  const [state, setState] = useState<BackendQueryState<T>>({
    data: undefined,
    isLoading: authStatus === "signed_in",
    error: null
  });

  useEffect(() => {
    let isCurrent = true;

    if (authStatus !== "signed_in" || !userId) {
      setState({
        data: undefined,
        isLoading: false,
        error: null
      });
      return () => {
        isCurrent = false;
      };
    }

    setState((current) => ({
      ...current,
      isLoading: true,
      error: null
    }));

    void query()
      .then((data) => {
        if (isCurrent) {
          setState({
            data,
            isLoading: false,
            error: null
          });
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setState((current) => ({
            ...current,
            isLoading: false,
            error: error instanceof Error ? error.message : "Unable to load shared backend data."
          }));
        }
      });

    return () => {
      isCurrent = false;
    };
    // The caller supplies dependencies for query inputs; realtime revision invalidates backend reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, userId, revision, ...dependencies]);

  return state;
}
