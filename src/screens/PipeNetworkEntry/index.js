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
import * as FileSystem from "expo-file-system/legacy";
import LinearGradient from "react-native-linear-gradient";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SearchableFilterModal from "../../components/SearchableFilterModal";
import colors from "../../constants/colors";
import styles from "./styles";
import { useAuth } from "../../context/AuthContext";
import {
  createPipeChecklistPackage,
  createPipeDailyWork,
  fetchPipeChecklistMasters,
  fetchPipeChecklistPackages,
  fetchPipeContractors,
  fetchPipeSegments,
  submitPipeChecklist,
} from "../../services/pipeNetworkApi";
import {
  cleanupPipeMutationFiles,
  getPipeCache,
  queuePipeMutation,
  savePipeCache,
} from "../../services/pipeNetworkOfflineStore";
import { validateDailyWork } from "../../services/pipeDailyWorkInput";
import { compressChecklistImage } from "../../services/checklistImageStorage";

const STAGES = [
  { key: "excavation", label: "Excavation" },
  { key: "pipe_laying", label: "Pipe Laying" },
  { key: "backfilling", label: "Backfilling" },
];

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
    { key: "excavation", title: "Excavation", color: "#2876B8", surface: "#EAF4FD", items: COMMON_EXCAVATION },
    {
      key: "pipeLaying",
      title: "Pipe Laying",
      color: "#C56722",
      surface: "#FFF1E5",
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
      color: "#4C8A3B",
      surface: "#EDF7E8",
      items: [
        item("backfill", "Backfilling", "Backfilling is completed to ground level with required mound."),
        item("backfillPhoto", "Completed Backfilling Photo", "Capture one clear photo after completion.", "photo"),
      ],
    },
  ],
  DI: [
    { key: "excavation", title: "Excavation", color: "#2876B8", surface: "#EAF4FD", items: COMMON_EXCAVATION },
    {
      key: "pipeLaying",
      title: "Pipe Laying",
      color: "#C56722",
      surface: "#FFF1E5",
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
      color: "#4C8A3B",
      surface: "#EDF7E8",
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
      color: "#2876B8",
      surface: "#EAF4FD",
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
      color: "#C56722",
      surface: "#FFF1E5",
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
      color: "#4C8A3B",
      surface: "#EDF7E8",
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

const isRetryableSyncError = (error) => {
  const status = Number(error?.status || 0);
  return error?.isRetryable === true
    || [0, 408, 429, 500, 502, 503, 504].includes(status)
    || ["NETWORK_ERROR", "ERR_NETWORK", "ECONNABORTED", "REQUEST_TIMEOUT"].includes(String(error?.code || "").toUpperCase());
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
  const routeMaterial = route?.params?.material;
  const materialKey = String(routeMaterial?.label || routeMaterial?.key || routeMaterial || "MS").toUpperCase();
  const material = CHECKLISTS[materialKey] ? materialKey : "MS";
  const [sections, setSections] = React.useState([]);
  const allItems = sections.flatMap((section) => section.items);
  const [workDate, setWorkDate] = React.useState(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [segments, setSegments] = React.useState([]);
  const [selectedPipe, setSelectedPipe] = React.useState("");
  const [contractors, setContractors] = React.useState([]);
  const [contractor, setContractor] = React.useState("");
  const [openRange, setOpenRange] = React.useState("");
  const [workType, setWorkType] = React.useState("excavation");
  const [actualDiameter, setActualDiameter] = React.useState("");
  const [chainageFrom, setChainageFrom] = React.useState("0");
  const [chainageTo, setChainageTo] = React.useState("30");
  const [laidLength, setLaidLength] = React.useState("30");
  const [remark, setRemark] = React.useState("");
  const [responses, setResponses] = React.useState({});
  const [errors, setErrors] = React.useState({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedWorkId, setSavedWorkId] = React.useState(null);
  const [savedPackageId, setSavedPackageId] = React.useState(null);
  const [picker, setPicker] = React.useState({ visible: false, field: "", title: "", options: [] });
  const [isLoadingForm, setIsLoadingForm] = React.useState(true);
  const [isLoadingChecklist, setIsLoadingChecklist] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const [checklistError, setChecklistError] = React.useState("");
  const [reloadKey, setReloadKey] = React.useState(0);
  const [isOnline, setIsOnline] = React.useState(true);
  const [processingPhotoId, setProcessingPhotoId] = React.useState("");
  const saveScopeRef = React.useRef("");
  const ownerUserId = String(user?.id || user?.mobile || "").trim();

  const selectedSegment = React.useMemo(
    () => segments.find((segment) => segment.optionLabel === selectedPipe) || null,
    [segments, selectedPipe],
  );
  const selectedContractor = React.useMemo(
    () => contractors.find((entry) => entry.optionLabel === contractor) || null,
    [contractor, contractors],
  );
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
    const projectId = route?.params?.projectId;
    const controller = new AbortController();
    if (!projectId) {
      setLoadError("Project is missing. Open Add Entry from a Pipe Network project.");
      setIsLoadingForm(false);
      return () => controller.abort();
    }

    const normalizeSegments = (response) => (Array.isArray(response) ? response : response?.items || []).map((segment) => ({
      ...segment,
      optionLabel: `${segment.startNode || "—"} → ${segment.stopNode || "—"} · ${segment.label || "Unlabelled"} · ${Number(segment.lengthM || 0).toLocaleString("en-IN")} m`,
    })).filter((segment) => String(segment.material || "").toUpperCase().startsWith(material));
    const normalizeContractors = (response) => {
      const raw = Array.isArray(response) ? response : response?.items || response?.data || [];
      return raw.map((entry) => ({ ...entry, optionLabel: entry.firmName || entry.name || entry.contractorName || "" })).filter((entry) => entry.id && entry.optionLabel);
    };
    const applyReferenceData = (segmentResponse, contractorResponse) => {
      if (controller.signal.aborted) return;
      const nextSegments = normalizeSegments(segmentResponse);
      const nextContractors = normalizeContractors(contractorResponse);
      setSegments(nextSegments);
      setContractors(nextContractors);
      setSelectedPipe((current) => nextSegments.some((entry) => entry.optionLabel === current) ? current : "");
      setContractor((current) => nextContractors.some((entry) => entry.optionLabel === current) ? current : "");
    };

    setIsLoadingForm(true);
    setLoadError("");
    const cacheResource = `entry-reference:${material}`;
    void (async () => {
      let segmentResponse;
      let contractorResponse;
      let hasCachedData = false;
      try {
        const cached = await getPipeCache({ ownerUserId, projectId, resource: cacheResource })
          || await getPipeCache({ ownerUserId, projectId, resource: "entry-reference" });
        if (cached?.payload) {
          segmentResponse = cached.payload.segments;
          contractorResponse = cached.payload.contractors;
          applyReferenceData(segmentResponse, contractorResponse);
          hasCachedData = true;
          if (!controller.signal.aborted) setIsLoadingForm(false);
        }
      } catch {
        // Continue to the network refresh; a missing cache is a normal first-run state.
      }

      const networkState = await NetInfo.fetch();
      const canRefresh = networkState.isConnected !== false && networkState.isInternetReachable !== false;
      if (!canRefresh) {
        if (!controller.signal.aborted) {
          setLoadError(hasCachedData
            ? "Offline mode: showing saved pipe and contractor options."
            : "Pipe and contractor options are not saved on this device yet. Reconnect once to download them.");
          setIsLoadingForm(false);
        }
        return;
      }

      const [segmentResult, contractorResult] = await Promise.allSettled([
        fetchPipeSegments({ projectId, material, signal: controller.signal }),
        fetchPipeContractors({ signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;

      if (segmentResult.status === "fulfilled") segmentResponse = segmentResult.value;
      if (contractorResult.status === "fulfilled") contractorResponse = contractorResult.value;
      if (segmentResponse || contractorResponse) applyReferenceData(segmentResponse || [], contractorResponse || []);

      if (segmentResult.status === "fulfilled" && contractorResult.status === "fulfilled") {
        try {
          await savePipeCache({ ownerUserId, projectId, resource: cacheResource, payload: { segments: segmentResponse, contractors: contractorResponse } });
        } catch {
          setLoadError("Options loaded, but the offline copy could not be updated.");
        }
      }

      const failures = [segmentResult, contractorResult].filter((result) => result.status === "rejected");
      if (failures.length) {
        setLoadError(hasCachedData
          ? "Could not refresh all options. Showing saved offline data."
          : failures[0].reason?.message || "Could not load Pipe Network form data.");
      }
      setIsLoadingForm(false);
    })();
    return () => controller.abort();
  }, [material, ownerUserId, reloadKey, route?.params?.projectId]);

  React.useEffect(() => {
    const controller = new AbortController();
    const projectId = route?.params?.projectId;
    const resource = `masters:${material}:${workType}`;
    const applyMasters = (response) => {
      if (controller.signal.aborted) return;
      const masters = Array.isArray(response) ? response : response?.items || [];
      const stage = STAGES.find((entry) => entry.key === workType) || STAGES[0];
      setSections([{ ...stage, title: stage.label, color: colors.primaryBlue, surface: colors.surfaceBlue, items: masters.map((master) => ({
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
    const projectId = route?.params?.projectId;
    if (!projectId || !isOnline) return undefined;
    const controller = new AbortController();
    let timer;
    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => {
        const remainingStages = STAGES.filter((stage) => stage.key !== workType);
        void Promise.allSettled(remainingStages.map(async (stage) => {
          const response = await fetchPipeChecklistMasters({ material, processCode: stage.key, signal: controller.signal });
          await savePipeCache({ ownerUserId, projectId, resource: `masters:${material}:${stage.key}`, payload: response });
        }));
      }, 900);
    });
    return () => {
      task.cancel();
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOnline, material, ownerUserId, route?.params?.projectId]);

  React.useEffect(() => {
    if (!selectedSegment) return;
    const nextScope = `${selectedSegment.id}:${workType}`;
    if (saveScopeRef.current && saveScopeRef.current !== nextScope) {
      setSavedWorkId(null);
      setSavedPackageId(null);
    }
    saveScopeRef.current = nextScope;
    setActualDiameter(String(selectedSegment.diameterMm ?? ""));
    setChainageFrom("0");
    setChainageTo(String(Math.min(30, Number(selectedSegment.lengthM || 0))));
    setLaidLength(String(Math.min(30, Number(selectedSegment.lengthM || 0))));
    setOpenRange(`0 → ${Number(selectedSegment.lengthM || 0)} m`);
  }, [selectedSegment, workType]);

  const visibleSections = sections;
  const visibleItems = visibleSections.flatMap((section) => section.items);
  const hasChecklistValue = (check, value) => {
    if (check.response === "check") return value === true;
    if (check.response === "photo") {
      const photos = Array.isArray(value) ? value : value ? [value] : [];
      return photos.length >= Math.max(1, Number(check.photoCount || 1));
    }
    return typeof value === "string" ? Boolean(value.trim()) : value !== null && typeof value !== "undefined";
  };
  const completedCount = visibleItems.filter((check) => {
    return hasChecklistValue(check, responses[check.id]);
  }).length;

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

  const choosePhoto = async (check) => {
    const launch = async (source) => {
      const permission = source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", `Please allow ${source} access to add this photo.`);
        return;
      }

      const requiredPhotoCount = Math.max(1, Number(check.photoCount || 1));
      const currentPhotos = Array.isArray(responses[check.id])
        ? responses[check.id]
        : responses[check.id] ? [responses[check.id]] : [];
      const remainingPhotoCount = Math.max(1, requiredPhotoCount - currentPhotos.length);
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsEditing: false, allowsMultipleSelection: requiredPhotoCount > 1, selectionLimit: remainingPhotoCount });

      if (!result.canceled && result.assets?.length) {
        setProcessingPhotoId(check.id);
        try {
          const processedPhotos = [];
          for (const asset of result.assets.slice(0, remainingPhotoCount)) {
            const processedPhoto = await compressChecklistImage(asset, { takenAt: new Date().toLocaleString() });
            processedPhotos.push(processedPhoto.uri);
          }
          setResponses((current) => {
            const existing = Array.isArray(current[check.id]) ? current[check.id] : current[check.id] ? [current[check.id]] : [];
            const base = existing.length >= requiredPhotoCount
              ? existing.slice(0, Math.max(0, requiredPhotoCount - processedPhotos.length))
              : existing;
            return { ...current, [check.id]: [...base, ...processedPhotos].slice(0, requiredPhotoCount) };
          });
        } catch (error) {
          Alert.alert(
            "Photo processing failed",
            "Unable to compress and add the date and time to this photo. Please try again.",
          );
        } finally {
          setProcessingPhotoId("");
        }
      }
    };

    Alert.alert("Add site photo", check.description || check.title, [
      { text: "Camera", onPress: () => launch("camera") },
      { text: "Gallery", onPress: () => launch("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const saveWork = async () => {
    if (isSaving || processingPhotoId) return;
    if (isLoadingChecklist || !visibleItems.length) {
      Alert.alert("Checklist is still loading", checklistError || "Please wait for the checklist, then try again.");
      return;
    }

    const nextErrors = {};
    if (!selectedSegment) nextErrors.pipe = true;
    if (!contractor) nextErrors.contractor = true;
    if (!actualDiameter.trim()) nextErrors.actualDiameter = true;
    const validationErrors = validateDailyWork({
      projectId: route?.params?.projectId,
      segmentId: selectedSegment?.id,
      contractorId: selectedContractor?.id,
      chainageFromM: chainageFrom,
      chainageToM: chainageTo,
      lengthLaidM: laidLength,
      actualDiameterMm: actualDiameter,
      remark,
    });
    if (Object.keys(validationErrors).length) nextErrors.work = true;
    const missingChecklist = visibleItems.filter((check) => check.required && !hasChecklistValue(check, responses[check.id]));

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || missingChecklist.length) {
      if (Object.keys(nextErrors).length) scrollRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert(
        "Complete required details",
        `${Object.values(validationErrors).join(" ") || (Object.keys(nextErrors).length ? "Add the highlighted work details. " : "")}${missingChecklist.length ? ` ${missingChecklist.length} checklist response${missingChecklist.length === 1 ? " is" : "s are"} still pending.` : ""}`,
      );
      return;
    }

    setIsSaving(true);
    try {
      if (!FileSystem.documentDirectory) {
        throw new Error("App storage is not available.");
      }

      const entryId = `pipe-work-${Date.now()}`;
      const draftDirectory = `${FileSystem.documentDirectory}pipe-network-entries/`;
      await FileSystem.makeDirectoryAsync(draftDirectory, { intermediates: true });
      const persistedResponses = { ...responses };

      for (const check of allItems.filter((entry) => entry.response === "photo")) {
        const sourceUris = Array.isArray(responses[check.id]) ? responses[check.id] : responses[check.id] ? [responses[check.id]] : [];
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
      const projectId = route?.params?.projectId;
      const workPayload = {
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
        value: check.response === "photo" ? "uploaded" : persistedResponses[check.id],
        valueType: check.response === "photo" ? "file" : check.valueType,
      }));
      const files = Object.fromEntries(visibleItems.filter((check) => check.response === "photo" && persistedResponses[check.id]?.length).map((check) => [check.checklistId, persistedResponses[check.id]]));
      const packagePayload = {
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

      let queued = false;
      let syncedWorkId = savedWorkId;
      let syncedPackageId = savedPackageId;
      const persistOfflineEntry = async () => {
        await queuePipeMutation({
          id: entryId,
          ownerUserId,
          projectId,
          operation: "create_pipe_entry",
          payload: { workPayload, packagePayload, checklistPayload, files, syncedWorkId, syncedPackageId },
        });
        queued = true;
      };

      const networkState = await NetInfo.fetch();
      const canSubmitNow = networkState.isConnected !== false && networkState.isInternetReachable !== false;
      if (!canSubmitNow) {
        await persistOfflineEntry();
      } else {
        try {
          if (!syncedWorkId) {
            const work = await createPipeDailyWork(workPayload);
            syncedWorkId = work?.id || work?.workId || null;
            setSavedWorkId(syncedWorkId);
          }
          if (!syncedPackageId) {
            const existingPackages = await fetchPipeChecklistPackages({ projectId, segmentId: selectedSegment.id, material, page: 1, pageSize: 1 });
            const existingPackageId = existingPackages?.items?.[0]?.packageId;
            const checklistPackage = existingPackageId ? null : await createPipeChecklistPackage(packagePayload);
            syncedPackageId = existingPackageId || checklistPackage?.packageId || checklistPackage?.id || checklistPackage?.package?.packageId;
            setSavedPackageId(syncedPackageId);
          }
          const packageId = syncedPackageId;
          if (!packageId) throw new Error("Checklist package ID was not returned by the server.");
          await submitPipeChecklist({ payload: { ...checklistPayload, packageId }, files });
          await cleanupPipeMutationFiles({ files });
        } catch (syncError) {
          if (!isRetryableSyncError(syncError)) throw syncError;
          await persistOfflineEntry();
        }
      }

      Alert.alert(queued ? "Saved offline" : "Work submitted", queued ? `${material} entry will sync automatically when the connection is available.` : `${material} Daily Work and checklist were submitted.`, [
        { text: "Done", onPress: () => navigation.goBack() },
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
        <Pressable
          onPress={() => setResponses((current) => ({ ...current, [check.id]: !current[check.id] }))}
          accessibilityRole="checkbox"
          accessibilityLabel={check.description || check.title}
          accessibilityState={{ checked: Boolean(value) }}
          hitSlop={8}
          style={({ pressed }) => [styles.checkToggle, pressed && styles.fieldPressed]}
        >
          <View style={[styles.checkbox, value && styles.checkboxActive]}>
            {value ? <Icon source="check" size={14} color={colors.white} /> : null}
          </View>
        </Pressable>
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

    const isProcessingPhoto = processingPhotoId === check.id;
    const photos = Array.isArray(value) ? value : value ? [value] : [];
    const requiredPhotoCount = Math.max(1, Number(check.photoCount || 1));

    return (
      <Pressable
        disabled={Boolean(processingPhotoId)}
        onPress={() => choosePhoto(check)}
        style={({ pressed }) => [styles.photoButton, photos.length > 0 && styles.photoButtonAdded, isProcessingPhoto && styles.buttonDisabled, pressed && styles.fieldPressed]}
      >
        {isProcessingPhoto ? (
          <ActivityIndicator size="small" color={colors.primaryBlue} />
        ) : photos.length ? (
          <View style={styles.photoPreviewRow}>{photos.map((uri) => <Image key={uri} source={{ uri }} style={styles.photoThumbnail} />)}</View>
        ) : (
          <Icon source="camera-plus-outline" size={19} color={colors.primaryBlue} />
        )}
        <Text style={[styles.photoButtonText, photos.length && styles.photoButtonTextAdded]}>
          {isProcessingPhoto ? "Preparing photo..." : photos.length ? `${photos.length}/${requiredPhotoCount} added` : `Add ${requiredPhotoCount > 1 ? `${requiredPhotoCount} photos` : "photo"}`}
        </Text>
      </Pressable>
    );
  };

  const pickerIsLoading = picker.field === "pipe"
    ? isLoadingForm && segments.length === 0
    : picker.field === "contractor"
      ? isLoadingForm && contractors.length === 0
      : picker.field.startsWith("check:")
        ? isLoadingChecklist && picker.options.length === 0
        : false;
  const pickerEmptyMessage = !isOnline
    ? "This list has not been saved on this device yet. Reconnect once to download it."
    : loadError || checklistError || "No options found.";
  const formBusy = isSaving || Boolean(processingPhotoId) || isLoadingChecklist || visibleItems.length === 0;

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.processSelector}>
          <View style={styles.processSelectorHeading}>
            <Text style={styles.sectionTitle}>Work details & checklist</Text>
            <View style={styles.processHeadingMeta}>
              <View style={[styles.networkBadge, isOnline && styles.networkBadgeHidden]} pointerEvents="none">
                <Icon source="cloud-off-outline" size={13} color={colors.pending} />
                <Text style={styles.networkBadgeText}>Offline</Text>
              </View>
              <Text style={styles.processCounter}>{completedCount}/{visibleItems.length} checks</Text>
            </View>
          </View>
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

          <View style={styles.sectionCard}>
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
                  loading={isLoadingForm && segments.length === 0}
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
                  loading={isLoadingForm && contractors.length === 0}
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
          </View>

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
              <View style={[styles.checklistSectionHeader, { backgroundColor: section.surface }]}>
                <View style={[styles.sectionMarker, { backgroundColor: section.color }]} />
                <Text style={[styles.checklistSectionTitle, { color: section.color }]}>{section.title}</Text>
                <Text style={[styles.checklistSectionCount, { color: section.color }]}>{section.items.length} items</Text>
              </View>
              {section.items.map((check, index) => (
                <View style={[styles.checklistRow, check.response === "check" && styles.checklistRowToggle, index === section.items.length - 1 && styles.checklistRowLast]} key={check.id}>
                  <View style={styles.checkCopy}>
                    <Text style={styles.checkDescriptionPrimary}>
                      {check.description || check.title}
                      {check.required ? <Text style={styles.required}> *</Text> : null}
                    </Text>
                    {check.response !== "check" ? <View style={styles.responseWrap}>{renderResponse(check)}</View> : null}
                  </View>
                  {check.response === "check" ? renderResponse(check) : null}
                </View>
              ))}
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
            <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : processingPhotoId ? "Preparing photo..." : isLoadingChecklist ? "Loading checklist..." : "Save & submit stage"}</Text>
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
