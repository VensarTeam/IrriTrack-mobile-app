import * as SecureStore from "expo-secure-store";

const AUTH_SESSION_KEY = "pmt.auth.session";

export const getStoredAuthSession = async () => {
  try {
    const rawValue = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

    if (!rawValue) return null;

    return JSON.parse(rawValue);
  } catch (error) {
    console.warn("Unable to restore auth session", error);
    return null;
  }
};

export const saveAuthSession = async (session) => {
  try {
    await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    console.warn("Unable to persist auth session", error);
  }
};

export const clearStoredAuthSession = async () => {
  try {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
  } catch (error) {
    console.warn("Unable to clear auth session", error);
  }
};
