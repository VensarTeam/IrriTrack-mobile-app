import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  Camera,
  runAtTargetFps,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { useFaceDetector } from "react-native-vision-camera-face-detector/lib/module/FaceDetector";
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
const AUTO_CONTINUE_DELAY = 700;
const FACE_DETECTION_TARGET_FPS = 8;
const STABLE_FACE_FRAMES_REQUIRED = 3;
const OPEN_EYE_FRAMES_REQUIRED = 3;
const CLOSED_EYE_FRAMES_REQUIRED = 2;
const LOST_FACE_RESET_FRAMES = 2;
const EYE_SMOOTHING_PREVIOUS_WEIGHT = 0.35;
const EYE_OPEN_AVERAGE_THRESHOLD = 0.5;
const EYE_OPEN_STRONG_EYE_THRESHOLD = 0.62;
const EYE_OPEN_WEAKER_EYE_THRESHOLD = 0.16;
const EYE_OPEN_BASELINE_DECAY = 0.92;
const EYE_CLOSED_ABSOLUTE_THRESHOLD = 0.34;
const EYE_CLOSED_FROM_BASELINE_DELTA = 0.16;
const EYE_CLOSED_SINGLE_EYE_THRESHOLD = 0.22;
const EYE_PARTIAL_BLINK_DROP_THRESHOLD = 0.12;

function clampEyeProbability(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.max(0, Math.min(1, value));
}

function resolveEyeMetrics(face) {
  const eyes = [
    clampEyeProbability(face.leftEyeOpenProbability),
    clampEyeProbability(face.rightEyeOpenProbability),
  ].filter((value) => value !== null);

  if (eyes.length === 0) {
    return null;
  }

  const average = eyes.reduce((sum, value) => sum + value, 0) / eyes.length;

  return {
    average,
    minimum: Math.min(...eyes),
    maximum: Math.max(...eyes),
  };
}

