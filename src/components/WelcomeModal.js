import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import typography from "../constants/typography";
import { moderateScale, verticalScale } from "../constants/metrics";

const WelcomeModal = ({ visible, onClose, userName }) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bottomInset = Math.max(insets.bottom, verticalScale(12));

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
      return undefined;
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    return undefined;
  }, [visible, slideAnim, fadeAnim]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: moderateScale(28) + bottomInset,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.successWrap}>
            <View style={styles.successHalo}>
              <View style={styles.animationWrap}>
                <Image
                  source={require("../assets/gif/logged_In.gif")}
                  style={styles.successGif}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          <View style={styles.verifiedPill}>
            <Text style={styles.verifiedDot}>●</Text>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>

          <Text style={styles.title}>Welcome</Text>

          {userName && <Text style={styles.userName}>{userName}</Text>}
          <Text style={styles.subtitle}>Opening dashboard</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default WelcomeModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: colors.white,
    paddingTop: moderateScale(14),
    paddingHorizontal: moderateScale(24),
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    borderTopWidth: 1,
    borderColor: colors.loginSheetBorderLight,
  },

  handle: {
    width: moderateScale(48),
    height: verticalScale(5),
    borderRadius: moderateScale(999),
    alignSelf: "center",
    backgroundColor: colors.cardBorder,
    marginBottom: verticalScale(22),
  },

  successWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(4),
  },

  successHalo: {
    width: moderateScale(118),
    height: moderateScale(118),
    borderRadius: moderateScale(59),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceBluePale,
    borderWidth: 1,
    borderColor: colors.loginSheetBorderLight,
  },

  animationWrap: {
    width: moderateScale(82),
    height: moderateScale(82),
    borderRadius: moderateScale(41),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.loginSheetBorderLight,
  },

  successGif: {
    width: moderateScale(56),
    height: moderateScale(56),
  },

  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: moderateScale(6),
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    marginTop: verticalScale(14),
  },

  verifiedDot: {
    color: colors.primaryGreen,
    fontSize: moderateScale(8),
  },

  verifiedText: {
    color: colors.navyFreshDark,
    fontSize: moderateScale(12),
    fontFamily: fonts.semiBold,
  },

  title: {
    fontSize: typography.h1,
    fontFamily: fonts.bold,
    marginTop: verticalScale(16),
    textAlign: "center",
    color: colors.textDark,
  },

  subtitle: {
    fontSize: typography.small,
    marginTop: verticalScale(10),
    textAlign: "center",
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  userName: {
    fontSize: moderateScale(20),
    fontFamily: fonts.semiBold,
    textAlign: "center",
    marginTop: verticalScale(6),
    color: colors.navyFresh,
  },
});
