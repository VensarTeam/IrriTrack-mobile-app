import React from "react";
import { StyleSheet, Text } from "react-native";
import colors from "../constants/colors";

const BrandText = ({
  prefix = "",
  suffix = "",
  style,
  irriStyle,
  trackStyle,
  children,
  ...props
}) => (
  <Text style={style} {...props}>
    {prefix}
    <Text style={[styles.irri, irriStyle]}>Irri</Text>
    <Text style={[styles.track, trackStyle]}>Track</Text>
    {suffix}
    {children}
  </Text>
);

const styles = StyleSheet.create({
  irri: {
    color: colors.primaryGreen,
  },
  track: {
    color: colors.primaryOrange,
  },
});

export default BrandText;
