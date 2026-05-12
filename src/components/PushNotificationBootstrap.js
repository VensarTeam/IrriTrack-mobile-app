import React, { useCallback } from "react";
import { getNotificationContent } from "../services/pushNotificationService";
import { usePushNotifications } from "../hooks/usePushNotifications";

const PushNotificationBootstrap = () => {
  const handleToken = useCallback(async (fcmToken) => {
    // TODO: Send this token to the backend after the API contract is available.
    console.log("FCM token:", fcmToken);
  }, []);

  const handleNotificationOpen = useCallback((remoteMessage) => {
    const notification = getNotificationContent(remoteMessage);

    console.log("Notification opened:", notification);
  }, []);

  usePushNotifications({
    onNotificationOpen: handleNotificationOpen,
    onToken: handleToken,
  });

  return null;
};

export default PushNotificationBootstrap;
