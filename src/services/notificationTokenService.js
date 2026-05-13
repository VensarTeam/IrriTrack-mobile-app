import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { API_ENDPOINTS } from "../config/env";
import { apiRequest } from "./apiClient";
import { getFcmToken } from "./pushNotificationService";

const LOG_PREFIX = "[NotificationToken]";

/**
 * Registers the FCM push notification token with the server.
 * Should be called after a successful login.
 */
export const registerNotificationToken = async () => {
  try {
    const token = await getFcmToken();

    if (!token) {
      console.log(LOG_PREFIX, "No FCM token available; skipping registration");
      return null;
    }

    const deviceId = await DeviceInfo.getUniqueId();

    const body = {
      token,
      platform: Platform.OS,
      deviceId,
    };

    console.log(LOG_PREFIX, "Registering token with server", {
      platform: body.platform,
      tokenPreview: `${token.slice(0, 10)}...`,
    });

    const response = await apiRequest({
      url: API_ENDPOINTS.notificationTokens,
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      data: body,
    });

    console.log(LOG_PREFIX, "Token registered successfully");
    return response;
  } catch (error) {
    // Token registration should never block the login flow
    console.warn(LOG_PREFIX, "Failed to register token", {
      message: error?.message,
      status: error?.status,
    });
    return null;
  }
};
