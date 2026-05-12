import { useEffect, useState } from "react";
import {
  getNotificationContent,
  initializePushNotifications,
  subscribeToPushNotificationEvents,
} from "../services/pushNotificationService";

import { useInAppNotification } from "../context/InAppNotificationProvider";

export const usePushNotifications = ({ onToken, onNotificationOpen } = {}) => {
  const { showNotification } = useInAppNotification();
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

        unsubscribeEvents = subscribeToPushNotificationEvents({
          onForegroundMessage: (remoteMessage) => {
            const { title, body } = getNotificationContent(remoteMessage);
            showNotification({
              title,
              message: body || "You have a new update.",
              type: "info",
            });
          },
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
  }, [onNotificationOpen, onToken, showNotification]);

  return state;
};
