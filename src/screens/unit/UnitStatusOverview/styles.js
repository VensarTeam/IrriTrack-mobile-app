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
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  headerSpacer: {
    width: moderateScale(40),
  },

  content: {
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(28),
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
    top: -moderateScale(40),
    right: -moderateScale(40),
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  heroOrb2: {
    position: "absolute",
    bottom: -moderateScale(24),
    left: moderateScale(30),
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },

  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.28)",
  },

  heroBadgeText: {
    fontSize: moderateScale(11),
    color: "rgba(255,255,255,0.92)",
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
    color: "rgba(255,255,255,0.85)",
    fontFamily: fonts.medium,
  },

  heroTitle: {
    fontSize: moderateScale(16),
    color: colors.white,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(14),
    paddingRight: moderateScale(40),
  },

  heroStatsRow: {
    flexDirection: "row",
    gap: moderateScale(8),
  },

  heroStatChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: moderateScale(13),
    paddingVertical: verticalScale(9),
    alignItems: "center",
    justifyContent: "center",
  },

  heroStatChipGreen: {
    backgroundColor: "rgba(14,159,110,0.28)",
    borderColor: "rgba(14,159,110,0.55)",
  },

  heroStatChipAmber: {
    backgroundColor: "rgba(240,140,0,0.22)",
    borderColor: "rgba(240,140,0,0.45)",
  },

  heroStatValue: {
    fontSize: moderateScale(18),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  heroStatLabel: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(9.5),
    color: "rgba(255,255,255,0.72)",
    fontFamily: fonts.medium,
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

  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(18),
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(14),
    marginBottom: verticalScale(10),
    shadowColor: "#123B63",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  sectionHeadRow: {
    marginBottom: verticalScale(10),
  },

  sectionHeadCopy: {
    flex: 1,
  },

  sectionBadge: {
    alignSelf: "flex-start",
    marginBottom: verticalScale(8),
    backgroundColor: colors.surfaceBlueSoft,
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
  },

  sectionBadgeText: {
    fontSize: moderateScale(9),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },

  sectionTitle: {
    flex: 1,
    paddingRight: moderateScale(10),
    fontSize: moderateScale(14),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  sectionSubtitle: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  subStatusList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: verticalScale(4),
  },

  subStatusItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  subStatusItemLast: {
    borderBottomWidth: 0,
    paddingBottom: verticalScale(4),
  },

  subStatusCopy: {
    flex: 1,
    paddingRight: moderateScale(10),
  },

  subStatusLabel: {
    fontSize: moderateScale(12.5),
    color: colors.textDark,
    fontFamily: fonts.medium,
    lineHeight: moderateScale(18),
  },

  subStatusHint: {
    marginTop: verticalScale(3),
    fontSize: moderateScale(10.5),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  subStatusMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
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

  sheetOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "flex-end",
  },

  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  bottomSheet: {
    maxHeight: "82%",
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(10),
  },

  sheetHandle: {
    width: moderateScale(48),
    height: verticalScale(5),
    borderRadius: moderateScale(8),
    alignSelf: "center",
    backgroundColor: colors.cardBorder,
    marginBottom: verticalScale(12),
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },

  sheetHeaderCopy: {
    flex: 1,
    paddingRight: moderateScale(10),
  },

  sheetEyebrow: {
    fontSize: moderateScale(11),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
    marginBottom: verticalScale(4),
  },

  sheetTitle: {
    fontSize: moderateScale(17),
    color: colors.textDark,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(22),
  },

  sheetSubtitle: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    lineHeight: moderateScale(16),
  },

  sheetStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },

  sheetStatusCount: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  sheetScroll: {
    flexGrow: 0,
  },

  sheetScrollContent: {
    paddingBottom: verticalScale(16),
  },

  checklistCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    padding: moderateScale(13),
    marginBottom: verticalScale(10),
    shadowColor: "#123B63",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },

  checklistCardLast: {
    marginBottom: 0,
  },

  checklistHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  checklistCopy: {
    flex: 1,
    paddingRight: moderateScale(10),
  },

  checklistTitle: {
    fontSize: moderateScale(12.5),
    color: colors.textDark,
    fontFamily: fonts.medium,
    lineHeight: moderateScale(18),
  },

  checklistDetail: {
    marginTop: verticalScale(6),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    lineHeight: moderateScale(16),
  },

  optionalText: {
    marginTop: verticalScale(6),
    fontSize: moderateScale(10.5),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontStyle: "italic",
  },

  checklistMeta: {
    alignItems: "flex-end",
    marginLeft: moderateScale(10),
  },
});
