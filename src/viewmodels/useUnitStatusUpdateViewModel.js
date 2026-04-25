import { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
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
  getCachedContractorList,
  refreshContractorList,
} from "../services/contractorOfflineStore";
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

const formatCoordinates = (location = {}) =>
  `${location.latitude ?? "-"}, ${location.longitude ?? "-"}`;

const buildUnitAddressSummary = (
  unit = {},
  baseLocation = DEFAULT_NODE_LOCATION
) => {
  const unitLocation = {
    latitude: unit?.latitude ?? baseLocation?.latitude,
    longitude: unit?.longitude ?? baseLocation?.longitude,
  };

  return formatCoordinates(unitLocation);
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

const formatSubmissionStatusLabel = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase()) || "Completed";

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

const getInitialFormValues = (section, unit) => {
  const baseLocation = {
    latitude: unit?.latitude ?? DEFAULT_NODE_LOCATION.latitude,
    longitude: unit?.longitude ?? DEFAULT_NODE_LOCATION.longitude,
  };

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
      ...buildSelectFieldState(sub.selectFields),
      ...buildInputFieldState(sub.inputFields),
    };

    return acc;
  }, {});
};

const SUBMITTED_STATUS_KEYS = new Set([
  "partial",
  "completed",
  "commented",
  "approved",
  "updated",
]);

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

