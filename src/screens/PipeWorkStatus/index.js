import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../../context/AuthContext";
import { fetchPipeSubmission, fetchPipeWorkStatus, updatePipeSubmissionWorkflow } from "../../services/pipeNetworkApi";
import colors from "../../constants/colors";
import { getPipeCache, savePipeCache } from "../../services/pipeNetworkOfflineStore";

const TABS = ["all", "submitted", "verified", "approved", "rejected", "modify_request", "modify_approved"];
const roleCode = (value) => String(value || "").trim().toLowerCase().replace(/[ -]+/g, "_");

const getActions = (item, user) => {
  const role = roleCode(user?.role);
  const userId = String(user?.id || "");
  const status = item?.workflowStatus || item?.status;
  const engineer = userId && userId === String(item?.assignedEngineerId || "");
  const manager = userId && userId === String(item?.assignedManagerId || "");
  if ((role === "engineer" || role === "manager") && (engineer || manager)) {
    if (status === "submitted") return [{ key: "verify", label: "Verify" }, { key: "reject", label: "Need correction" }];
    if (status === "verified" && role === "manager" && manager) return [{ key: "approve", label: "Approve" }, { key: "reject", label: "Need correction" }];
  }
  if (role === "supervisor" && ["verified", "approved"].includes(status)) return [{ key: "modify_request", label: "Request modification" }];
  return [];
};

