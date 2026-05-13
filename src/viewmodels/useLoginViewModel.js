import { useCallback, useEffect, useRef, useState } from "react";
import { ROUTES } from "../navigation/routes";
import { useAuth } from "../context/AuthContext";
import * as SecureStore from "expo-secure-store";
import {
  checkPushNotificationPermission,
  getFcmToken,
  openPushNotificationSettings,
  requestPushNotificationPermission,
} from "../services/pushNotificationService";
import { registerNotificationToken } from "../services/notificationTokenService";

const WELCOME_AUTO_CONTINUE_DELAY = 2000;
const AUTH_FLOW_LOGS_ENABLED = typeof __DEV__ === "undefined" || __DEV__;
const NOTIFICATION_PROMPT_SKIPPED_KEY = "irritrack.notificationPromptSkipped";

const maskToken = (token) => {
  if (!token) return "";
  if (token.length <= 12) return "***";

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
};

const getVerificationToken = (challenge) =>
  challenge?.verificationToken ||
  challenge?.data?.verificationToken ||
  "";

const logAuthFlow = (message, data = {}) => {
  if (!AUTH_FLOW_LOGS_ENABLED) return;

  console.log(`[AUTH] ${message}`, data);
};

const useLoginViewModel = (navigation) => {
  const { beginSignIn, finishFaceVerification } = useAuth();
  const scrollRef = useRef(null);
  const passwordRef = useRef(null);
  const welcomeTimerRef = useRef(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [faceImage, setFaceImage] = useState(null);
  const [faceError, setFaceError] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [isCredentialsSubmitting, setIsCredentialsSubmitting] = useState(false);
  const [isFaceSubmitting, setIsFaceSubmitting] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    const checkPrompt = async () => {
      try {
        const hasSkippedPrompt = await SecureStore.getItemAsync(
          NOTIFICATION_PROMPT_SKIPPED_KEY
        );
        const isGranted = await checkPushNotificationPermission();
        if (!isGranted && hasSkippedPrompt !== "true") {
          setShowNotificationPrompt(true);
        }
      } catch (e) {
        console.warn("Failed to check notification prompt status", e);
      }
    };
    checkPrompt();
  }, []);

  const handleAllowNotifications = async () => {
    try {
      const isGranted = await requestPushNotificationPermission();
      if (!isGranted) {
        await openPushNotificationSettings();
      } else {
        const token = await getFcmToken();
        console.log("FCM token after allow:", token);
      }
    } catch (e) {
      console.warn("Failed to request notifications", e);
    } finally {
      setShowNotificationPrompt(false);
    }
  };

  const handleSkipNotifications = async () => {
    try {
      await SecureStore.setItemAsync(NOTIFICATION_PROMPT_SKIPPED_KEY, "true", {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      setShowNotificationPrompt(false);
    } catch (e) {
      console.warn("Failed to save skip notification", e);
    }
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });
  };

  const getDefaultWelcomeName = useCallback(() => {
    const trimmed = identifier.trim();

    if (!trimmed) return "";

    return `+91 ${trimmed}`;
  }, [identifier]);

  const validateIdentifier = () => {
    const trimmed = identifier.trim();

    if (!trimmed) return "Mobile number is required";

    if (!/^\d{10}$/.test(trimmed)) {
      return "Enter a valid 10-digit mobile number";
    }

    return null;
  };

  const handleIdentifierChange = (value) => {
    setIdentifier(value);
    setSubmitError("");

    if (errors.identifier) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        identifier: undefined,
      }));
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setSubmitError("");

    if (errors.password) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        password: undefined,
      }));
    }
  };

  const validate = async () => {
    const newErrors = {};
    const identifierError = validateIdentifier();

    if (identifierError) newErrors.identifier = identifierError;
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      scrollToBottom();
      return;
    }

    setSubmitError("");
    setFaceError("");
    setFaceImage(null);
    setVerificationToken("");
    setIsCredentialsSubmitting(true);

    try {
      const challenge = await beginSignIn({
        mobile: identifier.trim(),
        password,
      });
      const loginVerificationToken = getVerificationToken(challenge);

      if (!loginVerificationToken) {
        throw new Error("Login started but no verification token was returned.");
      }

      logAuthFlow("Login verification token received", {
        token: maskToken(loginVerificationToken),
        requiredVerification: challenge?.requiredVerification,
        expiresIn: challenge?.verificationExpiresIn,
      });
      setVerificationToken(loginVerificationToken);
      setIsVerificationVisible(true);
    } catch (error) {
      setSubmitError(
        error?.message || "Something went wrong. Please try again."
      );
      scrollToBottom();
    } finally {
      setIsCredentialsSubmitting(false);
    }
  };

  const goToForgotPassword = () => {
    navigation.navigate(ROUTES.AUTH.FORGOT_PASSWORD);
  };

  const clearWelcomeTimer = useCallback(() => {
    if (welcomeTimerRef.current) {
      clearTimeout(welcomeTimerRef.current);
      welcomeTimerRef.current = null;
    }
  }, []);

  const goToAppTabs = useCallback(() => {
    const rootNavigation = navigation.getParent?.();

    if (rootNavigation?.replace) {
      rootNavigation.replace(ROUTES.ROOT.APP_TABS);
      return;
    }

    navigation.replace(ROUTES.ROOT.APP_TABS);
  }, [navigation]);

  useEffect(() => {
    if (!showWelcome) return undefined;

    welcomeTimerRef.current = setTimeout(() => {
      welcomeTimerRef.current = null;
      setShowWelcome(false);
      goToAppTabs();
    }, WELCOME_AUTO_CONTINUE_DELAY);

    return clearWelcomeTimer;
  }, [clearWelcomeTimer, goToAppTabs, showWelcome]);

  const closeVerificationSheet = () => {
    if (isFaceSubmitting) return;

    setIsVerificationVisible(false);
    setFaceError("");
    setFaceImage(null);
    setVerificationToken("");
  };

  const handleFaceCaptured = (photo) => {
    setFaceError("");
    setFaceImage({
      ...photo,
      type: photo?.type || "image/jpeg",
    });
  };

  const retakeFaceVerification = () => {
    if (isFaceSubmitting) return;

    setFaceError("");
    setFaceImage(null);
  };

  const handleFaceCaptureError = (message) => {
    setFaceError(message || "");
  };

  const continueAfterFaceVerification = async () => {
    if (isFaceSubmitting) return;

    if (!faceImage?.uri) {
      setFaceError("Please capture a selfie before continuing.");
      return;
    }

    if (!verificationToken) {
      setFaceError("Login session expired. Please log in again.");
      return;
    }

    setFaceError("");
    setIsFaceSubmitting(true);
    logAuthFlow("Face verify using verification token", {
      token: maskToken(verificationToken),
      imageName: faceImage.fileName || faceImage.name || null,
      imageType: faceImage.type || "image/jpeg",
    });

    try {
      const verifiedSession = await finishFaceVerification({
        verificationToken,
        faceImage,
      });

      // Register FCM token with the server (fire-and-forget)
      void registerNotificationToken();

      setVerificationToken("");
      setIsVerificationVisible(false);
      setWelcomeName(
        verifiedSession?.user?.name ||
          verifiedSession?.user?.mobile ||
          getDefaultWelcomeName()
      );
      setShowWelcome(true);
    } catch (error) {
      setFaceError(
        error?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsFaceSubmitting(false);
    }
  };

  const handleWelcomeClose = () => {
    clearWelcomeTimer();
    setShowWelcome(false);
    goToAppTabs();
  };

  return {
    scrollRef,
    passwordRef,
    identifier,
    setIdentifier: handleIdentifierChange,
    password,
    setPassword: handlePasswordChange,
    errors,
    submitError,
    validate,
    scrollToBottom,
    goToForgotPassword,
    isVerificationVisible,
    faceImage,
    faceError,
    showWelcome,
    welcomeName: welcomeName || getDefaultWelcomeName(),
    isCredentialsSubmitting,
    isFaceSubmitting,
    closeVerificationSheet,
    handleFaceCaptured,
    retakeFaceVerification,
    handleFaceCaptureError,
    continueAfterFaceVerification,
    handleWelcomeClose,
    showNotificationPrompt,
    handleAllowNotifications,
    handleSkipNotifications,
  };
};

export default useLoginViewModel;
