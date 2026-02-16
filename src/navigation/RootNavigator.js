import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthStack from "./AuthStack";
import { ROUTES } from "./routes";
import AppTabs from "./AppTabs";
import ProjectDetailsScreen from "../screens/ProjectDetails";
import UnitListScreen from "../screens/UnitListScreen";

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
    </Stack.Navigator>
  );
};

export default RootNavigator;
