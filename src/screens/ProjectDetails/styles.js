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
    backgroundColor: colors.white,
  },

  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  /* ================= HEADER ================= */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(8),
    backgroundColor: colors.sheetSurface,
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
  },

  headerTitle: {
    fontSize: fontScale(10),
    fontFamily: fonts.medium,
    color: colors.textDark,
  },

  logo: {
    width: moderateScale(120),
    height: moderateScale(20),
    alignSelf: "center",
  },

  headerSpacer: {
    width: moderateScale(40),
  },

  /* ================= FILTER PANEL ================= */

  filterPanel: {
    marginHorizontal: moderateScale(15),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(18),
    backgroundColor: colors.filterPanelSurface,
    borderWidth: 1,
    borderColor: colors.filterPanelBorder,
  },

  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  filterPanelTitleWrap: {
    flex: 1,
    paddingRight: moderateScale(10),
  },

  filterPanelTitle: {
    fontSize: fontScale(13),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  compactMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(2),
  },

  compactMetaLabel: {
    fontSize: fontScale(9),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginRight: moderateScale(6),
  },

  compactMetaValue: {
    flex: 1,
    fontSize: fontScale(11),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  filterResetButton: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.filterPanelBorder,
  },

  filterResetText: {
    fontSize: fontScale(10),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  filterGrid: {
    flexDirection: "row",
    marginTop: verticalScale(6),
    columnGap: moderateScale(10),
  },

  filterField: {
    flex: 1,
    minWidth: 0,
    minHeight: verticalScale(52),
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(7),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.filterPanelBorder,
  },

  filterFieldActive: {
    borderColor: colors.primaryBlue,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: verticalScale(6) },
    shadowOpacity: 0.1,
    shadowRadius: scale(12),
    elevation: scale(3),
  },

  filterFieldDisabled: {
    opacity: 0.72,
  },

  filterIconWrap: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.filterIconSurface,
  },

  filterIconWrapActive: {
    backgroundColor: colors.filterIconActiveSurface,
  },

  filterIconWrapDisabled: {
    backgroundColor: colors.filterIconDisabledSurface,
  },

  filterArrowWrap: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.filterArrowSurface,
    marginLeft: moderateScale(8),
  },

  filterFieldTextWrap: {
    flex: 1,
    marginLeft: moderateScale(9),
  },

  filterFieldTitle: {
    fontSize: fontScale(9),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: verticalScale(1),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  filterFieldValue: {
    fontSize: fontScale(12),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  filterFieldValueActive: {
    color: colors.primaryBlue,
  },

  shimmerBlock: {
    overflow: "hidden",
    borderRadius: moderateScale(12),
    backgroundColor: "#E7EEF6",
  },

  shimmerSweep: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -moderateScale(140),
    width: moderateScale(120),
  },

  shimmerGradient: {
    flex: 1,
  },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: moderateScale(15),
    marginTop: verticalScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(14),
    borderWidth: 1,
  },

  statusBannerLoading: {
    backgroundColor: colors.surfaceBluePale,
    borderColor: colors.filterPanelBorder,
  },

  statusBannerError: {
    backgroundColor: "#FFF6F4",
    borderColor: "#F1D1C8",
  },

  statusBannerText: {
    flex: 1,
    marginLeft: moderateScale(10),
    fontSize: fontScale(11),
    fontFamily: fonts.medium,
    color: colors.textDark,
  },

  inlineLoadingShell: {
    marginHorizontal: moderateScale(15),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(-2),
  },

  inlineLoadingBar: {
    width: "100%",
    height: verticalScale(10),
    borderRadius: moderateScale(999),
  },

  skeletonMetaLabel: {
    width: moderateScale(52),
    height: verticalScale(10),
    marginBottom: verticalScale(6),
    borderRadius: moderateScale(999),
  },

  skeletonMetaValue: {
    width: "76%",
    height: verticalScale(12),
    borderRadius: moderateScale(999),
  },

  skeletonResetButton: {
    width: moderateScale(62),
    height: verticalScale(28),
    borderRadius: moderateScale(12),
  },

  skeletonFilterField: {
    flex: 1,
    minHeight: verticalScale(52),
    borderRadius: moderateScale(16),
  },

  /* ================= KPI CARDS ================= */

  kpiContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(15),
    marginVertical: verticalScale(12),
  },

  kpiCard: {
    flex: 1,
    marginHorizontal: moderateScale(6),
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(16),
    backgroundColor: colors.white,
    elevation: scale(2),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },

  skeletonKpiCard: {
    flex: 1,
    marginHorizontal: moderateScale(6),
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(16),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },

  skeletonKpiAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(4),
    borderRadius: 0,
  },

  skeletonKpiLabel: {
    width: moderateScale(44),
    height: verticalScale(14),
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(999),
  },

  skeletonKpiValue: {
    width: moderateScale(64),
    height: verticalScale(24),
    borderRadius: moderateScale(999),
  },

  kpiAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(4),
  },

  kpiContent: {
    justifyContent: "center",
  },

  kpiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(6),
  },

  kpiArrowWrap: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },

  kpiKey: {
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },

  kpiTitle: {
    fontSize: fontScale(11),
    color: colors.textSecondary,
    marginTop: verticalScale(4),
  },

  kpiValue: {
    fontSize: fontScale(22),
    fontFamily: fonts.bold,
    letterSpacing: moderateScale(0.5),
  },

  /* ================= EXPAND SECTION ================= */

  sectionCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(15),
    marginBottom: verticalScale(10),
    borderRadius: moderateScale(18),
    padding: moderateScale(8),
    elevation: scale(2),
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  skeletonSectionCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(15),
    marginBottom: verticalScale(10),
    borderRadius: moderateScale(18),
    padding: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  skeletonSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(9),
    backgroundColor: colors.white,
  },

  skeletonSectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  skeletonSectionAccent: {
    width: moderateScale(4),
    height: verticalScale(40),
    borderRadius: moderateScale(999),
    marginRight: moderateScale(10),
  },

  skeletonSectionTextWrap: {
    flex: 1,
  },

  skeletonSectionTitle: {
    width: "42%",
    height: verticalScale(16),
    borderRadius: moderateScale(999),
    marginBottom: verticalScale(6),
  },

  skeletonSectionSubtitle: {
    width: "26%",
    height: verticalScale(10),
    borderRadius: moderateScale(999),
  },

  skeletonSectionIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    marginLeft: moderateScale(10),
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(9),
  },

  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  sectionAccent: {
    width: moderateScale(4),
    alignSelf: "stretch",
    borderRadius: moderateScale(999),
    marginRight: moderateScale(10),
  },

  sectionTitle: {
    fontSize: fontScale(16),
    fontFamily: fonts.medium,
    color: colors.textDark,
  },

  sectionSubtitle: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    marginTop: verticalScale(2),
  },

  sectionIconWrap: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
  },

  highlightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: verticalScale(8),
  },

  highlightCard: {
    width: "48.5%",
    borderWidth: 1,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(6),
    marginBottom: verticalScale(6),
  },

  skeletonHighlightCard: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(6),
    backgroundColor: colors.white,
  },

  skeletonHighlightLabel: {
    width: "62%",
    height: verticalScale(10),
    borderRadius: moderateScale(999),
    marginBottom: verticalScale(8),
  },

  skeletonHighlightValue: {
    width: "40%",
    height: verticalScale(16),
    borderRadius: moderateScale(999),
  },

  highlightLabel: {
    fontSize: fontScale(9),
    color: colors.textSecondary,
    marginBottom: verticalScale(4),
    fontFamily: fonts.medium,
  },

  highlightValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  highlightDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    marginRight: moderateScale(6),
  },

  highlightValue: {
    fontSize: fontScale(14),
    fontFamily: fonts.bold,
  },

  /* ================= CHART ================= */

  chartCard: {
    marginTop: verticalScale(8),
    overflow: "hidden",
  },

  chartSlide: {
    paddingRight: 0,
  },

  chartSummaryCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: moderateScale(18),
    padding: moderateScale(12),
  },

  chartSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },

  chartSummaryTitle: {
    flex: 1,
    fontSize: fontScale(14),
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginRight: moderateScale(10),
  },

  chartSummaryPercent: {
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
  },

  chartSummaryBody: {
    flexDirection: "row",
    alignItems: "center",
  },

  chartSummaryBodyCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  summaryList: {
    flex: 1,
    marginLeft: moderateScale(12),
  },

  summaryListCompact: {
    width: "100%",
    marginLeft: 0,
    marginTop: verticalScale(10),
  },

  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(8),
    backgroundColor: colors.white,
  },

  summaryItemCompact: {
    marginBottom: verticalScale(6),
    paddingVertical: verticalScale(7),
  },

  summaryDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(10),
  },

  summaryTextWrap: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: fontScale(10),
    color: colors.textSecondary,
    marginBottom: verticalScale(2),
    fontFamily: fonts.medium,
  },

  summaryValue: {
    fontSize: fontScale(17),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  /* ================= PIE ================= */

  pieWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: verticalScale(4),
  },

  pieCenter: {
    position: "absolute",
    alignItems: "center",
  },

  piePercent: {
    fontSize: fontScale(18),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  pieLabel: {
    fontSize: fontScale(11),
    color: colors.textSecondary,
  },

  /* ================= PIE STAGE TABS ================= */

  stageTabShell: {
    marginTop: verticalScale(6),
    marginBottom: verticalScale(8),
    backgroundColor: colors.transparent,
    borderWidth: 0,
  },

  stageTabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(1),
    marginBottom: verticalScale(5),
  },

  stageTabHeading: {
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
  },

  stageTabCaption: {
    fontSize: fontScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  stageTabContainer: {
    flexGrow: 0,
  },

  stageTabContent: {
    paddingBottom: verticalScale(2),
  },

  stageTab: {
    paddingVertical: verticalScale(7),
    paddingHorizontal: moderateScale(11),
    borderRadius: moderateScale(8),
    backgroundColor: colors.white,
    marginRight: moderateScale(7),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  stageTabActive: {
    backgroundColor: colors.primaryBlue,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.14,
    shadowRadius: scale(8),
    elevation: scale(2),
  },

  stageTabText: {
    fontSize: fontScale(11),
    fontFamily: fonts.medium,
    color: colors.textDark,
    lineHeight: moderateScale(14),
  },

  stageTabTextActive: {
    color: colors.white,
    fontFamily: fonts.bold,
  },

  /* ================= MODAL ================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.projectModalOverlay,
    justifyContent: "center",
    paddingHorizontal: moderateScale(18),
  },

  modalCard: {
    maxHeight: "70%",
    backgroundColor: colors.white,
    borderRadius: moderateScale(22),
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(18),
    paddingBottom: verticalScale(14),
  },

  modalTitle: {
    fontSize: fontScale(17),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  modalSubtitle: {
    marginTop: verticalScale(5),
    marginBottom: verticalScale(14),
    fontSize: fontScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  modalItem: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.projectModalItemBorder,
    marginBottom: verticalScale(8),
  },

  modalItemActive: {
    backgroundColor: colors.surfaceBlue,
    borderColor: colors.primaryBlue,
  },

  modalItemText: {
    fontSize: fontScale(14),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  modalItemTextActive: {
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  modalCloseButton: {
    alignSelf: "center",
    marginTop: verticalScale(10),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(10),
  },

  modalCloseText: {
    fontSize: fontScale(13),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },
});
