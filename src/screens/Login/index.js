import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  TouchableOpacity,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import FormInput from "../../components/FormInput";
import { Button } from "react-native-paper";
import colors from "../../constants/colors";
import useLoginViewModel from "../../viewmodels/useLoginViewModel";

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
      colors={[colors.vibrantGradientTop, colors.vibrantGradientMid, colors.vibrantGradientBlend]}
      locations={[0, 0.42, 1]}
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
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.systemText}>Water Management System</Text>
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
            bounces={false}
            overScrollMode="never"
          >
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Login using mobile number or email.
            </Text>

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
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;
