import { Alert } from "react-native";

let alertHandler = null;

const getNativeStyle = (variant) => {
  if (variant === "danger") return "destructive";
  if (variant === "secondary" || variant === "cancel") return "cancel";
  return "default";
};

export const registerAlertHandler = (handler) => {
  alertHandler = handler;

  return () => {
    if (alertHandler === handler) {
      alertHandler = null;
    }
  };
};

export const showAppAlert = ({
  title = "Notice",
  message = "",
  type = "info",
  actions = [{ label: "OK", variant: "primary" }],
  cancelable = true,
} = {}) => {
  if (typeof alertHandler === "function") {
    alertHandler({ title, message, type, actions, cancelable });
    return;
  }

  const nativeButtons = actions.map((action) => ({
    text: action.label,
    style: getNativeStyle(action.variant),
    onPress: action.onPress,
  }));

  Alert.alert(title, nativeButtons, { cancelable });
};
