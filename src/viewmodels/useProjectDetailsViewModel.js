import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutAnimation } from "react-native";
import { ROUTES } from "../navigation/routes";
import colors from "../constants/colors";
import {
  getProjectStatusDataSet,
  getProjectFilterOptions,
} from "../repositories/projectStatusRepository";

const moduleThemes = {
  OMS: {
    accent: "#255B8E",
    text: "#173B5C",
    bg: "#EEF5FC",
    soft: "#D7E6F4",
    chipBg: "#E4EFFA",
  },
  RMS: {
    accent: "#8A5A34",
    text: "#6A4125",
    bg: "#FCF4ED",
    soft: "#EFDCCB",
    chipBg: "#F7EADF",
  },
  GW: {
    accent: "#5C5AA5",
    text: "#41407A",
    bg: "#F3F2FD",
    soft: "#DEDCF8",
    chipBg: "#ECEAFE",
  },
};

const useProjectDetailsViewModel = (navigation) => {
  const [expanded, setExpanded] = useState(null);
  const [selectedStage, setSelectedStage] = useState("All");
  const [zone, setZone] = useState("All");
  const [village, setVillage] = useState("All");
  const [filterType, setFilterType] = useState(null);
  const chartAnim = useRef(new Animated.Value(0)).current;

  const { zones, villagesByZone } = useMemo(() => getProjectFilterOptions(), []);
  const villages = useMemo(
    () => (zone === "All" ? [] : villagesByZone[zone] || []),
    [zone, villagesByZone],
  );
  const dataSet = useMemo(
    () => getProjectStatusDataSet({ zone, village }),
    [zone, village],
  );

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
    setExpanded(expanded === key ? null : key);
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
    setFilterType(null);
  };

  const clearLocationFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setZone("All");
    setVillage("All");
    setSelectedStage("All");
  };

  const getActiveLocationFilterValue = () => {
    if (filterType === "zone") return zone;
    if (filterType === "village") return village;
    return "";
  };

  const getModuleTotal = (stages = []) => {
    const firstStage = stages[0];

    if (!firstStage) return 0;

    return firstStage.completed + firstStage.pending + firstStage.partial;
  };

  const hasActiveLocationFilters = zone !== "All" || village !== "All";

  const locationFilterOptions =
    filterType === "zone"
      ? ["All", ...zones]
      : zone === "All"
        ? ["All"]
        : ["All", ...villages];

  const locationSummary =
    village !== "All"
      ? `${zone} / ${village}`
      : zone !== "All"
        ? `${zone} overview`
        : "All zones overview";

  const getStageSummary = (stages, stageLabel = selectedStage) => {
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

  const getSectionHighlights = (stages) => {
    const totalUnits = stages[0]
      ? stages[0].completed + stages[0].pending + stages[0].partial
      : 0;
    const installedStage =
      stages.find((item) => item.label === "Automation Inst.") || stages[0];
    const commissionedStage =
      stages.find((item) => item.label === "Wet commissioning") ||
      stages[stages.length - 1];

    const installed = installedStage?.completed || 0;
    const installationBalance = Math.max(totalUnits - installed, 0);
    const commissioned = commissionedStage?.completed || 0;
    const commissioningBalance = Math.max(totalUnits - commissioned, 0);

    return [
      { key: "installed", label: "Installed", value: installed, color: colors.completed },
      {
        key: "installation-balance",
        label: "Installation Balance",
        value: installationBalance,
        color: colors.pending,
      },
      {
        key: "commissioned",
        label: "Commissioned",
        value: commissioned,
        color: colors.completed,
      },
      {
        key: "commissioning-balance",
        label: "Commissioning Balance",
        value: commissioningBalance,
        color: colors.pending,
      },
    ];
  };

  const kpiCards = [
    {
      key: "OMS",
      value: getModuleTotal(dataSet.OMS),
      ...moduleThemes.OMS,
    },
    {
      key: "RMS",
      value: getModuleTotal(dataSet.RMS),
      ...moduleThemes.RMS,
    },
    {
      key: "GW",
      value: getModuleTotal(dataSet.GW),
      ...moduleThemes.GW,
    },
  ];

  const getModuleTheme = (module) => moduleThemes[module] || moduleThemes.OMS;

  const handleBack = () => navigation.goBack();

  const openModuleList = (module) => {
    navigation.navigate(ROUTES.ROOT.UNIT_LIST_SCREEN, { module: module || "OMS" });
  };

  return {
    dataSet,
    expanded,
    selectedStage,
    zone,
    village,
    zones,
    villages,
    filterType,
    locationFilterOptions,
    hasActiveLocationFilters,
    locationSummary,
    chartAnimatedStyle,
    toggleSection,
    setSelectedStage,
    setFilterType,
    applyLocationFilter,
    clearLocationFilters,
    getActiveLocationFilterValue,
    buildPieChartData,
    getStageSummary,
    getSectionHighlights,
    kpiCards,
    getModuleTheme,
    handleBack,
    openModuleList,
  };
};

export default useProjectDetailsViewModel;
