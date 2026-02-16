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
    flex:1,
    alignItems: "center",
    justifyContent:'center',
    marginTop: verticalScale(80),
  },

  logo: {
    width: moderateScale(300),
    height: moderateScale(80),
    marginBottom: verticalScale(12),
  },

  systemText: {
    color: colors.white,
    fontSize: typography.h2,
    fontWeight: "500",
  },

  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    padding: moderateScale(24),
    paddingBottom: verticalScale(100),
  },

  title: {
    fontSize: typography.h1,
    fontWeight: "700",
    marginBottom: verticalScale(30),
    textAlign: "center",
    color: colors.textDark,
  },

  loginButton: {
    height: verticalScale(52),
    borderRadius: moderateScale(16),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primaryBlue,
    marginTop: verticalScale(20),
  },

  loginText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "600",
  },
});
