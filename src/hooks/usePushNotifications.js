import { useEffect, useState } from "react";
import {
  initializePushNotifications,
  subscribeToPushNotificationEvents,
} from "../services/pushNotificationService";

export const usePushNotifications = ({ onToken, onNotificationOpen } = {}) => {
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
