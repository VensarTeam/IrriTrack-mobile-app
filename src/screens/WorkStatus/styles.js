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
    minHeight: verticalScale(52),
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: fontScale(17),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  headerActionSlot: {
    width: moderateScale(44),
    alignItems: "center",
    justifyContent: "center",
  },

  headerInfoButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(20),
    margin: 0,
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
    paddingHorizontal: moderateScale(12),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(24),
  },

  card: {
    position: "relative",
    overflow: "hidden",
    marginBottom: verticalScale(10),
    borderRadius: moderateScale(16),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: "0 2px 8px rgba(18, 59, 99, 0.07)",
  },

  cardTopRow: {
    gap: verticalScale(10),
    paddingHorizontal: moderateScale(14),
    paddingTop: verticalScale(13),
    paddingBottom: verticalScale(11),
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },

  cardIdentityRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },

  cardIdentityIcon: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceBlue,
    flexShrink: 0,
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

  cardPrimaryTitle: {
    fontSize: fontScale(14),
    lineHeight: fontScale(18),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  cardProcessText: {
    marginTop: verticalScale(3),
    fontSize: fontScale(10.5),
    lineHeight: fontScale(14),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  cardEyebrow: {
    marginBottom: verticalScale(4),
    fontSize: fontScale(10.5),
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    backgroundColor: "#F4F7FA",
    alignSelf: "flex-start",
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(999),
  },

  cardTitle: {
    fontSize: fontScale(14),
    color: colors.textDark,
    fontFamily: fonts.bold,
    marginLeft: moderateScale(9),
  },

  omsHighlight: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: verticalScale(3),
    paddingHorizontal: moderateScale(11),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: "#EAF3FF",
    borderWidth: 1,
    borderColor: "#D5E7FB",
  },

  omsHighlightText: {
    flexShrink: 1,
    fontSize: fontScale(13.5),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  cardMetaGroup: {
    width: "100%",
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: "#E8EFF6",
    gap: verticalScale(7),
  },

  workflowMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: verticalScale(28),
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

  modifyRequestButton: {
    marginTop: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(9),
    paddingHorizontal: moderateScale(11),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(14),
    backgroundColor: "#FBFAFF",
    borderWidth: 1,
    borderColor: "#DCCBFF",
  },

  modifyRequestIconWrap: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1EAFF",
  },

  modifyRequestCopy: {
    flex: 1,
    minWidth: 0,
  },

  modifyRequestTitle: {
    fontSize: fontScale(12.4),
    color: "#4C1D95",
    fontFamily: fonts.bold,
  },

  modifyRequestSubtitle: {
    marginTop: verticalScale(2),
    fontSize: fontScale(10.4),
    lineHeight: fontScale(13),
    color: "#6D5A93",
    fontFamily: fonts.medium,
  },

  cardActionIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryBlue,
  },

  cardOpenRow: {
    minHeight: verticalScale(42),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: moderateScale(3),
    paddingHorizontal: moderateScale(14),
    borderTopWidth: 1,
    borderTopColor: "#E8EFF6",
    backgroundColor: "#FAFCFE",
  },

  cardOpenText: {
    fontSize: fontScale(11),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  modifyConfirmButton: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },

  modifyConfirmText: {
    color: colors.white,
    fontSize: fontScale(13),
    fontFamily: fonts.bold,
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
    maxHeight: "92%",
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
    marginBottom: verticalScale(10),
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

  sheetOmsBadge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginBottom: verticalScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: "#EAF3FF",
    borderWidth: 1,
    borderColor: "#D5E7FB",
  },

  sheetOmsBadgeText: {
    flexShrink: 1,
    fontSize: fontScale(12.5),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  sheetTitle: {
    fontSize: fontScale(18),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  sheetSubtitle: {
    marginTop: verticalScale(2),
    fontSize: fontScale(10.5),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    lineHeight: fontScale(16),
  },

  sheetStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: verticalScale(11),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: "#DCE8F4",
  },

  sheetSummaryCard: {
    marginBottom: verticalScale(12),
    paddingHorizontal: moderateScale(13),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(16),
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "#D5E7FB",
    backgroundColor: "#F5F9FE",
  },

  sheetSummaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },

  sheetSummaryIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D5E7FB",
  },

  sheetSummaryCopy: {
    flex: 1,
    minWidth: 0,
  },

  sheetSummaryTitle: {
    fontSize: fontScale(14),
    lineHeight: fontScale(19),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  sheetSummaryDetails: {
    marginTop: verticalScale(3),
    fontSize: fontScale(10.5),
    lineHeight: fontScale(15),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
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
    gap: verticalScale(12),
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

  pipeLayingSection: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    borderCurve: "continuous",
    backgroundColor: colors.white,
  },

  commonPipeLayingSection: {
    backgroundColor: "#F3F8FF",
    borderColor: "#CFE2F7",
    paddingHorizontal: moderateScale(10),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(10),
  },

  pipeLayingSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(11),
    borderBottomWidth: 1,
    borderBottomColor: "#E3ECF5",
    backgroundColor: "#F8FBFE",
  },

  pipeLayingTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(9),
  },

  pipeLayingTitleCopy: {
    flex: 1,
    minWidth: 0,
  },

  pipeLayingTitle: {
    fontSize: fontScale(13.2),
    color: colors.textDark,
    fontFamily: fonts.bold,
    lineHeight: fontScale(18),
  },

  pipeLayingCountBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(999),
    backgroundColor: colors.surfaceBlue,
  },

  pipeLayingCountText: {
    fontSize: fontScale(9.5),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  pipeLayingToggleRow: {
    flexDirection: "row",
    gap: moderateScale(4),
    marginBottom: verticalScale(10),
    padding: moderateScale(3),
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D7E7F8",
  },

  pipeLayingToggleButton: {
    flex: 1,
    minHeight: verticalScale(34),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(9),
  },

  pipeLayingToggleButtonActive: {
    backgroundColor: colors.primaryBlue,
  },

  pipeLayingToggleText: {
    fontSize: fontScale(10.2),
    color: colors.textSecondary,
    fontFamily: fonts.bold,
  },

  pipeLayingToggleTextActive: {
    color: colors.white,
  },

  checklistCard: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E3ECF5",
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(11),
  },

  pipeChecklistCard: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
  },

  pipeShimmerGroup: {
    gap: verticalScale(8),
  },

  pipeShimmerCard: {
    minHeight: verticalScale(48),
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#DDEAF7",
    paddingHorizontal: moderateScale(11),
    paddingVertical: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(12),
  },

  pipeShimmerText: {
    flex: 1,
    height: verticalScale(12),
    borderRadius: moderateScale(999),
    backgroundColor: "#DCEAF8",
  },

  pipeShimmerIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "#DCEAF8",
  },

  checklistCardLast: {
    borderBottomWidth: 0,
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

  checklistDescription: {
    marginTop: verticalScale(3),
    fontSize: fontScale(10),
    lineHeight: fontScale(14),
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  checklistCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },

  checklistCountTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: fontScale(12.5),
    color: colors.textDark,
    fontFamily: fonts.bold,
    lineHeight: fontScale(18),
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
    fontSize: fontScale(13),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  pipelaidWrap: {
    marginTop: verticalScale(9),
    padding: moderateScale(9),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#DDEAF7",
    backgroundColor: "#F8FBFF",
  },

  pipelaidTitle: {
    fontSize: fontScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    textTransform: "uppercase",
    marginBottom: verticalScale(7),
  },

  pipelaidGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
  },

  pipelaidPill: {
    minWidth: moderateScale(50),
    minHeight: verticalScale(30),
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "#D8E5F3",
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(8),
  },

  pipelaidPillSelected: {
    borderColor: "#BFE7CF",
    backgroundColor: "#F3FCF7",
  },

  pipelaidText: {
    fontSize: fontScale(10.5),
    color: colors.textSecondary,
    fontFamily: fonts.bold,
  },

  pipelaidTextSelected: {
    color: colors.completed,
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
    fontSize: fontScale(8.5),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textTransform: "uppercase",
  },

  outletArrayValue: {
    marginTop: verticalScale(2),
    fontSize: fontScale(10.5),
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
    fontSize: fontScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    textAlign: "center",
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

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },

  sectionTitleText: {
    fontSize: fontScale(13),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  sectionCountText: {
    minWidth: moderateScale(24),
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(999),
    backgroundColor: colors.surfaceBluePale,
    fontSize: fontScale(10),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
    textAlign: "center",
  },

  imageGalleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(10),
  },

  galleryImageCard: {
    width: "47%",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
    padding: moderateScale(8),
  },

  galleryImage: {
    width: "100%",
    height: verticalScale(110),
    borderRadius: moderateScale(10),
    backgroundColor: "#E8EEF5",
  },

  galleryImageTitle: {
    marginTop: verticalScale(8),
    fontSize: fontScale(10.5),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
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

  reviewModifyButton: {
    backgroundColor: "#F6F0FF",
    borderColor: "#A78BFA",
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

  reviewModifyText: {
    fontSize: fontScale(12.5),
    color: "#5B21B6",
    fontFamily: fonts.bold,
  },

  needModificationButton: {
    width: "100%",
    minHeight: verticalScale(52),
    marginTop: verticalScale(8),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F0FF",
    borderWidth: 1,
    borderColor: "#A78BFA",
    paddingHorizontal: moderateScale(14),
    shadowColor: "#061423",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  needModificationText: {
    fontSize: fontScale(13),
    color: "#5B21B6",
    fontFamily: fonts.bold,
  },

  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionButtonIcon: {
    marginRight: moderateScale(8),
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

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "center",
  },

  modalCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(24),
    borderRadius: moderateScale(22),
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(16),
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "#DCE7F3",
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  modalHandle: {
    alignSelf: "center",
    width: moderateScale(36),
    height: verticalScale(4),
    borderRadius: moderateScale(4),
    backgroundColor: "#D7E5F2",
    marginBottom: verticalScale(14),
  },

  infoModalCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(24),
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: "#DCE7F3",
  },

  modalTitle: {
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
    marginBottom: verticalScale(4),
    color: colors.textDark,
  },

  modalSubtitle: {
    fontSize: moderateScale(11),
    lineHeight: moderateScale(16),
    color: colors.textSecondary,
    marginBottom: verticalScale(12),
  },

  infoModalSubtitle: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(18),
    color: colors.textSecondary,
    marginTop: verticalScale(-4),
    marginBottom: verticalScale(12),
  },

  legendList: {
    marginTop: verticalScale(2),
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#EEF3F8",
  },

  legendSwatch: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    marginTop: verticalScale(4),
    marginRight: moderateScale(10),
  },

  legendTextWrap: {
    flex: 1,
  },

  legendTitle: {
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  legendSubtitle: {
    fontSize: moderateScale(11),
    lineHeight: moderateScale(16),
    color: colors.textSecondary,
    marginTop: verticalScale(2),
  },

  infoModalCloseButton: {
    alignSelf: "center",
    marginTop: verticalScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(14),
    backgroundColor: "#EFF5FB",
  },

  infoModalCloseText: {
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
  },

  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(7),
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#E7EFF8",
  },

  modalItemActive: {
    backgroundColor: "#EDF6FF",
    borderColor: colors.primaryBlue,
  },

  modalText: {
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  modalTextActive: {
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  modalCheck: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    borderWidth: 1,
    borderColor: "#D6E3F0",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: moderateScale(12),
  },

  modalCheckActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: colors.primaryBlue,
  },

  closeButton: {
    alignSelf: "center",
    marginTop: verticalScale(8),
    paddingHorizontal: moderateScale(18),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(14),
    backgroundColor: "#EEF5FB",
  },

  closeText: {
    textAlign: "center",
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
    fontSize: moderateScale(12),
  },
});
