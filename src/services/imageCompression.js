import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { getInfoAsync } from "expo-file-system/legacy";

const DEFAULT_MAX_IMAGE_SIZE_BYTES = 700 * 1024;
const IMAGE_COMPRESSION_LOGS_ENABLED =
  typeof __DEV__ === "undefined" || __DEV__;
const JPEG_QUALITY_STEPS = [0.92, 0.88, 0.82, 0.76, 0.7, 0.64, 0.58, 0.52];
const RESIZE_WIDTH_STEPS = [1600, 1440, 1280, 1024, 768];

const getFileSize = async (uri) => {
  const fileInfo = await getInfoAsync(uri);

  return fileInfo.exists && typeof fileInfo.size === "number"
    ? fileInfo.size
    : 0;
};

const toKb = (bytes) => Math.round(bytes / 1024);

const getResizeWidths = (sourceWidth) => {
  const maxWidth =
    typeof sourceWidth === "number" && Number.isFinite(sourceWidth)
      ? sourceWidth
      : RESIZE_WIDTH_STEPS[0];
  const widths = RESIZE_WIDTH_STEPS.filter((width) => width <= maxWidth);

  return widths.length > 0 ? widths : [Math.round(maxWidth)];
};

const withCompressionMetadata = (image, size) => ({
  ...image,
  size,
  sizeKb: toKb(size),
  type: "image/jpeg",
});

const logCompression = (message, data = {}) => {
  if (!IMAGE_COMPRESSION_LOGS_ENABLED) return;

  console.log(`[IMAGE] ${message}`, data);
};

export const compressImageToMaxSize = async (
  image,
  { maxSizeBytes = DEFAULT_MAX_IMAGE_SIZE_BYTES } = {}
) => {
  if (!image?.uri) {
    throw new Error("Image is missing.");
  }

  const originalSize = await getFileSize(image.uri);

  if (originalSize > 0 && originalSize <= maxSizeBytes) {
    logCompression("Already under limit", {
      sizeKb: toKb(originalSize),
      limitKb: toKb(maxSizeBytes),
      width: image.width,
      height: image.height,
      isMirrored: image.isMirrored,
      orientation: image.orientation,
    });
    return withCompressionMetadata(image, originalSize);
  }

  let bestImage = null;
  let bestSize = originalSize || Number.POSITIVE_INFINITY;

  for (const width of getResizeWidths(image.width)) {
    for (const quality of JPEG_QUALITY_STEPS) {
      const compressed = await manipulateAsync(
        image.uri,
        [{ resize: { width } }],
        {
          compress: quality,
          format: SaveFormat.JPEG,
        }
      );
      const compressedSize = await getFileSize(compressed.uri);

      if (compressedSize > 0 && compressedSize < bestSize) {
        bestImage = compressed;
        bestSize = compressedSize;
      }

      logCompression("Compressed attempt", {
        width,
        quality,
        sizeKb: toKb(compressedSize),
        limitKb: toKb(maxSizeBytes),
        sourceWidth: image.width,
        sourceHeight: image.height,
        isMirrored: image.isMirrored,
        orientation: image.orientation,
      });

      if (compressedSize > 0 && compressedSize <= maxSizeBytes) {
        return withCompressionMetadata(
          {
            ...image,
            uri: compressed.uri,
            width: compressed.width,
            height: compressed.height,
          },
          compressedSize
        );
      }
    }
  }

  if (bestImage && bestSize <= maxSizeBytes) {
    return withCompressionMetadata(
      {
        ...image,
        uri: bestImage.uri,
        width: bestImage.width,
        height: bestImage.height,
      },
      bestSize
    );
  }

  throw new Error(
    `Unable to reduce image below ${toKb(maxSizeBytes)} KB. Please retake the photo.`
  );
};

export const compressFaceImage = (image) =>
  compressImageToMaxSize(image, {
    maxSizeBytes: DEFAULT_MAX_IMAGE_SIZE_BYTES,
  });
