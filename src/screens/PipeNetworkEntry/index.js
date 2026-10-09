import React from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput as NativeTextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";
import LinearGradient from "react-native-linear-gradient";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SearchableFilterModal from "../../components/SearchableFilterModal";
import ImageViewerModal from "../../components/ImageViewerModal";
import colors from "../../constants/colors";
import { Icons } from "../../constants/icons";
import styles from "./styles";
import omsPhotoStyles from "../unit/UnitStatusUpdate/styles";
import { useAuth } from "../../context/AuthContext";
import {
  fetchPipeChecklistMasters,
  fetchPipeContractors,
  fetchPipeCoveredIntervals,
  fetchPipeSegments,
} from "../../services/pipeNetworkApi";
import {
  getPendingPipeMutationCount,
  getPipeCache,
  listPendingPipeMutations,
  queuePipeMutation,
  savePipeCache,
} from "../../services/pipeNetworkOfflineStore";
import { flushPendingPipeMutations } from "../../services/pipeNetworkSync";
import { availableChainageRanges, validateDailyWork } from "../../services/pipeDailyWorkInput";
import { compressChecklistImage } from "../../services/checklistImageStorage";
import { clearPipeCameraRecovery, savePipeCameraCapturedAsset, savePipeCameraRecovery } from "../../services/pipeCameraRecovery";
import {
  approvedRangesForPipeStage,
  fetchAndCachePipeStagePackages,
  fetchAndCachePipeStageWork,
  getCachedPipeStagePackages,
  getCachedPipeStageWork,
  eligiblePipeStageIntervals,
  isPipeStageRangeApproved,
  previousPipeStage,
} from "../../services/pipeStageProgress";

const STAGES = [
  { key: "excavation", label: "Excavation" },
  { key: "pipe_laying", label: "Pipe Laying" },
  { key: "backfilling", label: "Backfilling" },
];
const CORRECTION_PHOTO_ID = "resubmitCorrection";

const PIPE_OPTIONS = {
  MS: [
    "J00 → J23 · P1 · 559 m",
    "J23 → J24A · P2 · 379 m",
    "J24A → J21 · P3 · 1,046 m",
    "J21 → J20 · P4 · 2,116 m",
  ],
  DI: [
    "D01 → D12 · P1 · 420 m",
    "D12 → D18 · P2 · 685 m",
    "D18 → D27 · P3 · 910 m",
  ],
  HDPE: [
    "H01 → H14 · P1 · 780 m",
    "H14 → H22 · P2 · 1,120 m",
    "H22 → H31 · P3 · 965 m",
  ],
};

const PIPE_META = {
  MS: { location: "RM-1", label: "P1", nodes: "J00 → J23", design: "4,600", length: "559" },
  DI: { location: "RM-2", label: "P1", nodes: "D01 → D12", design: "600", length: "420" },
  HDPE: { location: "RM-3", label: "P1", nodes: "H01 → H14", design: "315", length: "780" },
};

const CONTRACTORS = [
  "Not allotted",
  "AARADHYA CONSTRUCTION",
  "AARNA INFRASTRUCTURE",
  "AARYA ENTERPRISES",
  "Anamdakandam Builders",
  "ANURAG ROAD CARRIERS PVT. LTD.",
];

const SOIL_OPTIONS = ["Black cotton soil", "Hard soil", "Soft soil", "Rocky strata", "Mixed soil"];
const rangeLabel = ([from, to]) => `${from} → ${to} m (${Number((to - from).toFixed(3))} m open)`;
const pendingWorkIntervals = (entries, segmentId, workType) => entries
  .filter((entry) => entry.operation === "create_pipe_entry"
    && entry.payload?.workPayload?.segmentId === segmentId
    && entry.payload?.workPayload?.workType === workType)
  .map((entry) => {
    const work = entry.payload.workPayload;
    const from = Number(work.chainageFromM);
    const to = Number(work.chainageToM);
    return [from, from + Math.min(Number(work.lengthLaidM), to - from)];
  })
  .filter(([from, to]) => Number.isFinite(from) && Number.isFinite(to) && to > from);

const item = (id, title, description, response = "check") => ({
  id,
  title,
  description,
  response,
  required: true,
});

const COMMON_EXCAVATION = [
  item("material", "Pipe Material & Size", "Pipe diameter, grade, thickness and coating match the approved drawing/BOQ."),
  item("route", "Pipeline Route & Alignment", "Route and alignment are maintained as per approved drawings."),
  item("depth", "Trench Depth and Width", "Minimum trench depth is 1.2 m plus pipe diameter from ground level."),
  item("soil", "Soil Type at Trench Location", "Record the observed soil type for this chainage.", "select"),
  item("cover", "Minimum Pipe Cover", "Minimum 1.0 m cover is maintained over the top of the pipe."),
  item("bottom", "Trench Bottom", "Bottom is level and free from stones, debris and sharp objects."),
  item("trenchPhoto", "Excavated Trench Photo", "Capture one clear photo from a visible distance.", "photo"),
  item("soilPhoto", "Soil Condition Photo", "Capture one photo showing the excavated soil condition.", "photo"),
];

const CHECKLISTS = {
  MS: [
    { key: "excavation", title: "Excavation", color: colors.pipeStage.excavation.accent, surface: colors.pipeStage.excavation.surface, items: COMMON_EXCAVATION },
    {
      key: "pipeLaying",
      title: "Pipe Laying",
      color: colors.pipeStage.pipe_laying.accent,
      surface: colors.pipeStage.pipe_laying.surface,
      items: [
        item("alignment", "Pipe Alignment", "Horizontal and vertical alignment is maintained as approved."),
        item("welding", "Welding Procedure", "Approved procedure, certified welders and approved electrodes are used."),
        item("inspection", "Welding Inspection", "Every completed joint has been visually inspected."),
        item("ndt", "NDT (Non-destructive Testing)", "RT/UT test is carried out at the specified joint interval."),
        item("coating", "Joint Coating", "Joint coating and lining has the required overlap."),
        item("laidPhoto", "Pipe Laid Photos", "Capture two photos from different chainages.", "photo"),
      ],
    },
    {
      key: "backfilling",
      title: "Backfilling",
      color: colors.pipeStage.backfilling.accent,
      surface: colors.pipeStage.backfilling.surface,
      items: [
        item("backfill", "Backfilling", "Backfilling is completed to ground level with required mound."),
        item("backfillPhoto", "Completed Backfilling Photo", "Capture one clear photo after completion.", "photo"),
      ],
    },
  ],
  DI: [
    { key: "excavation", title: "Excavation", color: colors.pipeStage.excavation.accent, surface: colors.pipeStage.excavation.surface, items: COMMON_EXCAVATION },
    {
      key: "pipeLaying",
      title: "Pipe Laying",
      color: colors.pipeStage.pipe_laying.accent,
      surface: colors.pipeStage.pipe_laying.surface,
      items: [
        item("alignment", "Pipe Alignment", "Alignment follows the approved profile and route."),
        item("joint", "Socket & Spigot Joint", "Rubber gasket and joint surfaces are clean and correctly seated."),
        item("thrust", "Thrust Block", "Thrust blocks are provided at bends and fittings as required."),
        item("inspection", "Joint Inspection", "Each joint is checked before lowering and covering."),
        item("warning", "Warning Tape", "Warning tape is laid at the approved depth."),
        item("laidPhoto", "Pipe Laid Photos", "Capture two photos from different chainages.", "photo"),
      ],
    },
    {
      key: "backfilling",
      title: "Backfilling",
      color: colors.pipeStage.backfilling.accent,
      surface: colors.pipeStage.backfilling.surface,
      items: [
        item("backfill", "Backfilling", "Selected material is placed and compacted in approved layers."),
        item("backfillPhoto", "Completed Backfilling Photo", "Capture one clear photo after completion.", "photo"),
      ],
    },
  ],
  HDPE: [
    {
      key: "excavation",
      title: "Excavation",
      color: colors.pipeStage.excavation.accent,
      surface: colors.pipeStage.excavation.surface,
      items: [
        item("pipeSize", "HDPE Pipe Material & Size", "Enter the approved HDPE pipe size and PN rating.", "text"),
        item("chainage", "Pipe Location & Chainage", "Enter the exact pipe location and chainage.", "text"),
        item("laidLength", "Laid Pipe Length in Meter", "Enter the completed length for this entry.", "text"),
        item("route", "Pipeline Route & Alignment", "Route and alignment are maintained as per approved drawings."),
        item("depth", "Trench Depth", "Minimum depth is 1.2 m plus pipe diameter from ground level."),
        item("soil", "Soil Type at Trench Location", "Record the observed soil type for this chainage.", "select"),
        item("cover", "Minimum Pipe Cover", "Minimum 1.0 m cover is maintained over the pipe."),
        item("bottom", "Trench Bottom Condition", "Bottom is level and free from stones and debris."),
        item("trenchPhoto", "Excavated Trench Photo", "Capture one clear photo from a visible distance.", "photo"),
        item("soilPhoto", "Soil Condition Photo", "Capture one photo showing the soil condition.", "photo"),
      ],
    },
    {
      key: "pipeLaying",
      title: "Pipe Laying",
      color: colors.pipeStage.pipe_laying.accent,
      surface: colors.pipeStage.pipe_laying.surface,
      items: [
        item("unrolling", "Pipe Unrolling", "Pipe is unrolled using suitable equipment without damage."),
        item("jointing", "Pipe Jointing", "Butt fusion is completed at the approved temperature."),
        item("inspection", "Pipe & Joint Inspection", "Pipe and joints are checked for defects before backfilling."),
        item("laidPhoto", "Pipe Laid Photos", "Capture two photos from different chainages.", "photo"),
      ],
    },
    {
      key: "backfilling",
      title: "Backfilling",
      color: colors.pipeStage.backfilling.accent,
      surface: colors.pipeStage.backfilling.surface,
      items: [
        item("material", "Initial Backfill Material", "Initial fill is free from stones and damaging objects."),
        item("backfill", "Backfilling", "Backfilling is completed and compacted to ground level."),
        item("backfillPhoto", "Completed Backfilling Photo", "Capture one clear photo after completion.", "photo"),
      ],
    },
  ],
};

