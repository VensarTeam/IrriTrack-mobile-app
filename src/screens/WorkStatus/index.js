import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Icon, IconButton, Searchbar } from "react-native-paper";
import styles from "./styles";
import colors from "../../constants/colors";
import useWorkStatusViewModel from "../../viewmodels/useWorkStatusViewModel";
import { CustomTabView } from "../../components/WorkStatusTabView"; // ← new import
import ImageViewerModal from "../../components/ImageViewerModal";
import { IMAGE_BASE_URL } from "../../config/env";
import { getUnitStatusPalette } from "../../utils/unitStatusPalette";

// ─── remove the TabView / TabBar imports from react-native-tab-view ───────────
// REMOVED: import { TabBar, TabView } from "react-native-tab-view";

const TAB_THEME = {
  Submitted: {
    solid: getUnitStatusPalette("Submitted").solid,
    soft: getUnitStatusPalette("Submitted").soft,
    accent: getUnitStatusPalette("Submitted").text,
    icon: "timeline-clock-outline",
  },
  Pending: {
    solid: getUnitStatusPalette("Pending").solid,
    soft: getUnitStatusPalette("Pending").soft,
    accent: getUnitStatusPalette("Pending").text,
    icon: "progress-clock",
  },
  Verified: {
    solid: getUnitStatusPalette("Verified").solid,
    soft: getUnitStatusPalette("Verified").soft,
    accent: getUnitStatusPalette("Verified").text,
    icon: "shield-check-outline",
  },
  Approved: {
    solid: getUnitStatusPalette("Approved").solid,
    soft: getUnitStatusPalette("Approved").soft,
    accent: getUnitStatusPalette("Approved").text,
    icon: "check-decagram-outline",
  },
  Commented: {
    solid: getUnitStatusPalette("Commented").solid,
    soft: getUnitStatusPalette("Commented").soft,
    accent: getUnitStatusPalette("Commented").text,
    icon: "message-alert-outline",
  },
  Info: {
    solid: getUnitStatusPalette("Info").solid,
    soft: getUnitStatusPalette("Info").soft,
    accent: getUnitStatusPalette("Info").text,
    icon: "information-outline",
  }
};

const WORKFLOW_ROW_THEME = {
  submitted: {
    soft: getUnitStatusPalette("Submitted").soft,
    accent: getUnitStatusPalette("Submitted").text,
  },
  verified: {
    soft: getUnitStatusPalette("Verified").soft,
    accent: getUnitStatusPalette("Verified").text,
  },
  approved: {
    soft: getUnitStatusPalette("Approved").soft,
    accent: getUnitStatusPalette("Approved").text,
  },
  commented: {
    soft: getUnitStatusPalette("Commented").soft,
    accent: getUnitStatusPalette("Commented").text,
  },
};

const FILE_STORAGE_BASE_URL = IMAGE_BASE_URL;
const IMAGE_CHECKLIST_PATTERN = /\b(photo|image|images|pic|picture)\b/i;

const formatHistoryDate = (value) => {
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

const toTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const formatValueLabel = (value = "") =>
  String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatValueText = (value) => {
  if (value === null || typeof value === "undefined") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
};

const getOutletRowValue = (item = {}, key = "") =>
  formatValueText(item?.[key]) || "-";

const isOutletIdentificationItem = (item = {}) =>
  isPlainObject(item) &&
  ["valveNo", "subChakName", "pipeSize"].every((key) =>
    Object.prototype.hasOwnProperty.call(item, key)
  );

const OutletIdentificationRow = ({ item, index }) => (
  <View style={styles.outletArrayRow}>
    <View style={styles.outletArrayCell}>
      <Text style={styles.outletArrayLabel}>Valve No.</Text>
      <Text style={styles.outletArrayValue}>
        {getOutletRowValue(item, "valveNo") || `V${index + 1}`}
      </Text>
    </View>
    <View style={styles.outletArrayCell}>
      <Text style={styles.outletArrayLabel}>SC No.</Text>
      <Text style={styles.outletArrayValue}>
        {getOutletRowValue(item, "subChakName")}
      </Text>
    </View>
    <View style={styles.outletArrayCell}>
      <Text style={styles.outletArrayLabel}>Pipe Size</Text>
      <Text style={styles.outletArrayValue}>
        {getOutletRowValue(item, "pipeSize")}
      </Text>
    </View>
  </View>
);

const resolveAssetUrl = (value = "") => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) return "";

  if (
    normalizedValue.startsWith("http://") ||
    normalizedValue.startsWith("https://")
  ) {
    return normalizedValue;
  }

  return `${FILE_STORAGE_BASE_URL}${normalizedValue.replace(/^\/+/, "")}`;
};

const isImageChecklist = (checklist = {}) =>
  Boolean(checklist?.isFile) ||
  IMAGE_CHECKLIST_PATTERN.test(String(checklist?.name || ""));

const normalizeResubmitImages = (images = []) =>
  (Array.isArray(images) ? images : [])
    .map((image, index) => {
      const uri = resolveAssetUrl(
        image?.imageUrl ||
          image?.image_url ||
          image?.objectKey ||
          image?.object_key ||
          ""
      );

      if (!uri) return null;

      return {
        id: String(image?.imageId || image?.id || uri || `resubmit-${index}`),
        uri,
        title: `Resubmitted Image ${index + 1}`,
        meta: image?.uploadedAt || image?.uploaded_at || "",
      };
    })
    .filter(Boolean);

