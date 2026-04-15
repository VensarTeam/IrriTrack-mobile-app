import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import {
  fontScale,
  moderateScale,
  verticalScale,
} from "../../constants/metrics";

export default StyleSheet.create({
  header: {
    paddingTop: verticalScale(38),
    paddingBottom: verticalScale(28),
    paddingHorizontal: moderateScale(20),
    alignItems: "center",
  },

  logoutIconButton: {
    position: "absolute",
    top: verticalScale(38),
    right: moderateScale(18),
    padding: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(21),
    borderWidth: 1,
    borderColor: "rgba(50, 168, 116, 0.12)",
    shadowColor: "#0C2E4D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
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
    fontSize: fontScale(17),
    fontFamily: fonts.bold,
    color: colors.navyFreshDark,
    textAlign: "center",
  },

  headerFullForm: {
    maxWidth: "100%",
    marginTop: verticalScale(4),
    fontSize: fontScale(11),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    lineHeight: fontScale(16),
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
    backgroundColor: colors.sheetSurface,
    borderTopWidth: 1,
    borderColor: "rgba(50, 168, 116, 0.16)",
    marginTop: verticalScale(-14),
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    overflow: "hidden",
  },

  container: {
    padding: moderateScale(18),
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
    minHeight: verticalScale(52),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginBottom: verticalScale(16),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(18),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(18, 59, 99, 0.08)",
    shadowColor: "#0C2E4D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
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
    marginBottom: verticalScale(14),
    borderRadius: moderateScale(24),
    shadowColor:  colors.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },

  card: {
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(18),
    paddingVertical: verticalScale(16),
    borderWidth: 1,
    borderColor: "rgba(50, 168, 116, 0.16)",
  },

  cardTop: {
    alignItems: "flex-start",
    marginBottom: verticalScale(10),
  },

  cardTopLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },

  logoContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(16),
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(50, 168, 116, 0.12)",
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
    minHeight: moderateScale(48),
    paddingRight: moderateScale(2),
  },

  projectName: {
    flexShrink: 1,
    fontSize: fontScale(16),
    fontFamily: fonts.bold,
    color: colors.navyFreshDark,
    lineHeight: fontScale(21),
    includeFontPadding: false,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(50, 168, 116, 0.12)",
    marginBottom: verticalScale(12),
  },

  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(2),
  },

  areaContainer: {
    minWidth: 0,
    marginRight: moderateScale(10),
    backgroundColor: "rgba(255,255,255,0.86)",
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "rgba(50, 168, 116, 0.14)",
  },

  areaLabel: {
    fontSize: fontScale(10),
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: verticalScale(3),
    fontFamily: fonts.medium,
  },

  areaValue: {
    fontSize: fontScale(14),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    lineHeight: fontScale(18),
    includeFontPadding: false,
  },

  arrowContainer: {
    width: moderateScale(38),
    height: moderateScale(38),
    flexShrink: 0,
    borderRadius: moderateScale(12),
    backgroundColor: colors.primaryBlue,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
});
