import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Button, IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../constants/colors";
import { moderateScale } from "../../constants/metrics";
import WelcomeModal from "../../components/WelcomeModal";
import { ROUTES } from "../../navigation/routes";

const OTP_LENGTH = 6;

const OtpScreen = ({ route, navigation }) => {
  const { mobile, identifier } = route.params || {};
  const destination = identifier || mobile || "your registered number";

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const scrollRef = useRef(null);
  const inputs = useRef([]);

  useEffect(() => {
    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 120);
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

  return (
    <LinearGradient
      colors={[colors.white, colors.surfaceBlue]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        style={styles.container}
      >
        <View style={styles.topSection}>
          <IconButton
            icon="arrow-left"
            size={moderateScale(24)}
            iconColor={colors.primaryBlueDark}
            style={styles.backButton}
            onPress={goBack}
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
            bounces={false}
            overScrollMode="never"
          >
            <Text style={styles.title}>OTP Verification</Text>
            <Text style={styles.subtitle}>Enter the 6-digit OTP sent to {destination}.</Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(event) => handleKeyPress(event, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.otpBox}
                  onFocus={scrollToBottom}
                />
              ))}
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
            >
              Verify OTP
            </Button>

            <Text style={styles.timerText}>
              {canResend ? "Didn't receive OTP?" : `Resend OTP in ${timer}s`}
            </Text>

            <Button mode="text" onPress={handleResend} disabled={!canResend}>
              Resend OTP
            </Button>

            <TouchableOpacity style={styles.loginLinkButton} onPress={goBackToLogin}>
              <Text style={styles.loginLinkText}>Back to Login</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <WelcomeModal
          visible={showWelcome}
          userName={"Ritesh Mehra"}
          onClose={() => {
            setShowWelcome(false);
            navigation.replace(ROUTES.ROOT.APP_TABS);
          }}
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default OtpScreen;
