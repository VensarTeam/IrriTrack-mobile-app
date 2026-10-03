import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthStack from "./AuthStack";
import { ROUTES } from "./routes";
import AppTabs from "./AppTabs";
import ProjectDetailsScreen from "../screens/ProjectDetails";
import ProjectModulesScreen from "../screens/ProjectModules";
import PipeNetworkEntryScreen from "../screens/PipeNetworkEntry";
import PipeDailyReportScreen from "../screens/PipeDailyReport";
import PipeWorkStatusScreen from "../screens/PipeWorkStatus";
import SummaryScreen from "../screens/Summary";
import WorkStatusScreen from "../screens/WorkStatus";
import AddContractorScreen from "../screens/AddContractor";
import UnitListScreen from "../screens/unit/UnitListScreen";
import UnitDetailsScreen from "../screens/unit/UnitDetails";
import UnitStatusUpdateScreen from "../screens/unit/UnitStatusUpdate";
import UnitStatusOverviewScreen from "../screens/unit/UnitStatusOverview";
import UnitGalleryScreen from "../screens/unit/UnitGallery";
import PermissionsSettingsScreen from "../screens/PermissionsSettings";
import RolePermissionManagerScreen from "../screens/RolePermissionManager";
import { useAuth } from "../context/AuthContext";
import AppLockScreen from "../components/AppLockScreen";
import { flushPendingNavigation } from "./navigationService";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, isRestoring, isAppLocked } = useAuth();

  useEffect(() => {
    if (!isRestoring && isAuthenticated && !isAppLocked) {
      flushPendingNavigation();
    }
  }, [isAppLocked, isAuthenticated, isRestoring]);

  if (isRestoring) {
    return null;
  }

  if (isAuthenticated && isAppLocked) {
    return <AppLockScreen />;
  }

  return (
    <>
      <Stack.Navigator
        initialRouteName={
          isAuthenticated ? ROUTES.ROOT.APP_TABS : ROUTES.ROOT.AUTH_STACK
        }
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={ROUTES.ROOT.AUTH_STACK} component={AuthStack} />
        <Stack.Screen name={ROUTES.ROOT.APP_TABS} component={AppTabs} />
        <Stack.Screen
          name={ROUTES.ROOT.PROJECT_MODULES}
          component={ProjectModulesScreen}
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.PROJECT_DETAILS}
          component={ProjectDetailsScreen}
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.PIPE_NETWORK_ENTRY}
          component={PipeNetworkEntryScreen}
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.PIPE_DAILY_REPORT}
          component={PipeDailyReportScreen}
          options={{ headerShown: true, title: "Daily report", headerTitleAlign: "center", headerTintColor: "#123B63", headerShadowVisible: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.PIPE_WORK_STATUS}
          component={PipeWorkStatusScreen}
          options={{ headerShown: true, title: "Pipe Work Status", headerTitleAlign: "center", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.WORK_STATUS}
          component={WorkStatusScreen}
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.SUMMARY}
          component={SummaryScreen}
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.ADD_CONTRACTOR}
          component={AddContractorScreen}
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
        <Stack.Screen
          name={ROUTES.ROOT.PERMISSIONS}
          component={PermissionsSettingsScreen}
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name={ROUTES.ROOT.ROLE_PERMISSION_MANAGER}
          component={RolePermissionManagerScreen}
          options={{
            headerShown: true,
            title: "Role & Permissions",
            headerTitleAlign: "center",
            animation: "slide_from_right",
          }}
        />
      </Stack.Navigator>
    </>
  );
};

export default RootNavigator;
