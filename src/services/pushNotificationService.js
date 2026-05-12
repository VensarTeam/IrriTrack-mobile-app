import { Linking, PermissionsAndroid, Platform } from "react-native";
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  hasPermission,
  isDeviceRegisteredForRemoteMessages,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";

const getFirebaseMessaging = () => getMessaging();

const isPermissionEnabled = (status) =>
  status === AuthorizationStatus.AUTHORIZED ||
  status === AuthorizationStatus.PROVISIONAL;

export const requestPushNotificationPermission = async () => {
  if (Platform.OS === "android") {
    if (Number(Platform.Version) < 33) {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (Platform.OS === "ios") {
    const status = await requestPermission(getFirebaseMessaging(), {
      alert: true,
      badge: true,
      sound: true,
    });

    return isPermissionEnabled(status);
  }

  return false;
};

export const checkPushNotificationPermission = async () => {
  if (Platform.OS === "android") {
    if (Number(Platform.Version) < 33) {
      return true;
    }

    const result = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );

    return result;
  }

  if (Platform.OS === "ios") {
    const status = await hasPermission(getFirebaseMessaging());
    return isPermissionEnabled(status);
  }

  return false;
};

export const openPushNotificationSettings = async () => {
  await Linking.openSettings();
};

export const registerForRemoteMessages = async () => {
  const messaging = getFirebaseMessaging();

  if (
    Platform.OS === "ios" &&
    !isDeviceRegisteredForRemoteMessages(messaging)
  ) {
    await registerDeviceForRemoteMessages(messaging);
  }
};

export const getFcmToken = async () => {
  await registerForRemoteMessages();
  return getToken(getFirebaseMessaging());
};

export const initializePushNotifications = async ({
  onToken,
  request = false,
} = {}) => {
  const permissionGranted = request
    ? await requestPushNotificationPermission()
    : await checkPushNotificationPermission();

  if (!permissionGranted) {
    return {
      fcmToken: null,
      permissionGranted: false,
    };
  }

  const fcmToken = await getFcmToken();

  if (typeof onToken === "function") {
    await onToken(fcmToken);
  }

  return {
    fcmToken,
    permissionGranted: true,
  };
};

export const subscribeToPushNotificationEvents = ({
  onForegroundMessage,
  onNotificationOpen,
  onToken,
} = {}) => {
  const messaging = getFirebaseMessaging();

  const unsubscribeForeground = onMessage(messaging, async (remoteMessage) => {
    if (typeof onForegroundMessage === "function") {
      await onForegroundMessage(remoteMessage);
    }
  });

  const unsubscribeOpened = onNotificationOpenedApp(
    messaging,
    async (remoteMessage) => {
      if (typeof onNotificationOpen === "function") {
        await onNotificationOpen(remoteMessage);
      }
    }
  );

  const unsubscribeTokenRefresh = onTokenRefresh(messaging, async (token) => {
    if (typeof onToken === "function") {
      await onToken(token);
    }
  });

  getInitialNotification(messaging).then((remoteMessage) => {
    if (remoteMessage && typeof onNotificationOpen === "function") {
      onNotificationOpen(remoteMessage);
    }
  });

  return () => {
    unsubscribeForeground();
    unsubscribeOpened();
    unsubscribeTokenRefresh();
  };
};

export const registerBackgroundNotificationHandler = (handler) => {
  setBackgroundMessageHandler(getFirebaseMessaging(), async (remoteMessage) => {
    if (typeof handler === "function") {
      await handler(remoteMessage);
    }
  });
};

export const getNotificationContent = (remoteMessage = {}) => ({
  title: remoteMessage?.notification?.title || "New notification",
  body: remoteMessage?.notification?.body || "",
  data: remoteMessage?.data || {},
  messageId: remoteMessage?.messageId || remoteMessage?.message_id || "",
});
