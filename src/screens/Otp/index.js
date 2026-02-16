import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Image,
  Animated,
  TextInput,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../constants/colors";
import { moderateScale } from "../../constants/metrics";
import WelcomeModal from "../../components/WelcomeModal";
import { ROUTES } from "../../navigation/routes";

const OtpScreen = ({ route, navigation }) => {
  const { mobile } = route.params || {};

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const inputs = useRef([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const joined = otp.join("");

    if (joined.length === 4 && !joined.includes("")) {
      handleSubmit(joined);
    }
  }, [otp]);

  // Timer countdown
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

  const handleChange = (text, index) => {
    if (!/^\d?$/.test(text)) return; // allow only single digit

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move forward only if a digit was entered
    if (text !== "" && index < 3) {
      inputs.current[index + 1].focus();
    }

    // Auto submit only if all digits filled
    if (newOtp.every((digit) => digit !== "")) {
      handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputs.current[index - 1].focus();
      }
    }
  };

  const handleSubmit = (otpValue) => {
    console.log("OTP Submitted:", otpValue);
    // Show welcome first
    setShowWelcome(true);
  };

  const handleResend = () => {
    if (!canResend) return;

    setTimer(30);
    setCanResend(false);
    console.log("OTP Resent");
  };

  return (
    <LinearGradient
      colors={[colors.primaryBlue, colors.primaryGreen]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* TOP SECTION */}
          <View style={styles.topSection}>
            <IconButton
              icon="arrow-left"
              size={moderateScale(24)}
              iconColor="#FFFFFF"
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            />
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.systemText}>Water Management System</Text>
          </View>

          {/* BOTTOM SHEET */}
          <Animated.View style={[styles.sheet, { opacity: fadeAnim }]}>
            <Text style={styles.title}>OTP Verification</Text>

            <Text style={styles.subtitle}>OTP sent to {"8319592043"}</Text>

            {/* OTP BOXES */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.otpBox}
                />
              ))}
            </View>

            <Button
              mode="contained"
              onPress={() => handleSubmit(otp.join(""))}
              style={styles.button}
              contentStyle={{ height: 50 }}
            >
              Verify OTP
            </Button>

            <Text style={styles.timerText}>
              {canResend ? "Didn't receive OTP?" : `Resend OTP in ${timer}s`}
            </Text>

            <Button mode="text" onPress={handleResend} disabled={!canResend}>
              Resend OTP
            </Button>
          </Animated.View>
          <WelcomeModal
            visible={showWelcome}
            userName={"Ritesh Mehra"}
            onClose={() => {
              setShowWelcome(false);
              navigation.replace(ROUTES.ROOT.APP_TABS);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default OtpScreen;
