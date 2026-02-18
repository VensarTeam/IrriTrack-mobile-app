import { useRef, useState } from "react";
import { ROUTES } from "../navigation/routes";

const useLoginViewModel = (navigation) => {
  const scrollRef = useRef(null);
  const passwordRef = useRef(null);

  const [loginType, setLoginType] = useState("mobile");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });
  };

  const validateIdentifier = () => {
    const trimmed = identifier.trim();

    if (!trimmed) {
      return loginType === "mobile"
        ? "Mobile number is required"
        : "Email is required";
    }

    if (loginType === "mobile" && !/^\d{10}$/.test(trimmed)) {
      return "Enter a valid 10-digit mobile number";
    }

    if (
      loginType === "email" &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(trimmed)
    ) {
      return "Enter a valid email address";
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
      navigation.navigate(ROUTES.AUTH.OTP, {
        type: loginType,
        identifier: identifier.trim(),
      });
    } else {
      scrollToBottom();
    }
  };

  const switchType = (type) => {
    setLoginType(type);
    setIdentifier("");
    setErrors({});
  };

  const goToForgotPassword = () => {
    navigation.navigate(ROUTES.AUTH.FORGOT_PASSWORD);
  };

  return {
    scrollRef,
    passwordRef,
    loginType,
    identifier,
    setIdentifier,
    password,
    setPassword,
    errors,
    switchType,
    validate,
    scrollToBottom,
    goToForgotPassword,
  };
};

export default useLoginViewModel;
