import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Platform,
  ScrollView,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import FormInput from "../../components/FormInput";
import colors from "../../constants/colors";
import { Button } from "react-native-paper";
import { ROUTES } from "../../navigation/routes";

const LoginScreen = ({ navigation }) => {
  const passwordRef = useRef(null);

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};

    if (!mobile.trim()) {
      newErrors.username = "Mobile number is required";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      navigation.navigate(ROUTES.AUTH.OTP);
    }
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
          showsVerticalScrollIndicator={false}
        >
          {/* TOP SECTION */}
          <View style={styles.topSection}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.systemText}>Water Management System</Text>
          </View>

          {/* FORM SHEET */}
          <View style={styles.sheet}>
            <Text style={styles.title}>Welcome Back</Text>

            <FormInput
              label="Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              error={errors.username}
              leftIcon="account"
              type={"number-pad"}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
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
            />

            <Button
              mode="contained"
              onPress={validate}
              style={{ marginTop: 20 }}
              contentStyle={{ height: 50 }}
            >
              <Text style={styles.loginText}>Log In</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;
