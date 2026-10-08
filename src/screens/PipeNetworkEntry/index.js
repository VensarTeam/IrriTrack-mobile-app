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
import colors from "../../constants/colors";
import styles from "./styles";
import { useAuth } from "../../context/AuthContext";
import {
  fetchPipeChecklistMasters,
  fetchPipeContractors,
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
import { validateDailyWork } from "../../services/pipeDailyWorkInput";
import { compressChecklistImage } from "../../services/checklistImageStorage";

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
const OPEN_RANGE_OPTIONS = ["0 → 559 m (559.0 m)", "559 → 1,118 m (559.0 m)", "Custom range"];

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
  const [workDate, setWorkDate] = React.useState(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [segments, setSegments] = React.useState([]);
  const [selectedPipe, setSelectedPipe] = React.useState("");
  const [contractors, setContractors] = React.useState([]);
  const [contractor, setContractor] = React.useState("");
  const [openRange, setOpenRange] = React.useState("");
  const [workType, setWorkType] = React.useState(resubmitSubmission?.processCode || "excavation");
  const [actualDiameter, setActualDiameter] = React.useState("");
  const [chainageFrom, setChainageFrom] = React.useState("0");
  const [chainageTo, setChainageTo] = React.useState("30");
  const [laidLength, setLaidLength] = React.useState("30");
  const [remark, setRemark] = React.useState("");
  const [responses, setResponses] = React.useState({});
  const [existingPhotoKeys, setExistingPhotoKeys] = React.useState({});
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
  const ownerUserId = String(user?.id || user?.mobile || "").trim();
  const referenceScope = `${route?.params?.projectId || ""}:${material}`;
  const contractorScope = String(route?.params?.projectId || "");
  const referenceNetworkResultRef = React.useRef({ segments: "", contractors: "" });
  const hydratedResubmissionRef = React.useRef("");

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
      Alert.alert(
        failed ? "Sync needs attention" : "Sync complete",
        failed
          ? `${synced} checklist${synced === 1 ? "" : "s"} synced. ${failed} will stay saved and retry when possible.`
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
    if (!selectedSegment) return;
    setActualDiameter(String(selectedSegment.diameterMm ?? ""));
    setChainageFrom("0");
    setChainageTo(String(Math.min(30, Number(selectedSegment.lengthM || 0))));
    setLaidLength(String(Math.min(30, Number(selectedSegment.lengthM || 0))));
    setOpenRange(`0 → ${Number(selectedSegment.lengthM || 0)} m`);
  }, [selectedSegment, workType]);

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
    else if (picker.field === "openRange") setOpenRange(value);
    else if (picker.field.startsWith("check:")) {
      setResponses((current) => ({ ...current, [picker.field.slice(6)]: value }));
    }
    closePicker();
  };

  const choosePhoto = async (check, source) => {
    const permission = source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", `Please allow ${source} access to add this photo.`);
      return;
    }

    const requiredPhotoCount = Math.max(1, Number(check.photoCount || 1));
    const currentPhotos = normalizePhotoAssets(responses[check.id]);
    const remainingPhotoCount = Math.max(1, requiredPhotoCount - currentPhotos.length);
    if (currentPhotos.length >= requiredPhotoCount) return;
    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsEditing: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsEditing: false, allowsMultipleSelection: remainingPhotoCount > 1, selectionLimit: remainingPhotoCount });

    if (result.canceled || !result.assets?.length) return;
    setProcessingPhotoId(check.id);
    try {
      const captureLocation = await getPipePhotoCaptureLocation();
      const processedPhotos = [];
      for (const asset of result.assets.slice(0, remainingPhotoCount)) {
        const takenAt = new Date().toLocaleString();
        const processedPhoto = await compressChecklistImage(asset, { takenAt, captureLocation });
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
        [check.id]: [...normalizePhotoAssets(current[check.id]), ...processedPhotos].slice(0, requiredPhotoCount),
      }));
    } catch {
      Alert.alert("Photo processing failed", "Unable to prepare this photo with compression and date/time watermark. Please try again.");
    } finally {
      setProcessingPhotoId("");
    }
  };

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
    try {
      if (!ownerUserId) throw new Error("Your account is still loading. Please try again.");
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

      const networkState = await NetInfo.fetch();
      const canSyncNow = networkState.isConnected === true && networkState.isInternetReachable !== false;
      setIsOnline(canSyncNow);
      if (canSyncNow) {
        setTimeout(() => {
          InteractionManager.runAfterInteractions(() => {
            void flushPendingPipeMutations(ownerUserId);
          });
        }, 250);
      }
      Alert.alert(isResubmission ? "Changes saved" : "Entry saved", canSyncNow
        ? `${material} checklist is saved on this device and syncing in the background. It will remain queued if the connection drops.`
        : `${material} checklist is saved on this device and will sync automatically when the connection is available.`, [
        {
          text: "Done",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Couldn’t save work",
        error?.message || "Your entries are still here. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderResponse = (check) => {
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
      const source = resubmitDetail.items?.find((entry) => Number(entry.checklistId) === Number(check.checklistId))?.value;
      const wrapped = source && typeof source === "object" && Object.prototype.hasOwnProperty.call(source, "value") ? source.value : source;
      const files = Array.isArray(wrapped) ? wrapped : Array.isArray(wrapped?.files) ? wrapped.files : [];
      return (
        <View style={styles.photoPreviewList}>
          {files.map((file, index) => {
            const uri = file?.url || file?.publicUrl;
            return uri ? (
              <View key={`${uri}-${index}`} style={styles.photoPreviewCard}>
                <Image source={{ uri }} style={styles.photoPreviewImage} resizeMode="cover" />
                <View style={styles.photoPreviewFooter}>
                  <View style={styles.photoPreviewCopy}>
                    <Text style={styles.photoPreviewTitle}>Photo {index + 1}</Text>
                    <Text style={styles.photoPreviewMeta}>Kept from the submitted checklist</Text>
                  </View>
                  <Icon source="lock-outline" size={16} color={colors.textSecondary} />
                </View>
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

    return (
      <View style={styles.photoField}>
        <View style={styles.photoActionsRow}>
          <Pressable
            disabled={Boolean(processingPhotoId) || photos.length >= requiredPhotoCount}
            onPress={() => choosePhoto(check, "camera")}
            style={({ pressed }) => [styles.photoActionButton, styles.photoActionCamera, (Boolean(processingPhotoId) || photos.length >= requiredPhotoCount) && styles.buttonDisabled, pressed && styles.fieldPressed]}
          >
            {isProcessingPhoto ? <ActivityIndicator size="small" color={colors.primaryBlue} /> : <Icon source="camera-outline" size={19} color={colors.primaryBlue} />}
            <Text style={styles.photoButtonText}>{isProcessingPhoto ? "Preparing photo…" : photos.length ? "Retake / add" : "Open camera"}</Text>
          </Pressable>
          <Pressable
            disabled={Boolean(processingPhotoId) || photos.length >= requiredPhotoCount}
            onPress={() => choosePhoto(check, "gallery")}
            style={({ pressed }) => [styles.photoActionButton, styles.photoActionGallery, (Boolean(processingPhotoId) || photos.length >= requiredPhotoCount) && styles.buttonDisabled, pressed && styles.fieldPressed]}
          >
            <Icon source="image-multiple-outline" size={19} color={colors.primaryBlue} />
            <Text style={styles.photoButtonText}>{photos.length ? "Add from gallery" : "Open gallery"}</Text>
          </Pressable>
        </View>
        {photos.length ? (
          <View style={styles.photoPreviewList}>
            {photos.map((photo, index) => (
              <View key={`${photo.uri || photo.filePath}-${index}`} style={styles.photoPreviewCard}>
                <Image source={{ uri: photo.uri || photo.filePath }} style={styles.photoPreviewImage} resizeMode="cover" />
                <View style={styles.photoPreviewFooter}>
                  <View style={styles.photoPreviewCopy}>
                    <Text style={styles.photoPreviewTitle}>Photo {index + 1}{photo.sizeKb ? ` · ${photo.sizeKb} KB` : ""}</Text>
                    <Text style={styles.photoPreviewMeta} numberOfLines={1}>{photo.takenAt || "Date/time stamped on photo"}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${index + 1}`}
                    disabled={Boolean(processingPhotoId)}
                    hitSlop={8}
                    onPress={() => setResponses((current) => ({
                      ...current,
                      [check.id]: normalizePhotoAssets(current[check.id]).filter((_, photoIndex) => photoIndex !== index),
                    }))}
                    style={({ pressed }) => [styles.photoRemoveButton, pressed && styles.fieldPressed]}
                  >
                    <Icon source="close" size={17} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        <Text style={styles.photoCountHint}>{photos.length}/{requiredPhotoCount} photos added · compressed and date/time marked</Text>
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
                {STAGES.map((stage) => (
                  <Pressable
                    key={stage.key}
                    disabled={isSaving || Boolean(processingPhotoId)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: workType === stage.key, disabled: isSaving || Boolean(processingPhotoId) }}
                    onPress={() => setWorkType(stage.key)}
                    style={[styles.processOption, workType === stage.key && styles.processOptionActive]}
                  >
                    <Text style={[styles.processOptionText, workType === stage.key && styles.stageTabTextActive]}>{stage.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.processHint}>
                Complete work details and the checklist for one process at a time.
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
                <SelectField label="Segment Range" value={openRange} onPress={() => openPicker("openRange", "Select segment range", [openRange].filter(Boolean))} />
              </View>
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
                  <TextInput style={styles.textField} keyboardType="decimal-pad" value={value} onChangeText={setter} />
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
            <View style={styles.checklistSection}>
              <View style={styles.checklistSectionHeader}>
                <View style={[styles.sectionMarker, { backgroundColor: section.color }]} />
                <Text style={styles.checklistSectionTitle}>Correction photo <Text style={styles.required}>*</Text></Text>
              </View>
              <Text style={styles.resubmitNoticeText}>Add one photo showing the correction. It will be compressed and marked with date and time.</Text>
              {renderResponse({ id: CORRECTION_PHOTO_ID, response: "photo", photoCount: 1 })}
              {errors.correctionPhoto ? <Text style={styles.errorText}>One correction photo is required before saving.</Text> : null}
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
            <View style={styles.checklistSection} key={section.key}>
              <View style={styles.checklistSectionHeader}>
                <View style={styles.sectionMarker} />
                <Text style={styles.checklistSectionTitle}>{section.title}</Text>
                <Text style={styles.checklistSectionCount}>{section.items.length} items</Text>
              </View>
              {section.items.map((check, index) => {
                const rowStyle = [styles.checklistRow, check.response === "check" && responses[check.id] && styles.checklistRowChecked, index === section.items.length - 1 && styles.checklistRowLast];
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
    </View>
  );
};

export default PipeNetworkEntryScreen;
