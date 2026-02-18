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
    fontSize: moderateScale(11),
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
    fontSize: moderateScale(10),
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

  statusCardTitle: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: colors.textDark,
  },

  statusCardDescription: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    lineHeight: moderateScale(16),
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: verticalScale(8),
  },

  subChip: {
    backgroundColor: colors.surfaceBluePale,
    paddingVertical: verticalScale(5),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(6),
    marginBottom: verticalScale(6),
  },

  subChipText: {
    fontSize: moderateScale(10),
    color: colors.primaryBlue,
    fontWeight: "600",
  },
});
