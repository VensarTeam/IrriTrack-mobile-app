import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutAnimation } from "react-native";
import { ROUTES } from "../navigation/routes";
import colors from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import useProjectLocationFilters from "../hooks/useProjectLocationFilters";
import {
  createEmptyProjectDetails,
} from "../models/projectDetails";
import { fetchProjectDetails } from "../services/projectDetailsService";
import {
  getCachedOmsBasicUnitsCount,
  syncOmsBasicUnitsForProjectInBackground,
} from "../services/omsOfflineStore";
import { showAppAlert } from "../services/alertService";

const moduleThemes = colors.projectModules;

const getProjectHeaderTitle = (projectDetails, fallbackProject, routeProjectName) =>
  routeProjectName ||
  projectDetails?.shortName ||
  fallbackProject?.shortName ||
  projectDetails?.name ||
  fallbackProject?.name ||
  "Project Details";

const normalizeStageLabel = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");

const getStageCompletedCount = (stages = [], labels = []) => {
  const normalizedLabels = labels.map((label) => normalizeStageLabel(label));
  const matchedStage = stages.find((stage) =>
    normalizedLabels.includes(normalizeStageLabel(stage?.label))
  );

  return Number(matchedStage?.completed || 0);
};

const useProjectDetailsViewModel = (navigation, route) => {
  const { user, roleAccess } = useAuth();
  const project = route?.params?.project || null;
  const projectId = project?.id || project?.projectId || user?.projectId || "";
  const fallbackProjectDetails = useMemo(
    () => createEmptyProjectDetails(project),
    [project],
  );

  const [expanded, setExpanded] = useState(null);
  const [selectedStage, setSelectedStage] = useState("All");
  const [zone, setZone] = useState("All");
  const [village, setVillage] = useState("All");
  const [filterType, setFilterType] = useState(null);
  const [locationFilterSearchQuery, setLocationFilterSearchQuery] = useState("");
  const [projectDetails, setProjectDetails] = useState(fallbackProjectDetails);
  const [isProjectDetailsLoading, setIsProjectDetailsLoading] = useState(false);
  const [projectDetailsError, setProjectDetailsError] = useState("");
  const [cachedOmsUnitsCount, setCachedOmsUnitsCount] = useState(0);
  const chartAnim = useRef(new Animated.Value(0)).current;
  const latestRequestIdRef = useRef(0);

  const {
    isOnline,
    canUseLocationFilters,
    isFilterOptionsLoading,
    isFetchingMoreFilterOptions,
    hasMoreFilterOptions,
    prepareFilterOptions,
    loadMoreFilterOptions,
    zones,
    villages,
    villageOptions,
    filterTotalItems,
    zoneTotalOms,
    villageTotalOms,
  } = useProjectLocationFilters({
    projectId,
    zoneName: zone,
    villageName: village,
    activeFilterType: filterType,
    searchQuery: locationFilterSearchQuery,
  });

  const selectedVillageId = useMemo(
    () =>
      villageOptions.find((item) => item.name === village)?.id || "",
    [village, villageOptions],
  );

  useEffect(() => {
    setProjectDetails(fallbackProjectDetails);
  }, [fallbackProjectDetails]);

  useEffect(() => {
    let isMounted = true;

    const loadCachedOmsCount = async () => {
      if (!projectId) {
        if (isMounted) {
          setCachedOmsUnitsCount(0);
        }
        return;
      }

      try {
        const count = await getCachedOmsBasicUnitsCount(projectId);

        if (isMounted) {
          setCachedOmsUnitsCount(count);
        }
      } catch (error) {
        if (isMounted) {
          setCachedOmsUnitsCount(0);
        }
      }
    };

    void loadCachedOmsCount();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!expanded) return;

    chartAnim.setValue(0);
    Animated.timing(chartAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, chartAnim]);

  useEffect(() => {
    if (!projectId || !isOnline) {
      return;
    }

    void syncOmsBasicUnitsForProjectInBackground(projectId).then(() => {
      void getCachedOmsBasicUnitsCount(projectId)
        .then((count) => {
          setCachedOmsUnitsCount(count);
        })
        .catch(() => {});
    });
  }, [isOnline, projectId]);

  useEffect(() => {
    if (!canUseLocationFilters) {
      setZone("All");
      setVillage("All");
    }
  }, [canUseLocationFilters]);

  useEffect(() => {
    if (!projectId) {
      setProjectDetails(fallbackProjectDetails);
      setProjectDetailsError("");
      setIsProjectDetailsLoading(false);
      return;
    }

    if (!isOnline) {
      setProjectDetails(fallbackProjectDetails);
      setProjectDetailsError("");
      setIsProjectDetailsLoading(false);
      return;
    }

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    const loadProjectDetails = async () => {
      setIsProjectDetailsLoading(true);
      setProjectDetailsError("");

      try {
        const nextProjectDetails = await fetchProjectDetails({
          projectId,
          zoneName: zone,
          villageId: selectedVillageId,
        });

        // Ignore stale responses when the user changes filters quickly.
        if (latestRequestIdRef.current !== requestId) {
          return;
        }

        setProjectDetails(nextProjectDetails);
      } catch (error) {
        if (latestRequestIdRef.current !== requestId) {
          return;
        }

        console.log("[ProjectDetails]", "Unable to load project details", {
          message: error?.message,
          status: error?.status,
          projectId,
          zone,
          villageId: selectedVillageId,
        });
        setProjectDetailsError(
          error?.message || "Unable to load project details right now.",
        );
      } finally {
        if (latestRequestIdRef.current === requestId) {
          setIsProjectDetailsLoading(false);
        }
      }
    };

    void loadProjectDetails();
  }, [fallbackProjectDetails, isOnline, projectId, selectedVillageId, zone]);

  const chartAnimatedStyle = {
    opacity: chartAnim,
    transform: [
      {
        translateY: chartAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: chartAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const toggleSection = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedStage("All");
    setExpanded(key);
  };

  const applyLocationFilter = (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (filterType === "zone") {
      setZone(item);
      setVillage("All");
    }

    if (filterType === "village") {
      setVillage(item);
    }

    setSelectedStage("All");
    closeLocationFilter();
  };

  const openLocationFilter = (nextFilterType) => {
    setLocationFilterSearchQuery("");
    prepareFilterOptions(nextFilterType);
    setFilterType(nextFilterType);
  };

  const closeLocationFilter = () => {
    setLocationFilterSearchQuery("");
    setFilterType(null);
  };

  const clearLocationFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setZone("All");
    setVillage("All");
    setSelectedStage("All");
    setLocationFilterSearchQuery("");
  };

  const getActiveLocationFilterValue = () => {
    if (filterType === "zone") return zone;
    if (filterType === "village") return village;
    return "";
  };

  const hasActiveLocationFilters =
    canUseLocationFilters && (zone !== "All" || village !== "All");

  const locationFilterOptions =
    !canUseLocationFilters
      ? []
      : filterType === "zone"
        ? ["All", ...zones]
        : ["All", ...villages];

  const locationSummary =
    !canUseLocationFilters
      ? "Filters available online only"
      : zone !== "All" && village !== "All"
        ? `${zone} / ${village}`
        : village !== "All"
          ? `${village} overview`
        : zone !== "All"
          ? `${zone} overview`
          : "All zones overview";

  const dataSet = projectDetails?.modules || fallbackProjectDetails.modules;

  useEffect(() => {
    const firstExpandedKey = Object.keys(dataSet || {}).find(
      (key) => (dataSet?.[key]?.stages || []).length > 0
    );

    if (!firstExpandedKey) {
      return;
    }

    setExpanded((prev) => prev || firstExpandedKey);
  }, [dataSet]);

  const getStageSummary = (stages = [], stageLabel = selectedStage) => {
    if (stageLabel === "All") {
      const completed = stages.reduce((sum, item) => sum + item.completed, 0);
      const pending = stages.reduce((sum, item) => sum + item.pending, 0);
      const partial = stages.reduce((sum, item) => sum + item.partial, 0);
      const total = completed + pending + partial;

      return {
        label: "All",
        completed,
        pending,
        partial,
        total,
        percent: total ? Math.round((completed / total) * 100) : 0,
      };
    }

    const stage = stages.find((item) => item.label === stageLabel);

    if (!stage) {
      return {
        label: stageLabel,
        completed: 0,
        pending: 0,
        partial: 0,
        total: 0,
        percent: 0,
      };
    }

    const total = stage.completed + stage.pending + stage.partial;

    return {
      label: stage.label,
      completed: stage.completed,
      pending: stage.pending,
      partial: stage.partial,
      total,
      percent: total ? Math.round((stage.completed / total) * 100) : 0,
    };
  };

  const buildPieChartData = (stages, stageLabel = selectedStage) => {
    const summary = getStageSummary(stages, stageLabel);
    const data = [
      { value: summary.completed, color: colors.completed },
      { value: summary.pending, color: colors.pending },
      { value: summary.partial, color: colors.partial },
    ];

    return { data, percent: summary.percent };
  };

  const getSectionHighlights = (moduleData = {}) => {
    const stages = Array.isArray(moduleData?.stages) ? moduleData.stages : [];

    return [
      {
        key: "installation",
        label: "Installation",
        value: getStageCompletedCount(stages, [
          "Pedestal and Enclosure Installation",
          "Padestal and Inclosure Inst.",
        ]),
        color: colors.completed,
      },
      {
        key: "mechanical",
        label: "Mechanical",
        value: getStageCompletedCount(stages, [
          "Mechanical Accessories Installation",
          "Mechanical Accessories Inst.",
        ]),
        color: colors.pending,
      },
      {
        key: "flushing",
        label: "Flushing",
        value: getStageCompletedCount(stages, [
          "Flushing",
          "Pipe flushing",
        ]),
        color: colors.primaryBlue,
      },
      {
        key: "automation",
        label: "Automation",
        value: getStageCompletedCount(stages, [
          "Automation Installation",
          "Automation Inst.",
          "Controller Installation",
        ]),
        color: colors.partial,
      },
      {
        key: "commissioning",
        label: "Commissioning",
        value: getStageCompletedCount(stages, [
          "Wet Commissioning",
          "Wet commissioning",
        ]),
        color: colors.completed,
      },
    ];
  };

  const kpiCards = ["OMS", "RMS", "GW"].map((moduleKey) => {
    const apiTotalUnits = dataSet[moduleKey]?.totalUnits || 0;
    const totalUnits =
      moduleKey === "OMS" && !hasActiveLocationFilters
        ? Math.max(apiTotalUnits, cachedOmsUnitsCount)
        : apiTotalUnits;

    return {
      key: moduleKey,
      value: totalUnits,
      ...moduleThemes[moduleKey],
    };
  });

  const getModuleTheme = (module) => moduleThemes[module] || moduleThemes.OMS;
  const canOpenModuleList = (module) =>
    !roleAccess.isContributor || String(module || "").toUpperCase() === "OMS";

  const handleBack = () => navigation.goBack();

  const openModuleList = (module) => {
    if (!canOpenModuleList(module)) {
      return;
    }

    if (!isOnline && module !== "OMS") {
      showAppAlert({
        title: `Module is under development`,
        message: `The ${module} is coming soon. Meanwhile, you can view the list of OMS units.`,
      });
      return;
    }

    if (module === "OMS") {
      if (isOnline && projectId) {
        void syncOmsBasicUnitsForProjectInBackground(projectId);
      }

      navigation.navigate(ROUTES.ROOT.UNIT_LIST_SCREEN, {
        module: module || "OMS",
        project,
        projectName: route?.params?.projectName || project?.name,
      });
    } else {
      showAppAlert({
        title: "Module is under development",
        message: `The ${module} is coming soon. Meanwhile, you can view the list of OMS units.`,
      });
    }
  };

  const openStageStatusBoard = ({ moduleKey = "OMS", stageLabel = "All" } = {}) => {
    const normalizedModuleKey = String(moduleKey || "").trim().toUpperCase();
    if (normalizedModuleKey !== "OMS") {
      showAppAlert({
        title: "Work status is under development",
        message: `Dedicated ${normalizedModuleKey} work status tabs will be available soon.`,
      });
      return;
    }

    navigation.navigate(ROUTES.ROOT.WORK_STATUS, {
      module: normalizedModuleKey,
      project,
      projectName: route?.params?.projectName || project?.name,
      stageLabel: stageLabel || "All",
      zoneName: zone,
      villageName: village,
      villageId: selectedVillageId,
    });
  };

  return {
    isOnline,
    canViewProjectInsights: roleAccess.canViewProjectInsights,
    canUseLocationFilters:
      canUseLocationFilters && roleAccess.canViewProjectInsights,
    dataSet,
    expanded,
    selectedStage,
    zone,
    village,
    zones,
    villages,
    filterTotalItems,
    zoneTotalOms,
    villageTotalOms,
    filterType,
    isFilterOptionsLoading,
    isFetchingMoreFilterOptions,
    hasMoreFilterOptions,
    locationFilterSearchQuery,
    locationFilterOptions,
    hasActiveLocationFilters,
    locationSummary,
    chartAnimatedStyle,
    isProjectDetailsLoading,
    projectDetailsError,
    projectHeaderTitle: getProjectHeaderTitle(
      projectDetails,
      project,
      route?.params?.projectName,
    ),
    projectHeaderSubtitle: projectDetails?.name || project?.name || "",
    toggleSection,
    setSelectedStage,
    openLocationFilter,
    closeLocationFilter,
    setLocationFilterSearchQuery,
    loadMoreFilterOptions,
    applyLocationFilter,
    clearLocationFilters,
    getActiveLocationFilterValue,
    buildPieChartData,
    getStageSummary,
    getSectionHighlights,
    kpiCards,
    canOpenModuleList,
    getModuleTheme,
    handleBack,
    openModuleList,
    openStageStatusBoard,
  };
};

export default useProjectDetailsViewModel;
