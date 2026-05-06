import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";
import {
  fontScale,
  moderateScale,
  scale,
  verticalScale,
} from "../../constants/metrics";

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6FBFF",
  },

  flex: {
    flex: 1,
  },

  header: {
    paddingTop: verticalScale(38),
    paddingHorizontal: moderateScale(18),
    paddingBottom: verticalScale(14),
    borderBottomLeftRadius: moderateScale(18),
    borderBottomRightRadius: moderateScale(18),
    overflow: "hidden",
  },

  headerTitleRow: {
    minHeight: moderateScale(48),
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  headerBackButton: {
    position: "absolute",
    left: -moderateScale(8),
    zIndex: 1,
  },

  headerTitle: {
    textAlign: "center",
    fontSize: fontScale(20),
    color: colors.navyFreshDark,
    fontFamily: fonts.bold,
  },

  body: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: moderateScale(18),
    paddingTop: verticalScale(18),
  },

  formCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(16),
    shadowColor: "#0C2E4D",
    shadowOffset: { width: 0, height: verticalScale(8) },
    shadowOpacity: 0.06,
    shadowRadius: scale(14),
    elevation: scale(2),
  },

  sectionTitle: {
    fontSize: fontScale(16),
    color: colors.navyFreshDark,
    fontFamily: fonts.bold,
  },

  sectionSubtitle: {
    marginTop: verticalScale(4),
    fontSize: fontScale(11.2),
    lineHeight: fontScale(16),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  fieldBlock: {
    marginTop: verticalScale(16),
  },

  fieldLabel: {
    marginBottom: verticalScale(7),
    fontSize: fontScale(11.5),
    color: colors.navyFreshDark,
    fontFamily: fonts.semiBold,
  },

  inputShell: {
    minHeight: verticalScale(56),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#DCE7F2",
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
  },

  inputShellFocused: {
    borderColor: colors.primaryBlue,
    backgroundColor: "#F9FCFF",
  },

  inputShellError: {
    borderColor: "#E58D85",
    backgroundColor: "#FFF9F8",
  },

  inputIconWrap: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F8FD",
  },

  inputIconWrapFocused: {
    backgroundColor: "#E9F2FF",
  },

  inputIconWrapError: {
    backgroundColor: "#FFF1EE",
  },

  textInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: moderateScale(10),
    paddingVertical: verticalScale(12),
    fontSize: fontScale(13.5),
    color: colors.textDark,
    fontFamily: fonts.semiBold,
  },

  helperText: {
    marginTop: verticalScale(6),
    paddingHorizontal: moderateScale(3),
    fontSize: fontScale(10.4),
    lineHeight: fontScale(14),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  errorText: {
    marginTop: verticalScale(6),
    paddingHorizontal: moderateScale(3),
    fontSize: fontScale(10.4),
    lineHeight: fontScale(14),
    color: colors.danger,
    fontFamily: fonts.semiBold,
  },

  submitButton: {
    minHeight: verticalScale(54),
    marginTop: verticalScale(18),
    borderRadius: moderateScale(16),
    backgroundColor: colors.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: moderateScale(8),
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.18,
    shadowRadius: scale(14),
    elevation: scale(3),
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    fontSize: fontScale(13.4),
    color: colors.white,
    fontFamily: fonts.bold,
  },
});
