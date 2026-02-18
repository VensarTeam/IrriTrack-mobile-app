import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
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
    fontWeight: "700",
    color: colors.primaryBlue,
    letterSpacing: 0.2,
    textAlign: "center",
  },

  headerSubtitle: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(12),
    color: colors.lightText,
    textAlign: "center",
  },

  bodyWrapper: {
    flex: 1,
    backgroundColor: colors.surfaceBlueSheet,
    borderTopWidth: 1,
    borderColor: colors.border,
    marginTop: verticalScale(-20),
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
  },

  container: {
    flex: 1,
    padding: moderateScale(20),
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
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
