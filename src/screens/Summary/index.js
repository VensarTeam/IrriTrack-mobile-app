import React, { useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, IconButton } from "react-native-paper";
import { OMS_SUBPROCESS_FILTER_OPTIONS } from "../../constants/omsFilterConfig";
import colors from "../../constants/colors";
import styles from "./styles";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SUBPROCESS_OPTIONS = [
  { id: "all", shortLabel: "All" },
  ...OMS_SUBPROCESS_FILTER_OPTIONS,
];

const PHASES = [
  {
    id: "phase-1",
    name: "Phase 1",
    icon: "numeric-1-circle-outline",
    zones: [
      { id: "01", areaHa: 420, totalOms: 96, completedOms: 78 },
      { id: "02", areaHa: 360, totalOms: 84, completedOms: 52 },
      { id: "03", areaHa: 310, totalOms: 72, completedOms: 64 },
      { id: "04", areaHa: 190, totalOms: 46, completedOms: 21 },
    ],
  },
  {
    id: "phase-2",
    name: "Phase 2",
    icon: "numeric-2-circle-outline",
    zones: [
      { id: "05", areaHa: 290, totalOms: 68, completedOms: 28 },
      { id: "06", areaHa: 320, totalOms: 74, completedOms: 44 },
      { id: "07", areaHa: 210, totalOms: 52, completedOms: 39 },
      { id: "08", areaHa: 120, totalOms: 31, completedOms: 13 },
    ],
  },
];

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");
const formatAreaValue = (value) => formatNumber(Math.round(value || 0));
const formatArea = (value) => `${formatAreaValue(value)} ha`;
const formatTableHeaderTotal = (value) => `(${value})`;

const getPercent = (value, total) => {
  if (!total) return 0;
  return Math.min(100, Math.round((Number(value) / Number(total)) * 100));
};

const getTone = (percent) => {
  if (percent >= 80) return { color: colors.completed, bg: "#EAF8F1" };
  if (percent >= 55) return { color: colors.partial, bg: "#FFF7DF" };
  return { color: colors.primaryOrange, bg: "#FFF0E3" };
};

const getZoneComputedData = (zone) => {
  const percent = getPercent(zone.completedOms, zone.totalOms);
  const completedAreaHa = zone.totalOms
    ? (zone.areaHa * zone.completedOms) / zone.totalOms
    : 0;

  return {
    percent,
    completedAreaHa,
    tone: getTone(percent),
  };
};

const getPhaseSummary = (phase) =>
  phase.zones.reduce(
    (acc, zone) => {
      const computed = getZoneComputedData(zone);
      acc.totalOms += zone.totalOms;
      acc.completedOms += zone.completedOms;
      acc.areaHa += zone.areaHa;
      acc.completedAreaHa += computed.completedAreaHa;
      return acc;
    },
    { totalOms: 0, completedOms: 0, areaHa: 0, completedAreaHa: 0 }
  );

