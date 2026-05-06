const DEFAULT_API_BASE_URL = "https://irritrack.vensar.com";//"https://pmt.aizainfotech.online";
const DEVELOPMENT_API_BASE_URL = "https://irritrack.vensar.com/dev";//"https://pmt.aizainfotech.online";
const DEFAULT_ASSET_BASE_URL =
  "https://vensar-tools-700305705692-ap-south-1-an.s3.ap-south-1.amazonaws.com";
const DEFAULT_CHECKLIST_SUBMIT_PATH = "/api/v1/checklists/submissions";
const APP_ENV = String(
  process.env.EXPO_PUBLIC_APP_ENV || process.env.APP_ENV || "development"
)
  .trim()
  .toLowerCase();

const ENVIRONMENT_DEFAULTS = {
  production: {
    apiBaseUrl: DEFAULT_API_BASE_URL,
    assetBaseUrl: DEFAULT_ASSET_BASE_URL,
  },
  development: {
    apiBaseUrl: DEVELOPMENT_API_BASE_URL,
    assetBaseUrl: DEFAULT_ASSET_BASE_URL,
  },
};

const ACTIVE_ENVIRONMENT =
  ENVIRONMENT_DEFAULTS[APP_ENV] || ENVIRONMENT_DEFAULTS.development;

const sanitizeBaseUrl = (value) => {
  const normalizedValue =
    typeof value === "string" && value.trim()
      ? value.trim()
      : ACTIVE_ENVIRONMENT.apiBaseUrl;

  return normalizedValue.replace(/\/+$/, "");
};

export const APP_ENV_NAME =
  APP_ENV === "production" ? "production" : "development";
export const IS_PRODUCTION_ENV = APP_ENV_NAME === "production";

export const API_BASE_URL = sanitizeBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL || ACTIVE_ENVIRONMENT.apiBaseUrl
);

export const ASSET_BASE_URL = sanitizeBaseUrl(
  process.env.EXPO_PUBLIC_ASSET_BASE_URL || ACTIVE_ENVIRONMENT.assetBaseUrl
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
