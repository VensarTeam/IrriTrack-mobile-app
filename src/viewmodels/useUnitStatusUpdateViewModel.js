import { useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  CONTRACTOR_OPTIONS,
  DEFAULT_NODE_LOCATION,
  MODULE_STATUS_SECTIONS,
  PIPE_SIZE_OPTIONS,
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
    acc[field.key] = "";
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

const getInitialFormValues = (section, unit) => {
  const baseLocation = {
    latitude: unit?.latitude || DEFAULT_NODE_LOCATION.latitude,
    longitude: unit?.longitude || DEFAULT_NODE_LOCATION.longitude,
  };

  return section.subOptions.reduce((acc, sub) => {
    acc[sub.id] = {
      status: sub.hideStatusRemark ? "" : "Pending",
      pipeSize: "",
      contractor: "",
      remark: "",
      checks: buildChecklistState(sub.checklistItems),
      photos: buildPhotoState(sub.photoRequirements),
      defaultLocation: baseLocation,
      defaultAddress: buildUnitAddressSummary(unit, baseLocation),
      updatedLocation: null,
      updatedAddress: "",
      updatedAt: null,
      ...buildSelectFieldState(sub.selectFields),
    };

    return acc;
  }, {});
};

const useUnitStatusUpdateViewModel = (navigation, route) => {
  const module = route?.params?.module || "OMS";
  const unit = route?.params?.unit || {};
  const projectName = route?.params?.projectName || "Kayampur Sitamau P.M.I.P";
  const sectionKey = route?.params?.sectionKey || "pipeLaying";
  const requestedSubOptionId = route?.params?.subOptionId;

  const section =
    MODULE_STATUS_SECTIONS.find((item) => item.key === sectionKey) ||
    MODULE_STATUS_SECTIONS[0];

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
  const shouldHideStatusRemark = !!activeSubOption.hideStatusRemark;
  const unitLabel = unit?.unitNo || `${module}-001`;

  const checklistItems = activeSubOption.checklistItems || [];
  const photoRequirements = activeSubOption.photoRequirements || [];
  const selectFields = activeSubOption.selectFields || [];

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

  const clearFieldError = (field) => {
    setFieldErrors((prev) => ({
      ...prev,
      [activeSubOption.id]: {
        ...(prev[activeSubOption.id] || {}),
        [field]: null,
      },
    }));
  };

  const openSelectModal = ({ field, title, options }) => {
    setPickerState({
      visible: true,
      field,
      title,
      options,
    });
  };

  const selectPickerValue = (value) => {
    updateActiveValues({ [pickerState.field]: value });
    clearFieldError(pickerState.field);
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

      // Persist core location immediately for fast field feedback,
      // then resolve address in background.
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

    if (!shouldHideStatusRemark && !activeValues.status) {
      nextErrors.status = "Please select status";
    }

    if (activeSubOption.needsPipeSize && !activeValues.pipeSize) {
      nextErrors.pipeSize = "Please select pipe size";
    }

    if (activeSubOption.needsContractor && !activeValues.contractor) {
      nextErrors.contractor = "Please select contractor";
    }

    selectFields.forEach((field) => {
      const isRequired = field.required !== false;
      if (isRequired && !activeValues[field.key]) {
        nextErrors[field.key] = "Please select an option";
      }
    });

    if (photoRequirements.length) {
      const missingRequirements = photoRequirements.filter(
        (requirement) => !activeValues.photos?.[requirement.id]?.uri
      );

      if (missingRequirements.length) {
        nextErrors.photos = `Please upload ${missingRequirements.length} required file(s)`;
        nextErrors.photoSlots = missingRequirements.reduce((acc, requirement) => {
          acc[requirement.id] = "Required";
          return acc;
        }, {});
      }
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
    status: activeValues.status,
    pipeSize: activeValues.pipeSize,
    contractor: activeValues.contractor,
    remark: activeValues.remark,
    checklist: checklistItems.map((item) => ({
      id: item.id,
      label: item.label,
      checked: !!activeValues.checks[item.id],
    })),
    selectValues: selectFields.map((field) => ({
      key: field.key,
      label: field.label,
      value: activeValues[field.key],
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
    shouldHideStatusRemark,
    checklistItems,
    photoRequirements,
    selectFields,
    pickerState,
    setActiveSubOptionId,
    openSelectModal,
    selectPickerValue,
    closePicker,
    updateActiveValues,
    toggleChecklistItem,
    getChecklistProgress,
    getCurrentLocation,
    openMapForLocation,
    updateNodeLocation,
    isUpdatingLocation,
    showUploadOptions,
    removeSelectedPhoto,
    submitActiveSubOption,
    handleBack,
    getSubOptionLabel,
    photoPreviewState,
    openPhotoPreview,
    closePhotoPreview,
    statusOptions: STATUS_OPTIONS,
    pipeSizeOptions: activeSubOption.pipeSizeOptions || PIPE_SIZE_OPTIONS,
    contractorOptions: CONTRACTOR_OPTIONS,
  };
};

export default useUnitStatusUpdateViewModel;
