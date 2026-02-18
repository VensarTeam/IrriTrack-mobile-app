import React from "react";
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
import useOtpViewModel from "../../viewmodels/useOtpViewModel";

const OtpScreen = ({ route, navigation }) => {
  const {
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
  } = useOtpViewModel(route, navigation);

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
            <Text style={styles.subtitle}>
              Enter the 6-digit OTP sent to {destination}.
            </Text>

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

            <TouchableOpacity
              style={styles.loginLinkButton}
              onPress={goBackToLogin}
            >
              <Text style={styles.loginLinkText}>Back to Login</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <WelcomeModal
          visible={showWelcome}
          userName={"Ritesh Mehra"}
          onClose={handleWelcomeClose}
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default OtpScreen;