export default function PipeWorkStatusScreen({ route }) {
  const { projectId, material } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [actionRemark, setActionRemark] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const controllerRef = useRef(null);

  React.useEffect(() => NetInfo.addEventListener((state) => {
    setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
  }), []);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError("");
    const resource = `work-status:${material || "all"}:${tab}:${search.trim()}`;
    const cached = await getPipeCache({ ownerUserId: user?.id, projectId, resource });
    if (cached?.payload && !controller.signal.aborted) {
      setData(cached.payload);
      setLoading(false);
    }
    try {
      const response = await fetchPipeWorkStatus({ projectId, material, workflowStatus: tab === "all" ? undefined : tab, search: search.trim() || undefined, page: 1, pageSize: 100, signal: controller.signal });
      if (!controller.signal.aborted) {
        setData(response);
        await savePipeCache({ ownerUserId: user?.id, projectId, resource, payload: response });
      }
    } catch (loadError) {
      if (!controller.signal.aborted) setError(loadError?.message || "Could not load Pipe Work Status.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [material, projectId, search, tab, user?.id]);

  useFocusEffect(useCallback(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => { clearTimeout(timer); controllerRef.current?.abort(); };
  }, [load]));

  const openItem = async (item) => {
    setSelected(item);
    setDetail(null);
    try { setDetail(await fetchPipeSubmission({ submissionId: item.submissionId })); }
    catch (detailError) { Alert.alert("Could not open request", detailError?.message || "Please try again."); setSelected(null); }
  };

  const runAction = (action) => {
    const needsRemark = action === "reject" || action === "modify_request";
    const submit = async (remark = "") => {
      setActionBusy(true);
      try {
        await updatePipeSubmissionWorkflow({ submissionId: selected.submissionId, action, remark });
        setSelected(null);
        await load();
      } catch (actionError) { Alert.alert("Action failed", actionError?.message || "Please try again."); }
      finally { setActionBusy(false); }
    };
    if (!needsRemark) return submit();
    setPendingAction(action);
    setActionRemark("");
  };

  const items = data?.items || [];
  const counts = data?.counts || {};
  const actions = useMemo(() => isOnline ? getActions(selected, user) : [], [isOnline, selected, user]);

  return <View style={styles.screen}>
    <View style={styles.search}><Icon source="magnify" size={20} color={colors.textSecondary} /><TextInput value={search} onChangeText={setSearch} placeholder="Search node or pipe label" style={styles.searchInput} /></View>
    <FlatList horizontal data={TABS} keyExtractor={(item) => item} contentContainerStyle={styles.tabs} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <Pressable onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item.replace(/_/g, " ")} ({item === "all" ? counts.total || 0 : counts[item] || 0})</Text></Pressable>} />
    {!!error && <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={load}><Text style={styles.link}>Retry</Text></Pressable></View>}
    <FlatList data={items} keyExtractor={(item) => item.submissionId} refreshControl={<RefreshControl refreshing={loading && data !== null} onRefresh={load} />} contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]} renderItem={({ item }) => <Pressable onPress={() => openItem(item)} style={styles.card}>
      <View style={styles.row}><Text style={styles.title}>{item.startNode || "—"} → {item.stopNode || "—"}</Text><Text style={styles.status}>{String(item.workflowStatus || item.status).replace(/_/g, " ")}</Text></View>
      <Text style={styles.subtitle}>{item.segmentLabel || item.packageTitle || "Unlabelled pipe"} · {item.processDescription || item.processCode} · {item.material}</Text>
      <Text style={styles.meta}>{item.assignedEngineerName || "No engineer"} → {item.assignedManagerName || "No manager"}</Text>
    </Pressable>} ListEmptyComponent={loading && data === null ? <ActivityIndicator style={styles.state} color={colors.primaryBlue} /> : <View style={styles.state}><Icon source="clipboard-check-outline" size={34} color={colors.textSecondary} /><Text>No matching requests</Text></View>} />
    <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}><View style={styles.modalBackdrop}><View style={styles.sheet}>
      <View style={styles.row}><Text style={styles.sheetTitle}>{selected?.startNode || "—"} → {selected?.stopNode || "—"}</Text><Pressable onPress={() => setSelected(null)}><Icon source="close" size={24} /></Pressable></View>
      {!detail ? <ActivityIndicator style={styles.state} color={colors.primaryBlue} /> : <FlatList data={detail.items || []} keyExtractor={(item, index) => String(item.checklistId || index)} renderItem={({ item }) => <View style={styles.answer}><Text style={styles.answerTitle}>{item.title || item.requirement || `Checklist ${item.checklistId}`}</Text><Text>{typeof item.value === "object" ? JSON.stringify(item.value) : String(item.value ?? item.valueJson ?? "—")}</Text></View>} ListFooterComponent={<View style={styles.actions}>{pendingAction ? <View style={styles.remarkBox}><Text style={styles.answerTitle}>Remark</Text><TextInput value={actionRemark} onChangeText={setActionRemark} placeholder="Enter reason" multiline style={styles.remarkInput} /><View style={styles.row}><Pressable onPress={() => setPendingAction("")} style={styles.secondaryAction}><Text>Cancel</Text></Pressable><Pressable disabled={!actionRemark.trim() || actionBusy} onPress={async () => { const action = pendingAction; const remark = actionRemark.trim(); setPendingAction(""); setActionRemark(""); setActionBusy(true); try { await updatePipeSubmissionWorkflow({ submissionId: selected.submissionId, action, remark }); setSelected(null); await load(); } catch (actionError) { Alert.alert("Action failed", actionError?.message || "Please try again."); } finally { setActionBusy(false); } }} style={styles.action}><Text style={styles.actionText}>Submit</Text></Pressable></View></View> : actions.map((action) => <Pressable disabled={actionBusy} key={action.key} onPress={() => runAction(action.key)} style={styles.action}><Text style={styles.actionText}>{action.label}</Text></Pressable>)}{!actions.length && <Text style={styles.meta}>{isOnline ? "This request is view-only for your role or assignment." : "Review actions are unavailable offline. Cached request data is shown."}</Text>}</View>} />}
    </View></View></Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F7FB" }, search: { margin: 14, marginBottom: 6, backgroundColor: "white", borderRadius: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" }, searchInput: { flex: 1, padding: 12 }, tabs: { paddingHorizontal: 14, gap: 8, paddingVertical: 8 }, tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "white" }, tabActive: { backgroundColor: colors.primaryBlue }, tabText: { textTransform: "capitalize", color: colors.textSecondary }, tabTextActive: { color: "white" }, list: { padding: 14, gap: 10, flexGrow: 1 }, card: { backgroundColor: "white", borderRadius: 14, padding: 14, gap: 7 }, row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }, title: { fontSize: 16, fontWeight: "700", color: "#173B5E", flex: 1 }, subtitle: { color: "#3E5E78" }, meta: { color: colors.textSecondary, fontSize: 12 }, status: { color: colors.primaryBlue, textTransform: "capitalize", fontWeight: "700", fontSize: 12 }, state: { padding: 40, alignItems: "center", gap: 8 }, error: { marginHorizontal: 14, padding: 10, backgroundColor: "#FDECEC", borderRadius: 10, flexDirection: "row", justifyContent: "space-between" }, errorText: { color: "#A43A3A", flex: 1 }, link: { color: colors.primaryBlue, fontWeight: "700" }, modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.35)" }, sheet: { backgroundColor: "white", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, maxHeight: "85%", minHeight: "45%" }, sheetTitle: { fontSize: 18, fontWeight: "700", flex: 1 }, answer: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#DCE4EC", gap: 5 }, answerTitle: { fontWeight: "600", color: "#173B5E" }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 18 }, action: { backgroundColor: colors.primaryBlue, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 }, secondaryAction: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: "#CBD7E3" }, actionText: { color: "white", fontWeight: "700" }, remarkBox: { width: "100%", gap: 10 }, remarkInput: { minHeight: 80, borderWidth: 1, borderColor: "#CBD7E3", borderRadius: 10, padding: 10, textAlignVertical: "top" },
});
