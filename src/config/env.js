const DEFAULT_API_BASE_URL = "https://pmt.aizainfotech.online";
const DEFAULT_ASSET_BASE_URL =
  "https://vensar-tools-700305705692-ap-south-1-an.s3.ap-south-1.amazonaws.com";

const sanitizeBaseUrl = (value) => {
  const normalizedValue =
    typeof value === "string" && value.trim()
      ? value.trim()
      : DEFAULT_API_BASE_URL;

  return normalizedValue.replace(/\/+$/, "");
};

export const API_BASE_URL = sanitizeBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL
);

export const ASSET_BASE_URL = sanitizeBaseUrl(
  process.env.EXPO_PUBLIC_ASSET_BASE_URL || DEFAULT_ASSET_BASE_URL
);

export const resolveApiUrl = (path = "") => {
  const normalizedPath = String(path).replace(/^\/+/, "");
  return `${API_BASE_URL}/${normalizedPath}`;
};

export const resolveAssetUrl = (path = "") => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = String(path).replace(/^\/+/, "");
  return `${ASSET_BASE_URL}/${normalizedPath}`;
};
