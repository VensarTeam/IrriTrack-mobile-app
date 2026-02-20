import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import { moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  header: {
    paddingVertical: verticalScale(50),
    alignItems: "center",
  },

  avatar: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },

  initials: {
    fontSize: moderateScale(28),
    fontWeight: "700",
    color: colors.navyFreshDark,
  },

  name: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    color: colors.navyFreshDark,
    marginBottom: verticalScale(8),
  },

  badge: {
    backgroundColor: colors.glassWhite,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(50),
  },

  badgeText: {
    color: colors.navyFreshDark,
    fontSize: moderateScale(12),
  },

  detailsContainer: {
    flex: 1,
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderColor: colors.loginSheetBorderLight,
    marginTop: verticalScale(-24),
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    overflow: "hidden",
    padding: moderateScale(20),
  },

  infoRow: {
    marginBottom: verticalScale(18),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: verticalScale(10),
  },

  infoLabel: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },

  infoValue: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    marginTop: verticalScale(4),
    color: colors.textDark,
  },

  logoutButton: {
    marginTop: verticalScale(30),
    backgroundColor: colors.danger,
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(14),
    alignItems: "center",
  },

  logoutText: {
    color: colors.white,
    fontSize: moderateScale(15),
    fontWeight: "600",
  },

  version: {
    textAlign: "center",
    marginTop: verticalScale(20),
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },
});
