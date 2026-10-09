import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import colors from "../constants/colors";

const GradientScreenHeader = ({ children }) => (
  <View style={styles.shell}>
    <LinearGradient
      pointerEvents="none"
      colors={[
        colors.loginHeroGradientStart,
        colors.loginHeroGradientMid,
        colors.loginHeroGradientEnd,
      ]}
      locations={[0, 0.5, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View style={styles.content}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  shell: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 8 : 38,
    paddingBottom: Platform.OS === "ios" ? 12 : 14,
    minHeight: Platform.OS === "ios" ? 68 : 100,
    justifyContent: "center",
  },
});

export default GradientScreenHeader;
