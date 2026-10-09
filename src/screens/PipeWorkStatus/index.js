import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Icon, IconButton, Searchbar } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../../context/AuthContext";
import { fetchPipeSubmission, fetchPipeWorkStatus, updatePipeSubmissionWorkflow } from "../../services/pipeNetworkApi";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import { fontScale, moderateScale, verticalScale } from "../../constants/metrics";
import { getPipeCache, listPendingPipeMutations, savePipeCache } from "../../services/pipeNetworkOfflineStore";
import { IMAGE_BASE_URL } from "../../config/env";
import { getUnitStatusPalette } from "../../utils/unitStatusPalette";
import ImageViewerModal from "../../components/ImageViewerModal";
import { CustomTabBar } from "../../components/WorkStatusTabView";
import omsStyles from "../WorkStatus/styles";

const TABS = ["all", "submitted", "verified", "approved", "rejected", "modify_request", "modify_approved"];
const OMS_TABS = ["Submitted", "Pending", "Verified", "Approved", "Commented", "Modify Request", "Modify Approved"];
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
const isRemarkRequired = (action, status) =>
  ["reject", "modify_rejected"].includes(action) ||
  (action === "modify_approved" && status !== "modify_request");

const getStatusLabel = (value = "") => TAB_LABELS[String(value).toLowerCase()] || String(value || "Pending").replace(/_/g, " ");

const getStatusTheme = (value = "") => {
  const label = getStatusLabel(value);
  if (label === "Modify request") return { label, backgroundColor: "#F1EAFF", color: "#5B21B6", borderColor: "#7C3AED", icon: "file-edit-outline" };
  if (label === "Modify approved") return { label, backgroundColor: "#E6FFFA", color: "#0F766E", borderColor: "#0D9488", icon: "file-check-outline" };
  const palette = getUnitStatusPalette(label === "Commented" ? "Commented" : label);
  const icon = { Submitted: "timeline-clock-outline", Verified: "shield-check-outline", Approved: "check-decagram-outline", Commented: "message-alert-outline" }[label] || "progress-clock";
  return { label, backgroundColor: palette.soft, color: palette.text, borderColor: palette.solid, icon };
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
  let value = item.value ?? item.valueJson;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!value || typeof value !== "object" || Array.isArray(value) || !Object.prototype.hasOwnProperty.call(value, "value")) {
      break;
    }
    value = value.value;
  }
  return value;
};

const resolveImageUrl = (value = "") => {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^(https?:|file:|content:|data:|blob:)/i.test(source)) return source;
  if (!IMAGE_BASE_URL) return source;
  return `${String(IMAGE_BASE_URL).replace(/\/?$/, "/")}${source.replace(/^\/+/, "")}`;
};

const getChecklistImages = (value) => {
  const candidates = Array.isArray(value)
    ? value
    : Array.isArray(value?.files)
      ? value.files
      : value?.url || value?.publicUrl || value?.imageUrl || value?.objectKey || value?.storageKey || value?.uri
        ? [value]
        : [];
  return candidates.map((file, index) => {
    const primaryUri = resolveImageUrl(
      file?.url || file?.publicUrl || file?.imageUrl || file?.image_url ||
      file?.uri || file?.filePath || (typeof file === "string" ? file : ""),
    );
    const storageUri = resolveImageUrl(file?.storageKey || file?.objectKey || file?.object_key || file?.key);
    const uri = primaryUri || storageUri;
    if (!uri) return null;
    return {
      id: String(file?.imageId || file?.id || uri || `checklist-image-${index}`),
      uri,
      fallbackUri: storageUri && storageUri !== uri ? storageUri : "",
      title: file?.fileName || file?.name || `Checklist photo ${index + 1}`,
      meta: file?.uploadedAt || file?.takenAt || "",
    };
  }).filter(Boolean);
};

const normalizeSubmissionDetail = (response) => {
  let detail = response;
  for (let depth = 0; depth < 2; depth += 1) {
    if (detail?.submissionId || Array.isArray(detail?.items)) return detail;
    if (detail?.data && typeof detail.data === "object") {
      detail = detail.data;
      continue;
    }
    break;
  }
  return detail;
};

const logSubmissionPayload = (label, value) => {
  if (typeof __DEV__ === "undefined" || !__DEV__) return;
  let serialized;
  try {
    serialized = JSON.stringify(value, null, 2) ?? String(value);
  } catch (error) {
    serialized = `[Could not serialize response: ${error?.message || "unknown error"}]`;
  }
  const chunkSize = 3000;
  const partCount = Math.max(1, Math.ceil(serialized.length / chunkSize));
  for (let part = 0; part < partCount; part += 1) {
    console.log(`${label} [${part + 1}/${partCount}] ${serialized.slice(part * chunkSize, (part + 1) * chunkSize)}`);
  }
};