const getCompactValueState = (value) => {
  const n = String(value || "").trim().toLowerCase();
  if (["yes", "true", "completed", "done", "approved", "verified"].includes(n))
    return { icon: "check-circle", tone: "success" };
  if (["no", "false", "rejected", "commented"].includes(n))
    return { icon: "close-circle", tone: "danger" };
  return { icon: "circle-medium", tone: "neutral" };
};

const getSimpleChecklistState = (checklist) => {
  const rawValue = checklist?.detail?.rawValue;
  if (checklist?.isFile || Array.isArray(rawValue) || isPlainObject(rawValue)) return null;

  const valueText = formatValueText(rawValue ?? checklist?.detail?.value);
  const n = String(valueText || "").trim().toLowerCase();
  const statusKey = String(checklist?.status?.key || "").trim().toLowerCase();
  const statusCode = Number(checklist?.status?.code ?? checklist?.rawChecklist?.status);
  const isRemarkChecklist = String(checklist?.name || "")
    .trim()
    .toLowerCase()
    .startsWith("remark");

  if (!n) {
    if (isRemarkChecklist) {
      return null;
    }

    if (
      statusKey === "completed" ||
      statusKey === "approved" ||
      statusKey === "updated" ||
      statusKey === "verified" ||
      statusCode === 2 ||
      statusCode === 4
    ) {
      return { icon: "check-circle", color: colors.completed, backgroundColor: "#ECFBF3", borderColor: "#C7EFD8" };
    }

    return null;
  }

  if (["yes", "true", "completed", "done", "approved", "verified"].includes(n))
    return { icon: "check-circle", color: colors.completed, backgroundColor: "#ECFBF3", borderColor: "#C7EFD8" };
  if (["no", "false"].includes(n))
    return { icon: "close-circle", color: colors.danger, backgroundColor: "#FFF3F0", borderColor: "#F1C5B8" };
  return null;
};

const isOutletPipeCountChecklist = (checklist) => {
  const checklistId = Number(
    checklist?.rawChecklist?.checklistId || checklist?.rawChecklist?.checklist_id || checklist?.id
  );
  const label = String(checklist?.name || "").trim().toLowerCase();

  return (
    checklistId === 6 ||
    label.includes("sub-chak as per design") ||
    label.includes("sub chak as per design") ||
    label.includes("subchak as per design") ||
    label.includes("no. of outlet pipes") ||
    label.includes("no of outlet pipes") ||
    label.includes("number of outlet pipes") ||
    label.includes("numbers of outlet pipes")
  );
};

