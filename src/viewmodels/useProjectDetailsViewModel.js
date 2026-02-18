import { useEffect, useRef, useState } from "react";
import { Animated, Easing, LayoutAnimation } from "react-native";
import { ROUTES } from "../navigation/routes";
import colors from "../constants/colors";
import { getProjectStatusDataSet } from "../repositories/projectStatusRepository";

const useProjectDetailsViewModel = (navigation) => {
  const [expanded, setExpanded] = useState(null);
  const [chartType, setChartType] = useState("bar");
  const [selectedStage, setSelectedStage] = useState("All");
  const chartAnim = useRef(new Animated.Value(0)).current;

  const dataSet = getProjectStatusDataSet();

  useEffect(() => {
    if (!expanded) return;

    chartAnim.setValue(0);
    Animated.timing(chartAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, chartType, selectedStage, chartAnim]);

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
    setExpanded(expanded === key ? null : key);
  };

  const buildBarChartData = (stages) => {
    const barData = [];

    stages.forEach((stage) => {
      barData.push({
        value: stage.completed,
        frontColor: colors.completed,
        spacing: 4,
      });

      barData.push({
        value: stage.pending,
        frontColor: colors.pending,
        label: stage.label.split(" ")[0],
        spacing: 4,
      });

      barData.push({
        value: stage.partial,
        frontColor: colors.partial,
        spacing: 25,
      });
    });

    return barData;
  };

  const buildPieChartData = (stages) => {
    let data;

    if (selectedStage === "All") {
      const totalCompleted = stages.reduce((s, i) => s + i.completed, 0);
      const totalPending = stages.reduce((s, i) => s + i.pending, 0);
      const totalPartial = stages.reduce((s, i) => s + i.partial, 0);

      data = [
        { value: totalCompleted, color: colors.completed },
        { value: totalPending, color: colors.pending },
        { value: totalPartial, color: colors.partial },
      ];
    } else {
      const stage = stages.find((s) => s.label === selectedStage);

      data = stage
        ? [
            { value: stage.completed, color: colors.completed },
            { value: stage.pending, color: colors.pending },
            { value: stage.partial, color: colors.partial },
          ]
        : [
            { value: 0, color: colors.completed },
            { value: 0, color: colors.pending },
            { value: 0, color: colors.partial },
          ];
    }

    const total = data.reduce((s, i) => s + i.value, 0);
    const percent = total ? Math.round((data[0].value / total) * 100) : 0;

    return { data, percent };
  };

  const getStagePercent = (stage) => {
    const total = stage.completed + stage.pending + stage.partial;
    return total ? Math.round((stage.completed / total) * 100) : 0;
  };

  const kpiCards = [
    {
      key: "OMS",
      bg: colors.surfaceBlue,
      accent: colors.primaryBlue,
      value: 3842,
    },
    {
      key: "RMS",
      bg: colors.surfaceGreenSoft,
      accent: colors.primaryGreen,
      value: 399,
    },
    {
      key: "GW",
      bg: colors.surfaceOrangeSoft,
      accent: colors.primaryOrange,
      value: 45,
    },
  ];

  const handleBack = () => navigation.goBack();

  const openModuleList = (module) => {
    navigation.navigate(ROUTES.ROOT.UNIT_LIST_SCREEN, { module: module || "OMS" });
  };

  return {
    dataSet,
    expanded,
    chartType,
    selectedStage,
    chartAnimatedStyle,
    toggleSection,
    setChartType,
    setSelectedStage,
    buildBarChartData,
    buildPieChartData,
    getStagePercent,
    kpiCards,
    handleBack,
    openModuleList,
  };
};

export default useProjectDetailsViewModel;
