import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import { moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingHorizontal: moderateScale(16),
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.tabBarBg,
    borderWidth: 1,
    borderColor: colors.loginSheetBorderLight,
    borderRadius: moderateScale(24),
    height: verticalScale(60),
    alignItems: "center",
    justifyContent: "space-around",
    elevation: 6,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(4),
  },

  activeTab: {
    backgroundColor: colors.tabActive,
  },

  activeLabel: {
    color: colors.white,
  },
});
