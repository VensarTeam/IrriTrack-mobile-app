import { StyleSheet, Dimensions } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";

const { width } = Dimensions.get("window");

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
    width: width - 32,
    backgroundColor: colors.white,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.loginHeroGradientStart,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.navyFreshDark,
    marginBottom: 4,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
