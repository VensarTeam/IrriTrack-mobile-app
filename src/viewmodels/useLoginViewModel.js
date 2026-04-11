import { useCallback, useEffect, useRef, useState } from "react";
import { ROUTES } from "../navigation/routes";

const WELCOME_AUTO_CONTINUE_DELAY = 2000;

const useLoginViewModel = (navigation) => {
  const scrollRef = useRef(null);
  const passwordRef = useRef(null);
  const welcomeTimerRef = useRef(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [faceImage, setFaceImage] = useState(null);
  const [faceError, setFaceError] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });
  };

  const getWelcomeName = () => {
    const trimmed = identifier.trim();

    if (!trimmed) return "";

    return `+91 ${trimmed}`;
  };

  const validateIdentifier = () => {
    const trimmed = identifier.trim();

    if (!trimmed) return "Mobile number is required";

    if (!/^\d{10}$/.test(trimmed)) {
      return "Enter a valid 10-digit mobile number";
    }

    return null;
  };

  const validate = () => {
    const newErrors = {};
    const identifierError = validateIdentifier();

    if (identifierError) newErrors.identifier = identifierError;
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setFaceError("");
      setFaceImage(null);
      setIsVerificationVisible(true);
    } else {
      scrollToBottom();
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
    setIsVerificationVisible(false);
    setFaceError("");
    setFaceImage(null);
  };

  const handleFaceCaptured = (photo) => {
    setFaceError("");
    setFaceImage(photo);
    setIsVerificationVisible(false);
    setShowWelcome(true);
  };

  const retakeFaceVerification = () => {
    setFaceError("");
    setFaceImage(null);
  };

  const handleFaceCaptureError = (message) => {
    setFaceError(message || "");
  };

  const continueAfterFaceVerification = () => {
    if (!faceImage?.uri) {
      setFaceError("Please capture a selfie before continuing.");
      return;
    }

    setIsVerificationVisible(false);
    setShowWelcome(true);
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
    setIdentifier,
    password,
    setPassword,
    errors,
    validate,
    scrollToBottom,
    goToForgotPassword,
    isVerificationVisible,
    faceImage,
    faceError,
    showWelcome,
    welcomeName: getWelcomeName(),
    closeVerificationSheet,
    handleFaceCaptured,
    retakeFaceVerification,
    handleFaceCaptureError,
    continueAfterFaceVerification,
    handleWelcomeClose,
  };
};

export default useLoginViewModel;
