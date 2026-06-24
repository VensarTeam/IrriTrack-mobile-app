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
import {
  buildChecklistImageDraftScopeKey,
  clearChecklistImageDraft,
  getChecklistImageDraft,
  saveChecklistImageDraft,
} from "../services/checklistImageDraftStore";
import { saveChecklistMediaToDeviceGallery } from "../services/deviceGallery";
import { submitOmsReviewAction } from "../services/omsReviewService";
import {
  getCachedContractorList,
  refreshContractorList,
} from "../services/contractorOfflineStore";
import { useAuth } from "../context/AuthContext";
import useUnitProgress from "../hooks/useUnitProgress";
import useChecklistSections from "./useChecklistSections";
import {
  findProgressChecklistMatch,
  hasMeaningfulServerValue,
  normalizeText,
  resolveServerPhotoUri,
} from "./unitStatusUpdate/helpers";
import {
  PED_ENCLOSURE_REQUIRED_CHECKLIST_IDS,
  PED_ENCLOSURE_SIZE_CHECKLIST_ID,
  PED_ENCLOSURE_SUBOPTION_ID,
  getSubmissionChecklistId,
  getSubmissionPhotoId,
  hasSubmissionPhoto,
  hasSubmissionValue,
  isServerSourcedMedia,
  resolvePedestalLinkedSizeEntries,
  resolvePedestalPhotoMedia,
  validatePedestalEnclosureSubmission,
} from "./unitStatusUpdate/pedestalEnclosure";

// Pure builders used to initialize each subprocess form independently.
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

const normalizePickerOptionValue = (option) => {
  if (typeof option === "string") {
    return option;
  }

  return String(option?.value ?? option?.label ?? "").trim();
};

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

const EMPTY_SUB_OPTION = Object.freeze({
  id: "apiChecklistLoading",
  label: "Loading checklist...",
  showStatusField: false,
  showRemarkField: false,
  checklistItems: [],
  photoRequirements: [],
  selectFields: [],
  inputFields: [],
  repeatableGroups: [],
  apiChecklists: [],
});

const EMPTY_SECTION = Object.freeze({
  key: "apiChecklistLoading",
  title: "Checklist",
  subOptions: [EMPTY_SUB_OPTION],
});

const formatCoordinates = (location = {}) =>
  `${location.latitude ?? "-"}, ${location.longitude ?? "-"}`;

const normalizeCoordinate = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Number(numericValue.toFixed(6));
};

const areLocationsEqual = (first = null, second = null) => {
  const firstLatitude = normalizeCoordinate(first?.latitude);
  const firstLongitude = normalizeCoordinate(first?.longitude);
  const secondLatitude = normalizeCoordinate(second?.latitude);
  const secondLongitude = normalizeCoordinate(second?.longitude);

  if (
    firstLatitude === null ||
    firstLongitude === null ||
    secondLatitude === null ||
    secondLongitude === null
  ) {
    return false;
  }

  return (
    firstLatitude === secondLatitude && firstLongitude === secondLongitude
  );
};

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

const getFieldDedupKey = (field = {}) =>
  normalizeText(
    field.description ||
    field.label ||
    field.title ||
    field.placeholder ||
    field.key
  );

const NUMBER_DATA_TYPES = new Set([
  "int",
  "integer",
  "float",
  "double",
  "decimal",
  "number",
]);

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

const markPhotosAsSavedToDeviceGallery = (values = {}, savedUris = []) => {
  if (!savedUris.length || !values?.photos) {
    return values;
  }

  const savedUriSet = new Set(
    savedUris.map((item) => String(item || "").trim()).filter(Boolean)
  );
  const nextPhotos = Object.entries(values.photos).reduce(
    (acc, [photoKey, photoValue]) => {
      if (!photoValue) {
        acc[photoKey] = photoValue;
        return acc;
      }

      const normalizedUri = String(
        photoValue.uri || photoValue.filePath || photoValue.local_uri || ""
      ).trim();

      acc[photoKey] = savedUriSet.has(normalizedUri)
        ? {
          ...photoValue,
          savedToDeviceGallery: true,
        }
        : photoValue;

      return acc;
    },
    {}
  );

  return {
    ...values,
    photos: nextPhotos,
  };
};

const toPositiveIntegerOrNull = (value) => {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue < 1) {
    return null;
  }

  return numericValue;
};

// Server-progress helpers normalize API data before it hydrates the editable form.
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

const getServerChecklistRawValue = (checklist = null) =>
  checklist?.detail?.rawValue ??
  checklist?.detail?.value ??
  checklist?.rawChecklist?.value;

const checklistHasServerFilledValue = (checklist = null) => {
  if (!checklist) {
    return false;
  }

  const rawValue = getServerChecklistRawValue(checklist);
  const objectKey = checklist?.rawChecklist?.objectKey;
  const metadata = checklist?.rawChecklist?.metadata;

  return (
    hasMeaningfulServerValue(rawValue) ||
    hasMeaningfulServerValue(objectKey) ||
    hasMeaningfulServerValue(metadata?.objectKey) ||
    hasMeaningfulServerValue(metadata?.originalName) ||
    hasMeaningfulServerValue(metadata?.original_name)
  );
};

const subprocessHasServerFilledData = (subprocess = null) =>
  Boolean(
    (subprocess?.checklists || []).some((checklist) =>
      checklistHasServerFilledValue(checklist)
    ) ||
      (subprocess?.detailItems || []).some((item) =>
        hasMeaningfulServerValue(item?.rawValue ?? item?.value)
      ) ||
      (subprocess?.rawSubprocess?.resubmitImages || []).length
  );

const toServerChecklistCheckedValue = (checklist = null, fallbackValue = false) => {
  if (!checklist) {
    return fallbackValue;
  }

  const rawValue = getServerChecklistRawValue(checklist);

  if (typeof rawValue === "boolean") {
    return rawValue;
  }

  if (typeof rawValue === "number") {
    return rawValue !== 0;
  }

  if (typeof rawValue === "string") {
    const normalizedValue = normalizeText(rawValue);

    if (
      normalizedValue === "yes" ||
      normalizedValue === "true" ||
      normalizedValue === "completed" ||
      normalizedValue === "done"
    ) {
      return true;
    }

    if (
      normalizedValue === "no" ||
      normalizedValue === "false" ||
      normalizedValue === "pending" ||
      normalizedValue === "not done"
    ) {
      return false;
    }
  }

  return checklistHasServerFilledValue(checklist) || fallbackValue;
};

const localPayloadHasFilledData = (payload = {}) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  if ((payload.photos || []).length) {
    return true;
  }

  if ((payload.checklist || []).some((item) => item?.checked || item?.response)) {
    return true;
  }

  if (
    (payload.selectValues || []).some((item) =>
      hasMeaningfulServerValue(item?.value)
    )
  ) {
    return true;
  }

  if (
    (payload.inputValues || []).some((item) =>
      hasMeaningfulServerValue(item?.value)
    )
  ) {
    return true;
  }

  if (
    (payload.repeatableValues || []).some(
      (group) => Array.isArray(group?.items) && group.items.length > 0
    )
  ) {
    return true;
  }

  if (hasMeaningfulServerValue(payload.remark)) {
    return true;
  }

  if (hasMeaningfulServerValue(payload.updatedLocation || payload.updated_location)) {
    return true;
  }

  return (payload.answers || []).some((answer) => {
    const normalizedDescription = normalizeText(answer?.description || "");

    if (normalizedDescription === "status" || normalizedDescription === "remark") {
      return false;
    }

    return hasMeaningfulServerValue(answer?.value);
  });
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

const PIPE_LAYING_CHECKLIST_IDS = Object.freeze({
  inletPipeSize: "2",
  inletPipeLaid: "3",
  inletConnected: "4",
  outletSubChakDesignQuantity: "7",
  outletPipeLaid: "8",
  outletConnected: "9",
});

const OUTLET_SUB_CHAK_MAX_COUNT = 8;

const getChecklistId = (field = {}) =>
  String(field.checklistId ?? field.checklist_id ?? "").trim();

const hasChecklistId = (field = {}, checklistId = "") =>
  getChecklistId(field) === String(checklistId);

