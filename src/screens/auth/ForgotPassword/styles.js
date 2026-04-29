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
    fontSize: moderateScale(32),
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
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: "hidden",
  },

  sheetContent: {
    paddingHorizontal: moderateScale(22),
    paddingTop: verticalScale(22),
    paddingBottom: verticalScale(28),
    flexGrow: 1,
  },

  title: {
    fontSize: typography.h1,
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: "center",
    marginBottom: verticalScale(4),
  },

  progressText: {
    textAlign: "center",
    color: colors.navyFresh,
    fontSize: typography.small,
    fontFamily: fonts.medium,
    marginBottom: verticalScale(16),
  },

  sectionTitle: {
    color: colors.textDark,
    fontSize: typography.body,
    fontFamily: fonts.bold,
    textAlign: "center",
    marginBottom: verticalScale(6),
  },

  sectionSubtitle: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: typography.small,
    marginBottom: verticalScale(14),
    lineHeight: moderateScale(20),
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
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

  otpErrorText: {
    color: colors.danger,
    fontSize: typography.small,
    marginBottom: verticalScale(8),
    textAlign: "center",
  },

  submitError: {
    color: colors.danger,
    fontSize: typography.small,
    fontFamily: fonts.medium,
    marginTop: verticalScale(10),
    lineHeight: moderateScale(20),
    textAlign: "center",
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

  secondaryLink: {
    alignSelf: "center",
    marginTop: verticalScale(12),
  },

  secondaryLinkText: {
    color: colors.navyFresh,
    fontSize: typography.small,
    fontFamily: fonts.medium,
  },

  loginLinkButton: {
    alignSelf: "center",
    marginTop: verticalScale(16),
  },

  loginLinkText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontFamily: fonts.medium,
  },
});
