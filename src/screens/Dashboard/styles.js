import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import { moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  header: {
    paddingTop: verticalScale(34),
    paddingBottom: verticalScale(38),
    paddingHorizontal: moderateScale(20),
    alignItems: "center",
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

  logo: {
    width: moderateScale(142),
    height: moderateScale(56),
  },

  headerTitle: {
    fontSize: moderateScale(17),
    fontFamily: fonts.bold,
    color: colors.navyFreshDark,
    letterSpacing: 0.2,
    textAlign: "center",
  },

  headerSubtitle: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    textAlign: "center",
  },

  bodyWrapper: {
    flex: 1,
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderColor: colors.loginSheetBorderLight,
    marginTop: verticalScale(-20),
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: "hidden",
  },

  container: {
    flex: 1,
    padding: moderateScale(20),
  },

  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: fonts.bold,
    marginBottom: verticalScale(18),
    color: colors.navyFreshDark,
  },

  cardShadow: {
    marginBottom: verticalScale(20),
    borderRadius: moderateScale(28),
    shadowColor: "#0C2E4D",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
  },

  card: {
    borderRadius: moderateScale(28),
    padding: moderateScale(22),
    borderWidth: 1,
    borderColor: "#E4F1FB",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(14),
  },

  logoContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(18),
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(14),
  },

  govLogo: {
    width: moderateScale(34),
    height: moderateScale(34),
  },

  clientText: {
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    flex: 1,
  },

  projectName: {
    fontSize: moderateScale(18),
    fontFamily: fonts.bold,
    color: colors.navyFreshDark,
    marginBottom: verticalScale(20),
  },

  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  areaContainer: {
    backgroundColor: "#EAF4FF",
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(16),
  },

  areaLabel: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: verticalScale(2),
  },

  areaValue: {
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
    color: colors.navyFresh,
  },

  arrowContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(14),
    backgroundColor: colors.navyFresh,
    justifyContent: "center",
    alignItems: "center",
  },

  arrow: {
    fontSize: moderateScale(20),
    color: "#FFFFFF",
    fontFamily: fonts.medium,
    backgroundColor:'red',
  },
});
