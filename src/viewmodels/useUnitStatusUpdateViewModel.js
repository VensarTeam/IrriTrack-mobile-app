import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import {
  DEFAULT_NODE_LOCATION,
  STATUS_OPTIONS,
} from "../constants/moduleStatusConfig";
import { findUnitProgressSubprocess } from "../models/unitProgress";
import { openLocation } from "../services/mapService";
import { showAppAlert } from "../services/alertService";
import {
  getLatestChecklistSubmissionSnapshot,
  submitChecklistOfflineFirst,
} from "../services/checklistOfflineSync";
import { compressChecklistImage } from "../services/checklistImageStorage";
import { submitOmsReviewAction } from "../services/omsReviewService";
import { submitOmsCommentedResubmission } from "../services/omsResubmitService";
import {
  getCachedContractorList,
  refreshContractorList,
} from "../services/contractorOfflineStore";
import { useAuth } from "../context/AuthContext";
import useUnitProgress from "../hooks/useUnitProgress";
import useChecklistSections from "./useChecklistSections";

const buildChecklistState = (checklistItems = []) =>
  checklistItems.reduce((acc, item) => {
    acc[item.id] = false;
    return acc;
  }, {});

const buildPhotoState = (photoRequirements = []) =>
  photoRequirements.reduce((acc, requirement) => {
    acc[requirement.id] = null;
    return acc;
  }, {});

const buildSelectFieldState = (selectFields = []) =>
  selectFields.reduce((acc, field) => {
    acc[field.key] = field.defaultValue || "";
    return acc;
  }, {});

const buildInputFieldState = (inputFields = []) =>
  inputFields.reduce((acc, field) => {
    acc[field.key] = field.defaultValue || "";
    return acc;
  }, {});

const createRepeatableGroupItem = (group = {}, itemIndex = 0) =>
  (group.itemFields || []).reduce((acc, field) => {
    acc[field.key] =
      typeof field.getDefaultValue === "function"
        ? field.getDefaultValue({ group, field, itemIndex })
        : field.defaultValue || "";
    return acc;
  }, {});

const buildRepeatableGroupState = (repeatableGroups = []) =>
  repeatableGroups.reduce((acc, group) => {
    const minItems = group.minItems || 0;
    acc[group.key] = Array.from({ length: minItems }, (_, itemIndex) =>
      createRepeatableGroupItem(group, itemIndex)
    );
    return acc;
  }, {});

const buildFixedRepeatableGroupState = (group = {}) => {
  const count = group.fixedItemCount || 0;
  return Array.from({ length: count }, (_, itemIndex) =>
    createRepeatableGroupItem(group, itemIndex)
  );
};

const formatCoordinates = (location = {}) =>
  `${location.latitude ?? "-"}, ${location.longitude ?? "-"}`;

const getUnitBaseLocation = (unit = {}) => {
  const latitude = Number(unit?.latitude);
  const longitude = Number(unit?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
};

const buildUnitAddressSummary = (
  unit = {},
  baseLocation = null
) => {
  if (!baseLocation) {
    return "";
  }

  return formatCoordinates(baseLocation);
};

const formatGeocodeAddress = (place = {}) => {
  const parts = [
    place.name,
    place.street,
    place.district,
    place.city || place.subregion,
    place.region,
    place.postalCode,
    place.country,
  ].filter(Boolean);

  return parts.join(", ");
};

const normalizeText = (value) =>
  String(value || "")
    .replace(/&/g, "and")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const NUMBER_DATA_TYPES = new Set([
  "int",
  "integer",
  "float",
  "double",
  "decimal",
  "number",
]);

const FILE_STORAGE_BASE_URL =
  "https://vensor-bcsb3v2.bharathcloud.com:9000/vensorb3/";

const inferChecklistValueType = (source = {}, value, extra = {}) => {
  if (extra.valueType) {
    return extra.valueType;
  }

  if (extra.file) {
    return "file";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  if (value && typeof value === "object") {
    return "object";
  }

  const normalizedInputType = normalizeText(
    source.inputType || extra.input_type || ""
  );
  const normalizedDataType = normalizeText(
    source.dataType || extra.data_type || ""
  );

  if (normalizedInputType === "photo") {
    return "file";
  }

  if (
    normalizedInputType === "number" ||
    NUMBER_DATA_TYPES.has(normalizedDataType)
  ) {
    return "number";
  }

  return "string";
};

const formatSubmissionStatusLabel = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase()) || "Completed";

const toPositiveIntegerOrNull = (value) => {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue < 1) {
    return null;
  }

  return numericValue;
};

const findProgressSubprocessMatch = (
  progress = { processes: [] },
  {
    subprocessId = null,
    processName = "",
    subprocessName = "",
  } = {}
) => {
  const normalizedSubprocessId = String(subprocessId || "").trim();

  if (normalizedSubprocessId) {
    return findUnitProgressSubprocess(progress, normalizedSubprocessId);
  }

  const normalizedProcessName = normalizeText(processName);
  const normalizedSubprocessName = normalizeText(subprocessName);

  if (!normalizedSubprocessName) {
    return null;
  }

  for (const process of progress.processes || []) {
    const matchesProcess =
      !normalizedProcessName || normalizeText(process.name) === normalizedProcessName;

    if (!matchesProcess) {
      continue;
    }

    const subprocess = (process.subprocesses || []).find(
      (item) => normalizeText(item.name) === normalizedSubprocessName
    );

    if (subprocess) {
      return {
        process,
        subprocess,
      };
    }
  }

  return null;
};

const getProgressChecklistMatch = (
  checklistsById,
  checklistsByName,
  source = {},
  fallbackLabel = ""
) => {
  const checklistId = String(source.checklistId || source.id || source.key || "").trim();

  if (checklistId && checklistsById.has(checklistId)) {
    return checklistsById.get(checklistId) || null;
  }

  const candidateNames = [
    source.label,
    source.description,
    fallbackLabel,
  ]
    .map((item) => normalizeText(item))
    .filter(Boolean);

  for (const candidateName of candidateNames) {
    if (checklistsByName.has(candidateName)) {
      return checklistsByName.get(candidateName) || null;
    }
  }

  return null;
};

const toSentenceCase = (value = "") => {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
};

const isContractorSelectField = (field = {}) =>
  field?.key === "contractorName" ||
  normalizeText(field?.label).includes("contractor");

const isVisibleByRule = (item, values, subOption) =>
  !item?.showWhen || item.showWhen({ values, subOption });

const isRequiredByRule = (item, values, subOption) => {
  if (item?.requiredWhen) {
    return item.requiredWhen({ values, subOption });
  }

  return item?.required !== false;
};

const getFieldValidationMessage = ({ field = {}, type = "select" } = {}) => {
  const label =
    field.validationLabel ||
    field.label ||
    field.title ||
    field.description ||
    "this field";
  const normalizedLabel = normalizeText(label);

  if (normalizedLabel.includes("contractor")) {
    return "Please select contractor";
  }

  if (type === "input") {
    return `Please enter ${String(label).trim().toLowerCase()}`;
  }

  return `Please select ${String(label).trim().toLowerCase()}`;
};

const getInitialFormValues = (section, unit) => {
  const baseLocation = getUnitBaseLocation(unit);

  return section.subOptions.reduce((acc, sub) => {
    acc[sub.id] = {
      status: sub.showStatusField === false ? "" : "Pending",
      remark: "",
      checks: buildChecklistState(sub.checklistItems),
      photos: buildPhotoState(sub.photoRequirements),
      repeatableGroups: buildRepeatableGroupState(sub.repeatableGroups),
      defaultLocation: baseLocation,
      defaultAddress: buildUnitAddressSummary(unit, baseLocation),
      updatedLocation: null,
      updatedAddress: "",
      updatedAt: null,
      pendingUpdatedLocation: null,
      pendingUpdatedAddress: "",
      pendingUpdatedAt: null,
      ...buildSelectFieldState(sub.selectFields),
      ...buildInputFieldState(sub.inputFields),
    };

    return acc;
  }, {});
};

const SUBMITTED_STATUS_KEYS = new Set([
  "submitted",
  "partial",
  "completed",
  "approved",
  "updated",
]);

const SERVER_PREFILL_STATUS_KEYS = new Set([
  "submitted",
  "partial",
  "completed",
  "approved",
  "updated",
]);

