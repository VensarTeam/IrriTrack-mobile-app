import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import colors from "../constants/colors";
import typography from "../constants/typography";
import {
  moderateScale,
  verticalScale,
} from "../constants/metrics";

const AndroidSplash = ({ onLayout }) => {
  return (
    <View style={styles.container} onLayout={onLayout}>
      <Image
        source={require("../assets/images/logo.png")}
        resizeMode="contain"
        style={styles.logo}
      />

      <Text style={styles.title}>
        Project Management Tools
      </Text>

      <Text style={styles.subtitle}>
        Vensar PMT
      </Text>

      <ActivityIndicator
        size="small"
        color={colors.primaryBlue}
        style={styles.loader}
      />
    </View>
  );
};

export default AndroidSplash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(24),
  },

  logo: {
    width: moderateScale(220),
    height: verticalScale(90),
    marginBottom: verticalScale(18),
  },

  title: {
    fontSize: typography.h1 || moderateScale(24),
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
  },

  subtitle: {
    fontSize: typography.body || moderateScale(14),
    fontWeight: "500",
    color: colors.primaryBlue,
    marginTop: verticalScale(8),
    textAlign: "center",
  },

  loader: {
    marginTop: verticalScale(22),
  },
});
