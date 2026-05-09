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

  subprocessItemActive: {
    marginHorizontal: -moderateScale(8),
    marginVertical: verticalScale(4),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(14),
    backgroundColor: "#F5FAFF",
    borderWidth: 1,
    borderColor: "#D9E8F8",
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
    marginTop: verticalScale(2),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  subprocessActionHint: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(10.5),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  subprocessMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },

  processReviewPanel: {
    marginTop: verticalScale(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: "#D9E8F8",
    borderRadius: moderateScale(18),
    backgroundColor: "#F7FBFF",
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(14),
  },

  processReviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },

  processReviewCopy: {
    flex: 1,
    paddingRight: moderateScale(10),
  },

  processReviewTitle: {
    fontSize: moderateScale(14),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  processReviewSubtitle: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(11),
    lineHeight: moderateScale(16),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  metricChipRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginBottom: verticalScale(12),
  },

  metricChip: {
    flex: 1,
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(10),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  metricChipSuccess: {
    backgroundColor: "#EBFFF4",
    borderColor: "#BCEBD0",
  },

  metricChipWarning: {
    backgroundColor: "#FFF8E8",
    borderColor: "#F2D6A2",
  },

  metricChipValue: {
    fontSize: moderateScale(17),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  metricChipLabel: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  processActionRow: {
    flexDirection: "row",
    gap: moderateScale(10),
  },

  processReviewNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    minHeight: verticalScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: moderateScale(12),
  },

  processReviewNoticeText: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    lineHeight: moderateScale(16),
  },

  processApprovedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    minHeight: verticalScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: "#EBFFF4",
    borderWidth: 1,
    borderColor: "#BCEBD0",
    paddingHorizontal: moderateScale(12),
  },

  processApprovedNoticeText: {
    fontSize: moderateScale(11.5),
    color: colors.completed,
    fontFamily: fonts.bold,
  },

  processActionButton: {
    flex: 1,
    minHeight: verticalScale(44),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(12),
  },

  processRejectButton: {
    backgroundColor: "#FFF4F1",
    borderWidth: 1,
    borderColor: "#F6C8BC",
  },

  processApproveButton: {
    backgroundColor: colors.primaryBlue,
  },

  processVerifyButton: {
    backgroundColor: "#EAF3FF",
    borderWidth: 1,
    borderColor: "#B7D3F5",
  },

  processRejectText: {
    fontSize: moderateScale(12),
    color: colors.danger,
    fontFamily: fonts.bold,
  },

  processApproveText: {
    fontSize: moderateScale(12),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  processVerifyText: {
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
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

  directionButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(9),
    marginBottom: verticalScale(12),
  },

  directionButtonText: {
    fontSize: moderateScale(11.5),
    color: colors.white,
    fontFamily: fonts.bold,
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

  checklistCardCompact: {
    paddingVertical: verticalScale(10),
  },

  checklistHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },

  checklistInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(12),
  },

  checklistInlineCopy: {
    flex: 1,
    minWidth: 0,
  },

  checklistInlineStatus: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  checklistCopy: {
    flex: 1,
    width: "100%",
  },

  checklistTitle: {
    fontSize: moderateScale(12.5),
    color: colors.textDark,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(18),
  },

  checklistCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },

  checklistCountTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: moderateScale(12.5),
    color: colors.textDark,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(18),
  },

  checklistCountBadge: {
    minWidth: moderateScale(34),
    height: verticalScale(30),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF6FF",
    borderWidth: 1,
    borderColor: "#D5E7FB",
    flexShrink: 0,
  },

  checklistCountBadgeText: {
    fontSize: moderateScale(13),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  optionalText: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  checklistMeta: {
    paddingLeft: moderateScale(8),
  },

  valueBlock: {
    marginTop: verticalScale(10),
    width: "100%",
    alignSelf: "stretch",
  },

  compactValueRow: {
    minHeight: verticalScale(38),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(8),
  },

  compactValueToneSuccess: {
    backgroundColor: "#ECFBF3",
    borderWidth: 1,
    borderColor: "#C7EFD8",
  },

  compactValueToneDanger: {
    backgroundColor: "#FFF3F0",
    borderWidth: 1,
    borderColor: "#F1C5B8",
  },

  compactValueToneNeutral: {
    backgroundColor: "#EEF6FF",
    borderWidth: 1,
    borderColor: "#D5E7FB",
  },

  compactValueText: {
    flex: 1,
    fontSize: moderateScale(11.5),
    fontFamily: fonts.semiBold,
    lineHeight: moderateScale(16),
  },

  compactValueTextSuccess: {
    color: colors.completed,
  },

  compactValueTextDanger: {
    color: colors.danger,
  },

  compactValueTextNeutral: {
    color: colors.textDark,
  },

  valueLabel: {
    marginBottom: verticalScale(6),
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },

  valueHighlight: {
    borderRadius: moderateScale(12),
    backgroundColor: "#EEF6FF",
    borderWidth: 1,
    borderColor: "#D5E7FB",
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(9),
  },

  valueHighlightText: {
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    lineHeight: moderateScale(18),
  },

  arrayGroup: {
    gap: moderateScale(8),
  },

  arrayCard: {
    borderRadius: moderateScale(12),
    backgroundColor: "#F7FAFD",
    borderWidth: 1,
    borderColor: "#DDE7F1",
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(9),
  },

  arrayRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: moderateScale(10),
    paddingVertical: verticalScale(3),
  },

  arrayKey: {
    flex: 1,
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    lineHeight: moderateScale(16),
  },

  arrayValue: {
    flex: 1,
    fontSize: moderateScale(11.5),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    lineHeight: moderateScale(16),
    textAlign: "right",
  },

  outletArrayRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: moderateScale(6),
  },

  outletArrayCell: {
    flex: 1,
    minWidth: 0,
    borderRadius: moderateScale(9),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E3ECF5",
    paddingHorizontal: moderateScale(7),
    paddingVertical: verticalScale(6),
  },

  outletArrayLabel: {
    fontSize: moderateScale(8.5),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textTransform: "uppercase",
  },

  outletArrayValue: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(10.5),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
  },

  fileRow: {
    borderRadius: moderateScale(12),
    backgroundColor: "#F7FAFD",
    borderWidth: 1,
    borderColor: "#DDE7F1",
    paddingHorizontal: moderateScale(10),
    paddingBottom: verticalScale(10),
  },

  filePreviewTouch: {
    marginTop: verticalScale(10),
  },

  filePlaceholder: {
    marginTop: verticalScale(10),
    minHeight: verticalScale(120),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#D5E2EE",
    borderStyle: "dashed",
    backgroundColor: "#F2F7FB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
  },

  filePlaceholderText: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    textAlign: "center",
  },

  inlinePreviewImage: {
    width: "100%",
    height: verticalScale(150),
    borderRadius: moderateScale(12),
    marginTop: verticalScale(10),
    backgroundColor: "#E8EEF5",
  },

  viewImageButtonText: {
    fontSize: moderateScale(11),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  reviewDetailsSection: {
    marginTop: verticalScale(16),
  },

  sectionBlockTitle: {
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontFamily: fonts.bold,
    marginBottom: verticalScale(10),
  },

  detailMetaGrid: {
    gap: moderateScale(8),
  },

  detailMetaCard: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(14),
    backgroundColor: colors.surfaceBluePale,
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
  },

  detailMetaLabel: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: verticalScale(4),
    letterSpacing: 0.3,
  },

  detailMetaValue: {
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    lineHeight: moderateScale(18),
  },

  reviewActionSection: {
    marginTop: verticalScale(18),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(18),
    backgroundColor: "#F8FBFE",
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(14),
  },

  reviewActionSubtitle: {
    fontSize: moderateScale(10.5),
    lineHeight: moderateScale(15),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: verticalScale(10),
  },

  reviewRemarkInput: {
    minHeight: verticalScale(92),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  reviewRemarkInputError: {
    borderColor: colors.danger,
  },

  reviewErrorText: {
    marginTop: verticalScale(6),
    fontSize: moderateScale(10),
    color: colors.danger,
    fontFamily: fonts.medium,
  },

  reviewActionRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    marginTop: verticalScale(12),
  },

  reviewActionButton: {
    flex: 1,
    minHeight: verticalScale(46),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  reviewActionButtonDisabled: {
    opacity: 0.78,
  },

  reviewRejectButton: {
    backgroundColor: "#FFF3F0",
    borderColor: "#E5B7AA",
  },

  reviewApproveButton: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },

  reviewRejectText: {
    fontSize: moderateScale(11.5),
    color: "#B24531",
    fontFamily: fonts.bold,
  },

  reviewApproveText: {
    fontSize: moderateScale(11.5),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  imageOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(18),
  },

  imageBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  imageCard: {
    width: "100%",
    maxHeight: "76%",
    borderRadius: moderateScale(22),
    backgroundColor: colors.white,
    overflow: "hidden",
  },

  imageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: moderateScale(16),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(6),
  },

  imageTitle: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.textDark,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(20),
    paddingRight: moderateScale(8),
  },

  previewImage: {
    width: "100%",
    height: verticalScale(360),
    backgroundColor: "#F2F6FA",
  },

  rejectOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(18),
  },

  rejectBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  rejectCard: {
    width: "100%",
    borderRadius: moderateScale(22),
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(18),
    paddingVertical: verticalScale(18),
    shadowColor: "#123B63",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },

  rejectEyebrow: {
    fontSize: moderateScale(11),
    color: colors.danger,
    fontFamily: fonts.bold,
    marginBottom: verticalScale(4),
  },

  rejectTitle: {
    fontSize: moderateScale(18),
    color: colors.textDark,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(24),
  },

  rejectSubtitle: {
    marginTop: verticalScale(6),
    marginBottom: verticalScale(12),
    fontSize: moderateScale(11),
    lineHeight: moderateScale(16),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  rejectActionRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    marginTop: verticalScale(14),
  },

  rejectSecondaryButton: {
    flex: 1,
    minHeight: verticalScale(44),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  rejectSecondaryText: {
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  rejectPrimaryButton: {
    flex: 1.2,
    minHeight: verticalScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  rejectPrimaryText: {
    fontSize: moderateScale(12),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  checklistHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  checklistCopy: {
    flex: 1,
    width: "100%",
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
