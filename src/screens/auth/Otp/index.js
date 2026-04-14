import React from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Button, IconButton } from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import styles from "./styles";
import colors from "../../../constants/colors";
import { moderateScale } from "../../../constants/metrics";
import WelcomeModal from "../../../components/WelcomeModal";
import useOtpViewModel from "../../../viewmodels/useOtpViewModel";
import { APP_NAME, PROJECT_FULL_FORM } from "../../../constants/appInfo";

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
      colors={[
        colors.loginHeroGradientStart,
        colors.loginHeroGradientMid,
        colors.loginHeroGradientEnd,
        colors.loginPageGradientMid,
        colors.loginPageGradientEnd,
      ]}
      locations={[0, 0.2, 0.42, 0.72, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topSection}>
        <IconButton
          icon="arrow-left"
          size={moderateScale(24)}
          iconColor={colors.navyFreshDark}
          style={styles.backButton}
          onPress={goBack}
        />

        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.systemText}>{APP_NAME}</Text>
        <Text style={styles.systemSubText}>{PROJECT_FULL_FORM}</Text>
      </View>

      <View style={styles.sheet}>
        <KeyboardAwareScrollView
          innerRef={(ref) => {
            scrollRef.current = ref;
          }}
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
          enableAutomaticScroll
          extraScrollHeight={24}
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
            buttonColor={colors.navyFresh}
            textColor={colors.white}
          >
            Verify OTP
          </Button>

          <Text style={styles.timerText}>
            {canResend ? "Didn't receive OTP?" : `Resend OTP in ${timer}s`}
          </Text>

          <Button
            mode="text"
            onPress={handleResend}
            disabled={!canResend}
            textColor={colors.navyFresh}
          >
            Resend OTP
          </Button>

          <TouchableOpacity style={styles.loginLinkButton} onPress={goBackToLogin}>
            <Text style={styles.loginLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </View>

      <WelcomeModal
        visible={showWelcome}
        userName={"Ritesh Mehra"}
        onClose={handleWelcomeClose}
      />
    </LinearGradient>
  );
};

export default OtpScreen;
