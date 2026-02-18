import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import { moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceBlueSheet,
    paddingHorizontal: moderateScale(16),
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    backgroundColor: colors.primaryBlue,
  },

  activeLabel: {
    color: colors.white,
  },
});
