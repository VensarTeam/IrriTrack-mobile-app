import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import typography from "../constants/typography";
import { moderateScale, verticalScale } from "../constants/metrics";

const SHEET_HIDDEN_OFFSET = 420;
const SHEET_TOP_MARGIN = 24;
const SHEET_MIN_HEIGHT = 280;
const SHEET_OPEN_DURATION = 320;
const OVERLAY_FADE_DURATION = 240;
const PREVIEW_MAX_HEIGHT = 250;
const PREVIEW_MIN_HEIGHT = 180;
const PREVIEW_HEIGHT_RATIO = 0.31;
const FACE_GUIDE_MIN_SIZE = 120;
const FACE_GUIDE_MAX_SIZE = 208;
const FACE_GUIDE_VERTICAL_RESERVE = 44;

const FaceVerificationSheet = ({
  visible,
  faceImage,
  error,
  onClose,
  onCapture,
  onRetake,
  onCaptureError,
  onContinue,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const hiddenSheetOffset = Math.min(windowHeight, verticalScale(SHEET_HIDDEN_OFFSET));
  const sheetMaxHeight = Math.max(
    verticalScale(SHEET_MIN_HEIGHT),
    windowHeight - Math.max(insets.top, verticalScale(SHEET_TOP_MARGIN)),
  );
  const previewHeight = Math.min(
    verticalScale(PREVIEW_MAX_HEIGHT),
    Math.max(verticalScale(PREVIEW_MIN_HEIGHT), windowHeight * PREVIEW_HEIGHT_RATIO),
  );
  const faceGuideSize = Math.max(
    moderateScale(FACE_GUIDE_MIN_SIZE),
    Math.min(
      moderateScale(FACE_GUIDE_MAX_SIZE),
      previewHeight - verticalScale(FACE_GUIDE_VERTICAL_RESERVE),
    ),
  );
  const previewHeightStyle = { minHeight: previewHeight };
  const cameraHeightStyle = { height: previewHeight };
  const faceCircleStyle = {
    width: faceGuideSize,
    height: faceGuideSize,
    borderRadius: faceGuideSize / 2,
  };
  const slideAnim = useRef(new Animated.Value(hiddenSheetOffset)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null);
  const frontCamera = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const isReady = Boolean(faceImage?.uri);
  const isCameraVisible = visible && hasPermission && Boolean(frontCamera) && !isReady;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(hiddenSheetOffset);
      fadeAnim.setValue(0);
      setIsTakingPhoto(false);
      return;
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: SHEET_OPEN_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: OVERLAY_FADE_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, hiddenSheetOffset, slideAnim, visible]);

  const handleTakePhoto = async () => {
    if (isTakingPhoto) return;

    if (!hasPermission) {
      const granted = await requestPermission();

      if (!granted) {
        onCaptureError?.("Camera access is required to continue.");
      }
      return;
    }

    if (!frontCamera || !cameraRef.current) {
      onCaptureError?.("Front camera is not available on this device.");
      return;
    }

    try {
      setIsTakingPhoto(true);
      onCaptureError?.("");

      const photo = await cameraRef.current.takePhoto({
        flash: "off",
        enableShutterSound: false,
      });

      const uri = photo.path.startsWith("file://")
        ? photo.path
        : `file://${photo.path}`;

      const capturedPhoto = {
        uri,
        fileName: `face-verification-${Date.now()}.jpg`,
        width: photo.width,
        height: photo.height,
      };

      setIsTakingPhoto(false);
      onCapture?.(capturedPhoto);
    } catch (captureError) {
      onCaptureError?.("Unable to capture photo. Please try again.");
      setIsTakingPhoto(false);
    }
  };

  const renderPreview = () => {
    if (isReady) {
      return (
        <View style={[styles.capturedPreviewWrap, previewHeightStyle]}>
          <View style={[styles.capturedCircle, faceCircleStyle]}>
            <Image
              source={{ uri: faceImage.uri }}
              style={styles.capturedImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.capturedLabel}>Captured photo</Text>
        </View>
      );
    }

    if (isCameraVisible) {
      return (
        <View style={[styles.cameraWrap, cameraHeightStyle]}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={frontCamera}
            isActive={isCameraVisible}
            photo
            resizeMode="cover"
            androidPreviewViewType="texture-view"
          />
          <View pointerEvents="none" style={styles.cameraOverlay}>
            <View style={[styles.faceGuide, faceCircleStyle]} />
            <View style={styles.guideLabel}>
              <Text style={styles.guideLabelText}>Align your face inside the circle</Text>
            </View>
          </View>
        </View>
      );
    }

    if (!hasPermission) {
      return (
        <View style={styles.previewPlaceholder}>
          <View style={styles.previewAvatar} />
          <Text style={styles.previewTitle}>Camera access required</Text>
          <Text style={styles.previewText}>
            Allow access to use the front camera for verification.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.previewPlaceholder}>
        <View style={styles.previewAvatar} />
        <Text style={styles.previewTitle}>Front camera required</Text>
        <Text style={styles.previewText}>
          Front camera is not available on this device.
        </Text>
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: sheetMaxHeight,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: Math.max(insets.bottom, verticalScale(16)) + verticalScale(12),
              },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Verification</Text>
                <Text style={styles.title}>Face verification</Text>
                <Text style={styles.subtitle}>
                  Place your face inside the circle and capture a clear photo.
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isReady ? styles.statusBadgeSuccess : styles.statusBadgePending,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isReady ? styles.statusTextSuccess : styles.statusTextPending,
                  ]}
                >
                  {isReady ? "Ready" : "Capture required"}
                </Text>
              </View>
            </View>

            <View style={[styles.previewCard, previewHeightStyle]}>{renderPreview()}</View>

            <View style={styles.noteCard}>
              <Text style={styles.noteText}>Keep your face centered and visible.</Text>
              <Text style={styles.noteText}>Use good lighting.</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, isTakingPhoto && styles.disabledButton]}
              onPress={isReady ? onRetake : handleTakePhoto}
              disabled={isTakingPhoto}
              activeOpacity={0.9}
            >
              {isTakingPhoto ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isReady
                    ? "Retake photo"
                    : hasPermission
                      ? "Capture photo"
                      : "Allow camera"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                (!isReady || isTakingPhoto) && styles.disabledButton,
              ]}
              onPress={onContinue}
              disabled={!isReady || isTakingPhoto}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default FaceVerificationSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "flex-end",
  },

  backdrop: {
    flex: 1,
  },

  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    paddingHorizontal: moderateScale(22),
    paddingTop: verticalScale(14),
    borderTopWidth: 1,
    borderColor: colors.loginSheetBorderLight,
    gap: verticalScale(12),
  },

  scrollArea: {
    width: "100%",
  },

  scrollContent: {
    gap: verticalScale(12),
  },

  handle: {
    width: moderateScale(48),
    height: verticalScale(5),
    borderRadius: moderateScale(999),
    alignSelf: "center",
    backgroundColor: colors.cardBorder,
  },

  headerRow: {
    gap: verticalScale(12),
  },

  headerCopy: {
    gap: verticalScale(4),
  },

  eyebrow: {
    color: colors.primaryGreen,
    fontSize: moderateScale(12),
    fontFamily: fonts.semiBold,
    textTransform: "uppercase",
    letterSpacing: typography.letterSpacing.eyebrow,
  },

  title: {
    color: colors.textDark,
    fontSize: typography.h2,
    fontFamily: fonts.bold,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontFamily: fonts.regular,
    lineHeight: moderateScale(20),
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(999),
  },

  statusBadgePending: {
    backgroundColor: colors.surfaceBlue,
  },

  statusBadgeSuccess: {
    backgroundColor: colors.lightGreen,
  },

  statusText: {
    fontSize: moderateScale(12),
    fontFamily: fonts.semiBold,
  },

  statusTextPending: {
    color: colors.navyFreshDark,
  },

  statusTextSuccess: {
    color: colors.darkGreen,
  },

  previewCard: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: colors.loginSheetBorderLight,
    backgroundColor: colors.surfaceBluePale,
    overflow: "hidden",
    minHeight: verticalScale(212),
    justifyContent: "center",
    alignItems: "center",
  },

  capturedPreviewWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(20),
    gap: verticalScale(12),
  },

  capturedCircle: {
    overflow: "hidden",
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.surfaceBlue,
  },

  capturedImage: {
    width: "100%",
    height: "100%",
  },

  capturedLabel: {
    color: colors.textDark,
    fontSize: moderateScale(13),
    fontFamily: fonts.medium,
  },

  cameraWrap: {
    width: "100%",
    backgroundColor: colors.cameraSurface,
  },

  camera: {
    flex: 1,
  },

  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(24),
    paddingVertical: verticalScale(18),
  },

  faceGuide: {
    borderWidth: 3,
    borderColor: colors.faceGuideBorder,
    backgroundColor: colors.faceGuideSurface,
  },

  guideLabel: {
    position: "absolute",
    bottom: verticalScale(18),
    alignSelf: "center",
    backgroundColor: colors.guideLabelSurface,
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(8),
  },

  guideLabelText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontFamily: fonts.medium,
  },

  previewPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(24),
    paddingVertical: verticalScale(24),
  },

  previewAvatar: {
    width: moderateScale(86),
    height: moderateScale(86),
    borderRadius: moderateScale(43),
    backgroundColor: colors.surfaceBlue,
    borderWidth: 6,
    borderColor: colors.switchBgFresh,
    marginBottom: verticalScale(12),
  },

  previewTitle: {
    color: colors.textDark,
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
    textAlign: "center",
    marginBottom: verticalScale(4),
  },

  previewText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontFamily: fonts.regular,
    textAlign: "center",
    lineHeight: moderateScale(20),
  },

  noteCard: {
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.loginSheetBorderLight,
    gap: verticalScale(6),
  },

  noteText: {
    color: colors.textDark,
    fontSize: moderateScale(13),
    fontFamily: fonts.regular,
    lineHeight: moderateScale(18),
  },

  errorText: {
    color: colors.danger,
    fontSize: moderateScale(13),
    fontFamily: fonts.medium,
  },

  primaryButton: {
    minHeight: verticalScale(50),
    borderRadius: moderateScale(16),
    backgroundColor: colors.navyFresh,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(18),
  },

  primaryButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontFamily: fonts.semiBold,
  },

  secondaryButton: {
    minHeight: verticalScale(50),
    borderRadius: moderateScale(16),
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(18),
  },

  secondaryButtonText: {
    color: colors.darkGreen,
    fontSize: typography.body,
    fontFamily: fonts.semiBold,
  },

  disabledButton: {
    opacity: 0.55,
  },
});