const RECTIFICATION_PHOTO_REQUIREMENT = {
  id: "rectificationPhoto",
  checklistId: null,
  label: "Rectification Image",
  inputType: "photo",
  dataType: "image",
  required: false,
  synthetic: true,
};

const toFormStatusValue = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (
    normalizedValue === "completed" ||
    normalizedValue === "approved" ||
    normalizedValue === "updated"
  ) {
    return "Completed";
  }

  if (normalizedValue === "partial" || normalizedValue === "commented") {
    return "Partially Completed";
  }

  if (normalizedValue === "partially completed") {
    return "Partially Completed";
  }

  return "Pending";
};

const parseCoordinateValue = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    const latitude = Number(value.latitude);
    const longitude = Number(value.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }

    const updatedLocation = value.updated_location || value.updatedLocation;

    if (updatedLocation) {
      return parseCoordinateValue(updatedLocation);
    }
  }

  const match = String(value)
    .trim()
    .match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);

  if (!match) {
    return null;
  }

  return {
    latitude: Number(match[1]),
    longitude: Number(match[2]),
  };
};

const parseRepeatableGroupItems = (group, rawValue) => {
  let parsedValue = rawValue;

  if (typeof parsedValue === "string") {
    try {
      parsedValue = JSON.parse(parsedValue);
    } catch (error) {
      parsedValue = [];
    }
  }

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue.map((item, itemIndex) => {
    const nextItem = createRepeatableGroupItem(group, itemIndex);

    if (Array.isArray(item?.values)) {
      item.values.forEach((field) => {
        if (field?.key) {
          nextItem[field.key] = field.value ?? "";
        }
      });

      return nextItem;
    }

    if (item && typeof item === "object") {
      Object.entries(item).forEach(([key, value]) => {
        nextItem[key] = value ?? "";
      });
    }

    return nextItem;
  });
};

const getServerPhotoUri = (remoteValue, objectKey = "") => {
  const rawValue = String(remoteValue || "").trim();
  const rawObjectKey = String(objectKey || "").trim();

  if (rawValue.startsWith("http://") || rawValue.startsWith("https://")) {
    return rawValue;
  }

  if (rawObjectKey) {
    return `${FILE_STORAGE_BASE_URL}${rawObjectKey.replace(/^\/+/, "")}`;
  }

  if (rawValue) {
    return `${FILE_STORAGE_BASE_URL}${rawValue.replace(/^\/+/, "")}`;
  }

  return "";
};

const buildProgressHydrationSignature = (match = null) => {
  if (!match?.subprocess) {
    return "server:none";
  }

  const checklistSignature = (match.subprocess.checklists || [])
    .map((checklist) => {
      const rawChecklist = checklist.rawChecklist || {};
      const detailValue =
        checklist.detail?.rawValue ??
        checklist.detail?.value ??
        rawChecklist.value ??
        rawChecklist.objectKey ??
        "";
      const updatedAt =
        rawChecklist.updatedAt ||
        rawChecklist.updated_at ||
        rawChecklist.submittedAt ||
        rawChecklist.submitted_at ||
        "";

      return [
        checklist.id,
        checklist.status?.key || "",
        JSON.stringify(detailValue),
        rawChecklist.objectKey || "",
        updatedAt,
      ].join(":");
    })
    .join("|");

  return [
    "server",
    match.process?.id || "",
    match.subprocess.id || "",
    match.subprocess.status?.key || "",
    checklistSignature,
  ].join(":");
};

