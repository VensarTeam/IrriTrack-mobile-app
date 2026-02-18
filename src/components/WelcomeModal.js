import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import colors from "../constants/colors";
import typography from "../constants/typography";
import { moderateScale, verticalScale } from "../constants/metrics";

const WelcomeModal = ({ visible, onClose, userName }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >

          <Text style={styles.title}>Welcome Back</Text>

          {userName && <Text style={styles.userName}>{userName}</Text>}

          {/* <Text style={styles.subtitle}>Smart Water Management System</Text> */}

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default WelcomeModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: colors.white,
    padding: moderateScale(28),
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
  },

  logoText: {
    fontSize: moderateScale(32),
    fontWeight: "700",
    color: colors.primaryBlue,
    textAlign: "center",
  },

  title: {
    fontSize: typography.h1,
    fontWeight: "700",
    marginTop: verticalScale(12),
    textAlign: "center",
    color: colors.textDark,
  },

  subtitle: {
    fontSize: typography.body,
    marginTop: verticalScale(8),
    textAlign: "center",
    color: colors.textSecondary,
  },

  button: {
    marginTop: verticalScale(30),
    backgroundColor: colors.primaryBlue,
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(14),
    alignItems: "center",
  },

  buttonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "600",
  },

  userName: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    textAlign: "center",
    marginTop: verticalScale(8),
    color: colors.primaryBlue,
  },
});
