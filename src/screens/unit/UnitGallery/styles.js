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
    paddingHorizontal: moderateScale(14),
    paddingBottom: verticalScale(24),
  },

  heroCard: {
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(14),
  },

  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    overflow: "hidden",
  },

  heroUnit: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(24),
    fontFamily: fonts.bold,
    color: colors.white,
  },

  heroProject: {
    marginTop: verticalScale(4),
    color: "#EAF3FF",
    fontFamily: fonts.medium,
    fontSize: moderateScale(12),
  },

  heroLocation: {
    marginTop: verticalScale(6),
    color: "#C8E5FF",
    fontSize: moderateScale(11),
    fontFamily: fonts.regular,
  },

  summaryRow: {
    marginTop: verticalScale(12),
    flexDirection: "row",
    justifyContent: "space-between",
  },

  summaryCard: {
    width: "32%",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(14),
    alignItems: "center",
    paddingVertical: verticalScale(10),
  },

  summaryValue: {
    fontSize: moderateScale(18),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  summaryLabel: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  galleryHeadRow: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  galleryHeading: {
    fontSize: moderateScale(16),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  addPhotoButton: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(12),
  },

  addPhotoButtonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: moderateScale(11),
  },

  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(10),
  },

  photoCard: {
    width: "48%",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E2ECF6",
    borderRadius: moderateScale(16),
    padding: moderateScale(5),
    marginBottom: verticalScale(2),
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },

  photoThumbWrap: {
    position: "relative",
  },

  photoThumb: {
    width: "100%",
    aspectRatio: 0.86,
    borderRadius: moderateScale(12),
    backgroundColor: "#E6EEF5",
  },

  resubmitBadge: {
    position: "absolute",
    top: verticalScale(7),
    right: moderateScale(7),
    alignSelf: "flex-start",
    backgroundColor: "#D9480F",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(6),
    paddingVertical: verticalScale(3),
  },

  resubmitBadgeText: {
    color: colors.white,
    fontSize: moderateScale(9),
    fontFamily: fonts.bold,
    textAlign: "center",
  },

  photoInfo: {
    marginTop: verticalScale(6),
    marginBottom: verticalScale(2),
    minHeight: verticalScale(34),
    alignItems: "center",
    justifyContent: "center",
  },

  checklistName: {
    textAlign: "center",
    fontSize: moderateScale(11),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  photoDate: {
    marginTop: verticalScale(2),
    textAlign: "center",
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  emptyWrap: {
    marginTop: verticalScale(8),
  },

  emptyPreviewBox: {
    borderWidth: 1,
    borderColor: colors.inputOutline,
    borderStyle: "dashed",
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(36),
    paddingHorizontal: moderateScale(16),
    backgroundColor: colors.white,
  },

  emptyText: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(14),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  viewerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
  },

  viewerCounter: {
    color: colors.white,
    fontSize: moderateScale(14),
    fontFamily: fonts.bold,
    marginLeft: moderateScale(10),
  },

  viewerSlide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(14),
  },

  viewerImage: {
    width: "100%",
    height: "78%",
  },

  viewerCaption: {
    marginTop: verticalScale(10),
    color: "#CFD9E1",
    fontSize: moderateScale(12),
    fontFamily: fonts.medium,
  },
});
