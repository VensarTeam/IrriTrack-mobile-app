import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput as NativeTextInput,
  useWindowDimensions,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Icon, IconButton } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import SearchableFilterModal from "../../components/SearchableFilterModal";
import colors from "../../constants/colors";
import styles from "./styles";

const STAGES = [
  { key: "all", label: "All", color: colors.primaryBlue },
  { key: "excavation", label: "Excavation", color: "#2876B8" },
  { key: "pipeLaying", label: "Pipe Laying", color: "#D9792A" },
  { key: "backfilling", label: "Backfilling", color: "#4C8A3B" },
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

const SelectField = ({ label, value, placeholder, onPress, required, error }) => (
  <View style={styles.fieldBlock}>
    <FieldLabel required={required}>{label}</FieldLabel>
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.selectField,
        error && styles.fieldError,
        pressed && styles.fieldPressed,
      ]}
    >
      <Text style={[styles.selectText, !value && styles.placeholder]}>
        {value || placeholder}
      </Text>
      <Icon source="chevron-down" size={20} color={colors.primaryBlue} />
    </Pressable>
    {error ? <Text style={styles.errorText}>Please select {label.toLowerCase()}.</Text> : null}
  </View>
);

const PipeNetworkEntryScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width, fontScale: textScale } = useWindowDimensions();
  const stackFields = width < 360 || textScale > 1.2;
  const scrollRef = React.useRef(null);
  const materialKey = String(route?.params?.material?.label || "MS").toUpperCase();
  const material = CHECKLISTS[materialKey] ? materialKey : "MS";
  const sections = CHECKLISTS[material];
  const allItems = sections.flatMap((section) => section.items);
  const [workDate, setWorkDate] = React.useState(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [selectedPipe, setSelectedPipe] = React.useState(PIPE_OPTIONS[material][0]);
  const [contractor, setContractor] = React.useState("");
  const [openRange, setOpenRange] = React.useState(OPEN_RANGE_OPTIONS[0]);
  const [workType, setWorkType] = React.useState("all");
  const [actualDiameter, setActualDiameter] = React.useState(PIPE_META[material].design);
  const [chainageFrom, setChainageFrom] = React.useState("0");
  const [chainageTo, setChainageTo] = React.useState("30");
  const [laidLength, setLaidLength] = React.useState("30");
  const [remark, setRemark] = React.useState("");
  const [responses, setResponses] = React.useState({});
  const [errors, setErrors] = React.useState({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [picker, setPicker] = React.useState({ visible: false, field: "", title: "", options: [] });

  const visibleSections = workType === "all"
    ? sections
    : sections.filter((section) => section.key === workType);
  const visibleItems = visibleSections.flatMap((section) => section.items);
  const completedCount = visibleItems.filter((check) => {
    const value = responses[check.id];
    return check.response === "check" ? value === true : Boolean(value);
  }).length;

  const openPicker = (field, title, options) => {
    setPicker({ visible: true, field, title, options });
  };

  const closePicker = () => setPicker((current) => ({ ...current, visible: false }));

  const handlePickerSelect = (value) => {
    if (picker.field === "pipe") setSelectedPipe(value);
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

      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.72 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.72 });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setResponses((current) => ({ ...current, [check.id]: result.assets[0].uri }));
      }
    };

    Alert.alert("Add site photo", check.title, [
      { text: "Camera", onPress: () => launch("camera") },
      { text: "Gallery", onPress: () => launch("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const saveWork = async () => {
    if (isSaving) return;

    const nextErrors = {};
    if (!contractor) nextErrors.contractor = true;
    if (!actualDiameter.trim()) nextErrors.actualDiameter = true;
    const missingChecklist = visibleItems.filter((check) => {
      const value = responses[check.id];
      return check.response === "check" ? value !== true : !value;
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || missingChecklist.length) {
      if (Object.keys(nextErrors).length) scrollRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert(
        "Complete required details",
        `${Object.keys(nextErrors).length ? "Add the highlighted work details. " : ""}${missingChecklist.length ? `${missingChecklist.length} checklist response${missingChecklist.length === 1 ? " is" : "s are"} still pending.` : ""}`,
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
        const sourceUri = responses[check.id];
        if (!sourceUri?.startsWith("file://")) continue;

        const sourceExtension = sourceUri.split("?")[0].match(/\.([a-zA-Z0-9]+)$/)?.[1] || "jpg";
        const savedUri = `${draftDirectory}${entryId}-${check.id}.${sourceExtension}`;
        await FileSystem.copyAsync({ from: sourceUri, to: savedUri });
        persistedResponses[check.id] = savedUri;
      }

      await FileSystem.writeAsStringAsync(
        `${draftDirectory}${entryId}.json`,
        JSON.stringify({
          id: entryId,
          projectName: route?.params?.projectName || "",
          material,
          workDate: workDate.toISOString(),
          pipe: selectedPipe,
          contractor,
          openRange,
          actualDiameter,
          chainageFrom,
          chainageTo,
          laidLength,
          workType,
          remark,
          responses: persistedResponses,
          createdAt: new Date().toISOString(),
          syncStatus: "draft",
        }),
      );

      Alert.alert("Work saved", `${material} pipe work entry is safely stored on this device.`, [
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
          accessibilityState={{ checked: Boolean(value) }}
          style={({ pressed }) => [styles.okControl, value && styles.okControlActive, pressed && styles.fieldPressed]}
        >
          <View style={[styles.checkbox, value && styles.checkboxActive]}>
            {value ? <Icon source="check" size={14} color={colors.white} /> : null}
          </View>
          <Text style={[styles.okText, value && styles.okTextActive]}>{value ? "Verified" : "Mark verified"}</Text>
        </Pressable>
      );
    }

    if (check.response === "select") {
      return (
        <Pressable
          onPress={() => openPicker(`check:${check.id}`, check.title, SOIL_OPTIONS)}
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

    return (
      <Pressable
        onPress={() => choosePhoto(check)}
        style={({ pressed }) => [styles.photoButton, value && styles.photoButtonAdded, pressed && styles.fieldPressed]}
      >
        {value ? <Image source={{ uri: value }} style={styles.photoThumbnail} /> : <Icon source="camera-plus-outline" size={19} color={colors.primaryBlue} />}
        <Text style={[styles.photoButtonText, value && styles.photoButtonTextAdded]}>
          {value ? "Replace photo" : "Add photo"}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Add entry</Text>
            <Text style={styles.headerSubtitle}>Pipe network · Daily work</Text>
          </View>
          <View style={styles.headerMaterialBadge}>
            <Text style={styles.headerMaterialText}>{material}</Text>
          </View>
        </View>

        <View style={styles.processSelector}>
          <View style={styles.processSelectorHeading}>
            <Text style={styles.sectionTitle}>Work details & checklist</Text>
            <Text style={styles.processCounter}>{completedCount}/{visibleItems.length} checks</Text>
          </View>
          <View style={styles.processOptions} accessibilityRole="tablist">
            {STAGES.map((stage) => (
              <Pressable
                key={stage.key}
                disabled={isSaving}
                accessibilityRole="tab"
                accessibilityState={{ selected: workType === stage.key, disabled: isSaving }}
                onPress={() => setWorkType(stage.key)}
                style={[styles.processOption, workType === stage.key && { backgroundColor: stage.color, borderColor: stage.color }]}
              >
                <Text style={[styles.processOptionText, workType === stage.key && styles.stageTabTextActive]}>{stage.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.processHint}>
            {workType === "all" ? "Complete all three stages in one entry." : "Complete work details and checks for the selected stage."}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
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
                  placeholder="Select pipe"
                  onPress={() => openPicker("pipe", "Select pipe", PIPE_OPTIONS[material])}
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
                ["Location", PIPE_META[material].location],
                ["Label", PIPE_META[material].label],
                ["Nodes", PIPE_META[material].nodes],
                ["Material", material],
                ["Design Ø", `${PIPE_META[material].design} mm`],
                ["Length", `${PIPE_META[material].length} m`],
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
                <SelectField label="Open Range" value={openRange} onPress={() => openPicker("openRange", "Select open range", OPEN_RANGE_OPTIONS)} />
              </View>
              <View style={styles.formFull}>
                <SelectField
                  label="Contractor"
                  required
                  value={contractor}
                  error={errors.contractor}
                  placeholder="Select contractor"
                  onPress={() => openPicker("contractor", "Select contractor", CONTRACTORS)}
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
              <Text style={styles.checklistTitle}>{workType === "all" ? `${allItems.length} inspection points` : STAGES.find((stage) => stage.key === workType)?.label}</Text>
            </View>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>{completedCount}/{visibleItems.length}</Text>
            </View>
          </View>

          {visibleSections.map((section) => (
            <View style={styles.checklistSection} key={section.key}>
              <View style={[styles.checklistSectionHeader, { backgroundColor: section.surface }]}>
                <View style={[styles.sectionMarker, { backgroundColor: section.color }]} />
                <Text style={[styles.checklistSectionTitle, { color: section.color }]}>{section.title}</Text>
                <Text style={[styles.checklistSectionCount, { color: section.color }]}>{section.items.length} items</Text>
              </View>
              {section.items.map((check, index) => (
                <View style={[styles.checklistRow, index === section.items.length - 1 && styles.checklistRowLast]} key={check.id}>
                  <View style={[styles.checkNumber, { backgroundColor: section.surface }]}>
                    <Text style={[styles.checkNumberText, { color: section.color }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.checkCopy}>
                    <Text style={styles.checkTitle}>{check.title}<Text style={styles.required}> *</Text></Text>
                    <Text style={styles.checkDescription}>{check.description}</Text>
                    <View style={styles.responseWrap}>{renderResponse(check)}</View>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Pressable disabled={isSaving} onPress={() => navigation.goBack()} style={({ pressed }) => [styles.cancelButton, isSaving && styles.buttonDisabled, pressed && styles.buttonPressed]}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityState={{ busy: isSaving, disabled: isSaving }}
            onPress={saveWork}
            style={({ pressed }) => [styles.saveButton, isSaving && styles.buttonDisabled, pressed && styles.buttonPressed]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon source="content-save-check-outline" size={20} color={colors.white} />
            )}
            <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : workType === "all" ? "Save all stages" : "Save stage"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <SearchableFilterModal
        visible={picker.visible}
        title={picker.title}
        subtitle="Search or select an option."
        options={picker.options}
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
    </SafeAreaView>
  );
};

export default PipeNetworkEntryScreen;