const useUnitStatusUpdateViewModel = (navigation, route) => {
  const module = (route?.params?.module || "OMS").toUpperCase();
  const unit = route?.params?.unit || {};
  const projectId =
    route?.params?.projectId || unit?.projectId || route?.params?.project?.id || "";
  const projectName = route?.params?.projectName || "IrriTrack";
  const sectionKey = route?.params?.sectionKey || "pipeLaying";
  const requestedSubOptionId = route?.params?.subOptionId;
  const { sections, masterSource } = useChecklistSections({ module, unit });
  const hydratedSubOptionsRef = useRef({});

  const section =
    sections.find((item) => item.key === sectionKey) || sections[0];

  const initialSubOptionId =
    section.subOptions.find((sub) => sub.id === requestedSubOptionId)?.id ||
    section.subOptions[0]?.id;

  const [activeSubOptionId, setActiveSubOptionId] = useState(initialSubOptionId);
  const [formValues, setFormValues] = useState(() =>
    getInitialFormValues(section, unit)
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
  const [localSubmissionSnapshot, setLocalSubmissionSnapshot] = useState(null);
  const { progress } = useUnitProgress({
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
    setFormValues(getInitialFormValues(nextSection, unit));
    setFieldErrors({});
    hydratedSubOptionsRef.current = {};
  }, [masterSource, requestedSubOptionId, sectionKey, sections, unit]);

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

  const activeValues =
    formValues[activeSubOption.id] ||
    getInitialFormValues({ subOptions: [activeSubOption] }, unit)[
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
  const progressMatch = useMemo(
    () =>
      activeSubOption?.apiSubprocessId
        ? findUnitProgressSubprocess(progress, activeSubOption.apiSubprocessId)
        : null,
    [activeSubOption?.apiSubprocessId, progress]
  );
  const submittedFromServer = Boolean(
    progressMatch?.subprocess &&
      SUBMITTED_STATUS_KEYS.has(progressMatch.subprocess.status.key)
  );

  useEffect(() => {
    let isMounted = true;

    const loadLocalSnapshot = async () => {
      const snapshot = await getLatestChecklistSubmissionSnapshot({
        unitId: unit?.id || route?.params?.unitId || "",
        processId: activeSubOption?.apiProcessId,
        subprocessId: activeSubOption?.apiSubprocessId,
      });

      if (isMounted) {
        setLocalSubmissionSnapshot(snapshot);
      }
    };

    if (!activeSubOption?.apiProcessId || !activeSubOption?.apiSubprocessId) {
      setLocalSubmissionSnapshot(null);
      return () => {
        isMounted = false;
      };
    }

    void loadLocalSnapshot();

    return () => {
      isMounted = false;
    };
  }, [
    activeSubOption?.apiProcessId,
    activeSubOption?.apiSubprocessId,
    route?.params?.unitId,
    unit?.id,
  ]);

  const submittedFromLocal = Boolean(localSubmissionSnapshot?.payload);
  const isReadOnly = submittedFromServer || submittedFromLocal;
  const readOnlyNotice = submittedFromServer
    ? "Already submitted from server data."
    : submittedFromLocal
      ? "Already submitted and saved on this device."
      : "";

  useEffect(() => {
    const subOptionId = activeSubOption?.id;

    if (!subOptionId || !isReadOnly) {
      return;
    }

    const hydrationSource = submittedFromLocal
      ? `local:${localSubmissionSnapshot?.id || ""}:${localSubmissionSnapshot?.updatedAt || ""}`
      : `server:${progressMatch?.subprocess?.status?.key || ""}`;

    if (hydratedSubOptionsRef.current[subOptionId] === hydrationSource) {
      return;
    }

    const baseValues =
      formValues[subOptionId] ||
      getInitialFormValues({ subOptions: [activeSubOption] }, unit)[subOptionId];
    const nextValues = {
      ...baseValues,
      checks: { ...baseValues.checks },
      photos: { ...baseValues.photos },
      repeatableGroups: { ...baseValues.repeatableGroups },
    };

    if (submittedFromServer && progressMatch?.subprocess) {
      const subprocess = progressMatch.subprocess;

      if (showStatusField) {
        nextValues.status = toFormStatusValue(subprocess.status.label);
      }

      const checklistsById = new Map(
        (subprocess.checklists || []).map((item) => [String(item.id), item])
      );

      checklistItems.forEach((item) => {
        const checklist = checklistsById.get(String(item.checklistId || item.id));
        nextValues.checks[item.id] = checklist
          ? checklist.status.key !== "pending"
          : nextValues.checks[item.id];
      });

      selectFields.forEach((field) => {
        const checklist = checklistsById.get(String(field.checklistId || field.key));
        const detailValue =
          checklist?.detail?.rawValue ??
          checklist?.detail?.value ??
          checklist?.rawChecklist?.value;

        if (detailValue !== null && typeof detailValue !== "undefined") {
          nextValues[field.key] = String(detailValue);
        }
      });

      inputFields.forEach((field) => {
        const checklist = checklistsById.get(String(field.checklistId || field.key));
        const detailValue =
          checklist?.detail?.rawValue ??
          checklist?.detail?.value ??
          checklist?.rawChecklist?.value;

        if (detailValue !== null && typeof detailValue !== "undefined") {
          nextValues[field.key] = String(detailValue);
        }
      });

      if (showRemarkField && activeSubOption.remarkChecklist?.checklistId) {
        const remarkChecklist = checklistsById.get(
          String(activeSubOption.remarkChecklist.checklistId)
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
        const locationChecklist = checklistsById.get(
          String(activeSubOption.locationChecklist.checklistId)
        );
        const coordinates = parseCoordinateValue(
          locationChecklist?.detail?.rawValue ??
            locationChecklist?.detail?.value ??
            locationChecklist?.rawChecklist?.value
        );

        if (coordinates) {
          nextValues.updatedLocation = coordinates;
          nextValues.updatedAddress = formatCoordinates(coordinates);
        }
      }

      repeatableGroups.forEach((group) => {
        const checklist = checklistsById.get(String(group.checklistId || group.key));
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
    activeSubOption,
    checklistItems,
    formValues,
    inputFields,
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
        updatedLocation: nextLocation,
        updatedAt: capturedAt,
        updatedAddress: "Resolving address...",
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
          updatedAddress: address || "Address unavailable (offline/network issue)",
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

    try {
      [selectedAsset, resolvedCaptureLocation] = await Promise.all([
        compressChecklistImage(asset),
        Promise.resolve(captureLocation),
      ]);
    } catch (error) {
      showAppAlert({
        type: "danger",
        title: "Photo compression failed",
        message: "Unable to prepare this photo. Please capture it again.",
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
          takenAt: new Date().toLocaleString(),
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

    if (showStatusField && !activeValues.status) {
      nextErrors.status = "Please select status";
    }

    selectFields.forEach((field) => {
      if (
        isRequiredByRule(field, activeValues, activeSubOption) &&
        !activeValues[field.key]
      ) {
        nextErrors[field.key] = "Please select an option";
      }
    });

    inputFields.forEach((field) => {
      const value = activeValues[field.key];
      if (
        isRequiredByRule(field, activeValues, activeSubOption) &&
        !`${value ?? ""}`.trim()
      ) {
        nextErrors[field.key] = "Please enter a value";
      }
    });

    if (showRemarkField && isRemarkRequired && !activeValues.remark.trim()) {
      nextErrors.remark = "Remark is required";
    }

    if (
      activeSubOption.locationChecklist?.required &&
      activeSubOption.canUpdateLocation &&
      !activeValues.updatedLocation
    ) {
      nextErrors.form = "Please update current location";
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

        const itemErrors = {};

        items.forEach((item, itemIndex) => {
          const currentItemErrors = {};

          (group.itemFields || []).forEach((field) => {
            const isRequired = field.required !== false;
            if (isRequired && !`${item[field.key] ?? ""}`.trim()) {
              currentItemErrors[field.key] =
                field.type === "select"
                  ? "Please select an option"
                  : "Please enter a value";
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

    if (photoRequirements.length) {
      const missingRequirements = photoRequirements.filter(
        (requirement) =>
          isRequiredByRule(requirement, activeValues, activeSubOption) &&
          !activeValues.photos?.[requirement.id]?.uri
      );

      if (missingRequirements.length) {
        nextErrors.photos = `Please upload ${missingRequirements.length} required file(s)`;
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

    return Object.keys(nextErrors).length === 0;
  };

  const buildAnswer = (source = {}, value, extra = {}) => ({
    checklist_id: source.checklistId || null,
    description: source.label || source.description || "",
    input_type: source.inputType || extra.input_type || "text",
    data_type: source.dataType || extra.data_type || "varchar",
    input_unit: source.inputUnit ?? null,
    seq_no: source.seqNo ?? null,
    is_required: source.required !== false,
    value,
    ...extra,
  });

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
          (activeValues.repeatableGroups?.[group.key] || []).map(
            (item, index) => ({
              item_index: index + 1,
              values: (group.itemFields || []).map((field) => ({
                key: field.key,
                label: field.label,
                value: item[field.key],
              })),
            })
          ),
          {
            key: group.key,
          }
        )
      );
    });

    photoRequirements.forEach((requirement) => {
      const media = activeValues.photos?.[requirement.id] || null;
      answers.push(
        buildAnswer(requirement, media?.filePath || media?.uri || "", {
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
    const photos = photoRequirements
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
      draft_version: 1,
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
      process_id: section.apiProcessId || null,
      process_description: section.apiDescription || section.title || "",
      process_seq_no: section.apiSeqNo ?? null,
      subprocess_id: activeSubOption.apiSubprocessId || null,
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
        title: "Already submitted",
        message: readOnlyNotice || "This subprocess is already submitted.",
      });
      return;
    }

    if (isSubmitting || !validateForm()) return;

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
      const result = await submitChecklistOfflineFirst({
        deviceType: module,
        section,
        subOption: activeSubOption,
        payload,
      });
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
      console.log("[ChecklistDraft]", "Local save failed", {
        message: error?.message,
        code: error?.code,
        status: error?.status,
      });
      showAppAlert({
        type: "danger",
        title: "Save failed",
        message:
          error?.message ||
          "Unable to save checklist data on this device. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
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
    activeValues,
    activeErrors,
    showStatusField,
    showRemarkField,
    isReadOnly,
    readOnlyNotice,
    isRemarkRequired,
    checklistItems,
    photoRequirements,
    selectFields,
    inputFields,
    repeatableGroups,
    pickerState,
    photoPreviewState,
    isUpdatingLocation,
    isSubmitting,
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
    updateRepeatableGroupItem,
    addRepeatableGroupItem,
    removeRepeatableGroupItem,
    toggleChecklistItem,
    getChecklistProgress,
    openMapForLocation,
    updateNodeLocation,
    pickFromCamera,
    removeSelectedPhoto,
    submitActiveSubOption,
    handleBack,
    getSubOptionLabel,
    openPhotoPreview,
    closePhotoPreview,
    statusOptions: STATUS_OPTIONS,
  };
};

export default useUnitStatusUpdateViewModel;
