import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import CustomAlert from "../components/CustomAlert";
import { registerAlertHandler } from "../services/alertService";

const AppAlertContext = createContext({
  showAlert: () => {},
});

const DEFAULT_ALERT = {
  visible: false,
  title: "Notice",
  message: "",
  type: "info",
  actions: [{ label: "OK", variant: "primary" }],
  cancelable: true,
};

const AppAlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState(DEFAULT_ALERT);

  const showAlert = useCallback((config = {}) => {
    setAlertState({
      ...DEFAULT_ALERT,
      ...config,
      visible: true,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleActionPress = useCallback(
    (action = {}) => {
      closeAlert();

      if (typeof action.onPress === "function") {
        setTimeout(() => {
          action.onPress();
        }, 140);
      }
    },
    [closeAlert]
  );

  useEffect(() => {
    const unregister = registerAlertHandler(showAlert);
    return unregister;
  }, [showAlert]);

  const contextValue = useMemo(
    () => ({
      showAlert,
    }),
    [showAlert]
  );

  return (
    <AppAlertContext.Provider value={contextValue}>
      {children}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        actions={alertState.actions}
        cancelable={alertState.cancelable}
        onDismiss={closeAlert}
        onActionPress={handleActionPress}
      />
    </AppAlertContext.Provider>
  );
};

export const useAppAlert = () => useContext(AppAlertContext);

export default AppAlertProvider;
