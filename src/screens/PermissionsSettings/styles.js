import { StyleSheet, Platform } from "react-native";
import colors from "../../constants/colors";
import fonts from "../../constants/fonts";

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background, // F8F9FA usually
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: colors.primaryBlue,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 6,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: colors.white,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
    paddingTop: 24,
  },
  permissionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryBlue + "10",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 12,
  },
  permissionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.navyFreshDark,
    marginBottom: 4,
  },
  permissionDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  switchContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
