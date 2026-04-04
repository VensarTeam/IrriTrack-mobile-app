import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import styles from "./styles";
import FormInput from "../../../components/FormInput";
import { Button } from "react-native-paper";
import colors from "../../../constants/colors";
import useLoginViewModel from "../../../viewmodels/useLoginViewModel";
import FaceVerificationSheet from "../../../components/FaceVerificationSheet";
import WelcomeModal from "../../../components/WelcomeModal";

const LoginScreen = ({ navigation }) => {
  const {
    scrollRef,
    passwordRef,
    identifier,
    setIdentifier,
    password,
    setPassword,
    errors,
    validate,
    scrollToBottom,
    goToForgotPassword,
    isVerificationVisible,
    faceImage,
    faceError,
    showWelcome,
    welcomeName,
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
        <Text style={styles.systemText}>Project Management Tools</Text>
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
            returnKeyType="done"
            inputRef={passwordRef}
            onFocus={scrollToBottom}
            activeOutlineColor={colors.navyFreshDark}
            outlineColor={colors.switchBgFresh}
          />

          <TouchableOpacity style={styles.forgotButton} onPress={goToForgotPassword}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={validate}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            buttonColor={colors.navyFresh}
            textColor={colors.white}
          >
            Log In
          </Button>
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
