import React from "react";
import {
  ActivityIndicator,
  Animated,
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
import { showAppAlert } from "../../services/alertService";

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
  "Modify Request": {
    solid: "#7C3AED",
    soft: "#F1EAFF",
    accent: "#5B21B6",
    icon: "file-edit-outline",
  },
  "Modify Approved": {
    solid: "#0D9488",
    soft: "#E6FFFA",
    accent: "#0F766E",
    icon: "file-check-outline",
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
  modify_approved: {
    soft: getUnitStatusPalette("Modify Approved").soft,
    accent: getUnitStatusPalette("Modify Approved").text,
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

const getSimpleChecklistState = (
  checklist,
  { showEmptyAsCross = false } = {}
) => {
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

    if (showEmptyAsCross) {
      return { icon: "close-circle", color: colors.danger, backgroundColor: "#FFF3F0", borderColor: "#F1C5B8" };
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

const parsePipelaidValue = (value) => {
  if (!value) {
    return null;
  }

  if (isPlainObject(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return isPlainObject(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
};

const normalizePipelaidSelection = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value > 0;
  }

  const normalized = String(value || "").trim().toLowerCase();

  return ["yes", "true", "1", "completed", "done"].includes(normalized);
};

const getPipelaidMap = (checklist = {}) => {
  const checklistId = String(
    checklist?.rawChecklist?.checklistId ||
      checklist?.rawChecklist?.checklist_id ||
      checklist?.id ||
      ""
  ).trim();
  const pipelaid =
    checklist?.rawChecklist?.Pipelaid ||
    checklist?.rawChecklist?.pipelaid ||
    checklist?.rawChecklist?.pipeLaid ||
    checklist?.metadata?.Pipelaid ||
    checklist?.metadata?.pipelaid ||
    checklist?.detail?.rawValue?.Pipelaid ||
    checklist?.detail?.rawValue?.pipelaid;

  if (checklistId !== "8") {
    return null;
  }

  const parsed = parsePipelaidValue(pipelaid);

  if (!parsed) {
    return null;
  }

  const entries = Object.entries(parsed)
    .map(([key, value]) => {
      const match = String(key).match(/\d+/);
      const order = Number.parseInt(match?.[0], 10);

      return {
        key: String(key).toUpperCase(),
        order: Number.isFinite(order) ? order : 999,
        selected: normalizePipelaidSelection(value),
      };
    })
    .filter((item) => item.key);

  return entries.length
    ? entries.sort((first, second) => first.order - second.order)
    : null;
};

const PipelaidGrid = ({ items = [] }) => {
  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.pipelaidWrap}>
      <Text style={styles.pipelaidTitle}>Pipe laid</Text>
      <View style={styles.pipelaidGrid}>
        {items.map((item) => (
          <View
            key={item.key}
            style={[
              styles.pipelaidPill,
              item.selected && styles.pipelaidPillSelected,
            ]}
          >
            <Icon
              source={item.selected ? "check-circle" : "circle-outline"}
              size={14}
              color={item.selected ? colors.completed : colors.textSecondary}
            />
            <Text
              style={[
                styles.pipelaidText,
                item.selected && styles.pipelaidTextSelected,
              ]}
            >
              {item.key}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const isPipeLayingProcess = (process = {}) =>
  String(process?.name || process?.rawProcess?.processName || "")
    .trim()
    .toLowerCase()
    .includes("pipe laying");

const isPipeLayingSubprocess = (subprocess = {}) => {
  const name = String(
    subprocess?.name || subprocess?.rawSubprocess?.subprocessName || ""
  )
    .trim()
    .toLowerCase();

  return name.includes("inlet pipe laying") || name.includes("outlet pipe laying");
};

const getPipeLayingSubprocesses = (process = {}) =>
  (process?.subprocesses || []).filter(isPipeLayingSubprocess);

const getPipeLayingProcess = (progress = { processes: [] }) =>
  (progress?.processes || []).find(isPipeLayingProcess) || null;

const PipeChecklistShimmer = () => {
  const opacity = React.useRef(new Animated.Value(0.45)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <View style={styles.pipeShimmerGroup}>
      {[0, 1, 2].map((item) => (
        <Animated.View
          key={item}
          style={[styles.pipeShimmerCard, { opacity }]}
        >
          <View style={styles.pipeShimmerText} />
          <View style={styles.pipeShimmerIcon} />
        </Animated.View>
      ))}
    </View>
  );
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
    canEditChecklist,
    canReviewChecklist,
    reviewCapabilities,
    canLoadMore,
    loadMore,
    refresh,
    openWorkItem,
    selectedWorkItem,
    selectedProgressMatch,
    selectedProgress,
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
    requestModification,
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
  const [modifyRequestConfirmItem, setModifyRequestConfirmItem] =
    React.useState(null);
  const [modifyRequestRemark, setModifyRequestRemark] = React.useState("");
  const [imageViewerState, setImageViewerState] = React.useState({
    visible: false,
    items: [],
    initialIndex: 0,
  });
  const [activePipeLayingSubprocessId, setActivePipeLayingSubprocessId] =
    React.useState("");
  const [pendingPipeLayingSubprocessId, setPendingPipeLayingSubprocessId] =
    React.useState("");
  const [isPipeLayingSwitching, setIsPipeLayingSwitching] =
    React.useState(false);
  const pipeLayingSwitchTimerRef = React.useRef(null);

  const selectedProcess = selectedProgressMatch?.process || null;
  const selectedSubprocess = selectedProgressMatch?.subprocess || null;
  const selectedChecklistItems = selectedSubprocess?.checklists || [];
  const selectedDetailItems = selectedSubprocess?.detailItems || [];
  const pipeLayingSubprocesses = React.useMemo(() => {
    const pipeLayingProcess = getPipeLayingProcess(selectedProgress);

    return getPipeLayingSubprocesses(pipeLayingProcess);
  }, [selectedProgress]);
  const shouldShowPipeLayingSections = pipeLayingSubprocesses.length > 0;
  const displayedPipeLayingSubprocessId =
    pendingPipeLayingSubprocessId || activePipeLayingSubprocessId;
  const activePipeLayingSubprocess = React.useMemo(() => {
    if (!pipeLayingSubprocesses.length) {
      return null;
    }

    return (
      pipeLayingSubprocesses.find(
        (item) => String(item.id) === String(activePipeLayingSubprocessId)
      ) || pipeLayingSubprocesses[0]
    );
  }, [activePipeLayingSubprocessId, pipeLayingSubprocesses]);
  const selectedResubmitImages = React.useMemo(
    () =>
      normalizeResubmitImages(
        selectedSubprocess?.rawSubprocess?.resubmitImages || []
      ),
    [selectedSubprocess]
  );

  React.useEffect(() => {
    if (!selectedWorkItem || !selectedSubprocess) {
      return;
    }

    const renderedSubprocess = shouldShowPipeLayingSections
      ? activePipeLayingSubprocess || selectedSubprocess
      : selectedSubprocess;
    const bottomSheetChecklistData = {
      submissionId: selectedWorkItem?.submissionId || "",
      process: {
        id: selectedProcess?.id || null,
        name: selectedProcess?.name || "",
        status: selectedProcess?.status || null,
      },
      subprocess: {
        id: renderedSubprocess?.id || null,
        name: renderedSubprocess?.name || "",
        status: renderedSubprocess?.status || null,
        detailItems: renderedSubprocess?.detailItems || [],
        checklists: renderedSubprocess?.checklists || [],
        rawApiSubprocess: renderedSubprocess?.rawSubprocess || null,
      },
    };

    console.log(
      "[WorkStatus] Bottom sheet checklist data",
      JSON.stringify(bottomSheetChecklistData, null, 2)
    );
  }, [
    activePipeLayingSubprocess,
    selectedProcess,
    selectedSubprocess,
    selectedWorkItem,
    shouldShowPipeLayingSections,
  ]);
  const selectedCommentRemark = String(selectedWorkItem?.rejectionRemark || "").trim();
  const sheetBottomPadding = insets.bottom + 24;
  const historySheetBottomPadding = insets.bottom + 20;

  const canVerifySelected =
    !isSelectedProgressLoading &&
    reviewCapabilities.canVerify &&
    selectedWorkflowStatusKey === "submitted";
  const canModifySelected =
    !isSelectedProgressLoading &&
    reviewCapabilities.canModify &&
    ["submitted", "verified"].includes(selectedWorkflowStatusKey);
  const canApproveModifyRequest =
    reviewCapabilities.canReviewModifyRequest &&
    selectedWorkflowStatusKey === "modify_request";
  const canRejectModifyRequest =
    reviewCapabilities.canReviewModifyRequest &&
    selectedWorkflowStatusKey === "modify_request";
  const canApproveSelected = reviewCapabilities.canApprove && selectedWorkflowStatusKey === "verified";
  const canRejectSelected =
    !isSelectedProgressLoading &&
    reviewCapabilities.canReject &&
    ["submitted", "verified"].includes(selectedWorkflowStatusKey);

  React.useEffect(() => {
    setIsRejectRemarkModalVisible(false);
    setIsRejectSubmitPending(false);
    setWorkflowConfirmState({ visible: false, action: "" });
  }, [selectedWorkItem?.submissionId, selectedWorkflowStatusKey]);

  React.useEffect(() => {
    setActivePipeLayingSubprocessId("");
    setPendingPipeLayingSubprocessId("");
    setIsPipeLayingSwitching(false);
  }, [selectedWorkItem?.id]);

  React.useEffect(() => {
    if (!pipeLayingSubprocesses.length) {
      setActivePipeLayingSubprocessId("");
      return;
    }

    setActivePipeLayingSubprocessId((currentValue) => {
      if (
        currentValue &&
        pipeLayingSubprocesses.some(
          (item) => String(item.id) === String(currentValue)
        )
      ) {
        return currentValue;
      }

      const selectedId = String(selectedSubprocess?.id || "");
      const firstDifferentSubprocess =
        pipeLayingSubprocesses.find(
          (item) => String(item.id) !== selectedId
        ) || pipeLayingSubprocesses[0];

      return String(firstDifferentSubprocess.id || "");
    });
  }, [pipeLayingSubprocesses, selectedSubprocess?.id]);

  React.useEffect(
    () => () => {
      if (pipeLayingSwitchTimerRef.current) {
        clearTimeout(pipeLayingSwitchTimerRef.current);
      }
    },
    []
  );

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

  const openModifyRequestConfirmation = React.useCallback((item, action = "modify_request") => {
    setModifyRequestConfirmItem({ item, action });
    setModifyRequestRemark("");
  }, []);

  const closeModifyRequestConfirmation = React.useCallback(() => {
    setModifyRequestConfirmItem(null);
    setModifyRequestRemark("");
  }, []);

  const confirmModifyRequest = React.useCallback(async () => {
    if (!modifyRequestConfirmItem) {
      return;
    }

    const action = String(modifyRequestConfirmItem.action || "").trim();
    const normalizedRemark = String(modifyRequestRemark || "").trim();
    const isRemarkRequired =
      action === "modify_rejected" ||
      (action === "modify_approved" &&
        selectedWorkflowStatusKey !== "modify_request");

    if (isRemarkRequired && !normalizedRemark) {
      showAppAlert({
        type: "danger",
        title: "Remark required",
        message: "Add a remark before updating this modification request.",
      });
      return;
    }

    if (action === "modify_request") {
      await requestModification(modifyRequestConfirmItem.item, normalizedRemark);
    } else {
      await submitWorkItemAction(action, normalizedRemark);
    }

    closeModifyRequestConfirmation();
  }, [
    closeModifyRequestConfirmation,
    modifyRequestConfirmItem,
    modifyRequestRemark,
    requestModification,
    submitWorkItemAction,
  ]);

  const modifyRequestModalTitle =
    modifyRequestConfirmItem?.action === "modify_approved"
      ? "Approve Modify Request"
      : modifyRequestConfirmItem?.action === "modify_rejected"
        ? "Reject Modify Request"
        : "Request Modification";

  const modifyRequestModalMessage =
    modifyRequestConfirmItem?.action === "modify_approved"
      ? selectedWorkflowStatusKey === "modify_request"
        ? "Approve this request so the supervisor can update the submission."
        : "Send this submission back for correction. A remark is required."
      : modifyRequestConfirmItem?.action === "modify_rejected"
        ? "Reject this modification request and keep the submitted status."
        : "Ask for correction on this submission. Remark is optional.";

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

  const switchPipeLayingSubprocess = React.useCallback(
    (subprocessId) => {
      const nextId = String(subprocessId || "");

      if (!nextId || nextId === String(displayedPipeLayingSubprocessId || "")) {
        return;
      }

      if (pipeLayingSwitchTimerRef.current) {
        clearTimeout(pipeLayingSwitchTimerRef.current);
      }

      setPendingPipeLayingSubprocessId(nextId);
      setIsPipeLayingSwitching(true);

      pipeLayingSwitchTimerRef.current = setTimeout(() => {
        setActivePipeLayingSubprocessId(nextId);
        setPendingPipeLayingSubprocessId("");
        setIsPipeLayingSwitching(false);
        pipeLayingSwitchTimerRef.current = null;
      }, 140);
    },
    [displayedPipeLayingSubprocessId]
  );

  const contextChips = [
    stageLabel !== "All" ? stageLabel : "",
    zoneName !== "All" ? zoneName : "",
    villageName !== "All" ? villageName : "",
  ].filter(Boolean);

  const renderChecklistCard = React.useCallback(
    (checklist, index, checklistItems = [], options = {}) => {
      const simpleState = getSimpleChecklistState(checklist, {
        showEmptyAsCross: Boolean(options.showEmptyAsCross),
      });
      const checklistTitle = getChecklistDisplayTitle(checklist, selectedWorkItem);
      const inlineCountValue = getChecklistInlineCountValue(
        checklist,
        selectedWorkItem
      );
      const pipelaidItems = getPipelaidMap(checklist);
      const displaySimpleState = inlineCountValue ? null : simpleState;

      return (
        <View
          key={checklist.id}
          style={[
            styles.checklistCard,
            options.isPipeChecklist && styles.pipeChecklistCard,
            displaySimpleState && styles.checklistCardCompact,
            index === checklistItems.length - 1 && styles.checklistCardLast,
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
              <PipelaidGrid items={pipelaidItems || []} />
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
                <PipelaidGrid items={pipelaidItems || []} />
              </View>
            </View>
          )}
        </View>
      );
    },
    [openImageViewer, selectedWorkItem]
  );

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
          renderItem={(props) =>
            renderUnitCard({ ...props, tabKey: sceneRoute.key })
          }
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

  const getRemarkLabel = (item = {}) => {
    const statusKey = String(item?.requestBucket || item?.status || "").trim().toLowerCase();
    return statusKey === "commented" ? "Comment:" : "Remark:";
  };

  const renderUnitCard = React.useCallback(
    ({ item, tabKey }) => {
      const bucket = getUnitWorkBucket(item);
      const theme = TAB_THEME[bucket] || TAB_THEME.Pending;
      const statusDetails = getUnitStatusDetails(item);
      const canRequestModification =
        ["Submitted", "Pending"].includes(tabKey) &&
        ["Submitted", "Pending"].includes(bucket) &&
        !["partial", "partially completed", "partially_completed"].includes(
          String(item?.status || "").trim().toLowerCase()
        ) &&
        canEditChecklist &&
        !canReviewChecklist &&
        Boolean(item?.submissionId);

      return (
        <TouchableOpacity style={styles.card} onPress={() => openWorkItem(item)} activeOpacity={0.9}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTextWrap}>
                {/* <Text style={styles.cardEyebrow} numberOfLines={1}>
                  {item?.processName || "Process"}
                </Text> */}
                <View style={styles.omsHighlight}>
                  <Icon source="map-marker-radius-outline" size={14} color={colors.primaryBlue} />
                  <Text style={styles.omsHighlightText} numberOfLines={1}>
                    OMS - {item?.omsName || item?.omsId || "NODE"}
                  </Text>
                </View>
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
                  <Text style={styles.cardCommentLabel}>{getRemarkLabel(item)}</Text>
                  <Text style={styles.cardRemarkText} numberOfLines={2}>
                    {item.rejectionRemark}
                  </Text>
                </View>
              ) : null}

              {item?.modifierRemark ? (
                <View style={styles.cardCommentBlock}>
                  <Text style={styles.cardCommentLabel}>{getRemarkLabel(item)}</Text>
                  <Text style={styles.cardRemarkText} numberOfLines={2}>
                    {item.modifierRemark}
                  </Text>
                </View>
              ) : null}

              {canRequestModification ? (
                <TouchableOpacity
                  style={styles.modifyRequestButton}
                  activeOpacity={0.9}
                  onPress={(event) => {
                    event?.stopPropagation?.();
                    openModifyRequestConfirmation(item, "modify_request");
                  }}
                >
                  <View style={styles.modifyRequestIconWrap}>
                    <Icon source="file-edit-outline" size={16} color="#5B21B6" />
                  </View>
                  <View style={styles.modifyRequestCopy}>
                    <Text style={styles.modifyRequestTitle}>
                      Request Modification
                    </Text>
                    <Text style={styles.modifyRequestSubtitle}>
                      Send this submission to modify request
                    </Text>
                  </View>
                  <Icon source="chevron-right" size={18} color="#7C3AED" />
                </TouchableOpacity>
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
    [
      canReviewChecklist,
      canEditChecklist,
      getUnitStatusDetails,
      getUnitWorkBucket,
      openModifyRequestConfirmation,
      openWorkItem,
    ]
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

      <Modal
        visible={Boolean(modifyRequestConfirmItem)}
        transparent
        animationType="fade"
        onRequestClose={closeModifyRequestConfirmation}
      >
        <Pressable
          style={styles.rejectModalBackdrop}
          onPress={closeModifyRequestConfirmation}
        >
          <View style={styles.rejectModalRoot}>
            <Pressable style={styles.confirmationModalCard} onPress={() => {}}>
              <Text style={styles.rejectModalTitle}>{modifyRequestModalTitle}</Text>
              <Text style={styles.rejectModalSubtitle}>
                {modifyRequestModalMessage}
              </Text>

              <TextInput
                style={[styles.reviewRemarkInput, styles.rejectModalInput]}
                placeholder={
                  modifyRequestConfirmItem?.action === "modify_rejected" ||
                  (modifyRequestConfirmItem?.action === "modify_approved" &&
                    selectedWorkflowStatusKey !== "modify_request")
                    ? "Remark (required)"
                    : "Remark (optional)"
                }
                placeholderTextColor={colors.textSecondary}
                multiline
                value={modifyRequestRemark}
                onChangeText={setModifyRequestRemark}
                textAlignVertical="top"
              />

              <View style={styles.rejectModalActionRow}>
                <TouchableOpacity
                  style={[styles.reviewActionButton, styles.reviewCancelButton]}
                  activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                  disabled={isWorkflowSubmitting}
                  onPress={closeModifyRequestConfirmation}
                >
                  <Text style={styles.reviewCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reviewActionButton, styles.modifyConfirmButton, isWorkflowSubmitting && styles.reviewActionButtonDisabled]}
                  activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                  disabled={isWorkflowSubmitting}
                  onPress={confirmModifyRequest}
                >
                  {isWorkflowSubmitting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <View style={styles.actionButtonContent}>
                      <Icon
                        style={styles.actionButtonIcon}
                        source={
                          modifyRequestConfirmItem?.action === "modify_approved"
                            ? "file-check-outline"
                            : modifyRequestConfirmItem?.action === "modify_rejected"
                            ? "close-circle"
                            : "file-edit-outline"
                        }
                        size={16}
                        color={colors.white}
                      />
                      <Text style={styles.modifyConfirmText}>
                        {modifyRequestConfirmItem?.action === "modify_approved"
                          ? "Modification Approve"
                          : modifyRequestConfirmItem?.action === "modify_rejected"
                          ? "Modification Reject"
                          : "Request Modification"}
                      </Text>
                    </View>
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
                <View style={styles.sheetOmsBadge}>
                  <Icon source="map-marker-radius-outline" size={14} color={colors.primaryBlue} />
                  <Text style={styles.sheetOmsBadgeText} numberOfLines={1}>
                    OMS - {selectedWorkItem?.omsName || selectedWorkItem?.omsId || "NODE"}
                  </Text>
                </View>
                <Text style={styles.sheetTitle}>
                  {selectedSubprocess?.name || selectedWorkItem?.subprocessName || "Subprocess"}
                </Text>
                {/* <Text style={styles.sheetSubtitle}>
                  {selectedProcess?.name || selectedWorkItem?.processName || "Process"}
                </Text> */}
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
                    {selectedWorkflowStatusKey === "submitted"
                      ? "Submitted"
                      : selectedWorkflowStatusKey === "partial"
                        ? "Partial"
                        : getUnitWorkBucket(selectedWorkItem)}
                  </Text>
                </View>

                <TouchableOpacity style={styles.historyButton} activeOpacity={0.88} onPress={openSubmissionHistory}>
                  <Icon source="history" size={14} color={colors.white} />
                  <Text style={styles.historyButtonText}>History</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={[styles.sheetScrollContent, { paddingBottom: sheetBottomPadding }]}
              showsVerticalScrollIndicator={false}
            >
              {isSelectedProgressLoading && !selectedProgressMatch ? (
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
                  <View style={styles.pipeLayingSection}>
                    <View style={styles.pipeLayingSectionHeader}>
                      <View style={styles.pipeLayingTitleWrap}>
                        <View style={styles.pipeLayingTitleCopy}>
                          <Text style={styles.pipeLayingTitle}>
                            {selectedSubprocess?.name || selectedWorkItem?.subprocessName || "Subprocess"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {selectedChecklistItems.map((checklist, index) =>
                      renderChecklistCard(
                        checklist,
                        index,
                        selectedChecklistItems,
                        {
                          showEmptyAsCross: isPipeLayingSubprocess(selectedSubprocess),
                          isPipeChecklist: isPipeLayingSubprocess(selectedSubprocess),
                        }
                      )
                    )}
                  </View>

                  {shouldShowPipeLayingSections ? (
                    <View style={[styles.pipeLayingSection, styles.commonPipeLayingSection]}>
                      <View style={styles.pipeLayingToggleRow}>
                        {pipeLayingSubprocesses.map((subprocess) => {
                          const isActive =
                            String(displayedPipeLayingSubprocessId || "") ===
                            String(subprocess.id);

                          return (
                            <TouchableOpacity
                              key={subprocess.id}
                              style={[
                                styles.pipeLayingToggleButton,
                                isActive && styles.pipeLayingToggleButtonActive,
                              ]}
                              activeOpacity={0.88}
                              onPress={() =>
                                switchPipeLayingSubprocess(subprocess.id)
                              }
                            >
                              <Text
                                style={[
                                  styles.pipeLayingToggleText,
                                  isActive && styles.pipeLayingToggleTextActive,
                                ]}
                                numberOfLines={1}
                              >
                                {subprocess.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {isPipeLayingSwitching ? (
                        <PipeChecklistShimmer />
                      ) : activePipeLayingSubprocess ? (
                        <>
                          {(activePipeLayingSubprocess.checklists || []).map(
                            (checklist, index) =>
                              renderChecklistCard(
                                checklist,
                                index,
                                activePipeLayingSubprocess.checklists || [],
                                {
                                  showEmptyAsCross: true,
                                  isPipeChecklist: true,
                                }
                              )
                          )}
                        </>
                      ) : null}
                    </View>
                  ) : null}

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
                          : selectedWorkflowStatusKey === "partial"
                            ? "This subprocess is partially completed and is not ready for review."
                          : selectedWorkflowStatusKey === "modify_request"
                            ? "This submission is waiting for modify request review."
                          : selectedWorkflowStatusKey === "modify_approved"
                            ? "This modification is approved and ready for supervisor update."
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

                      {canVerifySelected ||
                      canModifySelected ||
                      canApproveSelected ||
                      canRejectSelected ||
                      canApproveModifyRequest ||
                      canRejectModifyRequest ? (
                        <>
                          {(canModifySelected || canApproveModifyRequest) ? (
                            <TouchableOpacity
                              style={[styles.needModificationButton, isWorkflowSubmitting && styles.reviewActionButtonDisabled]}
                              activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                              disabled={isWorkflowSubmitting}
                              onPress={() =>
                                openModifyRequestConfirmation(
                                  selectedWorkItem,
                                  "modify_approved"
                                )
                              }
                            >
                              {isWorkflowSubmitting ? (
                                <ActivityIndicator size="small" color="#5B21B6" />
                                ) : (
                                <View style={styles.actionButtonContent}>
                                  <Icon style={styles.actionButtonIcon} source="file-edit-outline" size={16} color="#5B21B6" />
                                  <Text style={styles.needModificationText}>Need Modification</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          ) : null}

                          <View style={styles.reviewActionRow}>
                            {canRejectSelected || canRejectModifyRequest ? (
                              <TouchableOpacity
                                style={[styles.reviewActionButton, styles.reviewRejectButton, isWorkflowSubmitting && styles.reviewActionButtonDisabled]}
                                activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                                disabled={isWorkflowSubmitting}
                                onPress={
                                  canRejectModifyRequest
                                    ? () =>
                                        openModifyRequestConfirmation(
                                          selectedWorkItem,
                                          "modify_rejected"
                                        )
                                    : openRejectRemarkModal
                                }
                              >
                                <View style={styles.actionButtonContent}>
                                  <Icon style={styles.actionButtonIcon} source="close-circle" size={16} color="#C44728" />
                                  <Text style={styles.reviewRejectText}>Reject</Text>
                                </View>
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
                                  <View style={styles.actionButtonContent}>
                                    <Icon style={styles.actionButtonIcon} source="shield-check-outline" size={16} color="#135EAF" />
                                    <Text style={styles.reviewVerifyText}>Verify</Text>
                                  </View>
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
                                  <View style={styles.actionButtonContent}>
                                    <Icon style={styles.actionButtonIcon} source="check-decagram-outline" size={16} color={colors.white} />
                                    <Text style={styles.reviewApproveText}>Approve</Text>
                                  </View>
                                )}
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        </>
                      ) : (
                        <View style={styles.workflowStateNotice}>
                          <Text style={styles.workflowStateNoticeText}>
                            {selectedWorkflowStatusKey === "approved" ? "Approved"
                              : selectedWorkflowStatusKey === "verified" ? "Verified"
                                : selectedWorkflowStatusKey === "partial" ? "Partially Completed"
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
