import { useEffect, useRef, useState } from "react";
import { ROUTES } from "../navigation/routes";
import { showAppAlert } from "../services/alertService";
import {
  requestPasswordResetOtp,
  resetPassword,
} from "../services/authApi";

const OTP_LENGTH = 6;
const STEPS = {
  IDENTIFIER: 1,
  OTP: 2,
  PASSWORD: 3,
};
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const USERNAME_PATTERN = /^[A-Z0-9._-]{3,}$/i;
const SHOULD_PREFILL_DEVELOPMENT_OTP =
  typeof __DEV__ !== "undefined" && __DEV__;

const getDevelopmentOtpDigits = (response) => {
  if (!SHOULD_PREFILL_DEVELOPMENT_OTP) return null;

  const developmentOtp = String(response?.developmentOtp || "").replace(/\D/g, "");

  return developmentOtp.length === OTP_LENGTH
    ? developmentOtp.split("")
    : null;
};

const useForgotPasswordViewModel = (navigation) => {
  const [step, setStep] = useState(STEPS.IDENTIFIER);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [otpDeliveryMessage, setOtpDeliveryMessage] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const scrollRef = useRef(null);
  const otpInputs = useRef([]);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const clearStepErrors = () => {
    setErrors({});
  };

  const clearFieldError = (field) => {
    if (!errors[field] && !errors.submit) return;

    setErrors((prev) => ({
      ...prev,
      [field]: null,
      submit: null,
    }));
  };

  const goToLoginRoot = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: ROUTES.AUTH.LOGIN }],
    });
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });
  };

  useEffect(() => {
    if (step === STEPS.OTP) {
      setTimeout(() => {
        otpInputs.current[0]?.focus();
        scrollToBottom();
      }, 160);
    }

    if (step === STEPS.PASSWORD) {
      setTimeout(() => {
        passwordRef.current?.focus();
        scrollToBottom();
      }, 180);
    }
  }, [step]);

  const validateIdentifier = (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Username, mobile number, or email is required";
    }

    if (/^\d+$/.test(trimmed)) {
      return /^\d{10}$/.test(trimmed)
        ? null
        : "Enter a valid 10-digit mobile number";
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      return USERNAME_PATTERN.test(trimmed)
        ? null
        : "Enter a valid username, mobile number, or email address";
    }

    return null;
  };

  const handleIdentifierChange = (value) => {
    setIdentifier(value);
    setOtpDeliveryMessage("");
    clearFieldError("identifier");
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    clearFieldError("password");
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    clearFieldError("confirmPassword");
  };

  const goToOtpStep = async () => {
    const identifierError = validateIdentifier(identifier);

    if (identifierError) {
      setErrors({ identifier: identifierError });
      return;
    }

    setIsSendingOtp(true);
    setOtpDeliveryMessage("");
    clearStepErrors();

    try {
      const response = await requestPasswordResetOtp({
        identifier: identifier.trim(),
      });
      const developmentOtpDigits = getDevelopmentOtpDigits(response);

      setOtp(developmentOtpDigits || Array(OTP_LENGTH).fill(""));
      setOtpDeliveryMessage(response?.message || "OTP sent successfully.");
      setStep(STEPS.OTP);
    } catch (error) {
      setErrors({
        submit: error?.message || "Unable to send OTP. Please try again.",
      });
      scrollToBottom();
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (text, index) => {
    if (isResettingPassword) return;
    if (!/^\d?$/.test(text)) return;

    const nextOtp = [...otp];
    nextOtp[index] = text;
    setOtp(nextOtp);

    if (text && index < OTP_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }

    if (errors.otp || errors.submit) {
      setErrors((prev) => ({ ...prev, otp: null, submit: null }));
    }
  };

  const handleOtpKeyPress = (event, index) => {
    if (event.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const verifyOtpAndContinue = () => {
    if (otp.some((digit) => digit === "")) {
      setErrors({ otp: "Please enter the 6-digit OTP" });
      return;
    }

    clearStepErrors();
    setStep(STEPS.PASSWORD);
  };

  const handleResetPassword = async () => {
    const nextErrors = {};
    const enteredOtp = otp.join("");

    if (!password) {
      nextErrors.password = "New password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      scrollToBottom();
      return;
    }

    setIsResettingPassword(true);

    try {
      const response = await resetPassword({
        identifier: identifier.trim(),
        otp: enteredOtp,
        newPassword: password,
      });

      showAppAlert({
        type: "success",
        title: "Password Updated",
        message:
          response?.message || "Your password has been reset successfully.",
        actions: [
          {
            label: "Back to Login",
            variant: "primary",
            onPress: () => goToLoginRoot(),
          },
        ],
        cancelable: false,
      });
    } catch (error) {
      setErrors({
        submit: error?.message || "Unable to reset password. Please try again.",
      });
      scrollToBottom();
    } finally {
      setIsResettingPassword(false);
    }
  };

  const goBackOneStep = () => {
    if (step === STEPS.PASSWORD) {
      setPassword("");
      setConfirmPassword("");
      clearStepErrors();
      setStep(STEPS.OTP);
      return;
    }

    if (step === STEPS.OTP) {
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpDeliveryMessage("");
      clearStepErrors();
      setStep(STEPS.IDENTIFIER);
    }
  };

  const handleBackPress = () => {
    if (step === STEPS.IDENTIFIER) {
      navigation.goBack();
      return;
    }

    goBackOneStep();
  };

  return {
    STEPS,
    step,
    identifier,
    otp,
    password,
    confirmPassword,
    errors,
    otpDeliveryMessage,
    isSendingOtp,
    isResettingPassword,
    scrollRef,
    otpInputs,
    passwordRef,
    confirmPasswordRef,
    goToLoginRoot,
    scrollToBottom,
    goToOtpStep,
    handleOtpChange,
    handleOtpKeyPress,
    verifyOtpAndContinue,
    handleResetPassword,
    goBackOneStep,
    handleBackPress,
    setIdentifier: handleIdentifierChange,
    setPassword: handlePasswordChange,
    setConfirmPassword: handleConfirmPasswordChange,
  };
};

export default useForgotPasswordViewModel;
