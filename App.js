import React, { useEffect, useState, useCallback } from "react";
import { Platform, StatusBar, Text, TextInput } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import { paperTheme } from "./src/constants/paperTheme";
import fonts from "./src/constants/fonts";
import colors from "./src/constants/colors";
import RootNavigator from "./src/navigation/RootNavigator";
import AndroidSplash from "./src/components/AndroidSplash";
import AppAlertProvider from "./src/context/AppAlertProvider";
import AppUpdateGate from "./src/components/AppUpdateGate";
import { AuthProvider } from "./src/context/AuthContext";
import OfflineChecklistSyncGate from "./src/components/OfflineChecklistSyncGate";
import PushNotificationBootstrap from "./src/components/PushNotificationBootstrap";
import { InAppNotificationProvider } from "./src/context/InAppNotificationProvider";
import {
  flushPendingNavigation,
  navigationRef,
} from "./src/navigation/navigationService";

const isAndroid = Platform.OS === "android";

if (!Text.defaultProps) {
  Text.defaultProps = {};
}
Text.defaultProps = {
  ...Text.defaultProps,
  style: [{ fontFamily: fonts.regular }, Text.defaultProps.style],
};

if (!TextInput.defaultProps) {
  TextInput.defaultProps = {};
}
TextInput.defaultProps = {
  ...TextInput.defaultProps,
  style: [{ fontFamily: fonts.regular }, TextInput.defaultProps.style],
};

if (isAndroid) {
  SplashScreen.preventAutoHideAsync().catch(() => {
    // no-op: splash may already be controlled in dev reloads
  });
}

const runAndroidStartupTasks = async () => {
  // Add any Android-only startup work here (token restore, config fetch, etc.)
  await Promise.resolve();
};

const App = () => {
  const [isStartupDone, setIsStartupDone] = useState(!isAndroid);
  const [isNativeSplashHidden, setIsNativeSplashHidden] = useState(!isAndroid);

  useEffect(() => {
    let isMounted = true;

    const prepareApp = async () => {
      if (!isAndroid) return;

      try {
        await Promise.all([
          runAndroidStartupTasks(),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } finally {
        if (isMounted) {
          setIsStartupDone(true);
        }
      }
    };

    prepareApp();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAndroidSplashLayout = useCallback(async () => {
    if (!isAndroid || isNativeSplashHidden) return;

    await SplashScreen.hideAsync().catch(() => {
      // no-op
    });
    setIsNativeSplashHidden(true);
  }, [isNativeSplashHidden]);

  if (isAndroid && (!isNativeSplashHidden || !isStartupDone)) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.loginHeroGradientStart}
        />
        <AndroidSplash onLayout={handleAndroidSplashLayout} />
      </>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.loginHeroGradientStart}
      />
      <AuthProvider>
        <AppAlertProvider>
          <InAppNotificationProvider>
            <PushNotificationBootstrap />
            <OfflineChecklistSyncGate />
            <AppUpdateGate />
            <NavigationContainer
              ref={navigationRef}
              onReady={flushPendingNavigation}
            >
              <RootNavigator />
            </NavigationContainer>
          </InAppNotificationProvider>
        </AppAlertProvider>
      </AuthProvider>
    </PaperProvider>
  );
};

export default App;
