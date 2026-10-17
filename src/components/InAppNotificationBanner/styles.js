import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";



export default StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    width: "100%",
  },
  bannerContent: {
    width: "100%",
    maxWidth: 480,
    borderWidth: 1,
    borderColor: colors.border,
    borderCurve: "continuous",
    backgroundColor: colors.white,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: colors.loginHeroGradientStart,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.navyFreshDark,
    marginBottom: 4,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
