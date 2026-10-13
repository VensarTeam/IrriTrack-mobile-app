import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";

export const photoSaveNeedsPermission = () =>
  // SDK 54 MediaLibrary still checks write permission on Android <= 12L.
  Platform.OS !== "android" || Number(Platform.Version) < 33;

export const getPhotoSavePermission = async () =>
  photoSaveNeedsPermission()
    ? MediaLibrary.getPermissionsAsync(true, ["photo"])
    : { granted: true, status: "granted" };

export const requestPhotoSavePermission = async () =>
  photoSaveNeedsPermission()
    ? MediaLibrary.requestPermissionsAsync(true, ["photo"])
    : { granted: true, status: "granted" };

const normalizeUri = (value = "") => String(value || "").trim();

const toAssetUri = (media = {}) =>
  normalizeUri(media.uri || media.filePath || media.local_uri);

export const saveChecklistMediaToDeviceGallery = async ({
  mediaItems = [],
} = {}) => {
  const itemsToSave = (mediaItems || []).filter(
    (item) =>
      item &&
      !item.savedToDeviceGallery &&
      (item.mediaType || "image") === "image" &&
      toAssetUri(item)
  );

  if (!itemsToSave.length) {
    return {
      savedCount: 0,
      skipped: true,
      denied: false,
      savedUris: [],
    };
  }

  const permission = await requestPhotoSavePermission();

  if (permission.status !== "granted") {
    return {
      savedCount: 0,
      skipped: false,
      denied: true,
      savedUris: [],
    };
  }

  const savedUris = [];

  for (const item of itemsToSave) {
    await MediaLibrary.saveToLibraryAsync(toAssetUri(item));
    savedUris.push(toAssetUri(item));
  }

  return {
    savedCount: savedUris.length,
    skipped: false,
    denied: false,
    savedUris,
  };
};
