import { StyleSheet } from "react-native";
import colors from "../../../constants/colors";
import fonts from "../../../constants/fonts";
import { moderateScale, verticalScale } from "../../../constants/metrics";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
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

  helperHeaderButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(20),
    margin: 0,
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },

  detailCard: {
    width: "48.5%",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(10),
    marginBottom: verticalScale(8),
    elevation: 1,
  },

  detailLabel: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginBottom: verticalScale(4),
  },

  detailValue: {
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontFamily: fonts.bold,
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
    backgroundColor: colors.surfaceBlueSoft,
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(5),
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  viewAllText: {
    fontSize: moderateScale(11),
    fontFamily: fonts.medium,
    color: colors.primaryBlue,
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(4),
  },

  sectionToggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
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

  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGreen,
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(14),
    borderColor: colors.darkGreen,
    borderWidth: 1,
  },

  updateButtonText: {
    fontSize: moderateScale(11),
    fontFamily: fonts.medium,
    color: colors.darkGreen,
  },

  statusCardDescription: {
    fontSize: moderateScale(11),
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

  subStatusLabel: {
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.medium,
    flex: 1,
    paddingRight: moderateScale(10),
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

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "center",
    paddingHorizontal: moderateScale(20),
  },

  modalCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(18),
    padding: moderateScale(18),
  },

  modalTitle: {
    fontSize: moderateScale(14),
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginBottom: verticalScale(10),
  },

  modalItem: {
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  modalText: {
    fontSize: moderateScale(12),
    color: colors.textDark,
  },

  closeText: {
    textAlign: "center",
    marginTop: verticalScale(12),
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontFamily: fonts.medium,
  },
});