const getOutletPipeCountValue = (checklist, selectedWorkItem) => {
  const detailRawValue = checklist?.detail?.rawValue;
  const detailValue = checklist?.detail?.value;
  const candidates = [
    selectedWorkItem?.subCheckQty,
    selectedWorkItem?.subChakQuantity,
    selectedWorkItem?.subChakQty,
    selectedWorkItem?.rawItem?.subCheckQty,
    selectedWorkItem?.rawItem?.sub_check_qty,
    selectedWorkItem?.rawItem?.subChakQuantity,
    selectedWorkItem?.rawItem?.sub_chak_quantity,
    selectedWorkItem?.rawItem?.subChakQty,
    detailRawValue,
    detailValue,
    checklist?.rawChecklist?.value,
    checklist?.rawChecklist?.submittedValue,
    checklist?.rawChecklist?.answer,
  ];

  for (const candidate of candidates) {
    const match = String(candidate ?? "").match(/\d+/);
    const parsed = Number.parseInt(match?.[0], 10);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const getChecklistDisplayTitle = (checklist, selectedWorkItem) => {
  const baseTitle = String(checklist?.name || "").trim();

  if (!baseTitle || !isOutletPipeCountChecklist(checklist)) {
    return baseTitle;
  }

  if (/\(\s*\d+\s*\)/.test(baseTitle)) {
    return baseTitle;
  }

  const outletPipeCount = getOutletPipeCountValue(checklist, selectedWorkItem);

  return outletPipeCount ? `${baseTitle} (${outletPipeCount})` : baseTitle;
};

const getChecklistInlineCountValue = (checklist, selectedWorkItem) => {
  if (!isOutletPipeCountChecklist(checklist)) {
    return "";
  }

  return String(getOutletPipeCountValue(checklist, selectedWorkItem) || "");
};

// ─────────────────────────────────────────────────────────────────────────────
// ChecklistValueBlock (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const ChecklistValueBlock = ({ checklist, onViewImage }) => {
  const rawValue = checklist?.detail?.rawValue;
  const valueText = checklist?.detail?.value || "";
  const shouldRenderAsImage = isImageChecklist(checklist);
  const previewUrl =
    checklist?.fileUrl ||
    resolveAssetUrl(
      checklist?.rawChecklist?.objectKey ||
        checklist?.rawChecklist?.object_key ||
        checklist?.rawChecklist?.imageUrl ||
        checklist?.rawChecklist?.image_url ||
        checklist?.rawChecklist?.value ||
        ""
    );

  if (shouldRenderAsImage) {
    return (
      <View style={styles.valueBlock}>
        <View style={styles.fileRow}>
          {previewUrl ? (
            <TouchableOpacity
              style={styles.filePreviewTouch}
              activeOpacity={0.88}
              onPress={() =>
                onViewImage?.({
                  uri: previewUrl,
                  title: checklist.name || "Submitted Image",
                })
              }
            >
              <Image
                source={{ uri: previewUrl }}
                style={styles.inlinePreviewImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.filePlaceholder}>
              <Icon
                source="image-off-outline"
                size={22}
                color={colors.textSecondary}
              />
              <Text style={styles.filePlaceholderText}>No image uploaded</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (Array.isArray(rawValue) && rawValue.length) {
    return (
      <View style={styles.valueBlock}>
        <View style={styles.arrayGroup}>
          {rawValue.map((item, i) => (
            <View key={`${checklist.id}-${i}`} style={styles.arrayCard}>
              {isOutletIdentificationItem(item) ? (
                <OutletIdentificationRow item={item} index={i} />
              ) : isPlainObject(item) ? (
                Object.entries(item).map(([k, v]) => (
                  <View key={k} style={styles.arrayRow}>
                    <Text style={styles.arrayKey}>{formatValueLabel(k)}</Text>
                    <Text style={styles.arrayValue}>{formatValueText(v) || "-"}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.arrayValue}>{formatValueText(item)}</Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (isPlainObject(rawValue)) {
    return (
      <View style={styles.valueBlock}>
        <View style={styles.arrayCard}>
          {Object.entries(rawValue).map(([k, v]) => (
            <View key={k} style={styles.arrayRow}>
              <Text style={styles.arrayKey}>{formatValueLabel(k)}</Text>
              <Text style={styles.arrayValue}>{formatValueText(v) || "-"}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!valueText) return null;

  const state = getCompactValueState(valueText);
  const toneStyle =
    state.tone === "success" ? styles.compactValueToneSuccess
      : state.tone === "danger" ? styles.compactValueToneDanger
        : styles.compactValueToneNeutral;
  const textStyle =
    state.tone === "success" ? styles.compactValueTextSuccess
      : state.tone === "danger" ? styles.compactValueTextDanger
        : styles.compactValueTextNeutral;

  return (
    <View style={styles.valueBlock}>
      <View style={[styles.compactValueRow, toneStyle]}>
        <Icon
          source={state.icon}
          size={16}
          color={
            state.tone === "success" ? colors.completed
              : state.tone === "danger" ? colors.danger
                : colors.primaryBlue
          }
        />
        <Text style={[styles.compactValueText, textStyle]} numberOfLines={2}>
          {valueText}
        </Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const WorkStatusScreen = ({ route, navigation }) => {
  const {
    stageLabel,
    zoneName,
    villageName,
    search,
    setSearch,
    tabs,
    activeTabIndex,
    setActiveTabIndex,
    countsByTab,
    unitsByTab,
    isLoading,
    isRefreshing,
    isFetchingMore,
    error,
    canReviewChecklist,
    reviewCapabilities,
    canLoadMore,
    loadMore,
    refresh,
    openWorkItem,
    selectedWorkItem,
    selectedProgressMatch,
    selectedWorkflowStatusKey,
    isSelectedProgressLoading,
    selectedProgressError,
    selectedHistoryWorkItem,
    submissionHistory,
    isSubmissionHistoryLoading,
    submissionHistoryError,
    reviewRemark,
    reviewError,
    isWorkflowSubmitting,
    closeWorkItemSheet,
    openSubmissionHistory,
    closeSubmissionHistory,
    refreshSubmissionHistory,
    updateReviewRemark,
    submitWorkItemAction,
    refreshSelectedProgress,
    getUnitStatusDetails,
    getUnitWorkBucket,
    handleBack,
  } = useWorkStatusViewModel(navigation, route);

  const insets = useSafeAreaInsets();
  const [isRejectRemarkModalVisible, setIsRejectRemarkModalVisible] = React.useState(false);
  const [showStatusInfo, setShowStatusInfo] = React.useState(false);
  const [isRejectSubmitPending, setIsRejectSubmitPending] = React.useState(false);
  const [isRejectKeyboardVisible, setIsRejectKeyboardVisible] = React.useState(false);
  const [workflowConfirmState, setWorkflowConfirmState] = React.useState({
    visible: false,
    action: "",
  });
  const [imageViewerState, setImageViewerState] = React.useState({
    visible: false,
    items: [],
    initialIndex: 0,
  });

  const selectedProcess = selectedProgressMatch?.process || null;
  const selectedSubprocess = selectedProgressMatch?.subprocess || null;
  const selectedChecklistItems = selectedSubprocess?.checklists || [];
  const selectedDetailItems = selectedSubprocess?.detailItems || [];
  const selectedResubmitImages = React.useMemo(
    () =>
      normalizeResubmitImages(
        selectedSubprocess?.rawSubprocess?.resubmitImages || []
      ),
    [selectedSubprocess]
  );
  const selectedCommentRemark = String(selectedWorkItem?.rejectionRemark || "").trim();
  const sheetBottomPadding = insets.bottom + 24;
  const historySheetBottomPadding = insets.bottom + 20;

  const canVerifySelected = reviewCapabilities.canVerify && selectedWorkflowStatusKey === "submitted";
  const canApproveSelected = reviewCapabilities.canApprove && selectedWorkflowStatusKey === "verified";
  const canRejectSelected =
    reviewCapabilities.canReject &&
    (selectedWorkflowStatusKey === "submitted" ||
      (selectedWorkflowStatusKey === "verified" &&
        reviewCapabilities.canApprove));

  React.useEffect(() => {
    setIsRejectRemarkModalVisible(false);
    setIsRejectSubmitPending(false);
    setWorkflowConfirmState({ visible: false, action: "" });
  }, [selectedWorkItem?.submissionId, selectedWorkflowStatusKey]);

  React.useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setIsRejectKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setIsRejectKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  React.useEffect(() => {
    if (!isRejectSubmitPending || isWorkflowSubmitting) return;
    if (!reviewError) {
      setIsRejectRemarkModalVisible(false);
      setWorkflowConfirmState({ visible: false, action: "" });
    }
    setIsRejectSubmitPending(false);
  }, [isRejectSubmitPending, isWorkflowSubmitting, reviewError]);

  const openRejectRemarkModal = React.useCallback(() => {
    updateReviewRemark("");
    setIsRejectRemarkModalVisible(true);
  }, [updateReviewRemark]);

  const closeRejectRemarkModal = React.useCallback(() => {
    if (isWorkflowSubmitting) return;
    setIsRejectRemarkModalVisible(false);
    updateReviewRemark("");
  }, [isWorkflowSubmitting, updateReviewRemark]);

  const handleRejectModalRequestClose = React.useCallback(() => {
    if (isWorkflowSubmitting) return;
    if (isRejectKeyboardVisible) { Keyboard.dismiss(); return; }
    closeRejectRemarkModal();
  }, [closeRejectRemarkModal, isRejectKeyboardVisible, isWorkflowSubmitting]);

  const submitRejectFromModal = React.useCallback(async () => {
    setWorkflowConfirmState({
      visible: true,
      action: "reject",
    });
  }, [submitWorkItemAction]);

  const openWorkflowConfirmation = React.useCallback((action) => {
    setWorkflowConfirmState({
      visible: true,
      action,
    });
  }, []);

  const closeWorkflowConfirmation = React.useCallback(() => {
    if (isWorkflowSubmitting) {
      return;
    }

    setWorkflowConfirmState({
      visible: false,
      action: "",
    });
  }, [isWorkflowSubmitting]);

  const confirmWorkflowAction = React.useCallback(async () => {
    const action = String(workflowConfirmState.action || "").trim().toLowerCase();

    if (!action) {
      return;
    }

    if (action === "reject") {
      setIsRejectSubmitPending(true);
    }

    await submitWorkItemAction(action);

    if (action !== "reject") {
      setWorkflowConfirmState({ visible: false, action: "" });
    }
  }, [submitWorkItemAction, workflowConfirmState.action]);

  const workflowConfirmationTitle =
    workflowConfirmState.action === "approve"
      ? "Approve Submission"
      : workflowConfirmState.action === "verify"
        ? "Verify Submission"
        : "Reject Submission";

  const workflowConfirmationMessage =
    workflowConfirmState.action === "approve"
      ? "Are you sure you want to approve this subprocess response?"
      : workflowConfirmState.action === "verify"
        ? "Are you sure you want to verify this subprocess response?"
        : "Are you sure you want to reject this subprocess response with the entered remark?";

  const openImageViewer = React.useCallback(
    ({ uri = "", title = "", meta = "", items = [], initialIndex = 0 } = {}) => {
      const nextItems =
        Array.isArray(items) && items.length
          ? items.filter((item) => item?.uri || item?.source)
          : uri
            ? [
                {
                  id: uri,
                  uri,
                  title,
                  meta,
                },
              ]
            : [];

      if (!nextItems.length) {
        return;
      }

      const boundedIndex = Math.min(
        Math.max(0, Number(initialIndex) || 0),
        Math.max(0, nextItems.length - 1)
      );

      setImageViewerState({
        visible: true,
        items: nextItems,
        initialIndex: boundedIndex,
      });
    },
    []
  );

  const openResubmitImage = React.useCallback(
    (initialIndex = 0) => {
      if (!selectedResubmitImages.length) {
        return;
      }

      openImageViewer({
        items: selectedResubmitImages,
        initialIndex,
      });
    },
    [openImageViewer, selectedResubmitImages]
  );

  const closeImageViewer = React.useCallback(() => {
    setImageViewerState((currentValue) => ({
      ...currentValue,
      visible: false,
    }));
  }, []);

  const contextChips = [
    stageLabel !== "All" ? stageLabel : "",
    zoneName !== "All" ? zoneName : "",
    villageName !== "All" ? villageName : "",
  ].filter(Boolean);

  // ─── renderScene is passed to CustomTabView ────────────────────────────────
  const renderScene = React.useCallback(
    ({ route: sceneRoute }) => {
      const items = unitsByTab[sceneRoute.key] || [];
      const isActive = tabs[activeTabIndex] === sceneRoute.key;

      return (
        <FlatList
          data={items}
          keyExtractor={(unit, index) =>
            String(unit?.id || unit?.submissionId || unit?.omsId || `${sceneRoute.key}-${index}`)
          }
          renderItem={renderUnitCard}
          contentContainerStyle={styles.sceneContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconShell}>
                <Icon source="layers-search-outline" size={28} color={colors.primaryBlue} />
              </View>
              <Text style={styles.emptyTitle}>No items in {sceneRoute.title}</Text>
              <Text style={styles.emptyText}>This lane is currently clear.</Text>
            </View>
          }
          ListFooterComponent={
            isActive && items.length > 0 && (canLoadMore || isFetchingMore) ? (
              <View style={styles.loadMoreWrap}>
                {isFetchingMore ? (
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                ) : (
                  <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore} activeOpacity={0.88}>
                    <Text style={styles.loadMoreButtonText}>Load More</Text>
                    <Icon source="chevron-down" size={16} color={colors.primaryBlue} />
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
        />
      );
    },
    [activeTabIndex, canLoadMore, isFetchingMore, isRefreshing, loadMore, refresh, tabs, unitsByTab]
  );

  const renderUnitCard = React.useCallback(
    ({ item }) => {
      const bucket = getUnitWorkBucket(item);
      const theme = TAB_THEME[bucket] || TAB_THEME.Pending;
      const statusDetails = getUnitStatusDetails(item);

      return (
        <TouchableOpacity style={styles.card} onPress={() => openWorkItem(item)} activeOpacity={0.9}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardEyebrow} numberOfLines={1}>
                  OMS - {item?.omsName || "NODE"}
                </Text>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item?.processName || "Process"}
                </Text>
                <View style={styles.subprocessHighlight}>
                  <Text style={styles.subprocessHighlightText} numberOfLines={1}>
                    {item?.subprocessName || "Subprocess"}
                  </Text>
                </View>
              </View>

              <View style={styles.cardStatusWrap}>
                <View style={[styles.statusPill, { backgroundColor: theme.soft, borderColor: theme.solid }]}>
                  <Icon source={theme.icon} size={16} color={theme.accent} />
                  <Text style={[styles.statusPillText, { color: theme.accent }]}>{bucket}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardBodyWrap}>
              {statusDetails.length ? (
                <View style={styles.cardMetaGroup}>
                  {statusDetails.map((detail) => {
                    const rowTheme = WORKFLOW_ROW_THEME[detail.key] || WORKFLOW_ROW_THEME.submitted;

                    return (
                      <View key={detail.key} style={styles.workflowMetaRow}>
                        <View style={[styles.workflowMetaTag, { backgroundColor: rowTheme.soft }]}>
                          <Text style={[styles.workflowMetaTagText, { color: rowTheme.accent }]}>
                            {detail.stage}
                          </Text>
                        </View>

                        <View style={styles.workflowMetaContent}>
                          <Text style={styles.workflowMetaActor} numberOfLines={1}>
                            {detail.actorName}
                          </Text>
                          {detail.date ? (
                            <>
                              <Text style={styles.workflowMetaSeparator}>•</Text>
                              <Text style={styles.workflowMetaDate} numberOfLines={1}>
                                {detail.date}
                              </Text>
                            </>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}
              {item?.rejectionRemark ? (
                <View style={styles.cardCommentBlock}>
                  <Text style={styles.cardCommentLabel}>Comment:</Text>
                  <Text style={styles.cardRemarkText} numberOfLines={2}>
                    {item.rejectionRemark}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* <View style={styles.cardBottomRow}>
            <View style={styles.cardActionRow}>
              {item?.rejectionRemark ? (
                <Text style={styles.cardRemarkText} numberOfLines={2}>{item.rejectionRemark}</Text>
              ) : (
                <Text style={styles.cardActionText}>
                  {canReviewChecklist ? "View submission" : "Open work"}
                </Text>
              )}
              <View style={styles.cardActionIcon}>
                <Icon source="arrow-top-right" size={14} color={colors.white} />
              </View>
            </View>
          </View> */}
        </TouchableOpacity>
      );
    },
    [getUnitStatusDetails, getUnitWorkBucket, openWorkItem]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Reject remark modal ───────────────────────────────────────────── */}
      <Modal
        visible={isRejectRemarkModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleRejectModalRequestClose}
      >
        <Pressable style={styles.rejectModalBackdrop} onPress={handleRejectModalRequestClose}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.rejectModalRoot}
          >
            <Pressable style={styles.rejectModalCard} onPress={() => { }}>
              <Text style={styles.rejectModalTitle}>Reject Remark</Text>
              <Text style={styles.rejectModalSubtitle}>
                Add a short remark before sending this subprocess back.
              </Text>

              <TextInput
                style={[
                  styles.reviewRemarkInput,
                  styles.rejectModalInput,
                  reviewError && styles.reviewRemarkInputError,
                ]}
                placeholder="Write reject remark"
                placeholderTextColor={colors.textSecondary}
                multiline
                value={reviewRemark}
                onChangeText={updateReviewRemark}
                textAlignVertical="top"
                autoFocus
              />

              {reviewError ? <Text style={styles.reviewErrorText}>{reviewError}</Text> : null}

              <View style={styles.rejectModalActionRow}>
                <TouchableOpacity
                  style={[styles.reviewActionButton, styles.reviewCancelButton, isWorkflowSubmitting && styles.reviewActionButtonDisabled]}
                  activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                  disabled={isWorkflowSubmitting}
                  onPress={closeRejectRemarkModal}
                >
                  <Text style={styles.reviewCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reviewActionButton, styles.reviewRejectButton, isWorkflowSubmitting && styles.reviewActionButtonDisabled]}
                  activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                  disabled={isWorkflowSubmitting}
                  onPress={submitRejectFromModal}
                >
                  {isWorkflowSubmitting ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <Text style={styles.reviewRejectText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal
        visible={workflowConfirmState.visible}
        transparent
        animationType="fade"
        onRequestClose={closeWorkflowConfirmation}
      >
        <Pressable style={styles.rejectModalBackdrop} onPress={closeWorkflowConfirmation}>
          <View style={styles.rejectModalRoot}>
            <Pressable style={styles.confirmationModalCard} onPress={() => {}}>
              <Text style={styles.rejectModalTitle}>{workflowConfirmationTitle}</Text>
              <Text style={styles.rejectModalSubtitle}>
                {workflowConfirmationMessage}
              </Text>

              <View style={styles.rejectModalActionRow}>
                <TouchableOpacity
                  style={[styles.reviewActionButton, styles.reviewCancelButton, isWorkflowSubmitting && styles.reviewActionButtonDisabled]}
                  activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                  disabled={isWorkflowSubmitting}
                  onPress={closeWorkflowConfirmation}
                >
                  <Text style={styles.reviewCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.reviewActionButton,
                    workflowConfirmState.action === "approve"
                      ? styles.reviewApproveButton
                      : workflowConfirmState.action === "verify"
                        ? styles.reviewVerifyButton
                        : styles.reviewRejectButton,
                    isWorkflowSubmitting && styles.reviewActionButtonDisabled,
                  ]}
                  activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                  disabled={isWorkflowSubmitting}
                  onPress={confirmWorkflowAction}
                >
                  {isWorkflowSubmitting ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        workflowConfirmState.action === "approve"
                          ? colors.white
                          : workflowConfirmState.action === "verify"
                            ? colors.primaryBlue
                            : colors.danger
                      }
                    />
                  ) : (
                    <Text
                      style={
                        workflowConfirmState.action === "approve"
                          ? styles.reviewApproveText
                          : workflowConfirmState.action === "verify"
                            ? styles.reviewVerifyText
                            : styles.reviewRejectText
                      }
                    >
                      Confirm
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={handleBack} size={22} />
          <Text style={styles.headerTitle}>Work Status</Text>
          <View style={styles.headerSpacer} />
           <IconButton
              icon="information-outline"
              iconColor={colors.primaryBlue}
              size={22}
              style={styles.headerInfoButton}
              onPress={() => setShowStatusInfo(true)}
            />
        </View>

        {/* {contextChips.length ? (
          <View style={[styles.headerCard, { paddingHorizontal: 15, paddingBottom: 12 }]}>
            <View style={styles.contextRow}>
              {contextChips.map((item) => (
                <View key={item} style={styles.contextChip}>
                  <Text style={styles.contextChipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null} */}

        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Search by Node or Subprocess"
            onChangeText={setSearch}
            value={search}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor={colors.textSecondary}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {isLoading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={styles.stateText}>Loading board…</Text>
          </View>
        ) : error ? (
          <View style={styles.stateWrap}>
            <View style={styles.emptyIconShell}>
              <Icon source="alert-circle-outline" size={28} color={colors.primaryOrange} />
            </View>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} activeOpacity={0.88} onPress={refresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── ✅ CustomTabView replaces TabView + renderTabBar entirely ──────
          <CustomTabView
            tabs={tabs}
            activeTabIndex={activeTabIndex}
            onIndexChange={setActiveTabIndex}
            countsByTab={countsByTab}
            renderScene={renderScene}
          />
        )}
      </View>

      {/* ── Submission history sheet ──────────────────────────────────────── */}
      <Modal
        visible={Boolean(selectedHistoryWorkItem)}
        transparent
        animationType="slide"
        onRequestClose={closeSubmissionHistory}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={closeSubmissionHistory} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetEyebrow}>
                  {selectedHistoryWorkItem?.omsName || selectedHistoryWorkItem?.omsId || "OMS"}
                </Text>
                <Text style={styles.sheetTitle}>Submission History</Text>
                <Text style={styles.sheetSubtitle}>
                  Track each workflow step for this subprocess submission.
                </Text>
              </View>
              <IconButton icon="close" size={20} iconColor={colors.textDark} onPress={closeSubmissionHistory} />
            </View>

            <View style={styles.historySummaryCard}>
              <View style={styles.historySummaryBlock}>
                <Text style={styles.historySummaryLabel}>Current Status</Text>
                <Text style={styles.historySummaryValue}>
                  {toTitleCase(submissionHistory?.currentStatus || "pending")}
                </Text>
              </View>
              <View style={styles.historySummaryDivider} />
              <View style={styles.historySummaryBlock}>
                <Text style={styles.historySummaryLabel}>Comments</Text>
                <Text style={styles.historySummaryValue}>
                  {Number(submissionHistory?.rejectionCount || 0)}
                </Text>
              </View>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={[styles.sheetScrollContent, { paddingBottom: historySheetBottomPadding }]}
              showsVerticalScrollIndicator={false}
            >
              {isSubmissionHistoryLoading ? (
                <View style={styles.sheetStateCard}>
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                  <Text style={styles.sheetStateText}>Loading submission history...</Text>
                </View>
              ) : submissionHistoryError ? (
                <View style={styles.sheetStateCard}>
                  <Text style={styles.sheetStateText}>{submissionHistoryError}</Text>
                  <TouchableOpacity style={styles.retryButton} activeOpacity={0.88} onPress={refreshSubmissionHistory}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (submissionHistory?.history || []).length ? (
                <View style={styles.historyTimeline}>
                  {(submissionHistory?.history || []).map((entry, index) => (
                    <View key={`${entry.action}-${entry.actionAt}-${index}`} style={styles.historyItem}>
                      <View style={styles.historyRail}>
                        <View style={styles.historyDot} />
                        {index !== (submissionHistory?.history || []).length - 1 ? (
                          <View style={styles.historyLine} />
                        ) : null}
                      </View>
                      <View style={styles.historyCard}>
                        <View style={styles.historyCardTopRow}>
                          <Text style={styles.historyActionText}>{toTitleCase(entry.action)}</Text>
                          <Text style={styles.historyDateText}>{formatHistoryDate(entry.actionAt)}</Text>
                        </View>
                        <Text style={styles.historyActorText}>
                          {entry.actorName || "Unknown"}
                          {entry.actorRole ? ` • ${toTitleCase(entry.actorRole)}` : ""}
                        </Text>
                        {entry.remark ? (
                          <Text style={styles.historyRemarkText}>{entry.remark}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.sheetStateCard}>
                  <Text style={styles.sheetStateText}>No history is available for this submission yet.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Work item detail sheet ────────────────────────────────────────── */}
      <Modal
        visible={Boolean(selectedWorkItem)}
        transparent
        animationType="slide"
        onRequestClose={closeWorkItemSheet}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={closeWorkItemSheet} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetEyebrow}>
                  {selectedProcess?.name || selectedWorkItem?.processName || "Process"}
                </Text>
                <Text style={styles.sheetTitle}>
                  {selectedSubprocess?.name || selectedWorkItem?.subprocessName || "Subprocess"}
                </Text>
              </View>
              <IconButton icon="close" size={20} iconColor={colors.textDark} onPress={closeWorkItemSheet} />
            </View>

            <View style={styles.sheetStatusRow}>
              <View style={styles.sheetStatusGroup}>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: (TAB_THEME[getUnitWorkBucket(selectedWorkItem)] || TAB_THEME.Pending).soft,
                      borderColor: (TAB_THEME[getUnitWorkBucket(selectedWorkItem)] || TAB_THEME.Pending).solid,
                    },
                  ]}
                >
                  <Icon
                    source={(TAB_THEME[getUnitWorkBucket(selectedWorkItem)] || TAB_THEME.Pending).icon}
                    size={13}
                    color={(TAB_THEME[getUnitWorkBucket(selectedWorkItem)] || TAB_THEME.Pending).accent}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: (TAB_THEME[getUnitWorkBucket(selectedWorkItem)] || TAB_THEME.Pending).accent },
                    ]}
                  >
                    {selectedWorkflowStatusKey === "submitted" ? "Submitted" : getUnitWorkBucket(selectedWorkItem)}
                  </Text>
                </View>

                <TouchableOpacity style={styles.historyButton} activeOpacity={0.88} onPress={openSubmissionHistory}>
                  <Icon source="history" size={14} color={colors.white} />
                  <Text style={styles.historyButtonText}>History</Text>
                </TouchableOpacity>
              </View>

              {/* <Text style={styles.sheetStatusCount}>
                {selectedChecklistItems.length} checklist{selectedChecklistItems.length === 1 ? "" : "s"}
              </Text> */}
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={[styles.sheetScrollContent, { paddingBottom: sheetBottomPadding }]}
              showsVerticalScrollIndicator={false}
            >
              {isSelectedProgressLoading && !selectedWorkItem ? (
                <View style={styles.sheetStateCard}>
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                  <Text style={styles.sheetStateText}>Loading submitted subprocess details...</Text>
                </View>
              ) : selectedProgressError ? (
                <View style={styles.sheetStateCard}>
                  <Text style={styles.sheetStateText}>{selectedProgressError}</Text>
                  <TouchableOpacity style={styles.retryButton} activeOpacity={0.88} onPress={refreshSelectedProgress}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {selectedChecklistItems.map((checklist, index) => {
                    const simpleState = getSimpleChecklistState(checklist);
                    const checklistTitle = getChecklistDisplayTitle(checklist, selectedWorkItem);
                    const inlineCountValue = getChecklistInlineCountValue(
                      checklist,
                      selectedWorkItem
                    );
                    const displaySimpleState = inlineCountValue ? null : simpleState;
                    return (
                      <View
                        key={checklist.id}
                        style={[
                          styles.checklistCard,
                          displaySimpleState && styles.checklistCardCompact,
                          index === selectedChecklistItems.length - 1 && styles.checklistCardLast,
                        ]}
                      >
                        {displaySimpleState ? (
                          <View>
                            <View style={styles.checklistInlineRow}>
                              <View style={styles.checklistInlineCopy}>
                                <Text style={styles.checklistTitle}>{checklistTitle}</Text>
                                {!checklist.isRequired ? <Text style={styles.optionalText}>Optional</Text> : null}
                              </View>
                              <View
                                style={[
                                  styles.checklistInlineStatus,
                                  { backgroundColor: displaySimpleState.backgroundColor, borderColor: displaySimpleState.borderColor },
                                ]}
                              >
                                <Icon source={displaySimpleState.icon} size={18} color={displaySimpleState.color} />
                              </View>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.checklistHead}>
                            <View style={styles.checklistCopy}>
                              {inlineCountValue ? (
                                <View style={styles.checklistCountRow}>
                                  <Text style={styles.checklistCountTitle}>
                                    {checklistTitle}
                                  </Text>
                                  <View style={styles.checklistCountBadge}>
                                    <Text style={styles.checklistCountBadgeText}>
                                      {inlineCountValue}
                                    </Text>
                                  </View>
                                </View>
                              ) : (
                                <Text style={styles.checklistTitle}>{checklistTitle}</Text>
                              )}
                              {!checklist.isRequired ? <Text style={styles.optionalText}>Optional</Text> : null}
                              {inlineCountValue ? null : (
                                <ChecklistValueBlock
                                  checklist={checklist}
                                  onViewImage={openImageViewer}
                                />
                              )}
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {selectedResubmitImages.length ? (
                    <View style={styles.reviewDetailsSection}>
                      <View style={styles.sectionTitleRow}>
                        <Text style={styles.sectionTitleText}>Resubmitted Images</Text>
                        <Text style={styles.sectionCountText}>
                          {selectedResubmitImages.length}
                        </Text>
                      </View>
                      <View style={styles.imageGalleryGrid}>
                        {selectedResubmitImages.map((image, index) => (
                          <TouchableOpacity
                            key={image.id}
                            style={styles.galleryImageCard}
                            activeOpacity={0.88}
                            onPress={() => openResubmitImage(index)}
                          >
                            <Image
                              source={{ uri: image.uri }}
                              style={styles.galleryImage}
                              resizeMode="cover"
                            />
                            <Text style={styles.galleryImageTitle} numberOfLines={1}>
                              {image.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {selectedDetailItems.length ? (
                    <View style={styles.reviewDetailsSection}>
                      <Text style={styles.sectionBlockTitle}>Review Details</Text>
                      <View style={styles.detailMetaGrid}>
                        {selectedDetailItems.map((item) => (
                          <View key={item.key} style={styles.detailMetaCard}>
                            <Text style={styles.detailMetaLabel}>{item.label}</Text>
                            <Text style={styles.detailMetaValue}>{item.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {selectedWorkflowStatusKey === "commented" && selectedCommentRemark ? (
                    <View style={styles.reviewDetailsSection}>
                      <Text style={styles.sectionBlockTitle}>Comment</Text>
                      <Text style={styles.reviewActionSubtitle}>
                        {selectedCommentRemark}
                      </Text>
                    </View>
                  ) : null}

                  {canReviewChecklist && selectedWorkflowStatusKey !== "info" ? (
                    <View style={styles.workflowSection}>
                      <Text style={styles.sectionBlockTitle}>Workflow</Text>
                      <Text style={styles.reviewActionSubtitle}>
                        {selectedWorkflowStatusKey === "commented"
                          ? selectedCommentRemark || "This subprocess was commented and is waiting for field rectification."
                          : selectedWorkflowStatusKey === "approved"
                            ? "This subprocess is already approved."
                            : selectedWorkflowStatusKey === "verified" && !canApproveSelected
                              ? "This subprocess is already verified."
                              : selectedWorkflowStatusKey === "verified"
                                ? "This subprocess is verified and ready for approval."
                                : "This submitted subprocess is ready for review."}
                      </Text>

                      {reviewError && !isRejectRemarkModalVisible ? (
                        <Text style={styles.reviewErrorText}>{reviewError}</Text>
                      ) : null}

                      {canVerifySelected || canApproveSelected || canRejectSelected ? (
                        <View style={styles.reviewActionRow}>
                          {canRejectSelected ? (
                            <TouchableOpacity
                              style={[styles.reviewActionButton, styles.reviewRejectButton, isWorkflowSubmitting && styles.reviewActionButtonDisabled]}
                              activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                              disabled={isWorkflowSubmitting}
                              onPress={openRejectRemarkModal}
                            >
                              <Text style={styles.reviewRejectText}>Reject</Text>
                            </TouchableOpacity>
                          ) : null}

                          {canVerifySelected ? (
                            <TouchableOpacity
                              style={[styles.reviewActionButton, styles.reviewVerifyButton, isWorkflowSubmitting && styles.reviewActionButtonDisabled]}
                              activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                              disabled={isWorkflowSubmitting}
                              onPress={() => openWorkflowConfirmation("verify")}
                            >
                              {isWorkflowSubmitting ? (
                                <ActivityIndicator size="small" color={colors.primaryBlue} />
                              ) : (
                                <Text style={styles.reviewVerifyText}>Verify</Text>
                              )}
                            </TouchableOpacity>
                          ) : null}

                          {canApproveSelected ? (
                            <TouchableOpacity
                              style={[styles.reviewActionButton, styles.reviewApproveButton, isWorkflowSubmitting && styles.reviewActionButtonDisabled]}
                              activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                              disabled={isWorkflowSubmitting}
                              onPress={() => openWorkflowConfirmation("approve")}
                            >
                              {isWorkflowSubmitting ? (
                                <ActivityIndicator size="small" color={colors.white} />
                              ) : (
                                <Text style={styles.reviewApproveText}>Approve</Text>
                              )}
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      ) : (
                        <View style={styles.workflowStateNotice}>
                          <Text style={styles.workflowStateNoticeText}>
                            {selectedWorkflowStatusKey === "approved" ? "Approved"
                              : selectedWorkflowStatusKey === "verified" ? "Verified"
                                : "View only"}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Info Modal */}
       <Modal
        visible={showStatusInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalCard}>
            <Text style={styles.modalTitle}>Process Indicator Info</Text>
            <Text style={styles.infoModalSubtitle}>
              Color meaning used in the status indicators across the app:
            </Text>

            <View style={styles.legendList}>
              <LegendItem
                color={getUnitStatusPalette("Approved").solid}
                title="Approved"
                subtitle="The process is fully finished or approved after review."
              />
              <LegendItem
                color={getUnitStatusPalette("Submitted").solid}
                title="Submitted"
                subtitle="The process is submitted and waiting for review."
              />
              <LegendItem
                color={getUnitStatusPalette("Pending").solid}
                title="Pending"
                subtitle="The process has not started yet."
              />
              <LegendItem
                color={getUnitStatusPalette("Verified").solid}
                title="Verified"
                subtitle="The process is verified and waiting for final approval."
              />
              <LegendItem
                color={getUnitStatusPalette("Commented").solid}
                title="Commented"
                subtitle="Work was reviewed with comments or sent back for correction."
              />
              <LegendItem
                color={getUnitStatusPalette("Info").solid}
                title="Info"
                subtitle="Additional information is available for the process."
              />
            </View>

            <TouchableOpacity
              style={styles.infoModalCloseButton}
              onPress={() => setShowStatusInfo(false)}
            >
              <Text style={styles.infoModalCloseText}>Close</Text>
            </TouchableOpacity>
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
};

export default WorkStatusScreen;

const LegendItem = ({ color, title, subtitle }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendSwatch, { backgroundColor: color }]} />
    <View style={styles.legendTextWrap}>
      <Text style={styles.legendTitle}>{title}</Text>
      <Text style={styles.legendSubtitle}>{subtitle}</Text>
    </View>
  </View>
);
