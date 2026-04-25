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
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(10),
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(20),
    margin: 0,
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

  filterPanel: {
    marginHorizontal: moderateScale(15),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(18),
    backgroundColor: colors.filterPanelSurface,
    borderWidth: 1,
    borderColor: colors.filterPanelBorder,
    marginBottom: verticalScale(10),
  },

  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  filterPanelTitleWrap: {
    flex: 1,
    paddingRight: moderateScale(10),
  },

  compactMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(2),
  },

  compactMetaLabel: {
    fontSize: moderateScale(9),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginRight: moderateScale(6),
  },

  compactMetaValue: {
    flex: 1,
    fontSize: moderateScale(11),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  filterResetButton: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D8E7F5",
  },

  filterResetText: {
    fontSize: moderateScale(10),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  filterContainer: {
    flexDirection: "row",
    marginTop: verticalScale(6),
    justifyContent: "space-between",
    backgroundColor: "transparent",
    borderRadius: moderateScale(20),
  },

  filterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E0EAF4",
    marginHorizontal: moderateScale(4),
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(16),
    elevation: 1,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },

  filterBtnActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: "#EDF6FF",
    shadowOpacity: 0.08,
  },

  filterBtnDisabled: {
    opacity: 0.7,
  },

  filterLeftSection: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  filterIconWrap: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "#EDF5FE",
    alignItems: "center",
    justifyContent: "center",
  },

  filterIconWrapActive: {
    backgroundColor: colors.primaryBlue,
  },

  filterIconWrapDisabled: {
    backgroundColor: "#E5EBF2",
  },

  filterTextBlock: {
    flex: 1,
    minWidth: 0,
    marginLeft: moderateScale(8),
  },

  filterTitle: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    marginBottom: verticalScale(2),
  },

  filterValue: {
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  filterValueActive: {
    color: colors.primaryBlue,
  },

  filterArrowWrap: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: "#EEF5FC",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: moderateScale(6),
  },

  listContent: {
    paddingBottom: verticalScale(20),
  },

  shimmerBlock: {
    overflow: "hidden",
    borderRadius: moderateScale(12),
    backgroundColor: "#E7EEF6",
  },

  shimmerSweep: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -moderateScale(140),
    width: moderateScale(120),
  },

  shimmerGradient: {
    flex: 1,
  },

  listEmptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  skeletonList: {
    paddingTop: verticalScale(2),
  },

  footerSkeletonList: {
    paddingTop: verticalScale(2),
    paddingBottom: verticalScale(4),
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

  cardDisabled: {
    borderColor: "#D6E2EF",
  },

  skeletonCard: {
    backgroundColor: "#FCFEFF",
    borderWidth: 1,
    borderColor: "#D9E4F2",
    marginHorizontal: moderateScale(15),
    marginBottom: verticalScale(12),
    padding: moderateScale(12),
    borderRadius: moderateScale(18),
    overflow: "hidden",
  },

  skeletonUnitNo: {
    height: verticalScale(18),
    width: "42%",
    marginBottom: verticalScale(8),
    borderRadius: moderateScale(8),
  },

  skeletonMetaChip: {
    height: verticalScale(16),
    width: moderateScale(78),
    borderRadius: moderateScale(8),
  },

  skeletonRoundAction: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    marginRight: moderateScale(8),
  },

  skeletonDirectionAction: {
    width: moderateScale(78),
    height: moderateScale(34),
    borderRadius: moderateScale(18),
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
    minHeight: verticalScale(40),
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  processTileOffline: {
    backgroundColor: "rgba(22, 58, 112, 0.92)",
    borderColor: "#12325F",
    overflow: "hidden",
    shadowColor: "#102C56",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },

  processTileOfflineGradient: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: moderateScale(14),
  },

  processTileWide: {
    width: "100%",
  },

  skeletonProcessTileWrap: {
    width: "48.5%",
    marginBottom: verticalScale(6),
  },

  skeletonProcessTile: {
    minHeight: verticalScale(40),
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(14),
    backgroundColor: "#F5F9FD",
    borderWidth: 1,
    borderColor: "#E0EAF4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  skeletonProcessMain: {
    flex: 1,
    minWidth: 0,
    marginRight: moderateScale(8),
    flexDirection: "row",
    alignItems: "center",
  },

  skeletonProcessDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(8),
  },

  skeletonProcessLabel: {
    height: verticalScale(12),
    width: "72%",
    borderRadius: moderateScale(7),
  },

  skeletonProcessArrow: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
  },

  processTileMain: {
    flex: 1,
    minWidth: 0,
    marginRight: moderateScale(8),
  },

  processTileMeta: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  processStatusDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    marginRight: moderateScale(8),
  },

  processStatusDotOffline: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },

  processLabel: {
    flex: 1,
    fontSize: moderateScale(11),
    lineHeight: moderateScale(13),
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },

  processLabelOffline: {
    color: colors.white,
  },

  processValue: {
    marginTop: verticalScale(4),
    marginLeft: moderateScale(15),
    fontSize: moderateScale(10),
    lineHeight: moderateScale(12),
    fontFamily: fonts.medium,
  },

  processTileRight: {
    alignItems: "center",
    justifyContent: "center",
  },

  processArrowWrap: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: "center",
    justifyContent: "center",
  },

  processArrowWrapOffline: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    shadowColor: "#102C56",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },

  certificateButton: {
    marginTop: verticalScale(4),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    backgroundColor: colors.primaryBlue,
    paddingVertical: verticalScale(9),
    alignItems: "center",
  },

  certificateButtonText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "center",
  },

  modalCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(24),
    borderRadius: moderateScale(22),
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(16),
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "#DCE7F3",
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  modalHandle: {
    alignSelf: "center",
    width: moderateScale(36),
    height: verticalScale(4),
    borderRadius: moderateScale(4),
    backgroundColor: "#D7E5F2",
    marginBottom: verticalScale(14),
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
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
    marginBottom: verticalScale(4),
    color: colors.textDark,
  },

  modalSubtitle: {
    fontSize: moderateScale(11),
    lineHeight: moderateScale(16),
    color: colors.textSecondary,
    marginBottom: verticalScale(12),
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(7),
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#E7EFF8",
  },

  modalItemActive: {
    backgroundColor: "#EDF6FF",
    borderColor: colors.primaryBlue,
  },

  modalText: {
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  modalTextActive: {
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  modalCheck: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    borderWidth: 1,
    borderColor: "#D6E3F0",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: moderateScale(12),
  },

  modalCheckActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: colors.primaryBlue,
  },

  closeButton: {
    alignSelf: "center",
    marginTop: verticalScale(8),
    paddingHorizontal: moderateScale(18),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(14),
    backgroundColor: "#EEF5FB",
  },

  closeText: {
    textAlign: "center",
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
    fontSize: moderateScale(12),
  },
});
