import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { PieChart } from "react-native-gifted-charts";
import { Icon, IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import SearchableFilterModal from "../../components/SearchableFilterModal";
import styles from "./styles";
import colors from "../../constants/colors";
import { Icons } from "../../constants/icons";
import { moderateScale, verticalScale } from "../../constants/metrics";
import useProjectDetailsViewModel from "../../viewmodels/useProjectDetailsViewModel";

const CHART_SECTION_PADDING = 58;
const PIE_RADIUS = 72;
const PIE_INNER_RADIUS = 46;
const PIE_ANIMATION_DURATION = 700;
const FILTER_ICON_SIZE = 14;
const FILTER_ARROW_SIZE = 15;
const HEADER_ICON_SIZE = 24;
const KPI_ARROW_ICON_SIZE = 14;
const SECTION_ARROW_ICON_SIZE = 14;
const CHART_COMPACT_WIDTH = 360;
const COMPACT_PIE_RADIUS = 50;
const COMPACT_PIE_INNER_RADIUS = 31;
const SHIMMER_DURATION = 1300;

const ProjectDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const {
    isOnline,
    canViewProjectInsights,
    canUseLocationFilters,
    dataSet,
    expanded,
    selectedStage,
    zone,
    village,
    zoneTotalItems,
    villageTotalItems,
    filterType,
    isFilterOptionsLoading,
    isFetchingMoreFilterOptions,
    hasMoreFilterOptions,
    filterTotalItems,
    locationFilterSearchQuery,
    locationFilterOptions,
    hasActiveLocationFilters,
    locationSummary,
    chartAnimatedStyle,
    isProjectDetailsLoading,
    projectDetailsError,
    projectHeaderTitle,
    projectHeaderSubtitle,
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
  } = useProjectDetailsViewModel(navigation, route);
  const { width } = useWindowDimensions();
  const stagePagerRef = React.useRef(null);
  const chartScrollX = React.useRef(new Animated.Value(0)).current;
  const chartSectionPadding = moderateScale(CHART_SECTION_PADDING);
  const pieRadius = moderateScale(PIE_RADIUS);
  const pieInnerRadius = moderateScale(PIE_INNER_RADIUS);
  const compactPieRadius = moderateScale(COMPACT_PIE_RADIUS);
  const compactPieInnerRadius = moderateScale(COMPACT_PIE_INNER_RADIUS);
  const filterIconSize = moderateScale(FILTER_ICON_SIZE);
  const filterArrowSize = moderateScale(FILTER_ARROW_SIZE);
  const headerIconSize = moderateScale(HEADER_ICON_SIZE);
  const kpiArrowIconSize = moderateScale(KPI_ARROW_ICON_SIZE);
  const sectionArrowIconSize = moderateScale(SECTION_ARROW_ICON_SIZE);
  const defaultChartViewportWidth = Math.max(width - chartSectionPadding, 0);
  const [chartViewportWidth, setChartViewportWidth] = React.useState(
    defaultChartViewportWidth,
  );
  const shimmerTranslateX = React.useRef(new Animated.Value(0)).current;
  const shimmerTravelDistance = width + moderateScale(180);

  React.useEffect(() => {
    if (!expanded) return;

    chartScrollX.setValue(0);
    const frameId = requestAnimationFrame(() => {
      stagePagerRef.current?.scrollTo({ x: 0, animated: false });
    });

    return () => cancelAnimationFrame(frameId);
  }, [expanded, chartScrollX]);

  React.useEffect(() => {
    setChartViewportWidth(defaultChartViewportWidth);
  }, [defaultChartViewportWidth]);

  React.useEffect(() => {
    if (selectedStage !== "All") return;

    const frameId = requestAnimationFrame(() => {
      stagePagerRef.current?.scrollTo({ x: 0, animated: true });
    });

    return () => cancelAnimationFrame(frameId);
  }, [selectedStage]);

  React.useEffect(() => {
    shimmerTranslateX.setValue(0);

    // Keep the shimmer lightweight and continuous across all skeleton blocks.
    const animation = Animated.loop(
      Animated.timing(shimmerTranslateX, {
        toValue: shimmerTravelDistance,
        duration: SHIMMER_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmerTravelDistance, shimmerTranslateX]);

  const ShimmerBlock = ({ style }) => (
    <View style={[styles.shimmerBlock, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmerSweep,
          {
            transform: [{ translateX: shimmerTranslateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.78)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );

  const ProjectDetailsSkeleton = () => (
    <>
      {canUseLocationFilters ? (
        <View style={styles.filterPanel}>
          <View style={styles.filterPanelHeader}>
            <View style={styles.filterPanelTitleWrap}>
              <ShimmerBlock style={styles.skeletonMetaLabel} />
              <ShimmerBlock style={styles.skeletonMetaValue} />
            </View>
            <ShimmerBlock style={styles.skeletonResetButton} />
          </View>

          <View style={styles.filterGrid}>
            <ShimmerBlock style={styles.skeletonFilterField} />
            <ShimmerBlock style={styles.skeletonFilterField} />
          </View>
        </View>
      ) : null}

      <View style={styles.kpiContainer}>
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.skeletonKpiCard}>
            <ShimmerBlock style={styles.skeletonKpiAccent} />
            <ShimmerBlock style={styles.skeletonKpiLabel} />
            <ShimmerBlock style={styles.skeletonKpiValue} />
          </View>
        ))}
      </View>

      {[1, 2].map((item) => (
        <View key={item} style={styles.skeletonSectionCard}>
          <View style={styles.skeletonSectionHeader}>
            <View style={styles.skeletonSectionTitleWrap}>
              <ShimmerBlock style={styles.skeletonSectionAccent} />
              <View style={styles.skeletonSectionTextWrap}>
                <ShimmerBlock style={styles.skeletonSectionTitle} />
                <ShimmerBlock style={styles.skeletonSectionSubtitle} />
              </View>
            </View>
            <ShimmerBlock style={styles.skeletonSectionIcon} />
          </View>

          <View style={styles.highlightGrid}>
            {[1, 2, 3, 4].map((highlightItem) => (
              <View key={highlightItem} style={styles.skeletonHighlightCard}>
                <ShimmerBlock style={styles.skeletonHighlightLabel} />
                <ShimmerBlock style={styles.skeletonHighlightValue} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );

  const renderPieChart = (stages, stageLabel, compact = false) => {
    const { data, percent } = buildPieChartData(stages, stageLabel);

    return (
      <View style={[styles.pieWrapper, compact && styles.pieWrapperCompact]}>
        <PieChart
          donut
          radius={compact ? compactPieRadius : pieRadius}
          innerRadius={compact ? compactPieInnerRadius : pieInnerRadius}
          data={data}
          isAnimated
          animationDuration={PIE_ANIMATION_DURATION}
        />

        <View style={styles.pieCenter}>
          <Text style={styles.piePercent}>{percent}%</Text>
          <Text style={styles.pieLabel}>Completed</Text>
        </View>
      </View>
    );
  };

  const SummaryItem = ({ label, value, color, compact }) => (
    <View
      style={[
        styles.summaryItem,
        compact && styles.summaryItemCompact,
        { borderColor: color },
      ]}
    >
      <View style={[styles.summaryDot, { backgroundColor: color }]} />
      <View style={styles.summaryTextWrap}>
        <Text
          style={[styles.summaryLabel, compact && styles.summaryLabelCompact]}
        >
          {label}
        </Text>
        <Text
          style={[styles.summaryValue, compact && styles.summaryValueCompact]}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  const FilterField = ({
    title,
    value,
    totalCount = 0,
    icon: FilterIcon,
    active,
    disabled,
    onPress,
  }) => {
    const displayValue = Number.isFinite(totalCount)
      ? `${value} (${totalCount})`
      : value;

    return (
      <TouchableOpacity
        style={[
          styles.filterField,
          active && styles.filterFieldActive,
          disabled && styles.filterFieldDisabled,
        ]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <View
          style={[
            styles.filterIconWrap,
            active && styles.filterIconWrapActive,
            disabled && styles.filterIconWrapDisabled,
          ]}
        >
          {FilterIcon ? (
            <FilterIcon width={filterIconSize} height={filterIconSize} />
          ) : null}
        </View>

        <View style={styles.filterFieldTextWrap}>
          <Text style={styles.filterFieldTitle}>{title}</Text>
          <Text
            style={[
              styles.filterFieldValue,
              active && styles.filterFieldValueActive,
            ]}
            numberOfLines={1}
          >
            {displayValue}
          </Text>
        </View>

        <View style={styles.filterArrowWrap}>
          <Icon
            source={disabled ? "lock-outline" : "chevron-down"}
            size={filterArrowSize}
            color={disabled ? colors.textSecondary : colors.primaryBlue}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const CompactMeta = ({ label, value }) => (
    <View style={styles.compactMeta}>
      <Text style={styles.compactMetaLabel}>{label}</Text>
      <Text style={styles.compactMetaValue} numberOfLines={1}>
        {value}
      </Text>
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

  const hasAnyModuleStages = Object.values(dataSet).some(
    (moduleData) => (moduleData?.stages || []).length > 0,
  );
  const shouldUseOfflineKpiLayout =
    !canViewProjectInsights || !isOnline || !hasAnyModuleStages;
  const showSkeletonLoader = isProjectDetailsLoading && !hasAnyModuleStages;
  const showInlineLoadingShimmer =
    isProjectDetailsLoading && hasAnyModuleStages;

  const getSwipeAnimatedStyles = (index, pagerWidth, compact = false) => {
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
              outputRange: [
                moderateScale(compact ? 10 : 26),
                0,
                -moderateScale(compact ? 10 : 26),
              ],
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
              outputRange: [
                moderateScale(compact ? 8 : 20),
                0,
                -moderateScale(compact ? 8 : 20),
              ],
              extrapolate: "clamp",
            }),
          },
          {
            translateY: chartScrollX.interpolate({
              inputRange,
              outputRange: [verticalScale(10), 0, verticalScale(10)],
              extrapolate: "clamp",
            }),
          },
        ],
      },
    };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={headerIconSize}
            onPress={handleBack}
          />

          <Text style={styles.headerTitle} numberOfLines={2}>
            {projectHeaderTitle}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {showSkeletonLoader ? (
            <ProjectDetailsSkeleton />
          ) : (
            <>
              {canUseLocationFilters ? (
                <View style={styles.filterPanel}>
                  <View style={styles.filterPanelHeader}>
                    <View style={styles.filterPanelTitleWrap}>
                      <CompactMeta label="Showing" value={locationSummary} />
                    </View>

                    {hasActiveLocationFilters ? (
                      <TouchableOpacity
                        style={styles.filterResetButton}
                        onPress={clearLocationFilters}
                      >
                        <Text style={styles.filterResetText}>Reset</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={styles.filterGrid}>
                    <FilterField
                      title="Zone"
                      value={zone}
                      totalCount={zoneTotalItems}
                      icon={Icons.zone}
                      active={zone !== "All"}
                      onPress={() => openLocationFilter("zone")}
                    />

                    <FilterField
                      title="Village"
                      value={village}
                      totalCount={villageTotalItems}
                      icon={Icons.village}
                      active={village !== "All"}
                      onPress={() => openLocationFilter("village")}
                    />
                  </View>
                </View>
              ) : null}

              {projectDetailsError ? (
                <View style={[styles.statusBanner, styles.statusBannerError]}>
                  <Text style={styles.statusBannerText}>
                    {projectDetailsError}
                  </Text>
                </View>
              ) : null}

              {showInlineLoadingShimmer ? (
                <View style={styles.inlineLoadingShell}>
                  <ShimmerBlock style={styles.inlineLoadingBar} />
                </View>
              ) : null}

              <View
                style={[
                  styles.kpiContainer,
                  shouldUseOfflineKpiLayout && styles.kpiContainerOffline,
                ]}
              >
                {kpiCards.map((item) => {
                  console.log("Rendering KPI card:", item);
                  
                  return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.kpiCard,
                      shouldUseOfflineKpiLayout && styles.kpiCardOffline,
                      {
                        backgroundColor: item.bg,
                        borderColor: item.soft,
                      },
                    ]}
                    onPress={() => openModuleList(item.key)}
                    activeOpacity={canOpenModuleList(item.key) ? 0.85 : 1}
                    disabled={!canOpenModuleList(item.key)}
                  >
                    <View
                      style={[
                        styles.kpiAccentBar,
                        shouldUseOfflineKpiLayout && styles.kpiAccentBarOffline,
                        { backgroundColor: item.accent },
                      ]}
                    />
                    <View
                      style={[
                        styles.kpiContent,
                        shouldUseOfflineKpiLayout && styles.kpiContentOffline,
                      ]}
                    >
                      <View
                        style={[
                          styles.kpiHeaderRow,
                          shouldUseOfflineKpiLayout &&
                            styles.kpiHeaderRowOffline,
                        ]}
                      >
                        <View
                          style={[
                            styles.kpiTextBlock,
                            shouldUseOfflineKpiLayout &&
                              styles.kpiTextBlockOffline,
                          ]}
                        >
                          <Text style={[styles.kpiKey, { color: item.text }]}>
                            {item.key}
                          </Text>
                          {shouldUseOfflineKpiLayout ? (
                            <View style={styles.kpiOfflineValueRow}>
                              <Text
                                style={[
                                  styles.kpiValue,
                                  styles.kpiValueOffline,
                                  styles.kpiValueOfflineFixedWidth,
                                  { color: item.accent },
                                ]}
                              >
                                {item.value}
                              </Text>
                              <TouchableOpacity
                                style={[
                                  styles.kpiInlineAction,
                                  { borderColor: item.soft },
                                ]}
                                onPress={() =>
                                  openStageStatusBoard({
                                    moduleKey: item.key,
                                    stageLabel: "All",
                                  })
                                }
                                activeOpacity={0.86}
                              >
                                <Icons.work
                                  height={16}
                                  width={16}
                                  color={item.accent}
                                />
                                <Text
                                  style={[
                                    styles.kpiInlineActionText,
                                    { color: item.accent },
                                  ]}
                                  numberOfLines={1}
                                >
                                  Work Status
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : null}
                        </View>
                        <View
                          style={[
                            styles.kpiArrowWrap,
                            shouldUseOfflineKpiLayout &&
                              styles.kpiArrowWrapOffline,
                            { backgroundColor: item.chipBg },
                          ]}
                        >
                          <Icon
                            source="chevron-right"
                            size={kpiArrowIconSize}
                            color={item.accent}
                          />
                        </View>
                      </View>
                      {!shouldUseOfflineKpiLayout ? (
                        <Text style={[styles.kpiValue, { color: item?.accent }]}>
                          {item?.value}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )})}
              </View>

              {canViewProjectInsights
                ? Object.keys(dataSet).map((key) => {
                  console.log("Rendering section for module:", key);
                    const moduleData = dataSet[key];
                    const stages = moduleData?.stages || [];
                    const moduleTheme = getModuleTheme(key);
                    const stageTabs = [
                      "All",
                      ...stages.map((stage) => stage.label),
                    ];
                    const sectionHighlights = getSectionHighlights(moduleData);
                    const pagerWidth = chartViewportWidth;
                    const isCompactChart = pagerWidth < CHART_COMPACT_WIDTH;
                    if (!stages.length) return null;

                    return (
                      <View
                        key={key}
                        style={[
                          styles.sectionCard,
                          {
                            borderColor: moduleTheme.soft,
                            backgroundColor: moduleTheme.bg,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={[
                            styles.sectionHeader,
                            !isOnline && styles.sectionHeaderOffline,
                            { backgroundColor: colors.white },
                          ]}
                          onPress={() => toggleSection(key)}
                        >
                          <View style={styles.sectionTitleWrap}>
                            <View
                              style={[
                                styles.sectionAccent,
                                !isOnline && styles.sectionAccentOffline,
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
                            <TouchableOpacity
                                  style={[
                                    styles.stageBoardButton,
                                    { borderColor: moduleTheme.soft },
                                  ]}
                                  onPress={() =>
                                    openStageStatusBoard({
                                      moduleKey: key,
                                      stageLabel: selectedStage,
                                    })
                                  }
                                  activeOpacity={0.86}
                                >
                                  <Icons.work
                                    height={16}
                                    width={16}
                                    // color={item.accent}
                                  />
                                  <Text
                                    style={[
                                      styles.stageBoardButtonText,
                                      { color: moduleTheme.accent },
                                    ]}
                                  >
                                    Work Status
                                  </Text>
                                </TouchableOpacity>
                          </View>
                          <View
                            style={[
                              styles.sectionIconWrap,
                              !isOnline && styles.sectionIconWrapOffline,
                              { backgroundColor: moduleTheme.chipBg },
                            ]}
                          >
                            {!isOnline ? (
                              <Icon
                                source={
                                  expanded === key
                                    ? "chevron-up"
                                    : "chevron-down"
                                }
                                size={sectionArrowIconSize}
                                color={moduleTheme.text}
                              />
                            ) : expanded === key ? (
                              <Icons.up
                                width={sectionArrowIconSize}
                                height={sectionArrowIconSize}
                              />
                            ) : (
                              <Icons.down
                                width={sectionArrowIconSize}
                                height={sectionArrowIconSize}
                              />
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
                              <Text style={styles.highlightLabel}>
                                {item.label}
                              </Text>
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
                                <View>
                                  <Text
                                    style={[
                                      styles.stageTabHeading,
                                      { color: moduleTheme.text },
                                    ]}
                                  >
                                    Select Tabs
                                  </Text>
                                  <Text style={styles.stageTabCaption}>
                                    Swipe for details
                                  </Text>
                                </View>
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
                                      selectedStage === item &&
                                        styles.stageTabActive,
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
                                        selectedStage === item &&
                                          styles.stageTabTextActive,
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
                                const nextWidth =
                                  event.nativeEvent.layout.width;
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
                                      event.nativeEvent.contentOffset.x /
                                        pagerWidth,
                                    );
                                    const currentStage =
                                      stageTabs[pageIndex] || "All";
                                    if (currentStage !== selectedStage) {
                                      setSelectedStage(currentStage);
                                    }
                                  }}
                                >
                                  {stageTabs.map((stageLabel, index) => {
                                    const summary = getStageSummary(
                                      stages,
                                      stageLabel,
                                    );
                                    const {
                                      cardStyle,
                                      pieStyle,
                                      summaryStyle,
                                    } = getSwipeAnimatedStyles(
                                      index,
                                      pagerWidth,
                                      isCompactChart,
                                    );

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
                                          <View
                                            style={styles.chartSummaryHeader}
                                          >
                                            <Text
                                              style={styles.chartSummaryTitle}
                                            >
                                              {formatStageTabLabel(
                                                summary.label,
                                              )}
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

                                          <View
                                            style={[
                                              styles.chartSummaryBody,
                                              isCompactChart &&
                                                styles.chartSummaryBodyCompact,
                                            ]}
                                          >
                                            <Animated.View style={pieStyle}>
                                              {renderPieChart(
                                                stages,
                                                stageLabel,
                                                isCompactChart,
                                              )}
                                            </Animated.View>

                                            <Animated.View
                                              style={[
                                                styles.summaryList,
                                                isCompactChart &&
                                                  styles.summaryListCompact,
                                                summaryStyle,
                                              ]}
                                            >
                                              <SummaryItem
                                                label="Completed"
                                                value={formatSummaryValue(
                                                  summary,
                                                  "completed",
                                                )}
                                                color={colors.completed}
                                                compact={isCompactChart}
                                              />
                                              <SummaryItem
                                                label="Pending"
                                                value={formatSummaryValue(
                                                  summary,
                                                  "pending",
                                                )}
                                                color={colors.pending}
                                                compact={isCompactChart}
                                              />
                                              <SummaryItem
                                                label="Partial"
                                                value={formatSummaryValue(
                                                  summary,
                                                  "partial",
                                                )}
                                                color={colors.partial}
                                                compact={isCompactChart}
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
                  })
                : null}
            </>
          )}
        </ScrollView>
      </View>

      {canUseLocationFilters ? (
        <SearchableFilterModal
          visible={!!filterType}
          title={filterType === "zone" ? "Select Zone" : "Select Village"}
          subtitle={
            filterType === "zone"
              ? "Choose any zone to refine the project overview."
              : "Choose any village to refine the project overview."
          }
          totalItems={filterTotalItems}
          options={locationFilterOptions}
          isLoading={isFilterOptionsLoading}
          isFetchingMore={isFetchingMoreFilterOptions}
          hasMoreOptions={hasMoreFilterOptions}
          selectedValue={getActiveLocationFilterValue()}
          onSelect={applyLocationFilter}
          onClose={closeLocationFilter}
          onEndReached={loadMoreFilterOptions}
          searchQuery={locationFilterSearchQuery}
          onSearchQueryChange={setLocationFilterSearchQuery}
          searchPlaceholder={`Search ${
            filterType === "zone" ? "zone" : "village"
          }`}
          emptyMessage={`No ${filterType === "zone" ? "zones" : "villages"} found.`}
        />
      ) : null}
    </SafeAreaView>
  );
};

export default ProjectDetailsScreen;
