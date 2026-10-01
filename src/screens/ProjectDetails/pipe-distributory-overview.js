import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { PieChartPro } from "react-native-gifted-charts";
import { Icon } from "react-native-paper";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import {
  fontScale,
  moderateScale,
  verticalScale,
} from "../../constants/metrics";

const DEFAULT_PIPE_DATA = [
  {
    key: "ms",
    label: "MS",
    name: "Mild steel",
    laid: 134471.1,
    planned: 269938,
    stages: {
      excavation: 191840,
      pipeLaying: 134471.1,
      backfilling: 109250,
    },
    color: "#2F72D6",
    surface: "#EAF3FF",
  },
  {
    key: "di",
    label: "DI",
    name: "Ductile iron",
    laid: 6313.8,
    planned: 68159,
    stages: {
      excavation: 24900,
      pipeLaying: 6313.8,
      backfilling: 4100,
    },
    color: "#249A61",
    surface: "#EAF8F0",
  },
  {
    key: "hdpe",
    label: "HDPE",
    name: "Polyethylene",
    laid: 1789268.7,
    planned: 2146382,
    stages: {
      excavation: 2035550,
      pipeLaying: 1789268.7,
      backfilling: 1624800,
    },
    color: "#E6752D",
    surface: "#FFF2E8",
  },
];

const PIPE_STAGES = [
  {
    key: "excavation",
    label: "Excavation",
    icon: "shovel",
    color: "#D8872E",
    track: "#F8E7D4",
    glow: "#F3BD7A",
    surface: "#FFF9F2",
  },
  {
    key: "pipeLaying",
    label: "Pipe Laying",
    icon: "pipe",
    color: "#2F72D6",
    track: "#DCEAFF",
    glow: "#83B2F1",
    surface: "#F4F8FF",
  },
  {
    key: "backfilling",
    label: "Backfilling",
    icon: "terrain",
    color: "#249A61",
    track: "#DDF3E7",
    glow: "#78CCA2",
    surface: "#F3FBF7",
  },
];

const ACTIONS = [
  {
    key: "add",
    label: "Add Entry",
    icon: "plus",
    title: "Add Entry",
    message: "The entry screen will open here once it is ready.",
  },
  {
    key: "reports",
    label: "Daily reports",
    icon: "file-chart-outline",
    color: "#0B7C96",
    surface: "#EEF9FC",
    border: "#CBEAF0",
    title: "No reports yet",
  },
  {
    key: "status",
    label: "Work status",
    icon: "clipboard-check-outline",
    color: "#8A5A16",
    surface: "#FFF8EA",
    border: "#F3DFC0",
    title: "No status yet",
  },
];

const formatLength = (value) =>
  `${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: Number(value) % 1 ? 1 : 0,
    maximumFractionDigits: 1,
  })} m`;

const formatCompactLength = (value) => {
  const safeValue = Number(value || 0);

  if (safeValue >= 1000000) {
    return `${(safeValue / 1000000).toFixed(2)}M m`;
  }

  if (safeValue >= 1000) {
    return `${(safeValue / 1000).toFixed(1)}k m`;
  }

  return `${safeValue.toFixed(0)} m`;
};

const getPercent = (value, total) =>
  total > 0 ? Math.min(Math.round((value / total) * 1000) / 10, 100) : 0;

