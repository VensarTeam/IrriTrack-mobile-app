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
    paddingVertical: verticalScale(8),
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
    paddingBottom: verticalScale(26),
  },

  projectCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(14),
    elevation: 1,
    marginBottom: verticalScale(12),
  },

  overviewSummaryRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginBottom: verticalScale(12),
  },

  overviewSummaryCard: {
    flex: 1,
    backgroundColor: colors.surfaceBluePale,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(9),
    alignItems: "center",
    justifyContent: "center",
  },

  overviewSummaryValue: {
    fontSize: moderateScale(15),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  overviewSummaryLabel: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  projectLabel: {
    color: colors.textSecondary,
    fontSize: moderateScale(11),
    marginBottom: verticalScale(4),
  },

  projectName: {
    color: colors.textDark,
    fontSize: moderateScale(14),
    fontFamily: fonts.bold,
  },

  projectMeta: {
    marginTop: verticalScale(3),
    fontSize: moderateScale(11),
    color: colors.primaryBlue,
    fontFamily: fonts.medium,
  },

  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(12),
    marginBottom: verticalScale(10),
    elevation: 1,
  },

  sectionTitle: {
    fontSize: moderateScale(14),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(8),
  },

  sectionCountBadge: {
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(999),
    backgroundColor: colors.surfaceBlueSoft,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  sectionCountText: {
    fontSize: moderateScale(9.5),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  sectionSubtitle: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
  },

  subStatusList: {
    marginTop: verticalScale(10),
  },

  subStatusItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  subStatusCopy: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: moderateScale(8),
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
    fontFamily: fonts.bold,
  },

  actionsCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    marginTop: verticalScale(4),
  },

  actionsTitle: {
    fontSize: moderateScale(14),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  actionsSubtitle: {
    marginTop: verticalScale(3),
    marginBottom: verticalScale(10),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    lineHeight: moderateScale(16),
  },

  reportButton: {
    backgroundColor: colors.surfaceBlueSoft,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(11),
  },

  reportButtonText: {
    color: colors.primaryBlue,
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
  },

  certificateButton: {
    marginTop: verticalScale(10),
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(11),
  },

  certificateButtonText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
  },
});