const SummaryScreen = ({ navigation, route }) => {
  const [selectedSubprocessId, setSelectedSubprocessId] = useState("all");
  const [expandedPhaseIds, setExpandedPhaseIds] = useState({
    "phase-1": true,
    "phase-2": false,
  });

  const module = route?.params?.module || "OMS";
  const projectName =
    route?.params?.projectName || route?.params?.project?.name || "Project";
  const selectedSubprocess = SUBPROCESS_OPTIONS.find(
    (item) => item.id === selectedSubprocessId
  );

  const totals = useMemo(
    () =>
      PHASES.reduce(
        (acc, phase) => {
          const phaseSummary = getPhaseSummary(phase);
          acc.totalOms += phaseSummary.totalOms;
          acc.completedOms += phaseSummary.completedOms;
          acc.areaHa += phaseSummary.areaHa;
          acc.completedAreaHa += phaseSummary.completedAreaHa;
          return acc;
        },
        { totalOms: 0, completedOms: 0, areaHa: 0, completedAreaHa: 0 }
      ),
    []
  );

  const togglePhase = (phaseId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPhaseIds((current) => ({
      ...current,
      [phaseId]: !current[phaseId],
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={22} onPress={() => navigation.goBack()} />
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Summary</Text>
          <Text style={styles.headerMeta} numberOfLines={1}>
            {module} | {projectName}
          </Text>
        </View>
        {/* <View style={styles.headerIcon}>
          <Icon source="chart-box-outline" size={20} color={colors.primaryBlue} />
        </View> */}
      </View>

      <View style={styles.floatingFilterSection}>
        <View style={styles.floatingFilterHeader}>
          <View style={styles.floatingTitleRow}>
            <Icon source="filter-variant" size={18} color={colors.textSecondary} />
            <Text style={styles.floatingFilterTitle}>Filter</Text>
          </View>
          {/* <Text style={styles.floatingFilterValue} numberOfLines={1}>
            {selectedSubprocess?.shortLabel || selectedSubprocess?.label || "All"}
          </Text> */}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subprocessList}
        >
          {SUBPROCESS_OPTIONS.map((option) => {
            const active = option.id === selectedSubprocessId;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.subprocessChip,
                  active && styles.subprocessChipActive,
                ]}
                onPress={() => setSelectedSubprocessId(option.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subprocessChipText,
                    active && styles.subprocessChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {option.shortLabel || option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* <View style={styles.totalStrip}>
          <SummaryStat label="OMS" value={totals.totalOms} />
          <SummaryStat label="Done" value={totals.completedOms} />
          <SummaryStat label="Area" value={formatArea(totals.completedAreaHa)} wide />
        </View> */}

        {PHASES.map((phase) => {
          const expanded = Boolean(expandedPhaseIds[phase.id]);
          const phaseSummary = getPhaseSummary(phase);
          const phasePercent = getPercent(
            phaseSummary.completedOms,
            phaseSummary.totalOms
          );
          const phaseTone = getTone(phasePercent);

          return (
            <View
              key={phase.id}
              style={[
                styles.phaseShell,
                expanded && styles.phaseShellExpanded,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.phaseHeader,
                  expanded && styles.phaseHeaderExpanded,
                ]}
                onPress={() => togglePhase(phase.id)}
                activeOpacity={0.88}
              >
                <View style={styles.phaseLeft}>
                  <View style={[styles.phaseIcon, { backgroundColor: phaseTone.bg }]}>
                    <Icon source={phase.icon} size={20} color={phaseTone.color} />
                  </View>
                  <Text style={styles.phaseName}>{phase.name}</Text>
                </View>

                <View style={styles.phaseRight}>
                  <View style={[styles.chevronContainer, expanded && styles.chevronContainerExpanded]}>
                    <Icon
                      source={expanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={expanded ? colors.primaryBlue : colors.textSecondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {expanded ? (
                <View style={styles.phaseTableContainer}>
                  <View style={styles.tableHeaderRow}>
                    <View style={styles.tableCellZone}>
                      <Text style={styles.tableHeaderLabel} numberOfLines={1}>Zone</Text>
                      <Text style={styles.tableHeaderValue} numberOfLines={1}>
                        {formatTableHeaderTotal(phase.zones.length)}
                      </Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={[styles.tableHeaderLabel, { color: "#3B82F6" }]} numberOfLines={1}>TOT OMS</Text>
                      <Text style={styles.tableHeaderValue} numberOfLines={1}>
                        {formatTableHeaderTotal(formatNumber(phaseSummary.totalOms))}
                      </Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={[styles.tableHeaderLabel, { color: "#F59E0B" }]} numberOfLines={1}>TOT Area(HA)</Text>
                      <Text style={styles.tableHeaderValue} numberOfLines={1}>
                        {formatTableHeaderTotal(formatAreaValue(phaseSummary.areaHa))}
                      </Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={[styles.tableHeaderLabel, { color: "#10B981" }]} numberOfLines={1}>COMPLETED</Text>
                      <Text style={styles.tableHeaderValue} numberOfLines={1}>
                        {formatTableHeaderTotal(formatNumber(phaseSummary.completedOms))}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.tableCellLast]}>
                      <Text style={[styles.tableHeaderLabel, { color: "#8B5CF6" }]} numberOfLines={1}>Cov Area(HA)</Text>
                      <Text style={styles.tableHeaderValue} numberOfLines={1}>
                        {formatTableHeaderTotal(formatAreaValue(phaseSummary.completedAreaHa))}
                      </Text>
                    </View>
                  </View>

                  {phase.zones.map((zone) => {
                    const { completedAreaHa } = getZoneComputedData(zone);
                    return (
                      <View key={zone.id} style={styles.tableDataRow}>
                        <View style={styles.tableCellZone}>
                          <Text style={styles.tableDataLabelZone} numberOfLines={1}>Z-{zone.id}</Text>
                        </View>
                        <View style={styles.tableCell}>
                          <Text style={styles.tableDataLabel} numberOfLines={1}>{zone.totalOms}</Text>
                        </View>
                        <View style={styles.tableCell}>
                          <Text style={styles.tableDataLabel} numberOfLines={1}>{formatAreaValue(zone.areaHa)}</Text>
                        </View>
                        <View style={styles.tableCell}>
                          <Text style={styles.tableDataLabel} numberOfLines={1}>{zone.completedOms}</Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableCellLast]}>
                          <Text style={styles.tableDataLabel} numberOfLines={1}>{formatAreaValue(completedAreaHa)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SummaryScreen;
