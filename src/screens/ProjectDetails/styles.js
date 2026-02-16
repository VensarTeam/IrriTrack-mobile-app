import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import {
  moderateScale,
  verticalScale,
} from "../../constants/metrics";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* ================= HEADER ================= */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
  },

  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: colors.textDark,
  },

  logo: {
    width: moderateScale(120),
    height: moderateScale(20),
    alignSelf:'center'
  },

  /* ================= KPI CARDS ================= */

  kpiContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(15),
    marginVertical: verticalScale(20),
  },

  kpiCard: {
    flex: 1,
    marginHorizontal: moderateScale(6),
    paddingVertical: verticalScale(18),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(18),
    elevation: 6,
    overflow: "hidden",
  },

  kpiContent: {
    alignItems: "center",
  },

  kpiTitle: {
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    marginBottom: verticalScale(6),
  },

  kpiValue: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    letterSpacing: moderateScale(0.5),
  },

  /* ================= EXPAND SECTION ================= */

  sectionCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(15),
    marginBottom: verticalScale(15),
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    elevation: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: colors.textDark,
  },

  sectionIcon: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    color: colors.primaryBlue,
  },

  /* ================= SWITCH ================= */

  switchContainer: {
    flexDirection: "row",
    marginVertical: verticalScale(15),
  },

  toggleButton: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(18),
    borderRadius: moderateScale(25),
    backgroundColor: colors.inputBg,
    marginRight: moderateScale(10),
  },

  toggleActive: {
    backgroundColor: colors.primaryBlue,
  },

  toggleText: {
    fontSize: moderateScale(13),
    color: colors.textSecondary,
  },

  toggleTextActive: {
    color: colors.white,
    fontWeight: "500",
  },

  /* ================= CHART ================= */

  chartCard: {
    marginTop: verticalScale(5),
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: verticalScale(15),
    marginBottom: verticalScale(10),
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  legendDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(6),
  },

  legendText: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },

  /* ================= PIE ================= */

  pieWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: verticalScale(20),
  },

  pieCenter: {
    position: "absolute",
    alignItems: "center",
  },

  piePercent: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: colors.textDark,
  },

  pieLabel: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },

  /* ================= STAGE LIST ================= */

  stageList: {
    marginTop: verticalScale(10),
  },

  stageCard: {
    backgroundColor: colors.background,
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    marginBottom: verticalScale(12),
  },

  stageTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: verticalScale(10),
  },

  stageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },

  statusItem: {
    alignItems: "center",
    flex: 1,
  },

  statusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginBottom: verticalScale(4),
  },

  statusLabel: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
  },

  statusValue: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: colors.textDark,
  },

  /* ================= PROGRESS ================= */

  progressBackground: {
    height: verticalScale(6),
    backgroundColor: colors.border,
    borderRadius: moderateScale(4),
    overflow: "hidden",
  },

  progressFill: {
    height: verticalScale(6),
    borderRadius: moderateScale(4),
  },

  percentText: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    marginTop: verticalScale(6),
  },

  /* ================= PIE STAGE TABS ================= */

  stageTabContainer: {
    marginBottom: verticalScale(15),
  },

  stageTab: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(20),
    backgroundColor: colors.inputBg,
    marginRight: moderateScale(8),
  },

  stageTabActive: {
    backgroundColor: colors.primaryBlue,
  },

  stageTabText: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },

  stageTabTextActive: {
    color: colors.white,
    fontWeight: "500",
  },
});
