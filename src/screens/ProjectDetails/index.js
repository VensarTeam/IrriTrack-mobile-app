import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PieChart } from "react-native-gifted-charts";
import { Icon, IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import styles from "./styles";
import colors from "../../constants/colors";
import { Icons } from "../../constants/icons";
import useProjectDetailsViewModel from "../../viewmodels/useProjectDetailsViewModel";

const ProjectDetailsScreen = () => {
  const navigation = useNavigation();
  const {
    dataSet,
    expanded,
    selectedStage,
    chartAnimatedStyle,
    toggleSection,
    setSelectedStage,
    buildPieChartData,
    getStageSummary,
    getSectionHighlights,
    kpiCards,
    getModuleTheme,
    handleBack,
    openModuleList,
  } = useProjectDetailsViewModel(navigation);
  const { width } = useWindowDimensions();
  const stagePagerRef = React.useRef(null);
  const chartScrollX = React.useRef(new Animated.Value(0)).current;
  const [chartViewportWidth, setChartViewportWidth] = React.useState(
    width - moderateSectionPadding,
  );

  React.useEffect(() => {
    if (!expanded) return;

    chartScrollX.setValue(0);
    const frameId = requestAnimationFrame(() => {
      stagePagerRef.current?.scrollTo({ x: 0, animated: false });
    });

    return () => cancelAnimationFrame(frameId);
  }, [expanded, chartScrollX]);

  React.useEffect(() => {
    setChartViewportWidth(width - moderateSectionPadding);
  }, [width]);

  const renderPieChart = (stages, stageLabel) => {
    const { data, percent } = buildPieChartData(stages, stageLabel);

    return (
      <View style={styles.pieWrapper}>
        <PieChart
          donut
          radius={78}
          innerRadius={50}
          data={data}
          isAnimated
          animationDuration={700}
        />

        <View style={styles.pieCenter}>
          <Text style={styles.piePercent}>{percent}%</Text>
          <Text style={styles.pieLabel}>Completed</Text>
        </View>
      </View>
    );
  };

  const SummaryItem = ({ label, value, color }) => (
    <View style={[styles.summaryItem, { borderColor: color }]}>
      <View style={[styles.summaryDot, { backgroundColor: color }]} />
      <View style={styles.summaryTextWrap}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );

  const formatStageTabLabel = (label) => {
    if (label === "All") return "All";

    const map = {
      "Inlet Pipe Laying": "Inlet pipe conn.",
      "Outlet Pipe Laying": "Outlet pipe conn.",
      "Mechanical Installation": "Mechanical Accessories Inst.",
      "Controller Installation": "Automation Inst.",
      "Dry Commissioning": "Dry commissioning",
      "Wet Commissioning": "Wet commissioning",
    };

    return map[label] || label;
  };

  const formatSummaryValue = (summary, key) => {
    if (summary.label !== "All") {
      return summary[key];
    }

    if (!summary.total) {
      return "0%";
    }

    return `${Math.round((summary[key] / summary.total) * 100)}%`;
  };

  const getSwipeAnimatedStyles = (index, pagerWidth) => {
    if (!pagerWidth) {
      return {
        cardStyle: null,
        pieStyle: null,
        summaryStyle: null,
      };
    }

    const inputRange = [
      (index - 1) * pagerWidth,
      index * pagerWidth,
      (index + 1) * pagerWidth,
    ];

    return {
      cardStyle: {
        opacity: chartScrollX.interpolate({
          inputRange,
          outputRange: [0.74, 1, 0.74],
          extrapolate: "clamp",
        }),
        transform: [
          {
            scale: chartScrollX.interpolate({
              inputRange,
              outputRange: [0.96, 1, 0.96],
              extrapolate: "clamp",
            }),
          },
        ],
      },
      pieStyle: {
        opacity: chartScrollX.interpolate({
          inputRange,
          outputRange: [0.5, 1, 0.5],
          extrapolate: "clamp",
        }),
        transform: [
          {
            translateX: chartScrollX.interpolate({
              inputRange,
              outputRange: [26, 0, -26],
              extrapolate: "clamp",
            }),
          },
          {
            scale: chartScrollX.interpolate({
              inputRange,
              outputRange: [0.82, 1, 0.82],
              extrapolate: "clamp",
            }),
          },
          {
            rotate: chartScrollX.interpolate({
              inputRange,
              outputRange: ["10deg", "0deg", "-10deg"],
              extrapolate: "clamp",
            }),
          },
        ],
      },
      summaryStyle: {
        opacity: chartScrollX.interpolate({
          inputRange,
          outputRange: [0.42, 1, 0.42],
          extrapolate: "clamp",
        }),
        transform: [
          {
            translateX: chartScrollX.interpolate({
              inputRange,
              outputRange: [20, 0, -20],
              extrapolate: "clamp",
            }),
          },
          {
            translateY: chartScrollX.interpolate({
              inputRange,
              outputRange: [10, 0, 10],
              extrapolate: "clamp",
            }),
          },
        ],
      },
    };
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={handleBack} />
          <View>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Kayampur Sitamau P.M.L.M.I.P</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.kpiContainer}>
            {kpiCards.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: item.bg,
                    borderColor: item.soft,
                  },
                ]}
                onPress={() => openModuleList(item.key)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.kpiAccentBar,
                    { backgroundColor: item.accent },
                  ]}
                />
                <View style={styles.kpiContent}>
                  <View style={styles.kpiHeaderRow}>
                    <Text style={[styles.kpiKey, { color: item.text }]}>
                      {item.key}
                    </Text>
                    <View
                      style={[
                        styles.kpiArrowWrap,
                        { backgroundColor: item.chipBg },
                      ]}
                    >
                      <Icon source="chevron-right" size={14} color={item.accent} />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, { color: item.accent }]}>
                    {item.value}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {Object.keys(dataSet).map((key) => {
            const stages = dataSet[key];
            const moduleTheme = getModuleTheme(key);
            const stageTabs = ["All", ...stages.map((stage) => stage.label)];
            const sectionHighlights = getSectionHighlights(stages);
            const pagerWidth = chartViewportWidth;
            if (!stages.length) return null;

            return (
              <View
                key={key}
                style={[
                  styles.sectionCard,
                  { borderColor: moduleTheme.soft, backgroundColor: moduleTheme.bg },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.sectionHeader,
                    { backgroundColor: colors.white },
                  ]}
                  onPress={() => toggleSection(key)}
                >
                  <View style={styles.sectionTitleWrap}>
                    <View
                      style={[
                        styles.sectionAccent,
                        { backgroundColor: moduleTheme.accent },
                      ]}
                    />
                    <View>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: moduleTheme.text },
                        ]}
                      >
                        {key} Status
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.sectionIconWrap,
                      { backgroundColor: moduleTheme.chipBg },
                    ]}
                  >
                    {expanded === key ? (
                      <Icons.up width={14} height={14} />
                    ) : (
                      <Icons.down width={14} height={14} />
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.highlightGrid}>
                  {sectionHighlights.map((item) => (
                    <View
                      key={item.key}
                      style={[
                        styles.highlightCard,
                        {
                          borderColor: moduleTheme.soft,
                          backgroundColor: colors.white,
                        },
                      ]}
                    >
                      <Text style={styles.highlightLabel}>{item.label}</Text>
                      <View style={styles.highlightValueRow}>
                        <View
                          style={[
                            styles.highlightDot,
                            { backgroundColor: item.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.highlightValue,
                            { color: moduleTheme.text },
                          ]}
                        >
                          {item.value}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {expanded === key && (
                  <>
                    <View
                      style={[
                        styles.stageTabShell,
                        { borderColor: moduleTheme.soft },
                      ]}
                    >
                      <View style={styles.stageTabHeader}>
                        <Text style={[styles.stageTabHeading, { color: moduleTheme.text }]}>
                          Select Tabs
                        </Text>
                        <Text style={styles.stageTabCaption}>Swipe for details</Text>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.stageTabContainer}
                        contentContainerStyle={styles.stageTabContent}
                      >
                        {stageTabs.map((item, index) => (
                          <TouchableOpacity
                            key={item}
                            onPress={() => {
                              setSelectedStage(item);
                              stagePagerRef.current?.scrollTo({
                                x: index * pagerWidth,
                                animated: true,
                              });
                            }}
                            style={[
                              styles.stageTab,
                              selectedStage === item && styles.stageTabActive,
                              {
                                borderColor:
                                  selectedStage === item
                                    ? moduleTheme.accent
                                    : moduleTheme.soft,
                                backgroundColor:
                                  selectedStage === item
                                    ? moduleTheme.accent
                                    : colors.white,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.stageTabText,
                                {
                                  color:
                                    selectedStage === item
                                      ? colors.white
                                      : moduleTheme.text,
                                },
                                selectedStage === item && styles.stageTabTextActive,
                              ]}
                              numberOfLines={2}
                            >
                              {formatStageTabLabel(item)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    <View
                      style={styles.chartCard}
                      onLayout={(event) => {
                        const nextWidth = event.nativeEvent.layout.width;
                        if (
                          nextWidth > 0 &&
                          Math.abs(nextWidth - chartViewportWidth) > 1
                        ) {
                          setChartViewportWidth(nextWidth);
                        }
                      }}
                    >
                      <Animated.View style={chartAnimatedStyle}>
                      <Animated.ScrollView
                        ref={stagePagerRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        decelerationRate="fast"
                        scrollEventThrottle={16}
                        onScroll={Animated.event(
                          [
                            {
                              nativeEvent: {
                                contentOffset: { x: chartScrollX },
                              },
                            },
                          ],
                          { useNativeDriver: true },
                        )}
                        onMomentumScrollEnd={(event) => {
                          const pageIndex = Math.round(
                            event.nativeEvent.contentOffset.x / pagerWidth,
                          );
                          const currentStage = stageTabs[pageIndex] || "All";
                          if (currentStage !== selectedStage) {
                            setSelectedStage(currentStage);
                          }
                        }}
                      >
                        {stageTabs.map((stageLabel, index) => {
                          const summary = getStageSummary(stages, stageLabel);
                          const { cardStyle, pieStyle, summaryStyle } =
                            getSwipeAnimatedStyles(index, pagerWidth);

                          return (
                            <View
                              key={stageLabel}
                              style={[
                                styles.chartSlide,
                                { width: pagerWidth },
                              ]}
                            >
                              <Animated.View
                                style={[
                                  styles.chartSummaryCard,
                                  { borderColor: moduleTheme.soft },
                                  cardStyle,
                                ]}
                              >
                                <View style={styles.chartSummaryHeader}>
                                  <Text style={styles.chartSummaryTitle}>
                                    {formatStageTabLabel(summary.label)}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.chartSummaryPercent,
                                      { color: moduleTheme.accent },
                                    ]}
                                  >
                                    {summary.percent}% Complete
                                  </Text>
                                </View>

                                <View style={styles.chartSummaryBody}>
                                  <Animated.View style={pieStyle}>
                                    {renderPieChart(stages, stageLabel)}
                                  </Animated.View>

                                  <Animated.View
                                    style={[styles.summaryList, summaryStyle]}
                                  >
                                    <SummaryItem
                                      label="Completed"
                                      value={formatSummaryValue(summary, "completed")}
                                      color={colors.completed}
                                    />
                                    <SummaryItem
                                      label="Pending"
                                      value={formatSummaryValue(summary, "pending")}
                                      color={colors.pending}
                                    />
                                    <SummaryItem
                                      label="Partial"
                                      value={formatSummaryValue(summary, "partial")}
                                      color={colors.partial}
                                    />
                                  </Animated.View>
                                </View>
                              </Animated.View>
                            </View>
                          );
                        })}
                      </Animated.ScrollView>
                      </Animated.View>
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ProjectDetailsScreen;

const moderateSectionPadding = 58;