const getNumberFromValue = (value) => {
  const parsedValue = Number.parseInt(`${value ?? ""}`.match(/\d+/)?.[0], 10);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const getOutletSubChakDesignCount = (value) => {
  const parsedValue = getNumberFromValue(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return Math.min(parsedValue, OUTLET_SUB_CHAK_MAX_COUNT);
};

const buildOutletPipeLaidMap = ({
  selections = {},
  selectedCount = null,
  designCount = null,
} = {}) => {
  const visibleCount =
    getOutletSubChakDesignCount(designCount) ||
    OUTLET_SUB_CHAK_MAX_COUNT;
  const fallbackCount = getNumberFromValue(selectedCount) || 0;

  return Array.from({ length: visibleCount }, (_, index) => index + 1).reduce(
    (acc, number) => {
      const key = `S${number}`;
      acc[key] =
        typeof selections[number] === "boolean"
          ? selections[number]
          : number <= fallbackCount;
      return acc;
    },
    {}
  );
};

const isPipeLaidSelectedValue = (value) => {
  const text = normalizeText(value);

  if (!text) {
    return false;
  }

  if (
    text.includes("not") ||
    text === "no" ||
    text === "false" ||
    text === "pending"
  ) {
    return false;
  }

  return (
    text === "yes" ||
    text === "true" ||
    text === "completed" ||
    text === "done" ||
    text === "laid" ||
    text.includes("laid")
  );
};

const getPipeLayingFieldState = ({
  activeSubOption = {},
  activeValues = {},
  selectFields = [],
  inputFields = [],
  checklistItems = [],
} = {}) => {
  const allValueFields = [...selectFields, ...inputFields];
  const isOutletPipeLaying = activeSubOption.id === "outletPipeLaying";
  const pipeLaidChecklistId = isOutletPipeLaying
    ? PIPE_LAYING_CHECKLIST_IDS.outletPipeLaid
    : PIPE_LAYING_CHECKLIST_IDS.inletPipeLaid;
  const connectedChecklistId = isOutletPipeLaying
    ? PIPE_LAYING_CHECKLIST_IDS.outletConnected
    : PIPE_LAYING_CHECKLIST_IDS.inletConnected;
  const pipeLaidFields = allValueFields.filter((field) =>
    hasChecklistId(field, pipeLaidChecklistId)
  );
  const pipeLaidChecklistItems = checklistItems.filter((item) =>
    hasChecklistId(item, pipeLaidChecklistId)
  );
  const connectedFields = allValueFields.filter((field) =>
    hasChecklistId(field, connectedChecklistId)
  );
  const connectedChecklistItems = checklistItems.filter((item) =>
    hasChecklistId(item, connectedChecklistId)
  );

  const isPipeLaid =
    pipeLaidFields.some((field) =>
      isPipeLaidSelectedValue(activeValues[field.key])
    ) ||
    pipeLaidChecklistItems.some((item) => activeValues.checks?.[item.id]);
  const isConnected =
    connectedFields.some((field) =>
      isPipeLaidSelectedValue(activeValues[field.key])
    ) ||
    connectedChecklistItems.some((item) => activeValues.checks?.[item.id]);

  return {
    isPipeLaid,
    isConnected,
  };
};

const isPartialStatusValue = (value) =>
  normalizeText(value).includes("partial");

const hasPipeLayingChecklistProgress = ({
  activeValues = {},
  selectFields = [],
  inputFields = [],
  checklistItems = [],
} = {}) =>
  [...selectFields, ...inputFields].some((field) =>
    `${activeValues[field.key] ?? ""}`.trim()
  ) || checklistItems.some((item) => activeValues.checks?.[item.id]);

const showPipeLayingRemarkRequired = ({
  activeSubOption = {},
  activeValues = {},
  pipeLayingState = {},
  subChakQuantity = null,
  selectFields = [],
  inputFields = [],
} = {}) => {
  if (!pipeLayingState.isPipeLaid || activeValues.remark?.trim()) {
    return false;
  }

  if (isPartialStatusValue(activeValues.status)) {
    return true;
  }

  if (activeSubOption.id === "inletPipeLaying") {
    return !pipeLayingState.isConnected;
  }

  if (activeSubOption.id === "outletPipeLaying") {
    const addedSubChakQtyField = [...selectFields, ...inputFields].find(
      (field) =>
        hasChecklistId(
          field,
          PIPE_LAYING_CHECKLIST_IDS.outletSubChakDesignQuantity
        )
    );
    const addedSubChakQtyVal = addedSubChakQtyField
      ? activeValues[addedSubChakQtyField.key]
      : null;

    if (
      addedSubChakQtyVal !== null &&
      addedSubChakQtyVal !== undefined &&
      subChakQuantity !== null &&
      subChakQuantity !== undefined
    ) {
      const designQty = Number(subChakQuantity);
      const addedQty = Number(addedSubChakQtyVal);
      if (!isNaN(designQty) && !isNaN(addedQty) && designQty !== addedQty) {
        return true;
      }
    }
    return !pipeLayingState.isConnected;
  }

  return false;
};

const getPipeLayingRequiredErrors = ({
  activeSubOption = {},
  activeValues = {},
  selectFields = [],
  inputFields = [],
  checklistItems = [],
  subChakQuantity = null,
} = {}) => {
  if (
    activeSubOption.id !== "inletPipeLaying" &&
    activeSubOption.id !== "outletPipeLaying"
  ) {
    return {};
  }

  const nextErrors = {};
  const hasChecklistProgress = hasPipeLayingChecklistProgress({
    activeValues,
    selectFields,
    inputFields,
    checklistItems,
  });
  const pipeLayingState = getPipeLayingFieldState({
    activeSubOption,
    activeValues,
    selectFields,
    inputFields,
    checklistItems,
  });

  if (!hasChecklistProgress) {
    nextErrors.form =
      "Select or fill at least one checklist item before submitting.";
    return nextErrors;
  }

  if (activeSubOption.id === "inletPipeLaying") {
    const pipeLaidItem = checklistItems.find((item) =>
      hasChecklistId(item, PIPE_LAYING_CHECKLIST_IDS.inletPipeLaid)
    );
    const connectedItem = checklistItems.find((item) =>
      hasChecklistId(item, PIPE_LAYING_CHECKLIST_IDS.inletConnected)
    );

    const isPipeLaidChecked = pipeLaidItem ? Boolean(activeValues.checks?.[pipeLaidItem.id]) : false;
    const isConnectedChecked = connectedItem ? Boolean(activeValues.checks?.[connectedItem.id]) : false;

    if (!isPipeLaidChecked && isConnectedChecked) {
      nextErrors.form = "Inlet Pipe Laid must be checked if Connected is selected.";
      if (pipeLaidItem) {
        nextErrors[pipeLaidItem.id] = "Inlet Pipe Laid must be checked.";
      }
      return nextErrors;
    }
  }

  if (!pipeLayingState.isPipeLaid) {
    return nextErrors;
  }

  if (activeSubOption.id === "inletPipeLaying") {
    const inletPipeSizeField = [...selectFields, ...inputFields].find(
      (field) => hasChecklistId(field, PIPE_LAYING_CHECKLIST_IDS.inletPipeSize)
    );

    if (
      inletPipeSizeField &&
      !`${activeValues[inletPipeSizeField.key] ?? ""}`.trim()
    ) {
      nextErrors[inletPipeSizeField.key] = getFieldValidationMessage({
        field: inletPipeSizeField,
        type: selectFields.some((field) => field.key === inletPipeSizeField.key)
          ? "select"
          : "input",
      });
    }
  }

  if (activeSubOption.id === "outletPipeLaying") {
    const subChakDesignQuantityField = [...selectFields, ...inputFields].find(
      (field) =>
        hasChecklistId(
          field,
          PIPE_LAYING_CHECKLIST_IDS.outletSubChakDesignQuantity
        )
    );

    if (
      subChakDesignQuantityField &&
      !`${activeValues[subChakDesignQuantityField.key] ?? ""}`.trim()
    ) {
      nextErrors[subChakDesignQuantityField.key] = getFieldValidationMessage({
        field: subChakDesignQuantityField,
        type: selectFields.some(
          (field) => field.key === subChakDesignQuantityField.key
        )
          ? "select"
          : "input",
      });
    }
  }

  if (
    showPipeLayingRemarkRequired({
      activeSubOption,
      activeValues,
      pipeLayingState,
      subChakQuantity,
      selectFields,
      inputFields,
    })
  ) {
    nextErrors.remark =
      activeSubOption.remarkValidationMessage ||
      "Remark is required";
  }

  return nextErrors;
};

const getInitialFormValues = (section, unit) => {
  const baseLocation = getUnitBaseLocation(unit);

  return section.subOptions.reduce((acc, sub) => {
    const defaultAddress = buildUnitAddressSummary(unit, baseLocation);

    acc[sub.id] = {
      status: sub.showStatusField === false ? "" : "Pending",
      remark: "",
      checks: buildChecklistState(sub.checklistItems),
      photos: buildPhotoState(sub.photoRequirements),
      repeatableGroups: buildRepeatableGroupState(sub.repeatableGroups),
      defaultLocation: baseLocation,
      defaultAddress,
      updatedLocation: baseLocation,
      updatedAddress: defaultAddress,
      updatedAt: null,
      updatedLocationSource: baseLocation ? "default" : "",
      pendingUpdatedLocation: null,
      pendingUpdatedAddress: "",
      pendingUpdatedAt: null,
      ...buildSelectFieldState(sub.selectFields),
      ...buildInputFieldState(sub.inputFields),
    };

    return acc;
  }, {});
};

// Workflow status constants control editing, resubmission, and server-prefill behavior.
const SUBMITTED_STATUS_KEYS = new Set([
  "submitted",
  "partial",
  "completed",
  "verified",
  "approved",
  "updated",
  "info",
]);

const INFO_RESUBMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const INFO_RESUBMIT_SUBOPTION_IDS = new Set([
  "inletPipeLaying",
  "outletPipeLaying",
  "pipeFlushing",
]);

const VALIDATION_BYPASS_SUBOPTION_IDS = new Set([
  "inletPipeLaying",
  "outletPipeLaying",
]);

const SERVER_PREFILL_STATUS_KEYS = new Set([
  "submitted",
  "partial",
  "completed",
  "approved",
  "updated",
  "info",
]);

const RECTIFICATION_PHOTO_REQUIREMENT = {
  id: "rectificationPhoto",
  checklistId: null,
  label: "Rectification Image",
  inputType: "photo",
  dataType: "image",
  required: true,
  synthetic: true,
};

const toFormStatusValue = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (
    normalizedValue === "completed" ||
    normalizedValue === "approved" ||
    normalizedValue === "updated" ||
    normalizedValue === "info"
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

const getReadOnlyTitleFromStatus = ({
  isRoleReadOnly = false,
  serverStatusKey = "",
  submittedFromLocal = false,
} = {}) => {
  if (isRoleReadOnly) {
    return "View Only";
  }

  if (submittedFromLocal) {
    return "Already Submitted";
  }

  const normalizedStatusKey = String(serverStatusKey || "")
    .trim()
    .toLowerCase();

  if (normalizedStatusKey === "info") {
    return "Info Status";
  }

  if (normalizedStatusKey === "updated") {
    return "Already Updated";
  }

  return "Already Submitted";
};

const getReadOnlyNoticeFromStatus = ({
  isRoleReadOnly = false,
  roleReadOnlyNotice = "",
  submittedFromServer = false,
  submittedFromLocal = false,
  serverStatusKey = "",
  isInfoResubmitEligible = false,
  isInfoResubmitWindowOpen = false,
} = {}) => {
  if (isRoleReadOnly) {
    return (
      roleReadOnlyNotice ||
      "This role can review checklist data but cannot edit it."
    );
  }

  if (submittedFromLocal) {
    return "Already submitted and saved on this device.";
  }

  if (submittedFromServer) {
    const normalizedStatusKey = String(serverStatusKey || "")
      .trim()
      .toLowerCase();

    if (normalizedStatusKey === "info") {
      if (isInfoResubmitWindowOpen) {
        return "This info subprocess can be resubmitted within 24 hours of server submission.";
      }

      if (isInfoResubmitEligible) {
        return "The 24-hour resubmit window for this info subprocess has expired.";
      }

      return "This checklist is already available as info from server data.";
    }

    if (normalizedStatusKey === "verified") {
      return "This checklist is already verified from server data.";
    }

    if (normalizedStatusKey === "approved") {
      return "This checklist is already approved from server data.";
    }

    if (normalizedStatusKey === "updated") {
      return "This checklist is already updated from server data.";
    }

    return "Already submitted from server data.";
  }

  return "";
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

    const defaultLocation = value.default_location || value.defaultLocation;

    if (defaultLocation) {
      return parseCoordinateValue(defaultLocation);
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

const parseServerTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const getSubprocessServerSubmissionTime = (subprocess = null) => {
  if (!subprocess) {
    return null;
  }

  const rawSubprocess = subprocess.rawSubprocess || {};
  const timestampCandidates = [
    rawSubprocess.updatedAt,
    rawSubprocess.updated_at,
    rawSubprocess.createdAt,
    rawSubprocess.created_at,
  ];

  for (const candidate of timestampCandidates) {
    const parsedDate = parseServerTimestamp(candidate);

    if (parsedDate) {
      return parsedDate;
    }
  }

  for (const checklist of subprocess.checklists || []) {
    const rawChecklist = checklist.rawChecklist || {};
    const checklistTimestampCandidates = [
      rawChecklist.updatedAt,
      rawChecklist.updated_at,
      rawChecklist.createdAt,
      rawChecklist.created_at,
      rawChecklist.submittedAt,
      rawChecklist.submitted_at,
    ];

    for (const candidate of checklistTimestampCandidates) {
      const parsedDate = parseServerTimestamp(candidate);

      if (parsedDate) {
        return parsedDate;
      }
    }
  }

  return null;
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
  const { sections, masterSource, hasApiSections } = useChecklistSections({
    module,
    unit: checklistSectionUnit,
  });
  const hydratedSubOptionsRef = useRef({});

  const section =
    sections.find((item) => item.key === sectionKey) || sections[0] || EMPTY_SECTION;

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
  const [commentedPhotoUploadBySubOptionId, setCommentedPhotoUploadBySubOptionId] =
    useState({});
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractors, setContractors] = useState([]);
  const [localSubmissionSnapshots, setLocalSubmissionSnapshots] = useState({});
  const [imageDraftSnapshots, setImageDraftSnapshots] = useState({});
  const [areImageDraftsLoaded, setAreImageDraftsLoaded] = useState(false);
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

    if (!nextSection || !nextSubOptionId || nextSection === EMPTY_SECTION) return;

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

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const activeSubOption = useMemo(
    () =>
      section.subOptions.find((sub) => sub.id === activeSubOptionId) ||
      section.subOptions[0] ||
      EMPTY_SUB_OPTION,
    [activeSubOptionId, section.subOptions]
  );
  const workItemStatusKey = String(
    workItem?.requestBucket || workItem?.status || ""
  )
    .trim()
    .toLowerCase();
  const workItemSubprocessId = String(workItem?.subprocessId || "").trim();
  const workItemProcessName = normalizeText(workItem?.processName || "");
  const workItemSubprocessName = normalizeText(workItem?.subprocessName || "");
  const isCommentedWorkItem = workItemStatusKey === "commented" || workItemStatusKey === "rejected";
  const isModifyApprovedWorkItem =
    workItemStatusKey === "modify approved" ||
    workItemStatusKey === "modify_approved" ||
    workItemStatusKey === "7";

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
  const selectFieldKeys = new Set(selectFields.map((field) => getFieldDedupKey(field)));
  const inputFields = (activeSubOption.inputFields || []).filter((field) =>
    isVisibleByRule(field, activeValues, activeSubOption) &&
    !selectFieldKeys.has(getFieldDedupKey(field))
  );
  const repeatableGroups = (activeSubOption.repeatableGroups || []).filter((group) =>
    isVisibleByRule(group, activeValues, activeSubOption)
  );
  const photoRequirements = (activeSubOption.photoRequirements || []).filter(
    (requirement) => isVisibleByRule(requirement, activeValues, activeSubOption)
  );
  const allPhotoRequirements = activeSubOption.photoRequirements || [];

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

  const getImageDraftScopeKey = useCallback(
    (subOption) => {
      const processId = toPositiveIntegerOrNull(
        subOption?.apiProcessId || section.apiProcessId
      );
      const subprocessId = toPositiveIntegerOrNull(subOption?.apiSubprocessId);
      const draftUnitId =
        unit?.id ||
        route?.params?.unitId ||
        workItem?.unitId ||
        unit?.omsId ||
        unit?.unitNo ||
        unit?.nodeName ||
        workItem?.omsId ||
        "";

      if (!processId || !subprocessId) {
        return "";
      }

      return buildChecklistImageDraftScopeKey({
        ownerUserId,
        module,
        unitId: draftUnitId,
        omsId: workItem?.omsId || unit?.omsId || unit?.unitNo || unit?.id || "",
        processId,
        subprocessId,
      });
    },
    [
      module,
      ownerUserId,
      route?.params?.unitId,
      section.apiProcessId,
      unit?.id,
      unit?.nodeName,
      unit?.omsId,
      unit?.unitNo,
      workItem?.omsId,
      workItem?.unitId,
    ]
  );

  const loadImageDraftSnapshots = useCallback(async () => {
    if (!section.subOptions.length) {
      setImageDraftSnapshots({});
      setAreImageDraftsLoaded(true);
      return;
    }

    const nextSnapshots = {};

    await Promise.all(
      section.subOptions.map(async (subOption) => {
        const scopeKey = getImageDraftScopeKey(subOption);

        if (!scopeKey) {
          return;
        }

        const snapshot = await getChecklistImageDraft({ scopeKey });

        if (snapshot?.photos?.length) {
          nextSnapshots[subOption.id] = snapshot;
        }
      })
    );

    setImageDraftSnapshots(nextSnapshots);
    setAreImageDraftsLoaded(true);
  }, [getImageDraftScopeKey, section.subOptions]);

  useEffect(() => {
    void loadLocalSnapshots();
  }, [loadLocalSnapshots]);

  useEffect(() => {
    setAreImageDraftsLoaded(false);
    void loadImageDraftSnapshots();
  }, [loadImageDraftSnapshots]);

  useFocusEffect(
    useCallback(() => {
      void loadLocalSnapshots();
      void loadImageDraftSnapshots();
      void refreshProgress();
    }, [loadImageDraftSnapshots, loadLocalSnapshots, refreshProgress])
  );

  const localSubmissionSnapshot = localSubmissionSnapshots[activeSubOption.id] || null;
  const imageDraftSnapshot = imageDraftSnapshots[activeSubOption.id] || null;
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
        const subOptionSubprocessId = String(subOption.apiSubprocessId || "").trim();
        const subOptionProcessName = normalizeText(
          subOption.apiProcessDescription ||
            subOption.processName ||
            section.apiDescription ||
            section.title
        );
        const subOptionSubprocessName = normalizeText(
          subOption.apiDescription || subOption.label
        );
        const matchesWorkflowSubprocessById =
          workItemSubprocessId &&
          subOptionSubprocessId === workItemSubprocessId;
        const matchesWorkflowSubprocessByName =
          !workItemSubprocessId &&
          workItemSubprocessName &&
          subOptionSubprocessName === workItemSubprocessName &&
          (!workItemProcessName || subOptionProcessName === workItemProcessName);
        const isWorkflowCommented =
          isCommentedWorkItem &&
          (matchesWorkflowSubprocessById || matchesWorkflowSubprocessByName);
        const isWorkflowModifyApproved =
          isModifyApprovedWorkItem &&
          (matchesWorkflowSubprocessById || matchesWorkflowSubprocessByName) &&
          !(
            subprocessStatusKey === "completed" ||
            (localSnapshot && String(localSnapshot.status || "").trim() === "synced") ||
            localPayloadHasFilledData(localSnapshot?.payload)
          );
        const canUseProcessCommentFallback =
          !workItemSubprocessId &&
          !workItemSubprocessName &&
          (section.subOptions || []).length <= 1;
        const isCommented =
          isWorkflowCommented ||
          subprocessStatusKey === "commented" ||
          (canUseProcessCommentFallback && processStatusKey === "commented");
        const serverStatusKey = isCommented
          ? "commented"
          : subprocessStatusKey || processStatusKey;
        const isPartial = !isCommented && serverStatusKey === "partial";
        const hasServerFilledData = subprocessHasServerFilledData(
          serverMatch?.subprocess
        );
        const serverSubmissionAt = getSubprocessServerSubmissionTime(
          serverMatch?.subprocess
        );
        const isInfoResubmitEligible = Boolean(
          serverStatusKey === "info" &&
            INFO_RESUBMIT_SUBOPTION_IDS.has(subOption.id)
        );
        const isInfoResubmitWindowOpen = Boolean(
          isInfoResubmitEligible &&
            serverSubmissionAt &&
            currentTimeMs - serverSubmissionAt.getTime() <= INFO_RESUBMIT_WINDOW_MS
        );
        const isPipeLayingSubOption =
          subOption.id === "inletPipeLaying" || subOption.id === "outletPipeLaying";
        const submittedFromServer = Boolean(
          serverMatch?.subprocess &&
          !isCommented &&
          !isPartial &&
          (isPipeLayingSubOption
            ? subprocessStatusKey === "completed"
            : hasServerFilledData)
        );
        const submittedFromLocal =
          !isCommented &&
          !isPartial &&
          localSnapshot?.status === "synced";

        acc[subOption.id] = {
          processStatusKey,
          subprocessStatusKey,
          serverStatusKey,
          isPartial,
          hasServerFilledData,
          serverSubmissionAt: serverSubmissionAt
            ? serverSubmissionAt.toISOString()
            : "",
          isInfoResubmitEligible,
          isInfoResubmitWindowOpen,
          isCommented,
          isModifyApproved: isWorkflowModifyApproved,
          submittedFromServer,
          submittedFromLocal,
          isSubmitted:
            (!isCommented && !isPartial && submittedFromServer) ||
            submittedFromLocal ||
            (!isCommented &&
              !isPartial &&
              localPayloadHasFilledData(localSnapshot?.payload)),
        };

        return acc;
      }, {}),
    [
      isCommentedWorkItem,
      isModifyApprovedWorkItem,
      currentTimeMs,
      localSubmissionSnapshots,
      progressMatchesBySubOptionId,
      section.subOptions,
      workItemSubprocessId,
      workItemProcessName,
      workItemSubprocessName,
    ]
  );
  const activeSubmissionState = stepSubmissionStateById[activeSubOption.id] || {};
  const activeServerStatusKey = activeSubmissionState.serverStatusKey || "";
  const activeServerHasFilledData = Boolean(
    activeSubmissionState.hasServerFilledData
  );
  const isInfoResubmitEligible = Boolean(
    activeSubmissionState.isInfoResubmitEligible
  );
  const isInfoResubmitWindowOpen = Boolean(
    activeSubmissionState.isInfoResubmitWindowOpen
  );
  const isCommentedForEdit = Boolean(activeSubmissionState.isCommented);
  const isModifyApprovedForEdit = Boolean(
    activeSubmissionState.isModifyApproved
  );
  const submittedFromServer = Boolean(activeSubmissionState.submittedFromServer);
  const submittedFromLocal = Boolean(activeSubmissionState.submittedFromLocal);
  const commentedRemark = String(workItem?.rejectionRemark || "").trim();
  const localSnapshotHasFilledData = localPayloadHasFilledData(
    localSubmissionSnapshot?.payload
  );
  const isPartialLocalSubmission = Boolean(
    localSnapshotHasFilledData &&
      isPartialStatusValue(localSubmissionSnapshot?.payload?.status)
  );
  const hasSavedLocalSubmission = Boolean(
    !isCommentedForEdit &&
      !isModifyApprovedForEdit &&
      localSnapshotHasFilledData &&
      !isPartialLocalSubmission
  );
  const hasLocalDraftSnapshot = Boolean(
    !isCommentedForEdit &&
      !isModifyApprovedForEdit &&
      localSnapshotHasFilledData &&
      localSubmissionSnapshot?.status !== "synced" &&
      !isPartialLocalSubmission
  );
  const isRoleReadOnly = !roleAccess.canEditChecklist;
  const isChecklistMasterUnavailable = !hasApiSections;
  const canEditPrefilledLocationFinalization = Boolean(
    activeSubOption?.id === "locationFinalization" &&
      activeSubOption?.canUpdateLocation &&
      !isCommentedForEdit &&
      !isModifyApprovedForEdit
  );
  const isReadOnly =
    isChecklistMasterUnavailable ||
    isRoleReadOnly ||
    (!isCommentedForEdit &&
      !isModifyApprovedForEdit &&
      submittedFromServer &&
      !isInfoResubmitWindowOpen &&
      !canEditPrefilledLocationFinalization) ||
    (submittedFromLocal && !isInfoResubmitWindowOpen) ||
    (hasSavedLocalSubmission && !isInfoResubmitWindowOpen);
  const readOnlyTitle = isChecklistMasterUnavailable
    ? "Checklist unavailable"
    : getReadOnlyTitleFromStatus({
      isRoleReadOnly,
      serverStatusKey: activeServerStatusKey,
      submittedFromLocal: submittedFromLocal || hasSavedLocalSubmission,
    });
  const readOnlyNotice = isChecklistMasterUnavailable
    ? "Checklist master is not available from the API cache yet."
    : getReadOnlyNoticeFromStatus({
      isRoleReadOnly,
      roleReadOnlyNotice: roleAccess.checklistReadOnlyNotice,
      submittedFromServer,
      submittedFromLocal: submittedFromLocal || hasSavedLocalSubmission,
      serverStatusKey: activeServerStatusKey,
      isInfoResubmitEligible,
      isInfoResubmitWindowOpen,
    });
  const canReviewChecklist = roleAccess.canReviewChecklist;
  const canShowReviewActions = canReviewChecklist && submittedFromServer;
  const displayPhotoRequirements = useMemo(() => {
    if (!isCommentedForEdit) {
      if (isModifyApprovedForEdit) {
        return [];
      }

      return photoRequirements;
    }

    return commentedPhotoUploadBySubOptionId[activeSubOption.id]
      ? [RECTIFICATION_PHOTO_REQUIREMENT]
      : [];
  }, [
    activeSubOption.id,
    commentedPhotoUploadBySubOptionId,
    isCommentedForEdit,
    isModifyApprovedForEdit,
    photoRequirements,
  ]);
  const activePhotoRequirements = displayPhotoRequirements;
  const canAddCommentedPhoto = Boolean(
    isCommentedForEdit &&
      !isReadOnly &&
      !commentedPhotoUploadBySubOptionId[activeSubOption.id]
  );
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

  // Hydrate once per source revision so server/local data does not overwrite user edits.
  useEffect(() => {
    const subOptionId = activeSubOption?.id;
    const shouldHydrateFromServer = Boolean(
      !isCommentedForEdit && progressMatch?.subprocess && activeServerHasFilledData
    );
    const shouldHydrateFromLocal =
      !isCommentedForEdit && (submittedFromLocal || hasLocalDraftSnapshot);
    const shouldHydrateFromImageDraft =
      !shouldHydrateFromLocal &&
      !shouldHydrateFromServer &&
      Boolean(imageDraftSnapshot?.photos?.length);

    if (
      !subOptionId ||
      (!isReadOnly &&
        !shouldHydrateFromServer &&
        !shouldHydrateFromLocal &&
        !shouldHydrateFromImageDraft)
    ) {
      return;
    }

    const hydrationSource = shouldHydrateFromLocal
      ? `local:${localSubmissionSnapshot?.id || ""}:${localSubmissionSnapshot?.updatedAt || ""}`
      : shouldHydrateFromImageDraft
        ? `image-draft:${imageDraftSnapshot?.updatedAt || ""}`
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
    const hydrationPhotoRequirements = isCommentedForEdit
      ? activePhotoRequirements
      : isModifyApprovedForEdit
        ? []
      : allPhotoRequirements.filter((requirement) =>
          isVisibleByRule(requirement, nextValues, activeSubOption)
        );

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
        const checklist = findProgressChecklistMatch(
          checklistsById,
          checklistsByName,
          item
        );
        nextValues.checks[item.id] = checklist
          ? toServerChecklistCheckedValue(
              checklist,
              nextValues.checks[item.id]
            )
          : nextValues.checks[item.id];
      });

      selectFields.forEach((field) => {
        const checklist = findProgressChecklistMatch(
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
        const checklist = findProgressChecklistMatch(
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
        const remarkChecklist = findProgressChecklistMatch(
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
        const locationChecklist = findProgressChecklistMatch(
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
          const locationValue =
            locationChecklist?.detail?.rawValue ??
            locationChecklist?.detail?.value ??
            locationChecklist?.rawChecklist?.value ??
            {};
          nextValues.updatedLocation = coordinates;
          nextValues.updatedAddress =
            locationValue?.updated_address ||
            locationValue?.updatedAddress ||
            formatCoordinates(coordinates);
          nextValues.updatedAt =
            locationValue?.updated_at ||
            locationValue?.updatedAt ||
            locationChecklist?.rawChecklist?.updatedAt ||
            locationChecklist?.rawChecklist?.submittedAt ||
            nextValues.updatedAt;
          nextValues.updatedLocationSource = String(
            locationValue?.updated_location_source ||
              locationValue?.updatedLocationSource ||
              ""
          ).trim();
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

        const checklist = findProgressChecklistMatch(
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

      hydrationPhotoRequirements.forEach((requirement) => {
        const checklist = findProgressChecklistMatch(
          checklistsById,
          checklistsByName,
          requirement
        );
        const remoteValue =
          checklist?.detail?.rawValue ??
          checklist?.detail?.value ??
          checklist?.rawChecklist?.value;
        const metadata = checklist?.rawChecklist?.metadata || {};
        const remoteUri = resolveServerPhotoUri(
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

    if (shouldHydrateFromLocal && localSubmissionSnapshot?.payload) {
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
          nextValues.updatedAt =
            answer?.value?.updated_at ||
            answer?.value?.updatedAt ||
            nextValues.updatedAt;
          nextValues.updatedLocationSource = String(
            answer?.value?.updated_location_source ||
              answer?.value?.updatedLocationSource ||
              ""
          ).trim();
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
        const requirement = hydrationPhotoRequirements.find(
          (item) =>
            String(item.requirementId || item.id) ===
              String(photo.requirementId || "") ||
            (photo.checklistId &&
              String(item.checklistId) === String(photo.checklistId))
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

    if (shouldHydrateFromImageDraft && imageDraftSnapshot?.photos?.length) {
      imageDraftSnapshot.photos.forEach((photo) => {
        const requirement = hydrationPhotoRequirements.find(
          (item) =>
            String(item.requirementId || item.id) ===
              String(photo.requirementId || "") ||
            (photo.checklistId &&
              String(item.checklistId) === String(photo.checklistId))
        );

        if (requirement) {
          nextValues.photos[requirement.id] = {
            uri: photo.uri || (photo.filePath ? `file://${photo.filePath}` : ""),
            filePath: photo.filePath || "",
            name: photo.name,
            source: "cached",
            sizeKb: photo.sizeKb,
            width: photo.width,
            height: photo.height,
            mediaType: photo.mediaType,
            type: photo.type,
            takenAt: photo.takenAt || "Cached on device",
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
    activePhotoRequirements,
    checklistItems,
    formValues,
    activeServerHasFilledData,
    hasLocalDraftSnapshot,
    imageDraftSnapshot,
    allPhotoRequirements,
    inputFields,
    isCommentedForEdit,
    isModifyApprovedForEdit,
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

  useEffect(() => {
    const subOptionId = activeSubOption?.id;
    const scopeKey = getImageDraftScopeKey(activeSubOption);

    if (!subOptionId || !scopeKey || !areImageDraftsLoaded) {
      return;
    }

    const canCacheImageDraft =
      !isReadOnly &&
      !submittedFromServer &&
      !submittedFromLocal &&
      !hasSavedLocalSubmission;

    if (!canCacheImageDraft) {
      if (imageDraftSnapshot?.photos?.length) {
        void clearChecklistImageDraft({ scopeKey });
        setImageDraftSnapshots((currentValue) => {
          if (!currentValue[subOptionId]) {
            return currentValue;
          }

          const nextValue = { ...currentValue };
          delete nextValue[subOptionId];
          return nextValue;
        });
      }

      return;
    }

    const currentPhotos = activePhotoRequirements
      .map((requirement) => {
        const media = activeValues.photos?.[requirement.id];

        if (!media?.uri || media?.source === "server") {
          return null;
        }

        return {
          requirementId: requirement.id,
          checklistId: requirement.checklistId || null,
          label: requirement.label,
          uri: media.uri,
          filePath: media.filePath || "",
          name: media.name || "",
          sizeKb: media.sizeKb ?? null,
          width: media.width ?? null,
          height: media.height ?? null,
          mediaType: media.mediaType || "image",
          type: media.type || "image/jpeg",
          takenAt: media.takenAt || "",
          latitude: media.latitude ?? null,
          longitude: media.longitude ?? null,
          source: "cached",
        };
      })
      .filter(Boolean);

    const existingDraftHydrationSource = `image-draft:${imageDraftSnapshot?.updatedAt || ""}`;
    const hasPendingDraftRestore =
      Boolean(imageDraftSnapshot?.photos?.length) &&
      !currentPhotos.length &&
      hydratedSubOptionsRef.current[subOptionId] !== existingDraftHydrationSource;
    const currentPhotosSignature = JSON.stringify(currentPhotos);
    const cachedPhotosSignature = JSON.stringify(imageDraftSnapshot?.photos || []);

    if (hasPendingDraftRestore) {
      return;
    }

    if (
      currentPhotos.length &&
      imageDraftSnapshot?.photos?.length &&
      currentPhotosSignature === cachedPhotosSignature
    ) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      if (currentPhotos.length) {
        const savedDraft = await saveChecklistImageDraft({
          scopeKey,
          photos: currentPhotos,
        });

        if (isCancelled) {
          await clearChecklistImageDraft({ scopeKey });
          return;
        }

        setImageDraftSnapshots((currentValue) => ({
          ...currentValue,
          [subOptionId]: savedDraft,
        }));
        return;
      }

      await clearChecklistImageDraft({ scopeKey });

      if (isCancelled) {
        return;
      }

      setImageDraftSnapshots((currentValue) => {
        if (!currentValue[subOptionId]) {
          return currentValue;
        }

        const nextValue = { ...currentValue };
        delete nextValue[subOptionId];
        return nextValue;
      });
    })();

    return () => {
      isCancelled = true;
    };
  }, [
    activePhotoRequirements,
    activeSubOption,
    activeValues.photos,
    areImageDraftsLoaded,
    getImageDraftScopeKey,
    hasSavedLocalSubmission,
    imageDraftSnapshot,
    isReadOnly,
    submittedFromLocal,
    submittedFromServer,
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
        ...(typeof updates === "function"
          ? updates(prev[subOptionId] || {})
          : updates),
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
      index === itemIndex
        ? (() => {
            const nextItem = { ...item, [fieldKey]: value };

            if (fieldKey === "subChakName") {
              if (String(value || "").trim().toUpperCase() === "NA") {
                nextItem.pipeSize = "NA";
              } else if (String(nextItem.pipeSize || "").trim().toUpperCase() === "NA") {
                nextItem.pipeSize = "";
              }
            }

            return nextItem;
          })()
        : item
    );

    updateActiveValues({
      repeatableGroups: {
        ...activeValues.repeatableGroups,
        [groupKey]: nextItems,
      },
    });

    clearRepeatableGroupFieldError(groupKey, itemIndex, fieldKey);

    if (fieldKey === "subChakName") {
      clearRepeatableGroupFieldError(groupKey, itemIndex, "pipeSize");
    }
  };

  const getRepeatableSelectOptions = useCallback(
    (group, itemIndex, field) => {
      const baseOptions = Array.isArray(field?.options) ? field.options : [];
      const uniqueFieldKeys = Array.isArray(group?.uniqueSelectionFieldKeys)
        ? group.uniqueSelectionFieldKeys
        : [];

      if (!uniqueFieldKeys.includes(field?.key)) {
        return baseOptions;
      }

      const allowedDuplicateValues = new Set(
        (group?.allowDuplicateValues || [])
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      );
      const items = activeValues.repeatableGroups?.[group.key] || [];
      const selectedValuesByOtherItems = new Set(
        items
          .map((item, index) =>
            index === itemIndex ? "" : String(item?.[field.key] || "").trim()
          )
          .filter(
            (value) => value && !allowedDuplicateValues.has(String(value))
          )
      );

      return baseOptions.map((option) => {
        const value = normalizePickerOptionValue(option);
        const label =
          typeof option === "string"
            ? option
            : String(option?.label ?? option?.value ?? "").trim();

        return {
          value,
          label,
          disabled: selectedValuesByOtherItems.has(value),
        };
      });
    },
    [activeValues.repeatableGroups]
  );

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

  const toggleOutletSubChakItem = (subChakNumber) => {
    if (isReadOnly || activeSubOption.id !== "outletPipeLaying") return;

    const subChakDesignQuantityField = [...selectFields, ...inputFields].find(
      (field) =>
        hasChecklistId(
          field,
          PIPE_LAYING_CHECKLIST_IDS.outletSubChakDesignQuantity
        )
    );
    const outletPipeLaidItem = checklistItems.find((item) =>
      hasChecklistId(item, PIPE_LAYING_CHECKLIST_IDS.outletPipeLaid)
    );
    const designCount =
      getOutletSubChakDesignCount(checklistSectionUnit.subChakQuantity) ||
      OUTLET_SUB_CHAK_MAX_COUNT;
    const visibleCount = Math.min(designCount, OUTLET_SUB_CHAK_MAX_COUNT);
    const fallbackSelectedCount = getNumberFromValue(
      subChakDesignQuantityField
        ? activeValues[subChakDesignQuantityField.key]
        : ""
    );
    const currentSelections = { ...(activeValues.outletSubChakChecks || {}) };

    if (
      !Object.keys(currentSelections).length &&
      Number.isFinite(fallbackSelectedCount) &&
      fallbackSelectedCount > 0
    ) {
      Array.from({ length: visibleCount }, (_, index) => index + 1).forEach(
        (number) => {
          currentSelections[number] = number <= fallbackSelectedCount;
        }
      );
    }

    currentSelections[subChakNumber] = !currentSelections[subChakNumber];

    const selectedCount = Array.from(
      { length: visibleCount },
      (_, index) => index + 1
    ).filter((number) => currentSelections[number]).length;
    const nextChecks = { ...(activeValues.checks || {}) };

    if (outletPipeLaidItem) {
      nextChecks[outletPipeLaidItem.id] = selectedCount > 0;
    }

    const nextValues = {
      outletSubChakChecks: currentSelections,
      checks: nextChecks,
    };

    if (subChakDesignQuantityField) {
      nextValues[subChakDesignQuantityField.key] = selectedCount
        ? String(selectedCount)
        : "";
    }

    updateActiveValues(nextValues);
    clearFieldError("remark");
    clearFieldError("form");

    if (subChakDesignQuantityField) {
      clearFieldError(subChakDesignQuantityField.key);
    }
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

      const capturedAt = new Date().toLocaleString();
      const resolvedAddress = await getReadableAddress(
        nextLocation.latitude,
        nextLocation.longitude
      );
      const matchesDefaultLocation = areLocationsEqual(
        nextLocation,
        activeValues.defaultLocation
      );
      const nextAddress = matchesDefaultLocation
        ? activeValues.defaultAddress || formatCoordinates(nextLocation)
        : resolvedAddress || "Address unavailable (offline/network issue)";

      console.log("[ChecklistLocation]", "Current location captured", {
        subOptionId: activeSubOption.id,
        updatedLocation: nextLocation,
        matchesDefaultLocation,
      });

      updateActiveValues({
        pendingUpdatedLocation: nextLocation,
        pendingUpdatedAddress: nextAddress,
        pendingUpdatedAt: capturedAt,
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

  const confirmUpdatedLocation = () => {
    if (isReadOnly) return;
    if (!activeValues.pendingUpdatedLocation) return;

    const matchesDefaultLocation = areLocationsEqual(
      activeValues.pendingUpdatedLocation,
      activeValues.defaultLocation
    );

    updateActiveValues({
      updatedLocation: activeValues.pendingUpdatedLocation,
      updatedAddress:
        activeValues.pendingUpdatedAddress ||
        (matchesDefaultLocation
          ? activeValues.defaultAddress
          : formatCoordinates(activeValues.pendingUpdatedLocation)),
      updatedAt: activeValues.pendingUpdatedAt || new Date().toLocaleString(),
      updatedLocationSource: matchesDefaultLocation ? "default" : "current",
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

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      showAppAlert({
        type: "warning",
        title: "Permission needed",
        message: "Please allow gallery access to choose a photo.",
      });
      return false;
    }

    return true;
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

  const pickFromGallery = async (requirement) => {
    if (isReadOnly) return;
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: requirement.allowVideo
        ? ImagePicker.MediaTypeOptions.All
        : ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: false,
      selectionLimit: 1,
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
          "gallery",
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

  const removeSelectedPhoto = async (requirementId) => {
    if (isReadOnly) return;
    const nextPhotos = {
      photos: {
        ...activeValues.photos,
        [requirementId]: null,
      },
    };

    updateActiveValues(nextPhotos);

    const scopeKey = getImageDraftScopeKey(activeSubOption);

    if (!scopeKey) {
      return;
    }

    const remainingPhotos = activePhotoRequirements
      .filter((requirement) => requirement.id !== requirementId)
      .map((requirement) => {
        const media = activeValues.photos?.[requirement.id];

        if (!media?.uri || media?.source === "server") {
          return null;
        }

        return {
          requirementId: requirement.id,
          checklistId: requirement.checklistId || null,
          label: requirement.label,
          uri: media.uri,
          filePath: media.filePath || "",
          name: media.name || "",
          sizeKb: media.sizeKb ?? null,
          width: media.width ?? null,
          height: media.height ?? null,
          mediaType: media.mediaType || "image",
          type: media.type || "image/jpeg",
          takenAt: media.takenAt || "",
          latitude: media.latitude ?? null,
          longitude: media.longitude ?? null,
          source: "cached",
        };
      })
      .filter(Boolean);

    if (remainingPhotos.length) {
      const savedDraft = await saveChecklistImageDraft({
        scopeKey,
        photos: remainingPhotos,
      });

      setImageDraftSnapshots((currentValue) => ({
        ...currentValue,
        [activeSubOption.id]: savedDraft,
      }));
      return;
    }

    await clearChecklistImageDraft({ scopeKey });
    setImageDraftSnapshots((currentValue) => {
      const nextValue = { ...currentValue };
      delete nextValue[activeSubOption.id];
      return nextValue;
    });
  };

  const addCommentedPhotoUpload = () => {
    if (!isCommentedForEdit || isReadOnly) {
      return;
    }

    setCommentedPhotoUploadBySubOptionId((currentValue) => ({
      ...currentValue,
      [activeSubOption.id]: true,
    }));
  };

  const dismissCommentedPhotoUpload = async () => {
    if (!isCommentedForEdit || isReadOnly) {
      return;
    }

    await removeSelectedPhoto(RECTIFICATION_PHOTO_REQUIREMENT.id);
    setCommentedPhotoUploadBySubOptionId((currentValue) => {
      const nextValue = { ...currentValue };
      delete nextValue[activeSubOption.id];
      return nextValue;
    });
    setFieldErrors((prev) => {
      const activeSubOptionErrors = prev[activeSubOption.id] || {};
      const nextPhotoSlots = { ...(activeSubOptionErrors.photoSlots || {}) };
      delete nextPhotoSlots[RECTIFICATION_PHOTO_REQUIREMENT.id];

      return {
        ...prev,
        [activeSubOption.id]: {
          ...activeSubOptionErrors,
          photos: null,
          photoSlots: nextPhotoSlots,
        },
      };
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

  const saveSubmittedPhotosToDeviceGallery = useCallback(
    async (photos = []) => {
      if (!photos.length) {
        return {
          savedCount: 0,
          skipped: true,
          denied: false,
          savedUris: [],
        };
      }

      try {
        const gallerySaveResult = await saveChecklistMediaToDeviceGallery({
          mediaItems: photos,
          module,
        });

        if (gallerySaveResult.savedUris?.length) {
          updateActiveValues((currentValues) =>
            markPhotosAsSavedToDeviceGallery(
              currentValues,
              gallerySaveResult.savedUris
            )
          );
        }

        return gallerySaveResult;
      } catch (error) {
        console.log("[ChecklistGallery]", "Device gallery save failed", {
          message: error?.message,
        });

        return {
          savedCount: 0,
          skipped: false,
          denied: false,
          failed: true,
          savedUris: [],
        };
      }
    },
    [module, updateActiveValues]
  );

  const pedestalEnclosureSubmissionValidation =
    validatePedestalEnclosureSubmission({
      activeSubOption,
      activeValues,
      checklistItems,
      photoRequirements: activePhotoRequirements,
      localSubmissionSnapshot,
      progressMatch,
    });

  // Validate visible fields together with subprocess-specific business rules.
  const validateForm = () => {
    const pipeLayingRequiredErrors = getPipeLayingRequiredErrors({
      activeSubOption,
      activeValues,
      selectFields,
      inputFields,
      checklistItems,
      subChakQuantity: checklistSectionUnit.subChakQuantity,
    });

    if (VALIDATION_BYPASS_SUBOPTION_IDS.has(activeSubOption.id)) {
      setFieldErrors((prev) => ({
        ...prev,
        [activeSubOption.id]: pipeLayingRequiredErrors,
      }));

      return {
        isValid: Object.keys(pipeLayingRequiredErrors).length === 0,
        firstErrorMessage:
          Object.values(pipeLayingRequiredErrors).find(Boolean) || "",
      };
    }

    const nextErrors = { ...pipeLayingRequiredErrors };
    let firstErrorMessage =
      Object.values(pipeLayingRequiredErrors).find(Boolean) || "";

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

    if (
      activeSubOption.locationChecklist?.required &&
      activeSubOption.canUpdateLocation &&
      !activeValues.updatedLocation &&
      !activeValues.defaultLocation
    ) {
      nextErrors.form = "Please update location";
      setFirstErrorMessage("Please update location");
    }

    if (pedestalEnclosureSubmissionValidation.errorMessage) {
      nextErrors.photos = pedestalEnclosureSubmissionValidation.errorMessage;
      setFirstErrorMessage(pedestalEnclosureSubmissionValidation.errorMessage);
    }

    const getPhotoRequirementByChecklistId = (checklistId) =>
      activePhotoRequirements.find(
        (item) =>
          String(item.checklistId || item.id || "").trim() ===
          String(checklistId)
      );
    const hasMergedPedestalPhoto = (checklistId) => {
      const requirement = getPhotoRequirementByChecklistId(checklistId);
      const media = resolvePedestalPhotoMedia({
        checklistId,
        requirementId: requirement?.id,
        activeValues,
        localSubmissionSnapshot,
        progressMatch,
      });

      return hasSubmissionPhoto(media);
    };
    const hasPedestalRequirementPhoto = (requirement) => {
      if (activeSubOption.id !== PED_ENCLOSURE_SUBOPTION_ID) {
        return hasSubmissionPhoto(activeValues.photos?.[requirement.id]);
      }

      return hasSubmissionPhoto(
        resolvePedestalPhotoMedia({
          checklistId: requirement.checklistId || requirement.id,
          requirementId: requirement.id,
          activeValues,
          localSubmissionSnapshot,
          progressMatch,
        })
      );
    };

    const pedestalChecklist20Item = checklistItems.find(
      (item) => String(item.checklistId || item.id || "").trim() === "20"
    );
    const pedestalChecklist23Item = checklistItems.find(
      (item) => String(item.checklistId || item.id || "").trim() === "23"
    );
    const pedestalChecklist97Item = checklistItems.find(
      (item) => String(item.checklistId || item.id || "").trim() === "97"
    );
    const isPedestalMandatoryChecklistComplete =
      activeSubOption.id === PED_ENCLOSURE_SUBOPTION_ID &&
      PED_ENCLOSURE_REQUIRED_CHECKLIST_IDS.every((checklistId) =>
        checklistItems.some(
          (item) =>
            String(item.checklistId || item.id || "").trim() === checklistId &&
            activeValues.checks?.[item.id]
        )
      );

    const pedestalPhotoSlotErrors = {};
    const setPedestalPhotoSlotError = (photoChecklistId, message) => {
      const requirement = getPhotoRequirementByChecklistId(photoChecklistId);

      if (requirement) {
        pedestalPhotoSlotErrors[requirement.id] = message;
      }
    };

    if (
      activeSubOption.id === PED_ENCLOSURE_SUBOPTION_ID &&
      !hasMergedPedestalPhoto("99") &&
      activeValues.checks?.[pedestalChecklist20Item?.id]
    ) {
      setPedestalPhotoSlotError(
        "99",
        "Photo 99 is required because checklist 20 is completed."
      );
    }

    if (
      activeSubOption.id === PED_ENCLOSURE_SUBOPTION_ID &&
      !hasMergedPedestalPhoto("100") &&
      activeValues.checks?.[pedestalChecklist23Item?.id]
    ) {
      setPedestalPhotoSlotError(
        "100",
        "Photo 100 is required because checklist 23 is completed."
      );
    }

    if (
      activeSubOption.id === PED_ENCLOSURE_SUBOPTION_ID &&
      !hasMergedPedestalPhoto("25") &&
      activeValues.checks?.[pedestalChecklist97Item?.id]
    ) {
      setPedestalPhotoSlotError(
        "25",
        "Photo 25 is required because checklist 97 is completed."
      );
    }

    if (
      activeSubOption.id === PED_ENCLOSURE_SUBOPTION_ID &&
      isPedestalMandatoryChecklistComplete &&
      !hasMergedPedestalPhoto("26")
    ) {
      setPedestalPhotoSlotError(
        "26",
        "Signed checklist photo 26 is required to complete Pedestal & Enclosure."
      );
    }
    const isPedestalLinkedSizeGroup = activeSubOption.id === PED_ENCLOSURE_SUBOPTION_ID;

    const missingChecklistItems = checklistItems.filter(
      (item) =>
        isRequiredByRule(item, activeValues, activeSubOption) &&
        !activeValues.checks?.[item.id]
    );

    const completedChecklistItems = checklistItems.filter(
      (item) => !!activeValues.checks?.[item.id]
    );
    let missingRequirements = [];

    if (repeatableGroups.length) {
      const repeatableErrors = {};

      repeatableGroups.forEach((group) => {
        const items = activeValues.repeatableGroups?.[group.key] || [];
        const groupError = {};
        const isPedestalOutletIdentificationGroup =
          isPedestalLinkedSizeGroup &&
          String(group.checklistId || "").trim() === PED_ENCLOSURE_SIZE_CHECKLIST_ID;
        const isChecklist20Checked = Boolean(
          pedestalChecklist20Item && activeValues.checks?.[pedestalChecklist20Item.id]
        );

        if (isPedestalOutletIdentificationGroup && !isChecklist20Checked) {
          return;
        }

        if (
          isPedestalOutletIdentificationGroup &&
          isChecklist20Checked &&
          items.length === 0
        ) {
          groupError.message =
            "Checklist 22: Outlet pipe identification and marking is required because checklist 20 is completed.";
          setFirstErrorMessage(groupError.message);
        }

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
            const isOutletNaPipeSizeField =
              field.key === "pipeSize" &&
              String(item?.subChakName || "").trim().toUpperCase() === "NA";

            if (
              isRequired &&
              !isOutletNaPipeSizeField &&
              !`${item[field.key] ?? ""}`.trim()
            ) {
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

    if (Object.keys(pedestalPhotoSlotErrors).length) {
      nextErrors.photoSlots = {
        ...(nextErrors.photoSlots || {}),
        ...pedestalPhotoSlotErrors,
      };
    }

    if (activePhotoRequirements.length) {
      missingRequirements = activePhotoRequirements.filter(
        (requirement) =>
          isRequiredByRule(requirement, activeValues, activeSubOption) &&
          !hasPedestalRequirementPhoto(requirement)
      );
    }

    const uploadedPhotosCount = activePhotoRequirements.filter(
      (requirement) => hasPedestalRequirementPhoto(requirement)
    ).length;
    const hasChecklistOrPhotoRequirements =
      checklistItems.length > 0 || activePhotoRequirements.length > 0;
    const hasChecklistOrPhotoProgress =
      completedChecklistItems.length > 0 || uploadedPhotosCount > 0;
    const isPartialChecklistSubmission =
      hasChecklistOrPhotoRequirements &&
      hasChecklistOrPhotoProgress &&
      (missingChecklistItems.length > 0 || missingRequirements.length > 0);
    const shouldRequireRemarkForPartial =
      showRemarkField && isPartialChecklistSubmission;
    const shouldUseRemarkForMissingRequired =
      showRemarkField &&
      Boolean(activeSubOption.remarkValidationMessage) &&
      (isRemarkRequired ||
        missingChecklistItems.length > 0 ||
        missingRequirements.length > 0);

    if (
      !shouldUseRemarkForMissingRequired &&
      hasChecklistOrPhotoRequirements &&
      !hasChecklistOrPhotoProgress
    ) {
      nextErrors.form =
        nextErrors.form ||
        "Select at least one checklist item or upload one photo to submit.";
      setFirstErrorMessage(
        "Select at least one checklist item or upload one photo to submit."
      );
    } else if (!isPartialChecklistSubmission) {
      if (missingChecklistItems.length) {
        nextErrors.form =
          nextErrors.form ||
          `Please complete ${missingChecklistItems.length} required checklist item(s)`;
        setFirstErrorMessage(
          `Please complete ${missingChecklistItems.length} required checklist item(s)`
        );
      }

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

    if (
      showRemarkField &&
      (isRemarkRequired ||
        shouldRequireRemarkForPartial ||
        shouldUseRemarkForMissingRequired) &&
      !activeValues.remark.trim()
    ) {
      nextErrors.remark =
        activeSubOption.remarkValidationMessage ||
        (isPartialChecklistSubmission
          ? "Remark is required for partial submission"
          : "Remark is required");
      setFirstErrorMessage(nextErrors.remark);
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

  // Convert the current form into the normalized checklist answer collection.
  const buildChecklistAnswers = () => {
    const answers = [];
    const subChakDesignQuantityField = [...selectFields, ...inputFields].find(
      (field) =>
        hasChecklistId(
          field,
          PIPE_LAYING_CHECKLIST_IDS.outletSubChakDesignQuantity
        )
    );
    const outletPipeLaidMap =
      activeSubOption.id === "outletPipeLaying"
        ? buildOutletPipeLaidMap({
            selections: activeValues.outletSubChakChecks || {},
            selectedCount: subChakDesignQuantityField
              ? activeValues[subChakDesignQuantityField.key]
              : null,
            designCount: checklistSectionUnit.subChakQuantity,
          })
        : null;

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
          updated_location_source: activeValues.updatedLocationSource || null,
        })
      );
    }

    checklistItems.forEach((item) => {
      const checked = !!activeValues.checks?.[item.id];
      const isOutletPipeLaid =
        activeSubOption.id === "outletPipeLaying" &&
        hasChecklistId(item, PIPE_LAYING_CHECKLIST_IDS.outletPipeLaid);
      answers.push(
        buildAnswer(item, checked, {
          display_value: checked ? "Yes" : "No",
          ...(isOutletPipeLaid ? { Pipelaid: outletPipeLaidMap } : {}),
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
      const mediaPath = media?.filePath || media?.uri || "";

      if (requirement.synthetic || !mediaPath || isServerSourcedMedia(media)) {
        return;
      }
      answers.push(
        buildAnswer(requirement, mediaPath, {
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

  // Build the offline/API payload while preserving earlier pedestal progress.
  const buildSubmissionPayload = () => {
    const submittedAt = new Date().toISOString();
    const pedestalLinkedSizeInfo =
      activeSubOption.id === PED_ENCLOSURE_SUBOPTION_ID
        ? resolvePedestalLinkedSizeEntries({
            repeatableGroups,
            activeValues,
            localSubmissionSnapshot,
          })
        : {
            sizeGroup: null,
            linkedSizeEntries: [],
          };
    const pedestalSubmissionPayload =
      activeSubOption.id === PED_ENCLOSURE_SUBOPTION_ID
        ? {
            checklistById: new Map(),
            photoById: new Map(),
          }
        : null;

    if (pedestalSubmissionPayload) {
      (localSubmissionSnapshot?.payload?.checklist || []).forEach((entry) => {
        if (!hasSubmissionValue(entry?.checked ?? entry?.response ?? entry?.value)) {
          return;
        }

        const checklistId = getSubmissionChecklistId(entry);

        if (checklistId) {
          pedestalSubmissionPayload.checklistById.set(checklistId, entry);
        }
      });

      (localSubmissionSnapshot?.payload?.photos || []).forEach((photo) => {
        if (!hasSubmissionPhoto(photo)) {
          return;
        }

        const photoId = getSubmissionPhotoId(photo);

        if (photoId) {
          pedestalSubmissionPayload.photoById.set(photoId, photo);
        }
      });
    }

    const completedChecklistItems = checklistItems.filter(
      (item) => !!activeValues.checks?.[item.id]
    );
    const uploadedPhotosCount = activePhotoRequirements.filter(
      (requirement) => !!activeValues.photos?.[requirement.id]?.uri
    ).length;
    const missingChecklistItems = checklistItems.filter(
      (item) =>
        isRequiredByRule(item, activeValues, activeSubOption) &&
        !activeValues.checks?.[item.id]
    );
    const missingPhotoRequirements = activePhotoRequirements.filter(
      (requirement) =>
        isRequiredByRule(requirement, activeValues, activeSubOption) &&
        !activeValues.photos?.[requirement.id]?.uri
    );
    const shouldSubmitAsPartial =
      (completedChecklistItems.length > 0 || uploadedPhotosCount > 0) &&
      (missingChecklistItems.length > 0 || missingPhotoRequirements.length > 0);
    const submissionStatus =
      activeSubOption.id === PED_ENCLOSURE_SUBOPTION_ID
        ? pedestalEnclosureSubmissionValidation.isComplete
          ? "Completed"
          : "Partially Completed"
        : shouldSubmitAsPartial
          ? "Partially Completed"
          : activeValues.status;
    const checklist = checklistItems.map((item) => {
      const checklistId = String(item.checklistId || item.id || "").trim();
      const isOutletPipeLaid =
        activeSubOption.id === "outletPipeLaying" &&
        checklistId === PIPE_LAYING_CHECKLIST_IDS.outletPipeLaid;
      const subChakDesignQuantityField = [...selectFields, ...inputFields].find(
        (field) =>
          hasChecklistId(
            field,
            PIPE_LAYING_CHECKLIST_IDS.outletSubChakDesignQuantity
          )
      );
      const isChecked = activeSubOption.id === PED_ENCLOSURE_SUBOPTION_ID
        ? Boolean(
            activeValues.checks?.[item.id] ||
              pedestalSubmissionPayload?.checklistById?.has(checklistId)
          )
        : Boolean(activeValues.checks?.[item.id]);

      return {
        id: item.id,
        checklist_id: item.checklistId || null,
        label: item.label,
        response: isChecked ? 1 : 0,
        checked: isChecked ? 1 : 0,
        ...(isOutletPipeLaid
          ? {
              Pipelaid: buildOutletPipeLaidMap({
                selections: activeValues.outletSubChakChecks || {},
                selectedCount: subChakDesignQuantityField
                  ? activeValues[subChakDesignQuantityField.key]
                  : null,
                designCount: checklistSectionUnit.subChakQuantity,
              }),
            }
          : {}),
      };
    });

    const photos = activePhotoRequirements
      .map((requirement) => {
        const checklistId = String(
          requirement.checklistId || requirement.id || ""
        ).trim();
        const currentMedia = activeValues.photos?.[requirement.id] || null;
        const snapshotMedia =
          pedestalSubmissionPayload?.photoById?.get(checklistId) || null;
        const mergedMedia = currentMedia?.uri ? currentMedia : snapshotMedia;
        const linkedSizeMetadata =
          checklistId === "99" && pedestalLinkedSizeInfo.linkedSizeEntries.length
            ? {
                linkedChecklistId: pedestalLinkedSizeInfo.sizeGroup?.checklistId || PED_ENCLOSURE_SIZE_CHECKLIST_ID,
                linkedChecklistLabel: pedestalLinkedSizeInfo.sizeGroup?.title || "Outlet Pipe Identification and Marking",
                linkedChecklistValues: pedestalLinkedSizeInfo.linkedSizeEntries,
            }
            : {};

        if (!mergedMedia?.uri && !mergedMedia?.filePath) {
          return null;
        }

        if (isServerSourcedMedia(mergedMedia)) {
          return null;
        }

        return {
          checklistId: requirement.checklistId || null,
          requirementId: requirement.id,
          requirementLabel: requirement.label,
          inputType: requirement.inputType || "photo",
          dataType: requirement.dataType || "image",
          inputUnit: requirement.inputUnit ?? null,
          seqNo: requirement.seqNo ?? null,
          isRequired: requirement.required !== false,
          ...linkedSizeMetadata,
          ...mergedMedia,
        };
      })
      .filter((item) => item?.uri || item?.filePath);
    const answers = buildChecklistAnswers();

    if (pedestalSubmissionPayload) {
      activePhotoRequirements.forEach((requirement) => {
        const checklistId = String(
          requirement.checklistId || requirement.id || ""
        ).trim();
        const currentMedia = activeValues.photos?.[requirement.id] || null;
        const snapshotMedia =
          pedestalSubmissionPayload.photoById.get(checklistId) || null;
        const mergedMedia = currentMedia?.uri ? currentMedia : snapshotMedia;

        if (!mergedMedia || isServerSourcedMedia(mergedMedia)) {
          return;
        }

        const hasMergedAnswer = answers.some(
          (answer) => String(answer.checklist_id || "") === checklistId
        );

        if (hasMergedAnswer) {
          return;
        }

        const mergedMediaPath = mergedMedia.uri || mergedMedia.filePath || "";
        const linkedSizeMetadata =
          checklistId === "99" && pedestalLinkedSizeInfo.linkedSizeEntries.length
            ? {
                linkedChecklistId: pedestalLinkedSizeInfo.sizeGroup?.checklistId || PED_ENCLOSURE_SIZE_CHECKLIST_ID,
                linkedChecklistLabel: pedestalLinkedSizeInfo.sizeGroup?.title || "Outlet Pipe Identification and Marking",
                linkedChecklistValues: pedestalLinkedSizeInfo.linkedSizeEntries,
              }
            : {};

        if (!mergedMediaPath) {
          return;
        }

        answers.push(
          buildAnswer(requirement, mergedMediaPath, {
            valueType: "file",
            ...linkedSizeMetadata,
            file: mergedMedia
              ? {
                  file_name: mergedMedia.name,
                  file_path: mergedMedia.filePath || mergedMedia.uri,
                  local_uri: mergedMedia.uri,
                  source: mergedMedia.source,
                  mime_type: mergedMedia.type,
                  size_kb: mergedMedia.sizeKb,
                  width: mergedMedia.width,
                  height: mergedMedia.height,
                  media_type: mergedMedia.mediaType,
                  taken_at: mergedMedia.takenAt,
                  latitude: mergedMedia.latitude,
                  longitude: mergedMedia.longitude,
                  ...linkedSizeMetadata,
                }
              : null,
          })
        );
      });
    }

    if (pedestalLinkedSizeInfo.linkedSizeEntries.length) {
      const linkedSizeMetadata = {
        linkedChecklistId:
          pedestalLinkedSizeInfo.sizeGroup?.checklistId ||
          PED_ENCLOSURE_SIZE_CHECKLIST_ID,
        linkedChecklistLabel:
          pedestalLinkedSizeInfo.sizeGroup?.title ||
          "Outlet Pipe Identification and Marking",
        linkedChecklistValues: pedestalLinkedSizeInfo.linkedSizeEntries,
      };

      answers.forEach((answer) => {
        if (String(answer.checklist_id || "") !== "99") {
          return;
        }

        Object.assign(answer, linkedSizeMetadata);

        if (answer.file && typeof answer.file === "object") {
          Object.assign(answer.file, linkedSizeMetadata);
        }
      });
    }

    answers.sort((a, b) => (a.seq_no || 0) - (b.seq_no || 0));

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
      status: showStatusField
        ? submissionStatus
        : "",
      remark: showRemarkField ? activeValues.remark : "",
      answers,
      checklist,
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
      let gallerySaveResult = { savedCount: 0, denied: false };
      let submitPayload = payload;

      // For modify approved submissions, exclude images and track changes
      if (isModifyApprovedForEdit) {
        submitPayload = {
          ...payload,
          photos: [], // Exclude photos for modify mode
        };
      } else {
        gallerySaveResult = await saveSubmittedPhotosToDeviceGallery(
          payload.photos
        );
      }

      const result = await submitChecklistOfflineFirst({
        deviceType: module,
        section,
        subOption: activeSubOption,
        payload: submitPayload,
        ownerUserId,
        offlineOnly: false,
        submissionMode: isCommentedForEdit
          ? "commented_resubmit"
          : isModifyApprovedForEdit
            ? "modify_approved_resubmit"
            : "submit",
        resubmitSubmissionId: workItem?.submissionId || "",
      });
      if (result.submission) {
        setLocalSubmissionSnapshots((currentValue) => ({
          ...currentValue,
          [activeSubOption.id]: result.submission,
        }));
      }
      const activeDraftScopeKey = getImageDraftScopeKey(activeSubOption);
      if (activeDraftScopeKey) {
        await clearChecklistImageDraft({ scopeKey: activeDraftScopeKey });
        setImageDraftSnapshots((currentValue) => {
          const nextValue = { ...currentValue };
          delete nextValue[activeSubOption.id];
          return nextValue;
        });
      }
      await loadLocalSnapshots();
      await loadImageDraftSnapshots();
      await refreshProgress();
      console.log("[ChecklistSubmit]", "Submit result", {
        submissionId: result.submission?.id,
        draftJsonPath: result.draftJsonPath,
        synced: result.synced,
        gallerySavedCount: gallerySaveResult.savedCount,
        galleryPermissionDenied: gallerySaveResult.denied,
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

      showAppAlert({
        type: wasSynced ? "success" : "info",
        title: wasSynced
          ? isCommentedForEdit
            ? "Resubmitted successfully"
            : isModifyApprovedForEdit
              ? "Modification submitted"
            : "Submitted successfully"
          : "Saved locally",
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
        isCommentedForEdit || isModifyApprovedForEdit
          ? "[ChecklistResubmit]"
          : "[ChecklistDraft]",
        isCommentedForEdit || isModifyApprovedForEdit
          ? "Resubmit failed"
          : "Local save failed",
        {
          message: error?.message,
          code: error?.code,
          status: error?.status,
        }
      );
      showAppAlert({
        type: "danger",
        title:
          isCommentedForEdit || isModifyApprovedForEdit
            ? "Resubmit failed"
            : "Save failed",
        message:
          error?.message ||
          (isCommentedForEdit || isModifyApprovedForEdit
            ? "Unable to resubmit this subprocess right now. Please try again."
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
    isModifyApprovedForEdit,
    canAddCommentedPhoto,
    commentedRemark,
    activeValues,
    activeErrors,
    designSubChakQuantity: checklistSectionUnit.subChakQuantity,
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
    getRepeatableSelectOptions,
    updateInputValue,
    updateRemarkValue,
    updateReviewRemark,
    updateRepeatableGroupItem,
    addRepeatableGroupItem,
    removeRepeatableGroupItem,
    toggleChecklistItem,
    toggleOutletSubChakItem,
    getChecklistProgress,
    openMapForLocation,
    updateNodeLocation,
    confirmUpdatedLocation,
    discardPendingUpdatedLocation,
    pickFromCamera,
    pickFromGallery,
    removeSelectedPhoto,
    addCommentedPhotoUpload,
    dismissCommentedPhotoUpload,
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
