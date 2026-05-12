import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import InAppNotificationBanner from "../components/InAppNotificationBanner";

const InAppNotificationContext = createContext(null);

export const useInAppNotification = () => {
  const context = useContext(InAppNotificationContext);
  if (!context) {
    throw new Error(
      "useInAppNotification must be used within an InAppNotificationProvider"
    );
  }
  return context;
};

export const InAppNotificationProvider = ({ children }) => {
  const showTimerRef = useRef(null);
  const [notificationState, setNotificationState] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(
    () => () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }
    },
    []
  );

  const showNotification = useCallback(({ title, message, type = "info" }) => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
    }

    setNotificationState((prev) => ({
      ...prev,
      visible: false,
    }));

    showTimerRef.current = setTimeout(() => {
      setNotificationState({
        visible: true,
        title,
        message,
        type,
      });
    }, 50);
  }, []);

  const hideNotification = useCallback(() => {
    setNotificationState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <InAppNotificationContext.Provider
      value={{ showNotification, hideNotification }}
    >
      {children}
      <InAppNotificationBanner
        visible={notificationState.visible}
        title={notificationState.title}
        message={notificationState.message}
        type={notificationState.type}
        onDismiss={hideNotification}
      />
    </InAppNotificationContext.Provider>
  );
};

export default InAppNotificationProvider;
