import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Icon, IconButton } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../../constants/colors";
import styles from "./styles";
import useAddContractorViewModel from "../../viewmodels/useAddContractorViewModel";

const FIELD_ORDER = ["firmName", "ownerName", "mobileNumber", "email"];

const FIELD_META = {
  firmName: {
    label: "Firm Name",
    placeholder: "Enter contractor firm name",
    icon: "domain",
    keyboardType: "default",
    returnKeyType: "next",
    autoCapitalize: "words",
    autoCorrect: false,
  },
  ownerName: {
    label: "Owner Name",
    placeholder: "Enter owner or contact person name",
    icon: "account-outline",
    keyboardType: "default",
    returnKeyType: "next",
    autoCapitalize: "words",
    autoCorrect: false,
  },
  mobileNumber: {
    label: "Mobile Number",
    placeholder: "Enter 10-digit mobile number",
    icon: "cellphone",
    keyboardType: Platform.OS === "ios" ? "number-pad" : "phone-pad",
    returnKeyType: "next",
    autoCapitalize: "none",
    autoCorrect: false,
    maxLength: 10,
  },
  email: {
    label: "Email",
    placeholder: "Enter email address",
    icon: "email-outline",
    keyboardType: "email-address",
    returnKeyType: "done",
    autoCapitalize: "none",
    autoCorrect: false,
  },
};

const AddContractorScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    form,
    errors,
    touched,
    isSubmitting,
    canAccess,
    updateField,
    handleBlur,
    handleBack,
    handleSubmit,
  } = useAddContractorViewModel(navigation);
  const [focusedField, setFocusedField] = React.useState("");
  const inputRefs = React.useRef({});

  const focusNextField = React.useCallback((field) => {
    const currentIndex = FIELD_ORDER.indexOf(field);
    const nextField = FIELD_ORDER[currentIndex + 1];

    if (nextField && inputRefs.current[nextField]) {
      inputRefs.current[nextField].focus();
      return;
    }

    handleSubmit();
  }, [handleSubmit]);

  if (!canAccess) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.loginHeroGradientStart}
      />
      <LinearGradient
        colors={[
          colors.loginHeroGradientStart,
          colors.loginHeroGradientMid,
          colors.loginHeroGradientEnd,
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTitleRow}>
          <IconButton
            icon="arrow-left"
            size={22}
            iconColor={colors.navyFreshDark}
            onPress={handleBack}
            style={styles.headerBackButton}
          />
          <Text style={styles.headerTitle}>Add Contractor</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: insets.bottom + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Contractor Details</Text>

            {FIELD_ORDER.map((field) => {
              const meta = FIELD_META[field];
              const hasError = Boolean(touched[field] && errors[field]);
              const isFocused = focusedField === field;

              return (
                <View key={field} style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>{meta.label}</Text>

                  <View
                    style={[
                      styles.inputShell,
                      isFocused && styles.inputShellFocused,
                      hasError && styles.inputShellError,
                    ]}
                  >
                    <View
                      style={[
                        styles.inputIconWrap,
                        isFocused && styles.inputIconWrapFocused,
                        hasError && styles.inputIconWrapError,
                      ]}
                    >
                      <Icon
                        source={meta.icon}
                        size={20}
                        color={
                          hasError
                            ? colors.danger
                            : isFocused
                              ? colors.primaryBlue
                              : colors.textSecondary
                        }
                      />
                    </View>

                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[field] = ref;
                      }}
                      value={form[field]}
                      onChangeText={(value) => updateField(field, value)}
                      onFocus={() => setFocusedField(field)}
                      onBlur={() => {
                        setFocusedField((currentValue) =>
                          currentValue === field ? "" : currentValue
                        );
                        handleBlur(field);
                      }}
                      placeholder={meta.placeholder}
                      placeholderTextColor={colors.textSecondary}
                      style={styles.textInput}
                      keyboardType={meta.keyboardType}
                      returnKeyType={meta.returnKeyType}
                      autoCapitalize={meta.autoCapitalize}
                      autoCorrect={meta.autoCorrect}
                      maxLength={meta.maxLength}
                      onSubmitEditing={() => focusNextField(field)}
                      blurOnSubmit={field === "email"}
                    />
                  </View>
                  {hasError && <Text style={styles.errorText}>{errors[field]}</Text>}
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            activeOpacity={isSubmitting ? 1 : 0.9}
            disabled={isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Icon source="content-save-outline" size={20} color={colors.white} />
                <Text style={styles.submitButtonText}>Save Contractor</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddContractorScreen;
