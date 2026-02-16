import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import typography from "../../constants/typography";
import { moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
  },

  topSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(60),
  },

  logo: {
    width: moderateScale(300),
    height: moderateScale(80),
    marginBottom: verticalScale(12),
  },

  systemText: {
    color: colors.white,
    fontSize: typography.h2,
  },

  sheet: {
    backgroundColor: colors.white,
    padding: moderateScale(24),
    paddingBottom: verticalScale(40),
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
  },

  title: {
    fontSize: typography.h1,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: verticalScale(10),
    color: colors.textDark,
  },

  subtitle: {
    textAlign: "center",
    marginBottom: verticalScale(30),
    color: colors.textSecondary,
    fontSize: typography.body,
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(30),
  },

  otpBox: {
    width: moderateScale(60),
    height: verticalScale(60),
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: moderateScale(14),
    textAlign: "center",
    fontSize: typography.h1,
    color: colors.textDark,
    backgroundColor: colors.inputBg,
  },

  button: {
    marginBottom: verticalScale(20),
  },

  backButton: {
    position: "absolute",
    left: moderateScale(10),
    top: verticalScale(-10),
  },

  timerText: {
    textAlign: "center",
    marginBottom: verticalScale(8),
    color: colors.textSecondary,
    fontSize: typography.small,
  },
});