const formatDate = (date) =>
  `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
const formatApiDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const normalizePhotoAssets = (value) => {
  const photos = Array.isArray(value) ? value : value ? [value] : [];
  return photos.map((photo) => typeof photo === "string" ? { uri: photo } : photo).filter((photo) => photo?.uri || photo?.filePath);
};
const countPhotoSlots = (items) => items.reduce((count, check) =>
  count + (check.response === "photo" ? Math.max(1, Number(check.photoCount || 1)) : 0), 0);

const formatSegmentLength = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

const buildPipeSegmentOptions = (segments = [], material) => {
  const options = [];
  for (const segment of segments) {
    if (!String(segment?.material || "").toUpperCase().startsWith(material)) continue;
    const rawLength = Number(segment.lengthM || 0);
    options.push({
      ...segment,
      optionLabel: segment.optionLabel || `${segment.startNode || "—"} → ${segment.stopNode || "—"} · ${segment.label || "Unlabelled"} · ${formatSegmentLength.format(rawLength)} m`,
    });
  }
  return options;
};

const getPipePhotoCaptureLocation = async () => {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") return null;
    const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
    const position = lastKnown || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    if (!position?.coords) return null;
    return {
      latitude: Number(position.coords.latitude.toFixed(6)),
      longitude: Number(position.coords.longitude.toFixed(6)),
    };
  } catch {
    return null;
  }
};

const logEntryLoad = (resource, startedAt, details = {}) => {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.info(`[PipeEntryPerf] ${resource}`, {
      elapsedMs: Date.now() - startedAt,
      ...details,
    });
  }
};

const FieldLabel = ({ children, required }) => (
  <Text style={styles.fieldLabel}>
    {children}{required ? <Text style={styles.required}> *</Text> : null}
  </Text>
);

const TextInput = ({ style, ...props }) => {
  const [focused, setFocused] = React.useState(false);
  return <NativeTextInput {...props} style={[style, focused && styles.fieldFocused]}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    selectionColor={colors.primaryBlue} />;
};

const SelectField = ({ label, value, placeholder, onPress, required, error, loading = false }) => (
  <View style={styles.fieldBlock}>
    <FieldLabel required={required}>{label}</FieldLabel>
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
      style={({ pressed }) => [
        styles.selectField,
        error && styles.fieldError,
        pressed && styles.fieldPressed,
      ]}
    >
      <Text style={[styles.selectText, !value && styles.placeholder]} numberOfLines={2}>
        {value || placeholder}
      </Text>
      {loading ? <ActivityIndicator size="small" color={colors.primaryBlue} /> : <Icon source="chevron-down" size={20} color={colors.primaryBlue} />}
    </Pressable>
    {error ? <Text style={styles.errorText}>Please select {label.toLowerCase()}.</Text> : null}
  </View>
);

const FormLoadingSkeleton = () => {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(Animated.timing(progress, {
      toValue: 1,
      duration: 1100,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, [progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-260, 260] });
  const block = (style, key) => (
    <View key={key} style={[styles.skeletonBlock, style]}>
      <Animated.View style={[styles.skeletonSweep, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.82)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.skeletonGradient}
        />
      </Animated.View>
    </View>
  );

  return (
    <View accessibilityLabel="Loading checklist" style={styles.skeletonCard}>
      <View style={styles.skeletonHeading}>{block(styles.skeletonIcon, "icon")}<View style={styles.skeletonHeadingCopy}>{block(styles.skeletonTitle, "title")}{block(styles.skeletonSubtitle, "subtitle")}</View></View>
      {block(styles.skeletonChecklist, "checklist-1")}
      {block(styles.skeletonChecklist, "checklist-2")}
      {block(styles.skeletonChecklist, "checklist-3")}
      {block(styles.skeletonChecklist, "checklist-4")}
    </View>
  );
};

const PipeNetworkEntryScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, fontScale: textScale } = useWindowDimensions();
  const stackFields = width < 360 || textScale > 1.2;
  const scrollRef = React.useRef(null);
  const resubmitSubmission = route?.params?.resubmitSubmission || null;
  const resubmitDetail = route?.params?.submissionDetail || null;
  const cameraRecovery = route?.params?.cameraRecovery || null;
  const recoveredDraft = cameraRecovery?.draft || null;
  const isResubmission = Boolean(resubmitSubmission?.submissionId && resubmitDetail?.packageId);
  const isRejectedResubmission = isResubmission &&
    (resubmitSubmission?.workflowStatus || resubmitSubmission?.status) === "rejected";
  const routeMaterial = route?.params?.material || resubmitSubmission?.material;
  const materialKey = String(routeMaterial?.label || routeMaterial?.key || routeMaterial || "MS").toUpperCase();
  const material = CHECKLISTS[materialKey] ? materialKey : "MS";
  const [sections, setSections] = React.useState([]);
  const allItems = React.useMemo(
    () => sections.flatMap((section) => section.items),
    [sections],
  );
  const [workDate, setWorkDate] = React.useState(() => recoveredDraft?.workDate ? new Date(recoveredDraft.workDate) : new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [segments, setSegments] = React.useState([]);
  const [selectedPipe, setSelectedPipe] = React.useState(recoveredDraft?.selectedPipe || "");
  const [contractors, setContractors] = React.useState([]);
  const [contractor, setContractor] = React.useState(recoveredDraft?.contractor || "");
  const [openRange, setOpenRange] = React.useState(recoveredDraft?.openRange || "");
  const [availableRanges, setAvailableRanges] = React.useState([]);
  const [rangeStatus, setRangeStatus] = React.useState("idle");
  const [stageProgress, setStageProgress] = React.useState({ segmentId: "", packages: [], workByStage: {}, status: "idle", source: "" });
  const rangeScopeRef = React.useRef(recoveredDraft?.segmentId ? `${recoveredDraft.segmentId}:${recoveredDraft.workType}` : "");
  const rangeEditedRef = React.useRef(Boolean(recoveredDraft));
  const [workType, setWorkType] = React.useState(recoveredDraft?.workType || resubmitSubmission?.processCode || "excavation");
  const [actualDiameter, setActualDiameter] = React.useState(recoveredDraft?.actualDiameter || "");
  const [chainageFrom, setChainageFrom] = React.useState(recoveredDraft?.chainageFrom || "");
  const [chainageTo, setChainageTo] = React.useState(recoveredDraft?.chainageTo || "");
  const [laidLength, setLaidLength] = React.useState(recoveredDraft?.laidLength || "");
  const [remark, setRemark] = React.useState(recoveredDraft?.remark || "");
  const [responses, setResponses] = React.useState(recoveredDraft?.responses || {});
  const [existingPhotoKeys, setExistingPhotoKeys] = React.useState(recoveredDraft?.existingPhotoKeys || {});
  const [errors, setErrors] = React.useState({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [picker, setPicker] = React.useState({ visible: false, field: "", title: "", options: [] });
  const [isLoadingSegments, setIsLoadingSegments] = React.useState(true);
  const [isLoadingContractors, setIsLoadingContractors] = React.useState(true);
  const [isLoadingChecklist, setIsLoadingChecklist] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const [checklistError, setChecklistError] = React.useState("");
  const [reloadKey, setReloadKey] = React.useState(0);
  const [isOnline, setIsOnline] = React.useState(null);
  const [isSyncingOfflineEntries, setIsSyncingOfflineEntries] = React.useState(false);
  const syncInFlightRef = React.useRef(false);
  const [processingPhotoId, setProcessingPhotoId] = React.useState("");
  const [processingPhotoSlot, setProcessingPhotoSlot] = React.useState(null);
  const [photoPreview, setPhotoPreview] = React.useState({ visible: false, uri: "", title: "", meta: "" });
  const ownerUserId = String(user?.id || user?.mobile || "").trim();
  const referenceScope = `${route?.params?.projectId || ""}:${material}`;
  const contractorScope = String(route?.params?.projectId || "");
  const referenceNetworkResultRef = React.useRef({ segments: "", contractors: "" });
  const hydratedResubmissionRef = React.useRef(recoveredDraft ? String(resubmitSubmission?.submissionId || "") : "");
  const recoveredPhotoHandledRef = React.useRef(false);

  React.useEffect(() => navigation.addListener("beforeRemove", () => {
    void clearPipeCameraRecovery();
  }), [navigation]);

  const segmentsByOptionLabel = React.useMemo(() => new Map(segments.map((segment) => [segment.optionLabel, segment])), [segments]);
  const contractorsByOptionLabel = React.useMemo(() => new Map(contractors.map((entry) => [entry.optionLabel, entry])), [contractors]);
  const selectedSegment = segmentsByOptionLabel.get(selectedPipe) || null;
  const selectedContractor = contractorsByOptionLabel.get(contractor) || null;
  const pipeOptionLabels = React.useMemo(
    () => segments.map((segment) => segment.optionLabel),
    [segments],
  );
  const contractorOptionLabels = React.useMemo(
    () => contractors.map((entry) => entry.optionLabel),
    [contractors],
  );

  React.useEffect(() => {
    const handleNetworkChange = (state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      setIsOnline(online);
    };

    void NetInfo.fetch().then(handleNetworkChange);
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const segmentId = selectedSegment?.id;
    const projectId = route?.params?.projectId;
    if (!segmentId || !projectId || !ownerUserId || isResubmission) {
      setStageProgress({ segmentId: "", packages: [], workByStage: {}, status: "idle", source: "" });
      return undefined;
    }
    let active = true;
    const controller = new AbortController();
    setStageProgress({ segmentId, packages: [], workByStage: {}, status: "loading", source: "" });
    void (async () => {
      let cached = null;
      let cachedWorkByStage = {};
      try {
        const [cachedPackages, cachedExcavation, cachedPipeLaying] = await Promise.all([
          getCachedPipeStagePackages({ ownerUserId, projectId, segmentId, material }),
          getCachedPipeStageWork({ ownerUserId, projectId, segmentId, stage: "excavation" }),
          getCachedPipeStageWork({ ownerUserId, projectId, segmentId, stage: "pipe_laying" }),
        ]);
        cached = cachedPackages;
        cachedWorkByStage = {
          excavation: cachedExcavation?.payload || null,
          pipe_laying: cachedPipeLaying?.payload || null,
        };
        if (active && cached) setStageProgress({ segmentId, packages: cached.payload, workByStage: cachedWorkByStage, status: "ready", source: "cache" });
        if (isOnline === false) {
          if (active && !cached) setStageProgress({ segmentId, packages: [], workByStage: cachedWorkByStage, status: "unavailable", source: "" });
          return;
        }
        const [packages, excavationWork, pipeLayingWork] = await Promise.all([
          fetchAndCachePipeStagePackages({ ownerUserId, projectId, segmentId, material, signal: controller.signal }),
          fetchAndCachePipeStageWork({ ownerUserId, projectId, segmentId, stage: "excavation", signal: controller.signal }),
          fetchAndCachePipeStageWork({ ownerUserId, projectId, segmentId, stage: "pipe_laying", signal: controller.signal }),
        ]);
        if (active) setStageProgress({
          segmentId, packages,
          workByStage: { excavation: excavationWork, pipe_laying: pipeLayingWork },
          status: "ready", source: "server",
        });
      } catch (error) {
        if (active && !cached) setStageProgress({ segmentId, packages: [], workByStage: cachedWorkByStage, status: "unavailable", source: "" });
        if (active && error?.name !== "AbortError") {
          console.warn("[PipeEntryStage] Could not refresh stage approvals", { segmentId, message: error?.message });
        }
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [selectedSegment?.id, route?.params?.projectId, ownerUserId, material, isOnline, isResubmission, reloadKey]);

  const syncOfflineEntries = React.useCallback(async () => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    setIsSyncingOfflineEntries(true);
    try {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected === false || networkState.isInternetReachable === false) {
        Alert.alert("You’re offline", "Saved checklist submissions will sync automatically when the connection returns.");
        return;
      }

      const pendingPipe = await getPendingPipeMutationCount(ownerUserId);
      if (!pendingPipe) {
        Alert.alert("All caught up", "There are no offline checklist submissions to sync.");
        return;
      }

      const pipeResult = await flushPendingPipeMutations(ownerUserId, { force: true });
      const synced = Number(pipeResult?.synced || 0);
      const failed = Number(pipeResult?.failed || 0);
      const deferred = Number(pipeResult?.deferred || 0);
      const needsAttention = (await listPendingPipeMutations(ownerUserId, { force: true }))
        .filter((entry) => entry.state === "needs_attention").length;
      Alert.alert(
        failed ? "Sync needs attention" : deferred ? "Waiting for approval" : "Sync complete",
        failed
          ? `${synced} checklist${synced === 1 ? "" : "s"} synced. ${failed} remain saved.${needsAttention ? ` ${needsAttention} were rejected by the server and need review; they will not auto-retry.` : " They will retry when connectivity returns."}`
          : deferred
            ? `${synced} checklist${synced === 1 ? "" : "s"} synced. ${deferred} saved checklist${deferred === 1 ? " is" : "s are"} waiting for the previous step to be approved; they will retry automatically.`
          : `${synced} offline checklist${synced === 1 ? "" : "s"} synced successfully.`,
      );
    } catch (syncError) {
      Alert.alert("Sync couldn’t finish", syncError?.message || "Your offline submissions remain saved and will retry automatically.");
    } finally {
      syncInFlightRef.current = false;
      setIsSyncingOfflineEntries(false);
    }
  }, [ownerUserId]);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sync offline checklists"
          accessibilityState={{ busy: isSyncingOfflineEntries, disabled: isSyncingOfflineEntries }}
          disabled={isSyncingOfflineEntries}
          hitSlop={10}
          onPress={syncOfflineEntries}
          style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
        >
          {isSyncingOfflineEntries
            ? <ActivityIndicator size="small" color={colors.primaryBlue} />
            : <Icon source="cloud-sync-outline" size={23} color={colors.primaryBlue} />}
        </Pressable>
      ),
    });
  }, [isSyncingOfflineEntries, navigation, syncOfflineEntries]);

  React.useEffect(() => {
    setSegments([]);
    setContractors([]);
    setSelectedPipe("");
    setContractor("");
    setIsLoadingSegments(true);
    setIsLoadingContractors(true);
  }, [material, route?.params?.projectId]);

  // Hydrate each selector independently so a slow lookup never holds the other one back.
  React.useEffect(() => {
    const projectId = route?.params?.projectId;
    if (!projectId) return undefined;
    let cancelled = false;
    const loadCachedOptions = async () => {
      const cacheStartedAt = Date.now();
      const segmentResource = `entry-segments:${material}`;
      const contractorResource = "entry-contractors";
      try {
        const [cachedSegments, cachedContractors] = await Promise.all([
          getPipeCache({ ownerUserId, projectId, resource: segmentResource }),
          getPipeCache({ ownerUserId, projectId, resource: contractorResource }),
        ]);
        if (cancelled) return;
        let segmentPayload = cachedSegments?.payload;
        let contractorPayload = cachedContractors?.payload;
        if (!Array.isArray(segmentPayload) || !Array.isArray(contractorPayload)) {
          const legacy = await getPipeCache({ ownerUserId, projectId, resource: `entry-reference:${material}` })
            || await getPipeCache({ ownerUserId, projectId, resource: "entry-reference" });
          if (cancelled) return;
          segmentPayload ??= legacy?.payload?.segments;
          contractorPayload ??= legacy?.payload?.contractors;
        }
        logEntryLoad("reference cache hydrated", cacheStartedAt, {
          segments: Array.isArray(segmentPayload) ? segmentPayload.length : 0,
          contractors: Array.isArray(contractorPayload) ? contractorPayload.length : 0,
        });
        if (Array.isArray(segmentPayload) && referenceNetworkResultRef.current.segments !== referenceScope) {
          const optionBuildStartedAt = Date.now();
          const next = buildPipeSegmentOptions(segmentPayload, material);
          logEntryLoad("cached pipe options shaped", optionBuildStartedAt, { sourceCount: segmentPayload.length, count: next.length });
          setSegments(next);
          setSelectedPipe((current) => next.some((entry) => entry.optionLabel === current) ? current : "");
          setIsLoadingSegments(false);
        }
        if (Array.isArray(contractorPayload) && referenceNetworkResultRef.current.contractors !== contractorScope) {
          const next = contractorPayload.map((entry) => ({
            ...entry,
            optionLabel: entry.optionLabel || entry.firmName || entry.name || entry.contractorName || "",
          })).filter((entry) => entry.id && entry.optionLabel);
          setContractors(next);
          setContractor((current) => next.some((entry) => entry.optionLabel === current) ? current : "");
          setIsLoadingContractors(false);
        }
      } catch {
        // Cache misses are normal; the independent network refresh fills each selector.
      }
    };
    void loadCachedOptions();
    return () => { cancelled = true; };
  }, [material, ownerUserId, route?.params?.projectId]);

  // Refresh both sources concurrently after connectivity is checked, updating each as soon as it resolves.
  React.useEffect(() => {
    const projectId = route?.params?.projectId;
    const controller = new AbortController();
    if (!projectId) {
      setLoadError("Project is missing. Open Add Entry from a Pipe Network project.");
      setIsLoadingSegments(false);
      setIsLoadingContractors(false);
      return () => controller.abort();
    }

    if (isOnline === null) return () => controller.abort();
    if (!isOnline) {
      setLoadError("Offline mode: showing saved pipe and contractor options.");
      setIsLoadingSegments(false);
      setIsLoadingContractors(false);
      return () => controller.abort();
    }

    let active = true;
    setLoadError("");
    const loadReferenceData = async () => {
      const refreshSegments = async () => {
          const startedAt = Date.now();
          try {
            const response = await fetchPipeSegments({ projectId, material, signal: controller.signal });
            if (!active) return;
            const raw = Array.isArray(response) ? response : response?.items || [];
            const mapStartedAt = Date.now();
            const next = buildPipeSegmentOptions(raw, material);
            logEntryLoad("pipe options ready", startedAt, { sourceCount: raw.length, count: next.length, mapMs: Date.now() - mapStartedAt });
            referenceNetworkResultRef.current.segments = referenceScope;
            setSegments(next);
            setSelectedPipe((current) => next.some((entry) => entry.optionLabel === current) ? current : "");
            setIsLoadingSegments(false);
            InteractionManager.runAfterInteractions(() => {
              void savePipeCache({ ownerUserId, projectId, resource: `entry-segments:${material}`, payload: raw });
            });
          } catch (error) {
            if (!active || controller.signal.aborted) return;
            setIsLoadingSegments(false);
            setLoadError((current) => current || error?.message || "Could not refresh pipe options.");
          }
        };
      const refreshContractors = async () => {
          const startedAt = Date.now();
          try {
            const response = await fetchPipeContractors({ signal: controller.signal });
            if (!active) return;
            const raw = Array.isArray(response) ? response : response?.items || response?.data || [];
            const mapStartedAt = Date.now();
            const next = raw.map((entry) => ({
              ...entry,
              optionLabel: entry.firmName || entry.name || entry.contractorName || "",
            })).filter((entry) => entry.id && entry.optionLabel);
            logEntryLoad("contractor options ready", startedAt, { count: next.length, mapMs: Date.now() - mapStartedAt });
            referenceNetworkResultRef.current.contractors = contractorScope;
            setContractors(next);
            setContractor((current) => next.some((entry) => entry.optionLabel === current) ? current : "");
            setIsLoadingContractors(false);
            InteractionManager.runAfterInteractions(() => {
              void savePipeCache({ ownerUserId, projectId, resource: "entry-contractors", payload: raw });
            });
          } catch (error) {
            if (!active || controller.signal.aborted) return;
            setIsLoadingContractors(false);
            setLoadError((current) => current || error?.message || "Could not refresh contractor options.");
          }
        };
      await Promise.allSettled([refreshSegments(), refreshContractors()]);
    };
    void loadReferenceData();
    return () => {
      active = false;
      controller.abort();
    };
  }, [isOnline, material, ownerUserId, referenceScope, reloadKey, route?.params?.projectId]);

  React.useEffect(() => {
    const controller = new AbortController();
    const projectId = route?.params?.projectId;
    const resource = `masters:${material}:${workType}`;
    const applyMasters = (response) => {
      if (controller.signal.aborted) return;
      const masters = Array.isArray(response) ? response : response?.items || [];
      const stage = STAGES.find((entry) => entry.key === workType) || STAGES[0];
      const stagePalette = colors.pipeStage[workType] || colors.pipeStage.excavation;
      setSections([{ ...stage, title: stage.label, color: stagePalette.accent, surface: stagePalette.surface, items: masters.map((master) => ({
        id: String(master.checklistId),
        checklistId: Number(master.checklistId),
        title: master.title || master.requirement,
        description: master.requirement || "",
        response: master.inputType === "photo" ? "photo" : master.inputType === "select" ? "select" : ["text", "number"].includes(master.inputType) ? "text" : "check",
        options: Array.isArray(master.options) ? master.options : [],
        photoCount: Math.max(1, Number(master.photoCount || 1)),
        required: master.isRequired !== false,
        valueType: master.inputType === "photo" ? "file" : master.inputType === "checkbox" ? "boolean" : master.inputType === "number" ? "number" : "string",
      })) }]);
    };
    setSections([]);
    setIsLoadingChecklist(true);
    setChecklistError("");
    void (async () => {
      let hasCachedMasters = false;
      try {
        const cached = await getPipeCache({ ownerUserId, projectId, resource });
        if (cached?.payload) {
          applyMasters(cached.payload);
          hasCachedMasters = true;
          if (!controller.signal.aborted) setIsLoadingChecklist(false);
        }
      } catch {
        // Continue to the network request on a first run or unreadable cache.
      }

      const networkState = await NetInfo.fetch();
      const canRefresh = networkState.isConnected !== false && networkState.isInternetReachable !== false;
      if (!canRefresh) {
        if (!controller.signal.aborted) {
          setChecklistError(hasCachedMasters
            ? "Offline mode: showing the saved checklist."
            : "This checklist is not saved on this device yet. Reconnect once to download it.");
          setIsLoadingChecklist(false);
        }
        return;
      }

      try {
        const response = await fetchPipeChecklistMasters({ material, processCode: workType, signal: controller.signal });
        applyMasters(response);
        await savePipeCache({ ownerUserId, projectId, resource, payload: response });
      } catch (error) {
        if (!controller.signal.aborted) {
          setChecklistError(hasCachedMasters
            ? "Could not refresh this checklist. Showing the saved offline copy."
            : error?.message || "This checklist is not available offline yet.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingChecklist(false);
      }
    })();
    return () => controller.abort();
  }, [material, ownerUserId, reloadKey, route?.params?.projectId, workType]);

  React.useEffect(() => {
    const submissionId = String(resubmitSubmission?.submissionId || "");
    if (!isResubmission || !submissionId || isLoadingChecklist || !allItems.length || hydratedResubmissionRef.current === submissionId) return;

    const checklistById = new Map((resubmitDetail.items || []).map((entry) => [Number(entry.checklistId), entry]));
    const nextResponses = {};
    const nextPhotoKeys = {};
    for (const check of allItems) {
      const source = checklistById.get(Number(check.checklistId));
      if (!source) continue;
      const sourceValue = source.value;
      const value = sourceValue && typeof sourceValue === "object" && Object.prototype.hasOwnProperty.call(sourceValue, "value")
        ? sourceValue.value
        : sourceValue;
      if (check.response === "photo") {
        const files = Array.isArray(value) ? value : Array.isArray(value?.files) ? value.files : [];
        nextPhotoKeys[check.id] = files
          .map((file) => String(file?.storageKey || file?.key || "").trim())
          .filter(Boolean);
      } else {
        nextResponses[check.id] = value ?? "";
      }
    }
    hydratedResubmissionRef.current = submissionId;
    setResponses(nextResponses);
    setExistingPhotoKeys(nextPhotoKeys);
    setRemark(String(resubmitSubmission.rejectionRemark || resubmitDetail.rejectionRemark || resubmitDetail.remark || ""));
  }, [allItems, isLoadingChecklist, isResubmission, resubmitDetail, resubmitSubmission]);

  React.useEffect(() => {
    if (selectedPipe && !selectedSegment) return undefined;
    const segmentId = selectedSegment?.id;
    const segmentLength = Number(selectedSegment?.lengthM || 0);
    const scope = `${segmentId || ""}:${workType}`;
    const scopeChanged = rangeScopeRef.current !== scope;
    if (scopeChanged) {
      rangeScopeRef.current = scope;
      rangeEditedRef.current = false;
      setActualDiameter(String(selectedSegment?.diameterMm ?? ""));
      setChainageFrom("");
      setChainageTo("");
      setLaidLength("");
      setOpenRange("");
      setAvailableRanges([]);
    }
    if (!segmentId || !Number.isFinite(segmentLength) || segmentLength <= 0) {
      setRangeStatus("idle");
      return undefined;
    }

    const prerequisite = previousPipeStage(workType);
    if (prerequisite && (stageProgress.segmentId !== segmentId || stageProgress.status === "loading")) {
      setRangeStatus("loading");
      return undefined;
    }
    if (prerequisite && (stageProgress.status !== "ready" ||
      !eligiblePipeStageIntervals(stageProgress.packages, stageProgress.workByStage?.[prerequisite], workType).length)) {
      setAvailableRanges([]);
      setRangeStatus("prerequisite");
      return undefined;
    }

    const controller = new AbortController();
    setRangeStatus(isOnline === false ? "offline" : "loading");
    void (async () => {
      try {
        const pending = await listPendingPipeMutations(ownerUserId, { force: true });
        const localIntervals = pendingWorkIntervals(pending, segmentId, workType);
        const serverIntervals = isOnline === false ? [] : await fetchPipeCoveredIntervals({
          projectId: route?.params?.projectId,
          segmentId,
          workType,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const openRanges = availableChainageRanges(0, segmentLength, [...serverIntervals, ...localIntervals]);
        const ranges = approvedRangesForPipeStage(
          openRanges, stageProgress.packages, workType, stageProgress.workByStage?.[prerequisite],
        );
        setAvailableRanges(ranges);
        setRangeStatus(isOnline === false ? "offline" : "ready");
        if (!rangeEditedRef.current && ranges.length) {
          const [from, end] = ranges[0];
          const to = Math.min(end, from + 30);
          setOpenRange(rangeLabel(ranges[0]));
          setChainageFrom(String(from));
          setChainageTo(String(to));
          setLaidLength(String(Number((to - from).toFixed(3))));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setAvailableRanges([]);
          setRangeStatus("error");
          console.warn("[PipeEntryRange] Could not load open chainage", { message: error?.message, segmentId, workType });
        }
      }
    })();
    return () => controller.abort();
  }, [selectedPipe, selectedSegment?.id, selectedSegment?.lengthM, selectedSegment?.diameterMm, workType, isOnline, ownerUserId, route?.params?.projectId, stageProgress]);

  const visibleSections = sections;
  const visibleItems = React.useMemo(
    () => visibleSections.flatMap((section) => section.items),
    [visibleSections],
  );
  const hasChecklistValue = React.useCallback((check, value) => {
    if (check.response === "check") return value === true;
    if (check.response === "photo") {
      if (isResubmission) {
        return (existingPhotoKeys[check.id] || []).length >= Math.max(1, Number(check.photoCount || 1));
      }
      const photos = Array.isArray(value) ? value : value ? [value] : [];
      return photos.length >= Math.max(1, Number(check.photoCount || 1));
    }
    return typeof value === "string" ? Boolean(value.trim()) : value !== null && typeof value !== "undefined";
  }, [existingPhotoKeys, isResubmission]);
  const completedCount = React.useMemo(
    () => visibleItems.filter((check) => hasChecklistValue(check, responses[check.id])).length,
    [existingPhotoKeys, hasChecklistValue, visibleItems, responses],
  );

  const openPicker = (field, title, options) => {
    setPicker({ visible: true, field, title, options });
  };

  const closePicker = () => setPicker((current) => ({ ...current, visible: false }));

  const handlePickerSelect = (value) => {
    if (picker.field === "pipe") {
      setSelectedPipe(value);
      setErrors((current) => ({ ...current, pipe: false }));
    }
    else if (picker.field === "contractor") {
      setContractor(value);
      setErrors((current) => ({ ...current, contractor: false }));
    }
    else if (picker.field === "openRange") {
      const range = availableRanges.find((entry) => rangeLabel(entry) === value);
      if (range) {
        const [from, end] = range;
        const to = Math.min(end, from + 30);
        rangeEditedRef.current = true;
        setOpenRange(value);
        setChainageFrom(String(from));
        setChainageTo(String(to));
        setLaidLength(String(Number((to - from).toFixed(3))));
      }
    }
    else if (picker.field.startsWith("check:")) {
      setResponses((current) => ({ ...current, [picker.field.slice(6)]: value }));
    }
    closePicker();
  };

  const preparePhotoAssets = async (check, source, assets, recovery = null, replaceIndex = null) => {
    const requiredPhotoCount = Math.max(1, Number(check.photoCount || 1));
    const currentPhotos = normalizePhotoAssets(responses[check.id]);
    const targetIndex = Number.isInteger(replaceIndex) ? replaceIndex : null;
    const remainingPhotoCount = targetIndex === null ? Math.max(1, requiredPhotoCount - currentPhotos.length) : 1;
    if (targetIndex === null && currentPhotos.length >= requiredPhotoCount) {
      if (recovery) await clearPipeCameraRecovery().catch(() => {});
      return;
    }
    setProcessingPhotoId(check.id);
    setProcessingPhotoSlot({ checkId: check.id, index: targetIndex === null ? currentPhotos.length : targetIndex });
    try {
      if (recovery) {
        await savePipeCameraRecovery({
          ...recovery,
          processingAttempts: Number(recovery.processingAttempts || 0) + 1,
        }).catch((error) => console.warn("[PipePhoto] Could not record processing attempt", error?.message));
      }
      console.info("[PipePhoto] Preparing captured image", { source, checkId: check.id, count: assets.length });
      const captureLocation = await getPipePhotoCaptureLocation();
      const processedPhotos = [];
      for (const asset of assets.slice(0, remainingPhotoCount)) {
        const takenAt = new Date().toLocaleString();
        const processedPhoto = await compressChecklistImage(asset, {
          takenAt,
          captureLocation,
          targetSizeBytes: 300 * 1024,
        });
        processedPhotos.push({
          uri: processedPhoto.uri,
          filePath: processedPhoto.filePath || processedPhoto.uri,
          fileName: processedPhoto.fileName || processedPhoto.name,
          source,
          takenAt,
          latitude: captureLocation?.latitude ?? null,
          longitude: captureLocation?.longitude ?? null,
          sizeKb: processedPhoto.sizeKb || null,
          width: processedPhoto.width || asset.width || null,
          height: processedPhoto.height || asset.height || null,
          type: processedPhoto.mimeType || "image/jpeg",
        });
      }
      setResponses((current) => ({
        ...current,
        [check.id]: (() => {
          const existing = normalizePhotoAssets(current[check.id]);
          if (targetIndex !== null && targetIndex >= 0 && targetIndex < existing.length) {
            const replaced = [...existing];
            replaced[targetIndex] = processedPhotos[0];
            return replaced;
          }
          return [...existing, ...processedPhotos].slice(0, requiredPhotoCount);
        })(),
      }));
      if (recovery || cameraRecovery?.photoCheckId === check.id) {
        await clearPipeCameraRecovery().catch((error) => console.warn("[PipePhoto] Cleanup failed", error?.message));
      }
      console.info("[PipePhoto] Image ready", { source, checkId: check.id });
    } catch (error) {
      console.warn("[PipePhoto] Processing failed", { message: error?.message, checkId: check.id });
      Alert.alert("Photo processing failed", "Unable to prepare this photo with compression and date/time watermark. Please try again.");
    } finally {
      setProcessingPhotoId("");
      setProcessingPhotoSlot(null);
    }
  };

  const choosePhoto = async (check, source, replaceIndex = null) => {
    try {
      const permission = source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", `Please allow ${source} access to add this photo.`);
        return;
      }
      const existingPhotos = normalizePhotoAssets(responses[check.id]);
      const isReplacing = Number.isInteger(replaceIndex) && replaceIndex >= 0 && replaceIndex < existingPhotos.length;
      if (!isReplacing && existingPhotos.length >= Number(check.photoCount || 1)) return;
      let recovery = null;
      if (source === "camera" && Platform.OS === "android") {
        if (!ownerUserId) throw new Error("Your account is still loading. Please try again.");
        await clearPipeCameraRecovery();
        recovery = await savePipeCameraRecovery({
          ownerUserId,
          routeParams: {
            projectId: route?.params?.projectId,
            material: route?.params?.material,
            resubmitSubmission,
            submissionDetail: resubmitDetail,
          },
          photoCheckId: check.id,
          photoCount: check.photoCount || 1,
          replaceIndex: isReplacing ? replaceIndex : null,
          source,
          processingAttempts: 0,
          draft: {
            workDate: workDate.toISOString(),
            selectedPipe,
            segmentId: selectedSegment?.id || "",
            contractor,
            openRange,
            workType,
            actualDiameter,
            chainageFrom,
            chainageTo,
            laidLength,
            remark,
            responses,
            existingPhotoKeys,
          },
        });
      }
      console.info("[PipePhoto] Opening picker", { source, checkId: check.id });
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.6, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.6, allowsEditing: false, allowsMultipleSelection: false });
      if (result.canceled || !result.assets?.length) {
        if (recovery) await clearPipeCameraRecovery();
        return;
      }
      if (recovery) recovery = await savePipeCameraCapturedAsset(recovery, result.assets[0]);
      await preparePhotoAssets(check, source, recovery ? [recovery.asset] : result.assets, recovery, isReplacing ? replaceIndex : null);
    } catch (error) {
      console.warn("[PipePhoto] Picker failed", { message: error?.message, source, checkId: check.id });
      Alert.alert("Camera unavailable", error?.message || "Could not open the camera. Please try again or select a photo from Gallery.");
    }
  };

  React.useEffect(() => {
    if (!cameraRecovery || recoveredPhotoHandledRef.current || isLoadingChecklist) return;
    const check = cameraRecovery.photoCheckId === CORRECTION_PHOTO_ID
      ? { id: CORRECTION_PHOTO_ID, photoCount: 1 }
      : allItems.find((entry) => entry.id === cameraRecovery.photoCheckId);
    if (!check) return;
    recoveredPhotoHandledRef.current = true;
    if (cameraRecovery.asset?.uri && !cameraRecovery.processingAttempts) {
      void preparePhotoAssets(check, "camera", [cameraRecovery.asset], cameraRecovery, cameraRecovery.replaceIndex);
    } else {
      Alert.alert(
        "Entry restored",
        cameraRecovery.asset?.uri
          ? "Your form is safe, but this photo could not be processed. Please capture it again or choose it from Gallery."
          : "Your form is safe. The camera did not return a photo; please capture it again.",
      );
    }
  }, [allItems, cameraRecovery, isLoadingChecklist]);

  const saveWork = async () => {
    if (isSaving || processingPhotoId) return;
    if (isLoadingChecklist || !visibleItems.length) {
      Alert.alert("Checklist is still loading", checklistError || "Please wait for the checklist, then try again.");
      return;
    }

    const nextErrors = {};
    if (!isResubmission) {
      if (!selectedSegment) nextErrors.pipe = true;
      if (!contractor) nextErrors.contractor = true;
      if (!actualDiameter.trim()) nextErrors.actualDiameter = true;
    }
    const validationErrors = isResubmission ? {} : validateDailyWork({
        projectId: route?.params?.projectId,
        segmentId: selectedSegment?.id,
        contractorId: selectedContractor?.id,
        chainageFromM: chainageFrom,
        chainageToM: chainageTo,
        lengthLaidM: laidLength,
        actualDiameterMm: actualDiameter,
        remark,
      });
    if (!isResubmission && Object.keys(validationErrors).length) nextErrors.work = true;
    const missingChecklist = visibleItems.filter((check) => check.required && !hasChecklistValue(check, responses[check.id]));
    if (isRejectedResubmission && normalizePhotoAssets(responses[CORRECTION_PHOTO_ID]).length !== 1) {
      nextErrors.correctionPhoto = true;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || missingChecklist.length) {
      if (Object.keys(nextErrors).length) scrollRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert(
        "Complete required details",
        `${Object.values(validationErrors).join(" ") || (nextErrors.correctionPhoto ? "Add one new correction photo. " : Object.keys(nextErrors).length ? "Add the highlighted work details. " : "")}${missingChecklist.length ? ` ${missingChecklist.length} checklist response${missingChecklist.length === 1 ? " is" : "s are"} still pending.` : ""}`,
      );
      return;
    }

    setIsSaving(true);
    let savedLocally = false;
    try {
      if (!ownerUserId) throw new Error("Your account is still loading. Please try again.");
      if (!isResubmission) {
        const network = await NetInfo.fetch().catch(() => ({}));
        const canUseNetwork = network.isConnected !== false && network.isInternetReachable !== false;
        let approvedPackages = stageProgress.segmentId === selectedSegment.id && stageProgress.status === "ready"
          ? stageProgress.packages
          : null;
        const prerequisite = previousPipeStage(workType);
        let previousWork = prerequisite && stageProgress.segmentId === selectedSegment.id && stageProgress.status === "ready"
          ? stageProgress.workByStage?.[prerequisite]
          : null;
        if (prerequisite) {
          if (canUseNetwork && !isPipeStageRangeApproved(
            approvedPackages, previousWork, workType, Number(chainageFrom), Number(chainageTo),
          )) {
            try {
              [approvedPackages, previousWork] = await Promise.all([
                fetchAndCachePipeStagePackages({
                  ownerUserId, projectId: route?.params?.projectId,
                  segmentId: selectedSegment.id, material,
                }),
                fetchAndCachePipeStageWork({
                  ownerUserId, projectId: route?.params?.projectId,
                  segmentId: selectedSegment.id, stage: prerequisite,
                }),
              ]);
              setStageProgress((current) => ({
                segmentId: selectedSegment.id, packages: approvedPackages,
                workByStage: { ...current.workByStage, [prerequisite]: previousWork },
                status: "ready", source: "server",
              }));
            } catch (error) {
              if (Number(error?.status) >= 400 && Number(error?.status) < 500) throw error;
              console.warn("[PipeEntryStage] Approval refresh unavailable at save", { message: error?.message });
            }
          }
          if (!approvedPackages || !Array.isArray(previousWork)) {
            const [cachedPackages, cachedWork] = await Promise.all([
              getCachedPipeStagePackages({
                ownerUserId, projectId: route?.params?.projectId, segmentId: selectedSegment.id, material,
              }),
              getCachedPipeStageWork({
                ownerUserId, projectId: route?.params?.projectId, segmentId: selectedSegment.id, stage: prerequisite,
              }),
            ]);
            approvedPackages = approvedPackages || cachedPackages?.payload || null;
            previousWork = Array.isArray(previousWork) ? previousWork : cachedWork?.payload || null;
          }
          if (!isPipeStageRangeApproved(approvedPackages, previousWork, workType, Number(chainageFrom), Number(chainageTo))) {
            Alert.alert(
              "Previous step not approved",
              approvedPackages && Array.isArray(previousWork)
                ? `Complete and approve ${prerequisite.replace(/_/g, " ")} for this exact chainage range before ${workType.replace(/_/g, " ")}. Your form has not been queued.`
                : "Approved-stage or completed-work data is not available offline. Reconnect once to download it; your form stays open.",
            );
            return;
          }
        }
        const pending = await listPendingPipeMutations(ownerUserId, { force: true });
        const localIntervals = pendingWorkIntervals(pending, selectedSegment.id, workType);
        let serverIntervals = [];
        if (canUseNetwork) {
          try {
            serverIntervals = await fetchPipeCoveredIntervals({
              projectId: route?.params?.projectId,
              segmentId: selectedSegment.id,
              workType,
            });
          } catch (error) {
            if (Number(error?.status) >= 400 && Number(error?.status) < 500) throw error;
            console.warn("[PipeEntryRange] Pre-submit refresh unavailable; server will validate on sync", {
              message: error?.message,
              segmentId: selectedSegment.id,
              workType,
            });
          }
        }
        const openRanges = approvedRangesForPipeStage(
          availableChainageRanges(0, Number(selectedSegment.lengthM), [...serverIntervals, ...localIntervals]),
          approvedPackages,
          workType,
          prerequisite ? previousWork : null,
        );
        const from = Number(chainageFrom);
        const to = Number(chainageTo);
        if (!openRanges.some(([start, end]) => from >= start - 0.001 && to <= end + 0.001)) {
          setAvailableRanges(openRanges);
          setErrors((current) => ({ ...current, work: true }));
          scrollRef.current?.scrollTo({ y: 0, animated: true });
          Alert.alert(
            "Choose an open chainage",
            openRanges.length
              ? "This range overlaps completed or locally saved work. Select an open range for this pipe and stage."
              : "No open chainage remains for this pipe and stage. Nothing was added to Pending Work.",
          );
          return;
        }
      }
      let legacyQueuedId = null;
      if (isResubmission) {
        const pending = await listPendingPipeMutations(ownerUserId, { force: true });
        const existing = pending.find((entry) => entry.operation === "resubmit_pipe_entry" && entry.payload?.submissionId === resubmitSubmission.submissionId);
        if (existing) {
          if (isRejectedResubmission && !existing.payload?.resubmitFile) {
            legacyQueuedId = existing.id;
          } else {
            Alert.alert("Already saved", "This resubmission is already waiting to sync. Please use Pending Work after reconnecting.");
            return;
          }
        }
      }
      if (!FileSystem.documentDirectory) {
        throw new Error("App storage is not available.");
      }

      const entryId = legacyQueuedId || `${isResubmission ? "pipe-resubmit" : "pipe-work"}-${Date.now()}`;
      const draftDirectory = `${FileSystem.documentDirectory}pipe-network-entries/`;
      await FileSystem.makeDirectoryAsync(draftDirectory, { intermediates: true });
      const persistedResponses = { ...responses };

      for (const check of allItems.filter((entry) => !isResubmission && entry.response === "photo")) {
        const sourceUris = normalizePhotoAssets(responses[check.id]).map((photo) => photo.uri || photo.filePath);
        const savedUris = [];
        for (const [photoIndex, sourceUri] of sourceUris.entries()) {
          if (!sourceUri?.startsWith("file://")) {
            savedUris.push(sourceUri);
            continue;
          }
          const sourceExtension = sourceUri.split("?")[0].match(/\.([a-zA-Z0-9]+)$/)?.[1] || "jpg";
          const savedUri = `${draftDirectory}${entryId}-${check.id}-${photoIndex + 1}.${sourceExtension}`;
          await FileSystem.copyAsync({ from: sourceUri, to: savedUri });
          savedUris.push(savedUri);
        }
        persistedResponses[check.id] = savedUris;
      }
      let resubmitFile = null;
      if (isRejectedResubmission) {
        const correctionUri = normalizePhotoAssets(responses[CORRECTION_PHOTO_ID])[0]?.uri;
        if (!correctionUri?.startsWith("file://")) {
          throw new Error("The correction photo is not available on this device. Please select it again.");
        }
        resubmitFile = `${draftDirectory}${entryId}-correction.jpg`;
        await FileSystem.copyAsync({ from: correctionUri, to: resubmitFile });
      }
      const projectId = route?.params?.projectId;
      const workPayload = isResubmission ? null : {
        projectId,
        clientMutationId: entryId,
        segmentId: selectedSegment.id,
        workDate: formatApiDate(workDate),
        chainageFromM: Number(chainageFrom),
        chainageToM: Number(chainageTo),
        lengthLaidM: Number(laidLength),
        contractorId: selectedContractor?.id,
        contractor: selectedContractor ? undefined : contractor,
        workType,
        actualDiameterMm: Number(actualDiameter),
        remark: remark.trim() || undefined,
      };
      const checklist = visibleItems.map((check) => ({
        checklistId: check.checklistId,
        value: check.response === "photo"
          ? isResubmission
            ? { files: existingPhotoKeys[check.id] || [] }
            : "uploaded"
          : persistedResponses[check.id],
        valueType: check.response === "photo" ? "file" : check.valueType,
      }));
      const files = isResubmission ? {} : Object.fromEntries(visibleItems.filter((check) => check.response === "photo" && persistedResponses[check.id]?.length).map((check) => [check.checklistId, persistedResponses[check.id]]));
      const packagePayload = isResubmission ? null : {
        projectId,
        segmentId: selectedSegment.id,
        material,
        title: selectedSegment.label || undefined,
        chainageFromM: Number(chainageFrom),
        chainageToM: Number(chainageTo),
        locationLabel: selectedSegment.locationCode || undefined,
        remark: remark.trim() || undefined,
      };
      const checklistPayload = { processCode: workType, remark: remark.trim() || undefined, checklist };

      await queuePipeMutation({
        id: entryId,
        ownerUserId,
        projectId,
        operation: isResubmission ? "resubmit_pipe_entry" : "create_pipe_entry",
        payload: isResubmission
          ? {
              submissionId: resubmitSubmission.submissionId,
              packageId: resubmitDetail.packageId,
              resubmitMode: isRejectedResubmission ? "rejected" : "modify_approved",
              resubmitFile,
              checklistPayload,
              files,
            }
          : { workPayload, packagePayload, checklistPayload, files },
      });
      savedLocally = true;

      // NetInfo can report "unknown" briefly when switching between Wi-Fi and
      // mobile data. In that case try the real API; only an explicit offline
      // state should defer the submission.
      const networkState = await NetInfo.fetch().catch(() => ({}));
      const canSyncNow = networkState.isConnected !== false && networkState.isInternetReachable !== false;
      setIsOnline(canSyncNow);
      if (!canSyncNow) {
        Alert.alert("Saved offline", `${material} checklist is saved on this device and will sync when the connection returns.`, [
          { text: "Done", onPress: () => navigation.goBack() },
        ]);
        return;
      }

      const result = await flushPendingPipeMutations(ownerUserId, { force: true, onlyIds: [entryId] });
      const stillPending = (await listPendingPipeMutations(ownerUserId, { force: true }))
        .some((entry) => entry.id === entryId);
      if (result.syncedIds.includes(entryId) || (!result.failed && !stillPending)) {
        Alert.alert(
          isResubmission ? "Resubmitted" : "Submitted",
          `${material} checklist was received by the server.`,
          [{ text: "Done", onPress: () => navigation.goBack() }],
        );
        return;
      }

      if (result.deferredIds?.includes(entryId)) {
        Alert.alert(
          "Waiting for previous step",
          "Your checklist is saved on this device. It will sync automatically after the required previous stage is approved on the server.",
          [{ text: "Done", onPress: () => navigation.goBack() }],
        );
        return;
      }

      const failure = result.failures.find((item) => item.id === entryId);
      const isConnectionFailure = failure?.code === "NETWORK_ERROR" || failure?.status === 0;
      const failureMessage = failure?.status === 413
        ? "The upload is still too large after photo compression. This saved item needs attention."
        : `${failure?.phase ? `${failure.phase}: ` : ""}${failure?.message || "The server could not complete this submission."}`;
      console.warn("[PipeEntrySubmit] Online submission did not complete", {
        status: failure?.status,
        code: failure?.code,
        phase: failure?.phase,
        message: failure?.message,
        networkType: networkState.type,
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable,
      });
      Alert.alert(
        isConnectionFailure ? "Connection interrupted" : "Server did not accept the checklist",
        isConnectionFailure
          ? "Your entry is saved on this device and will retry when the connection returns."
          : `${failureMessage} Your entry remains saved in Pending Work; it has not been submitted.`,
        [{ text: "Done", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert(
        savedLocally ? "Saved on device" : "Couldn’t save work",
        savedLocally
          ? `The server result could not be confirmed. Your entry remains in Pending Work and will retry. ${error?.message || ""}`
          : error?.message || "Your entries are still here. Please try again.",
        savedLocally ? [{ text: "Done", onPress: () => navigation.goBack() }] : undefined,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderResponse = (check, photoStartIndex = 0) => {
    const value = responses[check.id];

    if (check.response === "check") {
      return (
        <View style={styles.checkToggle}>
          <View style={[styles.checkbox, value && styles.checkboxActive]}>
            {value ? <Icon source="check" size={14} color={colors.white} /> : null}
          </View>
        </View>
      );
    }

    if (check.response === "select") {
      return (
        <Pressable
          onPress={() => openPicker(`check:${check.id}`, check.description || check.title, check.options?.length ? check.options.map(String) : SOIL_OPTIONS)}
          style={({ pressed }) => [styles.inlineSelect, pressed && styles.fieldPressed]}
        >
          <Text style={[styles.inlineSelectText, !value && styles.placeholder]} numberOfLines={1}>
            {value || "Select soil"}
          </Text>
          <Icon source="chevron-down" size={18} color={colors.primaryBlue} />
        </Pressable>
      );
    }

    if (check.response === "text") {
      return (
        <TextInput
          style={styles.inlineInput}
          value={value || ""}
          onChangeText={(text) => setResponses((current) => ({ ...current, [check.id]: text }))}
          placeholder="Enter value"
          placeholderTextColor="#8CA0B5"
        />
      );
    }

    if (isResubmission && check.id !== CORRECTION_PHOTO_ID) {
      let wrapped = resubmitDetail.items?.find((entry) => Number(entry.checklistId) === Number(check.checklistId))?.value;
      for (let depth = 0; depth < 3 && wrapped && typeof wrapped === "object" && !Array.isArray(wrapped) && Object.prototype.hasOwnProperty.call(wrapped, "value"); depth += 1) {
        wrapped = wrapped.value;
      }
      const files = Array.isArray(wrapped) ? wrapped : Array.isArray(wrapped?.files) ? wrapped.files : [];
      return (
        <View style={styles.photoField}>
          {files.map((file, index) => {
            const uri = file?.url || file?.publicUrl || file?.uri || (typeof file === "string" ? file : "");
            const photoLabel = check.description || check.title || "Checklist photo";
            return uri ? (
              <View key={`${uri}-${index}`} style={omsPhotoStyles.photoSlotCard}>
                <View style={omsPhotoStyles.photoSlotHeader}>
                  <Text style={omsPhotoStyles.photoSlotTitle}>{photoStartIndex + index + 1}. {photoLabel}</Text>
                  <Icon source="lock-outline" size={17} color={colors.textSecondary} />
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`View ${photoLabel}`}
                  onPress={() => setPhotoPreview({ visible: true, uri, title: STAGES.find((stage) => stage.key === workType)?.label || photoLabel, meta: "" })}
                  style={omsPhotoStyles.photoPreviewWrap}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri }} style={omsPhotoStyles.photoPreviewImage} resizeMode="cover" />
                  <View style={omsPhotoStyles.photoMetaCard}>
                    <Text style={omsPhotoStyles.photoMetaText}>Kept from the submitted checklist</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : null;
          })}
          <Text style={styles.photoCountHint}>Existing photos are preserved and cannot be changed in this resubmission.</Text>
        </View>
      );
    }

    const isProcessingPhoto = processingPhotoId === check.id;
    const photos = normalizePhotoAssets(value);
    const requiredPhotoCount = Math.max(1, Number(check.photoCount || 1));
    const photoLabel = check.description || check.title || "Checklist photo";

    return (
      <View style={styles.photoField}>
        {Array.from({ length: requiredPhotoCount }, (_, slotIndex) => {
          const photo = photos[slotIndex];
          const uri = photo?.uri || photo?.filePath;
          const slotTitle = `${photoStartIndex + slotIndex + 1}. ${photoLabel}${requiredPhotoCount > 1 ? ` · Photo ${slotIndex + 1}` : ""}`;
          const isPreparingSlot = isProcessingPhoto && processingPhotoSlot?.index === slotIndex;
          return (
            <View key={`${check.id}-slot-${slotIndex}`} style={omsPhotoStyles.photoSlotCard}>
              <View style={omsPhotoStyles.photoSlotHeader}>
                <Text style={omsPhotoStyles.photoSlotTitle}>{slotTitle}{check.required ? <Text style={styles.required}> *</Text> : null}</Text>
                {photo ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${slotTitle}`}
                    disabled={Boolean(processingPhotoId)}
                    onPress={() => setResponses((current) => ({
                      ...current,
                      [check.id]: normalizePhotoAssets(current[check.id]).filter((_, index) => index !== slotIndex),
                    }))}
                    style={({ pressed }) => [omsPhotoStyles.photoRemoveBtn, Boolean(processingPhotoId) && styles.buttonDisabled, pressed && styles.fieldPressed]}
                  >
                    <Icons.delete height={20} width={20} />
                    <Text style={omsPhotoStyles.photoRemoveBtnText}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={omsPhotoStyles.uploadActionsRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={Boolean(processingPhotoId)}
                  onPress={() => choosePhoto(check, "camera", photo ? slotIndex : null)}
                  style={({ pressed }) => [omsPhotoStyles.uploadButton, omsPhotoStyles.uploadCameraButton, Boolean(processingPhotoId) && omsPhotoStyles.uploadButtonDisabled, pressed && styles.fieldPressed]}
                >
                  {isPreparingSlot ? <ActivityIndicator size="small" color={colors.primaryBlue} /> : <Icons.uploadfile height={22} width={22} />}
                  <Text style={omsPhotoStyles.uploadButtonText}>{isPreparingSlot ? "Preparing Photo..." : photo ? "Retake Photo" : "Open Camera"}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={Boolean(processingPhotoId)}
                  onPress={() => choosePhoto(check, "gallery", photo ? slotIndex : null)}
                  style={({ pressed }) => [omsPhotoStyles.uploadButton, omsPhotoStyles.uploadGalleryButton, Boolean(processingPhotoId) && omsPhotoStyles.uploadButtonDisabled, pressed && styles.fieldPressed]}
                >
                  <Icons.gallery height={22} width={22} />
                  <Text style={omsPhotoStyles.uploadGalleryButtonText}>{photo ? "Replace from Gallery" : "Open Gallery"}</Text>
                </Pressable>
              </View>
              {isPreparingSlot ? (
                <View style={omsPhotoStyles.photoProcessingWrap}>
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                  <Text style={omsPhotoStyles.photoProcessingText}>Preparing image with timestamp...</Text>
                </View>
              ) : null}
              {uri ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`View ${slotTitle}`}
                  disabled={isProcessingPhoto}
                  onPress={() => setPhotoPreview({ visible: true, uri, title: STAGES.find((stage) => stage.key === workType)?.label || photoLabel, meta: photo.takenAt || "" })}
                  style={omsPhotoStyles.photoPreviewWrap}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri }} style={omsPhotoStyles.photoPreviewImage} resizeMode="cover" />
                  <View style={omsPhotoStyles.photoMetaCard}>
                    <Text style={omsPhotoStyles.photoMetaText}>Size: {photo.sizeKb ? `${photo.sizeKb}KB` : "Unknown"}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Text style={omsPhotoStyles.photoEmptyText}>No file selected</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const pickerIsLoading = picker.field === "pipe"
    ? isLoadingSegments && segments.length === 0
    : picker.field === "contractor"
      ? isLoadingContractors && contractors.length === 0
      : picker.field.startsWith("check:")
        ? isLoadingChecklist && picker.options.length === 0
        : false;
  const pickerEmptyMessage = isOnline === false
    ? "This list has not been saved on this device yet. Reconnect once to download it."
    : loadError || checklistError || "No options found.";
  const formBusy = isSaving || Boolean(processingPhotoId) || isLoadingChecklist || visibleItems.length === 0;
  const selectedStagePrerequisite = previousPipeStage(workType);
  const stageProgressReady = selectedSegment && stageProgress.segmentId === selectedSegment.id && stageProgress.status === "ready";
  const selectedStageLocked = Boolean(selectedStagePrerequisite && selectedSegment &&
    stageProgress.segmentId === selectedSegment.id && stageProgress.status !== "loading" &&
    !eligiblePipeStageIntervals(stageProgress.packages, stageProgress.workByStage?.[selectedStagePrerequisite], workType).length);

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.processSelector}>
          <View style={styles.processSelectorHeading}>
            <Text style={styles.sectionTitle}>{isResubmission ? "Edit & resubmit checklist" : "Work details & checklist"}</Text>
            <View style={styles.processHeadingMeta}>
              <View style={[styles.networkBadge, isOnline !== false && styles.networkBadgeHidden]} pointerEvents="none">
                <Icon source="cloud-off-outline" size={13} color={colors.pending} />
                <Text style={styles.networkBadgeText}>Offline</Text>
              </View>
              <Text style={styles.processCounter}>{completedCount}/{visibleItems.length} checks</Text>
            </View>
          </View>
          {isResubmission ? (
            <View style={styles.resubmitStageBadge}>
              <Icon source="file-edit-outline" size={16} color={colors.primaryBlue} />
              <Text style={styles.resubmitStageText}>{STAGES.find((stage) => stage.key === workType)?.label || workType}</Text>
              <Text style={styles.resubmitStageSubtext}>Resubmission</Text>
            </View>
          ) : (
            <>
              <View style={styles.processOptions} accessibilityRole="tablist">
                {STAGES.map((stage) => {
                  const prerequisite = previousPipeStage(stage.key);
                  const stageLocked = Boolean(prerequisite && selectedSegment &&
                    stageProgress.segmentId === selectedSegment.id && stageProgress.status !== "loading" &&
                    !eligiblePipeStageIntervals(stageProgress.packages, stageProgress.workByStage?.[prerequisite], stage.key).length);
                  const disabled = isSaving || Boolean(processingPhotoId);
                  return <Pressable
                    key={stage.key}
                    disabled={disabled}
                    accessibilityRole="tab"
                    accessibilityLabel={stageLocked ? `${stage.label} locked. Tap to refresh approvals.` : stage.label}
                    accessibilityState={{ selected: workType === stage.key, disabled }}
                    onPress={() => stageLocked ? setReloadKey((value) => value + 1) : setWorkType(stage.key)}
                    style={[styles.processOption, workType === stage.key && styles.processOptionActive, stageLocked && { opacity: 0.48 }]}
                  >
                    <Text style={[styles.processOptionText, workType === stage.key && styles.stageTabTextActive]}>{stage.label}</Text>
                  </Pressable>;
                })}
              </View>
              <Text style={styles.processHint}>
                {selectedStageLocked
                  ? `Waiting for approved ${selectedStagePrerequisite.replace(/_/g, " ")} on this pipe. Tap a locked step to refresh approvals.`
                  : selectedStagePrerequisite && selectedSegment && !stageProgressReady
                    ? "Checking approved work for this pipe without blocking the screen..."
                    : "Complete one process at a time. Later steps unlock after the previous step is approved; tap a faded step to refresh."}
              </Text>
            </>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {(loadError || checklistError) ? (
            <View style={styles.loadNotice}>
              <Icon source="alert-circle-outline" size={19} color={colors.pending} />
              <Text style={styles.loadNoticeText}>{checklistError || loadError}</Text>
              <Pressable accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)} style={styles.retryButton}><Text style={styles.retryButtonText}>Retry</Text></Pressable>
            </View>
          ) : null}

          {isResubmission ? (
            <View style={styles.resubmitNotice}>
              <Icon source="information-outline" size={19} color={colors.primaryBlue} />
              <View style={styles.resubmitNoticeCopy}>
                <Text style={styles.resubmitNoticeTitle}>{isRejectedResubmission ? "Correction requested" : "Modification approved"}</Text>
                {isRejectedResubmission && (resubmitSubmission.rejectionRemark || resubmitDetail.rejectionRemark) ? (
                  <Text style={styles.resubmitNoticeRemark}>{resubmitSubmission.rejectionRemark || resubmitDetail.rejectionRemark}</Text>
                ) : null}
                <Text style={styles.resubmitNoticeText}>{isRejectedResubmission ? "Update the checklist and add one new correction photo. Existing checklist photos stay attached." : "Update the checklist values and submit. Existing photos stay attached."}</Text>
              </View>
            </View>
          ) : <View style={styles.sectionCard}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.sectionIcon}>
                <Icon source="clipboard-text-outline" size={19} color={colors.primaryBlue} />
              </View>
              <View style={styles.sectionHeadingCopy}>
                <Text style={styles.sectionTitle}>Work details</Text>
                <Text style={styles.sectionSubtitle}>Select pipe and enter today’s progress.</Text>
              </View>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.column}>
                <FieldLabel required>Work Date</FieldLabel>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={({ pressed }) => [styles.selectField, pressed && styles.fieldPressed]}
                >
                  <Text style={styles.selectText}>{formatDate(workDate)}</Text>
                  <Icon source="calendar-blank-outline" size={19} color={colors.primaryBlue} />
                </Pressable>
              </View>
              <View style={[styles.column, styles.wideColumn]}>
                <SelectField
                  label="Pipe (Start → End)"
                  required
                  value={selectedPipe}
                  error={errors.pipe}
                  loading={isLoadingSegments && segments.length === 0}
                  placeholder="Select pipe"
                  onPress={() => openPicker("pipe", "Select pipe", pipeOptionLabels)}
                />
              </View>
            </View>

            {showDatePicker ? (
              <View style={styles.datePickerCard}>
                <DateTimePicker
                  value={workDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  maximumDate={new Date()}
                  onChange={(event, date) => {
                    if (Platform.OS !== "ios") setShowDatePicker(false);
                    if (event.type !== "dismissed" && date) setWorkDate(date);
                  }}
                  accentColor={colors.primaryBlue}
                />
                {Platform.OS === "ios" ? (
                  <Pressable style={styles.dateDoneButton} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.dateDoneText}>Done</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <View style={styles.pipeInfoGrid}>
              {[
                ["Location", selectedSegment?.locationCode || "—"],
                ["Label", selectedSegment?.label || "—"],
                ["Nodes", selectedSegment ? `${selectedSegment.startNode || "—"} → ${selectedSegment.stopNode || "—"}` : "—"],
                ["Material", material],
                ["Design Ø", `${selectedSegment?.diameterMm ?? "—"} mm`],
                ["Length", `${selectedSegment?.lengthM ?? "—"} m`],
              ].map(([label, value]) => (
                <View style={[styles.pipeInfoItem, stackFields && { width: "50%" }]} key={label}>
                  <Text style={styles.pipeInfoLabel}>{label}</Text>
                  <Text selectable style={styles.pipeInfoValue} numberOfLines={1}>{value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.formGrid}>
              <View style={[styles.formHalf, stackFields && styles.formFull]}>
                <FieldLabel required>Actual Ø (mm)</FieldLabel>
                <TextInput
                  style={[styles.textField, errors.actualDiameter && styles.fieldError]}
                  keyboardType="decimal-pad"
                  value={actualDiameter}
                  onChangeText={(value) => {
                    setActualDiameter(value);
                    setErrors((current) => ({ ...current, actualDiameter: false }));
                  }}
                  placeholder="Enter diameter"
                  placeholderTextColor="#8CA0B5"
                />
              </View>
              <View style={[styles.formHalf, stackFields && styles.formFull]}>
                <SelectField
                  label="Open chainage"
                  value={openRange}
                  loading={rangeStatus === "loading"}
                  placeholder={rangeStatus === "loading" ? "Checking open ranges..." : "Select open range"}
                  onPress={() => openPicker("openRange", "Select open range", availableRanges.map(rangeLabel))}
                />
              </View>
              {selectedSegment && rangeStatus !== "ready" ? (
                <Text style={[styles.formFull, { fontSize: 12, color: colors.textSecondary, marginTop: -4 }]}>
                  {rangeStatus === "offline"
                    ? "Offline: open ranges are estimated from saved work on this device. The server will verify this range on sync."
                    : rangeStatus === "prerequisite"
                      ? "No approved previous-stage range is saved for this pipe. Reconnect to refresh approvals or select another pipe."
                    : rangeStatus === "error"
                      ? "Could not check open ranges. You can enter chainage manually; the server will verify it on sync."
                      : rangeStatus === "loading" ? "Checking completed work without blocking this form..." : ""}
                </Text>
              ) : null}
              {selectedSegment && rangeStatus === "ready" && availableRanges.length === 0 ? (
                <Text style={[styles.formFull, styles.errorText]}>
                  {selectedStagePrerequisite ? `No approved ${selectedStagePrerequisite.replace(/_/g, " ")} chainage is open for this stage.` : "No open chainage remains for this pipe and stage."}
                </Text>
              ) : null}
              <View style={styles.formFull}>
                <SelectField
                  label="Contractor"
                  required
                  value={contractor}
                  error={errors.contractor}
                  loading={isLoadingContractors && contractors.length === 0}
                  placeholder="Select contractor"
                  onPress={() => openPicker("contractor", "Select contractor", contractorOptionLabels)}
                />
              </View>
              {[
                ["CH. From (m)", chainageFrom, setChainageFrom],
                ["CH. To (m)", chainageTo, setChainageTo],
                ["Laid (m)", laidLength, setLaidLength],
              ].map(([label, value, setter]) => (
                <View style={[styles.formThird, stackFields && { flexBasis: "100%" }]} key={label}>
                  <FieldLabel>{label}</FieldLabel>
                  <TextInput style={styles.textField} keyboardType="decimal-pad" value={value} onChangeText={(next) => {
                    rangeEditedRef.current = true;
                    setOpenRange("Custom range");
                    setter(next);
                  }} />
                </View>
              ))}
            </View>

            <FieldLabel>Remark</FieldLabel>
            <TextInput
              style={[styles.textField, styles.remarkField]}
              value={remark}
              onChangeText={setRemark}
              placeholder="Add an optional site note"
              placeholderTextColor="#8CA0B5"
              multiline
              textAlignVertical="top"
            />
          </View>}

          {isRejectedResubmission ? (
            <View style={omsPhotoStyles.formCard}>
              <View style={omsPhotoStyles.photoSection}>
                <View style={omsPhotoStyles.sectionHeaderRow}>
                  <Text style={omsPhotoStyles.photoSectionTitle}>Correction photo <Text style={styles.required}>*</Text></Text>
                  <View style={omsPhotoStyles.sectionCountBadge}>
                    <Text style={omsPhotoStyles.sectionCountBadgeText}>1 photo</Text>
                  </View>
                </View>
                <Text style={omsPhotoStyles.sectionHelperText}>Add one photo showing the correction. It will be compressed and marked with date and time.</Text>
                {renderResponse({ id: CORRECTION_PHOTO_ID, response: "photo", photoCount: 1, description: "Correction photo", required: true })}
                {errors.correctionPhoto ? <Text style={styles.errorText}>One correction photo is required before saving.</Text> : null}
              </View>
            </View>
          ) : null}

          <View style={styles.checklistHeading}>
            <View>
              <Text style={styles.checklistEyebrow}>CHECKLIST · {material}</Text>
              <Text style={styles.checklistTitle}>{STAGES.find((stage) => stage.key === workType)?.label}</Text>
            </View>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>{completedCount}/{visibleItems.length}</Text>
            </View>
          </View>

          {isLoadingChecklist && !visibleSections.length ? <FormLoadingSkeleton /> : null}
          {visibleSections.map((section) => (
            <React.Fragment key={section.key}>
              <View style={styles.checklistSection}>
              <View style={styles.checklistSectionHeader}>
                <View style={styles.sectionMarker} />
                <Text style={styles.checklistSectionTitle}>{section.title}</Text>
                <Text style={styles.checklistSectionCount}>{section.items.length} items</Text>
              </View>
              {section.items.filter((check) => check.response !== "photo").map((check, index, regularItems) => {
                const rowStyle = [styles.checklistRow, check.response === "check" && responses[check.id] && styles.checklistRowChecked, index === regularItems.length - 1 && styles.checklistRowLast];
                const rowContent = (
                  <>
                    {check.response === "check" ? renderResponse(check) : null}
                    <View style={styles.checkCopy}>
                      <Text style={styles.checkDescriptionPrimary}>
                        {check.description || check.title}
                        {check.required ? <Text style={styles.required}> *</Text> : null}
                      </Text>
                      {check.response !== "check" ? <View style={styles.responseWrap}>{renderResponse(check)}</View> : null}
                    </View>
                  </>
                );
                return check.response === "check" ? (
                  <Pressable
                    key={check.id}
                    onPress={() => setResponses((current) => ({ ...current, [check.id]: !current[check.id] }))}
                    accessibilityRole="checkbox"
                    accessibilityLabel={check.description || check.title}
                    accessibilityState={{ checked: Boolean(responses[check.id]) }}
                    style={({ pressed }) => [rowStyle, pressed && styles.fieldPressed]}
                  >
                    {rowContent}
                  </Pressable>
                ) : (
                  <View style={rowStyle} key={check.id}>{rowContent}</View>
                );
              })}
              </View>
              {section.items.some((check) => check.response === "photo") ? (
                <View style={omsPhotoStyles.formCard}>
                  <View style={omsPhotoStyles.photoSection}>
                    <View style={omsPhotoStyles.sectionHeaderRow}>
                      <Text style={omsPhotoStyles.photoSectionTitle}>Photos with Timestamp</Text>
                      <View style={omsPhotoStyles.sectionCountBadge}>
                        <Text style={omsPhotoStyles.sectionCountBadgeText}>
                        {countPhotoSlots(section.items)} photo{countPhotoSlots(section.items) === 1 ? "" : "s"}
                        </Text>
                      </View>
                    </View>
                    <Text style={omsPhotoStyles.sectionHelperText}>Capture clear site photos so the submission is easy to verify.</Text>
                    {section.items.filter((check) => check.response === "photo").map((check, index, photoItems) => (
                      <React.Fragment key={check.id}>
                        {renderResponse(check, countPhotoSlots(photoItems.slice(0, index)))}
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              ) : null}
            </React.Fragment>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Pressable disabled={isSaving || Boolean(processingPhotoId)} onPress={() => navigation.goBack()} style={({ pressed }) => [styles.cancelButton, (isSaving || Boolean(processingPhotoId)) && styles.buttonDisabled, pressed && styles.buttonPressed]}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            disabled={formBusy}
            accessibilityRole="button"
            accessibilityState={{ busy: isSaving || Boolean(processingPhotoId) || isLoadingChecklist, disabled: formBusy }}
            onPress={saveWork}
            style={({ pressed }) => [styles.saveButton, formBusy && styles.buttonDisabled, pressed && styles.buttonPressed]}
          >
            {isSaving || processingPhotoId ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon source="content-save-check-outline" size={20} color={colors.white} />
            )}
            <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : processingPhotoId ? "Preparing photo..." : isLoadingChecklist ? "Loading checklist..." : isResubmission ? "Save & resubmit" : "Save & submit stage"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <SearchableFilterModal
        visible={picker.visible}
        title={picker.title}
        subtitle="Search or select an option."
        options={picker.options}
        totalItems={picker.options.length}
        isLoading={pickerIsLoading}
        emptyMessage={pickerEmptyMessage}
        selectedValue={
          picker.field === "pipe" ? selectedPipe
            : picker.field === "contractor" ? contractor
              : picker.field === "openRange" ? openRange
                : picker.field.startsWith("check:") ? responses[picker.field.slice(6)] || ""
                  : ""
        }
        onSelect={handlePickerSelect}
        onClose={closePicker}
        searchPlaceholder={`Search ${picker.title.toLowerCase()}`}
      />
      <ImageViewerModal
        visible={photoPreview.visible}
        items={photoPreview.uri ? [{ id: photoPreview.uri, uri: photoPreview.uri, title: photoPreview.title, meta: photoPreview.meta }] : []}
        onRequestClose={() => setPhotoPreview({ visible: false, uri: "", title: "", meta: "" })}
      />
    </View>
  );
};

export default PipeNetworkEntryScreen;
