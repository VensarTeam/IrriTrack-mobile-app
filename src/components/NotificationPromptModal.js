import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Icon } from "react-native-paper";
import colors from "../constants/colors";
import fonts from "../constants/fonts";

const { width } = Dimensions.get("window");

const NotificationPromptModal = ({ visible, onAllow, onSkip }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onSkip}
    >
      <View style={styles.container}>
        {/* Floating background decorative icons (optional subtle background) */}
        <View style={[styles.floatingIcon, { top: "10%", left: "15%" }]}>
          <Icon source="bell" size={24} color={colors.primaryBlue + "20"} />
        </View>
        <View style={[styles.floatingIcon, { top: "15%", right: "20%" }]}>
          <Icon source="bell" size={18} color={colors.primaryBlue + "15"} />
        </View>
        <View style={[styles.floatingIcon, { top: "30%", left: "80%" }]}>
          <Icon source="bell" size={28} color={colors.primaryBlue + "10"} />
        </View>

        <View style={styles.content}>
          {/* Illustration replacement */}
          <View style={styles.illustrationContainer}>
            <LinearGradient
              colors={[colors.loginHeroGradientStart, colors.primaryBlue]}
              style={styles.circleBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.documentWrap}>
                <Icon source="file-document-outline" size={80} color={colors.white} />
              </View>
              <View style={styles.bellBadge}>
                <Icon source="bell-ring" size={28} color={colors.primaryBlue} />
              </View>
            </LinearGradient>
          </View>

          {/* Text Content */}
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.description}>
            Please enable notifications to receive important alerts, sync updates, and project statuses.
          </Text>

          {/* Actions */}
          <TouchableOpacity
            style={styles.allowButton}
            onPress={onAllow}
            activeOpacity={0.8}
          >
            <Text style={styles.allowButtonText}>ALLOW</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>SKIP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default NotificationPromptModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  illustrationContainer: {
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  circleBg: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: (width * 0.55) / 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  documentWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: colors.white,
    borderRadius: 25,
    padding: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.navyFreshDark,
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 10,
  },
  allowButton: {
    backgroundColor: "#4C9AFF", // Matches the reference light blue
    width: "100%",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#4C9AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  allowButtonText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 16,
    letterSpacing: 1,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  skipButtonText: {
    fontFamily: fonts.semiBold,
    color: "#4C9AFF",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  floatingIcon: {
    position: "absolute",
  },
});
