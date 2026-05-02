import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Button, IconButton } from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FormInput from "../../../components/FormInput";
import styles from "./styles";
import colors from "../../../constants/colors";
import useForgotPasswordViewModel from "../../../viewmodels/useForgotPasswordViewModel";
import { PROJECT_FULL_FORM } from "../../../constants/appInfo";
import { verticalScale } from "../../../constants/metrics";
import BrandText from "../../../components/BrandText";

const ForgotPasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
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
    setIdentifier,
    setPassword,
    setConfirmPassword,
  } = useForgotPasswordViewModel(navigation);
  const topSectionStyle = [
    styles.topSection,
    {
      paddingTop: Math.max(insets.top + verticalScale(18), verticalScale(56)),
    },
  ];
  const backButtonStyle = [
    styles.backButton,
    {
      top: Math.max(insets.top + verticalScale(4), verticalScale(18)),
    },
  ];
  const trimmedIdentifier = identifier.trim();
  const identifierTypeLabel = /^\d+$/.test(trimmedIdentifier)
    ? "mobile number"
    : trimmedIdentifier.includes("@")
      ? "email"
      : "account";

  const renderIdentifierStep = () => (
    <>
      <Text style={styles.sectionSubtitle}>
        Enter your registered username, mobile number, or email to receive OTP.
      </Text>

      <FormInput
        label="Mobile Number or Email"
        value={identifier}
        onChangeText={setIdentifier}
        error={errors.identifier}
        leftIcon="account-search-outline"
        type="email-address"
        editable={!isSendingOtp}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onFocus={scrollToBottom}
        activeOutlineColor={colors.navyFreshDark}
        outlineColor={colors.switchBgFresh}
      />

      <Button
        mode="contained"
        onPress={goToOtpStep}
        style={styles.primaryButton}
        contentStyle={styles.primaryButtonContent}
        buttonColor={colors.navyFresh}
        textColor={colors.white}
        loading={isSendingOtp}
        disabled={isSendingOtp}
      >
        Send OTP
      </Button>

      {errors.submit ? (
        <Text style={styles.submitError}>{errors.submit}</Text>
      ) : null}
    </>
  );

  const renderOtpStep = () => (
    <>
      <Text style={styles.sectionTitle}>Enter OTP</Text>
      <Text style={styles.sectionSubtitle}>
        {otpDeliveryMessage ||
          `We sent a 6-digit OTP to your registered ${identifierTypeLabel}.`}
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
            editable={!isResettingPassword}
          />
        ))}
      </View>

      {errors.otp ? <Text style={styles.otpErrorText}>{errors.otp}</Text> : null}

      <Button
        mode="contained"
        onPress={verifyOtpAndContinue}
        style={styles.primaryButton}
        contentStyle={styles.primaryButtonContent}
        buttonColor={colors.navyFresh}
        textColor={colors.white}
        disabled={isResettingPassword}
      >
        Verify OTP
      </Button>

      <TouchableOpacity
        style={styles.secondaryLink}
        onPress={goBackOneStep}
        disabled={isResettingPassword}
      >
        <Text style={styles.secondaryLinkText}>Change {identifierTypeLabel}</Text>
      </TouchableOpacity>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <Text style={styles.sectionTitle}>Set New Password</Text>
      <Text style={styles.sectionSubtitle}>
        Create a strong password and confirm it.
      </Text>

      <FormInput
        label="New Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secure
        leftIcon="lock"
        inputRef={passwordRef}
        editable={!isResettingPassword}
        returnKeyType="next"
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        onFocus={scrollToBottom}
        activeOutlineColor={colors.navyFreshDark}
        outlineColor={colors.switchBgFresh}
      />

      <FormInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        secure
        leftIcon="lock-check-outline"
        inputRef={confirmPasswordRef}
        editable={!isResettingPassword}
        returnKeyType="done"
        onFocus={scrollToBottom}
        activeOutlineColor={colors.navyFreshDark}
        outlineColor={colors.switchBgFresh}
      />

      <Button
        mode="contained"
        onPress={handleResetPassword}
        style={styles.primaryButton}
        contentStyle={styles.primaryButtonContent}
        buttonColor={colors.navyFresh}
        textColor={colors.white}
        loading={isResettingPassword}
        disabled={isResettingPassword}
      >
        Reset Password
      </Button>

      {errors.submit ? (
        <Text style={styles.submitError}>{errors.submit}</Text>
      ) : null}

      <TouchableOpacity
        style={styles.secondaryLink}
        onPress={goBackOneStep}
        disabled={isResettingPassword}
      >
        <Text style={styles.secondaryLinkText}>Back to OTP</Text>
      </TouchableOpacity>
    </>
  );

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
      <View style={topSectionStyle}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={colors.navyFreshDark}
          style={backButtonStyle}
          onPress={handleBackPress}
        />

        <View style={styles.logoWrap}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Image
          source={require("../../../assets/images/IrriTrack-Logo.png")}
          style={styles.logo1}
          resizeMode="contain"
        />
        {/* <BrandText style={styles.systemText} /> */}
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
          overScrollMode="never"
          bounces={false}
        >
          <Text style={styles.title}>Forgot Password</Text>

          {step === STEPS.IDENTIFIER ? renderIdentifierStep() : null}
          {step === STEPS.OTP ? renderOtpStep() : null}
          {step === STEPS.PASSWORD ? renderPasswordStep() : null}

          <TouchableOpacity style={styles.loginLinkButton} onPress={() => goToLoginRoot()}>
            <Text style={styles.loginLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </View>
    </LinearGradient>
  );
};

export default ForgotPasswordScreen;
