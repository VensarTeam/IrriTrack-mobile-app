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
    paddingVertical: verticalScale(10),
  },

  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: colors.textDark,
  },

  searchInput: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(15),
    padding: moderateScale(12),
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(10),
  },

  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(15),
    marginBottom: verticalScale(12),
    justifyContent: "space-between",
  },

  filterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(4),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(14),
    elevation: 3,
  },

  filterBtnActive: {
    backgroundColor: colors.primaryBlue,
  },

  filterText: {
    marginLeft: moderateScale(6),
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontWeight: "500",
  },

  filterTextActive: {
    color: colors.white,
  },

  card: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(15),
    marginBottom: verticalScale(12),
    padding: moderateScale(16),
    borderRadius: moderateScale(18),
    elevation: 4,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },

  unitNo: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: colors.primaryBlue,
  },

  directionBtn: {
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(20),
  },

  directionText: {
    color: colors.white,
    fontSize: moderateScale(12),
  },

  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statusItem: {
    width: "30%",
    marginBottom: verticalScale(8),
  },

  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginBottom: 4,
  },

  statusLabel: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
  },

  statusValue: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: colors.textDark,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: verticalScale(10),
  },

  metaItem: {
    alignItems: "center",
  },

  metaLabel: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
  },

  metaValue: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: colors.textDark,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
  },

  modalCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(30),
    borderRadius: moderateScale(18),
    padding: moderateScale(20),
    maxHeight: "70%",
  },

  modalTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginBottom: verticalScale(10),
  },

  modalItem: {
    paddingVertical: verticalScale(10),
  },

  modalText: {
    fontSize: moderateScale(13),
    color: colors.textDark,
  },

  closeText: {
    textAlign: "center",
    marginTop: verticalScale(15),
    color: colors.primaryBlue,
    fontWeight: "600",
  },
});
