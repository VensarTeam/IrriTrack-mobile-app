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
    background: colors.background,
    surface: colors.white,
    outline: colors.border,
    outlineVariant: colors.surfaceBlueSoft,
  },
};
