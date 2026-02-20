import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import typography from "../../constants/typography";
import { moderateScale, verticalScale } from "../../constants/metrics";

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
    fontWeight: "500",
    textAlign: "center",
  },

  sheet: {
    flex: 1,
    backgroundColor: "transparent",
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
    fontWeight: "700",
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

  switchRow: {
    flexDirection: "row",
    backgroundColor: colors.switchBgFresh,
    borderRadius: moderateScale(14),
    padding: moderateScale(4),
    marginBottom: verticalScale(14),
  },

  switchButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(10),
  },

  switchButtonActive: {
    backgroundColor: colors.loginBottomLight,
    borderWidth: 1,
    borderColor: colors.navyFreshDark,
    elevation: 2,
  },

  switchText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: "600",
  },

  switchTextActive: {
    color: colors.navyFreshDark,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: verticalScale(2),
    marginBottom: verticalScale(10),
  },

  forgotText: {
    color: colors.navyFresh,
    fontSize: typography.small,
    fontWeight: "600",
  },

  loginButton: {
    marginTop: verticalScale(8),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.navyFreshDark,
    overflow: "hidden",
  },

  loginButtonContent: {
    height: verticalScale(50),
  },
});
