import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import { moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  header: {
    paddingTop: verticalScale(34),
    paddingBottom: verticalScale(36),
    alignItems: "center",
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

  logo: {
    width: moderateScale(138),
    height: moderateScale(54),
  },

  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: colors.primaryBlue,
  },

  headerSubtitle: {
    marginTop: verticalScale(4),
    color: colors.lightText,
    fontSize: moderateScale(12),
    textAlign: "center",
  },

  bodyWrapper: {
    flex: 1,
    backgroundColor: colors.surfaceBlueSheet,
    borderTopWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: verticalScale(-20),
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },

  container: {
    padding: moderateScale(20),
  },

  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    marginBottom: verticalScale(16),
    elevation: 2,
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
