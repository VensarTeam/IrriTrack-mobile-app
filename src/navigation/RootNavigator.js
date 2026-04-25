import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthStack from "./AuthStack";
import { ROUTES } from "./routes";
import AppTabs from "./AppTabs";
import ProjectDetailsScreen from "../screens/ProjectDetails";
import UnitListScreen from "../screens/unit/UnitListScreen";
import UnitDetailsScreen from "../screens/unit/UnitDetails";
import UnitStatusUpdateScreen from "../screens/unit/UnitStatusUpdate";
import UnitStatusOverviewScreen from "../screens/unit/UnitStatusOverview";
import UnitGalleryScreen from "../screens/unit/UnitGallery";
import { useAuth } from "../context/AuthContext";
import AppLockScreen from "../components/AppLockScreen";
import OfflineChecklistSyncGate from "../components/OfflineChecklistSyncGate";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, isRestoring, isAppLocked } = useAuth();

  if (isRestoring) {
    return null;
  }

  if (isAuthenticated && isAppLocked) {
    return <AppLockScreen />;
  }

  return (
    <>
      <OfflineChecklistSyncGate />
      <Stack.Navigator
        initialRouteName={
          isAuthenticated ? ROUTES.ROOT.APP_TABS : ROUTES.ROOT.AUTH_STACK
        }
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={ROUTES.ROOT.AUTH_STACK} component={AuthStack} />
        <Stack.Screen name={ROUTES.ROOT.APP_TABS} component={AppTabs} />
        <Stack.Screen
          name={ROUTES.ROOT.PROJECT_DETAILS}
          component={ProjectDetailsScreen}
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.UNIT_LIST_SCREEN}
          component={UnitListScreen}
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.UNIT_DETAILS}
          component={UnitDetailsScreen}
          options={{
            animation:'slide_from_right'
          }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.UNIT_STATUS_UPDATE}
          component={UnitStatusUpdateScreen}
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.UNIT_STATUS_OVERVIEW}
          component={UnitStatusOverviewScreen}
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.UNIT_GALLERY}
          component={UnitGalleryScreen}
          options={{
            animation: "slide_from_right",
          }}
        />
      </Stack.Navigator>
    </>
  );
};

export default RootNavigator;
