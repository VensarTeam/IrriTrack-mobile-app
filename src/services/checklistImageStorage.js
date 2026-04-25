import ImageResizer from "react-native-image-resizer";
import RNFS from "react-native-fs";

const TARGET_SIZE_BYTES = 500 * 1024;
const RESIZE_ATTEMPTS = [
  { maxWidth: 960, maxHeight: 1280, quality: 70 },
  { maxWidth: 720, maxHeight: 960, quality: 60 },
  { maxWidth: 640, maxHeight: 900, quality: 55 },
];

const stripFileScheme = (uri = "") => String(uri).replace(/^file:\/\//, "");

const toFileUri = (path = "") =>
  String(path).startsWith("file://") ? path : `file://${path}`;

const getAssetFilePath = (asset = {}) =>
  stripFileScheme(asset.path || asset.filePath || asset.uri || "");

const getFileSizeBytes = async (pathOrUri) => {
  try {
    const info = await RNFS.stat(stripFileScheme(pathOrUri));
    return Number(info.size || 0);
  } catch (error) {
    return 0;
  }
};

const getFileName = (asset = {}, fallbackPath = "") => {
  if (asset.fileName || asset.name) {
    return asset.fileName || asset.name;
  }

  const pathParts = String(fallbackPath || asset.uri || "").split("/");
  return pathParts[pathParts.length - 1] || `checklist_photo_${Date.now()}.jpg`;
};

const buildPhotoAsset = async (asset, resized, resizeConfig) => {
  const filePath = getAssetFilePath(resized);
  const sizeBytes = resized.size || (await getFileSizeBytes(filePath));

  return {
    ...asset,
    uri: resized.uri || toFileUri(filePath),
    filePath,
    fileName: getFileName(resized, filePath),
    name: getFileName(resized, filePath),
    fileSize: sizeBytes,
    sizeKb: sizeBytes ? Math.max(1, Math.round(sizeBytes / 1024)) : null,
    width: resized.width || asset.width,
    height: resized.height || asset.height,
    type: "image/jpeg",
    mimeType: "image/jpeg",
    compressed: true,
    compressionQuality: resizeConfig.quality,
    compressionMaxWidth: resizeConfig.maxWidth,
  };
};

const isImageAsset = (asset = {}) =>
  asset.type !== "video" &&
  !String(asset.mimeType || asset.type || "").toLowerCase().startsWith("video/");

export const compressChecklistImage = async (asset) => {
  if (!asset?.uri || !isImageAsset(asset)) {
    return asset;
  }

  const originalFilePath = getAssetFilePath(asset);
  const originalSizeBytes =
    asset.fileSize || (await getFileSizeBytes(originalFilePath || asset.uri));

  if (originalSizeBytes > 0 && originalSizeBytes <= TARGET_SIZE_BYTES) {
    return {
      ...asset,
      uri: asset.uri,
      filePath: originalFilePath,
      fileName: getFileName(asset, originalFilePath),
      name: getFileName(asset, originalFilePath),
      fileSize: originalSizeBytes,
      sizeKb: Math.max(1, Math.round(originalSizeBytes / 1024)),
      width: asset.width,
      height: asset.height,
      type: asset.mimeType || asset.type || "image/jpeg",
      mimeType: asset.mimeType || asset.type || "image/jpeg",
      compressed: false,
    };
  }

  let smallestResult = null;

  for (const resizeConfig of RESIZE_ATTEMPTS) {
    const resized = await ImageResizer.createResizedImage(
      asset.uri,
      resizeConfig.maxWidth,
      resizeConfig.maxHeight,
      "JPEG",
      resizeConfig.quality,
      0,
      undefined,
      false,
      {
        mode: "contain",
        onlyScaleDown: true,
      }
    );
    const normalizedAsset = await buildPhotoAsset(asset, resized, resizeConfig);
    const currentSize = normalizedAsset.fileSize || Number.MAX_SAFE_INTEGER;
    const smallestSize = smallestResult?.fileSize || Number.MAX_SAFE_INTEGER;

    if (!smallestResult || currentSize < smallestSize) {
      smallestResult = normalizedAsset;
    }

    if (currentSize > 0 && currentSize <= TARGET_SIZE_BYTES) {
      return normalizedAsset;
    }
  }

  return smallestResult || asset;
};
