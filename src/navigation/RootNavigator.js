import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthStack from "./AuthStack";
import { ROUTES } from "./routes";
import AppTabs from "./AppTabs";
import ProjectDetailsScreen from "../screens/ProjectDetails";
import UnitListScreen from "../screens/UnitListScreen";
import UnitDetailsScreen from "../screens/UnitDetails";
import UnitStatusUpdateScreen from "../screens/UnitStatusUpdate";
import UnitStatusOverviewScreen from "../screens/UnitStatusOverview";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
          animation: "slide_from_right",
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
    </Stack.Navigator>
  );
};

export default RootNavigator;
