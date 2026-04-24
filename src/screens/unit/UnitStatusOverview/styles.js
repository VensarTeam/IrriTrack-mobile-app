import { StyleSheet } from "react-native";
import colors from "../../../constants/colors";
import fonts from "../../../constants/fonts";
import { moderateScale, verticalScale } from "../../../constants/metrics";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPage ?? "#F5F6FA",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    backgroundColor: colors.white,
  },

  headerTitle: {
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  headerSpacer: {
    width: moderateScale(40),
  },

  content: {
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(28),
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(16),
    paddingHorizontal: moderateScale(16),
    marginBottom: verticalScale(14),
    overflow: "hidden",
  },

  heroOrb1: {
    position: "absolute",
    top: -moderateScale(40),
    right: -moderateScale(40),
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  heroOrb2: {
    position: "absolute",
    bottom: -moderateScale(24),
    left: moderateScale(30),
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  heroOrb3: {
    position: "absolute",
    top: moderateScale(28),
    right: moderateScale(18),
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.28)",
  },

  heroBadgeText: {
    fontSize: moderateScale(11),
    color: "rgba(255,255,255,0.92)",
    fontFamily: fonts.bold,
    letterSpacing: 0.7,
    lineHeight: moderateScale(13),
    includeFontPadding: false,
    textAlignVertical: "center",
  },

  heroUnitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },

  heroUnitText: {
    fontSize: moderateScale(11),
    color: "rgba(255,255,255,0.85)",
    fontFamily: fonts.medium,
    lineHeight: moderateScale(13),
    includeFontPadding: false,
    textAlignVertical: "center",
  },

  heroTitle: {
    fontSize: moderateScale(16),
    color: colors.white,
    fontFamily: fonts.bold,
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(14),
    paddingRight: moderateScale(40),
  },

  heroStatsRow: {
    flexDirection: "row",
    gap: moderateScale(8),
  },

  heroStatChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: moderateScale(13),
    paddingVertical: verticalScale(9),
    alignItems: "center",
    justifyContent: "center",
  },

  heroStatChipGreen: {
    backgroundColor: "rgba(14,159,110,0.28)",
    borderColor: "rgba(14,159,110,0.55)",
  },

  heroStatChipAmber: {
    backgroundColor: "rgba(240,140,0,0.22)",
    borderColor: "rgba(240,140,0,0.45)",
  },

  heroStatValue: {
    fontSize: moderateScale(18),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  heroStatLabel: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(9.5),
    color: "rgba(255,255,255,0.72)",
    fontFamily: fonts.medium,
    letterSpacing: 0.3,
  },

  // ── Section Cards ──
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(12),
    marginBottom: verticalScale(10),
  },

  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginBottom: verticalScale(10),
  },

  sectionIconWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: colors.surfaceBlueSoft,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  sectionHeadCopy: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: moderateScale(13),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  sectionSubtitle: {
    marginTop: verticalScale(1),
    fontSize: moderateScale(10.5),
    color: colors.textSecondary,
    lineHeight: moderateScale(15),
  },

  sectionCountBadge: {
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(999),
    backgroundColor: colors.surfaceBlueSoft,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
  },

  sectionCountText: {
    fontSize: moderateScale(9.5),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  subStatusList: {
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: verticalScale(4),
  },

  subStatusItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(8),
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },

  subStatusItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },

  subStatusCopy: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: moderateScale(8),
  },

  subStatusDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(999),
    backgroundColor: colors.primaryBlue,
    marginRight: moderateScale(8),
  },

  subStatusLabel: {
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.medium,
    flex: 1,
  },

  statusPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(10),
  },

  statusPillText: {
    fontSize: moderateScale(10),
    fontFamily: fonts.bold,
    color: colors.white,
  },

  // ── Actions Card ──
  actionsCard: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginTop: verticalScale(4),
  },

  actionsHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginBottom: verticalScale(14),
  },

  actionsIconWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: colors.surfaceBlueSoft,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  actionsTitle: {
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontFamily: fonts.bold,
  },

  actionsSubtitle: {
    marginTop: verticalScale(1),
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    lineHeight: moderateScale(15),
  },

  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(11),
  },

  reportButtonText: {
    color: colors.primaryBlue,
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
  },

  certificateButton: {
    marginTop: verticalScale(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(11),
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  certificateButtonText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
  },
});
