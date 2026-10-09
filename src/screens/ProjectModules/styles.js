import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import { fontScale, moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    minHeight: verticalScale(58),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.white,
  },

  iosHeader: {
    minHeight: verticalScale(56),
    paddingHorizontal: moderateScale(16),
  },

  iosBackButton: {
    margin: 0,
  },

  iosHeaderTitle: {
    fontSize: fontScale(18),
  },

  headerTitle: {
    flex: 1,
    fontSize: fontScale(16),
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: "center",
  },

  headerSpacer: {
    width: moderateScale(48),
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(28),
    gap: verticalScale(12),
  },

  projectCard: {
    position: "relative",
    overflow: "hidden",
    minHeight: verticalScale(88),
    borderRadius: moderateScale(17),
    borderCurve: "continuous",
    boxShadow: "0 7px 20px rgba(18,59,99,0.2)",
  },
  
  projectCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  projectCardContent: {
    minHeight: verticalScale(88),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(11),
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  projectGlow: {
    position: "absolute",
    right: moderateScale(-38),
    top: verticalScale(-52),
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(75),
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  projectIcon: {
    width: moderateScale(42),
    height: moderateScale(42),
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(13),
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  projectCopy: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },

  projectEyebrow: {
    fontSize: fontScale(8.5),
    fontFamily: fonts.bold,
    color: "#BFD9ED",
    letterSpacing: 0.9,
  },

  projectName: {
    marginTop: verticalScale(2),
    fontSize: fontScale(14),
    lineHeight: fontScale(19),
    fontFamily: fonts.bold,
    color: colors.white,
  },

  projectMetaRow: {
    marginTop: verticalScale(4),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(3),
  },

  projectMeta: {
    flex: 1,
    fontSize: fontScale(9.5),
    fontFamily: fonts.medium,
    color: "#D6E7F3",
  },

  sectionHeading: {
    paddingHorizontal: moderateScale(2),
  },

  sectionEyebrow: {
    fontSize: fontScale(9),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
    letterSpacing: 0.9,
  },

  sectionTitle: {
    marginTop: verticalScale(2),
    fontSize: fontScale(18),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  sectionSubtitle: {
    marginTop: verticalScale(3),
    fontSize: fontScale(11),
    lineHeight: fontScale(15),
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  moduleList: {
    gap: verticalScale(9),
  },

  moduleCardShell: {
    width: "100%",
    overflow: "hidden",
    borderRadius: moderateScale(17),
    borderCurve: "continuous",
    borderWidth: 1,
    backgroundColor: colors.white,
    boxShadow: "0 3px 12px rgba(18,59,99,0.08)",
  },

  moduleCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },

  moduleCard: {
    position: "relative",
    minWidth: 0,
    minHeight: verticalScale(92),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(11),
    paddingLeft: moderateScale(15),
    paddingRight: moderateScale(12),
    paddingVertical: verticalScale(11),
  },

  moduleCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  moduleAccent: {
    position: "absolute",
    left: 0,
    top: verticalScale(18),
    bottom: verticalScale(18),
    width: moderateScale(4),
    borderTopRightRadius: moderateScale(999),
    borderBottomRightRadius: moderateScale(999),
  },

  moduleIcon: {
    width: moderateScale(46),
    height: moderateScale(46),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(14),
    borderCurve: "continuous",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    boxShadow: "0 2px 8px rgba(18,59,99,0.07)",
  },

  moduleCopy: {
    flex: 1,
    minWidth: 0,
  },

  moduleTitle: {
    fontSize: fontScale(15),
    lineHeight: fontScale(19),
    fontFamily: fonts.bold,
  },

  moduleDescription: {
    marginTop: verticalScale(2),
    fontSize: fontScale(10.5),
    lineHeight: fontScale(15),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  moduleArrow: {
    width: moderateScale(32),
    height: moderateScale(32),
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(11),
    borderCurve: "continuous",
    boxShadow: "0 3px 9px rgba(18,59,99,0.16)",
  },
});
