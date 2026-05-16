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
    color: "#31556F",
  },

  headerMeta: {
    marginTop: verticalScale(1),
    fontSize: fontScale(10),
    fontFamily: fonts.medium,
    color: colors.primaryBlue,
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
    borderColor: "#E2E8F0",
  },

  subprocessChipActive: {
    backgroundColor: colors.primaryBlue,
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

  phaseShell: {
    marginBottom: verticalScale(10),
    borderRadius: moderateScale(18),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
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

  phasePill: {
    borderWidth: 1.5,
    borderRadius: moderateScale(22),
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(8),
  },

  phasePillText: {
    fontSize: fontScale(15),
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },

  phaseRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: moderateScale(8),
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

  tableTotalRow: {
    flexDirection: "row",
    backgroundColor: "#DFF0FF",
    borderBottomWidth: 1,
    borderBottomColor: "#9BC7E8",
  },

  tableDataRow: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },

  tableCellZone: {
    width: "20%",
    minWidth: 0,
    minHeight: verticalScale(42),
    paddingVertical: verticalScale(5),
    paddingHorizontal: moderateScale(5),
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
    backgroundColor: "#F8FBFE",
  },

  tableCell: {
    width: "20%",
    minWidth: 0,
    minHeight: verticalScale(42),
    paddingVertical: verticalScale(5),
    paddingHorizontal: moderateScale(5),
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
  },

  tableCellLast: {
    borderRightWidth: 0,
  },

  tableHeaderCell: {
    minHeight: verticalScale(38),
    paddingVertical: verticalScale(5),
    paddingHorizontal: moderateScale(3),
  },

  tableHeaderCellZone: {
    backgroundColor: "#EAF4FF",
  },

  tableTotalCell: {
    minHeight: verticalScale(36),
    paddingVertical: verticalScale(7),
    paddingHorizontal: moderateScale(3),
    backgroundColor: "#DFF0FF",
    borderRightColor: "#9BC7E8",
  },

  tableHeaderLabel: {
    width: "100%",
    fontSize: fontScale(11),
    lineHeight: fontScale(12.8),
    fontFamily: fonts.bold,
    color: colors.textDark,
    textTransform: "uppercase",
    letterSpacing: 0,
    textAlign: "center",
  },

  tableHeaderLabelZone: {
    width: "100%",
    fontSize: fontScale(11),
    lineHeight: fontScale(12.8),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    textTransform: "uppercase",
    letterSpacing: 0,
    textAlign: "center",
  },

  tableHeaderValue: {
    width: "100%",
    fontSize: fontScale(14),
    fontFamily: fonts.bold,
    color: "#0B4A7A",
    textAlign: "center",
  },

  tableDataLabelZone: {
    minWidth: moderateScale(56),
    paddingHorizontal: moderateScale(7),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(8),
    overflow: "hidden",
    backgroundColor: "#EAF4FF",
    borderWidth: 1,
    borderColor: "#B8D7F2",
    fontSize: fontScale(12),
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

  tableState: {
    minHeight: verticalScale(76),
    alignItems: "center",
    justifyContent: "center",
    gap: verticalScale(8),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(14),
    backgroundColor: colors.white,
  },

  tableStateText: {
    fontSize: fontScale(12),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: "center",
  },

  tableErrorText: {
    fontSize: fontScale(12),
    fontFamily: fonts.medium,
    color: colors.danger,
    textAlign: "center",
  },

  tableRetryButton: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(999),
    backgroundColor: colors.surfaceBlueSoft,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  tableRetryText: {
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
  },

  loadMoreButton: {
    minHeight: verticalScale(42),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FBFE",
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },

  loadMoreText: {
    fontSize: fontScale(12),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
  },
});
