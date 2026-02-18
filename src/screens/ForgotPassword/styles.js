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
    color: colors.primaryBlueDark,
    fontSize: typography.h2,
    fontWeight: "500",
    textAlign: "center",
  },

  sheet: {
    flex: 1,
    backgroundColor: colors.surfaceBlueSheet,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
  },

  sheetContent: {
    paddingHorizontal: moderateScale(22),
    paddingTop: verticalScale(22),
    paddingBottom: verticalScale(28),
    flexGrow: 1,
  },

  title: {
    fontSize: typography.h1,
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: verticalScale(4),
  },

  progressText: {
    textAlign: "center",
    color: colors.primaryBlue,
    fontSize: typography.small,
    fontWeight: "600",
    marginBottom: verticalScale(16),
  },

  sectionTitle: {
    color: colors.textDark,
    fontSize: typography.body,
    fontWeight: "700",
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

  switchRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceBlue,
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
    backgroundColor: colors.white,
    elevation: 2,
  },

  switchText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: "600",
  },

  switchTextActive: {
    color: colors.primaryBlue,
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
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    textAlign: "center",
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: colors.textDark,
  },

  otpErrorText: {
    color: colors.danger,
    fontSize: typography.small,
    marginBottom: verticalScale(8),
    textAlign: "center",
  },

  primaryButton: {
    marginTop: verticalScale(8),
    borderRadius: moderateScale(14),
  },

  primaryButtonContent: {
    height: verticalScale(50),
  },

  secondaryLink: {
    alignSelf: "center",
    marginTop: verticalScale(12),
  },

  secondaryLinkText: {
    color: colors.primaryBlue,
    fontSize: typography.small,
    fontWeight: "600",
  },

  loginLinkButton: {
    alignSelf: "center",
    marginTop: verticalScale(16),
  },

  loginLinkText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: "600",
  },
});
