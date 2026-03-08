import type { backendInterface } from "../backend";
import { useActor } from "./useActor";

/**
 * Returns the backend actor for direct imperative calls.
 * Returns null while actor is loading.
 */
export function useBackend(): {
  actor: backendInterface | null;
  isReady: boolean;
} {
  const { actor, isFetching } = useActor();
  return {
    actor: actor ?? null,
    isReady: !!actor && !isFetching,
  };
}
