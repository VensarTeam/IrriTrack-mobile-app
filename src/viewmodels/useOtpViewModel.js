import { useEffect, useRef, useState } from "react";
import { ROUTES } from "../navigation/routes";

const OTP_LENGTH = 6;

const useOtpViewModel = (route, navigation) => {
  const { mobile, identifier } = route.params || {};
  const destination = identifier || mobile || "your registered number";

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const scrollRef = useRef(null);
  const inputs = useRef([]);

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      inputs.current[0]?.focus();
    }, 120);

    return () => clearTimeout(focusTimer);
  }, []);

  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate(ROUTES.AUTH.LOGIN);
  };

  const goBackToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: ROUTES.AUTH.LOGIN }],
    });
  };

  const handleChange = (text, index) => {
    if (!/^\d?$/.test(text)) return;

    const nextOtp = [...otp];
    nextOtp[index] = text;
    setOtp(nextOtp);

    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== OTP_LENGTH || otp.some((digit) => digit === "")) {
      return;
    }

    setShowWelcome(true);
  };

  const handleResend = () => {
    if (!canResend) return;

    setTimer(30);
    setCanResend(false);
    setOtp(Array(OTP_LENGTH).fill(""));

    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 140);
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    navigation.replace(ROUTES.ROOT.APP_TABS);
  };

  return {
    destination,
    otp,
    timer,
    canResend,
    showWelcome,
    scrollRef,
    inputs,
    handleChange,
    handleKeyPress,
    handleSubmit,
    handleResend,
    goBack,
    goBackToLogin,
    scrollToBottom,
    handleWelcomeClose,
  };
};

export default useOtpViewModel;
