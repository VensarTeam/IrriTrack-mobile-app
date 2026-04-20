import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Button } from "react-native-paper";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import typography from "../constants/typography";
import { moderateScale, verticalScale } from "../constants/metrics";
import { useAuth } from "../context/AuthContext";

const AppLockScreen = () => {
  const { isUnlocking, unlockError, unlockSession, logout } = useAuth();

  return (
    <LinearGradient
      colors={[
        colors.loginHeroGradientStart,
        colors.loginHeroGradientMid,
        colors.loginHeroGradientEnd,
        colors.loginPageGradientMid,
        colors.loginPageGradientEnd,
      ]}
      locations={[0, 0.2, 0.42, 0.72, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.screen}
    >
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Unlock IDICM</Text>
        <Text style={styles.subtitle}>
          Use your device security to continue.
        </Text>

        {isUnlocking ? (
          <ActivityIndicator
            size="small"
            color={colors.navyFreshDark}
            style={styles.loader}
          />
        ) : null}

        {unlockError ? <Text style={styles.errorText}>{unlockError}</Text> : null}

        <Button
          mode="contained"
          onPress={unlockSession}
          loading={isUnlocking}
          disabled={isUnlocking}
          style={styles.primaryButton}
          contentStyle={styles.primaryButtonContent}
          buttonColor={colors.navyFresh}
          textColor={colors.white}
        >
          Unlock
        </Button>

        <Button
          mode="text"
          onPress={logout}
          disabled={isUnlocking}
          textColor={colors.textSecondary}
        >
          Logout
        </Button>
      </View>
    </LinearGradient>
  );
};

export default AppLockScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(24),
  },

  card: {
    width: "100%",
    alignItems: "center",
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(22),
    paddingVertical: verticalScale(28),
    backgroundColor: colors.sheetSurface,
    borderWidth: 1,
    borderColor: colors.loginSheetBorderLight,
  },

  logoWrap: {
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(8),
    backgroundColor: colors.glassWhite,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: verticalScale(18),
  },

  logo: {
    width: moderateScale(118),
    height: moderateScale(46),
  },

  title: {
    color: colors.textDark,
    fontSize: typography.h1,
    fontFamily: fonts.bold,
    textAlign: "center",
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontFamily: fonts.medium,
    lineHeight: moderateScale(20),
    textAlign: "center",
    marginTop: verticalScale(8),
  },

  loader: {
    marginTop: verticalScale(18),
  },

  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    fontFamily: fonts.medium,
    lineHeight: moderateScale(20),
    textAlign: "center",
    marginTop: verticalScale(16),
  },

  primaryButton: {
    width: "100%",
    borderRadius: moderateScale(12),
    marginTop: verticalScale(22),
  },

  primaryButtonContent: {
    height: verticalScale(50),
  },
});
