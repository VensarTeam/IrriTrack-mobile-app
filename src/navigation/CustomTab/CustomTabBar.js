import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
} from "react-native";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "./tabStyles";
import colors from "../../constants/colors";

const CustomTabBar = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      <View style={styles.tabBar}>

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          let iconName;

          if (route.name === "Dashboard")
            iconName = "view-dashboard-outline";
          if (route.name === "Profile")
            iconName = "account-outline";
          if (route.name === "About")
            iconName = "information-outline";

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              <Icon
                source={iconName}
                size={22}
                color={
                  isFocused
                    ? colors.tabActive
                    : colors.tabInactive
                }
              />

              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused
                      ? colors.tabActive
                      : colors.tabInactive,
                  },
                ]}
              >
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}

      </View>
    </View>
  );
};

export default CustomTabBar;
