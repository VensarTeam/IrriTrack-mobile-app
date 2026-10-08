import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPipeDashboardStatus } from "../services/pipeNetworkApi";
import { getPipeCache, savePipeCache } from "../services/pipeNetworkOfflineStore";
import colors from "../constants/colors";

const MATERIAL_META = {
  MS: { key: "ms", label: "MS", name: "Mild steel", color: colors.pipeMaterial.MS.accent, textColor: colors.pipeMaterial.MS.text, surface: colors.pipeMaterial.MS.surface },
  DI: { key: "di", label: "DI", name: "Ductile iron", color: colors.pipeMaterial.DI.accent, textColor: colors.pipeMaterial.DI.text, surface: colors.pipeMaterial.DI.surface },
  HDPE: { key: "hdpe", label: "HDPE", name: "Polyethylene", color: colors.pipeMaterial.HDPE.accent, textColor: colors.pipeMaterial.HDPE.text, surface: colors.pipeMaterial.HDPE.surface },
};

const toPipeData = (status) => {
  const entries = status?.summary?.byMaterial || [];
  return ["MS", "DI", "HDPE"].map((material) => {
    const source = entries.find((entry) => String(entry.material).toUpperCase() === material) || {};
    const stageMap = new Map((source.stages || []).map((stage) => [stage.workType, Number(stage.completedLengthM || 0)]));
    return {
      ...MATERIAL_META[material],
      planned: Number(source.totalLengthM || 0),
      laid: Number(source.laidLengthM || 0),
      stages: {
        excavation: stageMap.get("excavation") || 0,
        pipeLaying: stageMap.get("pipe_laying") || 0,
        backfilling: stageMap.get("backfilling") || 0,
      },
    };
  });
};

export default function usePipeDashboardViewModel({ enabled, projectId, ownerUserId }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isCached, setIsCached] = useState(false);
  const controllerRef = useRef(null);

  const load = useCallback(async ({ refresh = false } = {}) => {
    if (!enabled || !projectId || !ownerUserId) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setError("");
    refresh ? setRefreshing(true) : setLoading(true);

    if (!refresh) {
      const cached = await getPipeCache({ ownerUserId, projectId, resource: "dashboard" });
      if (cached?.payload && !controller.signal.aborted) {
        setStatus(cached.payload);
        setIsCached(true);
        setLoading(false);
      }
    }

    try {
      const response = await fetchPipeDashboardStatus({ projectId, signal: controller.signal });
      if (controller.signal.aborted) return;
      setStatus(response);
      setIsCached(false);
      await savePipeCache({ ownerUserId, projectId, resource: "dashboard", payload: response });
    } catch (loadError) {
      if (!controller.signal.aborted) setError(loadError?.message || "Could not refresh Pipe Network dashboard.");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [enabled, ownerUserId, projectId]);

  useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  return { pipeData: toPipeData(status), status, loading, refreshing, error, isCached, refresh: () => load({ refresh: true }) };
}
