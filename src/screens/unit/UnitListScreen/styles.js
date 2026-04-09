import { StyleSheet } from "react-native";
import colors from "../../../constants/colors";
import fonts from "../../../constants/fonts";
import { moderateScale, verticalScale } from "../../../constants/metrics";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",

    paddingVertical: verticalScale(10),
  },

  headerActionSlot: {
    width: moderateScale(44),
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: "center",
  },

  headerInfoButton: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF5FB",
    borderWidth: 1,
    borderColor: "#DCE7F3",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCFDFE",
    marginHorizontal: moderateScale(15),
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: "#DCE7F3",
    paddingHorizontal: moderateScale(12),
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  searchIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    resizeMode: "contain",
    marginRight: moderateScale(8),
  },

  searchInput: {
    flex: 1,
    paddingVertical: verticalScale(12),
    color: colors.textDark,
    fontSize: moderateScale(13),
  },

  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(15),
    marginBottom: verticalScale(12),
    justifyContent: "space-between",
    paddingVertical: verticalScale(6),
    backgroundColor: "#F7FAFE",
    borderRadius: moderateScale(18),
    marginHorizontal: moderateScale(15),
    borderWidth: 1,
    borderColor: "#E2EBF5",
  },

  filterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCFDFE",
    borderWidth: 1,
    borderColor: "#DCE7F3",
    marginHorizontal: moderateScale(3),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(7),
    borderRadius: moderateScale(14),
    elevation: 2,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },

  filterBtnActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: "#EEF5FD",
  },

  filterLeftSection: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  filterIconWrap: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: "#EAF2FB",
    alignItems: "center",
    justifyContent: "center",
  },

  filterIconWrapActive: {
    backgroundColor: "#DCEBFB",
  },

  filterTextBlock: {
    flex: 1,
    minWidth: 0,
    marginLeft: moderateScale(5),
  },

  filterTitle: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    marginBottom: verticalScale(1),
  },

  filterValue: {
    fontSize: moderateScale(11),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  filterValueActive: {
    color: colors.primaryBlue,
  },

  filterArrowWrap: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: "#F2F7FC",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: moderateScale(4),
  },

  listContent: {
    paddingBottom: verticalScale(20),
  },

  listEmptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  emptyWrapper: {
    marginHorizontal: moderateScale(20),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: verticalScale(26),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(18),
    backgroundColor: colors.white,
    alignItems: "center",
    elevation: 3,
  },

  emptyIconWrap: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.surfaceBlueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(10),
    transform: [{ rotate: "-90deg" }],
  },

  emptyTitle: {
    fontSize: moderateScale(15),
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginBottom: verticalScale(4),
  },

  emptySubtitle: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: moderateScale(18),
  },

  emptyActionBtn: {
    marginTop: verticalScale(12),
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(8),
  },

  emptyActionText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
  },

  card: {
    backgroundColor: "#FCFEFF",
    borderWidth: 1,
    borderColor: "#D9E4F2",
    marginHorizontal: moderateScale(15),
    marginBottom: verticalScale(12),
    padding: moderateScale(12),
    borderRadius: moderateScale(18),
    elevation: 2,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },

  unitInfoBlock: {
    flex: 1,
    marginRight: moderateScale(10),
  },

  unitNo: {
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginBottom: verticalScale(6),
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  inlineMeta: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    flexShrink: 1,
  },

  inlineMetaIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: "#EEF4FB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(6),
  },

  inlineMetaValue: {
    fontSize: moderateScale(11),
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    maxWidth: moderateScale(94),
  },

  locationDivider: {
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: colors.border,
    marginHorizontal: moderateScale(8),
  },

  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(1),
  },

  galleryBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: colors.primaryBlue,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(8),
  },

  galleryIconButton: {
    margin: 0,
  },

  directionBtn: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    flexDirection: "row",
    alignItems: "center",
  },

  directionText: {
    color: colors.white,
    fontSize: moderateScale(11),
    fontFamily: fonts.medium,
    marginLeft: moderateScale(6),
  },

  processSection: {
    marginTop: verticalScale(2),
  },

  processGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  processTile: {
    width: "48.5%",
    borderWidth: 1,
    marginBottom: verticalScale(6),
    borderRadius: moderateScale(14),
    minHeight: verticalScale(46),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  processTileWide: {
    width: "100%",
  },

  processTileMeta: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: moderateScale(8),
  },

  processStatusDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    marginRight: moderateScale(8),
  },

  processLabel: {
    flex: 1,
    fontSize: moderateScale(10.5),
    lineHeight: moderateScale(14),
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },

  processProgressBadge: {
    minWidth: moderateScale(38),
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(10),
    alignItems: "center",
  },

  processProgressText: {
    fontSize: moderateScale(9.5),
    fontFamily: fonts.bold,
  },

  certificateButton: {
    marginTop: verticalScale(4),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.completed,
    backgroundColor: colors.lightGreen,
    paddingVertical: verticalScale(9),
    alignItems: "center",
  },

  certificateButtonText: {
    color: colors.darkGreen,
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
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

  infoModalCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(24),
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: "#DCE7F3",
  },

  modalTitle: {
    fontSize: moderateScale(14),
    fontFamily: fonts.bold,
    marginBottom: verticalScale(10),
    color: colors.textDark,
  },

  infoModalSubtitle: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(18),
    color: colors.textSecondary,
    marginTop: verticalScale(-4),
    marginBottom: verticalScale(12),
  },

  legendList: {
    marginTop: verticalScale(2),
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#EEF3F8",
  },

  legendSwatch: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    marginTop: verticalScale(4),
    marginRight: moderateScale(10),
  },

  legendTextWrap: {
    flex: 1,
  },

  legendTitle: {
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  legendSubtitle: {
    fontSize: moderateScale(11),
    lineHeight: moderateScale(16),
    color: colors.textSecondary,
    marginTop: verticalScale(2),
  },

  infoModalCloseButton: {
    alignSelf: "center",
    marginTop: verticalScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(14),
    backgroundColor: "#EFF5FB",
  },

  infoModalCloseText: {
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
    color: colors.primaryBlue,
  },

  modalItem: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10),
  },

  modalItemActive: {
    backgroundColor: colors.surfaceBlueSoft,
  },

  modalText: {
    fontSize: moderateScale(13),
    color: colors.textDark,
  },

  modalTextActive: {
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  closeText: {
    textAlign: "center",
    marginTop: verticalScale(15),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },
});