function smoothEyeAverage(previous, next) {
  if (previous === null) {
    return next;
  }

  return (
    previous * EYE_SMOOTHING_PREVIOUS_WEIGHT +
    next * (1 - EYE_SMOOTHING_PREVIOUS_WEIGHT)
  );
}

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
  const faceGuidePulseAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const cameraRef = useRef(null);
  const autoContinueTimerRef = useRef(null);
  const isTakingPhotoRef = useRef(false);
  const isCameraVisibleRef = useRef(false);
  const isCameraReadyRef = useRef(false);
  const blinkDetectedRef = useRef(false);
  const stableFaceFrameCountRef = useRef(0);
  const wasEyeOpenRef = useRef(false);
  const blinkClosedConfirmedRef = useRef(false);
  const closedEyeFrameCountRef = useRef(0);
  const openEyeFrameCountRef = useRef(0);
  const lostFaceFrameCountRef = useRef(0);
  const smoothedEyeAverageRef = useRef(null);
  const eyeOpenBaselineRef = useRef(0);
  const lastBlinkStatusRef = useRef("");
  const faceDetectionOptions = useRef({
    performanceMode: "fast",
    classificationMode: "all",
    landmarkMode: "none",
    contourMode: "none",
    minFaceSize: 0.15,
    trackingEnabled: true,
    cameraFacing: "front",
  }).current;
  const frontCamera = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [blinkStatus, setBlinkStatus] = useState(
    "Align your face inside the circle"
  );
  const isReady = Boolean(faceImage?.uri);
  const isCameraVisible = visible && hasPermission && Boolean(frontCamera) && !isReady;
  const isWaitingForBlink = isCameraVisible && !isReady;
  const faceGuideAnimatedStyle = {
    opacity: faceGuidePulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.72, 1],
    }),
    transform: [
      {
        scale: faceGuidePulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.06],
        }),
      },
    ],
  };
  const blinkEyeAnimatedStyle = {
    transform: [
      {
        scaleY: blinkAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.18, 1],
        }),
      },
    ],
  };

  const clearAutoContinueTimer = useCallback(() => {
    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }
  }, []);

  const updateBlinkStatus = useCallback((status) => {
    if (lastBlinkStatusRef.current === status) return;

    lastBlinkStatusRef.current = status;
    setBlinkStatus(status);
  }, []);

  const resetBlinkSignalTracking = useCallback(() => {
    stableFaceFrameCountRef.current = 0;
    wasEyeOpenRef.current = false;
    blinkClosedConfirmedRef.current = false;
    closedEyeFrameCountRef.current = 0;
    openEyeFrameCountRef.current = 0;
    lostFaceFrameCountRef.current = 0;
    smoothedEyeAverageRef.current = null;
    eyeOpenBaselineRef.current = 0;
  }, []);

  const resetBlinkDetection = useCallback(() => {
    blinkDetectedRef.current = false;
    resetBlinkSignalTracking();
    lastBlinkStatusRef.current = "";
    setBlinkStatus("Align your face inside the circle");
  }, [resetBlinkSignalTracking]);

  useEffect(() => {
    isCameraVisibleRef.current = isCameraVisible;
    if (!isCameraVisible) {
      isCameraReadyRef.current = false;
    }
  }, [isCameraVisible]);

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(hiddenSheetOffset);
      fadeAnim.setValue(0);
      isTakingPhotoRef.current = false;
      setIsTakingPhoto(false);
      resetBlinkDetection();
      clearAutoContinueTimer();
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
  }, [
    clearAutoContinueTimer,
    fadeAnim,
    hiddenSheetOffset,
    resetBlinkDetection,
    slideAnim,
    visible,
  ]);

  const handleTakePhoto = useCallback(async () => {
    if (isTakingPhotoRef.current) return;

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

    if (!isCameraReadyRef.current) {
      updateBlinkStatus("Camera is getting ready. Please wait a moment.");
      return;
    }

    try {
      isTakingPhotoRef.current = true;
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
      isTakingPhotoRef.current = false;
      onCapture?.(capturedPhoto);
    } catch (captureError) {
      onCaptureError?.("Unable to capture photo. Please try again.");
      resetBlinkDetection();
      isTakingPhotoRef.current = false;
      setIsTakingPhoto(false);
    }
  }, [
    frontCamera,
    hasPermission,
    onCapture,
    onCaptureError,
    requestPermission,
    resetBlinkDetection,
    updateBlinkStatus,
  ]);

  const handleBlinkCapture = useCallback(() => {
    if (
      blinkDetectedRef.current ||
      isTakingPhotoRef.current ||
      !isCameraVisibleRef.current ||
      !isCameraReadyRef.current
    ) {
      return;
    }

    blinkDetectedRef.current = true;
    blinkClosedConfirmedRef.current = false;
    closedEyeFrameCountRef.current = 0;
    updateBlinkStatus("Blink detected. Capturing photo...");
    void handleTakePhoto();
  }, [handleTakePhoto, updateBlinkStatus]);

  const { detectFaces, stopListeners } = useFaceDetector(faceDetectionOptions);
  const handleDetectedFaces = useMemo(
    () =>
      Worklets.createRunOnJS((faces = []) => {
        if (
          !isCameraVisibleRef.current ||
          !isCameraReadyRef.current ||
          blinkDetectedRef.current ||
          isTakingPhotoRef.current
        ) {
          return;
        }

        if (faces.length !== 1) {
          lostFaceFrameCountRef.current += 1;

          if (lostFaceFrameCountRef.current >= LOST_FACE_RESET_FRAMES) {
            resetBlinkSignalTracking();
            updateBlinkStatus(
              faces.length > 1
                ? "Keep only one face in view."
                : "Center your face in the circle."
            );
          } else {
            closedEyeFrameCountRef.current = 0;
          }
          return;
        }

        lostFaceFrameCountRef.current = 0;
        stableFaceFrameCountRef.current = Math.min(
          stableFaceFrameCountRef.current + 1,
          STABLE_FACE_FRAMES_REQUIRED
        );

        if (stableFaceFrameCountRef.current < STABLE_FACE_FRAMES_REQUIRED) {
          closedEyeFrameCountRef.current = 0;
          updateBlinkStatus("Hold still while we check your face.");
          return;
        }

        const eyeMetrics = resolveEyeMetrics(faces[0]);
        if (!eyeMetrics) {
          blinkClosedConfirmedRef.current = false;
          closedEyeFrameCountRef.current = 0;
          updateBlinkStatus("Look straight at the camera.");
          return;
        }

        const smoothedAverage = smoothEyeAverage(
          smoothedEyeAverageRef.current,
          eyeMetrics.average
        );
        smoothedEyeAverageRef.current = smoothedAverage;

        const eyesOpen =
          smoothedAverage >= EYE_OPEN_AVERAGE_THRESHOLD ||
          (eyeMetrics.maximum >= EYE_OPEN_STRONG_EYE_THRESHOLD &&
            eyeMetrics.minimum >= EYE_OPEN_WEAKER_EYE_THRESHOLD);

        if (eyesOpen) {
          if (blinkClosedConfirmedRef.current) {
            resetBlinkSignalTracking();
            handleBlinkCapture();
            return;
          }

          eyeOpenBaselineRef.current =
            eyeOpenBaselineRef.current > 0
              ? Math.max(
                  eyeOpenBaselineRef.current * EYE_OPEN_BASELINE_DECAY,
                  smoothedAverage
                )
              : smoothedAverage;
          openEyeFrameCountRef.current = Math.min(
            openEyeFrameCountRef.current + 1,
            OPEN_EYE_FRAMES_REQUIRED + 2
          );
          wasEyeOpenRef.current =
            openEyeFrameCountRef.current >= OPEN_EYE_FRAMES_REQUIRED;
          closedEyeFrameCountRef.current = 0;
          updateBlinkStatus(
            wasEyeOpenRef.current
              ? "Face verified. Blink once now."
              : "Keep eyes open for a moment."
          );
          return;
        }

        if (!wasEyeOpenRef.current) {
          openEyeFrameCountRef.current = 0;
          closedEyeFrameCountRef.current = 0;
          updateBlinkStatus("Open eyes first, then blink once.");
          return;
        }

        const openBaseline =
          eyeOpenBaselineRef.current > 0
            ? eyeOpenBaselineRef.current
            : smoothedAverage;
        const averageDrop = openBaseline - smoothedAverage;
        const closedAverageThreshold = Math.max(
          EYE_CLOSED_ABSOLUTE_THRESHOLD,
          openBaseline - EYE_CLOSED_FROM_BASELINE_DELTA
        );
        const closedSingleEyeThreshold = Math.max(
          EYE_CLOSED_SINGLE_EYE_THRESHOLD,
          closedAverageThreshold - 0.1
        );
        const eyesClosed =
          smoothedAverage <= closedAverageThreshold ||
          (eyeMetrics.minimum <= closedSingleEyeThreshold &&
            averageDrop >= EYE_PARTIAL_BLINK_DROP_THRESHOLD);

        if (!eyesClosed) {
          closedEyeFrameCountRef.current = Math.max(
            0,
            closedEyeFrameCountRef.current - 1
          );
          return;
        }

        closedEyeFrameCountRef.current += 1;
        const clearBlinkDrop = averageDrop >= 0.18;
        if (
          closedEyeFrameCountRef.current >= CLOSED_EYE_FRAMES_REQUIRED ||
          clearBlinkDrop
        ) {
          blinkClosedConfirmedRef.current = true;
          updateBlinkStatus("Blink detected. Open eyes to capture.");
        }
      }),
    [handleBlinkCapture, resetBlinkSignalTracking, updateBlinkStatus]
  );
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";

      runAtTargetFps(FACE_DETECTION_TARGET_FPS, () => {
        "worklet";

        const faces = detectFaces(frame);
        handleDetectedFaces(faces);
      });
    },
    [detectFaces, handleDetectedFaces]
  );

  useEffect(() => stopListeners, [stopListeners]);

  useEffect(() => {
    if (!isCameraVisible) {
      faceGuidePulseAnim.stopAnimation();
      blinkAnim.stopAnimation();
      resetBlinkDetection();
      return undefined;
    }

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(faceGuidePulseAnim, {
          toValue: 1,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(faceGuidePulseAnim, {
          toValue: 0,
          duration: 720,
          useNativeDriver: true,
        }),
      ])
    );
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ])
    );

    pulseAnimation.start();
    blinkAnimation.start();
    updateBlinkStatus("Center your face, then blink once.");

    return () => {
      pulseAnimation.stop();
      blinkAnimation.stop();
      resetBlinkDetection();
    };
  }, [
    blinkAnim,
    faceGuidePulseAnim,
    isCameraVisible,
    resetBlinkDetection,
    updateBlinkStatus,
  ]);

  useEffect(() => {
    if (!visible || !isReady || !onContinue) return undefined;

    autoContinueTimerRef.current = setTimeout(onContinue, AUTO_CONTINUE_DELAY);

    return clearAutoContinueTimer;
  }, [clearAutoContinueTimer, isReady, onContinue, visible]);

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
            frameProcessor={frameProcessor}
            resizeMode="cover"
            androidPreviewViewType="texture-view"
            onInitialized={() => {
              isCameraReadyRef.current = true;
              updateBlinkStatus("Center your face, then blink once.");
            }}
          />
          <View pointerEvents="none" style={styles.cameraOverlay}>
            <Animated.View
              style={[styles.faceGuide, faceCircleStyle, faceGuideAnimatedStyle]}
            />
            <View style={styles.blinkCue}>
              <View style={styles.blinkEyesRow}>
                <Animated.View style={[styles.blinkEye, blinkEyeAnimatedStyle]}>
                  <View style={styles.blinkPupil} />
                </Animated.View>
                <Animated.View style={[styles.blinkEye, blinkEyeAnimatedStyle]}>
                  <View style={styles.blinkPupil} />
                </Animated.View>
              </View>
              <Text style={styles.blinkCueText}>Blink once</Text>
            </View>
            <View style={styles.countdownBadge}>
              {isTakingPhoto ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.countdownText}>ML</Text>
              )}
            </View>
            <View style={styles.guideLabel}>
              <Text style={styles.guideLabelText}>{blinkStatus}</Text>
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
                  Place your face inside the circle. ML Kit will detect your
                  blink and capture automatically.
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
                  {isReady
                    ? "Ready"
                    : isCameraVisible
                      ? "Auto capture"
                      : "Capture required"}
                </Text>
              </View>
            </View>

            <View style={[styles.previewCard, previewHeightStyle]}>{renderPreview()}</View>

            <View style={styles.noteCard}>
              <Text style={styles.noteText}>Keep your face centered and visible.</Text>
              <Text style={styles.noteText}>Use good lighting.</Text>
              <Text style={styles.noteText}>Open your eyes first, then blink once.</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (isTakingPhoto || isWaitingForBlink) && styles.disabledButton,
              ]}
              onPress={isReady ? onRetake : handleTakePhoto}
              disabled={isTakingPhoto || isWaitingForBlink}
              activeOpacity={0.9}
            >
              {isTakingPhoto ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isReady
                    ? "Retake photo"
                    : isWaitingForBlink
                      ? "Waiting for blink"
                      : hasPermission
                        ? "Start face check"
                      : "Allow camera"}
                </Text>
              )}
            </TouchableOpacity>

            {isReady ? (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  isTakingPhoto && styles.disabledButton,
                ]}
                onPress={onContinue}
                disabled={isTakingPhoto}
                activeOpacity={0.9}
              >
                <Text style={styles.secondaryButtonText}>Continue</Text>
              </TouchableOpacity>
            ) : null}
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

  blinkCue: {
    position: "absolute",
    top: verticalScale(16),
    alignSelf: "center",
    alignItems: "center",
    borderRadius: moderateScale(999),
    backgroundColor: colors.guideLabelSurface,
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(8),
  },

  blinkEyesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(8),
    marginBottom: verticalScale(3),
  },

  blinkEye: {
    width: moderateScale(24),
    height: verticalScale(13),
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  blinkPupil: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: colors.navyFreshDark,
  },

  blinkCueText: {
    color: colors.white,
    fontSize: moderateScale(11),
    fontFamily: fonts.semiBold,
  },

  countdownBadge: {
    position: "absolute",
    right: moderateScale(18),
    top: verticalScale(18),
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: colors.guideLabelSurface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.faceGuideBorder,
  },

  countdownText: {
    color: colors.white,
    fontSize: moderateScale(15),
    fontFamily: fonts.bold,
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
