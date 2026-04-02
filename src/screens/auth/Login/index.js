import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import styles from "./styles";
import FormInput from "../../../components/FormInput";
import { Button } from "react-native-paper";
import colors from "../../../constants/colors";
import useLoginViewModel from "../../../viewmodels/useLoginViewModel";

const LoginScreen = ({ navigation }) => {
  const {
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
          <Text style={styles.subtitle}>Login using mobile number or email.</Text>

          <View style={styles.switchRow}>
            <TouchableOpacity
              style={[
                styles.switchButton,
                loginType === "mobile" && styles.switchButtonActive,
              ]}
              onPress={() => switchType("mobile")}
            >
              <Text
                style={[
                  styles.switchText,
                  loginType === "mobile" && styles.switchTextActive,
                ]}
              >
                Mobile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switchButton,
                loginType === "email" && styles.switchButtonActive,
              ]}
              onPress={() => switchType("email")}
            >
              <Text
                style={[
                  styles.switchText,
                  loginType === "email" && styles.switchTextActive,
                ]}
              >
                Email
              </Text>
            </TouchableOpacity>
          </View>

          <FormInput
            label={loginType === "mobile" ? "Mobile Number" : "Email Address"}
            value={identifier}
            onChangeText={setIdentifier}
            error={errors.identifier}
            leftIcon={loginType === "mobile" ? "cellphone" : "email-outline"}
            type={loginType === "mobile" ? "phone-pad" : "email-address"}
            autoCapitalize="none"
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
    </LinearGradient>
  );
};

export default LoginScreen;
