import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import { moderateScale, verticalScale } from "../../constants/metrics";

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
    paddingVertical: verticalScale(8),
  },

  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
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
  },

  projectLabel: {
    color: colors.textSecondary,
    fontSize: moderateScale(12),
    marginBottom: verticalScale(4),
  },

  projectName: {
    color: colors.textDark,
    fontSize: moderateScale(14),
    fontWeight: "700",
  },

  sectionHeadingRow: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionHeading: {
    color: colors.textDark,
    fontSize: moderateScale(17),
    fontWeight: "700",
  },

  helperButton: {
    backgroundColor: colors.surfaceBlueSoft,
    borderRadius: moderateScale(14),
    width: moderateScale(40),
    height: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },

  detailCard: {
    width: "48.5%",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(12),
    marginBottom: verticalScale(10),
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
    fontWeight: "700",
  },

  statusListHeader: {
    marginTop: verticalScale(2),
    marginBottom: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusListTitle: {
    fontSize: moderateScale(16),
    color: colors.textDark,
    fontWeight: "700",
  },

  statusListSubtitle: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
  },

  viewAllButton: {
    backgroundColor: colors.surfaceBlueSoft,
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  viewAllText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: colors.primaryBlue,
  },

  statusCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(12),
    marginBottom: verticalScale(10),
    elevation: 1,
  },

  statusCardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(6),
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
    fontWeight: "700",
    color: colors.textDark,
  },

  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGreen,
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(14),
    borderColor: colors.primaryGreen,
    borderWidth: 1,
  },

  updateButtonText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: colors.primaryGreen,
  },

  statusCardDescription: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    lineHeight: moderateScale(16),
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

  subStatusItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },

  subStatusLabel: {
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontWeight: "600",
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
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
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
    fontWeight: "700",
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
    fontWeight: "600",
  },
});
