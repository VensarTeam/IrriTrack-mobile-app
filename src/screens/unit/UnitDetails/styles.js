import { StyleSheet } from "react-native";
import colors from "../../../constants/colors";
import fonts from "../../../constants/fonts";
import { moderateScale, verticalScale } from "../../../constants/metrics";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    backgroundColor: "#F4F7FB",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  content: {
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(24),
  },

  heroCard: {
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(16),
    marginBottom: verticalScale(14),
    overflow: "hidden",
  },

  heroOrb1: {
    position: "absolute",
    top: -moderateScale(32),
    right: -moderateScale(32),
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  heroOrb2: {
    position: "absolute",
    bottom: -moderateScale(18),
    left: moderateScale(42),
    width: moderateScale(82),
    height: moderateScale(82),
    borderRadius: moderateScale(41),
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  heroBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },

  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.25)",
  },

  heroBadgeText: {
    fontSize: moderateScale(11),
    color: colors.white,
    fontFamily: fonts.bold,
    letterSpacing: 0.7,
  },

  heroUnitBadge: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },

  heroUnitText: {
    fontSize: moderateScale(11),
    color: "rgba(255,255,255,0.88)",
    fontFamily: fonts.medium,
  },

  heroTitle: {
    fontSize: moderateScale(16),
    color: colors.white,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(22),
  },

  sectionMetaBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginBottom: verticalScale(10),
  },

  sectionMetaIconWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: colors.surfaceBlueSoft,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionMetaCopy: {
    flex: 1,
  },

  sectionMetaTitle: {
    fontSize: moderateScale(14),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  sectionMetaSubtitle: {
    marginTop: verticalScale(1),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    lineHeight: moderateScale(15),
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },

  detailCard: {
    width: "48.5%",
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryBlue,
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(9),
    paddingHorizontal: moderateScale(12),
    marginBottom: verticalScale(8),
  },

  detailLabel: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: verticalScale(4),
    letterSpacing: 0.3,
  },

  detailValue: {
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(18),
  },

  statusListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },

  statusListCopy: {
    flex: 1,
    paddingRight: moderateScale(10),
  },

  statusListTitle: {
    fontSize: moderateScale(16),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  statusListSubtitle: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    lineHeight: moderateScale(16),
  },

  viewAllButton: {
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
  },

  viewAllText: {
    fontSize: moderateScale(13),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  stateCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: verticalScale(10),
    shadowColor: "#123B63",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },

  stateCardError: {
    backgroundColor: "#FFF8F5",
    borderColor: "#F3D5C7",
  },

  stateTitle: {
    fontSize: moderateScale(14),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  stateCopy: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    lineHeight: moderateScale(16),
  },

  retryButton: {
    alignSelf: "flex-start",
    marginTop: verticalScale(10),
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(7),
  },

  retryButtonText: {
    fontSize: moderateScale(11),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  processCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(14),
    marginBottom: verticalScale(10),
    shadowColor: "#123B63",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  processHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(12),
    paddingRight: moderateScale(2),
  },

  processHeadCopy: {
    flex: 1,
    paddingRight: moderateScale(10),
  },

  processBadge: {
    alignSelf: "flex-start",
    marginBottom: verticalScale(8),
    backgroundColor: colors.surfaceBlueSoft,
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
  },

  processBadgeText: {
    fontSize: moderateScale(9),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },

  processTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },

  processTitle: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: fonts.bold,
    color: colors.textDark,
    paddingRight: moderateScale(10),
  },

  processMeta: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  processChevronWrap: {
    width: moderateScale(28),
    alignItems: "center",
    justifyContent: "center",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(5),
  },

  statusPillDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(999),
    marginRight: moderateScale(6),
  },

  statusPillText: {
    fontSize: moderateScale(10),
    fontFamily: fonts.bold,
  },

  subprocessList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(4),
  },

  subprocessItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(11),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  subprocessItemLast: {
    borderBottomWidth: 0,
  },

  subprocessLead: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: moderateScale(10),
  },

  subprocessDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(999),
    marginTop: verticalScale(5),
    marginRight: moderateScale(10),
  },

  subprocessCopy: {
    flex: 1,
  },

  subprocessLabel: {
    fontSize: moderateScale(12.5),
    color: colors.textDark,
    fontFamily: fonts.medium,
    lineHeight: moderateScale(18),
  },

  subprocessHint: {
    marginTop: verticalScale(3),
    fontSize: moderateScale(10.5),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  subprocessMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
});
