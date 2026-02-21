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
    fontWeight: "700",
    color: colors.textDark,
  },

  searchInput: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(15),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textDark,
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: moderateScale(3),
    paddingVertical: verticalScale(7),
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(14),
    elevation: 2,
  },

  filterBtnActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: colors.surfaceBlueSoft,
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
    backgroundColor: colors.surfaceBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  filterIconWrapActive: {
    backgroundColor: colors.white,
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
    fontWeight: "600",
  },

  filterValueActive: {
    color: colors.primaryBlue,
  },

  filterArrowWrap: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: colors.white,
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
    fontWeight: "700",
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
    fontWeight: "700",
  },

  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginHorizontal: moderateScale(15),
    marginBottom: verticalScale(12),
    padding: moderateScale(14),
    borderRadius: moderateScale(18),
    elevation: 2,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },

  unitInfoBlock: {
    flex: 1,
    marginRight: moderateScale(10),
  },

  unitBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceBlue,
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(6),
  },

  unitBadgeText: {
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontWeight: "700",
  },

  unitNo: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: colors.textDark,
  },

  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  galleryBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
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
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    flexDirection: "row",
    alignItems: "center",
  },

  directionText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginLeft: moderateScale(6),
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },

  metaItem: {
    width: "32%",
    backgroundColor: colors.background,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(6),
    alignItems: "center",
  },

  metaLabel: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },

  metaValue: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: colors.textDark,
    marginTop: verticalScale(2),
  },

  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statusItem: {
    width: "48.5%",
    marginBottom: verticalScale(6),
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(7),
    paddingHorizontal: moderateScale(8),
  },

  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginRight: moderateScale(4),
  },

  statusLabel: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },

  statusValue: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginTop: verticalScale(3),
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
    fontWeight: "700",
    marginBottom: verticalScale(10),
    color: colors.textDark,
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
    fontWeight: "700",
  },

  closeText: {
    textAlign: "center",
    marginTop: verticalScale(15),
    color: colors.primaryBlue,
    fontWeight: "700",
  },
});
