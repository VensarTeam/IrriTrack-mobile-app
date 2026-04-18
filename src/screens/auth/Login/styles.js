import { StyleSheet } from "react-native";
import colors from "../../../constants/colors";
import fonts from "../../../constants/fonts";
import typography from "../../../constants/typography";
import { moderateScale, verticalScale } from "../../../constants/metrics";

export default StyleSheet.create({
  container: {
    flex: 1,
  },

  topSection: {
    alignItems: "center",
    paddingTop: verticalScale(56),
    paddingBottom: verticalScale(24),
    paddingHorizontal: moderateScale(16),
  },

  logoWrap: {
    backgroundColor: colors.glassWhite,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(10),
  },

  backButton: {
    position: "absolute",
    left: moderateScale(4),
    top: verticalScale(8),
  },

  logo: {
    width: moderateScale(142),
    height: moderateScale(56),
  },

  systemText: {
    color: colors.navyFresh,
    fontSize: moderateScale(17),
    fontFamily: fonts.bold,
    textAlign: "center",
  },

  systemSubText: {
    maxWidth: "100%",
    marginTop: verticalScale(4),
    color: colors.textSecondary,
    fontSize: moderateScale(11),
    fontFamily: fonts.medium,
    lineHeight: moderateScale(16),
    textAlign: "center",
  },

  sheet: {
    flex: 1,
    backgroundColor: colors.sheetSurface,
    borderTopWidth: 1,
    borderColor: colors.loginSheetBorderLight,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    overflow: "hidden",
  },

  sheetContent: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(22),
    paddingTop: verticalScale(22),
    paddingBottom: verticalScale(28),
  },

  title: {
    fontSize: typography.h1,
    fontFamily: fonts.bold,
    marginBottom: verticalScale(4),
    textAlign: "center",
    color: colors.textDark,
  },

  subtitle: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: typography.small,
    marginBottom: verticalScale(18),
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: verticalScale(2),
    marginBottom: verticalScale(10),
  },

  forgotText: {
    color: colors.navyFresh,
    fontSize: typography.small,
    fontFamily: fonts.medium,
  },

  submitError: {
    color: colors.danger,
    fontSize: typography.small,
    fontFamily: fonts.medium,
    marginBottom: verticalScale(8),
  },

  loginButton: {
    marginTop: verticalScale(8),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.navyFreshDark,
    overflow: "hidden",
    marginBottom: verticalScale(8),
  },

  loginButtonContent: {
    height: verticalScale(50),
  },

  version: {
    textAlign: "center",
    marginTop: verticalScale(4),
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },
});
