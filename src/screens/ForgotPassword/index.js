import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Button, IconButton } from "react-native-paper";
import FormInput from "../../components/FormInput";
import styles from "./styles";
import colors from "../../constants/colors";
import { ROUTES } from "../../navigation/routes";

const OTP_LENGTH = 6;
const STEPS = {
  IDENTIFIER: 1,
  OTP: 2,
  PASSWORD: 3,
};

const ForgotPasswordScreen = ({ navigation }) => {
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

    Alert.alert(
      "Password Updated",
      "Your password has been reset successfully.",
      [
        {
          text: "Back to Login",
          onPress: () => goToLoginRoot(),
        },
      ]
    );
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

  const renderIdentifierStep = () => (
    <>
      <Text style={styles.sectionTitle}>Verify your account</Text>
      <Text style={styles.sectionSubtitle}>Use mobile number or email to receive OTP.</Text>

      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[styles.switchButton, contactType === "mobile" && styles.switchButtonActive]}
          onPress={() => switchContactType("mobile")}
        >
          <Text style={[styles.switchText, contactType === "mobile" && styles.switchTextActive]}>
            Mobile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchButton, contactType === "email" && styles.switchButtonActive]}
          onPress={() => switchContactType("email")}
        >
          <Text style={[styles.switchText, contactType === "email" && styles.switchTextActive]}>
            Email
          </Text>
        </TouchableOpacity>
      </View>

      <FormInput
        label={contactType === "mobile" ? "Mobile Number" : "Email Address"}
        value={identifier}
        onChangeText={setIdentifier}
        error={errors.identifier}
        leftIcon={contactType === "mobile" ? "cellphone" : "email-outline"}
        type={contactType === "mobile" ? "phone-pad" : "email-address"}
        autoCapitalize="none"
        returnKeyType="done"
        onFocus={scrollToBottom}
      />

      <Button
        mode="contained"
        onPress={goToOtpStep}
        style={styles.primaryButton}
        contentStyle={styles.primaryButtonContent}
      >
        Send OTP
      </Button>
    </>
  );

  const renderOtpStep = () => (
    <>
      <Text style={styles.sectionTitle}>Enter OTP</Text>
      <Text style={styles.sectionSubtitle}>
        We sent a 6-digit OTP to your {contactType === "mobile" ? "mobile number" : "email"}.
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              otpInputs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={(event) => handleOtpKeyPress(event, index)}
            keyboardType="number-pad"
            maxLength={1}
            style={styles.otpBox}
            onFocus={scrollToBottom}
          />
        ))}
      </View>

      {errors.otp ? <Text style={styles.otpErrorText}>{errors.otp}</Text> : null}

      <Button
        mode="contained"
        onPress={verifyOtpAndContinue}
        style={styles.primaryButton}
        contentStyle={styles.primaryButtonContent}
      >
        Verify OTP
      </Button>

      <TouchableOpacity style={styles.secondaryLink} onPress={goBackOneStep}>
        <Text style={styles.secondaryLinkText}>Change {contactType === "mobile" ? "mobile number" : "email"}</Text>
      </TouchableOpacity>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <Text style={styles.sectionTitle}>Set New Password</Text>
      <Text style={styles.sectionSubtitle}>Create a strong password and confirm it.</Text>

      <FormInput
        label="New Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secure
        leftIcon="lock"
        inputRef={passwordRef}
        returnKeyType="next"
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        onFocus={scrollToBottom}
      />

      <FormInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        secure
        leftIcon="lock-check-outline"
        inputRef={confirmPasswordRef}
        returnKeyType="done"
        onFocus={scrollToBottom}
      />

      <Button
        mode="contained"
        onPress={handleResetPassword}
        style={styles.primaryButton}
        contentStyle={styles.primaryButtonContent}
      >
        Reset Password
      </Button>

      <TouchableOpacity style={styles.secondaryLink} onPress={goBackOneStep}>
        <Text style={styles.secondaryLinkText}>Back to OTP</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <LinearGradient colors={[colors.surfaceBlueSoft, colors.surfaceBlue]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        style={styles.container}
      >
        <View style={styles.topSection}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={colors.primaryBlueDark}
            style={styles.backButton}
            onPress={() => (step === STEPS.IDENTIFIER ? navigation.goBack() : goBackOneStep())}
          />

          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.systemText}>Water Management System</Text>
        </View>

        <View style={styles.sheet}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "none"}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            bounces={false}
          >
            <Text style={styles.title}>Forgot Password</Text>
            {/* <Text style={styles.progressText}>Step {step} of 3</Text> */}

            {step === STEPS.IDENTIFIER ? renderIdentifierStep() : null}
            {step === STEPS.OTP ? renderOtpStep() : null}
            {step === STEPS.PASSWORD ? renderPasswordStep() : null}

            <TouchableOpacity
              style={styles.loginLinkButton}
              onPress={() => goToLoginRoot()}
            >
              <Text style={styles.loginLinkText}>Back to Login</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default ForgotPasswordScreen;
