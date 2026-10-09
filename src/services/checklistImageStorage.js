import ImageResizer from "react-native-image-resizer";
import RNFS from "react-native-fs";
import Marker, {
  ImageFormat,
  Position,
  TextBackgroundType,
} from "react-native-image-marker";

const TARGET_SIZE_BYTES = 500 * 1024;
const RESIZE_ATTEMPTS = [
  { maxWidth: 960, maxHeight: 1280, quality: 70 },
  { maxWidth: 720, maxHeight: 960, quality: 60 },
  { maxWidth: 640, maxHeight: 900, quality: 55 },
  { maxWidth: 540, maxHeight: 720, quality: 48 },
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

const getWatermarkLocationLabel = (location = {}) => {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return "";
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

const sanitizeMarkerFilename = (value = "") =>
  String(value || `checklist_photo_${Date.now()}`)
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || `checklist_photo_${Date.now()}`;

const applyChecklistImageWatermark = async (
  asset,
  {
    takenAt = "",
    captureLocation = null,
  } = {}
) => {
  if (!asset?.uri || !isImageAsset(asset)) {
    return asset;
  }

  const watermarkLines = [takenAt, getWatermarkLocationLabel(captureLocation)].filter(
    Boolean
  );

  if (!watermarkLines.length) {
    return asset;
  }

  const stampedPath = await Marker.markText({
    backgroundImage: {
      src: asset.uri,
      scale: 1,
    },
    watermarkTexts: [
      {
        text: watermarkLines.join("\n"),
        position: {
          position: Position.bottomRight,
        },
        style: {
          color: "#FFFFFF",
          fontSize: 24,
          bold: true,
          textBackgroundStyle: {
            type: TextBackgroundType.none,
            color: "#00000099",
            paddingX: 14,
            paddingY: 10,
            cornerRadius: 12,
          },
        },
      },
    ],
    quality: Math.min(100, Math.max(70, asset.compressionQuality || 85)),
    filename: `${sanitizeMarkerFilename(asset.fileName || asset.name)}_wm`,
    saveFormat: ImageFormat.jpg,
  });

  const filePath = getAssetFilePath({ uri: stampedPath, filePath: stampedPath });
  const fileSize = await getFileSizeBytes(filePath || stampedPath);

  return {
    ...asset,
    uri: toFileUri(filePath || stampedPath),
    filePath,
    fileName: `${sanitizeMarkerFilename(asset.fileName || asset.name)}_wm.jpg`,
    name: `${sanitizeMarkerFilename(asset.fileName || asset.name)}_wm.jpg`,
    fileSize,
    sizeKb: fileSize ? Math.max(1, Math.round(fileSize / 1024)) : asset.sizeKb || null,
    type: "image/jpeg",
    mimeType: "image/jpeg",
    watermarked: true,
  };
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

export const compressChecklistImage = async (
  asset,
  {
    takenAt = "",
    captureLocation = null,
    targetSizeBytes = TARGET_SIZE_BYTES,
  } = {}
) => {
  if (!asset?.uri || !isImageAsset(asset)) {
    return asset;
  }

  const originalFilePath = getAssetFilePath(asset);
  const originalSizeBytes =
    asset.fileSize || (await getFileSizeBytes(originalFilePath || asset.uri));
  const width = Number(asset.width);
  const height = Number(asset.height);
  const isSafeToWatermarkWithoutResize =
    Number.isFinite(width) && Number.isFinite(height) &&
    width > 0 && height > 0 &&
    width <= 1280 && height <= 1280;
  const finalizeWatermarkedAsset = async (candidate) => {
    const marked = await applyChecklistImageWatermark(candidate, {
      takenAt,
      captureLocation,
    });
    if (marked.fileSize > 0 && marked.fileSize <= targetSizeBytes) return marked;

    // The watermark renderer can make an already-compressed image large again.
    // Check the actual upload file and resize it once more when necessary.
    let smallest = marked;
    for (const resizeConfig of RESIZE_ATTEMPTS) {
      const resized = await ImageResizer.createResizedImage(
        marked.uri,
        resizeConfig.maxWidth,
        resizeConfig.maxHeight,
        "JPEG",
        resizeConfig.quality,
        0,
        undefined,
        false,
        { mode: "contain", onlyScaleDown: true }
      );
      const prepared = await buildPhotoAsset(marked, resized, resizeConfig);
      if (prepared.fileSize > 0 &&
          (!smallest.fileSize || prepared.fileSize < smallest.fileSize)) {
        smallest = prepared;
      }
      if (prepared.fileSize > 0 && prepared.fileSize <= targetSizeBytes) {
        return prepared;
      }
    }
    return smallest;
  };

  if (originalSizeBytes > 0 && originalSizeBytes <= targetSizeBytes && isSafeToWatermarkWithoutResize) {
    const normalizedAsset = {
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

    return finalizeWatermarkedAsset(normalizedAsset);
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
      return finalizeWatermarkedAsset(normalizedAsset);
    }
  }

  return finalizeWatermarkedAsset(smallestResult || asset);
};
