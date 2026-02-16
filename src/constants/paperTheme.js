import { MD3LightTheme } from "react-native-paper";
import colors from "./colors";

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primaryBlue,
    secondary: colors.primaryGreen,
    error: colors.danger,

    background: "#F4F6F8",
    surface: "#FFFFFF",

    outline: "#C9D3DF",           // default border
    outlineVariant: "#E3E8EE",    // subtle border
  },
};