import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import { moderateScale, verticalScale } from "../constants/metrics";
import {
  doesVersionMatchCurrentRelease,
  fetchAppVersionInfo,
  getInstalledAppVersionForDisplay,
  supportsRemoteAppVersionCheck,
} from "../services/appVersionService";

const { height: windowHeight } = Dimensions.get("window");
const RELEASE_NOTES_MAX_HEIGHT = Math.min(
  verticalScale(112),
  Math.max(verticalScale(76), windowHeight * 0.16)
);

const getReleaseNotes = (versionInfo) =>
  String(versionInfo?.releaseNotes || "").trim();

const AppUpdateModal = ({
  visible,
  versionInfo,
  installedVersion,
  isChecking,
  onUpdatePress,
  onRetryPress,
}) => {
  const insets = useSafeAreaInsets();
  const isForceUpdate = true;
  const releaseNotes = getReleaseNotes(versionInfo);
  const currentVersion = String(versionInfo?.currentVersion || "").trim();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={undefined}
    >
      <Pressable
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, verticalScale(18)),
            paddingBottom: Math.max(insets.bottom, verticalScale(18)),
          },
        ]}
      >
        <Pressable style={styles.card} onPress={() => {}}>
          <LinearGradient
            colors={[colors.loginHeroGradientStart, colors.loginHeroGradientMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.iconHalo}>
              <Icon source="cellphone-arrow-down" size={42} color={colors.primaryBlue} />
            </View>
            <Text style={styles.title}>Update Available</Text>
            <Text style={styles.subtitle}>
              A newer version of IrriTrack is ready to install.
            </Text>
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.versionRow}>
              <View style={styles.versionPill}>
                <Text style={styles.versionLabel}>Current</Text>
                <Text style={styles.versionValue}>{installedVersion || "-"}</Text>
              </View>
              <Icon source="arrow-right" size={20} color={colors.textSecondary} />
              <View style={[styles.versionPill, styles.latestPill]}>
                <Text style={styles.versionLabel}>Latest</Text>
                <Text style={styles.versionValue}>{currentVersion || "-"}</Text>
              </View>
            </View>

            {releaseNotes ? (
              <View style={styles.notesWrap}>
                <Text style={styles.notesTitle}>Release Notes</Text>
                <ScrollView
                  style={styles.notesScroll}
                  contentContainerStyle={styles.notesContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.notesText}>{releaseNotes}</Text>
                </ScrollView>
              </View>
            ) : null}

            {isForceUpdate ? (
              <View style={styles.forceBanner}>
                <Icon source="shield-alert-outline" size={18} color={colors.primaryOrange} />
                <Text style={styles.forceText}>
                  This update is required to continue using the app.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.updateButton}
              activeOpacity={0.9}
              onPress={onUpdatePress}
            >
              <Icon source="download" size={18} color={colors.white} />
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.82}
                onPress={onRetryPress}
                disabled={isChecking}
              >
                <Text style={styles.secondaryText}>
                  {isChecking ? "Checking..." : "Check Again"}
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const AppUpdateGate = () => {
  const [versionInfo, setVersionInfo] = useState(null);
  const [isCheckingVersion, setIsCheckingVersion] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const isCheckingRef = useRef(false);
  const canCheckRemoteVersion = supportsRemoteAppVersionCheck();

  const checkAppVersion = useCallback(async () => {
    if (!canCheckRemoteVersion) {
      setVersionInfo(null);
      setShowUpdateModal(false);
      return;
    }

    if (isCheckingRef.current) return;

    isCheckingRef.current = true;
    setIsCheckingVersion(true);

    try {
      const latestVersion = await fetchAppVersionInfo();

      if (!latestVersion) {
        setVersionInfo(null);
        setShowUpdateModal(false);
        return;
      }

      const installedVersion = getInstalledAppVersionForDisplay();
      const shouldShowUpdateModal = !doesVersionMatchCurrentRelease(
        installedVersion,
        latestVersion.currentVersion
      );

      setVersionInfo(latestVersion);
      setShowUpdateModal(shouldShowUpdateModal);
    } catch {
      // Keep the app usable if the version API is temporarily unavailable.
    } finally {
      isCheckingRef.current = false;
      setIsCheckingVersion(false);
    }
  }, [canCheckRemoteVersion]);

  const handleOpenUpdateLink = useCallback(async () => {
    const downloadUrl = String(versionInfo?.downloadURL || "").trim();

    if (!downloadUrl) {
      Alert.alert("Update link unavailable");
      return;
    }

    try {
      await Linking.openURL(downloadUrl);
    } catch {
      Alert.alert("Unable to open update");
    }
  }, [versionInfo]);

  useEffect(() => {
    checkAppVersion();
  }, [checkAppVersion]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        checkAppVersion();
      }
    });

    return () => subscription.remove();
  }, [checkAppVersion]);

  if (!canCheckRemoteVersion || Platform.OS !== "android") {
    return null;
  }

  return (
    <AppUpdateModal
      visible={showUpdateModal}
      versionInfo={versionInfo}
      installedVersion={getInstalledAppVersionForDisplay()}
      isChecking={isCheckingVersion}
      onUpdatePress={handleOpenUpdateLink}
      onRetryPress={checkAppVersion}
    />
  );
};

