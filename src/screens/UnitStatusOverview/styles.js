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
    marginBottom: verticalScale(12),
  },

  projectLabel: {
    color: colors.textSecondary,
    fontSize: moderateScale(11),
    marginBottom: verticalScale(4),
  },

  projectName: {
    color: colors.textDark,
    fontSize: moderateScale(14),
    fontWeight: "700",
  },

  projectMeta: {
    marginTop: verticalScale(3),
    fontSize: moderateScale(11),
    color: colors.primaryBlue,
    fontWeight: "600",
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
    fontWeight: "700",
    color: colors.textDark,
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

  subStatusLabel: {
    flex: 1,
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontWeight: "600",
    paddingRight: moderateScale(8),
  },

  statusPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },

  statusPillText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },

  actionsCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    marginTop: verticalScale(4),
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
    fontWeight: "700",
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
    fontWeight: "700",
  },
});
