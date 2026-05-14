import { Linking, PermissionsAndroid, Platform } from "react-native";
import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
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

const DEFAULT_ANDROID_CHANNEL_ID = "irritrack-default";
const DEFAULT_ANDROID_CHANNEL_NAME = "IrriTrack Updates";
const DEFAULT_NOTIFICATION_ICON = "ic_notification";
const DEFAULT_NOTIFICATION_LARGE_ICON = "notification_icon";
const DEFAULT_NOTIFICATION_COLOR = "#1E3E62";

const getFirebaseMessaging = () => getMessaging();

const isPermissionEnabled = (status) =>
  status === AuthorizationStatus.AUTHORIZED ||
  status === AuthorizationStatus.PROVISIONAL;

const ensureDefaultNotificationChannel = async () => {
  if (Platform.OS !== "android") {
    return null;
  }

  return notifee.createChannel({
    id: DEFAULT_ANDROID_CHANNEL_ID,
    name: DEFAULT_ANDROID_CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
    sound: "default",
    vibration: true,
  });
};

const toNotifeeRemoteMessage = (notification = {}) => ({
  messageId: notification?.id || "",
  notification: {
    title: notification?.title || "",
    body: notification?.body || "",
  },
  data: notification?.data || {},
});

export const requestPushNotificationPermission = async () => {
  if (Platform.OS === "android") {
    await ensureDefaultNotificationChannel();

    if (Number(Platform.Version) < 33) {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (Platform.OS === "ios") {
    await notifee.requestPermission();

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
    await ensureDefaultNotificationChannel();

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
  await ensureDefaultNotificationChannel();

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
    await displayPushNotification(remoteMessage);

    if (typeof onForegroundMessage === "function") {
      await onForegroundMessage(remoteMessage);
    }
  });

  const unsubscribeNotifeeForeground = notifee.onForegroundEvent(
    async ({ type, detail }) => {
      if (
        type === EventType.PRESS &&
        typeof onNotificationOpen === "function"
      ) {
        await onNotificationOpen(toNotifeeRemoteMessage(detail?.notification));
      }
    }
  );

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
    unsubscribeNotifeeForeground();
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

export const registerNotifeeBackgroundEventHandler = (handler) => {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (
      type === EventType.PRESS &&
      typeof handler === "function"
    ) {
      await handler(toNotifeeRemoteMessage(detail?.notification));
    }
  });
};

export const getNotificationContent = (remoteMessage = {}) => ({
  title:
    remoteMessage?.notification?.title ||
    remoteMessage?.data?.title ||
    "New notification",
  body:
    remoteMessage?.notification?.body ||
    remoteMessage?.data?.body ||
    remoteMessage?.data?.message ||
    "",
  data: remoteMessage?.data || {},
  messageId: remoteMessage?.messageId || remoteMessage?.message_id || "",
});

export const displayPushNotification = async (remoteMessage = {}) => {
  const { title, body, data, messageId } = getNotificationContent(remoteMessage);

  await ensureDefaultNotificationChannel();

  return notifee.displayNotification({
    id: messageId || undefined,
    title,
    body,
    data,
    android: {
      channelId: DEFAULT_ANDROID_CHANNEL_ID,
      smallIcon: DEFAULT_NOTIFICATION_ICON,
      largeIcon: DEFAULT_NOTIFICATION_LARGE_ICON,
      color: DEFAULT_NOTIFICATION_COLOR,
      pressAction: {
        id: "default",
      },
      importance: AndroidImportance.HIGH,
    },
    ios: {
      sound: "default",
    },
  });
};
