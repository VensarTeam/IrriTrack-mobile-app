import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Button, IconButton } from "react-native-paper";
import FormInput from "../../components/FormInput";
import styles from "./styles";
import colors from "../../constants/colors";
import useForgotPasswordViewModel from "../../viewmodels/useForgotPasswordViewModel";

const ForgotPasswordScreen = ({ navigation }) => {
  const {
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
  } = useForgotPasswordViewModel(navigation);

  const renderIdentifierStep = () => (
    <>
      <Text style={styles.sectionTitle}>Verify your account</Text>
      <Text style={styles.sectionSubtitle}>
        Use mobile number or email to receive OTP.
      </Text>

      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[
            styles.switchButton,
            contactType === "mobile" && styles.switchButtonActive,
          ]}
          onPress={() => switchContactType("mobile")}
        >
          <Text
            style={[
              styles.switchText,
              contactType === "mobile" && styles.switchTextActive,
            ]}
          >
            Mobile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.switchButton,
            contactType === "email" && styles.switchButtonActive,
          ]}
          onPress={() => switchContactType("email")}
        >
          <Text
            style={[
              styles.switchText,
              contactType === "email" && styles.switchTextActive,
            ]}
          >
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
      >
        Send OTP
      </Button>
    </>
  );

  const renderOtpStep = () => (
    <>
      <Text style={styles.sectionTitle}>Enter OTP</Text>
      <Text style={styles.sectionSubtitle}>
        We sent a 6-digit OTP to your {" "}
        {contactType === "mobile" ? "mobile number" : "email"}.
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
        buttonColor={colors.navyFresh}
        textColor={colors.white}
      >
        Verify OTP
      </Button>

      <TouchableOpacity style={styles.secondaryLink} onPress={goBackOneStep}>
        <Text style={styles.secondaryLinkText}>
          Change {contactType === "mobile" ? "mobile number" : "email"}
        </Text>
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
      >
        Reset Password
      </Button>

      <TouchableOpacity style={styles.secondaryLink} onPress={goBackOneStep}>
        <Text style={styles.secondaryLinkText}>Back to OTP</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <LinearGradient
      colors={[colors.vibrantGradientTop, colors.vibrantGradientMid, colors.vibrantGradientBlend]}
      locations={[0, 0.4, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
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
            size={24}
            iconColor={colors.navyFreshDark}
            style={styles.backButton}
            onPress={handleBackPress}
          />

          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.systemText}>Project Management Tools</Text>
        </View>

        <LinearGradient
          colors={[colors.vibrantGradientBlend, colors.loginBottomLight, colors.white]}
          locations={[0, 0.56, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sheet}
        >
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
        </LinearGradient>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default ForgotPasswordScreen;
