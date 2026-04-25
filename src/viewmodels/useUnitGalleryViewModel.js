import { useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { showAppAlert } from "../services/alertService";

const DEFAULT_PROJECT = "IrriTrack";

const formatTimestamp = (value) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleString();
};

const isSameDay = (a, b) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const normalizeIncomingPhotos = (incoming = []) =>
  incoming
    .map((item, index) => {
      const uri = typeof item === "string" ? item : item?.uri;
      if (!uri) return null;

      const createdAt =
        typeof item === "object" && item?.createdAt
          ? Number(item.createdAt)
          : Date.now() - index * 300000;

      return {
        id: typeof item === "object" && item?.id ? item.id : `photo_${createdAt}_${index}`,
        uri,
        title:
          typeof item === "object" && item?.title
            ? item.title
            : `Photo ${index + 1}`,
        createdAt,
        meta:
          typeof item === "object" && item?.meta
            ? item.meta
            : formatTimestamp(createdAt),
      };
    })
    .filter(Boolean);

const useUnitGalleryViewModel = (navigation, route) => {
  const module = (route?.params?.module || "OMS").toUpperCase();
  const unit = route?.params?.unit || {};
  const projectName = route?.params?.projectName || DEFAULT_PROJECT;

  const [photos, setPhotos] = useState(() =>
    normalizeIncomingPhotos(route?.params?.photos)
  );
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const unitLabel = unit?.unitNo || `${module}-001`;
  const locationLine = [unit?.village, unit?.distributor, unit?.zone]
    .filter(Boolean)
    .join(" • ");

  const summary = useMemo(() => {
    const now = new Date();
    const todayCount = photos.filter((photo) =>
      isSameDay(new Date(photo.createdAt), now)
    ).length;

    return [
      { key: "photos", label: "Total", value: photos.length },
      { key: "today", label: "Today", value: todayCount },
      { key: "sync", label: "Synced", value: photos.length },
    ];
  }, [photos]);

  const requestPickerPermission = async (source) => {
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === "granted") return true;

      showAppAlert({
        type: "warning",
        title: "Permission required",
        message: "Camera permission is required to capture photo.",
      });
      return false;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === "granted") return true;

    showAppAlert({
      type: "warning",
      title: "Permission required",
      message: "Gallery permission is required to select photo.",
    });
    return false;
  };

  const pickPhoto = async (source) => {
    const hasPermission = await requestPickerPermission(source);
    if (!hasPermission) return;

    const picker =
      source === "camera"
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

    const result = await picker({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
      allowsEditing: false,
      selectionLimit: 1,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    const createdAt = Date.now();

    setPhotos((prev) => [
      {
        id: `photo_${createdAt}`,
        uri: asset.uri,
        title: `Photo ${prev.length + 1}`,
        createdAt,
        meta: formatTimestamp(createdAt),
      },
      ...prev,
    ]);
  };

  const openAddPhoto = () => {
    showAppAlert({
      type: "info",
      title: "Add Photo",
      message: "Choose photo source",
      actions: [
        {
          label: "Camera",
          variant: "primary",
          onPress: () => pickPhoto("camera"),
        },
        {
          label: "Gallery",
          variant: "secondary",
          onPress: () => pickPhoto("gallery"),
        },
        {
          label: "Cancel",
          variant: "secondary",
        },
      ],
    });
  };

  const openViewer = (index) => {
    if (!photos.length) return;
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const closeViewer = () => {
    setViewerVisible(false);
  };

  return {
    module,
    unitLabel,
    projectName,
    locationLine,
    summary,
    photos,
    openAddPhoto,
    viewerVisible,
    viewerIndex,
    setViewerIndex,
    openViewer,
    closeViewer,
    handleBack: () => navigation.goBack(),
  };
};

export default useUnitGalleryViewModel;
