import { useEffect, useRef, useState } from "react";
import { showAppAlert } from "../services/alertService";
import {
  getNotificationContent,
  initializePushNotifications,
  openPushNotificationSettings,
  subscribeToPushNotificationEvents,
} from "../services/pushNotificationService";

const showForegroundNotificationAlert = (remoteMessage) => {
  const { title, body } = getNotificationContent(remoteMessage);

  showAppAlert({
    title,
    message: body || "You have a new update.",
    type: "info",
  });
};

const showPermissionSettingsAlert = () => {
  showAppAlert({
    title: "Enable Notifications",
    message:
      "Push notifications are disabled. Enable them in Settings to receive updates.",
    type: "warning",
    actions: [
      {
        label: "Not Now",
        variant: "secondary",
      },
      {
        label: "Open Settings",
        variant: "primary",
        onPress: () => {
          openPushNotificationSettings().catch(() => {
            showAppAlert({
              title: "Unable to Open Settings",
              message:
                "Please open app settings manually and enable notifications.",
              type: "warning",
            });
          });
        },
      },
    ],
  });
};

export const usePushNotifications = ({ onToken, onNotificationOpen } = {}) => {
  const hasShownPermissionAlertRef = useRef(false);
  const [state, setState] = useState({
    error: null,
    fcmToken: null,
    isReady: false,
    permissionGranted: false,
  });

  useEffect(() => {
    let isMounted = true;
    let unsubscribeEvents = null;

    const bootPushNotifications = async () => {
      try {
        const result = await initializePushNotifications({ onToken });

        if (!isMounted) return;

        setState({
          error: null,
          fcmToken: result.fcmToken,
          isReady: true,
          permissionGranted: result.permissionGranted,
        });

        if (!result.permissionGranted) {
          // if (!hasShownPermissionAlertRef.current) {
          //   hasShownPermissionAlertRef.current = true;
          //   showPermissionSettingsAlert();
          // }

          return;
        }

        unsubscribeEvents = subscribeToPushNotificationEvents({
          onForegroundMessage: showForegroundNotificationAlert,
          onNotificationOpen,
          onToken,
        });
      } catch (error) {
        if (!isMounted) return;

        setState({
          error,
          fcmToken: null,
          isReady: true,
          permissionGranted: false,
        });
      }
    };

    bootPushNotifications();

    return () => {
      isMounted = false;

      if (typeof unsubscribeEvents === "function") {
        unsubscribeEvents();
      }
    };
  }, [onNotificationOpen, onToken]);

  return state;
};
