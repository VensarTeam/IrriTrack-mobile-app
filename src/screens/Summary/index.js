import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, IconButton } from "react-native-paper";
import { OMS_SUBPROCESS_FILTER_OPTIONS } from "../../constants/omsFilterConfig";
import { fetchPhaseSummary } from "../../services/summaryService";
import colors from "../../constants/colors";
import styles from "./styles";

const ALL_SUBPROCESS_ID = "all";
const ALL_SUBPROCESS_OPTION = {
  id: ALL_SUBPROCESS_ID,
  key: "all",
  label: "All",
  shortLabel: "All",
};
const SUBPROCESS_OPTIONS = [ALL_SUBPROCESS_OPTION, ...OMS_SUBPROCESS_FILTER_OPTIONS];
const DEFAULT_SUBPROCESS_ID = ALL_SUBPROCESS_ID;

const PHASE_COLORS = {
  "phase-1": { border: colors.phase1BorderColor, text: colors.phase1Text },
  "phase-2": { border: colors.phase1BorderColor, text: colors.phase1Text },
};

const PHASES = [
  {
    id: "phase-1",
    name: "Phase 1",
    apiPhase: "Phase-1",
  },
  {
    id: "phase-2",
    name: "Phase 2",
    apiPhase: "Phase-2",
  },
];

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");
const formatAreaValue = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const formatZoneName = (value = "") =>
  String(value || "").trim().toUpperCase();

const createEmptyPhaseData = () => ({
  summary: {
    totalOms: 0,
    areaHa: 0,
    totalZone: 0,
    completedOms: 0,
    completedAreaHa: 0,
    pedestal: 0,
    mechanical: 0,
    automation: 0,
    commissioning: 0,
  },
  zones: [],
  meta: null,
  isLoading: false,
  isLoadingMore: false,
  error: "",
});

const createInitialPhaseData = () =>
  PHASES.reduce((acc, phase) => {
    acc[phase.id] = createEmptyPhaseData();
    return acc;
  }, {});