const logSubmissionDetail = (submissionId, response) => {
  if (typeof __DEV__ === "undefined" || !__DEV__) return;
  const detail = normalizeSubmissionDetail(response);
  const checklistImages = (detail?.items || []).flatMap((item) =>
    getChecklistImages(unwrapChecklistValue(item)).map((image) => ({ checklistId: item.checklistId, uri: image.uri, fallbackUri: image.fallbackUri })),
  );
  console.info("[PipeWorkStatus] resolved submission images", {
    submissionId,
    checklistImages,
    resubmitImages: getChecklistImages(detail?.resubmitImages).map((image) => image.uri),
  });
};

const ChecklistImageThumbnail = ({ image, index, images, onViewImages, variant = "inline" }) => {
  const [failed, setFailed] = useState(false);
  const [activeUri, setActiveUri] = useState(image.uri);
  React.useEffect(() => {
    setActiveUri(image.uri);
    setFailed(false);
  }, [image.uri, image.fallbackUri]);
  const handlePress = () => {
    if (failed) {
      setFailed(false);
      setActiveUri(image.uri);
      return;
    }
    onViewImages?.(images.map((item, itemIndex) => itemIndex === index ? { ...item, uri: activeUri } : item), index);
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={failed ? `Retry ${image.title}` : `View ${image.title}`}
      onPress={handlePress}
      style={({ pressed }) => [variant === "gallery" ? omsStyles.galleryImageCard : omsStyles.filePreviewTouch, pressed && styles.pressed]}
    >
      {failed ? (
        <View style={omsStyles.filePlaceholder}>
          <Icon source="image-off-outline" size={22} color={colors.textSecondary} />
          <Text style={omsStyles.filePlaceholderText}>Tap to retry</Text>
        </View>
      ) : (
        <Image
          source={{ uri: activeUri }}
          style={variant === "gallery" ? omsStyles.galleryImage : omsStyles.inlinePreviewImage}
          resizeMode="cover"
          onLoad={(event) => {
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.info("[PipeWorkStatus] image loaded", {
                uri: activeUri,
                width: event?.nativeEvent?.source?.width,
                height: event?.nativeEvent?.source?.height,
              });
            }
          }}
          onError={(event) => {
            const canUseStorageKey = Boolean(image.fallbackUri && activeUri !== image.fallbackUri);
            if (canUseStorageKey) setActiveUri(image.fallbackUri);
            else setFailed(true);
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.warn(canUseStorageKey ? "[PipeWorkStatus] image URL failed; trying storageKey" : "[PipeWorkStatus] image failed to load", {
                uri: activeUri,
                fallbackUri: canUseStorageKey ? image.fallbackUri : undefined,
                error: event?.nativeEvent?.error || "Unknown image loading error",
              });
            }
          }}
        />
      )}
      {variant === "gallery" ? <Text style={omsStyles.galleryImageTitle} numberOfLines={1}>{image.title}</Text> : null}
    </Pressable>
  );
};

const ChecklistImageGallery = ({ images = [], onViewImages, variant = "inline" }) => (
  <View style={variant === "gallery" ? omsStyles.imageGalleryGrid : omsStyles.valueBlock}>
    {images.map((image, index) => variant === "gallery" ? (
      <ChecklistImageThumbnail key={image.id} image={image} index={index} images={images} onViewImages={onViewImages} variant="gallery" />
    ) : (
      <View key={image.id} style={omsStyles.fileRow}>
        <ChecklistImageThumbnail image={image} index={index} images={images} onViewImages={onViewImages} />
      </View>
    ))}
  </View>
);

const ChecklistAnswer = ({ item, onViewImages }) => {
  const value = unwrapChecklistValue(item);
  const images = getChecklistImages(value);

  if (images.length) {
    return <ChecklistImageGallery images={images} onViewImages={onViewImages} />;
  }

  if (typeof value === "boolean") {
    return (
      <View style={[omsStyles.checklistInlineStatus, { backgroundColor: value ? "#ECFBF3" : "#FFF3F0", borderColor: value ? "#C7EFD8" : "#F1C5B8" }]}>
        <Icon source={value ? "check-circle" : "close-circle"} size={18} color={value ? colors.completed : colors.danger} />
      </View>
    );
  }

  const displayValue = value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "—");
  return <View style={omsStyles.valueBlock}><View style={omsStyles.valueHighlight}><Text style={omsStyles.valueHighlightText}>{displayValue}</Text></View></View>;
};

