export const APP_ENV_NAME = process.env.EXPO_PUBLIC_APP_ENV_NAME || "manual";
export const IS_PRODUCTION_ENV = process.env.EXPO_PUBLIC_IS_PRODUCTION_ENV === "true";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
export const APP_VERSION_APP_ID =
  process.env.EXPO_PUBLIC_APP_VERSION_APP_ID || "11";

// export const ASSET_BASE_URL = process.env.EXPO_PUBLIC_ASSET_BASE_URL; // Using B3 Image URL for assets as well, as per latest requirements.

export const IMAGE_BASE_URL = process.env.EXPO_PUBLIC_IMAGE_BASE_URL;

export const API_ENDPOINTS = Object.freeze({
  authLogin: process.env.EXPO_PUBLIC_API_AUTH_LOGIN_PATH,
  authFaceVerify: process.env.EXPO_PUBLIC_API_AUTH_FACE_VERIFY_PATH,
  authTokenRefresh: process.env.EXPO_PUBLIC_API_AUTH_TOKEN_REFRESH_PATH,
  authPasswordForgot: process.env.EXPO_PUBLIC_API_AUTH_PASSWORD_FORGOT_PATH,
  authPasswordReset: process.env.EXPO_PUBLIC_API_AUTH_PASSWORD_RESET_PATH,
  authMe: process.env.EXPO_PUBLIC_API_AUTH_ME_PATH,
  authLogout: process.env.EXPO_PUBLIC_API_AUTH_LOGOUT_PATH,
  permissionsMenu:
    process.env.EXPO_PUBLIC_API_PERMISSIONS_MENU_PATH || "/permissions/menu",
  projects: process.env.EXPO_PUBLIC_API_PROJECTS_PATH,
  projectDetails: process.env.EXPO_PUBLIC_API_PROJECT_DETAILS_PATH,
  zones: process.env.EXPO_PUBLIC_API_ZONES_PATH,
  villages: process.env.EXPO_PUBLIC_API_VILLAGES_PATH,
  omsList: process.env.EXPO_PUBLIC_API_OMS_LIST_PATH,
  omsBasic: process.env.EXPO_PUBLIC_API_OMS_BASIC_PATH,
  omsProgress: process.env.EXPO_PUBLIC_API_OMS_PROGRESS_PATH,
  omsSubmissions: process.env.EXPO_PUBLIC_API_OMS_SUBMISSIONS_PATH,
  omsSubmissionHistory: process.env.EXPO_PUBLIC_API_OMS_SUBMISSION_HISTORY_PATH,
  omsSubmissionResubmit: process.env.EXPO_PUBLIC_API_OMS_SUBMISSION_RESUBMIT_PATH,
  omsSubmissionWorkflowStatus: process.env.EXPO_PUBLIC_API_OMS_SUBMISSION_WORKFLOW_STATUS_PATH,
  omsRequestStatus: process.env.EXPO_PUBLIC_API_OMS_REQUEST_STATUS_PATH,
  omsPhaseSummary: process.env.EXPO_PUBLIC_API_OMS_PHASE_SUMMARY_PATH,
  omsImageGallery: process.env.EXPO_PUBLIC_API_OMS_IMAGE_GALLERY_PATH,
  masterProcesses: process.env.EXPO_PUBLIC_API_MASTER_PROCESSES_PATH,
  contractors: process.env.EXPO_PUBLIC_API_CONTRACTORS_PATH,
  notificationTokens: process.env.EXPO_PUBLIC_API_NOTIFICATION_TOKENS_PATH,
  appVersion: process.env.EXPO_PUBLIC_API_APP_VERSION_PATH || "app-version",
});

export const buildApiEndpointPath = (template, params = {}) =>
  String(template || "").replace(/:([A-Za-z0-9_]+)/g, (_, key) =>
    encodeURIComponent(String(params[key] ?? ""))
  );

export const resolveAssetUrl = (path = "") => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = String(path).replace(/^\/+/, "");
  return `${IMAGE_BASE_URL}/${normalizedPath}`;
};
