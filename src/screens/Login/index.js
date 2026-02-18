import React, { useRef, useState } from "react";
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
import { ROUTES } from "../../navigation/routes";
import colors from "../../constants/colors";

const LoginScreen = ({ navigation }) => {
  const scrollRef = useRef(null);
  const passwordRef = useRef(null);

  const [loginType, setLoginType] = useState("mobile");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });
  };

  const validateIdentifier = () => {
    const trimmed = identifier.trim();

    if (!trimmed) {
      return loginType === "mobile"
        ? "Mobile number is required"
        : "Email is required";
    }

    if (loginType === "mobile" && !/^\d{10}$/.test(trimmed)) {
      return "Enter a valid 10-digit mobile number";
    }

    if (
      loginType === "email" &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(trimmed)
    ) {
      return "Enter a valid email address";
    }

    return null;
  };

  const validate = () => {
    const newErrors = {};
    const identifierError = validateIdentifier();

    if (identifierError) newErrors.identifier = identifierError;
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      navigation.navigate(ROUTES.AUTH.OTP, {
        type: loginType,
        identifier: identifier.trim(),
      });
    } else {
      scrollToBottom();
    }
  };

  const switchType = (type) => {
    setLoginType(type);
    setIdentifier("");
    setErrors({});
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
            />

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => navigation.navigate(ROUTES.AUTH.FORGOT_PASSWORD)}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={validate}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
            >
              Log In
            </Button>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;
