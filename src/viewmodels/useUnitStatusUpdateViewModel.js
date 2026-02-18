import { useMemo, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  DEFAULT_NODE_LOCATION,
  MODULE_STATUS_SECTIONS,
  PIPE_SIZE_OPTIONS,
  STATUS_OPTIONS,
} from "../constants/moduleStatusConfig";
import { openLocation } from "../services/mapService";

const getInitialFormValues = (section, unit) => {
  const baseLocation = {
    latitude: unit?.latitude || DEFAULT_NODE_LOCATION.latitude,
    longitude: unit?.longitude || DEFAULT_NODE_LOCATION.longitude,
  };

  return section.subOptions.reduce((acc, sub) => {
    acc[sub.id] = {
      status: "Pending",
      pipeSize: PIPE_SIZE_OPTIONS[0],
      remark: "",
      photo: null,
      defaultLocation: baseLocation,
      updatedLocation: null,
      updatedAt: null,
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
  const [photoPreviewVisible, setPhotoPreviewVisible] = useState(false);

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

  const getSubOptionLabel = (subOption) => {
    if (subOption.id === "locationFinalization") {
      return `${module} Location Finalization`;
    }

    return subOption.label;
  };

  const activeSubOptionLabel = getSubOptionLabel(activeSubOption);

  const updateActiveValues = (updates) => {
    setFormValues((prev) => ({
      ...prev,
      [activeSubOption.id]: {
        ...prev[activeSubOption.id],
        ...updates,
      },
    }));
  };

  const openSelectModal = (field) => {
    if (field === "status") {
      setPickerState({
        visible: true,
        field,
        title: "Select Status",
        options: STATUS_OPTIONS,
      });
      return;
    }

    setPickerState({
      visible: true,
      field,
      title: "Select Pipe Size",
      options: PIPE_SIZE_OPTIONS,
    });
  };

  const selectPickerValue = (value) => {
    updateActiveValues({ [pickerState.field]: value });
    setFieldErrors((prev) => ({
      ...prev,
      [activeSubOption.id]: {
        ...(prev[activeSubOption.id] || {}),
        [pickerState.field]: null,
      },
    }));
    setPickerState((prev) => ({ ...prev, visible: false }));
  };

  const closePicker = () => {
    setPickerState((prev) => ({ ...prev, visible: false }));
  };

  const getCurrentLocation = () =>
    activeValues.updatedLocation || activeValues.defaultLocation;

  const openMapForLocation = async (location) => {
    await openLocation(location.latitude, location.longitude);
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Location permission is needed to update current location."
      );
      return false;
    }

    return true;
  };

  const updateNodeLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const nextLocation = {
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
      };

      updateActiveValues({
        updatedLocation: nextLocation,
        updatedAt: new Date().toLocaleString(),
      });
    } catch (error) {
      Alert.alert(
        "Location unavailable",
        "Unable to fetch current location. Please check location settings."
      );
    }
  };

  const requestPhotoPermission = async (source) => {
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission required", "Camera permission is required.");
        return false;
      }

      return true;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission required", "Gallery permission is required.");
      return false;
    }

    return true;
  };

  const setSelectedPhoto = (asset, source) => {
    if (!asset?.uri) return;

    const fileName = asset.fileName || `${activeSubOption.id}_${Date.now()}.jpg`;
    const sizeKb = asset.fileSize ? Math.max(1, Math.round(asset.fileSize / 1024)) : null;

    updateActiveValues({
      photo: {
        uri: asset.uri,
        name: fileName,
        source,
        sizeKb,
        width: asset.width,
        height: asset.height,
      },
    });

    setFieldErrors((prev) => ({
      ...prev,
      [activeSubOption.id]: {
        ...(prev[activeSubOption.id] || {}),
        photo: null,
      },
    }));
  };

  const pickFromCamera = async () => {
    const hasPermission = await requestPhotoPermission("camera");
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled) {
      setSelectedPhoto(result.assets?.[0], "camera");
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPhotoPermission("gallery");
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
      selectionLimit: 1,
    });

    if (!result.canceled) {
      setSelectedPhoto(result.assets?.[0], "gallery");
    }
  };

  const showUploadOptions = () => {
    Alert.alert("Upload Photo", "Choose source", [
      { text: "Camera", onPress: pickFromCamera },
      { text: "Gallery", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openPhotoPreview = () => {
    if (!activeValues.photo?.uri) return;
    setPhotoPreviewVisible(true);
  };

  const closePhotoPreview = () => {
    setPhotoPreviewVisible(false);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!shouldHideStatusRemark && !activeValues.status) {
      nextErrors.status = "Please select status";
    }

    if (activeSubOption.needsPipeSize && !activeValues.pipeSize) {
      nextErrors.pipeSize = "Please select pipe size";
    }

    if (activeSubOption.needsPhoto && !activeValues.photo?.uri) {
      nextErrors.photo = "Please upload one photo";
    }

    setFieldErrors((prev) => ({
      ...prev,
      [activeSubOption.id]: nextErrors,
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const submitActiveSubOption = () => {
    if (!validateForm()) return;

    const activeIndex = section.subOptions.findIndex(
      (item) => item.id === activeSubOption.id
    );
    const hasNext = activeIndex < section.subOptions.length - 1;

    Alert.alert("Submitted", `${activeSubOptionLabel} updated successfully.`, [
      {
        text: hasNext ? "Next" : "Done",
        onPress: () => {
          if (hasNext) {
            setActiveSubOptionId(section.subOptions[activeIndex + 1].id);
          } else {
            navigation.goBack();
          }
        },
      },
    ]);
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
    setActiveSubOptionId,
    activeValues,
    activeErrors,
    shouldHideStatusRemark,
    pickerState,
    openSelectModal,
    selectPickerValue,
    closePicker,
    updateActiveValues,
    getCurrentLocation,
    openMapForLocation,
    updateNodeLocation,
    showUploadOptions,
    submitActiveSubOption,
    handleBack,
    getSubOptionLabel,
    photoPreviewVisible,
    openPhotoPreview,
    closePhotoPreview,
  };
};

export default useUnitStatusUpdateViewModel;
