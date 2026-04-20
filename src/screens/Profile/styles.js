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

  headerTitle: {
    fontSize: moderateScale(20),
    fontFamily: fonts.bold,
    color: colors.navyFreshDark,
    textAlign: "center",
  },

  bodyWrapper: {
    flex: 1,
    backgroundColor: colors.white,
  },

  detailsContainer: {
    flexGrow: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
    paddingTop: verticalScale(22),
    paddingBottom: verticalScale(24),
  },

  avatarWrap: {
    position: "relative",
    marginBottom: verticalScale(16),
  },

  avatarBorder: {
    width: moderateScale(108),
    height: moderateScale(108),
    borderRadius: moderateScale(54),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },

  avatar: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: colors.surfaceBlue,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(18, 59, 99, 0.08)",
  },

  activeDot: {
    position: "absolute",
    right: moderateScale(8),
    bottom: moderateScale(8),
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: colors.primaryGreen,
    borderWidth: 3,
    borderColor: colors.white,
  },

  avatarImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: colors.surfaceBlue,
  },

  initials: {
    fontSize: moderateScale(28),
    fontFamily: fonts.bold,
    color: colors.navyFreshDark,
  },

  name: {
    fontSize: moderateScale(20),
    fontFamily: fonts.medium,
    color: colors.navyFreshDark,
    marginBottom: verticalScale(10),
  },

  designationPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    maxWidth: "88%",
    backgroundColor: "rgba(255,255,255,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(7),
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
  },

  designationText: {
    color: colors.navyFreshDark,
    fontSize: moderateScale(12.5),
    lineHeight: moderateScale(17),
    fontFamily: fonts.semiBold,
    textAlign: "center",
  },

  infoCard: {
    width: "100%",
    marginTop: verticalScale(22),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(6),
    shadowColor: "#0C2E4D",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  infoRow: {
    minHeight: verticalScale(66),
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217, 232, 245, 0.8)",
  },

  infoIconWrap: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.switchBgFresh,
    marginRight: moderateScale(12),
  },

  infoCopy: {
    flex: 1,
    minWidth: 0,
  },

  infoLabel: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  infoValue: {
    fontSize: moderateScale(15),
    lineHeight: moderateScale(20),
    fontFamily: fonts.semiBold,
    marginTop: verticalScale(4),
    color: colors.textDark,
  },

  syncCard: {
    width: "100%",
    marginTop: verticalScale(18),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(12),
    shadowColor: "#0C2E4D",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  syncHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },

  syncTitle: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(21),
    fontFamily: fonts.semiBold,
    color: colors.navyFreshDark,
  },

  syncSubtitle: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  syncActionsRow: {
    flexDirection: "row",
    gap: moderateScale(10),
  },

  syncButton: {
    flex: 1,
    minHeight: verticalScale(48),
    flexDirection: "row",
    gap: moderateScale(6),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceBlue,
    paddingHorizontal: moderateScale(6),
    paddingVertical: verticalScale(10),
  },

  syncButtonPrimary: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },

  syncButtonText: {
    color: colors.navyFreshDark,
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    fontFamily: fonts.semiBold,
  },

  syncButtonPrimaryText: {
    color: colors.white,
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    fontFamily: fonts.semiBold,
  },

  actionButtonDisabled: {
    opacity: 0.68,
  },

  logoutButton: {
    width: "100%",
    flexDirection: "row",
    gap: moderateScale(8),
    marginTop: verticalScale(22),
    backgroundColor: colors.navyFreshDark,
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.navyFreshDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },

  logoutText: {
    color: colors.white,
    fontSize: moderateScale(15),
    fontFamily: fonts.semiBold,
  },

  version: {
    textAlign: "center",
    marginTop: verticalScale(20),
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },
});