const useUnitStatusUpdateViewModel = (navigation, route) => {
  const { roleAccess, user } = useAuth();
  const ownerUserId = String(user?.id || user?.mobile || "").trim();
  const module = (route?.params?.module || "OMS").toUpperCase();
  const unit = route?.params?.unit || {};
  const workItem = route?.params?.workItem || null;
  const checklistSectionUnit = useMemo(
    () => ({
      ...unit,
      subChakQuantity:
        unit?.subChakQuantity ??
        unit?.subCheckQty ??
        unit?.subChakQty ??
        workItem?.subCheckQty ??
        workItem?.subChakQuantity ??
        workItem?.subChakQty ??
        null,
    }),
    [unit, workItem]
  );
  const projectId =
    route?.params?.projectId || unit?.projectId || route?.params?.project?.id || "";
  const projectName = route?.params?.projectName || "IrriTrack";
  const sectionKey = route?.params?.sectionKey || "pipeLaying";
  const requestedSubOptionId = route?.params?.subOptionId;
  const { sections, masterSource } = useChecklistSections({
    module,
    unit: checklistSectionUnit,
  });
  const hydratedSubOptionsRef = useRef({});

  const section =
    sections.find((item) => item.key === sectionKey) || sections[0];

  const initialSubOptionId =
    section.subOptions.find((sub) => sub.id === requestedSubOptionId)?.id ||
    section.subOptions[0]?.id;

  const [activeSubOptionId, setActiveSubOptionId] = useState(initialSubOptionId);
  const [formValues, setFormValues] = useState(() =>
    getInitialFormValues(section, checklistSectionUnit)
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [pickerState, setPickerState] = useState({
    visible: false,
    field: "",
    title: "",
    options: [],
    target: null,
  });
  const [photoPreviewState, setPhotoPreviewState] = useState({
    visible: false,
    media: null,
  });
  const [photoProcessingState, setPhotoProcessingState] = useState({
    requirementId: "",
    message: "",
  });
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractors, setContractors] = useState([]);
  const [localSubmissionSnapshots, setLocalSubmissionSnapshots] = useState({});
  const {
    progress,
    refreshProgress,
  } = useUnitProgress({
    projectId,
    unitId: unit?.id || route?.params?.unitId || "",
    enabled: Boolean(projectId && (unit?.id || route?.params?.unitId)),
  });

  useEffect(() => {
    const nextSection =
      sections.find((item) => item.key === sectionKey) || sections[0];
    const nextSubOptionId =
      nextSection?.subOptions?.find((sub) => sub.id === requestedSubOptionId)
        ?.id || nextSection?.subOptions?.[0]?.id;

    if (!nextSection || !nextSubOptionId) return;

    console.log("[ChecklistForm]", "Form ready", {
      source: masterSource,
      sectionKey: nextSection.key,
      subOptionId: nextSubOptionId,
      checklistCount: nextSection.subOptions.reduce(
        (count, item) => count + (item.apiChecklists?.length || 0),
        0
      ),
    });
    setActiveSubOptionId(nextSubOptionId);
    setFormValues(getInitialFormValues(nextSection, checklistSectionUnit));
    setFieldErrors({});
    hydratedSubOptionsRef.current = {};
  }, [
    checklistSectionUnit,
    masterSource,
    requestedSubOptionId,
    sectionKey,
    sections,
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadContractors = async () => {
      try {
        const cachedContractors = await getCachedContractorList();

        if (isMounted && cachedContractors.length) {
          setContractors(cachedContractors);
        }
      } catch (error) {
        console.log("[ContractorOptions]", "Local contractor cache unavailable", {
          message: error?.message,
        });
      }

      try {
        const refreshedContractors = await refreshContractorList();

        if (isMounted) {
          setContractors(refreshedContractors);
        }
      } catch (error) {
        console.log("[ContractorOptions]", "Contractor refresh failed", {
          message: error?.message,
          status: error?.status,
        });
      }
    };

    void loadContractors();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeSubOption = useMemo(
    () =>
      section.subOptions.find((sub) => sub.id === activeSubOptionId) ||
      section.subOptions[0],
    [activeSubOptionId, section.subOptions]
  );
  const workItemStatusKey = String(
    workItem?.requestBucket || workItem?.status || ""
  )
    .trim()
    .toLowerCase();
  const workItemSubprocessId = String(workItem?.subprocessId || "").trim();
  const isCommentedWorkItem = workItemStatusKey === "commented" || workItemStatusKey === "rejected";

  const activeValues =
    formValues[activeSubOption.id] ||
    getInitialFormValues({ subOptions: [activeSubOption] }, checklistSectionUnit)[
    activeSubOption.id
    ];
  const activeErrors = fieldErrors[activeSubOption.id] || {};
  const unitLabel = unit?.unitNo || `${module}-001`;

  const checklistItems = activeSubOption.checklistItems || [];
  const showStatusField = activeSubOption.showStatusField !== false;
  const showRemarkField = activeSubOption.showRemarkField !== false;

  const contractorLookup = useMemo(() => {
    const lookup = new Map();

    contractors.forEach((contractor) => {
      if (contractor.optionLabel) {
        lookup.set(contractor.optionLabel, contractor);
      }

      if (contractor.firmName) {
        lookup.set(contractor.firmName, contractor);
      }
    });

    return lookup;
  }, [contractors]);
  const contractorOptions = useMemo(
    () => contractors.map((contractor) => contractor.optionLabel).filter(Boolean),
    [contractors]
  );

  const selectFields = (activeSubOption.selectFields || []).filter((field) =>
    isVisibleByRule(field, activeValues, activeSubOption)
  ).map((field) =>
    isContractorSelectField(field) && contractorOptions.length
      ? {
        ...field,
        options: contractorOptions,
      }
      : field
  );
  const inputFields = (activeSubOption.inputFields || []).filter((field) =>
    isVisibleByRule(field, activeValues, activeSubOption)
  );
  const repeatableGroups = (activeSubOption.repeatableGroups || []).filter((group) =>
    isVisibleByRule(group, activeValues, activeSubOption)
  );
  const photoRequirements = (activeSubOption.photoRequirements || []).filter(
    (requirement) => isVisibleByRule(requirement, activeValues, activeSubOption)
  );

  const isRemarkRequired = !!(
    showRemarkField &&
    activeSubOption.remarkRequiredWhen?.({
      values: activeValues,
      subOption: activeSubOption,
    })
  );

  const getSubOptionLabel = (subOption) => subOption.label;

  const activeSubOptionLabel = activeSubOption.label;
  const submissionProcessId = toPositiveIntegerOrNull(
    activeSubOption.apiProcessId || section.apiProcessId
  );
  const submissionSubprocessId = toPositiveIntegerOrNull(
    activeSubOption.apiSubprocessId
  );
  const progressMatchesBySubOptionId = useMemo(
    () =>
      section.subOptions.reduce((acc, subOption) => {
        const subprocessId = toPositiveIntegerOrNull(subOption.apiSubprocessId);
        acc[subOption.id] = findProgressSubprocessMatch(progress, {
          subprocessId,
          processName: section.apiDescription || section.title,
          subprocessName: subOption.apiDescription || subOption.label,
        });
        return acc;
      }, {}),
    [progress, section.apiDescription, section.subOptions, section.title]
  );
  const progressMatch = progressMatchesBySubOptionId[activeSubOption.id] || null;

  const loadLocalSnapshots = useCallback(async () => {
    if (!section.subOptions.length) {
      setLocalSubmissionSnapshots({});
      return;
    }

    const nextSnapshots = {};

    await Promise.all(
      section.subOptions.map(async (subOption) => {
        const processId = toPositiveIntegerOrNull(
          subOption.apiProcessId || section.apiProcessId
        );
        const subprocessId = toPositiveIntegerOrNull(subOption.apiSubprocessId);

        if (!processId || !subprocessId) {
          return;
        }

        const snapshot = await getLatestChecklistSubmissionSnapshot({
          unitId: unit?.id || route?.params?.unitId || "",
          processId,
          subprocessId,
          ownerUserId,
        });

        if (snapshot) {
          nextSnapshots[subOption.id] = snapshot;
        }
      })
    );

    setLocalSubmissionSnapshots(nextSnapshots);
  }, [
    ownerUserId,
    route?.params?.unitId,
    section.apiProcessId,
    section.subOptions,
    unit?.id,
  ]);

  useEffect(() => {
    void loadLocalSnapshots();
  }, [loadLocalSnapshots]);

  useFocusEffect(
    useCallback(() => {
      void loadLocalSnapshots();
      void refreshProgress();
    }, [loadLocalSnapshots, refreshProgress])
  );

  const localSubmissionSnapshot = localSubmissionSnapshots[activeSubOption.id] || null;
  const stepSubmissionStateById = useMemo(
    () =>
      section.subOptions.reduce((acc, subOption) => {
        const serverMatch = progressMatchesBySubOptionId[subOption.id];
        const localSnapshot = localSubmissionSnapshots[subOption.id] || null;
        const subprocessStatusKey = String(
          serverMatch?.subprocess?.status?.key || ""
        ).trim().toLowerCase();
        const processStatusKey = String(
          serverMatch?.process?.status?.key || ""
        ).trim().toLowerCase();
        const isWorkflowCommented =
          isCommentedWorkItem &&
          workItemSubprocessId &&
          String(subOption.apiSubprocessId || "").trim() === workItemSubprocessId;
        const isCommented =
          isWorkflowCommented ||
          subprocessStatusKey === "commented" ||
          processStatusKey === "commented";
        const serverStatusKey = isCommented
          ? "commented"
          : subprocessStatusKey || processStatusKey;
        const submittedFromServer = Boolean(
          serverMatch?.subprocess &&
          SUBMITTED_STATUS_KEYS.has(serverStatusKey)
        );
        const submittedFromLocal = !isCommented && localSnapshot?.status === "synced";

        acc[subOption.id] = {
          processStatusKey,
          subprocessStatusKey,
          serverStatusKey,
          isCommented,
          submittedFromServer,
          submittedFromLocal,
          isSubmitted:
            (!isCommented && submittedFromServer) || submittedFromLocal,
        };

        return acc;
      }, {}),
    [
      isCommentedWorkItem,
      localSubmissionSnapshots,
      progressMatchesBySubOptionId,
      section.subOptions,
      workItemSubprocessId,
    ]
  );
  const activeSubmissionState = stepSubmissionStateById[activeSubOption.id] || {};
  const activeServerStatusKey = activeSubmissionState.serverStatusKey || "";
  const isCommentedForEdit = Boolean(activeSubmissionState.isCommented);
  const submittedFromServer = Boolean(activeSubmissionState.submittedFromServer);
  const submittedFromLocal = Boolean(activeSubmissionState.submittedFromLocal);
  const isRoleReadOnly = !roleAccess.canEditChecklist;
  const isReadOnly =
    isRoleReadOnly || (!isCommentedForEdit && submittedFromServer) || submittedFromLocal;
  const readOnlyTitle = isRoleReadOnly ? "View Only" : "Already Submitted";
  const readOnlyNotice = isRoleReadOnly
    ? roleAccess.checklistReadOnlyNotice ||
    "This role can review checklist data but cannot edit it."
    : submittedFromServer
      ? "Already submitted from server data."
      : submittedFromLocal
        ? "Already submitted and saved on this device."
        : "";
  const canReviewChecklist = roleAccess.canReviewChecklist;
  const canShowReviewActions = canReviewChecklist && submittedFromServer;
  const displayPhotoRequirements = useMemo(() => {
    if (!isCommentedForEdit || !photoRequirements.length) {
      return photoRequirements;
    }

    return [RECTIFICATION_PHOTO_REQUIREMENT];
  }, [isCommentedForEdit, photoRequirements]);
  const activePhotoRequirements = displayPhotoRequirements;
  const reviewActionNotice = canReviewChecklist
    ? submittedFromServer
      ? roleAccess.reviewNotice
      : "Approval actions will be available after this checklist is synced from the server."
    : "";
  const [reviewRemark, setReviewRemark] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  useEffect(() => {
    setReviewRemark("");
    setReviewError("");
  }, [activeSubOption?.id]);

  useEffect(() => {
    const subOptionId = activeSubOption?.id;
    const shouldHydrateFromServer = SERVER_PREFILL_STATUS_KEYS.has(
      activeServerStatusKey
    );

    if (!subOptionId || (!isReadOnly && !shouldHydrateFromServer)) {
      return;
    }

    const hydrationSource = submittedFromLocal
      ? `local:${localSubmissionSnapshot?.id || ""}:${localSubmissionSnapshot?.updatedAt || ""}`
      : buildProgressHydrationSignature(progressMatch);

    if (hydratedSubOptionsRef.current[subOptionId] === hydrationSource) {
      return;
    }

    const baseValues =
      formValues[subOptionId] ||
      getInitialFormValues(
        { subOptions: [activeSubOption] },
        checklistSectionUnit
      )[subOptionId];
    const nextValues = {
      ...baseValues,
      checks: { ...baseValues.checks },
      photos: { ...baseValues.photos },
      repeatableGroups: { ...baseValues.repeatableGroups },
    };

    if (shouldHydrateFromServer && progressMatch?.subprocess) {
      const subprocess = progressMatch.subprocess;

      if (showStatusField) {
        nextValues.status = toFormStatusValue(subprocess.status.label);
      }

      const checklistsById = new Map(
        (subprocess.checklists || []).map((item) => [String(item.id), item])
      );
      const checklistsByName = new Map(
        (subprocess.checklists || []).map((item) => [normalizeText(item.name), item])
      );

      checklistItems.forEach((item) => {
        const checklist = getProgressChecklistMatch(
          checklistsById,
          checklistsByName,
          item
        );
        nextValues.checks[item.id] = checklist
          ? checklist.status.key !== "pending"
          : nextValues.checks[item.id];
      });

      selectFields.forEach((field) => {
        const checklist = getProgressChecklistMatch(
          checklistsById,
          checklistsByName,
          field
        );
        const detailValue =
          checklist?.detail?.rawValue ??
          checklist?.detail?.value ??
          checklist?.rawChecklist?.value;

        if (detailValue !== null && typeof detailValue !== "undefined") {
          nextValues[field.key] = String(detailValue);
        }
      });

      inputFields.forEach((field) => {
        const checklist = getProgressChecklistMatch(
          checklistsById,
          checklistsByName,
          field
        );
        const detailValue =
          checklist?.detail?.rawValue ??
          checklist?.detail?.value ??
          checklist?.rawChecklist?.value;

        if (detailValue !== null && typeof detailValue !== "undefined") {
          nextValues[field.key] = String(detailValue);
        }
      });

      if (showRemarkField && activeSubOption.remarkChecklist?.checklistId) {
        const remarkChecklist = getProgressChecklistMatch(
          checklistsById,
          checklistsByName,
          activeSubOption.remarkChecklist,
          activeSubOption.remarkLabel || "Remark"
        );
        const detailValue =
          remarkChecklist?.detail?.rawValue ??
          remarkChecklist?.detail?.value ??
          remarkChecklist?.rawChecklist?.value;

        if (detailValue !== null && typeof detailValue !== "undefined") {
          nextValues.remark = String(detailValue);
        }
      }

      if (activeSubOption.locationChecklist?.checklistId) {
        const locationChecklist = getProgressChecklistMatch(
          checklistsById,
          checklistsByName,
          activeSubOption.locationChecklist
        );
        const coordinates = parseCoordinateValue(
          locationChecklist?.detail?.rawValue ??
          locationChecklist?.detail?.value ??
          locationChecklist?.rawChecklist?.value
        );

        if (coordinates) {
          nextValues.updatedLocation = coordinates;
          nextValues.updatedAddress = formatCoordinates(coordinates);
          nextValues.pendingUpdatedLocation = null;
          nextValues.pendingUpdatedAddress = "";
          nextValues.pendingUpdatedAt = null;
        }
      }

      repeatableGroups.forEach((group) => {
        if (isCommentedForEdit && group.fixedItemCount) {
          nextValues.repeatableGroups[group.key] = buildFixedRepeatableGroupState(group);
          return;
        }

        const checklist = getProgressChecklistMatch(
          checklistsById,
          checklistsByName,
          group,
          group.title
        );
        const items = parseRepeatableGroupItems(
          group,
          checklist?.detail?.rawValue ??
          checklist?.detail?.value ??
          checklist?.rawChecklist?.value
        );

        if (items.length) {
          nextValues.repeatableGroups[group.key] = items;
        }
      });

      photoRequirements.forEach((requirement) => {
        const checklist = getProgressChecklistMatch(
          checklistsById,
          checklistsByName,
          requirement
        );
        const remoteValue =
          checklist?.detail?.rawValue ??
          checklist?.detail?.value ??
          checklist?.rawChecklist?.value;
        const metadata = checklist?.rawChecklist?.metadata || {};
        const remoteUri = getServerPhotoUri(
          remoteValue,
          checklist?.rawChecklist?.objectKey || ""
        );

        if (!remoteUri) {
          return;
        }

        const mimeType = metadata.mimeType || metadata.mime_type || "";
        const sizeBytes = Number(metadata.sizeBytes || metadata.size_bytes);

        nextValues.photos[requirement.id] = {
          uri: remoteUri,
          filePath: "",
          name:
            metadata.originalName ||
            metadata.original_name ||
            checklist?.name ||
            requirement.label,
          source: "server",
          sizeKb: Number.isFinite(sizeBytes)
            ? Math.max(1, Math.round(sizeBytes / 1024))
            : null,
          width: metadata.width ?? null,
          height: metadata.height ?? null,
          mediaType: String(mimeType).startsWith("video/") ? "video" : "image",
          type: mimeType || null,
          takenAt:
            checklist?.rawChecklist?.updatedAt ||
            checklist?.rawChecklist?.submittedAt ||
            "Synced from server",
          latitude: metadata.latitude ?? null,
          longitude: metadata.longitude ?? null,
          objectKey: checklist?.rawChecklist?.objectKey || "",
        };
      });
    }

    if (submittedFromLocal && localSubmissionSnapshot?.payload) {
      const payload = localSubmissionSnapshot.payload;
      const answersById = new Map(
        (payload.answers || [])
          .filter((item) => item?.checklist_id)
          .map((item) => [String(item.checklist_id), item])
      );

      if (showStatusField && payload.status) {
        nextValues.status = payload.status;
      }

      checklistItems.forEach((item) => {
        const answer = answersById.get(String(item.checklistId || item.id));
        if (answer) {
          nextValues.checks[item.id] = Boolean(answer.value);
        }
      });

      selectFields.forEach((field) => {
        const answer = answersById.get(String(field.checklistId || field.key));
        if (answer) {
          nextValues[field.key] = String(answer.display_value || answer.value || "");
        }
      });

      inputFields.forEach((field) => {
        const answer = answersById.get(String(field.checklistId || field.key));
        if (answer) {
          nextValues[field.key] = String(answer.value || "");
        }
      });

      if (showRemarkField) {
        nextValues.remark = String(payload.remark || "");
      }

      if (activeSubOption.locationChecklist?.checklistId) {
        const answer = answersById.get(
          String(activeSubOption.locationChecklist.checklistId)
        );
        const coordinates = parseCoordinateValue(answer?.value);

        if (coordinates) {
          nextValues.updatedLocation = coordinates;
          nextValues.updatedAddress =
            answer?.value?.updated_address ||
            answer?.value?.updatedAddress ||
            formatCoordinates(coordinates);
          nextValues.pendingUpdatedLocation = null;
          nextValues.pendingUpdatedAddress = "";
          nextValues.pendingUpdatedAt = null;
        }
      }

      repeatableGroups.forEach((group) => {
        const answer = answersById.get(String(group.checklistId || group.key));
        const items = parseRepeatableGroupItems(group, answer?.value);

        if (items.length) {
          nextValues.repeatableGroups[group.key] = items;
        }
      });

      (payload.photos || []).forEach((photo) => {
        const requirement = photoRequirements.find(
          (item) => String(item.checklistId) === String(photo.checklistId)
        );

        if (requirement) {
          nextValues.photos[requirement.id] = {
            uri: photo.filePath ? `file://${photo.filePath}` : "",
            filePath: photo.filePath,
            name: photo.name,
            source: "local",
            sizeKb: photo.sizeKb,
            width: photo.width,
            height: photo.height,
            mediaType: photo.mediaType,
            type: photo.type,
            takenAt: photo.takenAt,
            latitude: photo.latitude,
            longitude: photo.longitude,
          };
        }
      });
    }

    hydratedSubOptionsRef.current[subOptionId] = hydrationSource;
    updateValuesForSubOption(subOptionId, nextValues);
  }, [
    activeServerStatusKey,
    activeSubOption,
    checklistItems,
    formValues,
    inputFields,
    isCommentedForEdit,
    localSubmissionSnapshot,
    photoRequirements,
    progressMatch,
    repeatableGroups,
    selectFields,
    showRemarkField,
    showStatusField,
    submittedFromLocal,
    submittedFromServer,
    unit,
    isReadOnly,
  ]);

  const getChecklistProgress = () => {
    const total = checklistItems.length;

    if (!total) {
      return { completed: 0, total: 0 };
    }

    const completed = checklistItems.filter(
      (item) => activeValues?.checks?.[item.id]
    ).length;

    return { completed, total };
  };

  const getSelectFieldSubmissionDetails = (field) => {
    const selectedValue = activeValues[field.key] || "";

    if (!selectedValue || !isContractorSelectField(field)) {
      return {
        value: selectedValue,
        metadata: {},
      };
    }

    const contractor = contractorLookup.get(selectedValue);

    if (!contractor) {
      return {
        value: selectedValue,
        metadata: {},
      };
    }

    return {
      value: contractor.firmName,
      metadata: {
        display_value: selectedValue,
        contractor_id: contractor.id,
        contractor_firm_name: contractor.firmName,
        contractor_owner_name: contractor.ownerName,
        contractor_mobile_number: contractor.mobileNumber,
        contractor_email: contractor.email,
      },
    };
  };

  const updateValuesForSubOption = (subOptionId, updates) => {
    setFormValues((prev) => ({
      ...prev,
      [subOptionId]: {
        ...(prev[subOptionId] || {}),
        ...updates,
      },
    }));
  };

  const updateActiveValues = (updates) => {
    updateValuesForSubOption(activeSubOption.id, updates);
  };

  const updateInputValue = (field, value) => {
    if (isReadOnly) return;
    updateActiveValues({ [field]: value });
    clearFieldError(field);
  };

  const updateRemarkValue = (value) => {
    if (isReadOnly) return;
    updateActiveValues({ remark: value });
    clearFieldError("remark");
    clearFieldError("form");
  };

  const updateReviewRemark = (value) => {
    setReviewRemark(value);

    if (reviewError) {
      setReviewError("");
    }
  };

  const clearRepeatableGroupFieldError = (groupKey, itemIndex, fieldKey) => {
    setFieldErrors((prev) => {
      const activeSubOptionErrors = prev[activeSubOption.id] || {};
      const repeatableErrors = activeSubOptionErrors.repeatableGroups || {};
      const groupErrors = repeatableErrors[groupKey];

      if (!groupErrors?.items?.[itemIndex]?.[fieldKey]) {
        return prev;
      }

      const nextFieldErrors = {
        ...activeSubOptionErrors,
        repeatableGroups: {
          ...repeatableErrors,
          [groupKey]: {
            ...groupErrors,
            items: {
              ...groupErrors.items,
              [itemIndex]: {
                ...groupErrors.items[itemIndex],
                [fieldKey]: null,
              },
            },
          },
        },
      };

      return {
        ...prev,
        [activeSubOption.id]: nextFieldErrors,
      };
    });
  };

  const clearRepeatableGroupError = (groupKey) => {
    setFieldErrors((prev) => {
      const activeSubOptionErrors = prev[activeSubOption.id] || {};
      const repeatableErrors = activeSubOptionErrors.repeatableGroups || {};
      const groupErrors = repeatableErrors[groupKey];

      if (!groupErrors) {
        return prev;
      }

      return {
        ...prev,
        [activeSubOption.id]: {
          ...activeSubOptionErrors,
          repeatableGroups: {
            ...repeatableErrors,
            [groupKey]: {
              ...groupErrors,
              message: null,
            },
          },
        },
      };
    });
  };

  const updateRepeatableGroupItem = (groupKey, itemIndex, fieldKey, value) => {
    if (isReadOnly) return;
    const currentItems = activeValues.repeatableGroups?.[groupKey] || [];
    const nextItems = currentItems.map((item, index) =>
      index === itemIndex ? { ...item, [fieldKey]: value } : item
    );

    updateActiveValues({
      repeatableGroups: {
        ...activeValues.repeatableGroups,
        [groupKey]: nextItems,
      },
    });

    clearRepeatableGroupFieldError(groupKey, itemIndex, fieldKey);
  };

  const addRepeatableGroupItem = (group) => {
    if (isReadOnly) return;
    const currentItems = activeValues.repeatableGroups?.[group.key] || [];
    if (group.maxItems && currentItems.length >= group.maxItems) return;

    updateActiveValues({
      repeatableGroups: {
        ...activeValues.repeatableGroups,
        [group.key]: [
          ...currentItems,
          createRepeatableGroupItem(group, currentItems.length),
        ],
      },
    });

    clearRepeatableGroupError(group.key);
  };

  const removeRepeatableGroupItem = (group, itemIndex) => {
    if (isReadOnly) return;
    const currentItems = activeValues.repeatableGroups?.[group.key] || [];
    const nextItems = currentItems.filter((_, index) => index !== itemIndex);

    updateActiveValues({
      repeatableGroups: {
        ...activeValues.repeatableGroups,
        [group.key]: nextItems,
      },
    });

    clearRepeatableGroupError(group.key);
  };

  const clearFieldError = (field) => {
    setFieldErrors((prev) => ({
      ...prev,
      [activeSubOption.id]: {
        ...(prev[activeSubOption.id] || {}),
        [field]: null,
      },
    }));
  };

  const openSelectModal = ({ field, title, options, target = null }) => {
    setPickerState({
      visible: true,
      field,
      title,
      options,
      target,
    });
  };

  const getPickerSelectedValue = () => {
    if (pickerState.target?.type === "repeatable") {
      const items =
        activeValues.repeatableGroups?.[pickerState.target.groupKey] || [];
      return items[pickerState.target.itemIndex]?.[pickerState.target.fieldKey] || "";
    }

    return activeValues[pickerState.field] || "";
  };

  const selectPickerValue = (value) => {
    if (isReadOnly) {
      setPickerState((prev) => ({ ...prev, visible: false }));
      return;
    }
    if (pickerState.target?.type === "repeatable") {
      updateRepeatableGroupItem(
        pickerState.target.groupKey,
        pickerState.target.itemIndex,
        pickerState.target.fieldKey,
        value
      );
    } else {
      updateActiveValues({ [pickerState.field]: value });
      clearFieldError(pickerState.field);
    }

    setPickerState((prev) => ({ ...prev, visible: false }));
  };

  const closePicker = () => {
    setPickerState((prev) => ({ ...prev, visible: false }));
  };

  const toggleChecklistItem = (itemId) => {
    if (isReadOnly) return;
    updateActiveValues({
      checks: {
        ...(activeValues.checks || {}),
        [itemId]: !activeValues.checks?.[itemId],
      },
    });

    clearFieldError("remark");
    clearFieldError("form");
  };

  const openMapForLocation = async (location) => {
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      showAppAlert({
        type: "warning",
        title: "Location unavailable",
        message: "Coordinates are not available for this address yet.",
      });
      return;
    }

    await openLocation(latitude, longitude);
  };

  const requestLocationPermission = async ({ silent = false } = {}) => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      if (!silent) {
        showAppAlert({
          type: "warning",
          title: "Permission required",
          message: "Location permission is needed to update current location.",
        });
      }
      return false;
    }

    return true;
  };

  const getReadableAddress = async (latitude, longitude, timeoutMs = 2500) => {
    try {
      const places = await Promise.race([
        Location.reverseGeocodeAsync({ latitude, longitude }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("geocode-timeout")), timeoutMs)
        ),
      ]);

      const candidate = places?.[0];
      if (!candidate) return "";

      return formatGeocodeAddress(candidate);
    } catch (error) {
      return "";
    }
  };

  const updateNodeLocation = async () => {
    if (isReadOnly) return;
    if (isUpdatingLocation) return;

    setIsUpdatingLocation(true);
    console.log("[ChecklistLocation]", "Update current location pressed", {
      subOptionId: activeSubOption.id,
      defaultLocation: activeValues.defaultLocation,
    });

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      const nextLocation = {
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
      };

      const currentSubOptionId = activeSubOption.id;
      const capturedAt = new Date().toLocaleString();

      console.log("[ChecklistLocation]", "Current location captured", {
        subOptionId: currentSubOptionId,
        updatedLocation: nextLocation,
      });
      updateValuesForSubOption(currentSubOptionId, {
        pendingUpdatedLocation: nextLocation,
        pendingUpdatedAt: capturedAt,
        pendingUpdatedAddress: "Resolving address...",
      });

      void getReadableAddress(
        nextLocation.latitude,
        nextLocation.longitude
      ).then((address) => {
        console.log("[ChecklistLocation]", "Updated address resolved", {
          subOptionId: currentSubOptionId,
          hasAddress: !!address,
        });
        updateValuesForSubOption(currentSubOptionId, {
          pendingUpdatedAddress:
            address || "Address unavailable (offline/network issue)",
        });
      });
    } catch (error) {
      console.log("[ChecklistLocation]", "Current location failed", {
        message: error?.message,
      });
      showAppAlert({
        type: "danger",
        title: "Location unavailable",
        message: "Unable to fetch current location. Please check location settings.",
      });
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const requestPhotoPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      showAppAlert({
        type: "warning",
        title: "Permission required",
        message: "Camera permission is required.",
      });
      return false;
    }

    return true;
  };

  const confirmUpdatedLocation = () => {
    if (isReadOnly) return;
    if (!activeValues.pendingUpdatedLocation) return;

    updateActiveValues({
      updatedLocation: activeValues.pendingUpdatedLocation,
      updatedAddress:
        activeValues.pendingUpdatedAddress ||
        formatCoordinates(activeValues.pendingUpdatedLocation),
      updatedAt: activeValues.pendingUpdatedAt || new Date().toLocaleString(),
      pendingUpdatedLocation: null,
      pendingUpdatedAddress: "",
      pendingUpdatedAt: null,
    });
    clearFieldError("form");
  };

  const discardPendingUpdatedLocation = () => {
    if (isReadOnly) return;

    updateActiveValues({
      pendingUpdatedLocation: null,
      pendingUpdatedAddress: "",
      pendingUpdatedAt: null,
    });
  };

  const getPhotoCaptureLocation = async () => {
    const fallbackLocation =
      activeValues.updatedLocation ||
      activeValues.defaultLocation ||
      {
        latitude: unit?.latitude ?? DEFAULT_NODE_LOCATION.latitude,
        longitude: unit?.longitude ?? DEFAULT_NODE_LOCATION.longitude,
      };

    try {
      const hasPermission = await requestLocationPermission({ silent: true });

      if (!hasPermission) {
        return fallbackLocation;
      }

      const lastKnownPosition = await Location.getLastKnownPositionAsync({
        maxAge: 1000 * 60 * 5,
      });

      if (lastKnownPosition?.coords) {
        return {
          latitude: Number(lastKnownPosition.coords.latitude.toFixed(6)),
          longitude: Number(lastKnownPosition.coords.longitude.toFixed(6)),
        };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      return {
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
      };
    } catch (error) {
      return fallbackLocation;
    }
  };

  const setSelectedPhoto = async (
    asset,
    source,
    requirement,
    captureLocation = null
  ) => {
    if (!asset?.uri) return;

    let selectedAsset;
    let resolvedCaptureLocation = null;
    const capturedAt = new Date().toLocaleString();

    try {
      resolvedCaptureLocation = await Promise.resolve(captureLocation);
      selectedAsset = await compressChecklistImage(asset, {
        takenAt: capturedAt,
        captureLocation: resolvedCaptureLocation,
      });
    } catch (error) {
      showAppAlert({
        type: "danger",
        title: "Photo processing failed",
        message: "Unable to prepare this photo with watermark. Please capture it again.",
      });
      return;
    }

    const fileName =
      selectedAsset.fileName ||
      selectedAsset.name ||
      `${activeSubOption.id}_${Date.now()}.jpg`;
    const sizeKb = selectedAsset.fileSize
      ? Math.max(1, Math.round(selectedAsset.fileSize / 1024))
      : selectedAsset.sizeKb || null;
    const mediaType = selectedAsset.type === "video" ? "video" : "image";
    const latitude = Number(resolvedCaptureLocation?.latitude);
    const longitude = Number(resolvedCaptureLocation?.longitude);

    updateActiveValues({
      photos: {
        ...activeValues.photos,
        [requirement.id]: {
          uri: selectedAsset.uri,
          filePath: selectedAsset.filePath,
          name: fileName,
          source,
          sizeKb,
          width: selectedAsset.width,
          height: selectedAsset.height,
          mediaType,
          type:
            selectedAsset.mimeType ||
            selectedAsset.type ||
            (mediaType === "video" ? "video/mp4" : "image/jpeg"),
          takenAt: capturedAt,
          latitude: Number.isFinite(latitude) ? latitude : null,
          longitude: Number.isFinite(longitude) ? longitude : null,
        },
      },
    });

    setFieldErrors((prev) => {
      const next = {
        ...prev,
        [activeSubOption.id]: {
          ...(prev[activeSubOption.id] || {}),
          photos: null,
        },
      };

      if (next[activeSubOption.id]?.photoSlots) {
        next[activeSubOption.id].photoSlots = {
          ...next[activeSubOption.id].photoSlots,
          [requirement.id]: null,
        };
      }

      return next;
    });
  };

  const pickFromCamera = async (requirement) => {
    if (isReadOnly) return;
    const hasPermission = await requestPhotoPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: requirement.allowVideo
        ? ImagePicker.MediaTypeOptions.All
        : ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: false,
    });

    if (!result.canceled) {
      setPhotoProcessingState({
        requirementId: requirement.id,
        message: "Preparing image and location...",
      });

      try {
        const captureLocationPromise = getPhotoCaptureLocation();
        await setSelectedPhoto(
          result.assets?.[0],
          "camera",
          requirement,
          captureLocationPromise
        );
      } finally {
        setPhotoProcessingState({
          requirementId: "",
          message: "",
        });
      }
    }
  };

  const removeSelectedPhoto = (requirementId) => {
    if (isReadOnly) return;
    updateActiveValues({
      photos: {
        ...activeValues.photos,
        [requirementId]: null,
      },
    });
  };

  const openPhotoPreview = (requirementId) => {
    const media = activeValues.photos?.[requirementId];
    if (!media?.uri) return;

    setPhotoPreviewState({
      visible: true,
      media,
    });
  };

  const closePhotoPreview = () => {
    setPhotoPreviewState({ visible: false, media: null });
  };

  const validateForm = () => {
    const nextErrors = {};
    let firstErrorMessage = "";

    const setFirstErrorMessage = (message) => {
      if (!firstErrorMessage && message) {
        firstErrorMessage = message;
      }
    };

    if (showStatusField && !activeValues.status) {
      nextErrors.status = "Please select status";
      setFirstErrorMessage("Please select status");
    }

    selectFields.forEach((field) => {
      if (
        isRequiredByRule(field, activeValues, activeSubOption) &&
        !activeValues[field.key]
      ) {
        const message = getFieldValidationMessage({
          field,
          type: "select",
        });
        nextErrors[field.key] = message;
        setFirstErrorMessage(message);
      }
    });

    inputFields.forEach((field) => {
      const value = activeValues[field.key];
      if (
        isRequiredByRule(field, activeValues, activeSubOption) &&
        !`${value ?? ""}`.trim()
      ) {
        const message = getFieldValidationMessage({
          field,
          type: "input",
        });
        nextErrors[field.key] = message;
        setFirstErrorMessage(message);
      }
    });

    if (showRemarkField && isRemarkRequired && !activeValues.remark.trim()) {
      nextErrors.remark = "Remark is required";
      setFirstErrorMessage("Remark is required");
    }

    if (
      activeSubOption.locationChecklist?.required &&
      activeSubOption.canUpdateLocation &&
      !activeValues.updatedLocation
    ) {
      nextErrors.form = "Please update current location";
      setFirstErrorMessage("Please update current location");
    }

    const missingChecklistItems = checklistItems.filter(
      (item) =>
        isRequiredByRule(item, activeValues, activeSubOption) &&
        !activeValues.checks?.[item.id]
    );

    if (missingChecklistItems.length) {
      nextErrors.form =
        nextErrors.form ||
        `Please complete ${missingChecklistItems.length} required checklist item(s)`;
      setFirstErrorMessage(
        `Please complete ${missingChecklistItems.length} required checklist item(s)`
      );
    }

    if (repeatableGroups.length) {
      const repeatableErrors = {};

      repeatableGroups.forEach((group) => {
        const items = activeValues.repeatableGroups?.[group.key] || [];
        const groupError = {};

        if (group.fixedItemCount && items.length !== group.fixedItemCount) {
          groupError.message = `${group.fixedItemCount} ${group.itemLabel || "item"} entries are required`;
        } else if ((group.minItems || 0) > items.length) {
          groupError.message = `Add at least ${group.minItems} ${group.itemLabel || "item"} entry`;
        } else if (group.maxItems && items.length > group.maxItems) {
          groupError.message = `Only ${group.maxItems} ${group.itemLabel || "item"} entries are allowed`;
        }

        setFirstErrorMessage(groupError.message);

        const itemErrors = {};

        items.forEach((item, itemIndex) => {
          const currentItemErrors = {};

          (group.itemFields || []).forEach((field) => {
            const isRequired = field.required !== false;
            if (isRequired && !`${item[field.key] ?? ""}`.trim()) {
              const message = getFieldValidationMessage({
                field,
                type: field.type === "select" ? "select" : "input",
              });
              currentItemErrors[field.key] = message;
              setFirstErrorMessage(message);
            }
          });

          if (Object.keys(currentItemErrors).length) {
            itemErrors[itemIndex] = currentItemErrors;
          }
        });

        if (Object.keys(itemErrors).length) {
          groupError.items = itemErrors;
        }

        if (Object.keys(groupError).length) {
          repeatableErrors[group.key] = groupError;
        }
      });

      if (Object.keys(repeatableErrors).length) {
        nextErrors.repeatableGroups = repeatableErrors;
      }
    }

    if (activePhotoRequirements.length) {
      const missingRequirements = activePhotoRequirements.filter(
        (requirement) =>
          isRequiredByRule(requirement, activeValues, activeSubOption) &&
          !activeValues.photos?.[requirement.id]?.uri
      );

      if (missingRequirements.length) {
        nextErrors.photos = `Please upload ${missingRequirements.length} required file(s)`;
        setFirstErrorMessage(
          `Please upload ${missingRequirements.length} required file(s)`
        );
        nextErrors.photoSlots = missingRequirements.reduce((acc, requirement) => {
          acc[requirement.id] = "Required";
          return acc;
        }, {});
      }
    }

    if (activeSubOption.customValidate) {
      Object.assign(
        nextErrors,
        activeSubOption.customValidate({
          values: activeValues,
          subOption: activeSubOption,
        }) || {}
      );
    }

    setFieldErrors((prev) => ({
      ...prev,
      [activeSubOption.id]: nextErrors,
    }));

    return {
      isValid: Object.keys(nextErrors).length === 0,
      firstErrorMessage,
    };
  };

  const buildAnswer = (source = {}, value, extra = {}) => {
    const valueType = inferChecklistValueType(source, value, extra);

    return {
      checklist_id: source.checklistId || null,
      description: source.label || source.description || "",
      input_type: source.inputType || extra.input_type || "text",
      data_type: source.dataType || extra.data_type || "varchar",
      input_unit: source.inputUnit ?? null,
      seq_no: source.seqNo ?? null,
      is_required: source.required !== false,
      value,
      value_type: valueType,
      valueType,
      ...extra,
    };
  };

  const buildChecklistAnswers = () => {
    const answers = [];

    if (showStatusField) {
      answers.push(
        buildAnswer(
          {
            label: activeSubOption.statusLabel || "Status",
            inputType: "dropdown",
            dataType: "varchar",
          },
          activeValues.status || ""
        )
      );
    }

    if (activeSubOption.locationChecklist) {
      answers.push(
        buildAnswer(activeSubOption.locationChecklist, {
          default_location: activeValues.defaultLocation,
          default_address: activeValues.defaultAddress,
          updated_location: activeValues.updatedLocation,
          updated_address: activeValues.updatedAddress,
          updated_at: activeValues.updatedAt,
        })
      );
    }

    checklistItems.forEach((item) => {
      const checked = !!activeValues.checks?.[item.id];
      answers.push(
        buildAnswer(item, checked, {
          display_value: checked ? "Yes" : "No",
        })
      );
    });

    selectFields.forEach((field) => {
      const { value, metadata } = getSelectFieldSubmissionDetails(field);
      answers.push(buildAnswer(field, value, metadata));
    });

    inputFields.forEach((field) => {
      answers.push(buildAnswer(field, activeValues[field.key] || ""));
    });

    if (showRemarkField) {
      answers.push(
        buildAnswer(
          activeSubOption.remarkChecklist || {
            label: activeSubOption.remarkLabel || "Remark",
            inputType: "textarea",
            dataType: "varchar",
            required: isRemarkRequired,
          },
          activeValues.remark || ""
        )
      );
    }

    repeatableGroups.forEach((group) => {
      answers.push(
        buildAnswer(
          {
            checklistId: group.checklistId || null,
            label: group.title,
            inputType: group.inputType || "repeatable",
            dataType: group.dataType || "json",
            inputUnit: group.inputUnit ?? null,
            seqNo: group.seqNo ?? null,
            required: group.required !== false,
          },
          (activeValues.repeatableGroups?.[group.key] || []).map((item) =>
            (group.itemFields || []).reduce((acc, field) => {
              acc[field.key] = item[field.key];
              return acc;
            }, {})
          ),
          {
            key: group.key,
            valueType: "array",
          }
        )
      );
    });

    activePhotoRequirements.forEach((requirement) => {
      const media = activeValues.photos?.[requirement.id] || null;
      if (requirement.synthetic) {
        return;
      }
      answers.push(
        buildAnswer(requirement, media?.filePath || media?.uri || "", {
          valueType: "file",
          file: media
            ? {
              file_name: media.name,
              file_path: media.filePath || media.uri,
              local_uri: media.uri,
              source: media.source,
              mime_type: media.type,
              size_kb: media.sizeKb,
              width: media.width,
              height: media.height,
              media_type: media.mediaType,
              taken_at: media.takenAt,
              latitude: media.latitude,
              longitude: media.longitude,
            }
            : null,
        })
      );
    });

    return answers.sort((a, b) => (a.seq_no || 0) - (b.seq_no || 0));
  };

  const buildSubmissionPayload = () => {
    const submittedAt = new Date().toISOString();
    const photos = activePhotoRequirements
      .map((requirement) => ({
        checklistId: requirement.checklistId || null,
        requirementId: requirement.id,
        requirementLabel: requirement.label,
        inputType: requirement.inputType || "photo",
        dataType: requirement.dataType || "image",
        inputUnit: requirement.inputUnit ?? null,
        seqNo: requirement.seqNo ?? null,
        isRequired: requirement.required !== false,
        ...activeValues.photos?.[requirement.id],
      }))
      .filter((item) => item.uri);

    return {
      draft_version: 2,
      submit_type: "oms_checklist_submission",
      module,
      deviceType: module,
      device_type: module,
      project_name: projectName,
      unit: {
        unit_id: unit?.id || null,
        unit_no: unitLabel,
        project_id: projectId || unit?.projectId || null,
        village: unit?.village || "",
        distributor: unit?.distributor || "",
        zone: unit?.zone || "",
      },
      projectId: projectId || unit?.projectId || null,
      unitId: unit?.id || null,
      unitNo: unitLabel,
      sectionKey: section.key,
      subOptionId: activeSubOption.id,
      process_id: submissionProcessId,
      process_description: section.apiDescription || section.title || "",
      process_seq_no: section.apiSeqNo ?? null,
      subprocess_id: submissionSubprocessId,
      subprocess_description:
        activeSubOption.apiDescription || activeSubOption.label || "",
      subprocess_seq_no: activeSubOption.apiSeqNo ?? null,
      status: showStatusField ? activeValues.status : "",
      remark: showRemarkField ? activeValues.remark : "",
      answers: buildChecklistAnswers(),
      checklist: checklistItems.map((item) => ({
        id: item.id,
        checklist_id: item.checklistId || null,
        label: item.label,
        response: activeValues.checks?.[item.id] ? 1 : 0,
        checked: activeValues.checks?.[item.id] ? 1 : 0,
      })),
      selectValues: selectFields.map((field) => {
        const { value, metadata } = getSelectFieldSubmissionDetails(field);

        return {
          key: field.key,
          checklist_id: field.checklistId || null,
          label: field.label,
          value,
          ...metadata,
        };
      }),
      inputValues: inputFields.map((field) => ({
        key: field.key,
        checklist_id: field.checklistId || null,
        label: field.label,
        value: activeValues[field.key],
      })),
      repeatableValues: repeatableGroups.map((group) => ({
        key: group.key,
        checklist_id: group.checklistId || null,
        title: group.title,
        items: (activeValues.repeatableGroups?.[group.key] || []).map(
          (item, index) => ({
            itemIndex: index + 1,
            values: (group.itemFields || []).map((field) => ({
              key: field.key,
              label: field.label,
              value: item[field.key],
            })),
          })
        ),
      })),
      photos,
      defaultLocation: activeValues.defaultLocation,
      updatedLocation: activeValues.updatedLocation,
      updatedAt: activeValues.updatedAt,
      submittedAt,
    };
  };

  const submitActiveSubOption = async () => {
    if (isReadOnly) {
      showAppAlert({
        type: "info",
        title: readOnlyTitle,
        message: readOnlyNotice || "This subprocess is not editable.",
      });
      return;
    }

    if (isSubmitting) return;

    const { isValid, firstErrorMessage } = validateForm();

    if (!isValid) {
      showAppAlert({
        type: "warning",
        title: "Incomplete checklist",
        message:
          toSentenceCase(firstErrorMessage) ||
          "Please fix the highlighted fields before submitting.",
      });
      return;
    }

    if (!submissionProcessId || !submissionSubprocessId) {
      console.log("[ChecklistForm]", "Submission blocked: missing API ids", {
        source: masterSource,
        sectionKey: section.key,
        subOptionId: activeSubOption.id,
        processId: activeSubOption.apiProcessId || section.apiProcessId || null,
        subprocessId: activeSubOption.apiSubprocessId || null,
      });
      showAppAlert({
        type: "warning",
        title: "Submission unavailable",
        message:
          masterSource === "static"
            ? "Checklist master IDs are not loaded yet on this device. Please sync checklist master data and try again."
            : "Process or subprocess mapping is missing for this checklist. Please refresh master data and try again.",
      });
      return;
    }

    const payload = buildSubmissionPayload();
    console.log("[ChecklistForm]", "Submit pressed", {
      unitNo: payload.unitNo,
      sectionKey: payload.sectionKey,
      subOptionId: payload.subOptionId,
      processId: payload.process_id,
      subprocessId: payload.subprocess_id,
      answerCount: payload.answers.length,
      checklistCount: payload.checklist.length,
      photoCount: payload.photos.length,
      selectCount: payload.selectValues.length,
      inputCount: payload.inputValues.length,
    });
    setIsSubmitting(true);

    try {
      if (isCommentedForEdit) {
        if (!workItem?.submissionId) {
          throw new Error(
            "Submission ID is missing for this commented subprocess."
          );
        }

        const response = await submitOmsCommentedResubmission({
          submissionId: workItem.submissionId,
          payload,
        });

        await refreshProgress();
        const activeIndex = section.subOptions.findIndex(
          (item) => item.id === activeSubOption.id
        );
        const hasNext = activeIndex < section.subOptions.length - 1;
        const submissionStatusLabel = formatSubmissionStatusLabel(
          response?.statusLabel
        );

        showAppAlert({
          type: "success",
          title: "Resubmitted successfully",
          message: `${activeSubOptionLabel} resubmitted successfully with ${submissionStatusLabel} status.`,
          actions: [
            {
              label: hasNext ? "Next" : "Done",
              variant: "primary",
              onPress: () => {
                if (hasNext) {
                  setActiveSubOptionId(section.subOptions[activeIndex + 1].id);
                } else {
                  navigation.goBack();
                }
              },
            },
          ],
        });

        return;
      }

      const result = await submitChecklistOfflineFirst({
        deviceType: module,
        section,
        subOption: activeSubOption,
        payload,
        ownerUserId,
        offlineOnly: false,
      });
      await loadLocalSnapshots();
      await refreshProgress();
      console.log("[ChecklistSubmit]", "Submit result", {
        submissionId: result.submission?.id,
        draftJsonPath: result.draftJsonPath,
        synced: result.synced,
        serverSubmissionId: result.response?.submissionId,
        processId: result.draftJson?.process_id,
        subprocessId: result.draftJson?.subprocess_id,
        answerCount: result.draftJson?.answers?.length || 0,
      });
      const activeIndex = section.subOptions.findIndex(
        (item) => item.id === activeSubOption.id
      );
      const hasNext = activeIndex < section.subOptions.length - 1;
      const wasSynced = Boolean(result.synced);
      const submissionStatusLabel = formatSubmissionStatusLabel(
        result.response?.statusLabel
      );

      showAppAlert({
        type: wasSynced ? "success" : "info",
        title: wasSynced ? "Submitted successfully" : "Saved locally",
        message: wasSynced
          ? `${activeSubOptionLabel} submitted successfully with ${submissionStatusLabel} status.`
          : isCommentedForEdit
            ? `${activeSubOptionLabel} rectification is saved locally for supervisor follow-up.`
            : `${activeSubOptionLabel} is saved on this device and will sync when internet is available.`,
        actions: [
          {
            label: hasNext ? "Next" : "Done",
            variant: "primary",
            onPress: () => {
              if (hasNext) {
                setActiveSubOptionId(section.subOptions[activeIndex + 1].id);
              } else {
                navigation.goBack();
              }
            },
          },
        ],
      });
    } catch (error) {
      console.log(
        isCommentedForEdit ? "[ChecklistResubmit]" : "[ChecklistDraft]",
        isCommentedForEdit ? "Resubmit failed" : "Local save failed",
        {
          message: error?.message,
          code: error?.code,
          status: error?.status,
        }
      );
      showAppAlert({
        type: "danger",
        title: isCommentedForEdit ? "Resubmit failed" : "Save failed",
        message:
          error?.message ||
          (isCommentedForEdit
            ? "Unable to resubmit this commented subprocess right now. Please try again."
            : "Unable to save checklist data on this device. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReviewAction = async (decision) => {
    if (!canReviewChecklist) {
      return;
    }

    if (!workItem?.submissionId) {
      showAppAlert({
        type: "info",
        title: "Workflow unavailable",
        message:
          "Open this item from Work Status to continue with verify, approve, or reject actions.",
      });
      return;
    }

    if (!submittedFromServer) {
      showAppAlert({
        type: "info",
        title: "Review unavailable",
        message:
          "Approval actions are available after the submitted checklist is loaded from the server.",
      });
      return;
    }

    if (decision === "reject" && !reviewRemark.trim()) {
      setReviewError("Remark is required to reject a checklist.");
      return;
    }

    setIsReviewSubmitting(true);

    try {
      await submitOmsReviewAction({
        action: decision,
        submissionId: workItem?.submissionId || "",
        remark: reviewRemark.trim(),
      });
    } catch (error) {
      showAppAlert({
        type: "info",
        title: decision === "approve" ? "Approval ready" : "Reject ready",
        message:
          error?.message ||
          "Review API is not configured yet. Wire the endpoint in omsReviewService.",
      });
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return {
    module,
    unit,
    projectName,
    section,
    unitLabel,
    activeSubOption,
    activeSubOptionLabel,
    activeSubOptionId,
    stepSubmissionStateById,
    isCommentedForEdit,
    activeValues,
    activeErrors,
    showStatusField,
    showRemarkField,
    isReadOnly,
    readOnlyTitle,
    readOnlyNotice,
    canReviewChecklist,
    canShowReviewActions,
    reviewActionNotice,
    reviewRemark,
    reviewError,
    isRemarkRequired,
    checklistItems,
    photoRequirements: activePhotoRequirements,
    selectFields,
    inputFields,
    repeatableGroups,
    pickerState,
    photoPreviewState,
    isUpdatingLocation,
    isSubmitting,
    isReviewSubmitting,
    isPhotoProcessing: Boolean(photoProcessingState.requirementId),
    photoProcessingRequirementId: photoProcessingState.requirementId,
    photoProcessingMessage: photoProcessingState.message,
    setActiveSubOptionId,
    openSelectModal,
    getPickerSelectedValue,
    selectPickerValue,
    closePicker,
    updateInputValue,
    updateRemarkValue,
    updateReviewRemark,
    updateRepeatableGroupItem,
    addRepeatableGroupItem,
    removeRepeatableGroupItem,
    toggleChecklistItem,
    getChecklistProgress,
    openMapForLocation,
    updateNodeLocation,
    confirmUpdatedLocation,
    discardPendingUpdatedLocation,
    pickFromCamera,
    removeSelectedPhoto,
    submitActiveSubOption,
    submitReviewAction,
    handleBack,
    getSubOptionLabel,
    openPhotoPreview,
    closePhotoPreview,
    statusOptions: STATUS_OPTIONS,
  };
};

export default useUnitStatusUpdateViewModel;
