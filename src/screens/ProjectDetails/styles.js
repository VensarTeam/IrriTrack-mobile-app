import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import {
  fontScale,
  moderateScale,
  verticalScale,
} from "../../constants/metrics";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  /* ================= HEADER ================= */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(10),
    backgroundColor: colors.sheetSurface,
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
  },

  headerTitle: {
    fontSize: fontScale(18),
    fontFamily: fonts.medium,
    color: colors.textDark,
  },

  logo: {
    width: moderateScale(120),
    height: moderateScale(20),
    alignSelf: "center",
  },

  /* ================= FILTER PANEL ================= */

  filterPanel: {
    marginHorizontal: moderateScale(15),
    marginTop: verticalScale(14),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(18),
    backgroundColor: "#F7FAFE",
    borderWidth: 1,
    borderColor: "#D9E4F2",
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
    borderColor: "#D9E4F2",
  },

  filterResetText: {
    fontSize: fontScale(10),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  filterGrid: {
    flexDirection: "row",
    marginTop: verticalScale(8),
    columnGap: moderateScale(10),
  },

  filterGridCompact: {
    flexDirection: "column",
    rowGap: verticalScale(10),
  },

  filterField: {
    flex: 1,
    minHeight: verticalScale(58),
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(8),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D9E4F2",
  },

  filterFieldActive: {
    borderColor: colors.primaryBlue,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
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
    backgroundColor: "#EEF3FA",
  },

  filterIconWrapActive: {
    backgroundColor: "#E0ECFB",
  },

  filterIconWrapDisabled: {
    backgroundColor: "#F1F3F5",
  },

  filterArrowWrap: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F8FC",
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

  /* ================= KPI CARDS ================= */

  kpiContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(15),
    marginVertical: verticalScale(20),
  },

  kpiCard: {
    flex: 1,
    marginHorizontal: moderateScale(6),
    paddingVertical: verticalScale(14),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(16),
    backgroundColor: colors.white,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
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
    marginBottom: verticalScale(15),
    borderRadius: moderateScale(18),
    padding: moderateScale(10),
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(12),
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
    marginTop: verticalScale(10),
  },

  highlightCard: {
    width: "48.5%",
    borderWidth: 1,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(7),
    marginBottom: verticalScale(7),
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
    marginTop: verticalScale(12),
    overflow: "hidden",
  },

  chartSlide: {
    paddingRight: 0,
  },

  chartSummaryCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginRight: moderateScale(8),
  },

  chartSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(14),
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

  summaryList: {
    flex: 1,
    marginLeft: moderateScale(12),
  },

  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    marginBottom: verticalScale(10),
    backgroundColor: colors.white,
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
    marginVertical: verticalScale(6),
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
    marginTop: verticalScale(10),
    marginBottom: verticalScale(15),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(6),
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(4),
  },

  stageTabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(4),
    marginBottom: verticalScale(6),
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
    paddingHorizontal: moderateScale(2),
    paddingBottom: verticalScale(1),
  },

  stageTab: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
    marginRight: moderateScale(8),
    borderWidth: 2,
    borderColor: colors.cardBorder,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  stageTabActive: {
    backgroundColor: colors.primaryBlue,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: "rgba(15, 23, 42, 0.4)",
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
    borderColor: "#E3EAF3",
    marginBottom: verticalScale(8),
  },

  modalItemActive: {
    backgroundColor: "#EAF3FF",
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
