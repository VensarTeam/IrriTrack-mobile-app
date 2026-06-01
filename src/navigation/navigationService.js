import { createNavigationContainerRef } from "@react-navigation/native";
import { ROUTES } from "./routes";

export const navigationRef = createNavigationContainerRef();

const pendingNavigationActions = [];

export const flushPendingNavigation = () => {
  if (!navigationRef.isReady()) {
    return;
  }

  while (pendingNavigationActions.length) {
    const action = pendingNavigationActions.shift();
    action();
  }
};

export const navigate = (routeName, params = {}) => {
  const action = () => navigationRef.navigate(routeName, params);

  if (navigationRef.isReady()) {
    action();
    return;
  }

  pendingNavigationActions.push(action);
};

export const navigateToWorkStatus = (params = {}) => {
  navigate(ROUTES.ROOT.WORK_STATUS, {
    module: "OMS",
    ...params,
  });
};
