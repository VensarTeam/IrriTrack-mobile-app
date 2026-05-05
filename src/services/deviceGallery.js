import * as MediaLibrary from "expo-media-library";

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

  const permission = await MediaLibrary.requestPermissionsAsync(true);

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
