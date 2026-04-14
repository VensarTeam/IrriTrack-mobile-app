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

  backButton: {
    position: "absolute",
    left: moderateScale(4),
    top: verticalScale(8),
  },

  logo: {
    width: moderateScale(240),
    height: moderateScale(68),
    marginBottom: verticalScale(8),
  },

  systemText: {
    color: colors.navyFresh,
    fontSize: typography.h2,
    fontFamily: fonts.medium,
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
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
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
    marginBottom: verticalScale(14),
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },

  otpBox: {
    width: moderateScale(44),
    height: verticalScale(52),
    borderWidth: 1.5,
    borderRadius: moderateScale(12),
    borderColor: colors.vibrantGradientMid,
    backgroundColor: colors.white,
    textAlign: "center",
    fontSize: moderateScale(20),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  primaryButton: {
    marginTop: verticalScale(8),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.navyFreshDark,
  },

  primaryButtonContent: {
    height: verticalScale(50),
  },

  timerText: {
    textAlign: "center",
    marginTop: verticalScale(12),
    marginBottom: verticalScale(4),
    color: colors.textSecondary,
    fontSize: typography.small,
  },

  loginLinkButton: {
    alignSelf: "center",
    marginTop: verticalScale(12),
  },

  loginLinkText: {
    color: colors.navyFresh,
    fontSize: typography.small,
    fontFamily: fonts.medium,
  },
});
