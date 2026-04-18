import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import { moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    paddingTop: verticalScale(38),
    paddingBottom: verticalScale(14),
    paddingHorizontal: moderateScale(18),
    borderBottomLeftRadius: moderateScale(18),
    borderBottomRightRadius: moderateScale(18),
    overflow: "hidden",
  },

  headerTitleRow: {
    minHeight: moderateScale(48),
    alignItems: "center",
    justifyContent: "center",
  },

  logoCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(18, 59, 99, 0.08)",
    borderRadius: moderateScale(18),
    paddingVertical: verticalScale(14),
    marginBottom: verticalScale(14),
    shadowColor: "#0C2E4D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },

  logo: {
    width: moderateScale(138),
    height: moderateScale(54),
  },

  headerTitle: {
    fontSize: moderateScale(20),
    fontFamily: fonts.bold,
    color: colors.navyFreshDark,
    textAlign: "center",
  },

  headerSubtitle: {
    marginTop: verticalScale(4),
    color: colors.textSecondary,
    fontSize: moderateScale(12),
    textAlign: "center",
  },

  bodyWrapper: {
    flex: 1,
    backgroundColor: colors.white,
  },

  container: {
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(22),
    paddingBottom: verticalScale(24),
  },

  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(18, 59, 99, 0.08)",
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: verticalScale(12),
    shadowColor: "#0C2E4D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },

  cardTitle: {
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
    marginBottom: verticalScale(10),
    color: colors.navyFresh,
  },

  cardText: {
    fontSize: moderateScale(14),
    lineHeight: verticalScale(22),
    color: colors.textDark,
  },
});