const MaterialKpiCard = ({ item, selected, onPress, compact }) => {
  const progress = getPercent(item.laid, item.planned);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.materialKpiCard,
        compact && { minHeight: 82, paddingTop: 6, paddingBottom: 6 },
        {
          backgroundColor: selected ? item.surface : colors.white,
          borderColor: selected ? item.color : colors.cardBorder,
        },
        selected && styles.materialKpiCardSelected,
        pressed && styles.materialKpiCardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${item.label} pipe progress`}
    >
      <View style={styles.materialKpiHeader}>
        <View style={styles.materialKpiNameWrap}>
          <View style={[styles.materialKpiDot, { backgroundColor: item.color }]} />
          <Text
            style={[styles.materialKpiLabel, { color: item.color }]}
          >
            {item.label}
          </Text>
        </View>
        <View
          style={[
            styles.materialKpiPercentPill,
            { backgroundColor: selected ? colors.white : item.surface },
          ]}
        >
          <Text
            selectable
            style={[styles.materialKpiPercent, { color: item.color }]}
          >
            {progress}%
          </Text>
        </View>
      </View>

      <Text
        selectable
        style={styles.materialKpiValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {formatCompactLength(item.laid)}
      </Text>
      <Text
        selectable
        style={styles.materialKpiPlanned}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        / {formatCompactLength(item.planned)}
      </Text>

      <View style={styles.materialKpiTrack}>
        <View
          style={[
            styles.materialKpiProgress,
            { width: `${progress}%`, backgroundColor: item.color },
          ]}
        />
      </View>
    </Pressable>
  );
};

const StageProgressChart = ({
  material,
  stage,
  radius,
  compact,
  animateOnMount,
}) => {
  const planned = Number(material.planned || 0);
  const completed = Math.min(
    Number(material.stages?.[stage.key] ?? material.laid ?? 0),
    planned,
  );
  const remaining = Math.max(planned - completed, 0);
  const progress = getPercent(completed, planned);
  const maxArcValue = planned * 0.48;
  const splitArc = (value, getItem) => {
    const segments = [];
    let valueLeft = value;

    while (valueLeft > 0) {
      const segmentValue = Math.min(valueLeft, maxArcValue);
      segments.push(getItem(segmentValue, segments.length));
      valueLeft -= segmentValue;
    }

    return segments;
  };
  const completedSegments = planned
    ? splitArc(completed, (value) => ({
        value,
        color: stage.color,
        gradientCenterColor: stage.glow,
      }))
    : [];
  const remainingSegments = planned
    ? splitArc(remaining, (value) => ({
        value,
        color: stage.track,
        gradientCenterColor: colors.white,
      }))
    : [{ value: 1, color: stage.track }];

  const pieData = [...completedSegments, ...remainingSegments];
  const dialPadding = moderateScale(2);
  const dialSize = radius * 2 + dialPadding * 2;

  return (
    <View
      style={[
        styles.stageChartCard,
        compact && { paddingTop: 6, paddingBottom: 6 },
        { backgroundColor: colors.white },
      ]}
    >
      <View style={styles.stageChartHeader}>
        <View style={styles.stageChartTitleWrap}>
          <View style={[styles.stageDot, { backgroundColor: stage.color }]} />
          <Text style={styles.stageChartLabel} numberOfLines={1}>
            {stage.label}
          </Text>
        </View>
        <Text selectable style={styles.stageChartValue}>
          {formatCompactLength(completed)}
        </Text>
        <Text selectable style={styles.stageRemaining}>
          {formatCompactLength(remaining)} remaining
        </Text>
      </View>

      <View
        style={[
          styles.stageChartWrap,
          { width: dialSize, height: dialSize },
        ]}
      >
        <View
          style={[
            styles.stagePie,
            { left: dialPadding, top: dialPadding, transform: [{ rotate: "-90deg" }, { scaleY: -1 }] },
          ]}
        >
          <PieChartPro
            donut
            radius={radius}
            innerRadius={radius * 0.79}
            data={pieData}
            initialAngle={0}
            endAngle={Math.PI * 2}
            isAnimated={animateOnMount}
            animationDuration={750}
          />
        </View>
        <View style={styles.stageChartCenter} pointerEvents="none">
          <Text
            selectable
            style={styles.stageChartPercent}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {progress}%
          </Text>
        </View>
      </View>

    </View>
  );
};

const ActionButton = ({ item, selected, onPress, compact }) => (
  <Pressable
    style={({ pressed }) => [
      styles.actionButton,
      item.key !== "add" && {
        backgroundColor: item.surface,
        borderColor: item.border,
      },
      item.key === "add" && styles.actionButtonPrimary,
      compact && { flex: 1, flexDirection: "column", gap: 4, minHeight: 66, paddingHorizontal: 4 },
      selected && item.key !== "add" && styles.actionButtonSelected,
      selected && item.key !== "add" && { borderColor: item.color },
      pressed && styles.actionButtonPressed,
    ]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={item.label}
  >
    <View
      style={[
        styles.actionIcon,
        item.key === "add" && styles.actionIconPrimary,
      ]}
    >
      <Icon
        source={item.icon}
        size={moderateScale(21)}
        color={item.key === "add" ? colors.white : item.color}
      />
    </View>
    <View style={styles.actionTextGroup}>
      <Text
        style={[
          styles.actionLabel,
          item.key === "add" && styles.actionLabelPrimary,
          item.key !== "add" && { color: item.color },
          compact && { fontSize: 12, textAlign: "center" },
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {item.label}
      </Text>
    </View>
  </Pressable>
);

const PipeDistributoryOverview = ({
  pipeData = DEFAULT_PIPE_DATA,
  onAddEntry,
  onPipeLayingReports,
  onWorkStatus,
}) => {
  const { width, height, fontScale: systemFontScale } = useWindowDimensions();
  const [viewport, setViewport] = React.useState(null);
  const availableWidth = viewport?.width || width;
  const availableHeight = viewport?.height || height;
  const compact = availableHeight < 720 && systemFontScale < 1.3;
  const inlineActions = availableWidth >= 320 && systemFontScale < 1.3;
  const hasAnimatedChartsRef = React.useRef(false);
  const [selectedAction, setSelectedAction] = React.useState(null);
  const [selectedMaterialKey, setSelectedMaterialKey] = React.useState(
    pipeData?.[0]?.key || DEFAULT_PIPE_DATA[0].key,
  );
  const safePipeData = pipeData?.length ? pipeData : DEFAULT_PIPE_DATA;
  const totalLaid = safePipeData.reduce(
    (total, item) => total + Number(item.laid || 0),
    0,
  );
  const totalPlanned = safePipeData.reduce(
    (total, item) => total + Number(item.planned || 0),
    0,
  );
  const overallProgress = getPercent(totalLaid, totalPlanned);
  const stageChartRadius = compact ? 30 : availableWidth < 360 ? 34 : 38;
  const animateChartsOnLoad = !hasAnimatedChartsRef.current;
  const selectedMaterial =
    safePipeData.find((item) => item.key === selectedMaterialKey) ||
    safePipeData[0];
  const selectedActionConfig = ACTIONS.find(
    (item) => item.key === selectedAction,
  );
  const selectedActionData =
    selectedActionConfig?.key === "add"
      ? {
          ...selectedActionConfig,
          title: `Add Entry for ${selectedMaterial.label}`,
          message: `${selectedMaterial.label} entry screen will be connected here.`,
        }
      : selectedActionConfig;
  const actionCallbacks = {
    add: onAddEntry,
    reports: onPipeLayingReports,
    status: onWorkStatus,
  };

  React.useEffect(() => {
    hasAnimatedChartsRef.current = true;
  }, []);

  React.useEffect(() => {
    if (!safePipeData.some((item) => item.key === selectedMaterialKey)) {
      setSelectedMaterialKey(safePipeData[0]?.key);
    }
  }, [safePipeData, selectedMaterialKey]);

  const handleAction = (action) => {
    const callback = actionCallbacks[action.key];

    if (typeof callback === "function") {
      callback(selectedMaterial);
      return;
    }

    setSelectedAction(action.key);
  };

  return (
    <ScrollView
      style={styles.scroll}
      onLayout={({ nativeEvent: { layout } }) => {
        setViewport((previous) => previous?.width === layout.width && previous?.height === layout.height
          ? previous : { width: layout.width, height: layout.height });
      }}
      contentContainerStyle={[styles.content, { width: "100%", maxWidth: 720, alignSelf: "center" },
        compact && { gap: 6, paddingTop: 6, paddingBottom: 12 }]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.networkSummaryCard, compact && { paddingTop: 8, paddingBottom: 8 }]}>
        <View style={styles.networkSummaryTop}>
          <Text style={styles.dashboardEyebrow}>PIPE NETWORK</Text>
          <View style={styles.overallBadge}>
            <Text selectable style={styles.overallBadgeValue}>
              {overallProgress}%
            </Text>
          </View>
        </View>
        <View style={[styles.networkSummaryData, systemFontScale >= 1.3 && { flexDirection: "column", alignItems: "flex-start" }]}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.networkSummaryLabel}>Laid</Text>
            <Text selectable style={styles.networkSummaryValue}>
              {formatLength(totalLaid)}
            </Text>
          </View>
          <View style={styles.networkSummaryPlan}>
            <Text style={styles.networkSummaryLabel}>Planned</Text>
            <Text selectable style={styles.networkSummaryPlanValue}>
              {formatLength(totalPlanned)}
            </Text>
          </View>
        </View>
        <View style={styles.totalSummaryTrack}>
          <View
            style={[
              styles.totalSummaryProgress,
              { width: `${overallProgress}%` },
            ]}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Materials</Text>
      <View style={[styles.materialKpiGrid, systemFontScale >= 1.3 && { flexDirection: "column" }]} accessibilityRole="tablist">
        {safePipeData.map((item) => (
          <MaterialKpiCard
            key={item.key}
            item={item}
            selected={selectedMaterial.key === item.key}
            compact={compact}
            onPress={() => setSelectedMaterialKey(item.key)}
          />
        ))}
      </View>

      <View style={styles.actionSection}>
        <View style={inlineActions ? styles.actionRow : { gap: 8 }}>
          <ActionButton
            item={{
              ...ACTIONS[0],
              label: inlineActions ? "Add entry" : `Add entry · ${selectedMaterial.label}`,
            }}
            selected={selectedAction === ACTIONS[0].key}
            onPress={() => handleAction(ACTIONS[0])}
            compact={inlineActions}
          />
        <View style={[styles.actionRow, inlineActions && { flex: 2 }]}>
          {ACTIONS.slice(1).map((action) => (
            <ActionButton
              key={action.key}
              item={action}
              selected={selectedAction === action.key}
              onPress={() => handleAction(action)}
              compact={inlineActions}
            />
          ))}
        </View>
        </View>

        {selectedActionData ? (
          <View style={styles.actionNotice}>
            <Icon
              source="information-outline"
              size={moderateScale(17)}
              color={colors.primaryBlue}
            />
            <Text style={styles.actionNoticeTitle}>
              {selectedActionData.title}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.chartCard}>
        <View style={[styles.chartHeader, systemFontScale >= 1.3 && { flexDirection: "column" }]}>
          <Text style={styles.sectionTitle}>Work progress · {selectedMaterial.label}</Text>
          <View style={styles.chartPlannedWrap}>
            <Text style={styles.chartPlannedLabel}>Planned</Text>
            <Text selectable style={styles.chartPlannedValue}>
              {formatCompactLength(selectedMaterial.planned)}
            </Text>
          </View>
        </View>
        <View style={styles.stageChartRow}>
          {PIPE_STAGES.map((stage) => (
            <StageProgressChart
              key={stage.key}
              material={selectedMaterial}
              stage={stage}
              radius={stageChartRadius}
              compact={compact}
              animateOnMount={animateChartsOnLoad}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(24),
    gap: verticalScale(8),
  },

  networkSummaryCard: {
    paddingHorizontal: moderateScale(13),
    paddingTop: verticalScale(11),
    paddingBottom: verticalScale(10),
    borderRadius: moderateScale(17),
    borderCurve: "continuous",
    backgroundColor: colors.primaryBlue,
    boxShadow: "0 5px 15px rgba(18,59,99,0.18)",
  },

  networkSummaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  networkSummaryData: {
    marginTop: verticalScale(7),
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },

  networkSummaryLabel: {
    fontSize: fontScale(8.5),
    fontFamily: fonts.medium,
    color: "#BFD7E9",
  },

  networkSummaryValue: {
    marginTop: verticalScale(1),
    fontSize: fontScale(16),
    fontFamily: fonts.bold,
    color: colors.white,
    fontVariant: ["tabular-nums"],
  },

  networkSummaryPlan: {
    flexShrink: 1,
    alignItems: "flex-end",
  },

  networkSummaryPlanValue: {
    marginTop: verticalScale(1),
    fontSize: fontScale(11),
    fontFamily: fonts.bold,
    color: "#E1EDF6",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },

  dashboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(2),
  },

  dashboardHeaderText: {
    flex: 1,
  },

  dashboardEyebrow: {
    fontSize: fontScale(14),
    fontFamily: fonts.bold,
    color: "#C7DFF0",
    letterSpacing: 0.9,
  },

  dashboardTitle: {
    marginTop: verticalScale(2),
    fontSize: fontScale(19),
    lineHeight: fontScale(23),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  overallBadge: {
    minWidth: moderateScale(53),
    minHeight: verticalScale(28),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(9),
    borderRadius: moderateScale(999),
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.17)",
  },

  overallBadgeValue: {
    fontSize: fontScale(11.5),
    fontFamily: fonts.bold,
    color: colors.white,
    fontVariant: ["tabular-nums"],
  },

  overallBadgeLabel: {
    marginTop: verticalScale(1),
    fontSize: fontScale(8),
    fontFamily: fonts.bold,
    color: "#B8D7EE",
    letterSpacing: 0.8,
  },

  materialKpiGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: moderateScale(8),
  },

  materialKpiCard: {
    flex: 1,
    minWidth: 0,
    minHeight: verticalScale(91),
    paddingHorizontal: moderateScale(8),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(7),
    borderRadius: moderateScale(14),
    borderCurve: "continuous",
    borderWidth: 1,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(18,59,99,0.06)",
  },

  materialKpiCardSelected: {
    borderWidth: 1.5,
    boxShadow: "0 4px 14px rgba(18,59,99,0.12)",
  },

  materialKpiCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  materialKpiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(4),
  },

  materialKpiNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
  },

  materialKpiDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
  },

  materialKpiLabel: {
    fontSize: fontScale(12.5),
    fontFamily: fonts.bold,
    letterSpacing: 0.45,
  },

  materialKpiPercentPill: {
    minWidth: moderateScale(31),
    height: verticalScale(19),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(2),
    borderRadius: moderateScale(999),
  },

  materialKpiPercent: {
    fontSize: fontScale(8.5),
    fontFamily: fonts.bold,
    fontVariant: ["tabular-nums"],
  },

  materialKpiValue: {
    width: "100%",
    marginTop: verticalScale(6),
    fontSize: fontScale(14),
    lineHeight: fontScale(17),
    fontFamily: fonts.bold,
    color: colors.textDark,
    fontVariant: ["tabular-nums"],
  },

  materialKpiPlanned: {
    width: "100%",
    marginTop: verticalScale(2),
    fontSize: fontScale(9),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },

  materialKpiTrack: {
    marginTop: "auto",
    height: verticalScale(4),
    borderRadius: moderateScale(999),
    backgroundColor: "rgba(255,255,255,0.82)",
    overflow: "hidden",
  },

  materialKpiProgress: {
    height: "100%",
    borderRadius: moderateScale(999),
  },

  totalSummaryCard: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(15),
    borderCurve: "continuous",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: "0 3px 12px rgba(18,59,99,0.06)",
  },

  totalSummaryHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: moderateScale(12),
  },

  totalSummaryLabel: {
    fontSize: fontScale(10),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  totalSummaryValue: {
    marginTop: verticalScale(2),
    fontSize: fontScale(16),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    fontVariant: ["tabular-nums"],
  },

  totalSummaryPlannedWrap: {
    flexShrink: 1,
    alignItems: "flex-end",
  },

  totalSummaryPlannedLabel: {
    fontSize: fontScale(9),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  totalSummaryPlannedValue: {
    marginTop: verticalScale(2),
    fontSize: fontScale(11),
    fontFamily: fonts.bold,
    color: colors.textDark,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },

  totalSummaryTrack: {
    marginTop: verticalScale(7),
    height: verticalScale(4),
    borderRadius: moderateScale(999),
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },

  totalSummaryProgress: {
    height: "100%",
    borderRadius: moderateScale(999),
    backgroundColor: colors.primaryGreen,
  },

  actionSection: {
    gap: verticalScale(6),
  },

  sectionTitle: {
    fontSize: fontScale(14),
    lineHeight: fontScale(18),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  actionRow: {
    flexDirection: "row",
    gap: moderateScale(8),
  },

  actionButton: {
    flex: 1,
    minWidth: 0,
    minHeight: verticalScale(47),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(7),
    paddingVertical: verticalScale(7),
    gap: moderateScale(6),
    borderRadius: moderateScale(13),
    borderCurve: "continuous",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: "0 2px 8px rgba(18,59,99,0.06)",
  },

  actionButtonPrimary: {
    flex: 0,
    minHeight: verticalScale(47),
    justifyContent: "center",
    paddingHorizontal: moderateScale(7),
    borderRadius: moderateScale(13),
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
    boxShadow: "0 4px 12px rgba(18,59,99,0.2)",
  },

  actionButtonSelected: {
    borderWidth: 1.5,
  },

  actionButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },

  actionIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(9),
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },

  actionIconPrimary: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(9),
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  actionTextGroup: {
    flex: 1,
    minWidth: 0,
  },

  actionLabel: {
    width: "100%",
    fontSize: fontScale(13),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
  },

  actionLabelPrimary: {
    fontSize: fontScale(14),
    color: colors.white,
  },

  actionNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(11),
    borderCurve: "continuous",
    backgroundColor: colors.surfaceBluePale,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  actionNoticeTitle: {
    flex: 1,
    fontSize: fontScale(10),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  sectionEyebrow: {
    fontSize: fontScale(10),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    letterSpacing: 0.8,
  },

  chartCard: {
    padding: moderateScale(11),
    borderRadius: moderateScale(17),
    borderCurve: "continuous",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: "0 4px 14px rgba(18,59,99,0.07)",
  },

  chartHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },

  chartMaterialBadge: {
    minWidth: moderateScale(46),
    minHeight: verticalScale(30),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(11),
    borderRadius: moderateScale(10),
    borderCurve: "continuous",
  },

  chartMaterialBadgeText: {
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
    letterSpacing: 0.4,
  },

  chartPlannedWrap: {
    alignItems: "flex-end",
  },

  chartPlannedLabel: {
    fontSize: fontScale(8),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  chartPlannedValue: {
    marginTop: verticalScale(1),
    fontSize: fontScale(10.5),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    fontVariant: ["tabular-nums"],
  },

  chartCaption: {
    marginTop: verticalScale(4),
    fontSize: fontScale(11),
    lineHeight: fontScale(15),
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  selectedMaterialSummary: {
    marginTop: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(10),
    paddingHorizontal: moderateScale(11),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(13),
    borderCurve: "continuous",
    backgroundColor: colors.surfaceBluePale,
  },

  selectedMaterialName: {
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  selectedMaterialMeta: {
    marginTop: verticalScale(2),
    fontSize: fontScale(9.5),
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  selectedMaterialValue: {
    maxWidth: "58%",
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },

  stageChartRow: {
    marginTop: verticalScale(9),
    flexDirection: "column",
    alignItems: "stretch",
    gap: 0,
  },

  stageChartCard: {
    flexDirection: "row",
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: moderateScale(5),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(8),
    justifyContent: "space-between",
    gap: moderateScale(16),
    borderRadius: 0,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceBluePale,
    borderWidth: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardBorder,
  },

  stageIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(9),
    borderCurve: "continuous",
  },

  stageChartHeader: {
    flex: 1,
    minHeight: verticalScale(18),
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: moderateScale(4),
  },

  stageChartTitleWrap: {
    minWidth: 0,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },

  stageSequence: {
    fontSize: fontScale(8),
    fontFamily: fonts.bold,
    fontVariant: ["tabular-nums"],
    opacity: 0.72,
  },

  stageDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },

  stageChartWrap: {
    marginTop: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  stagePie: {
    position: "absolute",
  },

  dialMarker: {
    position: "absolute",
    width: moderateScale(3),
    height: verticalScale(2),
    borderRadius: moderateScale(1),
  },

  stageChartCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: verticalScale(1),
  },

  stageChartPercent: {
    maxWidth: "78%",
    fontSize: fontScale(20),
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },

  stageChartLabel: {
    flexShrink: 1,
    fontSize: fontScale(14),
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: "center",
  },

  stageChartValue: {
    width: "100%",
    marginTop: verticalScale(5),
    fontSize: fontScale(21),
    fontFamily: fonts.bold,
    color: colors.textDark,
    fontVariant: ["tabular-nums"],
    textAlign: "left",
  },
  stageRemaining: {
    marginTop: verticalScale(4),
    fontSize: fontScale(12),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: "left",
  },
});

export default PipeDistributoryOverview;
