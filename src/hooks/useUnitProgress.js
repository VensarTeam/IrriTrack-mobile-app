import { useCallback, useEffect, useRef, useState } from "react";
import { createEmptyUnitProgress } from "../models/unitProgress";
import { fetchUnitProgress } from "../services/unitProgressService";

const useUnitProgress = ({ projectId, unitId, enabled = true } = {}) => {
  const [progress, setProgress] = useState(createEmptyUnitProgress());
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const latestRequestIdRef = useRef(0);

  const loadProgress = useCallback(
    async ({ forceRefresh = false, refresh = false } = {}) => {
      if (!enabled || !projectId || !unitId) {
        setProgress(createEmptyUnitProgress());
        setError("");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError("");

      try {
        const nextProgress = await fetchUnitProgress({
          projectId,
          unitId,
          forceRefresh,
        });

        if (latestRequestIdRef.current !== requestId) {
          return;
        }

        setProgress(nextProgress);
      } catch (nextError) {
        if (latestRequestIdRef.current !== requestId) {
          return;
        }

        console.log("[UnitProgress]", "Unable to load unit progress", {
          message: nextError?.message,
          status: nextError?.status,
          projectId,
          unitId,
        });

        setProgress(createEmptyUnitProgress());
        setError(nextError?.message || "Unable to load progress right now.");
      } finally {
        if (latestRequestIdRef.current === requestId) {
          if (refresh) {
            setIsRefreshing(false);
          } else {
            setIsLoading(false);
          }
        }
      }
    },
    [enabled, projectId, unitId],
  );

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const refreshProgress = useCallback(
    () => loadProgress({ forceRefresh: true, refresh: true }),
    [loadProgress],
  );

  return {
    progress,
    isLoading,
    isRefreshing,
    error,
    refreshProgress,
  };
};

export default useUnitProgress;