const getActions = (item, user) => {
  const role = roleCode(user?.role);
  const userId = String(user?.id || "");
  const status = item?.workflowStatus || item?.status;
  const engineer = userId && userId === String(item?.assignedEngineerId || "");
  const manager = userId && userId === String(item?.assignedManagerId || "");
  if ((role === "engineer" || role === "manager") && (engineer || manager)) {
    if (status === "submitted") return [
      { key: "verify", label: "Verify" },
      { key: "modify_approved", label: "Need modification" },
      { key: "reject", label: "Need correction" },
    ];
    if (status === "verified") return [
      ...(role === "manager" && manager ? [{ key: "approve", label: "Approve" }] : []),
      { key: "reject", label: "Need correction" },
    ];
    if (status === "modify_request") return [
      { key: "modify_approved", label: "Allow modification" },
      { key: "modify_rejected", label: "Reject modification" },
    ];
  }
  if (role === "supervisor") {
    if (["verified", "approved"].includes(status)) {
      return [{ key: "modify_request", label: "Request modification" }];
    }
    if (["modify_approved", "rejected"].includes(status)) {
      return [{ key: "edit_resubmit", label: "Edit & resubmit" }];
    }
  }
  return [];
};

export default function PipeWorkStatusScreen({ navigation, route }) {
  const { projectId, material } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.max(0, Math.min(windowHeight * 0.82, windowHeight - insets.top - insets.bottom - verticalScale(24)));
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [imageViewerState, setImageViewerState] = useState({ visible: false, items: [], initialIndex: 0 });
  const [actionBusy, setActionBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [actionRemark, setActionRemark] = useState("");
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingResubmissions, setPendingResubmissions] = useState(new Map());
  const controllerRef = useRef(null);
  const activeResourceRef = useRef("");

  const openChecklistImages = useCallback((images = [], initialIndex = 0) => {
    const validImages = images.filter((image) => image?.uri);
    if (!validImages.length) return;
    setImageViewerState({
      visible: true,
      items: validImages,
      initialIndex: Math.min(Math.max(0, initialIndex), validImages.length - 1),
    });
  }, []);

  const closeImageViewer = useCallback(() => {
    setImageViewerState((current) => ({ ...current, visible: false }));
  }, []);

  React.useEffect(() => {
    const applyNetworkState = (state) => {
      setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
    };
    void NetInfo.fetch().then(applyNetworkState);
    return NetInfo.addEventListener(applyNetworkState);
  }, []);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const resource = `work-status:${material || "all"}:${tab}:${search.trim()}`;
    if (activeResourceRef.current !== resource) {
      activeResourceRef.current = resource;
      setData(null);
    }
    setLoading(true);
    setError("");
    void listPendingPipeMutations(String(user?.id || user?.mobile || ""), { force: true })
      .then((entries) => {
        if (!controller.signal.aborted) setPendingResubmissions(new Map(entries
          .filter((entry) => entry.operation === "resubmit_pipe_entry" && entry.payload?.submissionId)
          .map((entry) => [String(entry.payload.submissionId), {
            needsPhoto: entry.payload?.resubmitMode !== "modify_approved" && !entry.payload?.resubmitFile,
          }])));
      })
      .catch(() => { if (!controller.signal.aborted) setPendingResubmissions(new Map()); });
    let hasCachedData = false;
    try {
      const cached = await getPipeCache({ ownerUserId: user?.id, projectId, resource });
      if (cached?.payload && !controller.signal.aborted) {
        hasCachedData = true;
        setData(cached.payload);
        setLoading(false);
      }
    } catch {
      // A cache read failure should not leave Work Status stuck in a loading state.
    }
    try {
      const networkState = await NetInfo.fetch();
      if (!isOnline || networkState.isConnected === false || networkState.isInternetReachable === false) {
        if (!controller.signal.aborted) {
          if (!hasCachedData) setError("Offline: this work-status list is not saved on this device yet.");
          setLoading(false);
        }
        return;
      }
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
  }, [isOnline, material, projectId, search, tab, user?.id, user?.mobile]);

  useFocusEffect(useCallback(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => { clearTimeout(timer); controllerRef.current?.abort(); };
  }, [load]));

  const openItem = async (item) => {
    setSelected(item);
    setDetail(null);
    setDetailLoading(true);
    const resource = `submission-detail:${item.submissionId}`;
    let hasCachedDetail = false;
    try {
      const cached = await getPipeCache({ ownerUserId: user?.id, projectId, resource });
      if (cached?.payload) {
        hasCachedDetail = true;
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log("[PipeWorkStatus] showing CACHED submission detail; waiting for API", {
            submissionId: item.submissionId,
            cachedAt: cached.refreshedAt,
          });
        }
        setDetail(normalizeSubmissionDetail(cached.payload));
      }
    } catch {
      // Detail API remains available when the local copy is missing or unreadable.
    }
    try {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected === false || networkState.isInternetReachable === false) {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log("[PipeWorkStatus] submission details API skipped: offline", { submissionId: item.submissionId });
        }
        if (!hasCachedDetail) Alert.alert("Offline", "This submission’s checklist has not been saved on this device yet.");
        return;
      }
      const startedAt = Date.now();
      const response = await fetchPipeSubmission({
        submissionId: item.submissionId,
        onResponse: ({ status, body, url }) => {
          if (typeof __DEV__ === "undefined" || !__DEV__) return;
          console.log("[PipeWorkStatus] submission details HTTP response", {
            submissionId: item.submissionId,
            method: "GET",
            url,
            status,
            elapsedMs: Date.now() - startedAt,
          });
          logSubmissionPayload("[PipeWorkStatus] RAW API RESPONSE", body);
        },
      });
      logSubmissionDetail(item.submissionId, response);
      const normalizedDetail = normalizeSubmissionDetail(response);
      setDetail(normalizedDetail);
      await savePipeCache({ ownerUserId: user?.id, projectId, resource, payload: normalizedDetail });
    } catch (detailError) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.warn("[PipeWorkStatus] submission details API failed", {
          submissionId: item.submissionId,
          status: detailError?.status || 0,
          code: detailError?.code || null,
          message: detailError?.message,
        });
        if (detailError?.details) logSubmissionPayload("[PipeWorkStatus] ERROR API RESPONSE", detailError.details);
      }
      if (!hasCachedDetail) Alert.alert("Could not open request", detailError?.message || "Please try again.");
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = (action) => {
    if (action === "edit_resubmit") {
      if (!detail?.packageId || !selected?.submissionId) {
        Alert.alert("Checklist unavailable", "Refresh this submission before editing it.");
        return;
      }
      setSelected(null);
      navigation.navigate("PipeNetworkEntry", {
        projectId,
        material: selected.material,
        resubmitSubmission: selected,
        submissionDetail: detail,
      });
      return;
    }
    const needsRemark = ["reject", "modify_request", "modify_rejected"].includes(action) ||
      isRemarkRequired(action, selected?.workflowStatus || selected?.status);
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
  const selectedPending = selected ? pendingResubmissions.get(String(selected.submissionId)) : null;
  const selectedNeedsPhoto = Boolean(selectedPending?.needsPhoto && (selected?.workflowStatus || selected?.status) === "rejected");
  const actions = useMemo(
    () => getActions(selected, user).filter((action) => (isOnline || action.key === "edit_resubmit") && !((selectedPending && !selectedNeedsPhoto) && action.key === "edit_resubmit")),
    [isOnline, selected, selectedNeedsPhoto, selectedPending, user],
  );
  const pendingRemarkRequired = isRemarkRequired(
    pendingAction,
    selected?.workflowStatus || selected?.status,
  );
  const resubmitImages = useMemo(
    () => getChecklistImages(detail?.resubmitImages),
    [detail?.resubmitImages],
  );

  return (
    <SafeAreaView style={omsStyles.safeArea}>
      <View style={omsStyles.header}>
        <View style={omsStyles.headerActionSlot}>
          <IconButton icon="arrow-left" size={22} onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        </View>
        <Text style={omsStyles.headerTitle}>Work Status</Text>
        <View style={omsStyles.headerActionSlot}>
          <IconButton icon="information-outline" iconColor={colors.primaryBlue} size={22} style={omsStyles.headerInfoButton} onPress={() => setShowStatusInfo(true)} accessibilityLabel="Status information" />
        </View>
      </View>

      <View style={omsStyles.searchRow}>
        <Searchbar
          placeholder="Search node, pipe or process"
          onChangeText={setSearch}
          value={search}
          style={omsStyles.searchbar}
          inputStyle={omsStyles.searchInput}
          iconColor={colors.textSecondary}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <CustomTabBar
        tabs={OMS_TABS}
        activeTabIndex={TABS.indexOf(tab)}
        onTabPress={(index) => setTab(TABS[index])}
        countsByTab={Object.fromEntries(OMS_TABS.map((name, index) => [name, index === 0 ? counts.total || 0 : counts[TABS[index]] || 0]))}
      />

      {!!error && data !== null && (
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
        contentContainerStyle={[omsStyles.sceneContent, { paddingBottom: insets.bottom + verticalScale(20) }]}
        renderItem={({ item }) => {
          const statusTheme = getStatusTheme(item.workflowStatus || item.status);
          const pendingResubmission = pendingResubmissions.get(String(item.submissionId));
          const reference = [
            item.segmentLabel || item.packageTitle || "Unlabelled pipe",
            item.processDescription || item.processCode,
            item.material,
          ].filter(Boolean).join(" · ");
          const hasChainage = item.chainageFromM != null && item.chainageToM != null;
          return (
            <Pressable accessibilityRole="button" accessibilityLabel={`View checklist for ${item.startNode || "start"} to ${item.stopNode || "end"}`} onPress={() => openItem(item)} style={({ pressed }) => [omsStyles.card, pressed && styles.pressed]}>
              <View style={omsStyles.cardTopRow}>
                <View style={omsStyles.cardHeaderRow}>
                  <View style={omsStyles.cardIdentityRow}>
                    <View style={omsStyles.cardIdentityIcon}><Icon source="pipe" size={18} color={colors.primaryBlue} /></View>
                    <View style={omsStyles.cardTextWrap}>
                      <Text style={omsStyles.cardPrimaryTitle} numberOfLines={2}>{item.startNode || "—"} → {item.stopNode || "—"}</Text>
                      <Text style={omsStyles.cardProcessText} numberOfLines={2}>{reference}{hasChainage ? ` · Ch ${item.chainageFromM}–${item.chainageToM} m` : ""}</Text>
                    </View>
                  </View>
                  <View style={omsStyles.cardStatusWrap}>
                    <View style={[omsStyles.statusPill, { backgroundColor: statusTheme.backgroundColor, borderColor: statusTheme.borderColor }]}>
                      <Icon source={statusTheme.icon} size={16} color={statusTheme.color} />
                      <Text style={[omsStyles.statusPillText, { color: statusTheme.color }]}>{statusTheme.label}</Text>
                    </View>
                  </View>
                </View>

                <View style={omsStyles.cardBodyWrap}>
                  <View style={omsStyles.cardMetaGroup}>
                    <View style={omsStyles.workflowMetaRow}>
                      <View style={[omsStyles.workflowMetaTag, { backgroundColor: statusTheme.backgroundColor }]}>
                        <Text style={[omsStyles.workflowMetaTagText, { color: statusTheme.color }]}>Submitted</Text>
                      </View>
                      <View style={omsStyles.workflowMetaContent}>
                        <Text style={omsStyles.workflowMetaActor} numberOfLines={1}>{item.submittedByName || "Unknown"}</Text>
                        {item.submittedAt || item.createdAt ? <Text style={omsStyles.workflowMetaSeparator}>•</Text> : null}
                        {item.submittedAt || item.createdAt ? <Text style={omsStyles.workflowMetaDate} numberOfLines={1}>{formatDate(item.submittedAt || item.createdAt)}</Text> : null}
                      </View>
                    </View>
                    <View style={omsStyles.workflowMetaRow}>
                      <View style={[omsStyles.workflowMetaTag, { backgroundColor: colors.surfaceBluePale }]}>
                        <Text style={[omsStyles.workflowMetaTagText, { color: colors.primaryBlue }]}>Reviewers</Text>
                      </View>
                      <View style={omsStyles.workflowMetaContent}>
                        <Text style={omsStyles.workflowMetaActor} numberOfLines={1}>{item.assignedEngineerName || "No engineer"}</Text>
                        <Text style={omsStyles.workflowMetaSeparator}>→</Text>
                        <Text style={omsStyles.workflowMetaDate} numberOfLines={1}>{item.assignedManagerName || "No manager"}</Text>
                      </View>
                    </View>
                  </View>
                  {pendingResubmission ? (
                    <View style={styles.pendingSyncNotice}>
                      <Icon source="cloud-upload-outline" size={16} color={colors.primaryBlue} />
                      <Text style={styles.pendingSyncText}>{pendingResubmission.needsPhoto && (item.workflowStatus || item.status) === "rejected" ? "Correction photo needed to sync" : "Resubmission saved · waiting to sync"}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={omsStyles.cardOpenRow}>
                <Text style={omsStyles.cardOpenText}>View checklist</Text>
                <Icon source="chevron-right" size={18} color={colors.primaryBlue} />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={loading && data === null ? (
          <View style={omsStyles.stateWrap}><ActivityIndicator size="large" color={colors.primaryBlue} /><Text style={omsStyles.stateText}>Loading board…</Text></View>
        ) : error && data === null ? (
          <View style={omsStyles.stateWrap}>
            <View style={omsStyles.emptyIconShell}><Icon source="alert-circle-outline" size={28} color={colors.primaryOrange} /></View>
            <Text style={omsStyles.stateText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={load} style={omsStyles.retryButton}><Text style={omsStyles.retryButtonText}>Retry</Text></Pressable>
          </View>
        ) : (
          <View style={omsStyles.emptyState}>
            <View style={omsStyles.emptyIconShell}><Icon source="layers-search-outline" size={28} color={colors.primaryBlue} /></View>
            <Text style={omsStyles.emptyTitle}>No matching requests</Text>
            <Text style={omsStyles.emptyText}>Try another status or clear the search.</Text>
          </View>
        )}
      />

      <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={[omsStyles.sheetOverlay, { paddingTop: insets.top + verticalScale(12) }]}>
          <Pressable style={omsStyles.sheetBackdrop} onPress={() => setSelected(null)} />
          <View style={[omsStyles.bottomSheet, { maxHeight: sheetMaxHeight, paddingBottom: Math.max(insets.bottom, verticalScale(14)) }]}>
            <View style={omsStyles.sheetHandle} />
            <View style={omsStyles.sheetHeader}>
              <View style={omsStyles.sheetHeaderCopy}>
                <Text style={omsStyles.sheetTitle}>Submission details</Text>
                <Text style={omsStyles.sheetSubtitle}>Review checklist and workflow activity</Text>
              </View>
              <IconButton icon="close" size={20} iconColor={colors.textDark} onPress={() => setSelected(null)} accessibilityLabel="Close details" />
            </View>

            <View style={omsStyles.sheetSummaryCard}>
              <View style={omsStyles.sheetSummaryTopRow}>
                <View style={omsStyles.sheetSummaryIcon}><Icon source="pipe" size={19} color={colors.primaryBlue} /></View>
                <View style={omsStyles.sheetSummaryCopy}>
                  <Text style={omsStyles.sheetSummaryTitle}>{selected?.startNode || "—"} → {selected?.stopNode || "—"}</Text>
                  <Text style={omsStyles.sheetSummaryDetails}>{[selected?.segmentLabel || selected?.packageTitle, selected?.processDescription || selected?.processCode, selected?.material].filter(Boolean).join(" · ")}</Text>
                </View>
              </View>
              <View style={omsStyles.sheetStatusRow}>
                {(() => {
                  const theme = getStatusTheme(selected?.workflowStatus || selected?.status);
                  return <View style={[omsStyles.statusPill, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
                    <Icon source={theme.icon} size={13} color={theme.color} />
                    <Text style={[omsStyles.statusPillText, { color: theme.color }]}>{theme.label}</Text>
                  </View>;
                })()}
              </View>
            </View>

            {!detail && detailLoading ? (
              <View style={omsStyles.sheetStateCard}><ActivityIndicator color={colors.primaryBlue} /><Text style={omsStyles.sheetStateText}>Loading checklist…</Text></View>
            ) : !detail ? (
              <View style={omsStyles.sheetStateCard}>
                <Icon source={isOnline ? "alert-circle-outline" : "cloud-off-outline"} size={24} color={colors.textSecondary} />
                <Text style={omsStyles.sheetStateText}>{isOnline ? "Checklist details could not be loaded." : "Checklist details are unavailable offline on this device."}</Text>
                {isOnline && selected ? <Pressable accessibilityRole="button" onPress={() => openItem(selected)} style={omsStyles.retryButton}><Text style={omsStyles.retryButtonText}>Retry</Text></Pressable> : null}
              </View>
            ) : (
              <FlatList
                data={detail.items || []}
                keyExtractor={(item, index) => String(item.checklistId || index)}
                showsVerticalScrollIndicator={false}
                style={[omsStyles.sheetScroll, styles.sheetList]}
                contentContainerStyle={[omsStyles.sheetScrollContent, { paddingBottom: Math.max(insets.bottom, verticalScale(14)) }]}
                ListHeaderComponent={(
                  <>
                    {selectedPending ? (
                      <View style={styles.pendingSyncNotice}>
                        <Icon source="cloud-upload-outline" size={16} color={colors.primaryBlue} />
                        <Text style={styles.pendingSyncText}>{selectedNeedsPhoto ? "This older saved correction needs one new photo before it can sync." : "Your changes are saved on this device and will sync when connected."}</Text>
                      </View>
                    ) : null}
                    {resubmitImages.length ? (
                      <View style={omsStyles.reviewDetailsSection}>
                        <View style={omsStyles.sectionTitleRow}>
                          <Text style={omsStyles.sectionTitleText}>Resubmitted photos</Text>
                          <Text style={omsStyles.sectionCountText}>{resubmitImages.length}</Text>
                        </View>
                        <ChecklistImageGallery images={resubmitImages} onViewImages={openChecklistImages} variant="gallery" />
                      </View>
                    ) : null}
                    <View style={omsStyles.pipeLayingSectionHeader}>
                      <View style={omsStyles.pipeLayingTitleWrap}>
                        <Text style={omsStyles.pipeLayingTitle}>Checklist</Text>
                      </View>
                      <View style={omsStyles.pipeLayingCountBadge}><Text style={omsStyles.pipeLayingCountText}>{detail.items?.length || 0} items</Text></View>
                    </View>
                  </>
                )}
                renderItem={({ item, index }) => {
                  const checklistValue = unwrapChecklistValue(item);
                  const isBoolean = typeof checklistValue === "boolean";
                  return (
                    <View style={[omsStyles.checklistCard, isBoolean && omsStyles.checklistCardCompact, index === (detail.items?.length || 0) - 1 && omsStyles.checklistCardLast]}>
                      <View style={isBoolean ? omsStyles.checklistInlineRow : omsStyles.checklistHead}>
                        <View style={isBoolean ? omsStyles.checklistInlineCopy : omsStyles.checklistCopy}>
                          <Text style={omsStyles.checklistTitle}>{item.requirement || item.title || `Checklist ${item.checklistId}`}</Text>
                          {item.description ? <Text style={omsStyles.checklistDescription}>{item.description}</Text> : null}
                          {!isBoolean ? <ChecklistAnswer item={item} onViewImages={openChecklistImages} /> : null}
                        </View>
                        {isBoolean ? <ChecklistAnswer item={item} onViewImages={openChecklistImages} /> : null}
                      </View>
                    </View>
                  );
                }}
                ListFooterComponent={(
                  <View style={styles.actions}>
                    {selectedPending && !selectedNeedsPhoto ? (
                      <View style={styles.viewOnlyNotice}>
                        <Icon source="cloud-upload-outline" size={18} color={colors.primaryBlue} />
                        <Text style={styles.viewOnlyText}>Resubmission is queued. Use Profile → Pending Work to retry now.</Text>
                      </View>
                    ) : pendingAction ? (
                      <View style={styles.remarkBox}>
                        <Text style={styles.answerTitle}>Remark</Text>
                        <TextInput value={actionRemark} onChangeText={setActionRemark} placeholder={pendingRemarkRequired ? "Remark (required)" : "Remark (optional)"} placeholderTextColor={colors.textSecondary} multiline style={styles.remarkInput} />
                        <View style={styles.actionRow}>
                          <Pressable onPress={() => setPendingAction("")} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}><Text style={styles.secondaryActionText}>Cancel</Text></Pressable>
                          <Pressable
                            disabled={(pendingRemarkRequired && !actionRemark.trim()) || actionBusy}
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
                            style={({ pressed }) => [styles.action, ((pendingRemarkRequired && !actionRemark.trim()) || actionBusy) && styles.actionDisabled, pressed && styles.pressed]}
                          >
                            <Text style={styles.actionText}>{actionBusy ? "Submitting…" : "Submit"}</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : actions.length ? [...actions].sort((first, second) => Number(second.key.startsWith("modify")) - Number(first.key.startsWith("modify"))).map((action) => {
                      const isReject = ["reject", "modify_rejected"].includes(action.key);
                      const isVerify = action.key === "verify";
                      const isModify = ["modify_request", "modify_approved"].includes(action.key);
                      const isPrimary = ["approve", "edit_resubmit"].includes(action.key);
                      const icon = isReject ? "close-circle" : isVerify ? "shield-check-outline" : isModify || action.key === "edit_resubmit" ? "file-edit-outline" : "check-decagram-outline";
                      const iconColor = isReject ? "#C44728" : isVerify ? "#135EAF" : isModify ? "#5B21B6" : colors.white;
                      return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={action.label}
                        disabled={actionBusy}
                        key={action.key}
                        onPress={() => runAction(action.key)}
                        style={({ pressed }) => [
                          omsStyles.reviewActionButton,
                          isReject && omsStyles.reviewRejectButton,
                          isVerify && omsStyles.reviewVerifyButton,
                          isModify && omsStyles.needModificationButton,
                          isModify && styles.fullWidthAction,
                          isPrimary && omsStyles.reviewApproveButton,
                          actionBusy && omsStyles.reviewActionButtonDisabled,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={omsStyles.actionButtonContent}>
                          <Icon source={icon} size={16} color={iconColor} style={omsStyles.actionButtonIcon} />
                          <Text style={isReject ? omsStyles.reviewRejectText : isVerify ? omsStyles.reviewVerifyText : isModify ? omsStyles.needModificationText : omsStyles.reviewApproveText}>
                            {selectedNeedsPhoto && action.key === "edit_resubmit" ? "Add correction photo" : action.label}
                          </Text>
                        </View>
                      </Pressable>
                      );
                    }) : (
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
      <Modal visible={showStatusInfo} transparent animationType="fade" onRequestClose={() => setShowStatusInfo(false)}>
        <View style={omsStyles.modalOverlay}>
          <View style={omsStyles.infoModalCard}>
            <Text style={omsStyles.modalTitle}>Process Indicator Info</Text>
            <Text style={omsStyles.infoModalSubtitle}>Color meaning used in Work Status:</Text>
            <View style={omsStyles.legendList}>
              {[
                ["Submitted", "Waiting for engineer review."],
                ["Verified", "Verified and waiting for manager approval."],
                ["Approved", "Approved after review."],
                ["Commented", "Sent back for correction."],
                ["Modify request", "A change has been requested."],
                ["Modify approved", "Changes are allowed; resubmit the checklist."],
              ].map(([label, description]) => {
                const theme = getStatusTheme(label.toLowerCase().replace(/ /g, "_"));
                return <View key={label} style={omsStyles.legendItem}>
                  <View style={[omsStyles.legendSwatch, { backgroundColor: theme.borderColor }]} />
                  <View style={omsStyles.legendTextWrap}>
                    <Text style={omsStyles.legendTitle}>{label}</Text>
                    <Text style={omsStyles.legendSubtitle}>{description}</Text>
                  </View>
                </View>;
              })}
            </View>
            <Pressable accessibilityRole="button" onPress={() => setShowStatusInfo(false)} style={omsStyles.infoModalCloseButton}>
              <Text style={omsStyles.infoModalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <ImageViewerModal
        visible={imageViewerState.visible}
        items={imageViewerState.items}
        initialIndex={imageViewerState.initialIndex}
        onRequestClose={closeImageViewer}
      />
    </SafeAreaView>
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
  pendingSyncNotice: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: moderateScale(6), paddingHorizontal: moderateScale(9), paddingVertical: verticalScale(6), borderRadius: moderateScale(9), backgroundColor: colors.surfaceBluePale },
  pendingSyncText: { flexShrink: 1, color: colors.primaryBlue, fontFamily: fonts.semiBold, fontSize: fontScale(10.5) },
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
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: moderateScale(24), borderTopRightRadius: moderateScale(24), borderCurve: "continuous", paddingHorizontal: moderateScale(16), paddingTop: verticalScale(8), flexShrink: 1 },
  sheetHandle: { alignSelf: "center", width: moderateScale(38), height: verticalScale(4), borderRadius: moderateScale(2), backgroundColor: colors.neutralBorder, marginBottom: verticalScale(10) },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: moderateScale(10), paddingBottom: verticalScale(12) },
  sheetHeaderCopy: { flex: 1, minWidth: 0 },
  sheetEyebrow: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontScale(9), letterSpacing: 0.8, marginBottom: verticalScale(2) },
  sheetTitle: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fontScale(18), lineHeight: fontScale(22) },
  closeButton: { width: moderateScale(36), height: moderateScale(36), borderRadius: moderateScale(12), backgroundColor: colors.surfaceBluePale, alignItems: "center", justifyContent: "center" },
  detailList: { paddingBottom: verticalScale(8) },
  sheetSummary: { backgroundColor: colors.surfaceBluePale, borderWidth: 1, borderColor: colors.border, borderRadius: moderateScale(14), borderCurve: "continuous", padding: moderateScale(12), gap: verticalScale(5) },
  resubmitPhotosSection: { marginTop: verticalScale(4) },
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
  answerImageButton: { overflow: "hidden", borderRadius: moderateScale(9), borderWidth: 1, borderColor: colors.border },
  answerImage: { width: moderateScale(88), height: verticalScale(68), backgroundColor: colors.neutralCanvas },
  answerImageUnavailable: { alignItems: "center", justifyContent: "center", gap: verticalScale(2) },
  answerImageUnavailableText: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: fontScale(9) },
  answerImageOpenHint: { position: "absolute", right: moderateScale(4), bottom: moderateScale(4), width: moderateScale(22), height: moderateScale(22), borderRadius: moderateScale(11), alignItems: "center", justifyContent: "center", backgroundColor: "rgba(18,59,99,0.78)" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: moderateScale(9), paddingTop: verticalScale(16) },
  fullWidthAction: { flexBasis: "100%", flexGrow: 0 },
  sheetList: { flexShrink: 1, minHeight: 0 },
  actionRow: { flexDirection: "row", gap: moderateScale(9) },
  action: { minHeight: verticalScale(43), backgroundColor: colors.primaryBlue, paddingHorizontal: moderateScale(17), borderRadius: moderateScale(11), alignItems: "center", justifyContent: "center" },
  workflowAction: { flexGrow: 1 },
  actionDisabled: { opacity: 0.45 },
  secondaryAction: { minHeight: verticalScale(43), flex: 1, paddingHorizontal: moderateScale(16), borderRadius: moderateScale(11), borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  secondaryActionText: { color: colors.textDark, fontFamily: fonts.semiBold, fontSize: fontScale(12) },
  actionText: { color: colors.white, fontFamily: fonts.bold, fontSize: fontScale(12) },
  editResubmitAction: { backgroundColor: "#123B63" },
  editResubmitActionText: { color: colors.white },
  modifyRequestAction: { backgroundColor: "#F1EAFF", borderWidth: 1, borderColor: "#DDD0FF" },
  modifyRequestActionText: { color: "#5B21B6" },
  modifyApproveAction: { backgroundColor: "#E6FFFA", borderWidth: 1, borderColor: "#B8E9DE" },
  modifyApproveActionText: { color: "#0F766E" },
  modifyRejectAction: { backgroundColor: "#FFF1F1", borderWidth: 1, borderColor: "#F2C6C6" },
  modifyRejectActionText: { color: colors.danger },
  rejectAction: { backgroundColor: "#FFF1F1", borderWidth: 1, borderColor: "#F2C6C6" },
  rejectActionText: { color: colors.danger },
  remarkBox: { width: "100%", gap: verticalScale(9) },
  remarkInput: { minHeight: verticalScale(82), borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBg, borderRadius: moderateScale(11), padding: moderateScale(11), color: colors.textDark, fontFamily: fonts.regular, fontSize: fontScale(12), textAlignVertical: "top" },
  viewOnlyNotice: { width: "100%", flexDirection: "row", alignItems: "center", gap: moderateScale(8), padding: moderateScale(11), borderRadius: moderateScale(11), backgroundColor: colors.surfaceBluePale },
  viewOnlyText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontScale(10.5), lineHeight: fontScale(14) },
});
