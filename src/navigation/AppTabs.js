import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ProfileScreen from "../screens/Profile";
import AboutScreen from "../screens/AboutUs";
import colors from "../constants/colors";
import { ROUTES } from "./routes";
import CustomTabBar from "./CustomTab/CustomTabBar";
import DashboardScreen from "../screens/Dashboard";

const Tab = createBottomTabNavigator();

const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: {
          backgroundColor: colors.background,
        },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name={ROUTES.TABS.DASHBOARD} component={DashboardScreen} />
      <Tab.Screen name={ROUTES.TABS.PROFILE} component={ProfileScreen} />
      <Tab.Screen name={ROUTES.TABS.ABOUT} component={AboutScreen} />
    </Tab.Navigator>
  );
};

export default AppTabs;
