import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import { moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  header: {
    paddingVertical: verticalScale(40),
    alignItems: "center",
  },

  logo: {
    width: moderateScale(120),
    height: moderateScale(60),
    marginBottom: verticalScale(8),
  },

  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: colors.white,
  },

  bodyWrapper: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: verticalScale(-20),
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },

  container: {
    padding: moderateScale(20),
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    marginBottom: verticalScale(16),
    elevation: 4,
  },

  cardTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    marginBottom: verticalScale(10),
    color: colors.primaryBlue,
  },

  cardText: {
    fontSize: moderateScale(14),
    lineHeight: verticalScale(22),
    color: colors.textSecondary,
  },
});