const SummaryScreen = ({ navigation, route }) => {
  const [selectedSubprocessId, setSelectedSubprocessId] = useState(DEFAULT_SUBPROCESS_ID);
  const [expandedPhaseIds, setExpandedPhaseIds] = useState({
    "phase-1": true,
    "phase-2": false,
  });
  const [phaseDataById, setPhaseDataById] = useState(createInitialPhaseData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const phaseRequestKeysRef = useRef({});

  const module = route?.params?.module || "OMS";
  const project = route?.params?.project || {};
  const projectId =
    route?.params?.projectId || project?.id || project?.projectId || "";
  const projectName =
    route?.params?.projectName || route?.params?.project?.name || "Project";
  const isAllFilterSelected = selectedSubprocessId === ALL_SUBPROCESS_ID;
  const selectedSubprocessIdForApi = isAllFilterSelected ? null : selectedSubprocessId;

  const loadPhaseData = useCallback(
    async (phase, { page = 1, append = false, forceRefresh = false } = {}) => {
      const requestKey = [
        phase.id,
        selectedSubprocessIdForApi,
        page,
        append ? "append" : "replace",
        Date.now(),
      ].join(":");
      phaseRequestKeysRef.current[phase.id] = requestKey;

      if (!projectId) {
        setPhaseDataById((current) => ({
          ...current,
          [phase.id]: {
            ...current[phase.id],
            isLoading: false,
            isLoadingMore: false,
            error: "Project details are missing for this summary.",
          },
        }));
        return;
      }

      setPhaseDataById((current) => ({
        ...current,
        [phase.id]: {
          ...(current[phase.id] || createEmptyPhaseData()),
          isLoading: !append,
          isLoadingMore: append,
          error: "",
        },
      }));

      try {
        const response = await fetchPhaseSummary({
          projectId,
          subprocessId: selectedSubprocessIdForApi,
          phase: phase.apiPhase,
          deviceType: String(module || "OMS").toLowerCase(),
          page,
          forceRefresh,
        });

        setPhaseDataById((current) => {
          if (phaseRequestKeysRef.current[phase.id] !== requestKey) {
            return current;
          }

          const previous = current[phase.id] || createEmptyPhaseData();
          return {
            ...current,
            [phase.id]: {
              ...previous,
              summary: response.phase,
              zones: append
                ? [...previous.zones, ...response.zones]
                : response.zones,
              meta: response.meta,
              isLoading: false,
              isLoadingMore: false,
              error: "",
            },
          };
        });
      } catch (error) {
        setPhaseDataById((current) => ({
          ...current,
          [phase.id]:
            phaseRequestKeysRef.current[phase.id] === requestKey
              ? {
                  ...(current[phase.id] || createEmptyPhaseData()),
                  isLoading: false,
                  isLoadingMore: false,
                  error: append
                    ? current[phase.id]?.error || ""
                    : error?.message || "Unable to load summary.",
                }
              : current[phase.id],
        }));
      }
    },
    [module, projectId, selectedSubprocessIdForApi]
  );

  const refreshExpandedPhases = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all(
        PHASES.filter((phase) => expandedPhaseIds[phase.id]).map((phase) =>
          loadPhaseData(phase, { forceRefresh: true })
        )
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [expandedPhaseIds, loadPhaseData]);

  useEffect(() => {
    setPhaseDataById(createInitialPhaseData());
    PHASES.forEach((phase) => {
      if (expandedPhaseIds[phase.id]) {
        void loadPhaseData(phase);
      }
    });
  }, [loadPhaseData]);

  const togglePhase = (phaseId) => {
    const nextExpanded = !expandedPhaseIds[phaseId];
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPhaseIds((current) => ({
      ...current,
      [phaseId]: nextExpanded,
    }));

    const phase = PHASES.find((item) => item.id === phaseId);
    const phaseData = phaseDataById[phaseId];
    if (nextExpanded && phase && !phaseData?.zones?.length && !phaseData?.isLoading) {
      void loadPhaseData(phase);
    }
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
      </View>

      <View style={styles.floatingFilterSection}>
        <View style={styles.floatingFilterHeader}>
          <View style={styles.floatingTitleRow}>
            <Icon source="filter-variant" size={18} color={colors.textSecondary} />
            <Text style={styles.floatingFilterTitle}>Filter</Text>
          </View>
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
                onPress={() => {
                  if (!active) {
                    setSelectedSubprocessId(option.id);
                  }
                }}
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshExpandedPhases}
            tintColor={colors.primaryBlue}
            colors={[colors.primaryBlue]}
          />
        }
      >
        {PHASES.map((phase) => {
          const expanded = Boolean(expandedPhaseIds[phase.id]);
          const phaseData = phaseDataById[phase.id] || createEmptyPhaseData();
          const phaseSummary = phaseData.summary;
          const hasNextPage = Boolean(phaseData.meta?.hasNextPage);
          const nextPage = Number(phaseData.meta?.page || 1) + 1;

          return (
            <View
              key={phase.id}
              style={[
                styles.phaseShell,
                { borderColor: PHASE_COLORS[phase.id]?.border || colors.cardBorder, borderWidth: 1 },
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
                  <View
                    style={[
                      styles.phasePill,
                      {
                        borderColor: PHASE_COLORS[phase.id]?.border || colors.primaryBlue,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.phasePillText,
                        {
                          color: PHASE_COLORS[phase.id]?.text || colors.primaryBlue,
                        },
                      ]}
                    >
                      {phase.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.phaseRight}>
                  <View style={[styles.chevronContainer, { borderColor: PHASE_COLORS[phase.id]?.border || colors.cardBorder }]}>
                    <Icon
                      source={expanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={PHASE_COLORS[phase.id]?.text || colors.textSecondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {expanded ? (
                <View style={styles.phaseTableContainer}>
                  {isAllFilterSelected ? (
                    <View style={styles.tableDefaultContent}>
                      <View style={styles.tableHeaderRow}>
                        <View style={[styles.tableCellZone, styles.tableCellZoneAll, styles.tableHeaderCell, styles.tableHeaderCellZone]}>
                          <Text style={styles.tableHeaderLabelZone} numberOfLines={2}>ZONE</Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableCellAll, styles.tableHeaderCell]}>
                          <Text style={styles.tableHeaderLabel} numberOfLines={2}>TOT OMS</Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableCellAll, styles.tableHeaderCell]}>
                          <Text style={styles.tableHeaderLabel} numberOfLines={2}>Pedestal</Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableCellAll, styles.tableHeaderCell]}>
                          <Text style={styles.tableHeaderLabel} numberOfLines={2}>Mech</Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableCellAll, styles.tableHeaderCell]}>
                          <Text style={styles.tableHeaderLabel} numberOfLines={2}>Auto</Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableCellAll, styles.tableHeaderCell, styles.tableCellLast]}>
                          <Text style={styles.tableHeaderLabel} numberOfLines={2}>Comm.</Text>
                        </View>
                      </View>

                      <View style={styles.tableTotalRow}>
                        <View style={[styles.tableCellZone, styles.tableCellZoneAll, styles.tableTotalCell]}>
                          <Text style={styles.tableHeaderValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                            {formatNumber(phaseSummary.totalZone)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableCellAll, styles.tableTotalCell]}>
                          <Text style={styles.tableHeaderValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                            {formatNumber(phaseSummary.totalOms)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableCellAll, styles.tableTotalCell]}>
                          <Text style={styles.tableHeaderValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                            {formatNumber(phaseSummary.pedestal)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableCellAll, styles.tableTotalCell]}>
                          <Text style={styles.tableHeaderValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                            {formatNumber(phaseSummary.mechanical)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableCellAll, styles.tableTotalCell]}>
                          <Text style={styles.tableHeaderValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                            {formatNumber(phaseSummary.automation)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableCellAll, styles.tableTotalCell, styles.tableCellLast]}>
                          <Text style={styles.tableHeaderValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                            {formatNumber(phaseSummary.commissioning)}
                          </Text>
                        </View>
                      </View>

                      {phaseData.isLoading ? (
                        <View style={styles.tableState}>
                          <ActivityIndicator size="small" color={colors.primaryBlue} />
                          <Text style={styles.tableStateText}>Loading summary...</Text>
                        </View>
                      ) : phaseData.error ? (
                        <View style={styles.tableState}>
                          <Text style={styles.tableErrorText}>{phaseData.error}</Text>
                          <TouchableOpacity
                            style={styles.tableRetryButton}
                            onPress={() => loadPhaseData(phase)}
                            activeOpacity={0.82}
                          >
                            <Text style={styles.tableRetryText}>Retry</Text>
                          </TouchableOpacity>
                        </View>
                      ) : phaseData.zones.length ? (
                        phaseData.zones.map((zone, index) => (
                          <View
                            key={zone.id}
                            style={[
                              styles.tableDataRow,
                              index % 2 === 1 && styles.tableDataRowAlt,
                            ]}
                          >
                            <View style={[styles.tableCellZone, styles.tableCellZoneAll]}>
                              <Text
                                style={styles.tableDataLabelZone}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.68}
                                ellipsizeMode="tail"
                              >
                                {formatZoneName(zone.zoneName)}
                              </Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellAll]}>
                              <Text style={styles.tableDataLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{formatNumber(zone.totalOms)}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellAll]}>
                              <Text style={styles.tableDataLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{formatNumber(zone.pedestal)}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellAll]}>
                              <Text style={styles.tableDataLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{formatNumber(zone.mechanical)}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellAll]}>
                              <Text style={styles.tableDataLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{formatNumber(zone.automation)}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellAll, styles.tableCellLast]}>
                              <Text style={styles.tableDataLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{formatNumber(zone.commissioning)}</Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <View style={styles.tableState}>
                          <Text style={styles.tableStateText}>No summary data found.</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.tableDefaultContent}>
                      <View style={styles.tableHeaderRow}>
                        <View style={[styles.tableCellZone, styles.tableHeaderCell, styles.tableHeaderCellZone]}>
                          <Text style={styles.tableHeaderLabelZone} numberOfLines={2}>ZONE</Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableHeaderCell]}>
                          <Text style={styles.tableHeaderLabel} numberOfLines={2}>TOT OMS</Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableHeaderCell]}>
                          <Text style={styles.tableHeaderLabel} numberOfLines={2}>TOT Area{"\n"}(HA)</Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableHeaderCell]}>
                          <Text style={styles.tableHeaderLabel} numberOfLines={2}>Completed</Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellLast]}>
                          <Text style={styles.tableHeaderLabel} numberOfLines={2}>Cov Area{"\n"}(HA)</Text>
                        </View>
                      </View>

                      <View style={styles.tableTotalRow}>
                        <View style={[styles.tableCellZone, styles.tableTotalCell]}>
                          <Text style={styles.tableHeaderValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
                            {formatNumber(phaseSummary.totalZone)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableTotalCell]}>
                          <Text style={styles.tableHeaderValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
                            {formatNumber(phaseSummary.totalOms)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableTotalCell]}>
                          <Text style={styles.tableHeaderValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
                            {formatAreaValue(phaseSummary.areaHa)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableTotalCell]}>
                          <Text style={styles.tableHeaderValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
                            {formatNumber(phaseSummary.completedOms)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, styles.tableTotalCell, styles.tableCellLast]}>
                          <Text style={styles.tableHeaderValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
                            {formatAreaValue(phaseSummary.completedAreaHa)}
                          </Text>
                        </View>
                      </View>

                      {phaseData.isLoading ? (
                        <View style={styles.tableState}>
                          <ActivityIndicator size="small" color={colors.primaryBlue} />
                          <Text style={styles.tableStateText}>Loading summary...</Text>
                        </View>
                      ) : phaseData.error ? (
                        <View style={styles.tableState}>
                          <Text style={styles.tableErrorText}>{phaseData.error}</Text>
                          <TouchableOpacity
                            style={styles.tableRetryButton}
                            onPress={() => loadPhaseData(phase)}
                            activeOpacity={0.82}
                          >
                            <Text style={styles.tableRetryText}>Retry</Text>
                          </TouchableOpacity>
                        </View>
                      ) : phaseData.zones.length ? (
                        phaseData.zones.map((zone, index) => (
                          <View
                            key={zone.id}
                            style={[
                              styles.tableDataRow,
                              index % 2 === 1 && styles.tableDataRowAlt,
                            ]}
                          >
                            <View style={styles.tableCellZone}>
                              <Text
                                style={styles.tableDataLabelZone}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.72}
                                ellipsizeMode="tail"
                              >
                                {formatZoneName(zone.zoneName)}
                              </Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text style={styles.tableDataLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{formatNumber(zone.totalOms)}</Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text style={styles.tableDataLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{formatAreaValue(zone.areaHa)}</Text>
                            </View>
                            <View style={styles.tableCell}>
                              <Text style={styles.tableDataLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{formatNumber(zone.completedOms)}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableCellLast]}>
                              <Text style={styles.tableDataLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{formatAreaValue(zone.completedAreaHa)}</Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <View style={styles.tableState}>
                          <Text style={styles.tableStateText}>No summary data found.</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {hasNextPage ? (
                    <TouchableOpacity
                      style={styles.loadMoreButton}
                      onPress={() =>
                        loadPhaseData(phase, {
                          page: nextPage,
                          append: true,
                        })
                      }
                      disabled={phaseData.isLoadingMore}
                      activeOpacity={0.82}
                    >
                      {phaseData.isLoadingMore ? (
                        <ActivityIndicator size="small" color={colors.primaryBlue} />
                      ) : (
                        <Text style={styles.loadMoreText}>Load more zones</Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
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
