import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  Modal,
  Pressable,
  RefreshControl,
  useWindowDimensions,
  View,
} from "react-native";
import { Icon } from "react-native-paper";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import {
  fontScale,
  moderateScale,
  verticalScale,
} from "../../constants/metrics";

const EMPTY_PIPE_DATA = [
  {
    key: "ms",
    label: "MS",
    name: "Mild steel",
    laid: 0,
    planned: 0,
    stages: {
      excavation: 0,
      pipeLaying: 0,
      backfilling: 0,
    },
    color: colors.pipeMaterial.MS.accent,
  },
  {
    key: "di",
    label: "DI",
    name: "Ductile iron",
    laid: 0,
    planned: 0,
    stages: {
      excavation: 0,
      pipeLaying: 0,
      backfilling: 0,
    },
    color: colors.pipeMaterial.DI.accent,
  },
  {
    key: "hdpe",
    label: "HDPE",
    name: "Polyethylene",
    laid: 0,
    planned: 0,
    stages: {
      excavation: 0,
      pipeLaying: 0,
      backfilling: 0,
    },
    color: colors.pipeMaterial.HDPE.accent,
  },
];

const PIPE_STAGES = [
  {
    key: "excavation",
    label: "Excavation",
    color: colors.pipeStage.excavation.accent,
  },
  {
    key: "pipeLaying",
    label: "Pipe Laying",
    color: colors.pipeStage.pipe_laying.accent,
  },
  {
    key: "backfilling",
    label: "Backfilling",
    color: colors.pipeStage.backfilling.accent,
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
    title: "No reports yet",
  },
  {
    key: "status",
    label: "Work status",
    icon: "clipboard-check-outline",
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

const MaterialKpiCard = ({ item, compact, isLast, stacked }) => {
  const progress = getPercent(item.laid, item.planned);

  return (
    <View
      style={[
        styles.materialKpiCard,
        compact && { minHeight: 82, paddingTop: 6, paddingBottom: 6 },
        !isLast && (stacked ? styles.materialKpiDividerStacked : styles.materialKpiDivider),
      ]}
    >
      <View style={styles.materialKpiHeader}>
        <View style={styles.materialKpiNameWrap}>
          <View style={[styles.materialKpiDot, { backgroundColor: item.color }]} />
          <Text style={styles.materialKpiLabel}>
            {item.label}
          </Text>
        </View>
      </View>
      <View style={styles.materialKpiValueRow}>
        <Text
          selectable
          style={styles.materialKpiValue}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {formatCompactLength(item.laid)}
        </Text>
        <Text selectable style={styles.materialKpiPercent}>{progress}%</Text>
      </View>
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
    </View>
  );
};

const StageProgressDonut = ({ stage, progress, size }) => {
  const center = size / 2;
  const strokeWidth = Math.max(moderateScale(7), size * 0.09);
  const radius = Math.max(center - strokeWidth / 2 - 1, 1);
  const circumference = 2 * Math.PI * radius;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${stage.label}: ${progress}% complete`}
      style={[styles.stageDonut, { width: size, height: size }]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={center} cy={center} r={radius} fill="none" stroke={colors.neutralBorder} strokeWidth={strokeWidth} />
        {progress > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={stage.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress / 100)}
            rotation={-90}
            originX={center}
            originY={center}
          />
        ) : null}
      </Svg>
      <View style={styles.stageDonutCenter} pointerEvents="none">
        <Text selectable style={styles.stageDonutPercent} numberOfLines={1} adjustsFontSizeToFit>
          {progress}%
        </Text>
      </View>
    </View>
  );
};

const StageProgressList = ({ material, largeText }) => (
  <View style={styles.stageProgressList}>
    {PIPE_STAGES.map((stage, index) => {
      const planned = Number(material.planned || 0);
      const completed = Math.min(Number(material.stages?.[stage.key] ?? material.laid ?? 0), planned);
      const progress = getPercent(completed, planned);
      return (
        <View
          key={stage.key}
          style={[
            styles.stageProgressRow,
            index < PIPE_STAGES.length - 1 && styles.stageProgressRowDivider,
          ]}
        >
          <StageProgressDonut stage={stage} progress={progress} size={moderateScale(60)} />
          <View style={styles.stageRowDetails}>
            <View style={styles.stageRowHeading}>
              <View style={[styles.materialKpiDot, { backgroundColor: stage.color }]} />
              <Text style={styles.stageCardTitle}>{stage.label}</Text>
            </View>
            <View style={[styles.stageRowMetrics, largeText && styles.stageRowMetricsStacked]}>
              <Text selectable style={styles.stageCardMetricValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatCompactLength(completed)}
              </Text>
              <Text style={styles.stageCardPlanned} numberOfLines={1} adjustsFontSizeToFit>
                / {formatCompactLength(planned)} planned
              </Text>
            </View>
            <View style={styles.stageCardTrack}>
              <View style={[styles.stageCardProgress, { width: `${progress}%`, backgroundColor: stage.color }]} />
            </View>
          </View>
        </View>
      );
    })}
  </View>
);

const ActionButton = ({ item, selected, onPress, inline }) => (
  <Pressable
    style={({ pressed }) => [
      styles.actionButton,
      item.key === "add" && styles.actionButtonPrimary,
      inline && item.key === "add" && styles.actionButtonPrimaryInline,
      selected && item.key !== "add" && styles.actionButtonSelected,
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
        color={item.key === "add" ? colors.white : colors.primaryBlue}
      />
    </View>
    <View style={styles.actionTextGroup}>
      <Text
        style={[
          styles.actionLabel,
          item.key === "add" && styles.actionLabelPrimary,
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

const MaterialEntrySheet = ({ visible, materials, onClose, onSelect }) => {
  const insets = useSafeAreaInsets();
  const { height, fontScale: systemFontScale } = useWindowDimensions();
  const topSpace = Math.max(insets.top, verticalScale(12)) + verticalScale(12);
  const bottomPadding = Math.max(insets.bottom, verticalScale(16));
  const maxSheetHeight = Math.max(0, height - topSpace);
  const maxOptionsHeight = Math.max(0, maxSheetHeight - bottomPadding - verticalScale(108));
  const shouldScroll = materials.length * moderateScale(60) * Math.max(1, systemFontScale) > maxOptionsHeight;

  const options = materials.map((material, index) => (
    <Pressable
      key={material.key}
      style={({ pressed }) => [
        styles.materialSheetOption,
        index < materials.length - 1 && styles.materialSheetOptionDivider,
        pressed && styles.materialSheetOptionPressed,
      ]}
      onPress={() => onSelect(material)}
      accessibilityRole="button"
      accessibilityLabel={`Add ${material.label} entry${material.name ? `, ${material.name}` : ""}`}
      testID={`pipe-entry-material-${material.key}`}
    >
      <View style={[styles.materialSheetDot, { backgroundColor: material.color }]} />
      <View style={styles.materialSheetOptionText}>
        <Text style={styles.materialSheetOptionLabel}>{material.label}</Text>
        {material.name ? <Text style={styles.materialSheetOptionName}>{material.name}</Text> : null}
      </View>
      <Icon source="chevron-right" size={moderateScale(20)} color={colors.textSecondary} />
    </Pressable>
  ));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.materialSheetOverlay, { paddingTop: topSpace }]}>
        <Pressable style={styles.materialSheetBackdrop} onPress={onClose} accessibilityLabel="Close material picker" accessibilityRole="button" />
        <View
          style={[styles.materialSheetCard, { maxHeight: maxSheetHeight, paddingBottom: bottomPadding }]}
          accessibilityViewIsModal
          testID="pipe-entry-material-sheet"
        >
          <View style={styles.materialSheetHeader}>
            <View style={styles.materialSheetHeaderText}>
              <Text style={styles.materialSheetTitle}>Choose material</Text>
              <Text style={styles.materialSheetSubtitle}>Select material for your new entry</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.materialSheetClose, pressed && styles.materialSheetClosePressed]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close material picker"
              hitSlop={4}
            >
              <Icon source="close" size={moderateScale(20)} color={colors.textDark} />
            </Pressable>
          </View>
          {shouldScroll ? (
            <ScrollView
              style={[styles.materialSheetOptions, { maxHeight: maxOptionsHeight }]}
              contentContainerStyle={styles.materialSheetOptionsContent}
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="never"
            >
              {options}
            </ScrollView>
          ) : (
            <View style={styles.materialSheetOptions}>{options}</View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const PipeDistributoryOverview = ({
  pipeData = EMPTY_PIPE_DATA,
  onAddEntry,
  onPipeLayingReports,
  onWorkStatus,
  isRefreshing = false,
  onRefresh,
  canAddEntry = true,
  canViewReports = true,
  canViewWorkStatus = true,
}) => {
  const { width, height, fontScale: systemFontScale } = useWindowDimensions();
  const [viewport, setViewport] = React.useState(null);
  const availableWidth = viewport?.width || width;
  const availableHeight = viewport?.height || height;
  const compact = availableHeight < 720 && systemFontScale < 1.3;
  const inlineActions = availableWidth >= 380 && systemFontScale < 1.3;
  const [selectedAction, setSelectedAction] = React.useState(null);
  const [isEntryMaterialSheetOpen, setIsEntryMaterialSheetOpen] = React.useState(false);
  const [selectedMaterialKey, setSelectedMaterialKey] = React.useState(
    pipeData?.[0]?.key || EMPTY_PIPE_DATA[0].key,
  );
  const safePipeData = pipeData?.length ? pipeData : EMPTY_PIPE_DATA;
  const totalLaid = safePipeData.reduce(
    (total, item) => total + Number(item.laid || 0),
    0,
  );
  const totalPlanned = safePipeData.reduce(
    (total, item) => total + Number(item.planned || 0),
    0,
  );
  const overallProgress = getPercent(totalLaid, totalPlanned);
  const selectedMaterial =
    safePipeData.find((item) => item.key === selectedMaterialKey) ||
    safePipeData[0];
  const selectedActionConfig = ACTIONS.find(
    (item) => item.key === selectedAction,
  );
  const selectedActionData = selectedActionConfig;
  const actionCallbacks = {
    add: onAddEntry,
    reports: onPipeLayingReports,
    status: onWorkStatus,
  };
  const visibleActions = ACTIONS.filter((action) =>
    action.key === "add" ? canAddEntry : action.key === "reports" ? canViewReports : canViewWorkStatus,
  );
  const showAddEntry = visibleActions.some((action) => action.key === "add");
  const secondaryActions = visibleActions.filter((action) => action.key !== "add");

  React.useEffect(() => {
    if (!safePipeData.some((item) => item.key === selectedMaterialKey)) {
      setSelectedMaterialKey(safePipeData[0]?.key);
    }
  }, [safePipeData, selectedMaterialKey]);

  const handleAction = (action) => {
    if (action.key === "add") {
      setIsEntryMaterialSheetOpen(true);
      return;
    }

    const callback = actionCallbacks[action.key];

    if (typeof callback === "function") {
      callback(selectedMaterial);
      return;
    }

    setSelectedAction(action.key);
  };

  return (
    <>
    <ScrollView
      style={styles.scroll}
      refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined}
      onLayout={({ nativeEvent: { layout } }) => {
        setViewport((previous) => previous?.width === layout.width && previous?.height === layout.height
          ? previous : { width: layout.width, height: layout.height });
      }}
      contentContainerStyle={[styles.content, { width: "100%", maxWidth: 720, alignSelf: "center" },
        compact && { gap: 8, paddingTop: 8, paddingBottom: 16 }]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.networkSummaryCard, compact && { paddingTop: 8, paddingBottom: 8 }]}>
        <View style={styles.networkSummaryTop}>
          <Text style={styles.dashboardEyebrow}>Overall progress</Text>
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
          <View style={[styles.networkSummaryPlan, systemFontScale >= 1.3 && styles.largeTextAlignLeft]}>
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

      <View style={styles.materialSection}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Materials</Text>
          <Text style={styles.sectionHint}>Laid / planned</Text>
        </View>
        <View style={[styles.materialKpiGrid, systemFontScale >= 1.3 && { flexDirection: "column" }]}>
          {safePipeData.map((item, index) => (
            <MaterialKpiCard
              key={item.key}
              item={item}
              compact={compact}
              isLast={index === safePipeData.length - 1}
              stacked={systemFontScale >= 1.3}
            />
          ))}
        </View>
      </View>

      {visibleActions.length ? (
        <View style={styles.actionSection}>
          <View style={inlineActions ? styles.actionRow : styles.actionStack}>
            {showAddEntry ? (
              <ActionButton
                item={{ ...ACTIONS[0], label: "Add entry" }}
                selected={selectedAction === ACTIONS[0].key}
                onPress={() => handleAction(ACTIONS[0])}
                inline={inlineActions}
              />
            ) : null}
            {secondaryActions.length ? (
              <View style={[styles.actionRow, inlineActions && { flex: 2 }]}>
                {secondaryActions.map((action) => (
                  <ActionButton
                    key={action.key}
                    item={action}
                    selected={selectedAction === action.key}
                    onPress={() => handleAction(action)}
                    inline={inlineActions}
                  />
                ))}
              </View>
            ) : null}
          </View>

          {selectedActionData ? (
            <View style={styles.actionNotice}>
              <Icon source="information-outline" size={moderateScale(17)} color={colors.primaryBlue} />
              <Text style={styles.actionNoticeTitle}>{selectedActionData.title}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.chartCard}>
        <View style={[styles.chartHeader, systemFontScale >= 1.3 && { flexDirection: "column" }]}>
          <Text style={styles.sectionTitle}>Work progress</Text>
          <View style={[styles.chartPlannedWrap, systemFontScale >= 1.3 && styles.largeTextAlignLeft]}>
            <Text style={styles.chartPlannedLabel}>Planned</Text>
            <Text selectable style={styles.chartPlannedValue}>
              {formatCompactLength(selectedMaterial.planned)}
            </Text>
          </View>
        </View>
        <View style={styles.progressMaterialSelector} accessibilityRole="tablist">
          {safePipeData.map((item) => {
            const isSelected = item.key === selectedMaterial.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setSelectedMaterialKey(item.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${item.label} work progress`}
                style={({ pressed }) => [
                  styles.progressMaterialTab,
                  isSelected && styles.progressMaterialTabSelected,
                  pressed && styles.progressMaterialTabPressed,
                ]}
              >
                <View style={[styles.materialKpiDot, { backgroundColor: item.color }]} />
                <Text
                  style={[styles.progressMaterialTabText, isSelected && styles.progressMaterialTabTextSelected]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <StageProgressList material={selectedMaterial} largeText={systemFontScale >= 1.3} />
      </View>
    </ScrollView>
    <MaterialEntrySheet
      visible={isEntryMaterialSheetOpen}
      materials={safePipeData}
      onSelect={(material) => {
        setIsEntryMaterialSheetOpen(false);
        if (typeof onAddEntry === "function") onAddEntry(material);
      }}
      onClose={() => setIsEntryMaterialSheetOpen(false)}
    />
    </>
  );
};

const styles = StyleSheet.create({
  materialSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.projectModalOverlay,
  },

  materialSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  materialSheetCard: {
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(14),
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    borderCurve: "continuous",
    backgroundColor: colors.white,
  },

  materialSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },

  materialSheetHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: verticalScale(2),
  },

  materialSheetTitle: {
    fontSize: moderateScale(18),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  materialSheetSubtitle: {
    fontSize: moderateScale(12),
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  materialSheetClose: {
    width: moderateScale(44),
    height: moderateScale(44),
    minWidth: 44,
    minHeight: 44,
    borderRadius: moderateScale(22),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutralCanvas,
  },

  materialSheetClosePressed: {
    opacity: 0.65,
  },

  materialSheetOptions: {
    marginTop: verticalScale(14),
    flexShrink: 1,
    borderRadius: moderateScale(13),
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.filterPanelSurface,
  },

  materialSheetOptionsContent: {
    flexGrow: 0,
  },

  materialSheetOption: {
    minHeight: moderateScale(58),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(10),
  },

  materialSheetOptionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutralBorder,
  },

  materialSheetOptionPressed: {
    backgroundColor: colors.surfaceBluePale,
  },

  materialSheetDot: {
    width: moderateScale(9),
    height: moderateScale(9),
    borderRadius: moderateScale(5),
  },

  materialSheetOptionText: {
    flex: 1,
    minWidth: 0,
    gap: verticalScale(1),
  },

  materialSheetOptionLabel: {
    fontSize: moderateScale(14),
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },

  materialSheetOptionName: {
    fontSize: moderateScale(11),
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.neutralCanvas,
  },

  content: {
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(24),
    gap: verticalScale(12),
  },

  networkSummaryCard: {
    paddingHorizontal: moderateScale(13),
    paddingTop: verticalScale(11),
    paddingBottom: verticalScale(10),
    borderRadius: moderateScale(17),
    borderCurve: "continuous",
    backgroundColor: colors.white,
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
    fontSize: fontScale(10),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  networkSummaryValue: {
    marginTop: verticalScale(1),
    fontSize: fontScale(19),
    fontFamily: fonts.bold,
    color: colors.textDark,
    fontVariant: ["tabular-nums"],
  },

  networkSummaryPlan: {
    flexShrink: 1,
    alignItems: "flex-end",
  },

  largeTextAlignLeft: {
    alignItems: "flex-start",
  },

  networkSummaryPlanValue: {
    marginTop: verticalScale(1),
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
    color: colors.textDark,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },

  dashboardEyebrow: {
    fontSize: fontScale(13),
    fontFamily: fonts.semiBold,
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
    backgroundColor: colors.surfaceBluePale,
  },

  overallBadgeValue: {
    fontSize: fontScale(11.5),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    fontVariant: ["tabular-nums"],
  },

  materialKpiGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.white,
    borderRadius: moderateScale(14),
    borderCurve: "continuous",
    overflow: "hidden",
  },

  materialSection: {
    gap: verticalScale(7),
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: moderateScale(8),
  },

  sectionHint: {
    fontSize: fontScale(10),
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  materialKpiCard: {
    flex: 1,
    minWidth: 0,
    minHeight: verticalScale(91),
    paddingHorizontal: moderateScale(8),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(7),
  },

  materialKpiDivider: {
    borderRightWidth: 1,
    borderRightColor: colors.neutralBorder,
  },

  materialKpiDividerStacked: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralBorder,
  },

  materialKpiHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    color: colors.textDark,
  },

  materialKpiValueRow: {
    marginTop: verticalScale(6),
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: moderateScale(2),
  },

  materialKpiPercent: {
    fontSize: fontScale(9),
    fontFamily: fonts.bold,
    fontVariant: ["tabular-nums"],
    color: colors.textSecondary,
  },

  materialKpiValue: {
    flex: 1,
    minWidth: 0,
    fontSize: fontScale(14),
    lineHeight: fontScale(17),
    fontFamily: fonts.bold,
    color: colors.textDark,
    fontVariant: ["tabular-nums"],
  },

  materialKpiPlanned: {
    width: "100%",
    marginTop: verticalScale(2),
    fontSize: fontScale(10),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },

  materialKpiTrack: {
    marginTop: "auto",
    height: verticalScale(4),
    borderRadius: moderateScale(999),
    backgroundColor: colors.neutralBorder,
    overflow: "hidden",
  },

  materialKpiProgress: {
    height: "100%",
    borderRadius: moderateScale(999),
  },

  totalSummaryTrack: {
    marginTop: verticalScale(7),
    height: verticalScale(4),
    borderRadius: moderateScale(999),
    backgroundColor: colors.neutralBorder,
    overflow: "hidden",
  },

  totalSummaryProgress: {
    height: "100%",
    borderRadius: moderateScale(999),
    backgroundColor: colors.primaryBlue,
  },

  actionSection: {
    gap: verticalScale(6),
  },

  sectionTitle: {
    fontSize: fontScale(15),
    lineHeight: fontScale(20),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  actionRow: {
    flexDirection: "row",
    gap: moderateScale(8),
  },

  actionStack: {
    gap: moderateScale(8),
  },

  actionButton: {
    flex: 1,
    minWidth: 0,
    minHeight: verticalScale(48),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(7),
    gap: moderateScale(7),
    borderRadius: moderateScale(12),
    borderCurve: "continuous",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
  },

  actionButtonPrimary: {
    flex: 0,
    minHeight: verticalScale(48),
    justifyContent: "center",
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(12),
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },

  actionButtonPrimaryInline: {
    flex: 1,
  },

  actionButtonSelected: {
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
  },

  actionButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },

  actionIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    flexShrink: 0,
    borderRadius: moderateScale(8),
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceBluePale,
  },

  actionIconPrimary: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(8),
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  actionTextGroup: {
    flexShrink: 1,
    minWidth: 0,
    alignItems: "center",
  },

  actionLabel: {
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    textAlign: "center",
  },

  actionLabelPrimary: {
    fontSize: fontScale(12),
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

  chartCard: {
    padding: moderateScale(13),
    borderRadius: moderateScale(14),
    borderCurve: "continuous",
    backgroundColor: colors.white,
  },

  chartHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },

  chartPlannedWrap: {
    alignItems: "flex-end",
  },

  chartPlannedLabel: {
    fontSize: fontScale(9),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  chartPlannedValue: {
    marginTop: verticalScale(1),
    fontSize: fontScale(11.5),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    fontVariant: ["tabular-nums"],
  },

  progressMaterialSelector: {
    marginTop: verticalScale(11),
    flexDirection: "row",
    gap: moderateScale(3),
    padding: moderateScale(3),
    borderRadius: moderateScale(12),
    borderCurve: "continuous",
    backgroundColor: colors.neutralCanvas,
  },

  progressMaterialTab: {
    flex: 1,
    minWidth: 0,
    minHeight: verticalScale(40),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(5),
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(10),
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.transparent,
  },

  progressMaterialTabSelected: {
    borderColor: colors.neutralBorder,
    backgroundColor: colors.white,
  },

  progressMaterialTabPressed: {
    opacity: 0.75,
  },

  progressMaterialTabText: {
    fontSize: fontScale(11),
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },

  progressMaterialTabTextSelected: {
    color: colors.primaryBlue,
  },

  stageProgressList: {
    marginTop: verticalScale(8),
  },

  stageProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    minHeight: verticalScale(77),
    paddingVertical: verticalScale(8),
  },

  stageProgressRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutralBorder,
  },

  stageRowDetails: {
    flex: 1,
    minWidth: 0,
    gap: verticalScale(4),
  },

  stageRowHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },

  stageRowMetrics: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: moderateScale(4),
  },

  stageRowMetricsStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 0,
  },

  stageCardTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: fontScale(12),
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },

  stageDonut: {
    alignItems: "center",
    justifyContent: "center",
  },

  stageDonutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  stageDonutPercent: {
    maxWidth: "80%",
    fontSize: fontScale(14),
    fontFamily: fonts.bold,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    color: colors.textDark,
  },

  stageCardMetricValue: {
    fontSize: fontScale(14),
    fontFamily: fonts.bold,
    fontVariant: ["tabular-nums"],
    color: colors.textDark,
  },

  stageCardPlanned: {
    flexShrink: 1,
    fontSize: fontScale(10),
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  stageCardTrack: {
    width: "100%",
    height: verticalScale(4),
    marginTop: verticalScale(2),
    overflow: "hidden",
    borderRadius: moderateScale(99),
    backgroundColor: colors.neutralBorder,
  },

  stageCardProgress: {
    height: "100%",
    borderRadius: moderateScale(99),
  },
});

export default PipeDistributoryOverview;
