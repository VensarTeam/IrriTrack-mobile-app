import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SearchableFilterModal from "../../components/SearchableFilterModal";
import { fetchPipeDailyWorks, fetchPipeWorkFilterOptions } from "../../services/pipeDailyWorkApi";
import colors from "../../constants/colors";
import { displayDate, formatNumber, localDate, normalizeReports, readRows } from "./report-data";
import styles from "./styles";
import { useAuth } from "../../context/AuthContext";
import { getPipeCache, savePipeCache } from "../../services/pipeNetworkOfflineStore";

const EMPTY_FILTERS = { search: "", location: "All", label: "All", from: "", to: "" };
const STAGES = { excavation: "Excavation", pipe_laying: "Pipe laying", backfilling: "Backfilling" };

function FilterButton({ title, icon, onPress, active = false }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.filter, active && styles.filterActive, pressed && styles.pressed]}>
    <Icon source={active ? "check" : icon} size={16} color={active ? colors.primaryBlue : colors.textSecondary} />
    <Text style={styles.filterText}>{title}</Text>
    <Icon source="chevron-down" size={16} color={colors.textSecondary} />
  </Pressable>;
}

const ReportCard = React.memo(function ReportCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const stageColour = colors.pipeStage[item.type] || colors.pipeStage.pipe_laying;
  return <View style={styles.card}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${expanded ? "Hide" : "Show"} details for ${item.label || "pipe"}`} accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={({ pressed }) => [styles.cardSummary, pressed && styles.pressed]}>
    <View style={styles.cardTop}>
      <View style={[styles.row, styles.grow]}>
        <Text selectable style={styles.title}>{item.label || "Unlabelled pipe"}</Text>
        {!!item.location && <View style={styles.badge}><Text style={styles.badgeText}>{item.location}</Text></View>}
      </View>
      <Text style={styles.muted}>{displayDate(item.date)}</Text>
    </View>
    <View style={styles.nodes}>
      <Icon source="vector-polyline" size={17} color={colors.primaryBlue} />
      <Text selectable style={styles.node}>{item.start || "—"} → {item.end || "—"}</Text>
      <Text style={styles.muted}>{item.material || ""}</Text>
    </View>
    <View style={styles.metrics}>
      <Text style={[styles.muted, styles.grow]}>Ch. <Text style={styles.value}>{formatNumber(item.from)} → {formatNumber(item.to)}</Text> m</Text>
      <View style={styles.laidMetric}><Text style={[styles.value, styles.laid]}>{formatNumber(item.laid)} <Text style={styles.unit}>m laid</Text></Text></View>
    </View>
    <View style={styles.compactFooter}>
      <View style={styles.grow}><View style={[styles.stage, styles.stageChip, { backgroundColor: stageColour.surface }]}><Icon source={item.type === "excavation" ? "shovel" : item.type === "backfilling" ? "layers-outline" : "pipe"} size={14} color={stageColour.text} /><Text style={[styles.stageText, { color: stageColour.text }]}>{STAGES[item.type] || item.type || "All stages"}</Text></View></View>
      <Text style={styles.muted}>{expanded ? "Less" : "Details"}</Text>
      <Icon source={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.primaryBlue} />
    </View>
    </Pressable>
    {expanded && <View style={styles.details}>
      <Text style={styles.muted}>Contractor</Text>
      <Text selectable style={styles.detailText}>{item.contractor || "Contractor not assigned"}</Text>
      <View style={styles.row}>
        <View style={styles.metric}><Text style={styles.muted}>Design diameter</Text><Text selectable style={styles.value}>{formatNumber(item.design)} mm</Text></View>
        <View style={styles.metric}><Text style={styles.muted}>Actual diameter</Text><Text selectable style={styles.value}>{formatNumber(item.actual)} mm</Text></View>
      </View>
      <Text style={styles.muted}>Remark</Text>
      <Text selectable style={styles.detailText}>{item.remark || "No remark added"}</Text>
    </View>}
  </View>;
});

export default function PipeDailyReportScreen({ route }) {
  const { projectId } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [picker, setPicker] = useState(null);
  const [dateField, setDateField] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalLaidLengthM, setTotalLaidLengthM] = useState(0);
  const [locations, setLocations] = useState(["All"]);
  const [labels, setLabels] = useState(["All"]);
  const requestBusy = useRef(false);
  const lastQuery = useRef("");
  const loadedIds = useRef(new Set());
  const controllerRef = useRef(null);
  const load = useCallback(async (nextPage = 1) => {
    if (nextPage > 1 && requestBusy.current) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    requestBusy.current = true;
    setLoading(nextPage === 1);
    setLoadingMore(nextPage > 1);
    const query = `${projectId}|${filters.search}|${filters.location}|${filters.label}|${filters.from}|${filters.to}`;
    if (query !== lastQuery.current) {
      setRows(null);
      setPage(0);
      setHasMore(false);
      lastQuery.current = query;
    }
    setError("");
    const resource = `daily-report:${query}:${nextPage}`;
    if (nextPage === 1) {
      const cached = await getPipeCache({ ownerUserId: user?.id, projectId, resource });
      if (cached?.payload && !controller.signal.aborted) {
        const cachedRows = normalizeReports(readRows(cached.payload));
        setRows(cachedRows);
        setTotalCount(Number(cached.payload?.totalCount ?? cachedRows.length));
        setTotalLaidLengthM(Number(cached.payload?.totalLaidLengthM ?? 0));
        setLoading(false);
      }
    }
    try {
      if (!projectId) throw new Error("Project is missing. Go back and open this report from your project.");
      const works = await fetchPipeDailyWorks({ projectId, signal: controller.signal, page: nextPage, limit: 20, fromDate: filters.from, toDate: filters.to, q: filters.search.trim() || undefined, location: filters.location === "All" ? undefined : filters.location, label: filters.label === "All" ? undefined : filters.label });
      if (!controller.signal.aborted) {
        const incoming = normalizeReports(readRows(works));
        const hasNewRecords = incoming.some((item) => !loadedIds.current.has(item.id));
        if (nextPage === 1) loadedIds.current.clear();
        incoming.forEach((item) => loadedIds.current.add(item.id));
        setRows((previous) => nextPage === 1 ? incoming : [...new Map([...(previous || []), ...incoming].map((item) => [item.id, item])).values()]);
        setPage(nextPage);
        const nextTotal = Number(works?.totalCount ?? incoming.length);
        setTotalCount(nextTotal);
        setTotalLaidLengthM(Number(works?.totalLaidLengthM ?? 0));
        setHasMore(nextPage * 20 < nextTotal && (nextPage === 1 || hasNewRecords));
        await savePipeCache({ ownerUserId: user?.id, projectId, resource, payload: works });
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message || "Could not load daily reports. Please try again.");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
        requestBusy.current = false;
      }
    }
  }, [projectId, filters.from, filters.label, filters.location, filters.search, filters.to, user?.id]);
  useFocusEffect(useCallback(() => {
    const timer = setTimeout(() => load(), filters.search ? 350 : 0);
    return () => { clearTimeout(timer); controllerRef.current?.abort(); };
  }, [load]));

  useFocusEffect(useCallback(() => {
    if (!projectId) return undefined;
    let active = true;
    Promise.all([
      fetchPipeWorkFilterOptions({ projectId, field: "location", page: 1, limit: 100 }),
      fetchPipeWorkFilterOptions({ projectId, field: "label", page: 1, limit: 100 }),
    ]).then(([locationResponse, labelResponse]) => {
      if (!active) return;
      setLocations(["All", ...(locationResponse?.items || []).map((item) => item.value)]);
      setLabels(["All", ...(labelResponse?.items || []).map((item) => item.value)]);
    }).catch(() => {});
    return () => { active = false; };
  }, [projectId]));

  const filtered = rows || [];
  const hasFilters = Object.keys(EMPTY_FILTERS).some((key) => filters[key] !== EMPTY_FILTERS[key]);
  const clear = () => { setFilters(EMPTY_FILTERS); setDateField(null); };

  const header = <View style={styles.header}>
    <View style={styles.filters}>
      <View style={styles.search}>
        <Icon source="magnify" size={20} color={colors.textSecondary} />
        <TextInput accessibilityLabel="Search start node, end node or pipe label" placeholder="Search start / end node or label" placeholderTextColor={colors.textSecondary} value={filters.search} onChangeText={(search) => setFilters((previous) => ({ ...previous, search }))} style={styles.input} returnKeyType="search" autoCorrect={false} />
        {!!filters.search && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setFilters((previous) => ({ ...previous, search: "" }))} style={styles.searchClear}><Icon source="close" size={18} color={colors.textSecondary} /></Pressable>}
      </View>
      <View style={styles.row}>
        <FilterButton active={filters.location !== "All"} title={filters.location === "All" ? "Location" : filters.location} icon="map-marker-outline" onPress={() => setPicker("location")} />
        <FilterButton active={filters.label !== "All"} title={filters.label === "All" ? "Pipe label" : filters.label} icon="pipe" onPress={() => setPicker("label")} />
      </View>
      <View style={styles.row}>
        <FilterButton active={!!filters.from} title={filters.from ? displayDate(filters.from) : "From date"} icon="calendar-blank-outline" onPress={() => setDateField("from")} />
        <FilterButton active={!!filters.to} title={filters.to ? displayDate(filters.to) : "To date"} icon="calendar-blank-outline" onPress={() => setDateField("to")} />
      </View>
      {dateField && <View>
        <DateTimePicker value={new Date(`${filters[dateField] || localDate(new Date())}T12:00:00`)} mode="date" display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={dateField === "to" && filters.from ? new Date(`${filters.from}T00:00:00`) : undefined}
          maximumDate={dateField === "from" && filters.to ? new Date(`${filters.to}T23:59:59`) : undefined}
          onChange={(event, date) => {
            if (Platform.OS !== "ios") setDateField(null);
            if (event.type !== "dismissed" && date) setFilters((previous) => ({ ...previous, [dateField]: localDate(date) }));
          }} />
        {Platform.OS === "ios" && <Pressable accessibilityRole="button" onPress={() => setDateField(null)} style={styles.clear}><Text style={styles.link}>Done</Text></Pressable>}
      </View>}
      {hasFilters && <Pressable accessibilityRole="button" onPress={clear} style={styles.clear}><Text style={styles.link}>Clear filters</Text></Pressable>}
    </View>
    {rows !== null && <View style={styles.summary}>
      <Text style={styles.muted}>{totalCount} {totalCount === 1 ? "entry" : "entries"}</Text>
      <Text style={styles.total}>Filtered total  {formatNumber(totalLaidLengthM)} m</Text>
    </View>}
    {!!error && <View style={styles.error}><Text selectable style={styles.errorText}>{rows !== null ? "Showing previously loaded records. " : ""}{error}</Text><Pressable accessibilityRole="button" onPress={() => load()} disabled={loading || loadingMore} style={styles.clear}><Text style={styles.link}>Retry</Text></Pressable></View>}
  </View>;

  return <View style={styles.screen}>
    <FlatList data={filtered} keyExtractor={(item) => item.id} renderItem={({ item }) => <ReportCard item={item} />} ListHeaderComponent={header}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20, paddingLeft: Math.max(insets.left, 14), paddingRight: Math.max(insets.right, 14) }]}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={loading && rows !== null} onRefresh={() => load()} tintColor={colors.primaryBlue} />}
      ListFooterComponent={hasMore ? <View style={styles.state}><Pressable accessibilityRole="button" disabled={loading || loadingMore} onPress={() => load(page + 1)} style={styles.button}>{loadingMore ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Load more reports</Text>}</Pressable></View> : null}
      ListEmptyComponent={loading && rows === null ? <View style={styles.state}><ActivityIndicator color={colors.primaryBlue} /><Text style={styles.stateText}>Loading daily reports…</Text></View> : error && rows === null ? null : <View style={styles.state}>
        <Icon source="clipboard-text-outline" size={34} color={colors.textSecondary} />
        <Text style={styles.stateTitle}>{hasFilters ? "No matching entries" : "No daily work recorded"}</Text>
        <Text style={styles.stateText}>{hasFilters ? "Try another date, location or pipe label." : "Daily work entries for this project will appear here."}</Text>
        {hasFilters && <Pressable accessibilityRole="button" onPress={clear} style={styles.button}><Text style={styles.buttonText}>Clear filters</Text></Pressable>}
      </View>} />
    <SearchableFilterModal visible={!!picker} title={picker === "location" ? "Select location" : "Select pipe label"} options={picker === "location" ? locations : labels} selectedValue={filters[picker] || "All"} onClose={() => setPicker(null)} onSelect={(value) => {
      setFilters((previous) => ({ ...previous, [picker]: value, ...(picker === "location" ? { label: "All" } : {}) }));
      setPicker(null);
    }} />
  </View>;
}
