import { MD3LightTheme } from "react-native-paper";
import colors from "./colors";
import fonts from "./fonts";

const buildVariant = (variant, fontFamily) => ({
  ...variant,
  fontFamily,
});

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
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: buildVariant(MD3LightTheme.fonts.displayLarge, fonts.bold),
    displayMedium: buildVariant(MD3LightTheme.fonts.displayMedium, fonts.bold),
    displaySmall: buildVariant(MD3LightTheme.fonts.displaySmall, fonts.bold),
    headlineLarge: buildVariant(MD3LightTheme.fonts.headlineLarge, fonts.bold),
    headlineMedium: buildVariant(MD3LightTheme.fonts.headlineMedium, fonts.bold),
    headlineSmall: buildVariant(MD3LightTheme.fonts.headlineSmall, fonts.bold),
    titleLarge: buildVariant(MD3LightTheme.fonts.titleLarge, fonts.medium),
    titleMedium: buildVariant(MD3LightTheme.fonts.titleMedium, fonts.medium),
    titleSmall: buildVariant(MD3LightTheme.fonts.titleSmall, fonts.medium),
    labelLarge: buildVariant(MD3LightTheme.fonts.labelLarge, fonts.medium),
    labelMedium: buildVariant(MD3LightTheme.fonts.labelMedium, fonts.medium),
    labelSmall: buildVariant(MD3LightTheme.fonts.labelSmall, fonts.medium),
    bodyLarge: buildVariant(MD3LightTheme.fonts.bodyLarge, fonts.regular),
    bodyMedium: buildVariant(MD3LightTheme.fonts.bodyMedium, fonts.regular),
    bodySmall: buildVariant(MD3LightTheme.fonts.bodySmall, fonts.regular),
  },
};
