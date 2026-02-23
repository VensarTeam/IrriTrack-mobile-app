import React, { useEffect, useState, useCallback } from "react";
import { Platform, Text, TextInput } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import { paperTheme } from "./src/constants/paperTheme";
import fonts from "./src/constants/fonts";
import RootNavigator from "./src/navigation/RootNavigator";
import AndroidSplash from "./src/components/AndroidSplash";
import AppAlertProvider from "./src/context/AppAlertProvider";

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
          new Promise((resolve) => setTimeout(resolve, 1200)),
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
    return <AndroidSplash onLayout={handleAndroidSplashLayout} />;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <AppAlertProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AppAlertProvider>
    </PaperProvider>
  );
};

export default App;
