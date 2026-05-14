import React from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
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
const CHART_TIGHT_WIDTH = 390;
const TIGHT_PIE_RADIUS = 58;
const TIGHT_PIE_INNER_RADIUS = 36;
const SMALL_PIE_WIDTH = 330;
const SMALL_PIE_RADIUS = 50;
const SMALL_PIE_INNER_RADIUS = 31;
const SHIMMER_DURATION = 1300;
const RING_TRACK_COLORS = {
  pending: "#FBE8D1",
  completed: "#DCF7EA",
  partial: "#F6E6BF",
};

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
    zoneTotalOms,
    villageTotalOms,
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
    isProjectDetailsRefreshing,
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
    refreshProjectDetails,
    getActiveLocationFilterValue,
    getVisibleStages,
    getStageSummary,
    getSectionHighlights,
    kpiCards,
    canOpenModuleList,
    getModuleTheme,
    handleBack,
    openModuleList,
    openStageStatusBoard,
    openSummary,
    openSubprocessUnitList,
  } = useProjectDetailsViewModel(navigation, route);
  const { width } = useWindowDimensions();
  const stagePagerRef = React.useRef(null);
  const stageTabScrollRef = React.useRef(null);
  const stageTabLayoutsRef = React.useRef({});
  const chartScrollX = React.useRef(new Animated.Value(0)).current;
  const chartSectionPadding = moderateScale(CHART_SECTION_PADDING);
  const pieRadius = moderateScale(PIE_RADIUS);
  const pieInnerRadius = moderateScale(PIE_INNER_RADIUS);
  const tightPieRadius = moderateScale(TIGHT_PIE_RADIUS);
  const tightPieInnerRadius = moderateScale(TIGHT_PIE_INNER_RADIUS);
  const smallPieRadius = moderateScale(SMALL_PIE_RADIUS);
  const smallPieInnerRadius = moderateScale(SMALL_PIE_INNER_RADIUS);
  const filterIconSize = moderateScale(FILTER_ICON_SIZE);
  const filterArrowSize = moderateScale(FILTER_ARROW_SIZE);
  const headerIconSize = moderateScale(HEADER_ICON_SIZE);
  const kpiArrowIconSize = moderateScale(KPI_ARROW_ICON_SIZE);
  const sectionArrowIconSize = moderateScale(SECTION_ARROW_ICON_SIZE);
  const defaultChartViewportWidth = Math.max(width - chartSectionPadding, 0);
  const [chartViewportWidth, setChartViewportWidth] = React.useState(
    defaultChartViewportWidth,
  );
  const [stageTabViewportWidth, setStageTabViewportWidth] = React.useState(0);
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
    const frameId = requestAnimationFrame(() => {
      centerStageTab(selectedStage);
    });

    return () => cancelAnimationFrame(frameId);
  }, [centerStageTab, selectedStage]);

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

  const renderPieChart = ({
    summary,
    totalUnits = 0,
    isTight = false,
    isSmall = false,
    moduleTheme = null,
  }) => {
    const total = Math.max(Number(totalUnits) || 0, summary.total, 1);
    const buildRingData = (value, color, trackColor) => {
      const safeValue = Math.max(0, Number(value) || 0);
      const remainder = Math.max(total - safeValue, 0);

      return remainder
        ? [
            { value: safeValue, color },
            { value: remainder, color: trackColor },
          ]
        : [{ value: total, color }];
    };

    const activePieRadius = isSmall
      ? smallPieRadius
      : isTight
        ? tightPieRadius
        : pieRadius;
    const activePieInnerRadius = isSmall
      ? smallPieInnerRadius
      : isTight
        ? tightPieInnerRadius
        : pieInnerRadius;

    const outerRadius = activePieRadius;
    const outerInnerRadius = isTight || isSmall
      ? Math.max(activePieRadius - moderateScale(10), 1)
      : Math.max(pieRadius - moderateScale(12), 1);
    const middleRadius = isTight || isSmall
      ? Math.max(activePieRadius - moderateScale(13), 1)
      : Math.max(pieRadius - moderateScale(16), 1);
    const middleInnerRadius = isTight || isSmall
      ? Math.max(activePieInnerRadius, 1)
      : Math.max(pieInnerRadius, 1);
    const innerRadius = isTight || isSmall
      ? Math.max(activePieInnerRadius - moderateScale(8), 1)
      : Math.max(pieInnerRadius - moderateScale(10), 1);
    const innerInnerRadius = isTight || isSmall
      ? Math.max(activePieInnerRadius - moderateScale(16), 1)
      : Math.max(pieInnerRadius - moderateScale(20), 1);

    return (
      <View
        style={[
          styles.pieWrapper,
          isTight && styles.pieWrapperTight,
          isSmall && styles.pieWrapperSmall,
        ]}
      >
        <View style={styles.pieRingLayer}>
          <PieChart
            donut
            radius={outerRadius}
            innerRadius={outerInnerRadius}
            data={buildRingData(
              summary.completed,
              colors.completed,
              RING_TRACK_COLORS.completed,
            )}
            isAnimated
            animationDuration={PIE_ANIMATION_DURATION}
          />
        </View>

        <View style={styles.pieRingLayer}>
          <PieChart
            donut
            radius={middleRadius}
            innerRadius={middleInnerRadius}
            data={buildRingData(
              summary.pending,
              colors.pending,
              RING_TRACK_COLORS.pending,
            )}
            isAnimated
            animationDuration={PIE_ANIMATION_DURATION}
          />
        </View>

        <View style={styles.pieRingLayer}>
          <PieChart
            donut
            radius={innerRadius}
            innerRadius={innerInnerRadius}
            data={buildRingData(
              summary.partial,
              colors.partial,
              RING_TRACK_COLORS.partial,
            )}
            isAnimated
            animationDuration={PIE_ANIMATION_DURATION}
          />
        </View>

        <View
          style={[
            styles.pieCenter,
            isTight && styles.pieCenterTight,
            isSmall && styles.pieCenterSmall,
          ]}
        >
          <Text
            style={[
              styles.piePercent,
              isTight && styles.piePercentTight,
              isSmall && styles.piePercentSmall,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {summary.completed}
          </Text>
          <Text
            style={[
              styles.pieLabel,
              isTight && styles.pieLabelTight,
              isSmall && styles.pieLabelSmall,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            COMPLETED
          </Text>
        </View>
      </View>
    );
  };

  const SummaryItem = ({ label, value, share, color, isTight = false, isSmall = false }) => (
    <View
      style={[
        styles.summaryItem,
        isTight && styles.summaryItemTight,
        isSmall && styles.summaryItemSmall,
        { borderColor: color },
      ]}
    >
      <View style={[styles.summaryDot, { backgroundColor: color }]} />
      <View style={styles.summaryTextWrap}>
        <Text
          style={[
            styles.summaryLabel,
            isTight && styles.summaryLabelTight,
            isSmall && styles.summaryLabelSmall,
          ]}
        >
          {label}
        </Text>
        <View style={styles.summaryValueRow}>
          <Text
            style={[
              styles.summaryValue,
              isTight && styles.summaryValueTight,
              isSmall && styles.summaryValueSmall,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {value}
          </Text>
          {/* {share ? (
            <Text
              style={[
                styles.summaryShare,
                isTight && styles.summaryShareTight,
                isSmall && styles.summaryShareSmall,
              ]}
            >
              {share}
            </Text>
          ) : null} */}
        </View>
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
        <View style={styles.filterFieldContent}>
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
            <View style={styles.filterFieldHeaderRow}>
              <Text style={styles.filterFieldTitle} numberOfLines={1}>
                {title}
              </Text>

              <View style={styles.filterArrowWrap}>
                {disabled ? (
                  <Icon
                    source="lock-outline"
                    size={filterArrowSize}
                    color={colors.textSecondary}
                  />
                ) : (
                  <Icons.down width={filterArrowSize} height={filterArrowSize} />
                )}
              </View>
            </View>

            <View style={styles.filterFieldValueRow}>
              <Text
                style={[
                  styles.filterFieldValue,
                  active && styles.filterFieldValueActive,
                ]}
                numberOfLines={1}
              >
                {value}
              </Text>

              {totalCount > 0 ? (
                <Text
                  style={[
                    styles.filterFieldCount,
                    active && styles.filterFieldCountActive,
                  ]}
                >
                  ({totalCount})
                </Text>
              ) : null}
            </View>
          </View>
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
      "Wet Commissioning": "Wet commissioning",
    };

    return map[label] || label;
  };

  const formatSummaryValue = (summary, key) => summary[key];
  const formatSummaryShare = (summary, key) =>
    summary.total ? `${Math.round((summary[key] / summary.total) * 100)}%` : "0%";

  const hasAnyModuleStages = Object.values(dataSet).some(
    (moduleData) => getVisibleStages(moduleData?.stages || []).length > 0,
  );
  const shouldUseOfflineKpiLayout =
    !canViewProjectInsights || !isOnline || !hasAnyModuleStages;
  const showSkeletonLoader = isProjectDetailsLoading && !hasAnyModuleStages;
  const showInlineLoadingShimmer =
    isProjectDetailsLoading && hasAnyModuleStages;

  const centerStageTab = React.useCallback((label) => {
    const layout = stageTabLayoutsRef.current[label];

    if (!layout || !stageTabViewportWidth || !stageTabScrollRef.current) {
      return;
    }

    const targetX = Math.max(
      layout.x - (stageTabViewportWidth - layout.width) / 2,
      0,
    );

    stageTabScrollRef.current.scrollTo({
      x: targetX,
      animated: true,
    });
  }, [stageTabViewportWidth]);

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
            scale: chartScrollX.interpolate({
              inputRange,
              outputRange: [0.9, 1, 0.9],
              extrapolate: "clamp",
            }),
          },
        ],
      },
      summaryStyle: {
        opacity: chartScrollX.interpolate({
          inputRange,
          outputRange: [0.55, 1, 0.55],
          extrapolate: "clamp",
        }),
        transform: [
          {
            scale: chartScrollX.interpolate({
              inputRange,
              outputRange: [0.97, 1, 0.97],
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isProjectDetailsRefreshing}
              onRefresh={refreshProjectDetails}
              tintColor={colors.primaryBlue}
              colors={[colors.primaryBlue]}
            />
          }
        >
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
                      // totalCount={zoneTotalOms}
                      icon={Icons.zone}
                      active={zone !== "All"}
                      onPress={() => openLocationFilter("zone")}
                    />

                    <FilterField
                      title="Village"
                      value={village}
                      // totalCount={villageTotalOms}
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
                  // console.log("Rendering KPI card:", item);

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
                                    color={"#ffffff"}
                                  />
                                  <Text
                                    style={[
                                      styles.kpiInlineActionText,
                                      // { color: item.accent },
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
                  )
                })}
              </View>

              {canViewProjectInsights
                ? Object.keys(dataSet).map((key) => {
                  const moduleData = dataSet[key];
                  const totalUnits = Number(moduleData?.totalUnits || 0);
                  const stages = getVisibleStages(moduleData?.stages || []);
                  const moduleTheme = getModuleTheme(key);
                  const stageTabs = stages.map((stage) => stage.label);
                  const selectedStageLabel = stageTabs.includes(selectedStage)
                    ? selectedStage
                    : stageTabs[0] || "All";
                  const sectionHighlights = getSectionHighlights(moduleData);
                  const pagerWidth = chartViewportWidth;
                  const isTightChart = pagerWidth < CHART_TIGHT_WIDTH;
                  const isSmallChart = pagerWidth < SMALL_PIE_WIDTH;
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
                          <View style={styles.sectionTitleTextBlock}>
                            <Text
                              style={[
                                styles.sectionTitle,
                                { color: moduleTheme.text },
                              ]}
                            >
                              {key} Status
                            </Text>
                          </View>
                          <View style={styles.sectionActionRow}>
                            <TouchableOpacity
                              style={styles.phaseZoneBoardButton}
                              onPress={() => openSummary({ moduleKey: key })}
                              activeOpacity={0.86}
                              accessibilityRole="button"
                              accessibilityLabel="Summary"
                            >
                              <Icon
                                source="clipboard-text-outline"
                                size={16}
                                color={colors.white}
                              />
                              <Text style={styles.phaseZoneBoardLabel}>Summary</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.stageBoardButton,
                                { borderColor: moduleTheme.soft },
                              ]}
                              onPress={() =>
                                openStageStatusBoard({
                                  moduleKey: key,
                                  stageLabel: selectedStageLabel,
                                })
                              }
                              activeOpacity={0.86}
                            >
                              <Icons.work height={16} width={16} />
                              <Text style={styles.stageBoardButtonText}>
                                Work Status
                              </Text>
                            </TouchableOpacity>
                          </View>
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
                          <TouchableOpacity
                            key={item.key}
                            style={[
                              styles.highlightCard,
                              {
                                borderColor: moduleTheme.soft,
                                backgroundColor: colors.white,
                              },
                            ]}
                            activeOpacity={item.isInteractive ? 0.86 : 1}
                            disabled={!item.isInteractive}
                            onPress={() =>
                              openSubprocessUnitList({
                                moduleKey: key,
                                subprocessId: item.subprocessId,
                                subprocessLabel: item.fullLabel || item.label,
                              })
                            }
                          >
                            <View style={styles.highlightValueRow}>
                              <Text style={styles.highlightLabel}>
                                {item.label}
                              </Text>
                              <Text
                                style={[
                                  styles.highlightValue,
                                  { color: moduleTheme.text },
                                ]}
                              >
                                {item.value}
                              </Text>
                            </View>
                          </TouchableOpacity>
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
                                  Tap a tab to view details
                                </Text>
                              </View>
                            </View>
                            <ScrollView
                              ref={stageTabScrollRef}
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              style={styles.stageTabContainer}
                              contentContainerStyle={styles.stageTabContent}
                              onLayout={(event) => {
                                const nextWidth = event.nativeEvent.layout.width;
                                if (nextWidth > 0 && Math.abs(nextWidth - stageTabViewportWidth) > 1) {
                                  setStageTabViewportWidth(nextWidth);
                                }
                              }}
                            >
                              {stageTabs.map((item) => (
                                <TouchableOpacity
                                  key={item}
                                  onPress={() => {
                                    const stageIndex = stageTabs.indexOf(item);
                                    setSelectedStage(item);
                                    centerStageTab(item);
                                    stagePagerRef.current?.scrollTo({
                                      x: stageIndex * pagerWidth,
                                      animated: true,
                                    });
                                  }}
                                  onLayout={(event) => {
                                    const { x, width: layoutWidth } = event.nativeEvent.layout;
                                    stageTabLayoutsRef.current[item] = {
                                      x,
                                      width: layoutWidth,
                                    };
                                  }}
                                  style={[
                                    styles.stageTab,
                                    selectedStageLabel === item &&
                                    styles.stageTabActive,
                                    {
                                      borderColor:
                                        selectedStageLabel === item
                                          ? moduleTheme.accent
                                          : moduleTheme.soft,
                                      backgroundColor:
                                        selectedStageLabel === item
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
                                          selectedStageLabel === item
                                            ? colors.white
                                            : moduleTheme.text,
                                      },
                                      selectedStageLabel === item &&
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
                                    event.nativeEvent.contentOffset.x / pagerWidth,
                                  );
                                  const currentStage =
                                    stageTabs[pageIndex] || stageTabs[0] || "All";
                                  if (currentStage !== selectedStage) {
                                    setSelectedStage(currentStage);
                                  }
                                }}
                              >
                                {stageTabs.map((stageLabel, index) => {
                                  const summary = getStageSummary(stages, stageLabel);
                                  const {
                                    cardStyle,
                                    pieStyle,
                                    summaryStyle,
                                  } = getSwipeAnimatedStyles(
                                    index,
                                    pagerWidth,
                                    isTightChart || isSmallChart,
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
                                        <View style={styles.chartSummaryHeader}>
                                          <Text style={styles.chartSummaryTitle}>
                                            {formatStageTabLabel(summary.label)}
                                          </Text>
                                          {/* <Text
                                            style={[
                                              styles.chartSummaryPercent,
                                              { color: moduleTheme.accent },
                                            ]}
                                          >
                                            {summary.percent}% Complete
                                          </Text> */}
                                        </View>

                                        <View
                                          style={[
                                            styles.chartSummaryBody,
                                            isSmallChart && styles.chartSummaryBodySmall,
                                          ]}
                                        >
                                          <Animated.View style={pieStyle}>
                                            {renderPieChart({
                                              summary,
                                              totalUnits,
                                              isTight: isTightChart,
                                              isSmall: isSmallChart,
                                              moduleTheme,
                                            })}
                                          </Animated.View>

                                          <Animated.View
                                            style={[
                                              styles.summaryList,
                                              isTightChart && styles.summaryListTight,
                                              isSmallChart && styles.summaryListSmall,
                                              summaryStyle,
                                            ]}
                                          >
                                          <SummaryItem
                                            label="Pending"
                                            value={formatSummaryValue(
                                              summary,
                                              "pending",
                                            )}
                                            share={formatSummaryShare(
                                              summary,
                                              "pending",
                                            )}
                                            color={colors.pending}
                                            isTight={isTightChart}
                                            isSmall={isSmallChart}
                                          />
                                          <SummaryItem
                                            label="Completed"
                                            value={formatSummaryValue(
                                              summary,
                                              "completed",
                                            )}
                                            share={formatSummaryShare(
                                              summary,
                                              "completed",
                                            )}
                                            color={colors.completed}
                                            isTight={isTightChart}
                                            isSmall={isSmallChart}
                                          />
                                            <SummaryItem
                                              label="Partial"
                                              value={formatSummaryValue(
                                                summary,
                                                "partial",
                                              )}
                                              share={formatSummaryShare(
                                                summary,
                                                "partial",
                                              )}
                                              color={colors.partial}
                                              isTight={isTightChart}
                                              isSmall={isSmallChart}
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
          searchPlaceholder={`Search ${filterType === "zone" ? "zone" : "village"
            }`}
          emptyMessage={`No ${filterType === "zone" ? "zones" : "villages"} found.`}
        />
      ) : null}
    </SafeAreaView>
  );
};

export default ProjectDetailsScreen;
