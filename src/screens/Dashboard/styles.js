import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import {
  fontScale,
  moderateScale,
  verticalScale,
} from "../../constants/metrics";

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    paddingTop: verticalScale(38),
    paddingBottom: verticalScale(16),
    paddingHorizontal: moderateScale(18),
    borderBottomLeftRadius: moderateScale(18),
    borderBottomRightRadius: moderateScale(18),
    overflow: "hidden",
  },

  headerTopRow: {
    minHeight: moderateScale(48),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  logoutIconButton: {
    position: "absolute",
    right: 0,
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.44)",
    borderWidth: 1,
    borderColor: "rgba(18, 59, 99, 0.08)",
  },

  logoWrap: {
    position: "absolute",
    left: 0,
    width: moderateScale(62),
    height: moderateScale(38),
    backgroundColor: colors.glassWhite,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: moderateScale(52),
    height: moderateScale(20),
  },

  headerTitle: {
    maxWidth: "62%",
    fontSize: fontScale(18),
    fontFamily: fonts.bold,
    color: colors.navyFreshDark,
    lineHeight: fontScale(22),
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

  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },

  sectionTitle: {
    fontSize: fontScale(18),
    fontFamily: fonts.bold,
    color: colors.navyFreshDark,
  },

  sectionSubtitle: {
    marginTop: verticalScale(3),
    fontSize: fontScale(11),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  searchWrap: {
    minHeight: verticalScale(50),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginBottom: verticalScale(14),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(16),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(18, 59, 99, 0.08)",
    shadowColor: "#0C2E4D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    color: colors.textDark,
    fontSize: fontScale(14),
    fontFamily: fonts.medium,
  },

  clearSearchButton: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceBlue,
  },

  emptySearchCard: {
    alignItems: "center",
    paddingHorizontal: moderateScale(18),
    paddingVertical: verticalScale(24),
    borderRadius: moderateScale(22),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(18, 59, 99, 0.08)",
  },

  emptySearchTitle: {
    marginTop: verticalScale(10),
    fontSize: fontScale(15),
    fontFamily: fonts.bold,
    color: colors.navyFreshDark,
    textAlign: "center",
  },

  emptySearchText: {
    marginTop: verticalScale(4),
    fontSize: fontScale(12),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    lineHeight: fontScale(17),
    textAlign: "center",
  },

  cardShadow: {
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(18),
    shadowColor: "#0C2E4D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(14),
    borderWidth: 1,
    borderColor: "rgba(18, 59, 99, 0.08)",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },

  logoContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: colors.surfaceBlue,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(18, 59, 99, 0.08)",
    marginRight: moderateScale(12),
  },

  govLogo: {
    width: moderateScale(28),
    height: moderateScale(28),
  },

  titleGroup: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    minHeight: moderateScale(44),
    paddingRight: moderateScale(2),
  },

  projectName: {
    flexShrink: 1,
    fontSize: fontScale(15),
    fontFamily: fonts.bold,
    color: colors.navyFreshDark,
    lineHeight: fontScale(20),
    includeFontPadding: false,
  },

  projectClient: {
    marginTop: verticalScale(4),
    fontSize: fontScale(12),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    lineHeight: fontScale(16),
    includeFontPadding: false,
  },

  areaRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: verticalScale(38),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(12),
    backgroundColor: colors.surfaceBlue,
    borderWidth: 1,
    borderColor: "rgba(18, 59, 99, 0.08)",
  },

  areaLabel: {
    marginLeft: moderateScale(6),
    marginRight: moderateScale(8),
    fontSize: fontScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  areaValue: {
    flex: 1,
    minWidth: 0,
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    lineHeight: fontScale(16),
    includeFontPadding: false,
  },

  arrowContainer: {
    width: moderateScale(34),
    height: moderateScale(34),
    flexShrink: 0,
    borderRadius: moderateScale(10),
    backgroundColor: colors.surfaceBlue,
    justifyContent: "center",
    alignItems: "center",
  },
});