export default AppUpdateGate;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.modalOverlay,
    paddingHorizontal: moderateScale(22),
  },

  card: {
    maxHeight: "88%",
    overflow: "hidden",
    borderRadius: moderateScale(22),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.loginSheetBorderLight,
  },

  hero: {
    alignItems: "center",
    paddingHorizontal: moderateScale(18),
    paddingTop: verticalScale(18),
    paddingBottom: verticalScale(16),
  },

  iconHalo: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.loginSheetBorderLight,
    marginBottom: verticalScale(10),
  },

  title: {
    fontSize: moderateScale(20),
    color: colors.navyFreshDark,
    fontFamily: fonts.bold,
    textAlign: "center",
  },

  subtitle: {
    marginTop: verticalScale(5),
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textAlign: "center",
  },

  body: {
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(14),
  },

  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },

  versionPill: {
    flex: 1,
    borderRadius: moderateScale(13),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(8),
    backgroundColor: colors.surfaceBluePale,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  latestPill: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primaryGreen,
  },

  versionLabel: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  versionValue: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(14),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  notesWrap: {
    marginTop: verticalScale(12),
    borderRadius: moderateScale(13),
    backgroundColor: colors.surfaceBlueSoft,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  notesTitle: {
    paddingHorizontal: moderateScale(12),
    paddingTop: verticalScale(10),
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  notesScroll: {
    height: RELEASE_NOTES_MAX_HEIGHT,
    maxHeight: RELEASE_NOTES_MAX_HEIGHT,
  },

  notesContent: {
    paddingHorizontal: moderateScale(12),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(10),
  },

  notesText: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  forceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginTop: verticalScale(12),
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(8),
    backgroundColor: "#FFF6E9",
    borderWidth: 1,
    borderColor: "#FFE3B5",
  },

  forceText: {
    flex: 1,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  updateButton: {
    marginTop: verticalScale(14),
    minHeight: verticalScale(44),
    borderRadius: moderateScale(999),
    backgroundColor: colors.primaryBlue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(8),
  },

  updateButtonText: {
    fontSize: moderateScale(15),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  secondaryActions: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: moderateScale(12),
    marginTop: verticalScale(8),
  },

  secondaryButton: {
    minHeight: verticalScale(34),
    justifyContent: "center",
    paddingHorizontal: moderateScale(10),
  },

  secondaryText: {
    fontSize: moderateScale(13),
    color: colors.primaryBlue,
    fontFamily: fonts.semiBold,
  },
});
