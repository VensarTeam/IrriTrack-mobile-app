import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import {
  fontScale,
  moderateScale,
  scale,
  verticalScale,
} from "../../constants/metrics";

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FBFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7FBFF",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(8),
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: fontScale(17),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  headerSpacer: {
    width: moderateScale(40),
  },

  headerCard: {
    marginHorizontal: moderateScale(15),
    borderRadius: moderateScale(22),
    backgroundColor: "#F4F8FC",
  },

  searchShell: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: verticalScale(48),
    paddingLeft: moderateScale(10),
    paddingRight: moderateScale(8),
    borderRadius: moderateScale(16),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E3EBF4",
    gap: moderateScale(8),
  },

  searchIconWrap: {
    width: moderateScale(28),
    alignItems: "center",
    justifyContent: "center",
  },

  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: fontScale(12.5),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
  },

  searchClearButton: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceBluePale,
  },

  contextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
    marginTop: verticalScale(12),
  },

  contextChip: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(999),
    backgroundColor: colors.surfaceBluePale,
  },

  contextChipText: {
    fontSize: fontScale(10),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  searchRow: {
    marginHorizontal: moderateScale(12),
    marginBottom: verticalScale(4),
  },

  searchbar: {
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: "#E3EBF4",
    height: verticalScale(44),
  },

  searchInput: {
    fontSize: fontScale(13),
    minHeight: verticalScale(44),
  },

  tabView: {
    flex: 1,
    marginTop: verticalScale(8),
  },

  sceneContainer: {
    backgroundColor: "transparent",
  },

  tabBar: {
    backgroundColor: colors.primaryBlue,
    elevation: 0,
    shadowOpacity: 0,
    marginTop: verticalScale(8),
    marginBottom: verticalScale(6),
    borderBottomWidth: 1,
    borderColor: "#E2EAF2",
  },

  tabBarContent: {
    paddingHorizontal: moderateScale(12),
  },

  tabStyle: {
    width: moderateScale(122),
    minHeight: verticalScale(44),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
  },

  tabIndicator: {
    height: verticalScale(3),
    borderRadius: moderateScale(999),
    backgroundColor: colors.white,
  },

  tabIndicatorContainer: {
    backgroundColor: "transparent",
  },

  tabItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(8),
  },

  tabLabel: {
    fontSize: fontScale(12),
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    flex: 1,
  },

  tabCountBadge: {
    minWidth: moderateScale(22),
    height: moderateScale(22),
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(11),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },

  tabCountBadgeActive: {
    backgroundColor: colors.white,
  },
  tabCountText: {
    fontSize: fontScale(11),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  tabLabelActive: {
    color: colors.white,
    fontFamily: fonts.bold,
  },

  tabCountTextActive: {
    color: colors.white,
  },

  sceneContent: {
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(24),
  },

  card: {
    position: "relative",
    marginBottom: verticalScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(15),
    borderRadius: moderateScale(18),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#B4C8D8",
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.12,
    shadowRadius: scale(18),
    elevation: scale(3),
  },

  cardTopRow: {
    gap: verticalScale(8),
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: moderateScale(12),
  },

  cardTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  cardBodyWrap: {
    width: "100%",
  },

  cardStatusWrap: {
    alignSelf: "flex-start",
  },

  cardEyebrow: {
    marginBottom: verticalScale(4),
    fontSize: fontScale(14),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
    backgroundColor: "#EAF3FF",
    alignSelf: "flex-start",
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(999),
  },

  cardTitle: {
    fontSize: fontScale(14),
    color: colors.textDark,
    fontFamily: fonts.bold,
    marginLeft: moderateScale(9), 
  },

  cardMetaGroup: {
    width: "100%",
    marginTop: verticalScale(4),
    gap: verticalScale(5),
  },

  workflowMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(10),
    backgroundColor: "#F7FAFD",
    borderWidth: 1,
    borderColor: "#E7EEF5",
  },

  workflowMetaTag: {
    minWidth: moderateScale(72),
    paddingHorizontal: moderateScale(7),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(999),
    alignItems: "center",
    justifyContent: "center",
  },

  workflowMetaTagText: {
    fontSize: fontScale(9.6),
    fontFamily: fonts.bold,
  },

  workflowMetaContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    marginLeft: moderateScale(8),
  },

  workflowMetaActor: {
    fontSize: fontScale(11),
    lineHeight: fontScale(13),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
  },

  workflowMetaDate: {
    fontSize: fontScale(9.8),
    lineHeight: fontScale(12),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  workflowMetaSeparator: {
    marginHorizontal: moderateScale(6),
    fontSize: fontScale(10),
    lineHeight: fontScale(12),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  subprocessHighlight: {
    alignSelf: "flex-start",
    marginTop: verticalScale(7),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(999),
    backgroundColor: "#EEF5FF",
  },

  subprocessHighlightText: {
    fontSize: fontScale(12),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(999),
    borderWidth: 1,
  },

  statusPillText: {
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
  },

  cardBottomRow: {
    marginTop: verticalScale(12),
  },

  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: moderateScale(8),
  },

  cardActionText: {
    fontSize: fontScale(12),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  cardCommentBlock: {
    marginTop: verticalScale(8),
    marginLeft: moderateScale(9),
    paddingLeft: moderateScale(10),
    paddingRight: moderateScale(8),
    borderLeftWidth: 2,
    borderLeftColor: "#E07A5F",
  },

  cardCommentLabel: {
    fontSize: fontScale(10.2),
    color: "#C44728",
    fontFamily: fonts.bold,
    marginBottom: verticalScale(2),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  cardRemarkText: {
    fontSize: fontScale(11.5),
    color: "#9B3E28",
    fontFamily: fonts.medium,
    lineHeight: fontScale(16),
  },

  cardActionIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryBlue,
  },

  loadMoreWrap: {
    alignItems: "center",
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(14),
  },

  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(999),
    backgroundColor: colors.surfaceBluePale,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  loadMoreButtonText: {
    fontSize: fontScale(10.5),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  emptyState: {
    marginTop: verticalScale(44),
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
  },

  emptyIconShell: {
    width: moderateScale(58),
    height: moderateScale(58),
    borderRadius: moderateScale(29),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  emptyTitle: {
    marginTop: verticalScale(12),
    fontSize: fontScale(14.5),
    color: colors.textDark,
    fontFamily: fonts.bold,
    textAlign: "center",
  },

  emptyText: {
    marginTop: verticalScale(6),
    fontSize: fontScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textAlign: "center",
  },

  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(24),
  },

  stateText: {
    marginTop: verticalScale(12),
    fontSize: fontScale(11.5),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textAlign: "center",
  },

  retryButton: {
    minHeight: verticalScale(38),
    marginTop: verticalScale(14),
    paddingHorizontal: moderateScale(18),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryBlue,
  },

  retryButtonText: {
    fontSize: fontScale(11.5),
    color: colors.white,
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
    maxHeight: "84%",
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(22),
    borderTopRightRadius: moderateScale(22),
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
    fontSize: fontScale(11),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
    marginBottom: verticalScale(4),
  },

  sheetTitle: {
    fontSize: fontScale(17),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  sheetSubtitle: {
    marginTop: verticalScale(4),
    fontSize: fontScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    lineHeight: fontScale(16),
  },

  sheetStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },

  sheetStatusGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    flexShrink: 1,
  },

  sheetStatusCount: {
    fontSize: fontScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(999),
    backgroundColor: "#1a59a2",
    borderWidth: 1,
    borderColor: "#D5E7FB",
  },

  historyButtonText: {
    fontSize: fontScale(11),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  sheetScroll: {
    flexGrow: 0,
  },

  sheetScrollContent: {
    paddingBottom: verticalScale(20),
  },

  sheetStateCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(24),
  },

  sheetStateText: {
    marginTop: verticalScale(10),
    fontSize: fontScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textAlign: "center",
  },

  historySummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    backgroundColor: "#F8FBFE",
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
    marginBottom: verticalScale(12),
  },

  historySummaryBlock: {
    flex: 1,
  },

  historySummaryDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.cardBorder,
    marginHorizontal: moderateScale(12),
  },

  historySummaryLabel: {
    fontSize: fontScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: verticalScale(4),
  },

  historySummaryValue: {
    fontSize: fontScale(13),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  historyTimeline: {
    gap: moderateScale(10),
  },

  historyItem: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: moderateScale(10),
  },

  historyRail: {
    width: moderateScale(18),
    alignItems: "center",
  },

  historyDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: colors.primaryBlue,
    marginTop: verticalScale(6),
  },

  historyLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#D8E5F2",
    marginTop: verticalScale(4),
    borderRadius: moderateScale(999),
  },

  historyCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(11),
  },

  historyCardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: moderateScale(12),
  },

  historyActionText: {
    flex: 1,
    fontSize: fontScale(12),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  historyDateText: {
    fontSize: fontScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textAlign: "right",
  },

  historyActorText: {
    marginTop: verticalScale(5),
    fontSize: fontScale(10.5),
    color: colors.primaryBlue,
    fontFamily: fonts.semiBold,
  },

  historyRemarkText: {
    marginTop: verticalScale(8),
    fontSize: fontScale(11),
    color: colors.textDark,
    fontFamily: fonts.medium,
    lineHeight: fontScale(16),
  },

  checklistCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    padding: moderateScale(13),
    marginBottom: verticalScale(10),
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
  },

  checklistTitle: {
    fontSize: fontScale(12.5),
    color: colors.textDark,
    fontFamily: fonts.bold,
    lineHeight: fontScale(18),
  },

  optionalText: {
    marginTop: verticalScale(4),
    fontSize: fontScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  valueBlock: {
    marginTop: verticalScale(8),
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
    fontSize: fontScale(12),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    lineHeight: fontScale(18),
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
    fontSize: fontScale(11.5),
    fontFamily: fonts.semiBold,
    lineHeight: fontScale(16),
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
    fontSize: fontScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    lineHeight: fontScale(16),
  },

  arrayValue: {
    flex: 1,
    fontSize: fontScale(11.5),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    lineHeight: fontScale(16),
    textAlign: "right",
  },

  fileRow: {
    borderRadius: moderateScale(12),
    backgroundColor: "#F7FAFD",
    borderWidth: 1,
    borderColor: "#DDE7F1",
    paddingHorizontal: moderateScale(10),
    paddingBottom: verticalScale(10),
  },

  fileName: {
    fontSize: fontScale(11.5),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    lineHeight: fontScale(17),
  },

  inlinePreviewImage: {
    width: "100%",
    height: verticalScale(150),
    borderRadius: moderateScale(12),
    marginTop: verticalScale(10),
    backgroundColor: "#E8EEF5",
  },

  reviewDetailsSection: {
    marginTop: verticalScale(16),
  },

  sectionBlockTitle: {
    fontSize: fontScale(13),
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
    fontSize: fontScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: verticalScale(4),
  },

  detailMetaValue: {
    fontSize: fontScale(12),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    lineHeight: fontScale(18),
  },

  workflowSection: {
    marginTop: verticalScale(18),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(18),
    backgroundColor: "#F8FBFE",
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(14),
  },

  reviewActionSubtitle: {
    fontSize: fontScale(10.5),
    lineHeight: fontScale(15),
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
    fontSize: fontScale(12),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  reviewRemarkInputError: {
    borderColor: colors.danger,
  },

  reviewErrorText: {
    marginTop: verticalScale(6),
    fontSize: fontScale(10),
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
    minHeight: verticalScale(50),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: moderateScale(12),
    shadowColor: "#061423",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  reviewActionButtonDisabled: {
    opacity: 0.78,
  },

  reviewRejectButton: {
    backgroundColor: "#FFF7F4",
    borderColor: "#E07A5F",
  },

  reviewCancelButton: {
    backgroundColor: colors.white,
    borderColor: colors.cardBorder,
  },

  reviewVerifyButton: {
    backgroundColor: "#F3F8FF",
    borderColor: "#4E8FE6",
  },

  reviewApproveButton: {
    backgroundColor: colors.primaryBlue,
    borderColor: "#0D5AA7",
  },

  reviewRejectText: {
    fontSize: fontScale(12.5),
    color: "#C44728",
    fontFamily: fonts.bold,
  },

  reviewCancelText: {
    fontSize: fontScale(12),
    color: colors.textSecondary,
    fontFamily: fonts.bold,
  },

  reviewVerifyText: {
    fontSize: fontScale(12.5),
    color: "#135EAF",
    fontFamily: fonts.bold,
  },

  reviewApproveText: {
    fontSize: fontScale(12.5),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  workflowStateNotice: {
    minHeight: verticalScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: "#EBFFF4",
    borderWidth: 1,
    borderColor: "#BCEBD0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(8),
  },

  workflowStateNoticeText: {
    fontSize: fontScale(11.5),
    color: colors.completed,
    fontFamily: fonts.bold,
  },

  rejectModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(6, 20, 35, 0.55)",
    justifyContent: "center",
    paddingHorizontal: moderateScale(18),
  },

  rejectModalRoot: {
    flex: 1,
    justifyContent: "center",
  },

  rejectModalCard: {
    borderRadius: moderateScale(18),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(14),
  },

  confirmationModalCard: {
    borderRadius: moderateScale(18),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(16),
  },

  rejectModalTitle: {
    fontSize: fontScale(14),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  rejectModalSubtitle: {
    marginTop: verticalScale(6),
    fontSize: fontScale(10.5),
    lineHeight: fontScale(15),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: verticalScale(12),
  },

  rejectModalInput: {
    minHeight: verticalScale(110),
  },

  rejectModalActionRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    marginTop: verticalScale(12),
  },
});
