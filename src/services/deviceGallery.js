import * as MediaLibrary from "expo-media-library";

const normalizeUri = (value = "") => String(value || "").trim();

const toAssetUri = (media = {}) =>
  normalizeUri(media.uri || media.filePath || media.local_uri);

const buildAlbumName = (module = "OMS") =>
  `${String(module || "OMS").trim().toUpperCase()} Checklist`;

const ensureAlbum = async (albumName) => {
  const existingAlbum = await MediaLibrary.getAlbumAsync(albumName);

  if (existingAlbum) {
    return existingAlbum;
  }

  return null;
};

export const saveChecklistMediaToDeviceGallery = async ({
  mediaItems = [],
  module = "OMS",
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

  const permission = await MediaLibrary.requestPermissionsAsync();

  if (permission.status !== "granted") {
    return {
      savedCount: 0,
      skipped: false,
      denied: true,
      savedUris: [],
    };
  }

  const albumName = buildAlbumName(module);
  let album = await ensureAlbum(albumName);
  const savedUris = [];

  for (const item of itemsToSave) {
    const asset = await MediaLibrary.createAssetAsync(toAssetUri(item));

    if (!album) {
      album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }

    savedUris.push(toAssetUri(item));
  }

  return {
    savedCount: savedUris.length,
    skipped: false,
    denied: false,
    savedUris,
  };
};
