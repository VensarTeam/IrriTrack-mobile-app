import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
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
import { compressFaceImage } from "../services/imageCompression";

const SHEET_HIDDEN_OFFSET = 420;
const SHEET_TOP_MARGIN = 24;
const SHEET_MIN_HEIGHT = 280;
const SHEET_OPEN_DURATION = 320;
const OVERLAY_FADE_DURATION = 240;
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
  isSubmitting = false,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const hiddenSheetOffset = Math.min(windowHeight, verticalScale(SHEET_HIDDEN_OFFSET));
  const sheetMaxHeight = Math.max(
    verticalScale(SHEET_MIN_HEIGHT),
    windowHeight - Math.max(insets.top, verticalScale(SHEET_TOP_MARGIN)),
  );
  const scannerGuideSize = Math.min(
    moderateScale(320),
    Math.max(moderateScale(230), windowWidth * 0.72)
  );
  const scannerFaceGuideStyle = {
    width: scannerGuideSize,
    height: scannerGuideSize,
    borderRadius: scannerGuideSize / 2,
  };
  const slideAnim = useRef(new Animated.Value(hiddenSheetOffset)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const faceGuidePulseAnim = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null);
  const autoContinueTimerRef = useRef(null);
  const autoContinuedPhotoUriRef = useRef("");
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
  const [isScanning, setIsScanning] = useState(false);
  const [blinkStatus, setBlinkStatus] = useState(
    "Align your face inside the circle"
  );
  const isReady = Boolean(faceImage?.uri);
  const isCameraVisible =
    visible && isScanning && hasPermission && Boolean(frontCamera) && !isReady;
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
    if (isReady) {
      setIsScanning(false);
    }
  }, [isReady]);

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(hiddenSheetOffset);
      fadeAnim.setValue(0);
      autoContinuedPhotoUriRef.current = "";
      isTakingPhotoRef.current = false;
      setIsScanning(false);
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

  const handleStartScan = useCallback(async () => {
    if (isSubmitting || isTakingPhotoRef.current) return;

    if (isReady) {
      onRetake?.();
    }

    if (!hasPermission) {
      const granted = await requestPermission();

      if (!granted) {
        onCaptureError?.("Camera access is required to continue.");
        return;
      }
    }

    if (!frontCamera) {
      onCaptureError?.("Front camera is not available on this device.");
      return;
    }

    onCaptureError?.("");
    resetBlinkDetection();
    setIsScanning(true);
  }, [
    frontCamera,
    hasPermission,
    isReady,
    isSubmitting,
    onCaptureError,
    onRetake,
    requestPermission,
    resetBlinkDetection,
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

      const capturedPhoto = await compressFaceImage({
        uri,
        fileName: `face-verification-${Date.now()}.jpg`,
        width: photo.width,
        height: photo.height,
        type: "image/jpeg",
      });

      setIsScanning(false);
      setIsTakingPhoto(false);
      isTakingPhotoRef.current = false;
      onCapture?.(capturedPhoto);
    } catch (captureError) {
      onCaptureError?.("Unable to capture photo. Please try again.");
      resetBlinkDetection();
      setIsScanning(false);
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
    pulseAnimation.start();
    updateBlinkStatus("Center your face, then blink once.");

    return () => {
      pulseAnimation.stop();
      resetBlinkDetection();
    };
  }, [
    faceGuidePulseAnim,
    isCameraVisible,
    resetBlinkDetection,
    updateBlinkStatus,
  ]);

  useEffect(() => {
    if (!visible || !isReady || !faceImage?.uri || !onContinue || isSubmitting) {
      if (!isReady) {
        autoContinuedPhotoUriRef.current = "";
      }
      return undefined;
    }

    if (autoContinuedPhotoUriRef.current === faceImage.uri) {
      return undefined;
    }

    autoContinuedPhotoUriRef.current = faceImage.uri;
    autoContinueTimerRef.current = setTimeout(onContinue, AUTO_CONTINUE_DELAY);

    return clearAutoContinueTimer;
  }, [
    clearAutoContinueTimer,
    faceImage?.uri,
    isReady,
    isSubmitting,
    onContinue,
    visible,
  ]);

  const renderScanner = () => (
    <View style={styles.scannerScreen}>
      <Camera
        ref={cameraRef}
        style={styles.scannerCamera}
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

      <View style={[styles.scannerTopBar, { paddingTop: insets.top + verticalScale(10) }]}>
        <TouchableOpacity
          style={styles.scannerBackButton}
          onPress={() => {
            setIsScanning(false);
            resetBlinkDetection();
          }}
          disabled={isTakingPhoto}
          activeOpacity={0.85}
        >
          <Text style={styles.scannerBackText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.scannerTitle}>Face scan</Text>
        <View style={styles.scannerBackButtonPlaceholder} />
      </View>

      <View pointerEvents="none" style={styles.scannerOverlay}>
        <Animated.View
          style={[
            styles.faceGuide,
            scannerFaceGuideStyle,
            faceGuideAnimatedStyle,
          ]}
        />
        <View style={styles.scannerStatusPill}>
          {isTakingPhoto ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.scannerStatusText}>{blinkStatus}</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderSetupSheet = () => (
    <Animated.View
      style={[
        styles.sheet,
        {
          maxHeight: sheetMaxHeight,
          paddingBottom:
            Math.max(insets.bottom, verticalScale(16)) + verticalScale(18),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.handle} />

      <View style={styles.setupHero}>
        {isReady ? (
          <Image
            source={{ uri: faceImage.uri }}
            style={styles.setupFacePreview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.setupFaceIcon}>
            <View style={styles.setupFaceHead} />
            <View style={styles.setupFaceBody} />
          </View>
        )}
      </View>

      <Text style={styles.title}>
        {isReady ? "Verifying face" : "Verify it's you with your face"}
      </Text>
      <Text style={styles.subtitle}>
        {isReady ? "Almost done." : "Center your face and blink once."}
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (isTakingPhoto || isSubmitting) && styles.disabledButton,
        ]}
        onPress={isReady ? onContinue : handleStartScan}
        disabled={isTakingPhoto || isSubmitting}
        activeOpacity={0.9}
      >
        {isTakingPhoto || isSubmitting ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>
            {isReady ? "Continue" : "Scan my face"}
          </Text>
        )}
      </TouchableOpacity>

      {isReady ? (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={handleStartScan}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={styles.linkButtonText}>Scan again</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={isSubmitting ? undefined : onClose}
    >
      {isScanning && !isReady ? (
        renderScanner()
      ) : (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Pressable
            style={styles.backdrop}
            onPress={isSubmitting ? undefined : onClose}
          />
          {renderSetupSheet()}
        </Animated.View>
      )}
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
    paddingHorizontal: moderateScale(24),
    paddingTop: verticalScale(14),
    borderTopWidth: 1,
    borderColor: colors.loginSheetBorderLight,
    gap: verticalScale(14),
  },

  handle: {
    width: moderateScale(48),
    height: verticalScale(5),
    borderRadius: moderateScale(999),
    alignSelf: "center",
    backgroundColor: colors.cardBorder,
  },

  setupHero: {
    width: moderateScale(148),
    height: moderateScale(148),
    borderRadius: moderateScale(74),
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceBluePale,
    borderWidth: 1,
    borderColor: colors.loginSheetBorderLight,
    marginTop: verticalScale(6),
  },

  setupFaceIcon: {
    width: moderateScale(92),
    height: moderateScale(92),
    borderRadius: moderateScale(28),
    borderWidth: 2,
    borderColor: colors.navyFresh,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },

  setupFaceHead: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    marginBottom: verticalScale(4),
  },

  setupFaceBody: {
    width: moderateScale(54),
    height: verticalScale(24),
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: colors.primaryGreen,
  },

  setupFacePreview: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(74),
  },

  scannerScreen: {
    flex: 1,
    backgroundColor: colors.cameraSurface,
  },

  scannerCamera: {
    ...StyleSheet.absoluteFillObject,
  },

  scannerTopBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 3,
    paddingHorizontal: moderateScale(20),
    paddingBottom: verticalScale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(12, 46, 77, 0.42)",
  },

  scannerBackButton: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },

  scannerBackButtonPlaceholder: {
    width: moderateScale(42),
    height: moderateScale(42),
  },

  scannerBackText: {
    color: colors.navyFreshDark,
    fontSize: moderateScale(30),
    fontFamily: fonts.medium,
    marginTop: verticalScale(-3),
  },

  scannerTitle: {
    color: colors.white,
    fontSize: moderateScale(18),
    fontFamily: fonts.bold,
  },

  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(24),
  },

  scannerStatusPill: {
    position: "absolute",
    bottom: verticalScale(54),
    minHeight: verticalScale(46),
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.guideLabelSurface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },

  scannerStatusText: {
    color: colors.white,
    fontSize: moderateScale(13),
    fontFamily: fonts.semiBold,
    textAlign: "center",
  },

  title: {
    color: colors.textDark,
    fontSize: typography.h2,
    fontFamily: fonts.bold,
    textAlign: "center",
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontFamily: fonts.regular,
    lineHeight: moderateScale(20),
    textAlign: "center",
  },

  faceGuide: {
    borderWidth: 3,
    borderColor: colors.faceGuideBorder,
    backgroundColor: colors.faceGuideSurface,
  },

  errorText: {
    color: colors.danger,
    fontSize: moderateScale(13),
    fontFamily: fonts.medium,
    textAlign: "center",
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

  linkButton: {
    minHeight: verticalScale(38),
    alignItems: "center",
    justifyContent: "center",
  },

  linkButtonText: {
    color: colors.navyFresh,
    fontSize: moderateScale(13),
    fontFamily: fonts.semiBold,
  },

  disabledButton: {
    opacity: 0.55,
  },
});
