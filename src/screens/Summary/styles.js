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
    fontSize: fontScale(16),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  headerMeta: {
    marginTop: verticalScale(1),
    fontSize: fontScale(10.5),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
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

  filterPanel: {
    marginHorizontal: moderateScale(14),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(18),
    backgroundColor: colors.filterPanelSurface,
    borderWidth: 1,
    borderColor: colors.filterPanelBorder,
  },

  filterHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  filterTitleBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: moderateScale(10),
  },

  filterTitle: {
    fontSize: fontScale(9.5),
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  filterValue: {
    marginTop: verticalScale(2),
    fontSize: fontScale(14),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  filterIcon: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  subprocessList: {
    paddingTop: verticalScale(10),
    paddingRight: moderateScale(4),
    gap: moderateScale(8),
  },

  subprocessChip: {
    maxWidth: moderateScale(160),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(999),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  subprocessChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },

  subprocessChipText: {
    fontSize: fontScale(10.5),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
  },

  subprocessChipTextActive: {
    color: colors.white,
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

  phaseHeader: {
    minHeight: verticalScale(58),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },

  phaseLeft: {
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
    flex: 1,
    minWidth: 0,
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

  zoneGrid: {
    paddingHorizontal: moderateScale(10),
    paddingBottom: verticalScale(10),
    gap: verticalScale(8),
  },

  zoneCard: {
    padding: moderateScale(10),
    borderRadius: moderateScale(16),
    backgroundColor: "#F8FBFE",
    borderWidth: 1,
    borderColor: "#E2ECF7",
  },

  zoneTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },

  zoneBadge: {
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(999),
  },

  zoneBadgeText: {
    fontSize: fontScale(11),
    fontFamily: fonts.bold,
  },

  zonePercent: {
    fontSize: fontScale(13),
    fontFamily: fonts.bold,
  },

  zoneDataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(7),
    marginTop: verticalScale(9),
  },

  cell: {
    flexGrow: 1,
    flexBasis: "22%",
    minWidth: moderateScale(66),
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5EEF8",
  },

  cellLabel: {
    fontSize: fontScale(8.5),
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  cellValue: {
    marginTop: verticalScale(2),
    fontSize: fontScale(11.5),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  progressTrack: {
    height: verticalScale(5),
    borderRadius: moderateScale(999),
    backgroundColor: "#EAF1F8",
    overflow: "hidden",
  },

  progressTrackLarge: {
    height: verticalScale(8),
  },

  progressFill: {
    height: "100%",
    borderRadius: moderateScale(999),
  },
});
