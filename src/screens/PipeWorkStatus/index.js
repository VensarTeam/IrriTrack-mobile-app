import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../../context/AuthContext";
import { fetchPipeSubmission, fetchPipeWorkStatus, updatePipeSubmissionWorkflow } from "../../services/pipeNetworkApi";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import { fontScale, moderateScale, verticalScale } from "../../constants/metrics";
import { getPipeCache, savePipeCache } from "../../services/pipeNetworkOfflineStore";
import { IMAGE_BASE_URL } from "../../config/env";
import { getUnitStatusPalette } from "../../utils/unitStatusPalette";

const TABS = ["all", "submitted", "verified", "approved", "rejected", "modify_request", "modify_approved"];
const TAB_LABELS = {
  all: "All",
  submitted: "Submitted",
  verified: "Verified",
  approved: "Approved",
  rejected: "Commented",
  modify_request: "Modify request",
  modify_approved: "Modify approved",
};
const roleCode = (value) => String(value || "").trim().toLowerCase().replace(/[ -]+/g, "_");

const getStatusLabel = (value = "") => TAB_LABELS[String(value).toLowerCase()] || String(value || "Pending").replace(/_/g, " ");

const getStatusTheme = (value = "") => {
  const label = getStatusLabel(value);
  const palette = getUnitStatusPalette(label === "Commented" ? "Commented" : label);
  return { label, backgroundColor: palette.soft, color: palette.text, borderColor: palette.solid };
};

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};

const unwrapChecklistValue = (item = {}) => {
  const raw = item.value ?? item.valueJson;
  if (raw && typeof raw === "object" && !Array.isArray(raw) && Object.prototype.hasOwnProperty.call(raw, "value")) {
    return raw.value;
  }
  return raw;
};

const resolveImageUrl = (value = "") => {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^https?:\/\//i.test(source)) return source;
  if (!IMAGE_BASE_URL) return source;
  return `${String(IMAGE_BASE_URL).replace(/\/?$/, "/")}${source.replace(/^\/+/, "")}`;
};

const getChecklistImages = (value) => {
  const candidates = Array.isArray(value)
    ? value
    : Array.isArray(value?.files)
      ? value.files
      : [];
  return candidates
    .map((file) => resolveImageUrl(file?.url || file?.storageKey || file?.key || file))
    .filter(Boolean);
};

