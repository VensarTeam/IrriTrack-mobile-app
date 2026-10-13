import NetInfo from "@react-native-community/netinfo";
import { readCivilCache, saveCivilCache, clearCivilCache, civilCacheRevision } from "../../services/civilOfflineStore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, AppState, LayoutAnimation, Modal, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Icon, IconButton, Searchbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { isProjectAllowed } from "../../services/authPermissions";
import { fetchCivilRegister } from "../../services/civilApi";
import { buildCivilStatus, formatCivilNumber } from "../../services/civilStatus";
import ModuleStatusHeader from "../../components/ModuleStatusHeader";
import ImageViewerModal from "../../components/ImageViewerModal";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
const STATUS = {
  not_started: {
    label: "Not started",
    color: colors.textSecondary,
    bg: "#EDF1F5",
    icon: "circle-outline"
  },
  in_progress: {
    label: "In progress",
    color: "#8B580B",
    bg: "#FFF4DF",
    icon: "progress-clock"
  },
  completed: {
    label: "Completed",
    color: "#18774D",
    bg: "#E8F6EE",
    icon: "check-circle-outline"
  },
  blocked: {
    label: "Blocked",
    color: colors.danger,
    bg: "#FFF0F0",
    icon: "alert-circle-outline"
  }
};
const STRUCTURE_THEME = {
  intake: {
    code: "IPS",
    icon: "water-pump",
    color: colors.primaryBlue,
    surface: "#EAF2FA"
  },
  delivery: {
    code: "DC",
    icon: "water-outline",
    color: "#087E83",
    surface: "#E5F5F3"
  },
  boosting: {
    code: "BPS",
    icon: "engine-outline",
    color: "#6154A4",
    surface: "#F0ECFA"
  }
};
const Badge = ({
  status
}) => {
  const value = STATUS[status] || STATUS.not_started;
  return <View style={[s.badge, {
    backgroundColor: value.bg
  }]}><Icon source={value.icon} color={value.color} size={14} /><Text style={[s.badgeText, {
      color: value.color
    }]}>{value.label}</Text></View>;
};
function Progress({
  value
}) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) return;
      if (!reduce) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setDisplayed(value);
    });
    return () => {
      active = false;
    };
  }, [value]);
  return <View accessible accessibilityRole="progressbar" accessibilityValue={{
    min: 0,
    max: 100,
    now: value
  }} style={s.track}><LinearGradient colors={value === 100 ? ["#23865D", "#4DBD8C"] : [colors.primaryBlue, "#508AAF"]} start={{
      x: 0,
      y: 0
    }} end={{
      x: 1,
      y: 0
    }} style={[s.fill, {
      width: `${displayed}%`
    }]} /></View>;
}
const Field = ({
  label,
  value
}) => <View style={s.field}><Text style={s.muted}>{label}</Text><Text selectable style={s.fieldValue}>{value ?? "Not recorded"}</Text></View>;
const measure = (value, unit) => `${formatCivilNumber(value)}${value !== null && value !== undefined && value !== "" && unit ? ` ${unit}` : ""}`;
function Proof({
  proof,
  onPress
}) {
  const [failed, setFailed] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={failed ? "Retry proof" : proof.name || "View proof"} onPress={() => failed ? setFailed(false) : onPress()} style={s.proof}>
    {failed || !proof.url ? <><Icon source="image-off-outline" size={22} color={colors.textSecondary} /><Text style={s.muted}>Proof unavailable</Text></> : <Image source={{
      uri: proof.url
    }} onError={() => setFailed(true)} style={s.proofImage} />}
  </Pressable>;
}
export default function CivilStatusScreen({
  navigation,
  route
}) {
  const {
    height: windowHeight
  } = useWindowDimensions();
  const sheetHeightLimit = windowHeight * 0.7;
  const {
    project = {},
    projectName
  } = route.params || {};
  const {
    user,
    authorization,
    roleAccess
  } = useAuth();
  const allowed = roleAccess.isAuthorizationReady && isProjectAllowed(authorization, project) && authorization?.effectivePermissions?.includes("civil_structure.view");
  const scope = `${user?.id}:${project.id}`;
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewer, setViewer] = useState(null);
  const controller = useRef(null);
  const snapshotVisible = allowed && snapshot?.scope === scope && failure?.status !== 403 && failure?.status !== 401;
  const register = snapshotVisible ? snapshot.data : null;
  const model = useMemo(() => register ? buildCivilStatus(register) : null, [register]);
  const group = model?.groups.find(item => item.type === selectedType) || model?.groups[0];
  const structure = group?.structures.find(item => item.id === selectedStructure) || group?.structures[0];
  const activity = structure?.processes.flatMap(process => process.phases.flatMap(phase => phase.activities)).find(item => item.key === selectedActivity);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active) setReducedMotion(value);
    });
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => {
      active = false;
      listener.remove();
    };
  }, []);
  const animate = () => {
    if (!reducedMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };
  const toggle = key => {
    animate();
    setExpanded(current => {
      if (key.startsWith("process:")) return current[key] ? {} : {
        [key]: true
      };
      return {
        ...Object.fromEntries(Object.entries(current).filter(([entry]) => entry.startsWith("process:"))),
        [key]: !current[key]
      };
    });
  };
  const load = useCallback(async () => {
    controller.current?.abort();
    if (!allowed || !project.id) return;
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    const revision = civilCacheRevision(user?.id, project.id);
    try {
      const cached = await readCivilCache(user?.id, project.id).catch(() => null);
      if (request.signal.aborted) return;
      if (cached) setSnapshot(current => current?.scope === scope && current.time > cached.time ? current : { ...cached, scope });
      const network = await NetInfo.fetch();
      if (request.signal.aborted) return;
      if (network.isConnected === false || network.isInternetReachable === false) {
        setFailure({ message: cached ? "Offline · showing saved status" : "No saved Civil status. Open this project once with internet." });
        return;
      }
      const data = await fetchCivilRegister({
        projectId: project.id,
        signal: request.signal
      });
      if (request.signal.aborted) return;
      const time = new Date();
      setSnapshot({ scope, data, time });
      setFailure(null);
      try { await saveCivilCache(user?.id, project.id, data, time, revision); }
      catch { if (!request.signal.aborted) setFailure({ message: "Status updated, but could not save for offline use. Pull to retry." }); }
    } catch (error) {
      if (!request.signal.aborted) {
        setFailure({
          status: error.status,
          message: error.status === 403 ? "Civil access is unavailable." : error.status === 401 ? "Sign in again to view civil status." : "Could not refresh. Check your connection and retry."
        });
        if ([401, 403].includes(error.status)) {
          setSnapshot(null);
          setViewer(null);
          await clearCivilCache(user?.id, project.id).catch(() => {});
        }
      }
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, [allowed, project.id, scope, user?.id]);
  useEffect(() => {
    setSnapshot(null);
    setFailure(null);
    setSelectedType(null);
    setSelectedStructure(null);
    setSelectedActivity(null);
    setExpanded({});
    setSelectorOpen(false);
    setViewer(null);
    setSearch("");
    setFilter("all");
  }, [scope, allowed]);
  useFocusEffect(useCallback(() => {
    load();
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") load();
    });
    return () => {
      controller.current?.abort();
      subscription.remove();
    };
  }, [load]));
  useEffect(() => {
    if (selectedActivity && !activity) {
      setSelectedActivity(null);
      setViewer(null);
    }
  }, [activity, selectedActivity]);
  const matchesStatus = item => filter === "all" || (filter === "completed" ? item.status === "completed" : filter === "in_progress" ? item.status === "in_progress" : item.status === "not_started");
  const entries = (structure?.processes || []).flatMap(process => {
    const phaseRows = process.phases.flatMap((phase, index) => {
      const activities = phase.activities.filter(matchesStatus);
      if (filter !== "all" && !activities.length) return [];
      return [{
        ...phase,
        kind: "phase",
        processName: process.name,
        processId: process.id,
        order: index + 1,
        key: `phase:${process.id}:${phase.id}`
      }, ...(expanded[`phase:${process.id}:${phase.id}`] ? activities.map(item => ({
        ...item,
        kind: "activity",
        processName: process.name,
        phaseName: phase.name
      })) : [])];
    });
    if (filter !== "all" && !phaseRows.length) return [];
    const open = expanded[`process:${process.id}`];
    return [{
      ...process,
      kind: "process",
      key: `process:${process.id}`
    }, ...(open ? phaseRows : [])];
  });
  const activityContext = structure?.processes.flatMap(process => process.phases.map(phase => ({
    process,
    phase
  }))).find(({
    phase
  }) => phase.activities.some(item => item.key === selectedActivity));
  const latest = activity?.history[0];
  const latestWorkDate = activity?.history.map(item => item.workDate).filter(Boolean).sort().at(-1);
  const renderEntry = ({
    item
  }) => {
    if (item.snapshot) return <View style={s.card}>
      <View style={s.cardTop}><View style={s.historyIcon}><Icon source="calendar-check-outline" size={20} color={colors.primaryBlue} /></View><View style={s.grow}><Text style={s.heading}>{item.workDate || "Date unavailable"}</Text><Text style={s.muted}>Work recorded</Text></View></View>
      <Text style={s.muted}>{item.entry?.contractorName || "Contractor unavailable"}</Text>
      <Field label="Recorded by" value={item.entry?.submittedByName} />
      {!!item.result.label && item.result.label !== activity?.label && <Text style={s.body}>{item.result.label}</Text>}
      {["quantity", "level"].includes(item.result.measurementType) && <><Field label={item.result.measurementType === "level" ? "Level" : "Recorded quantity"} value={measure(item.result.quantity, item.result.unit)} /><Field label="Target at entry" value={measure(item.result.targetValue, item.result.unit)} /></>}
      {!!item.createdAt && <Field label="Recorded at" value={Number.isNaN(Date.parse(item.createdAt)) ? "Unavailable" : new Date(item.createdAt).toLocaleString()} />}
      {item.result.value !== undefined && <Field label="Answer" value={String(item.result.value)} />}
      {item.result.rl !== undefined && item.result.rl !== null && <Field label="RL" value={formatCivilNumber(item.result.rl)} />}
      {!!item.snapshot?.remark && <Text selectable style={s.body}>{item.snapshot.remark}</Text>}
      {!!item.result.proofs?.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.proofRow}>{item.result.proofs.map((proof, index) => <Proof key={`${proof.url}:${index}`} proof={proof} onPress={() => setViewer({
          items: item.result.proofs.filter(p => p.url).map(p => ({
            uri: p.url,
            title: p.name
          })),
          index: item.result.proofs.slice(0, index).filter(p => p.url).length
        })} />)}</ScrollView>}
    </View>;
    if (item.kind === "activity") return <Pressable accessibilityRole="button" accessibilityLabel={`${item.processName}, ${item.phaseName}, ${item.label}. View activity details`} onPress={() => setSelectedActivity(item.key)} style={({
      pressed
    }) => [s.activity, pressed && s.pressed]}>
      <View style={s.cardTop}><Icon source={STATUS[item.status].icon} size={18} color={STATUS[item.status].color} /><View style={s.grow}><Text style={s.heading}>{item.label}</Text><Text style={[s.muted, {
            color: STATUS[item.status].color
          }]}>{STATUS[item.status].label}</Text></View><Text style={s.number}>{item.percent}%</Text><Icon source="chevron-right" size={18} color={colors.textSecondary} /></View>
    </Pressable>;
    const isProcess = item.kind === "process";
    const status = item.total && item.completed === item.total ? "completed" : item.started || item.completed ? "in_progress" : "not_started";
    return <Pressable accessibilityRole="button" accessibilityState={{
      expanded: Boolean(expanded[item.key])
    }} onPress={() => toggle(item.key)} style={({
      pressed
    }) => [isProcess ? s.processCard : s.timelineRow, expanded[item.key] && (isProcess ? s.processOpen : s.phaseOpen), pressed && s.pressed]}>
      {!isProcess && <View style={s.timelineRail}><View style={[s.timelineDot, {
          backgroundColor: STATUS[status].bg
        }]}><Icon source={STATUS[status].icon} size={18} color={STATUS[status].color} /></View><View style={s.timelineLine} /></View>}
      <View style={[s.grow, {
        gap: 8
      }]}>
        <View style={s.cardTop}>{isProcess && <View style={s.processIcon}><Icon source="layers-outline" size={20} color={colors.primaryBlue} /></View>}<View style={s.grow}><Text style={[s.heading, expanded[item.key] && s.openTitle]}>{item.name}</Text><Text style={s.muted}>{item.completed}/{item.total} complete{isProcess ? ` · ${item.phases.length} phases` : ""}</Text></View><Text style={s.number}>{item.total ? `${item.percent}%` : "—"}</Text><View style={[s.expandButton, expanded[item.key] && s.expandButtonOpen]}><Icon source={expanded[item.key] ? "chevron-up" : "chevron-down"} size={18} color={expanded[item.key] ? colors.white : colors.primaryBlue} /></View></View>
        {isProcess && <Progress value={item.percent} />}
        {!isProcess && expanded[item.key] && <Text style={s.childLabel}>ACTIVITIES · {item.activities.filter(matchesStatus).length}</Text>}
        {isProcess && expanded[item.key] && <Text style={s.childLabel}>PHASES · {item.phases.length}</Text>}
        {item.row?.progress?.status === "blocked" && <Badge status="blocked" />}
        {!!item.row?.remark && <Text style={s.body}>{item.row.remark}</Text>}
      </View>
    </Pressable>;
  };
  return <SafeAreaView style={s.screen}>
    <ModuleStatusHeader title="Civil Structures" projectName={project.shortName || projectName || register?.projectName || project.name} onBack={() => navigation.goBack()} />
    {!allowed ? <View style={s.empty}><Icon source="lock-outline" size={34} color={colors.textSecondary} /><Text style={s.heading}>Civil access is unavailable</Text></View> : !register ? <View style={s.empty}>{loading ? <ActivityIndicator color={colors.primaryBlue} /> : <><Text style={s.heading}>{failure?.message || "Civil status unavailable"}</Text><Pressable onPress={load} accessibilityRole="button" style={s.retry}><Text style={s.retryText}>Retry</Text></Pressable></>}</View> : <FlatList data={entries} keyExtractor={item => item.key} renderItem={renderEntry} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primaryBlue} />} ListHeaderComponent={<View style={s.listHeader}>
        {failure && <View style={s.notice}><Text style={s.body}>{failure.message}</Text></View>}
        <View style={s.compactSummary}><View style={s.summaryIcon}><Icon source="chart-timeline-variant" size={23} color={colors.primaryBlue} /></View><View style={s.grow}><Text style={s.heading}>Project progress</Text><Text style={s.muted}>{model.completed} of {model.total} activities complete</Text></View><Text style={s.summaryPercent}>{model.total ? `${model.percent}%` : "—"}</Text></View>
        <View style={s.typeTabs}>{model.groups.map(item => {
          const theme = STRUCTURE_THEME[item.type] || STRUCTURE_THEME.intake;
          const active = group?.type === item.type;
          return <Pressable key={item.type} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{
            selected: active
          }} onPress={() => {
            setSelectedType(item.type);
            setSelectedStructure(null);
            setExpanded({});
            setFilter("all");
          }} style={[s.typeTab, active && s.typeTabActive]}><View style={s.tabSide}><Icon source={theme.icon} size={18} color={active ? colors.primaryBlue : colors.textSecondary} /></View><Text style={[s.typeTabText, active && s.typeTabSelected]}>{theme.code}</Text><View style={s.tabSide}><Text style={[s.typeTabCount, active && s.typeTabSelected]}>{item.structures.length}</Text></View></Pressable>;
        })}</View>
        <View style={s.selectionRow}><View style={s.grow}><Text style={s.groupLabel}>{group?.label}</Text><Text style={s.muted}>{structure ? `${structure.processes.length} processes` : "No structures configured"}</Text></View>{structure && <Pressable accessibilityRole="button" accessibilityLabel="Choose structure" disabled={group.structures.length < 2} onPress={() => {
          setSearch("");
          setSelectorOpen(true);
        }} style={s.structureSelect}><Text style={s.selectorText}>{structure.name}</Text>{group.structures.length > 1 && <Icon source="chevron-down" size={18} color={colors.primaryBlue} />}</Pressable>}</View>
        {structure && <View style={s.trackingSummary}>
          <View style={s.row}><View style={s.grow}><Text style={s.trackingTitle}>{structure.total && structure.completed === structure.total ? "Work completed" : structure.started || structure.completed ? "Work in progress" : "Yet to start"}</Text><Text style={s.muted}>{structure.completed}/{structure.total} activities complete</Text></View><Text style={s.summaryPercent}>{structure.total ? `${structure.percent}%` : "—"}</Text></View>
          <Progress value={structure.percent} />
          <View style={s.inlineStats}>{[["Done", structure.completed, "completed"], ["In progress", structure.started, "in_progress"], ["Pending", structure.notStarted, "not_started"]].map(([label, count, status]) => <View key={status} style={s.inlineStat}><View style={[s.smallDot, {
              backgroundColor: STATUS[status].color
            }]} /><Text style={s.inlineStatText}>{count} {label}</Text></View>)}</View>
        </View>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{["all", "in_progress", "completed", "not_started"].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{
          selected: filter === value
        }} onPress={() => {
          animate();
          setFilter(value);
        }} style={[s.chip, filter === value && s.chipActive]}><Text style={[s.chipText, filter === value && s.chipTextActive]}>{value === "all" ? "All work" : STATUS[value].label}</Text></Pressable>)}</ScrollView>
        <View style={s.sectionRow}><Text style={s.section}>Work timeline</Text><Text style={s.refreshed}>{snapshot.time.toLocaleString([], { month: "short", day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}</Text></View>
      </View>} ListEmptyComponent={<View style={s.empty}><Icon source="clipboard-text-outline" size={28} color={colors.textSecondary} /><Text style={s.muted}>{filter !== "all" ? "No matching activities" : structure ? "No activities configured" : "No structures configured"}</Text></View>} />}
    <Modal visible={Boolean(activity && register)} transparent animationType={reducedMotion ? "none" : "slide"} onRequestClose={() => {
      setSelectedActivity(null);
      setViewer(null);
    }}>
      <View style={s.sheetOverlay}><Pressable style={StyleSheet.absoluteFill} onPress={() => {
          setSelectedActivity(null);
          setViewer(null);
        }} accessibilityLabel="Close activity details" /><SafeAreaView edges={["bottom"]} style={[s.detailSheet, {
          maxHeight: sheetHeightLimit
        }]}><View style={s.sheetHandle} /><View style={s.sheetHeader}><View style={s.grow}><Text style={s.title}>{activity?.label}</Text><Text style={s.muted}>{[structure?.name, activityContext?.process.name, activityContext?.phase.name].filter(Boolean).join(" › ")}</Text></View><IconButton icon="close" onPress={() => {
              setSelectedActivity(null);
              setViewer(null);
            }} accessibilityLabel="Close activity details" /></View>
        <FlatList data={activity?.history || []} keyExtractor={(item, index) => String(item.id || index)} renderItem={renderEntry} contentContainerStyle={s.sheetContent} ListHeaderComponent={activity ? <View style={s.listHeader}><View style={s.row}><Badge status={activity.status} /><Text style={s.summaryPercent}>{activity.percent}%</Text></View><Progress value={activity.percent} />
            {activity.measurementType !== "none" && <><Field label={activity.measurementType === "level" ? "Current level" : "Recorded quantity"} value={measure(activity.rollup?.completedQuantity, activity.unit)} /><Field label="Target" value={measure(activity.targetValue, activity.unit)} /></>}
            {!!activity.targetNote && activity.targetNote !== "N/A" && <Text style={s.body}>{activity.targetNote}</Text>}
            {activity.recordRl && <><Field label="Latest RL" value={formatCivilNumber(latest?.result?.rl)} /><Field label="RL set point" value={formatCivilNumber(activity.rlSetPoint)} /></>}
            {latest?.result?.value !== undefined && <Field label="Latest answer" value={String(latest.result.value)} />}
            <Field label="Latest work date" value={latestWorkDate} /><Text style={s.section}>Work history · {activity.history.length}</Text></View> : null} ListEmptyComponent={<Text style={s.muted}>No recorded work</Text>} />
        <ImageViewerModal visible={Boolean(viewer && register)} items={viewer?.items || []} initialIndex={viewer?.index || 0} onRequestClose={() => setViewer(null)} />
      </SafeAreaView></View>
    </Modal>
    <Modal visible={selectorOpen && Boolean(register)} transparent animationType={reducedMotion ? "none" : "slide"} onRequestClose={() => setSelectorOpen(false)}><View style={s.sheetOverlay}><Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectorOpen(false)} accessibilityLabel="Close structure selector" /><SafeAreaView edges={["bottom"]} style={[s.detailSheet, {
          maxHeight: sheetHeightLimit
        }]}><View style={s.sheetHeader}><View style={s.grow}><Text style={s.title}>Select structure</Text><Text style={s.muted}>{group?.label} · {group?.structures.length || 0} structures</Text></View><IconButton icon="close" onPress={() => setSelectorOpen(false)} accessibilityLabel="Close structure selector" /></View><Searchbar value={search} onChangeText={setSearch} placeholder="Search structure" style={s.search} /><FlatList keyboardShouldPersistTaps="handled" data={(group?.structures || []).filter(item => item.name.toLowerCase().includes(search.trim().toLowerCase()))} keyExtractor={item => item.id} renderItem={({
            item
          }) => <Pressable accessibilityRole="button" accessibilityState={{
            selected: structure?.id === item.id
          }} onPress={() => {
            setSelectedStructure(item.id);
            setFilter("all");
            setExpanded({});
            setSelectorOpen(false);
          }} style={[s.structureOption, item.id === structure?.id && s.structureSelected]}><View style={s.grow}><Text style={[s.heading, item.id === structure?.id && s.openTitle]}>{item.name}</Text><Text style={s.muted}>{item.completed}/{item.total} complete{item.id === structure?.id ? " · Selected" : ""}</Text></View><Text style={s.number}>{item.total ? `${item.percent}%` : "—"}</Text><Icon source={item.id === structure?.id ? "check-circle" : "circle-outline"} size={20} color={colors.primaryBlue} /></Pressable>} ListEmptyComponent={<Text style={s.empty}>No matching structures</Text>} /></SafeAreaView></View></Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  processOpen: {
    backgroundColor: "#F1F6FC",
    borderColor: "#C7D8E8",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18
  },
  phaseOpen: {
    backgroundColor: "#EBF1F8",
    borderRadius: 14,
    borderCurve: "continuous"
  },
  openTitle: {
    color: colors.primaryBlue
  },
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.surfaceBlue,
    alignItems: "center",
    justifyContent: "center"
  },
  expandButtonOpen: {
    backgroundColor: colors.primaryBlue
  },
  childLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textSecondary,
    paddingTop: 2
  },
  structureSelected: {
    backgroundColor: "#EDF4FB",
    borderLeftWidth: 0,
    borderLeftColor: colors.primaryBlue
  },
  compactSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#EAF2FA",
    alignItems: "center",
    justifyContent: "center"
  },
  summaryPercent: {
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
    fontSize: 23,
    fontVariant: ["tabular-nums"]
  },
  typeTabs: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
    backgroundColor: "#E9EDF2",
    borderRadius: 17
  },
  tabSide: { width: 28, alignItems: "center", justifyContent: "center" },
  typeTab: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 0,
    flexWrap: "nowrap",
    paddingVertical: 8,
    borderRadius: 13,
    borderCurve: "continuous"
  },
  typeTabActive: {
    backgroundColor: colors.white,
    shadowColor: colors.primaryBlue,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.09,
    shadowRadius: 4,
    elevation: 2
  },
  typeTabText: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    lineHeight: 20,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textSecondary
  },
  typeTabCount: {
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    lineHeight: 20,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary
  },
  typeTabSelected: {
    color: colors.primaryBlue
  },
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  groupLabel: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: 16
  },
  structureSelect: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E9F0",
    borderCurve: "continuous"
  },
  selectorText: {
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
    fontSize: 13
  },
  trackingSummary: {
    padding: 14,
    gap: 12,
    borderRadius: 20,
    backgroundColor: "#EFF7F3",
    borderWidth: 1,
    borderColor: "#DFECE5",
    borderCurve: "continuous"
  },
  trackingTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textDark
  },
  inlineStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  inlineStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  smallDot: {
    width: 5,
    height: 5,
    borderRadius: 3
  },
  inlineStatText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary
  },
  processCard: {
    padding: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E6ECF2",
    borderRadius: 18,
    borderCurve: "continuous",
    shadowColor: colors.primaryBlue,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.045,
    shadowRadius: 7,
    elevation: 1
  },
  processIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceBlue,
    alignItems: "center",
    justifyContent: "center"
  },
  timelineRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 10,
    paddingVertical: 10,
    paddingLeft: 8,
    marginLeft: 12,
    minHeight: 60
  },
  timelineRail: {
    width: 30,
    alignItems: "center"
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 15,
    backgroundColor: "#D7E2EC",
    marginTop: 4,
    borderRadius: 2
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 29, 45, 0.32)",
    paddingTop: 60
  },
  detailSheet: {
    backgroundColor: "#F7F9FC",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    flexShrink: 1,
    borderCurve: "continuous"
  },
  sheetHandle: {
    width: 36,
    height: 5,
    backgroundColor: "#CBD4DE",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingVertical: 6
  },
  sheetContent: {
    padding: 18,
    gap: 14
  },
  structureOption: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    minHeight: 68,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  pressed: {
    opacity: 0.88,
    transform: [{
      scale: 0.99
    }]
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.surfaceBlue,
    alignItems: "center",
    justifyContent: "center"
  },
  screen: {
    flex: 1,
    backgroundColor: "#F4F6F9"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 4,
    paddingVertical: 6,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  grow: {
    flex: 1,
    minWidth: 0
  },
  title: {
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    fontSize: 19,
    lineHeight: 24
  },
  heading: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textDark
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18
  },
  body: {
    fontFamily: fonts.regular,
    color: colors.textDark,
    fontSize: 13,
    lineHeight: 19
  },
  content: {
    padding: 16,
    gap: 8,
    paddingBottom: 32,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center"
  },
  listHeader: {
    gap: 12,
    paddingBottom: 6
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap"
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E4ECF3",
    gap: 12,
    shadowColor: colors.primaryBlue,
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 1,
    borderCurve: "continuous"
  },
  number: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primaryBlue,
    fontVariant: ["tabular-nums"]
  },
  track: {
    height: 7,
    backgroundColor: "#E2EAF1",
    borderRadius: 20,
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: 20
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderCurve: "continuous"
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11
  },
  section: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: 15,
    marginBottom: 2
  },
  search: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12
  },
  filters: {
    gap: 8
  },
  chip: {
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8EDF3"
  },
  chipActive: {
    backgroundColor: "#E5EEF8",
    borderColor: "#D3E1EF"
  },
  chipText: {
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    lineHeight: 20,
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.semiBold
  },
  chipTextActive: {
    color: colors.primaryBlue
  },
  activity: {
    padding: 12,
    marginLeft: 52,
    backgroundColor: colors.white,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E8EDF3",
    borderCurve: "continuous"
  },
  field: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap"
  },
  fieldValue: {
    fontFamily: fonts.medium,
    color: colors.textDark,
    fontSize: 13,
    flexShrink: 1,
    textAlign: "right"
  },
  empty: {
    padding: 30,
    gap: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  retry: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12
  },
  retryText: {
    color: colors.white,
    fontFamily: fonts.bold
  },
  notice: {
    backgroundColor: "#FFF4DF",
    padding: 12,
    borderRadius: 10
  },
  refreshed: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.regular,
    textAlign: "right"
  },
  proofRow: {
    gap: 8
  },
  proof: {
    width: 128,
    height: 104,
    borderRadius: 9,
    overflow: "hidden",
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center"
  },
  proofImage: {
    width: "100%",
    height: "100%"
  }
});
