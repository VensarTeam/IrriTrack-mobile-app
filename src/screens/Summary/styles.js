import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import { fontScale, moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    paddingRight: moderateScale(14),
    backgroundColor: colors.sheetSurface,
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
  },

  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    fontSize: fontScale(18),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  headerMeta: {
    marginTop: verticalScale(1),
    fontSize: fontScale(10),
    fontFamily: fonts.medium,
    color: colors.primaryBlue,
  },

  headerIcon: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceBlueSoft,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginLeft: moderateScale(10),
  },

  floatingFilterSection: {
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(6),
    backgroundColor: colors.background,
  },

  floatingFilterHeader: {
    paddingHorizontal: moderateScale(16),
    marginBottom: verticalScale(4),
  },

  floatingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(2),
  },

  floatingFilterTitle: {
    marginLeft: moderateScale(4),
    fontSize: fontScale(14),
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  floatingFilterValue: {
    fontSize: fontScale(15),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  subprocessList: {
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(8),
    gap: moderateScale(8),
  },

  subprocessChip: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(999),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E2E8F0", // subtle border
  },

  subprocessChipActive: {
    backgroundColor: colors.primaryBlue, // Dark elegant mode active
    borderColor: colors.primaryBlue,
  },

  subprocessChipText: {
    fontSize: fontScale(12),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  subprocessChipTextActive: {
    color: colors.white,
    fontFamily: fonts.bold,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: moderateScale(14),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(24),
  },

  totalStrip: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginBottom: verticalScale(10),
  },

  summaryStat: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  summaryStatWide: {
    flex: 1.25,
  },

  summaryStatLabel: {
    fontSize: fontScale(9),
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  summaryStatValue: {
    marginTop: verticalScale(3),
    fontSize: fontScale(15),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  phaseShell: {
    marginBottom: verticalScale(10),
    borderRadius: moderateScale(18),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },

  phaseShellExpanded: {
    borderColor: "#C7DDF8",
  },

  phaseHeader: {
    minHeight: verticalScale(56),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(10),
    marginBottom: verticalScale(10),
  },

  phaseHeaderExpanded: {
    backgroundColor: "#F8FBFE",
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },

  phaseLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  phaseIcon: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(9),
  },

  phaseName: {
    fontSize: fontScale(14),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  phaseRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: moderateScale(8),
  },

  phaseMetric: {
    width: moderateScale(82),
  },

  phaseMetricValue: {
    marginBottom: verticalScale(4),
    fontSize: fontScale(10.5),
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: "right",
  },

  phasePercent: {
    width: moderateScale(36),
    fontSize: fontScale(11),
    fontFamily: fonts.bold,
    textAlign: "right",
  },

  chevronContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F6FA",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  chevronContainerExpanded: {
    backgroundColor: colors.white,
    borderColor: "#C7DDF8",
  },

  phaseTableContainer: {
    marginHorizontal: moderateScale(10),
    marginBottom: verticalScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },

  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceBlueSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },

  tableDataRow: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },

  tableCellZone: {
    flex: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(6),
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
    backgroundColor: "#F8FBFE",
  },

  tableCell: {
    flex: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(4),
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
  },

  tableCellLast: {
    borderRightWidth: 0,
  },

  tableHeaderLabel: {
    fontSize: fontScale(9.8),
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  tableHeaderValue: {
    marginTop: verticalScale(3),
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: "center",
  },

  tableDataLabelZone: {
    fontSize: fontScale(12.5),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    textAlign: "center",
  },

  tableDataLabel: {
    fontSize: fontScale(12.5),
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: "center",
  },
});
