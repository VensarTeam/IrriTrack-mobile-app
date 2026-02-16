import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import { moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  header: {
    paddingVertical: verticalScale(40),
    paddingHorizontal: moderateScale(20),
    alignItems: "center",
  },

  bodyWrapper: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: verticalScale(-20), // pulls up to create overlap
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },

  container: {
    flex:1,
    padding: moderateScale(20),
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

  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    marginBottom: verticalScale(18),
    color: colors.textDark,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(24),
    padding: moderateScale(20),
    marginBottom: verticalScale(18),
    elevation: 6,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(14),
  },

  govLogo: {
    width: moderateScale(50),
    height: moderateScale(50),
    marginRight: moderateScale(12),
  },

  clientText: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    flex: 1,
  },

  projectName: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    marginBottom: verticalScale(18),
    color: colors.textDark,
  },

  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  areaPill: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(50),
  },

  areaText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontWeight: "500",
  },

  arrow: {
    fontSize: moderateScale(24),
    color: colors.primaryBlue,
  },

  areaLabel: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: verticalScale(2),
  },

  areaValue: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: colors.primaryBlue,
  },
});
