import Constants from "expo-constants";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { API_ENDPOINTS, APP_VERSION_APP_ID } from "../config/env";
import { apiRequest } from "./apiClient";

const ANDROID_PLATFORM = "ANDROID";

const normalizeComparableVersion = (value = "") => {
  const trimmed = String(value || "").trim().replace(/^v/i, "");

  if (!trimmed) return "";

  const numericSegments = trimmed.split(".").map(Number);
  const allNumeric = numericSegments.every(Number.isFinite);

  if (!allNumeric) {
    return trimmed.toLowerCase();
  }

  while (
    numericSegments.length > 1 &&
    numericSegments[numericSegments.length - 1] === 0
  ) {
    numericSegments.pop();
  }

  return numericSegments.join(".");
};

export const supportsRemoteAppVersionCheck = () => Platform.OS === "android";

export const getInstalledAppVersion = () => {
  const deviceVersion = DeviceInfo.getVersion()?.trim();

  if (deviceVersion) return deviceVersion;

  const nativeVersion = Constants.nativeAppVersion?.trim();

  if (nativeVersion) return nativeVersion;

  return Constants.expoConfig?.version?.trim() || "";
};

export const getInstalledBuildNumber = () => {
  const buildNumber = DeviceInfo.getBuildNumber()?.trim();

  if (buildNumber) return buildNumber;

  return Constants.nativeBuildVersion?.trim() || "";
};

export const getInstalledAppVersionForDisplay = () =>
  getInstalledAppVersion() || Constants.expoConfig?.version?.trim() || "";

export const doesVersionMatchCurrentRelease = (
  installedVersion,
  currentVersion
) =>
  normalizeComparableVersion(installedVersion) ===
  normalizeComparableVersion(currentVersion);

export const fetchAppVersionInfo = async () => {
  if (!supportsRemoteAppVersionCheck()) return null;

  const versionInfo = await apiRequest(
    {
      method: "GET",
      url: API_ENDPOINTS.appVersion,
      params: {
        appId: APP_VERSION_APP_ID,
        platform: ANDROID_PLATFORM,
      },
      skipAuth: true,
    },
    {
      fallbackMessage: "Unable to fetch app version.",
    }
  );

  if (!versionInfo) return null;

  return {
    ...versionInfo,
    currentVersion: versionInfo.currentVersion || versionInfo.version || "",
    downloadURL: versionInfo.downloadURL || versionInfo.downloadLink || "",
    releaseNotes: versionInfo.releaseNotes || versionInfo.releaseNote || "",
    isForceUpdate: true,
  };
};