const ChecklistAnswer = ({ item }) => {
  const value = unwrapChecklistValue(item);
  const images = getChecklistImages(value);

  if (images.length) {
    return (
      <View style={styles.answerImages}>
        {images.map((uri) => <Image key={uri} source={{ uri }} style={styles.answerImage} resizeMode="cover" />)}
      </View>
    );
  }

  if (typeof value === "boolean") {
    return (
      <View style={[styles.booleanAnswer, value ? styles.booleanAnswerYes : styles.booleanAnswerNo]}>
        <Icon source={value ? "check-circle" : "close-circle"} size={17} color={value ? colors.completed : colors.danger} />
        <Text style={[styles.booleanAnswerText, { color: value ? colors.completed : colors.danger }]}>{value ? "Yes" : "No"}</Text>
      </View>
    );
  }

  const displayValue = value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "—");
  return <Text style={styles.answerValue}>{displayValue}</Text>;
};

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

  return (
    <View style={styles.screen}>
      <View style={styles.search}>
        <Icon source="magnify" size={moderateScale(20)} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search node or pipe label"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {search ? (
          <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearch("")}>
            <Icon source="close-circle" size={moderateScale(18)} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {TABS.map((item) => {
          const active = tab === item;
          const count = item === "all" ? counts.total || 0 : counts[item] || 0;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={item}
              onPress={() => setTab(item)}
              style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{TAB_LABELS[item]}</Text>
              <View style={[styles.tabCount, active && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {!!error && (
        <View style={styles.error}>
          <Icon source="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}><Text style={styles.link}>Retry</Text></Pressable>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.submissionId}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading && data !== null} onRefresh={load} tintColor={colors.primaryBlue} colors={[colors.primaryBlue]} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + verticalScale(20) }]}
        renderItem={({ item }) => {
          const statusTheme = getStatusTheme(item.workflowStatus || item.status);
          const reference = [
            item.segmentLabel || item.packageTitle || "Unlabelled pipe",
            item.processDescription || item.processCode,
            item.material,
          ].filter(Boolean).join(" · ");
          const submitted = [item.submittedByName, formatDate(item.submittedAt || item.createdAt)].filter(Boolean).join(" · ");
          const hasChainage = item.chainageFromM != null && item.chainageToM != null;
          return (
            <Pressable onPress={() => openItem(item)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIdentity}>
                  <View style={styles.cardIcon}><Icon source="pipe" size={22} color={colors.primaryBlue} /></View>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.title} numberOfLines={1}>{item.startNode || "—"} → {item.stopNode || "—"}</Text>
                    <Text style={styles.subtitle} numberOfLines={2}>{reference}</Text>
                  </View>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusTheme.backgroundColor, borderColor: statusTheme.borderColor }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusTheme.borderColor }]} />
                  <Text style={[styles.statusText, { color: statusTheme.color }]}>{statusTheme.label}</Text>
                </View>
              </View>

              {hasChainage ? (
                <View style={styles.chainagePill}>
                  <Icon source="map-marker-distance" size={14} color={colors.textSecondary} />
                  <Text style={styles.chainageText}>Chainage {item.chainageFromM}–{item.chainageToM} m</Text>
                </View>
              ) : null}

              <View style={styles.cardDivider} />
              <View style={styles.activityRow}>
                <Icon source="account-clock-outline" size={19} color={colors.textSecondary} />
                <View style={styles.activityCopy}>
                  <Text style={styles.activityPrimary} numberOfLines={1}>{submitted || "Submission activity unavailable"}</Text>
                  <Text style={styles.activitySecondary} numberOfLines={1}>
                    {item.assignedEngineerName || "No engineer"} → {item.assignedManagerName || "No manager"}
                  </Text>
                </View>
                <Icon source="chevron-right" size={22} color={colors.textSecondary} />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={loading && data === null ? (
          <View style={styles.state}><ActivityIndicator color={colors.primaryBlue} /><Text style={styles.stateText}>Loading work status…</Text></View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Icon source="clipboard-search-outline" size={28} color={colors.primaryBlue} /></View>
            <Text style={styles.emptyTitle}>No matching requests</Text>
            <Text style={styles.emptyText}>Try another status or clear the search.</Text>
          </View>
        )}
      />

      <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setSelected(null)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, verticalScale(14)) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetEyebrow}>SUBMISSION DETAILS</Text>
                <Text style={styles.sheetTitle}>{selected?.startNode || "—"} → {selected?.stopNode || "—"}</Text>
              </View>
              <Pressable accessibilityLabel="Close details" hitSlop={8} onPress={() => setSelected(null)} style={styles.closeButton}>
                <Icon source="close" size={21} color={colors.textDark} />
              </Pressable>
            </View>

            {!detail ? (
              <View style={styles.state}><ActivityIndicator color={colors.primaryBlue} /><Text style={styles.stateText}>Loading checklist…</Text></View>
            ) : (
              <FlatList
                data={detail.items || []}
                keyExtractor={(item, index) => String(item.checklistId || index)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailList}
                ListHeaderComponent={(
                  <>
                    <View style={styles.sheetSummary}>
                      <View style={styles.summaryTopRow}>
                        <Text style={styles.summaryReference} numberOfLines={1}>{selected?.segmentLabel || selected?.packageTitle || "Unlabelled pipe"}</Text>
                        {(() => {
                          const theme = getStatusTheme(selected?.workflowStatus || selected?.status);
                          return <View style={[styles.statusPill, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}><Text style={[styles.statusText, { color: theme.color }]}>{theme.label}</Text></View>;
                        })()}
                      </View>
                      <Text style={styles.summaryProcess}>{[selected?.processDescription || selected?.processCode, selected?.material].filter(Boolean).join(" · ")}</Text>
                      <Text style={styles.summaryPeople}>{selected?.assignedEngineerName || "No engineer"} → {selected?.assignedManagerName || "No manager"}</Text>
                    </View>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Checklist</Text>
                      <View style={styles.itemCount}><Text style={styles.itemCountText}>{detail.items?.length || 0} items</Text></View>
                    </View>
                  </>
                )}
                renderItem={({ item, index }) => {
                  const checklistValue = unwrapChecklistValue(item);
                  const isBoolean = typeof checklistValue === "boolean";
                  return (
                    <View style={styles.answer}>
                      <View style={styles.answerIndex}><Text style={styles.answerIndexText}>{index + 1}</Text></View>
                      <View style={styles.answerCopy}>
                        <View style={styles.answerHeadingRow}>
                          <Text style={styles.answerRequirement}>{item.requirement || item.title || `Checklist ${item.checklistId}`}</Text>
                          {isBoolean ? <ChecklistAnswer item={item} /> : null}
                        </View>
                        {!isBoolean ? <ChecklistAnswer item={item} /> : null}
                      </View>
                    </View>
                  );
                }}
                ListFooterComponent={(
                  <View style={styles.actions}>
                    {pendingAction ? (
                      <View style={styles.remarkBox}>
                        <Text style={styles.answerTitle}>Remark</Text>
                        <TextInput value={actionRemark} onChangeText={setActionRemark} placeholder="Enter reason" placeholderTextColor={colors.textSecondary} multiline style={styles.remarkInput} />
                        <View style={styles.actionRow}>
                          <Pressable onPress={() => setPendingAction("")} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}><Text style={styles.secondaryActionText}>Cancel</Text></Pressable>
                          <Pressable
                            disabled={!actionRemark.trim() || actionBusy}
                            onPress={async () => {
                              const action = pendingAction;
                              const remark = actionRemark.trim();
                              setPendingAction("");
                              setActionRemark("");
                              setActionBusy(true);
                              try {
                                await updatePipeSubmissionWorkflow({ submissionId: selected.submissionId, action, remark });
                                setSelected(null);
                                await load();
                              } catch (actionError) {
                                Alert.alert("Action failed", actionError?.message || "Please try again.");
                              } finally {
                                setActionBusy(false);
                              }
                            }}
                            style={({ pressed }) => [styles.action, (!actionRemark.trim() || actionBusy) && styles.actionDisabled, pressed && styles.pressed]}
                          >
                            <Text style={styles.actionText}>{actionBusy ? "Submitting…" : "Submit"}</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : actions.length ? actions.map((action) => (
                      <Pressable disabled={actionBusy} key={action.key} onPress={() => runAction(action.key)} style={({ pressed }) => [styles.action, styles.workflowAction, pressed && styles.pressed]}>
                        <Text style={styles.actionText}>{action.label}</Text>
                      </Pressable>
                    )) : (
                      <View style={styles.viewOnlyNotice}>
                        <Icon source={isOnline ? "eye-outline" : "cloud-off-outline"} size={18} color={colors.textSecondary} />
                        <Text style={styles.viewOnlyText}>{isOnline ? "This request is view-only for your role or assignment." : "Review actions are unavailable offline. Cached request data is shown."}</Text>
                      </View>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  search: { marginHorizontal: moderateScale(16), marginTop: verticalScale(12), marginBottom: verticalScale(7), minHeight: verticalScale(46), backgroundColor: colors.white, borderRadius: moderateScale(14), borderCurve: "continuous", borderWidth: 1, borderColor: colors.border, paddingHorizontal: moderateScale(13), flexDirection: "row", alignItems: "center", gap: moderateScale(8), boxShadow: "0 2px 10px rgba(18, 59, 99, 0.05)" },
  searchInput: { flex: 1, paddingVertical: verticalScale(10), color: colors.textDark, fontFamily: fonts.regular, fontSize: fontScale(13) },
  tabsScroll: { flexGrow: 0, flexShrink: 0 },
  tabs: { paddingHorizontal: moderateScale(16), paddingVertical: verticalScale(5), gap: moderateScale(8) },
  tab: { height: verticalScale(38), paddingHorizontal: moderateScale(12), borderRadius: moderateScale(19), borderCurve: "continuous", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", gap: moderateScale(6) },
  tabActive: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  tabText: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontScale(12), lineHeight: fontScale(16) },
  tabTextActive: { color: colors.white },
  tabCount: { minWidth: moderateScale(20), height: moderateScale(20), paddingHorizontal: moderateScale(5), borderRadius: moderateScale(10), backgroundColor: colors.surfaceBlue, alignItems: "center", justifyContent: "center" },
  tabCountActive: { backgroundColor: "rgba(255,255,255,0.20)" },
  tabCountText: { color: colors.primaryBlue, fontFamily: fonts.bold, fontSize: fontScale(10) },
  tabCountTextActive: { color: colors.white },
  pressed: { opacity: 0.72 },
  list: { paddingHorizontal: moderateScale(16), paddingTop: verticalScale(10), gap: verticalScale(10), flexGrow: 1 },
  card: { backgroundColor: colors.white, borderRadius: moderateScale(16), borderCurve: "continuous", borderWidth: 1, borderColor: colors.border, padding: moderateScale(14), gap: verticalScale(9), boxShadow: "0 4px 16px rgba(18, 59, 99, 0.07)" },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: moderateScale(9) },
  cardIdentity: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: moderateScale(10) },
  cardIcon: { width: moderateScale(38), height: moderateScale(38), borderRadius: moderateScale(12), backgroundColor: colors.surfaceBlue, alignItems: "center", justifyContent: "center" },
  cardTitleWrap: { flex: 1, minWidth: 0, gap: verticalScale(2) },
  title: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fontScale(15), lineHeight: fontScale(19) },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontScale(11.5), lineHeight: fontScale(16) },
  statusPill: { maxWidth: "42%", minHeight: verticalScale(26), paddingHorizontal: moderateScale(8), borderRadius: moderateScale(13), borderCurve: "continuous", borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: moderateScale(5) },
  statusDot: { width: moderateScale(5), height: moderateScale(5), borderRadius: moderateScale(3) },
  statusText: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: fontScale(10), lineHeight: fontScale(13), textTransform: "capitalize" },
  chainagePill: { alignSelf: "flex-start", minHeight: verticalScale(25), paddingHorizontal: moderateScale(8), borderRadius: moderateScale(8), backgroundColor: colors.surfaceBluePale, flexDirection: "row", alignItems: "center", gap: moderateScale(5) },
  chainageText: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: fontScale(10.5) },
  cardDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  activityRow: { flexDirection: "row", alignItems: "center", gap: moderateScale(8) },
  activityCopy: { flex: 1, minWidth: 0, gap: verticalScale(2) },
  activityPrimary: { color: colors.textDark, fontFamily: fonts.medium, fontSize: fontScale(11.5), lineHeight: fontScale(15) },
  activitySecondary: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontScale(10.5), lineHeight: fontScale(14) },
  state: { paddingVertical: verticalScale(48), alignItems: "center", justifyContent: "center", gap: verticalScale(10) },
  stateText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontScale(12) },
  emptyCard: { marginTop: verticalScale(34), marginHorizontal: moderateScale(22), paddingVertical: verticalScale(30), paddingHorizontal: moderateScale(20), backgroundColor: colors.white, borderRadius: moderateScale(18), borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  emptyIcon: { width: moderateScale(52), height: moderateScale(52), borderRadius: moderateScale(18), backgroundColor: colors.surfaceBlue, alignItems: "center", justifyContent: "center", marginBottom: verticalScale(12) },
  emptyTitle: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fontScale(14), marginBottom: verticalScale(4) },
  emptyText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontScale(12), textAlign: "center" },
  error: { marginHorizontal: moderateScale(16), marginTop: verticalScale(4), paddingHorizontal: moderateScale(11), paddingVertical: verticalScale(9), backgroundColor: "#FFF1F1", borderRadius: moderateScale(11), flexDirection: "row", alignItems: "center", gap: moderateScale(7) },
  errorText: { color: colors.danger, flex: 1, fontFamily: fonts.regular, fontSize: fontScale(11) },
  link: { color: colors.primaryBlue, fontFamily: fonts.bold, fontSize: fontScale(11) },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.modalOverlay },
  modalDismissArea: { flex: 1 },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: moderateScale(24), borderTopRightRadius: moderateScale(24), borderCurve: "continuous", paddingHorizontal: moderateScale(16), paddingTop: verticalScale(8), maxHeight: "92%", minHeight: "48%" },
  sheetHandle: { alignSelf: "center", width: moderateScale(38), height: verticalScale(4), borderRadius: moderateScale(2), backgroundColor: colors.neutralBorder, marginBottom: verticalScale(10) },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: moderateScale(10), paddingBottom: verticalScale(12) },
  sheetHeaderCopy: { flex: 1, minWidth: 0 },
  sheetEyebrow: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontScale(9), letterSpacing: 0.8, marginBottom: verticalScale(2) },
  sheetTitle: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fontScale(18), lineHeight: fontScale(22) },
  closeButton: { width: moderateScale(36), height: moderateScale(36), borderRadius: moderateScale(12), backgroundColor: colors.surfaceBluePale, alignItems: "center", justifyContent: "center" },
  detailList: { paddingBottom: verticalScale(8) },
  sheetSummary: { backgroundColor: colors.surfaceBluePale, borderWidth: 1, borderColor: colors.border, borderRadius: moderateScale(14), borderCurve: "continuous", padding: moderateScale(12), gap: verticalScale(5) },
  summaryTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: moderateScale(8) },
  summaryReference: { flex: 1, minWidth: 0, color: colors.textDark, fontFamily: fonts.bold, fontSize: fontScale(13) },
  summaryProcess: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: fontScale(11.5) },
  summaryPeople: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontScale(10.5) },
  sectionHeader: { paddingTop: verticalScale(16), paddingBottom: verticalScale(7), flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fontScale(14) },
  itemCount: { paddingHorizontal: moderateScale(8), paddingVertical: verticalScale(3), borderRadius: moderateScale(9), backgroundColor: colors.surfaceBlue },
  itemCountText: { color: colors.primaryBlue, fontFamily: fonts.semiBold, fontSize: fontScale(10) },
  answer: { paddingVertical: verticalScale(12), borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, flexDirection: "row", alignItems: "flex-start", gap: moderateScale(10) },
  answerIndex: { width: moderateScale(24), height: moderateScale(24), borderRadius: moderateScale(8), backgroundColor: colors.surfaceBlue, alignItems: "center", justifyContent: "center" },
  answerIndexText: { color: colors.primaryBlue, fontFamily: fonts.bold, fontSize: fontScale(10) },
  answerCopy: { flex: 1, minWidth: 0, gap: verticalScale(4) },
  answerTitle: { color: colors.textDark, fontFamily: fonts.semiBold, fontSize: fontScale(12.5), lineHeight: fontScale(17) },
  answerHeadingRow: { flexDirection: "row", alignItems: "center", gap: moderateScale(8) },
  answerRequirement: { flex: 1, color: colors.textDark, fontFamily: fonts.medium, fontSize: fontScale(11.5), lineHeight: fontScale(16) },
  answerValue: { alignSelf: "flex-start", color: colors.primaryBlue, fontFamily: fonts.medium, fontSize: fontScale(11.5), lineHeight: fontScale(16), backgroundColor: colors.surfaceBluePale, borderRadius: moderateScale(7), overflow: "hidden", paddingHorizontal: moderateScale(8), paddingVertical: verticalScale(5) },
  booleanAnswer: { alignSelf: "flex-start", minHeight: verticalScale(27), paddingHorizontal: moderateScale(8), borderRadius: moderateScale(8), flexDirection: "row", alignItems: "center", gap: moderateScale(5) },
  booleanAnswerYes: { backgroundColor: "#E8FFF2" },
  booleanAnswerNo: { backgroundColor: "#FFF1F1" },
  booleanAnswerText: { fontFamily: fonts.semiBold, fontSize: fontScale(11) },
  answerImages: { flexDirection: "row", flexWrap: "wrap", gap: moderateScale(7), paddingTop: verticalScale(2) },
  answerImage: { width: moderateScale(88), height: verticalScale(68), borderRadius: moderateScale(9), backgroundColor: colors.neutralCanvas },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: moderateScale(9), paddingTop: verticalScale(16) },
  actionRow: { flexDirection: "row", gap: moderateScale(9) },
  action: { minHeight: verticalScale(43), backgroundColor: colors.primaryBlue, paddingHorizontal: moderateScale(17), borderRadius: moderateScale(11), alignItems: "center", justifyContent: "center" },
  workflowAction: { flexGrow: 1 },
  actionDisabled: { opacity: 0.45 },
  secondaryAction: { minHeight: verticalScale(43), flex: 1, paddingHorizontal: moderateScale(16), borderRadius: moderateScale(11), borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  secondaryActionText: { color: colors.textDark, fontFamily: fonts.semiBold, fontSize: fontScale(12) },
  actionText: { color: colors.white, fontFamily: fonts.bold, fontSize: fontScale(12) },
  remarkBox: { width: "100%", gap: verticalScale(9) },
  remarkInput: { minHeight: verticalScale(82), borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBg, borderRadius: moderateScale(11), padding: moderateScale(11), color: colors.textDark, fontFamily: fonts.regular, fontSize: fontScale(12), textAlignVertical: "top" },
  viewOnlyNotice: { width: "100%", flexDirection: "row", alignItems: "center", gap: moderateScale(8), padding: moderateScale(11), borderRadius: moderateScale(11), backgroundColor: colors.surfaceBluePale },
  viewOnlyText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontScale(10.5), lineHeight: fontScale(14) },
});
