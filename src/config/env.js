// Copy one of these and replace API_BASE_URL manually when switching servers:
// https://irritrack.vensar.com
// https://irritrack.vensar.com/dev
// https://pmt.aizainfotech.online
export const API_BASE_URL = "https://irritrack.vensar.com/dev";

const DEFAULT_ASSET_BASE_URL =
  "https://vensar-tools-700305705692-ap-south-1-an.s3.ap-south-1.amazonaws.com";
const DEFAULT_CHECKLIST_SUBMIT_PATH = "/api/v1/checklists/submissions";

const sanitizeBaseUrl = (value) => {
  const normalizedValue =
    typeof value === "string" && value.trim()
      ? value.trim()
      : "";

  return normalizedValue.replace(/\/+$/, "");
};

export const APP_ENV_NAME = "manual";
export const IS_PRODUCTION_ENV = false;

export const ASSET_BASE_URL = sanitizeBaseUrl(
  process.env.EXPO_PUBLIC_ASSET_BASE_URL || DEFAULT_ASSET_BASE_URL
);

export const CHECKLIST_SUBMIT_PATH =
  process.env.EXPO_PUBLIC_CHECKLIST_SUBMIT_PATH || DEFAULT_CHECKLIST_SUBMIT_PATH;

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
