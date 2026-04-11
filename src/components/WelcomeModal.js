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
          <View style={styles.animationWrap}>
            <Image
              source={require("../assets/gif/logged_In.gif")}
              style={styles.successGif}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>You're in</Text>

          {userName && <Text style={styles.userName}>{userName}</Text>}
          <Text style={styles.subtitle}>Opening your dashboard</Text>
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
    paddingTop: moderateScale(28),
    paddingHorizontal: moderateScale(28),
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
  },

  animationWrap: {
    width: moderateScale(112),
    height: moderateScale(112),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  successGif: {
    width: moderateScale(60),
    height: moderateScale(60),
  },

  title: {
    fontSize: typography.h1,
    fontFamily: fonts.bold,
    marginTop: verticalScale(18),
    textAlign: "center",
    color: colors.textDark,
  },

  subtitle: {
    fontSize: typography.small,
    marginTop: verticalScale(12),
    textAlign: "center",
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  userName: {
    fontSize: moderateScale(20),
    fontFamily: fonts.medium,
    textAlign: "center",
    marginTop: verticalScale(8),
    color: colors.primaryBlue,
  },
});
