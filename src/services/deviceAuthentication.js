import * as LocalAuthentication from "expo-local-authentication";

export const APP_UNLOCK_MESSAGES = Object.freeze({
  cancelled: "Authentication was cancelled. Please unlock to continue.",
  failed: "We could not verify your identity. Please try again.",
});

export const authenticateDeviceForAppUnlock = async () => {
  const enrolledSecurityLevel =
    await LocalAuthentication.getEnrolledLevelAsync();

  if (enrolledSecurityLevel === LocalAuthentication.SecurityLevel.NONE) {
    return { success: true, error: "" };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock IDICM",
    cancelLabel: "Cancel",
    fallbackLabel: "Use device passcode",
    disableDeviceFallback: false,
  });

  if (result.success) {
    return { success: true, error: "" };
  }

  return {
    success: false,
    error:
      result.error === "user_cancel" || result.error === "system_cancel"
        ? APP_UNLOCK_MESSAGES.cancelled
        : APP_UNLOCK_MESSAGES.failed,
  };
};
