import { apiRequestWithMeta } from "./apiClient";
import { API_ENDPOINTS, IMAGE_BASE_URL } from "../config/env";

const FILE_STORAGE_BASE_URL = IMAGE_BASE_URL;

export const DEFAULT_OMS_GALLERY_PAGE = 1;
export const DEFAULT_OMS_GALLERY_LIMIT = 50;

const createEmptyGalleryResponse = ({
  page = DEFAULT_OMS_GALLERY_PAGE,
  limit = DEFAULT_OMS_GALLERY_LIMIT,
} = {}) => ({
  success: true,
  data: [],
  meta: {
    page,
    limit,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
});

const toDisplayTimestamp = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString();
};

const toDisplayDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString();
};

const parseJsonValue = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (
    (!trimmedValue.startsWith("{") || !trimmedValue.endsWith("}")) &&
    (!trimmedValue.startsWith("[") || !trimmedValue.endsWith("]"))
  ) {
    return null;
  }

  try {
    return JSON.parse(trimmedValue);
  } catch (error) {
    return null;
  }
};

const getNestedObjectKey = (source = {}) =>
  source?.objectKey ||
  source?.object_key ||
  source?.imageUrl ||
  source?.image_url ||
  source?.key ||
  source?.path ||
  source?.metadata?.objectKey ||
  source?.metadata?.object_key ||
  source?.metadata?.imageUrl ||
  source?.metadata?.image_url ||
  source?.file?.objectKey ||
  source?.file?.object_key ||
  source?.file?.imageUrl ||
  source?.file?.image_url ||
  "";

const isProbableObjectKey = (value = "") => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue || /\s/.test(normalizedValue)) {
    return false;
  }

  return (
    normalizedValue.includes("/") ||
    /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i.test(normalizedValue)
  );
};

const resolveObjectKeyUrl = (objectKey = "") => {
  const normalizedObjectKey = String(objectKey || "").trim();

  if (!normalizedObjectKey) {
    return "";
  }

  return `${FILE_STORAGE_BASE_URL}${normalizedObjectKey.replace(/^\/+/, "")}`;
};

const getImageUri = (item = {}) => {

  const objectKeyUrl = resolveObjectKeyUrl(getNestedObjectKey(item));
  if (objectKeyUrl) {
    return objectKeyUrl;
  }
  
  const parsedValue =
  parseJsonValue(item?.value) ||
  parseJsonValue(item?.file) ||
  parseJsonValue(item?.metadata);
  
  if (parsedValue && typeof parsedValue === "object") {
    return getImageUri(parsedValue);
  }  
  const rawValue = String(item?.value || "").trim();
  if (rawValue.startsWith("http://") || rawValue.startsWith("https://")) {
    return rawValue;
  }

  return isProbableObjectKey(rawValue) ? resolveObjectKeyUrl(rawValue) : "";
};

const getImageTitle = (item = {}, index = 0) =>
  String(
    item?.title ||
      item?.imageTitle ||
      item?.imageName ||
      item?.fileName ||
      item?.filename ||
      item?.name ||
      (item?.source === "resubmit"
        ? "Resubmitted Image"
        : item?.checklistId
          ? `Checklist ${item.checklistId}`
          : "") ||
      item?.checklistName ||
      item?.description ||
      `Photo ${index + 1}`
  ).trim();

const getChecklistName = (item = {}) =>
  String(
    item?.checklistName ||
      item?.checklist_name ||
      item?.checkListName ||
      item?.metadata?.checklistName ||
      item?.metadata?.checklist_name ||
      ""
  ).trim();

const getImageMeta = (item = {}, createdAt) => {
  const timestampLabel = toDisplayTimestamp(createdAt);
  const sourceLabel =
    item?.source === "resubmit"
      ? "Resubmit"
      : item?.source === "checklist"
        ? "Checklist"
        : "";

  if (sourceLabel && timestampLabel) {
    return `${sourceLabel} - ${timestampLabel}`;
  }

  if (timestampLabel) {
    return timestampLabel;
  }

  return String(
    sourceLabel ||
    item?.uploadedByName ||
      item?.createdByName ||
      item?.updatedByName ||
      item?.remark ||
      item?.comments ||
      "Uploaded image"
  ).trim();
};

const normalizeGalleryImage = (item = {}, index = 0) => {
  const imageUri = getImageUri(item);
  if (!imageUri) {
    return null;
  }

  const createdAt =
    item?.createdAt ||
    item?.created_at ||
    item?.uploadedAt ||
    item?.uploaded_at ||
    item?.updatedAt ||
    item?.updated_at ||
    "";

  return {
    id: String(
      item?.id ||
        item?.imageId ||
        item?.galleryId ||
        item?.fileId ||
        getNestedObjectKey(item) ||
        `${imageUri}-${index}`
    ),
    uri: imageUri,
    title: getImageTitle(item, index),
    checklistName: getChecklistName(item),
    createdAt: createdAt ? new Date(createdAt).getTime() : Date.now() - index * 1000,
    dateLabel: toDisplayDate(createdAt),
    meta: getImageMeta(item, createdAt),
    raw: item,
  };
};

const normalizeGalleryItems = (response = {}) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.images)) {
    return response.images;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
};

const fetchImageGallery = async ({ params }) => {
  return apiRequestWithMeta({
    url: API_ENDPOINTS.omsImageGallery,
    method: "GET",
    headers: {
      Accept: "*/*",
    },
    params,
  });
};

const normalizeDeviceName = (deviceName = "", deviceType = "OMS") => {
  const normalizedDeviceName = String(deviceName || "").trim();
  const normalizedDeviceType = String(deviceType || "")
    .trim()
    .toUpperCase();

  if (!normalizedDeviceName || !normalizedDeviceType) {
    return normalizedDeviceName;
  }

  const prefixedDeviceName = `${normalizedDeviceType}-`;

  return normalizedDeviceName.toUpperCase().startsWith(prefixedDeviceName)
    ? normalizedDeviceName.slice(prefixedDeviceName.length)
    : normalizedDeviceName;
};

export const fetchOmsImageGallery = async ({
  projectId,
  deviceType = "OMS",
  deviceName,
  page = DEFAULT_OMS_GALLERY_PAGE,
  limit = DEFAULT_OMS_GALLERY_LIMIT,
} = {}) => {
  const normalizedProjectId = String(projectId || "").trim();
  const normalizedDeviceType = String(deviceType || "OMS").trim().toUpperCase();
  const normalizedDeviceName = normalizeDeviceName(deviceName, normalizedDeviceType);

  if (!normalizedProjectId || !normalizedDeviceName) {
    return createEmptyGalleryResponse({ page, limit });
  }

  const response = await fetchImageGallery({
    params: {
      projectId: normalizedProjectId,
      deviceType: normalizedDeviceType,
      deviceName: normalizedDeviceName,
      page,
      limit,
    },
  });
  const items = normalizeGalleryItems(response);

  return {
    success: response?.success !== false,
    data: items.map((item, index) => normalizeGalleryImage(item, index)).filter(Boolean),
    meta: response?.meta || createEmptyGalleryResponse({ page, limit }).meta,
  };
};
