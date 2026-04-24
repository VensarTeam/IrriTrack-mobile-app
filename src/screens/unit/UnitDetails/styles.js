import { StyleSheet } from "react-native";
import colors from "../../../constants/colors";
import fonts from "../../../constants/fonts";
import { moderateScale, verticalScale } from "../../../constants/metrics";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    backgroundColor: colors.white,
  },

  headerTitle: {
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
    color: colors.textDark,
    flex: 1,
    textAlign: "center",
  },

  content: {
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(20),
  },

  heroCard: {
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(16),
    paddingHorizontal: moderateScale(16),
    marginBottom: verticalScale(14),
    overflow: "hidden",
  },

  heroOrb1: {
    position: "absolute",
    top: -moderateScale(30),
    right: -moderateScale(30),
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  heroOrb2: {
    position: "absolute",
    bottom: -moderateScale(20),
    left: moderateScale(40),
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  heroBadgeRow: {
    flexDirection: "row",
    marginBottom: verticalScale(10),
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(3),
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.25)",
  },

  heroBadgeText: {
    fontSize: moderateScale(11),
    color: "rgba(255,255,255,0.9)",
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
  },

  heroTitle: {
    fontSize: moderateScale(16),
    color: colors.white,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(14),
  },

  heroSummaryRow: {
    flexDirection: "row",
    gap: moderateScale(8),
  },

  heroSummaryChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(8),
    alignItems: "center",
    justifyContent: "center",
  },

  heroSummaryChipHighlight: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.38)",
  },

  heroSummaryValue: {
    fontSize: moderateScale(17),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  heroSummaryLabel: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(9.5),
    color: "rgba(255,255,255,0.72)",
    fontFamily: fonts.medium,
    letterSpacing: 0.3,
  },

  sectionMetaBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginBottom: verticalScale(10),
    paddingHorizontal: moderateScale(2),
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
    flexShrink: 0,
  },

  sectionMetaCopy: {
    flex: 1,
  },

  sectionMetaTitle: {
    fontSize: moderateScale(14),
    color: colors.textDark,
    fontFamily: fonts.bold,
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
    marginBottom: verticalScale(10),
  },

  detailCard: {
    width: "48.5%",
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryBlue, // overridden per-item in JSX
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(9),
    paddingHorizontal: moderateScale(12),
    marginBottom: verticalScale(8),
  },

  detailLabel: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    letterSpacing: 0.3,
    marginBottom: verticalScale(4),
  },

  detailValue: {
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(18),
  },

  statusListHeader: {
    marginBottom: verticalScale(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    marginTop: verticalScale(1),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
  },

  viewAllButton: {
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(5),
    borderWidth: 1,
    borderColor: colors.primaryBlue,
  },

  viewAllText: {
    fontSize: moderateScale(11),
    fontFamily: fonts.medium,
    color: colors.white,
  },

  statusCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(9),
    paddingHorizontal: moderateScale(10),
    marginBottom: verticalScale(8),
    elevation: 1,
  },

  statusCardHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: verticalScale(6),
  },

  statusHeadMain: {
    flex: 1,
    paddingRight: moderateScale(10),
  },

  sectionToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },

  chevronWrap: {
    marginLeft: moderateScale(2),
  },

  chevronWrapExpanded: {
    transform: [{ rotate: "180deg" }],
  },

  statusCardTitle: {
    fontSize: moderateScale(14),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  statusCountText: {
    marginTop: verticalScale(3),
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkGreen,
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(14),
    borderColor: colors.darkGreen,
    borderWidth: 1,
  },

  updateButtonText: {
    fontSize: moderateScale(12),
    fontFamily: fonts.medium,
    color: colors.white,
  },

  statusCardDescription: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    lineHeight: moderateScale(16),
  },

  subStatusList: {
    marginTop: verticalScale(8),
  },

  subStatusItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(7),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  subStatusItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },

  subStatusCopy: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: moderateScale(10),
  },

  subStatusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(999),
    backgroundColor: colors.primaryBlue,
    marginRight: moderateScale(8),
  },

  subStatusLabel: {
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.medium,
    flex: 1,
  },

  statusPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },

  statusPillText: {
    fontSize: moderateScale(10),
    fontFamily: fonts.medium,
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
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderColor: colors.loginSheetBorderLight,
    elevation: 12,
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
    fontFamily: fonts.medium,
    color: colors.primaryGreen,
    marginBottom: verticalScale(3),
  },

  sheetTitle: {
    fontSize: moderateScale(17),
    fontFamily: fonts.bold,
    color: colors.textDark,
    lineHeight: moderateScale(22),
  },

  sheetSubtitle: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginTop: verticalScale(4),
    lineHeight: moderateScale(18),
  },

  sheetCloseButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    margin: 0,
    backgroundColor: colors.surfaceBluePale,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  sheetScroll: {
    width: "100%",
  },

  sheetScrollContent: {
    paddingTop: verticalScale(2),
  },

  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: verticalScale(64),
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.projectModalItemBorder,
    backgroundColor: colors.surfaceBluePale,
    marginBottom: verticalScale(9),
  },

  sheetOptionIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.darkGreen,
    borderWidth: 1,
    borderColor: colors.darkGreen,
    marginRight: moderateScale(10),
  },

  sheetOptionCopy: {
    flex: 1,
    paddingRight: moderateScale(8),
  },

  sheetOptionTitle: {
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(18),
  },

  sheetOptionHint: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginTop: verticalScale(2),
  },

  sheetOptionMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  sheetStatusPill: {
    minWidth: moderateScale(64),
    maxWidth: moderateScale(112),
    alignItems: "center",
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(7),
  },

  sheetStatusText: {
    fontSize: moderateScale(10),
    color: colors.white,
    fontFamily: fonts.medium,
    maxWidth: moderateScale(96),
  },

  sheetOptionChevron: {
    transform: [{ rotate: "-90deg" }],
    marginRight: moderateScale(2),
  },
});
