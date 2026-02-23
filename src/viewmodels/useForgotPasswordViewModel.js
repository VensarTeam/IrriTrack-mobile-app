import { useEffect, useRef, useState } from "react";
import { ROUTES } from "../navigation/routes";
import { showAppAlert } from "../services/alertService";

const OTP_LENGTH = 6;
const STEPS = {
  IDENTIFIER: 1,
  OTP: 2,
  PASSWORD: 3,
};

const useForgotPasswordViewModel = (navigation) => {
  const [step, setStep] = useState(STEPS.IDENTIFIER);
  const [contactType, setContactType] = useState("mobile");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const scrollRef = useRef(null);
  const otpInputs = useRef([]);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const clearStepErrors = () => {
    setErrors({});
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

  const validateIdentifier = (value, type) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return type === "mobile" ? "Mobile number is required" : "Email is required";
    }

    if (type === "mobile" && !/^\d{10}$/.test(trimmed)) {
      return "Enter a valid 10-digit mobile number";
    }

    if (
      type === "email" &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(trimmed)
    ) {
      return "Enter a valid email address";
    }

    return null;
  };

  const goToOtpStep = () => {
    const identifierError = validateIdentifier(identifier, contactType);

    if (identifierError) {
      setErrors({ identifier: identifierError });
      return;
    }

    setOtp(Array(OTP_LENGTH).fill(""));
    clearStepErrors();
    setStep(STEPS.OTP);
  };

  const handleOtpChange = (text, index) => {
    if (!/^\d?$/.test(text)) return;

    const nextOtp = [...otp];
    nextOtp[index] = text;
    setOtp(nextOtp);

    if (text && index < OTP_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }

    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: null }));
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

  const handleResetPassword = () => {
    const nextErrors = {};

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

    showAppAlert({
      type: "success",
      title: "Password Updated",
      message: "Your password has been reset successfully.",
      actions: [
        {
          label: "Back to Login",
          variant: "primary",
          onPress: () => goToLoginRoot(),
        },
      ],
      cancelable: false,
    });
  };

  const switchContactType = (type) => {
    setContactType(type);
    setIdentifier("");
    clearStepErrors();
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
    contactType,
    identifier,
    otp,
    password,
    confirmPassword,
    errors,
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
    switchContactType,
    goBackOneStep,
    handleBackPress,
    setIdentifier,
    setPassword,
    setConfirmPassword,
  };
};

export default useForgotPasswordViewModel;
