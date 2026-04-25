import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ROUTES } from "../navigation/routes";
import { useAuth } from "../context/AuthContext";
import {
  getUnitProgressSummary,
} from "../models/unitProgress";
import { showAppAlert } from "../services/alertService";
import useUnitProgress from "../hooks/useUnitProgress";

const toDisplayText = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const preferredValue =
      value.name ||
      value.label ||
      value.title ||
      value.unitNo ||
      value.nodeName ||
      value.code ||
      value.id;

    if (preferredValue === null || preferredValue === undefined) {
      return fallback;
    }

    return String(preferredValue);
  }

  return fallback;
};

const useUnitDetailsViewModel = (navigation, route) => {
  const { user } = useAuth();
  const module = route?.params?.module || "OMS";
  const unit = route?.params?.unit || {};
  const unitLabel = toDisplayText(unit.unitNo, `${module}-001`);
  const projectName =
    toDisplayText(
      route?.params?.projectName || route?.params?.project?.name,
      "IrriTrack"
    );
  const projectId =
    route?.params?.projectId ||
    route?.params?.project?.id ||
    route?.params?.project?.projectId ||
    user?.projectId ||
    "";
  const unitId = unit?.id || route?.params?.unitId || "";
  const { progress, isLoading, isRefreshing, error, refreshProgress } = useUnitProgress({
    projectId,
    unitId,
    enabled: Boolean(projectId && unitId),
  });
  const [expandedProcesses, setExpandedProcesses] = useState({});

  useEffect(() => {
    const firstProcessId = progress.processes[0]?.id;

    if (!firstProcessId) {
      setExpandedProcesses({});
      return;
    }

    setExpandedProcesses((currentValue) =>
      progress.processes.some((process) => currentValue[process.id])
        ? currentValue
        : { [firstProcessId]: true },
    );
  }, [progress.processes]);

  useFocusEffect(
    useCallback(() => {
      if (!projectId || !unitId) {
        return undefined;
      }

      void refreshProgress();
      return undefined;
    }, [projectId, refreshProgress, unitId]),
  );

  const detailItems = useMemo(
    () =>
      [
        { label: "Unit Number", value: unitLabel },
        { label: "Village", value: toDisplayText(unit.village) },
        {
          label: "Chak Area",
          value: toDisplayText(unit.area || unit.chakArea),
        },
        {
          label: "Sub Chak Qty",
          value: toDisplayText(unit.subChakQuantity),
        },
      ].filter((item) => item.value.trim()),
    [unit, unitLabel],
  );

  const summary = useMemo(() => getUnitProgressSummary(progress), [progress]);

  const openHelper = () => {
    showAppAlert({
      type: "info",
      title: "Progress Status",
      message:
        "This screen shows read-only process, subprocess, and checklist progress from the latest API data.",
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleProcess = (processId) => {
    setExpandedProcesses((currentValue) => ({
      ...currentValue,
      [processId]: !currentValue[processId],
    }));
  };

  const isProcessExpanded = (processId) => Boolean(expandedProcesses[processId]);

  const openViewAll = () => {
    navigation.navigate(ROUTES.ROOT.UNIT_STATUS_OVERVIEW, {
      module,
      unit,
      unitId,
      projectId,
      projectName,
    });
  };

  const openSubprocessDetails = (process, subprocess) => {
    navigation.navigate(ROUTES.ROOT.UNIT_STATUS_OVERVIEW, {
      module,
      unit,
      unitId,
      projectId,
      projectName,
      initialProcessId: process.id,
      initialSubprocessId: subprocess.id,
    });
  };

  return {
    module,
    unit,
    unitLabel,
    projectId,
    unitId,
    projectName,
    detailItems,
    processes: progress.processes,
    summary,
    isLoading,
    isRefreshing,
    error,
    refreshProgress,
    openHelper,
    handleBack,
    openViewAll,
    toggleProcess,
    isProcessExpanded,
    openSubprocessDetails,
  };
};

export default useUnitDetailsViewModel;
