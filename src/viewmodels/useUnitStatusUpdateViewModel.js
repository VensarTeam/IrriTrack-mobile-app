import { useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  DEFAULT_NODE_LOCATION,
  MODULE_STATUS_SECTIONS,
  STATUS_OPTIONS,
} from "../constants/moduleStatusConfig";
import { openLocation } from "../services/mapService";
import { showAppAlert } from "../services/alertService";

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

const buildUnitAddressSummary = (unit = {}, baseLocation = DEFAULT_NODE_LOCATION) => {
  const address = [unit.village, unit.distributor, unit.zone]
    .filter(Boolean)
    .join(", ");

  return address || formatCoordinates(baseLocation);
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

const applyModuleText = (value, module) => {
  if (typeof value !== "string" || !module) return value;

  return value.replace(/OMS\/RMS/g, module).replace(/\bOMS\b/g, module);
};

const resolveContextValue = (value, context) =>
  typeof value === "function" ? value(context) : value;

const isVisibleByRule = (item, values, subOption) =>
  !item?.showWhen || item.showWhen({ values, subOption });

const isRequiredByRule = (item, values, subOption) => {
  if (item?.requiredWhen) {
    return item.requiredWhen({ values, subOption });
  }

  return item?.required !== false;
};

const getModuleAwareSections = (module, unit) =>
  MODULE_STATUS_SECTIONS.map((section) => ({
    ...section,
    title: applyModuleText(section.title, module),
    description: applyModuleText(section.description, module),
    subOptions: (section.subOptions || []).map((sub) => ({
      ...sub,
      label: applyModuleText(sub.label, module),
      statusLabel: applyModuleText(sub.statusLabel, module),
      remarkLabel: applyModuleText(sub.remarkLabel, module),
      checklistItems: (sub.checklistItems || []).map((item) => ({
        ...item,
        label: applyModuleText(
          resolveContextValue(item.label, { module, unit }),
          module
        ),
      })),
      photoRequirements: (sub.photoRequirements || []).map((requirement) => ({
        ...requirement,
        label: applyModuleText(requirement.label, module),
      })),
      selectFields: (sub.selectFields || []).map((field) => ({
        ...field,
        label: applyModuleText(field.label, module),
        placeholder: applyModuleText(field.placeholder, module),
      })),
      inputFields: (sub.inputFields || []).map((field) => ({
        ...field,
        label: applyModuleText(field.label, module),
        placeholder: applyModuleText(field.placeholder, module),
      })),
      repeatableGroups: (sub.repeatableGroups || []).map((group) => ({
        ...group,
        title: applyModuleText(group.title, module),
        subtitle: applyModuleText(group.subtitle, module),
        addButtonLabel: applyModuleText(group.addButtonLabel, module),
        itemLabel: applyModuleText(group.itemLabel, module),
        itemFields: (group.itemFields || []).map((field) => ({
          ...field,
          label: applyModuleText(field.label, module),
          placeholder: applyModuleText(field.placeholder, module),
        })),
      })),
    })),
  }));

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

const useUnitStatusUpdateViewModel = (navigation, route) => {
  const module = (route?.params?.module || "OMS").toUpperCase();
  const unit = route?.params?.unit || {};
  const projectName = route?.params?.projectName || "Kayampur Sitamau P.M.I.P";
  const sectionKey = route?.params?.sectionKey || "pipeLaying";
  const requestedSubOptionId = route?.params?.subOptionId;
  const sections = useMemo(
    () => getModuleAwareSections(module, unit),
    [module, unit]
  );

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
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const activeSubOption = useMemo(
    () =>
      section.subOptions.find((sub) => sub.id === activeSubOptionId) ||
      section.subOptions[0],
    [activeSubOptionId, section.subOptions]
  );

  const activeValues = formValues[activeSubOption.id];
  const activeErrors = fieldErrors[activeSubOption.id] || {};
  const unitLabel = unit?.unitNo || `${module}-001`;

  const checklistItems = activeSubOption.checklistItems || [];
  const showStatusField = activeSubOption.showStatusField !== false;
  const showRemarkField = activeSubOption.showRemarkField !== false;

  const selectFields = (activeSubOption.selectFields || []).filter((field) =>
    isVisibleByRule(field, activeValues, activeSubOption)
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

  const getSubOptionLabel = (subOption) => {
    if (subOption.id === "locationFinalization") {
      return `${module} Location Finalization`;
    }

    return subOption.label;
  };

  const activeSubOptionLabel = getSubOptionLabel(activeSubOption);

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

  const updateValuesForSubOption = (subOptionId, updates) => {
    setFormValues((prev) => ({
      ...prev,
      [subOptionId]: {
        ...prev[subOptionId],
        ...updates,
      },
    }));
  };

  const updateActiveValues = (updates) => {
    updateValuesForSubOption(activeSubOption.id, updates);
  };

  const updateInputValue = (field, value) => {
    updateActiveValues({ [field]: value });
    clearFieldError(field);
  };

  const updateRemarkValue = (value) => {
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
    updateActiveValues({
      checks: {
        ...activeValues.checks,
        [itemId]: !activeValues.checks[itemId],
      },
    });

    clearFieldError("remark");
    clearFieldError("form");
  };

  const getCurrentLocation = () =>
    activeValues.updatedLocation || activeValues.defaultLocation;

  const openMapForLocation = async (location) => {
    await openLocation(location.latitude, location.longitude);
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      showAppAlert({
        type: "warning",
        title: "Permission required",
        message: "Location permission is needed to update current location.",
      });
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
    if (isUpdatingLocation) return;

    setIsUpdatingLocation(true);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextLocation = {
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
      };

      const currentSubOptionId = activeSubOption.id;
      const capturedAt = new Date().toLocaleString();

      updateValuesForSubOption(currentSubOptionId, {
        updatedLocation: nextLocation,
        updatedAt: capturedAt,
        updatedAddress: "Resolving address...",
      });

      void getReadableAddress(
        nextLocation.latitude,
        nextLocation.longitude
      ).then((address) => {
        updateValuesForSubOption(currentSubOptionId, {
          updatedAddress: address || "Address unavailable (offline/network issue)",
        });
      });
    } catch (error) {
      showAppAlert({
        type: "danger",
        title: "Location unavailable",
        message: "Unable to fetch current location. Please check location settings.",
      });
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const requestPhotoPermission = async (source) => {
    if (source === "camera") {
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
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      showAppAlert({
        type: "warning",
        title: "Permission required",
        message: "Gallery permission is required.",
      });
      return false;
    }

    return true;
  };

  const setSelectedPhoto = (asset, source, requirement) => {
    if (!asset?.uri) return;

    const fileName = asset.fileName || `${activeSubOption.id}_${Date.now()}.jpg`;
    const sizeKb = asset.fileSize
      ? Math.max(1, Math.round(asset.fileSize / 1024))
      : null;
    const mediaType = asset.type === "video" ? "video" : "image";

    updateActiveValues({
      photos: {
        ...activeValues.photos,
        [requirement.id]: {
          uri: asset.uri,
          name: fileName,
          source,
          sizeKb,
          width: asset.width,
          height: asset.height,
          mediaType,
          takenAt: new Date().toLocaleString(),
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
    const hasPermission = await requestPhotoPermission("camera");
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: requirement.allowVideo
        ? ImagePicker.MediaTypeOptions.All
        : ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled) {
      setSelectedPhoto(result.assets?.[0], "camera", requirement);
    }
  };

  const pickFromGallery = async (requirement) => {
    const hasPermission = await requestPhotoPermission("gallery");
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: requirement.allowVideo
        ? ImagePicker.MediaTypeOptions.All
        : ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
      selectionLimit: 1,
    });

    if (!result.canceled) {
      setSelectedPhoto(result.assets?.[0], "gallery", requirement);
    }
  };

  const showUploadOptions = (requirement) => {
    showAppAlert({
      type: "info",
      title: requirement.label,
      message: "Choose source",
      actions: [
        {
          label: "Camera",
          variant: "primary",
          onPress: () => pickFromCamera(requirement),
        },
        {
          label: "Gallery",
          variant: "secondary",
          onPress: () => pickFromGallery(requirement),
        },
        {
          label: "Cancel",
          variant: "secondary",
        },
      ],
    });
  };

  const removeSelectedPhoto = (requirementId) => {
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

    if (repeatableGroups.length) {
      const repeatableErrors = {};

      repeatableGroups.forEach((group) => {
        const items = activeValues.repeatableGroups?.[group.key] || [];
        const groupError = {};

        if ((group.minItems || 0) > items.length) {
          groupError.message = `Add at least ${group.minItems} ${group.itemLabel || "item"} entry`;
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

  const buildSubmissionPayload = () => ({
    module,
    unitNo: unitLabel,
    sectionKey: section.key,
    subOptionId: activeSubOption.id,
    status: showStatusField ? activeValues.status : "",
    remark: showRemarkField ? activeValues.remark : "",
    checklist: checklistItems.map((item) => ({
      id: item.id,
      label: item.label,
      response: activeValues.checks[item.id] ? 1 : 0,
      checked: activeValues.checks[item.id] ? 1 : 0,
    })),
    selectValues: selectFields.map((field) => ({
      key: field.key,
      label: field.label,
      value: activeValues[field.key],
    })),
    inputValues: inputFields.map((field) => ({
      key: field.key,
      label: field.label,
      value: activeValues[field.key],
    })),
    repeatableValues: repeatableGroups.map((group) => ({
      key: group.key,
      title: group.title,
      items: (activeValues.repeatableGroups?.[group.key] || []).map((item, index) => ({
        itemIndex: index + 1,
        values: (group.itemFields || []).map((field) => ({
          key: field.key,
          label: field.label,
          value: item[field.key],
        })),
      })),
    })),
    photos: photoRequirements
      .map((requirement) => ({
        requirementId: requirement.id,
        requirementLabel: requirement.label,
        ...activeValues.photos?.[requirement.id],
      }))
      .filter((item) => item.uri),
    defaultLocation: activeValues.defaultLocation,
    updatedLocation: activeValues.updatedLocation,
    updatedAt: activeValues.updatedAt,
    submittedAt: new Date().toISOString(),
  });

  const submitActiveSubOption = () => {
    if (!validateForm()) return;

    const payload = buildSubmissionPayload();

    // TODO: API integration point (submit payload).
    void payload;

    const activeIndex = section.subOptions.findIndex(
      (item) => item.id === activeSubOption.id
    );
    const hasNext = activeIndex < section.subOptions.length - 1;

    showAppAlert({
      type: "success",
      title: "Submitted",
      message: `${activeSubOptionLabel} saved successfully.`,
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
    isRemarkRequired,
    checklistItems,
    photoRequirements,
    selectFields,
    inputFields,
    repeatableGroups,
    pickerState,
    photoPreviewState,
    isUpdatingLocation,
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
    getCurrentLocation,
    openMapForLocation,
    updateNodeLocation,
    showUploadOptions,
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
