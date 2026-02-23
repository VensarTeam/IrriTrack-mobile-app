import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Icon } from "react-native-paper";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import { moderateScale, verticalScale } from "../constants/metrics";

const TYPE_MAP = {
  info: {
    icon: "information-outline",
    bgStart: "#EAF4FF",
    bgEnd: "#D7ECFF",
    accent: colors.primaryBlue,
  },
  success: {
    icon: "check-circle-outline",
    bgStart: "#E8FFF3",
    bgEnd: "#D8F8E7",
    accent: colors.primaryGreen,
  },
  warning: {
    icon: "alert-circle-outline",
    bgStart: "#FFF6E9",
    bgEnd: "#FFEBCD",
    accent: colors.primaryOrange,
  },
  danger: {
    icon: "alert-octagon-outline",
    bgStart: "#FFECEC",
    bgEnd: "#FFD9D9",
    accent: colors.danger,
  },
};

const CustomAlert = ({
  visible,
  title,
  message,
  type = "info",
  actions,
  cancelable = true,
  onActionPress,
  onDismiss,
}) => {
  const tone = TYPE_MAP[type] || TYPE_MAP.info;

  const resolvedActions = actions?.length
    ? actions
    : [{ label: "OK", variant: "primary" }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={cancelable ? onDismiss : undefined}
    >
      <Pressable
        style={styles.overlay}
        onPress={cancelable ? onDismiss : undefined}
      >
        <Pressable style={styles.card}>
          <LinearGradient
            colors={[tone.bgStart, tone.bgEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={[styles.iconWrap, { borderColor: tone.accent }]}> 
              <Icon source={tone.icon} size={22} color={tone.accent} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {!!message && <Text style={styles.message}>{message}</Text>}
          </LinearGradient>

          <View style={styles.actionContainer}>
            {resolvedActions.map((action, idx) => {
              const isPrimary = action.variant === "primary";
              const isDanger = action.variant === "danger";

              return (
                <TouchableOpacity
                  key={`${action.label}-${idx}`}
                  style={[
                    styles.actionButton,
                    isPrimary && styles.primaryAction,
                    isDanger && styles.dangerAction,
                  ]}
                  activeOpacity={0.88}
                  onPress={() => onActionPress(action)}
                >
                  <Text
                    style={[
                      styles.actionText,
                      isPrimary && styles.primaryActionText,
                      isDanger && styles.dangerActionText,
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.46)",
    justifyContent: "center",
    paddingHorizontal: moderateScale(22),
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  header: {
    paddingHorizontal: moderateScale(18),
    paddingVertical: verticalScale(18),
  },

  iconWrap: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    marginBottom: verticalScale(10),
  },

  title: {
    fontSize: moderateScale(18),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  message: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(13),
    lineHeight: moderateScale(19),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  actionContainer: {
    paddingHorizontal: moderateScale(14),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(14),
    backgroundColor: colors.white,
  },

  actionButton: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceBlueSoft,
    paddingVertical: verticalScale(11),
    alignItems: "center",
    marginBottom: verticalScale(8),
  },

  primaryAction: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },

  dangerAction: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },

  actionText: {
    fontSize: moderateScale(14),
    color: colors.primaryBlue,
    fontFamily: fonts.medium,
  },

  primaryActionText: {
    color: colors.white,
    fontFamily: fonts.bold,
  },

  dangerActionText: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
});
