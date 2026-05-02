import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import styles from "./styles";
import FormInput from "../../../components/FormInput";
import { Button } from "react-native-paper";
import colors from "../../../constants/colors";
import {
  APP_VERSION,
  PROJECT_FULL_FORM,
} from "../../../constants/appInfo";
import useLoginViewModel from "../../../viewmodels/useLoginViewModel";
import FaceVerificationSheet from "../../../components/FaceVerificationSheet";
import WelcomeModal from "../../../components/WelcomeModal";
import BrandText from "../../../components/BrandText";

const LoginScreen = ({ navigation }) => {
  const {
    scrollRef,
    passwordRef,
    identifier,
    setIdentifier,
    password,
    setPassword,
    errors,
    submitError,
    validate,
    scrollToBottom,
    goToForgotPassword,
    isVerificationVisible,
    faceImage,
    faceError,
    showWelcome,
    welcomeName,
    isCredentialsSubmitting,
    isFaceSubmitting,
    closeVerificationSheet,
    handleFaceCaptured,
    retakeFaceVerification,
    handleFaceCaptureError,
    continueAfterFaceVerification,
    handleWelcomeClose,
  } = useLoginViewModel(navigation);

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
          bounces={false}
          overScrollMode="never"
        >
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login with your mobile number and password.</Text>

          <FormInput
            label="Mobile Number"
            value={identifier}
            onChangeText={setIdentifier}
            error={errors.identifier}
            leftIcon="cellphone"
            type="phone-pad"
            editable={!isCredentialsSubmitting && !isFaceSubmitting}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            onFocus={scrollToBottom}
            activeOutlineColor={colors.navyFreshDark}
            outlineColor={colors.switchBgFresh}
          />

          <FormInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secure
            error={errors.password}
            leftIcon="lock"
            editable={!isCredentialsSubmitting && !isFaceSubmitting}
            returnKeyType="done"
            inputRef={passwordRef}
            onFocus={scrollToBottom}
            activeOutlineColor={colors.navyFreshDark}
            outlineColor={colors.switchBgFresh}
          />

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={goToForgotPassword}
            disabled={isCredentialsSubmitting || isFaceSubmitting}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <Button
            mode="contained"
            onPress={validate}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            buttonColor={colors.navyFresh}
            textColor={colors.white}
            loading={isCredentialsSubmitting}
            disabled={isCredentialsSubmitting || isFaceSubmitting}
          >
            Log In
          </Button>

          <Text style={styles.version}>App Version {APP_VERSION}</Text>
        </KeyboardAwareScrollView>
      </View>

      <FaceVerificationSheet
        visible={isVerificationVisible}
        faceImage={faceImage}
        error={faceError}
        onClose={closeVerificationSheet}
        onCapture={handleFaceCaptured}
        onRetake={retakeFaceVerification}
        onCaptureError={handleFaceCaptureError}
        onContinue={continueAfterFaceVerification}
        isSubmitting={isFaceSubmitting}
      />

      <WelcomeModal
        visible={showWelcome}
        userName={welcomeName}
        onClose={handleWelcomeClose}
      />
    </LinearGradient>
  );
};

export default LoginScreen;
