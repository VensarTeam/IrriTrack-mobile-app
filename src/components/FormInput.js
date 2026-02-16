import React, { useState } from "react";
import { TextInput, HelperText } from "react-native-paper";
import {
  moderateScale,
  verticalScale,
} from "../constants/metrics";
import colors from "../constants/colors";

const FormInput = ({
  label,
  value,
  onChangeText,
  secure,
  error,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  leftIcon,
  type
}) => {
  const [isSecure, setIsSecure] = useState(secure);

  return (
    <>
      <TextInput
        ref={inputRef}
        label={label}
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        secureTextEntry={isSecure}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        error={!!error}
        keyboardType={type}
        left={
          leftIcon ? (
            <TextInput.Icon icon={leftIcon} />
          ) : null
        }
        right={
          secure ? (
            <TextInput.Icon
              icon={isSecure ? "eye-off" : "eye"}
              onPress={() =>
                setIsSecure(!isSecure)
              }
            />
          ) : null
        }
        style={{
          marginBottom: verticalScale(6),
          backgroundColor: "#F9FBFF",
        }}
        outlineStyle={{
          borderRadius: moderateScale(14),
          borderWidth: 1.5,
        }}
        activeOutlineColor={colors.primaryBlue}
        outlineColor="#D0D7E2"
        textColor={colors.textDark}
      />

      {error ? (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      ) : null}
    </>
  );
};

export default FormInput;
