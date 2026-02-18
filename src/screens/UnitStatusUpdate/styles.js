import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
import { moderateScale, verticalScale } from "../../constants/metrics";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardContainer: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(8),
  },

  headerTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
    flex: 1,
  },

  headerSpacer: {
    width: moderateScale(40),
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: moderateScale(15),
    paddingBottom: verticalScale(28),
  },

  projectCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
    elevation: 1,
  },

  projectLabel: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    marginBottom: verticalScale(2),
  },

  projectText: {
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontWeight: "700",
  },

  projectMeta: {
    marginTop: verticalScale(3),
    fontSize: moderateScale(11),
    color: colors.primaryBlue,
    fontWeight: "600",
  },

  stepHeaderRow: {
    marginTop: verticalScale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  stepTitle: {
    fontSize: moderateScale(15),
    color: colors.textDark,
    fontWeight: "700",
  },

  stepSubtitle: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
  },

  stepScroll: {
    marginTop: verticalScale(8),
    marginBottom: verticalScale(12),
  },

  stepChip: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
    marginRight: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.border,
  },

  stepChipActive: {
    backgroundColor: colors.surfaceBlueSoft,
    borderColor: colors.primaryBlue,
  },

  stepChipText: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontWeight: "600",
  },

  stepChipTextActive: {
    color: colors.primaryBlue,
  },

  formCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(14),
    elevation: 1,
  },

  formTitle: {
    fontSize: moderateScale(15),
    color: colors.textDark,
    fontWeight: "700",
    marginBottom: verticalScale(10),
  },

  fieldLabel: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    marginBottom: verticalScale(5),
    marginTop: verticalScale(8),
  },

  selectField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(12),
    backgroundColor: colors.inputBg,
    paddingVertical: verticalScale(11),
    paddingHorizontal: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectValue: {
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontWeight: "600",
  },

  remarkInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(12),
    backgroundColor: colors.inputBg,
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    minHeight: verticalScale(96),
    fontSize: moderateScale(12),
    color: colors.textDark,
  },

  uploadButton: {
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    borderRadius: moderateScale(12),
    backgroundColor: colors.surfaceBluePale,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(11),
    marginTop: verticalScale(3),
  },

  uploadButtonText: {
    color: colors.primaryBlue,
    fontSize: moderateScale(12),
    fontWeight: "700",
  },

  photoPreviewWrap: {
    marginTop: verticalScale(10),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(12),
    overflow: "hidden",
    backgroundColor: colors.background,
  },

  photoPreviewImage: {
    width: "100%",
    height: verticalScale(170),
  },

  photoPreviewHint: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    paddingVertical: verticalScale(6),
    textAlign: "center",
  },

  photoMetaCard: {
    marginTop: verticalScale(8),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(10),
    backgroundColor: colors.background,
  },

  photoMetaText: {
    fontSize: moderateScale(11),
    color: colors.textDark,
    marginBottom: verticalScale(2),
  },

  locationCard: {
    marginTop: verticalScale(4),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(12),
    backgroundColor: colors.background,
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(10),
  },

  locationText: {
    fontSize: moderateScale(11),
    color: colors.textDark,
    marginBottom: verticalScale(3),
  },

  locationActionsRow: {
    marginTop: verticalScale(8),
  },

  locationBtn: {
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(10),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(8),
  },

  locationBtnPrimary: {
    backgroundColor: colors.primaryBlue,
  },

  locationBtnPrimaryText: {
    fontSize: moderateScale(12),
    color: colors.white,
    fontWeight: "700",
  },

  locationBtnSecondary: {
    backgroundColor: colors.surfaceBluePale,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
  },

  locationBtnSecondaryText: {
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontWeight: "700",
  },

  submitButton: {
    marginTop: verticalScale(10),
    borderRadius: moderateScale(12),
  },

  submitButtonContent: {
    height: verticalScale(48),
  },

  errorText: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(10),
    color: colors.danger,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: moderateScale(26),
  },

  modalCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(14),
    paddingHorizontal: moderateScale(12),
    maxHeight: "70%",
  },

  modalTitle: {
    fontSize: moderateScale(14),
    color: colors.textDark,
    fontWeight: "700",
    marginBottom: verticalScale(8),
  },

  modalOption: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10),
  },

  modalOptionActive: {
    backgroundColor: colors.surfaceBlueSoft,
  },

  modalOptionText: {
    fontSize: moderateScale(12),
    color: colors.textDark,
  },

  modalOptionTextActive: {
    color: colors.primaryBlue,
    fontWeight: "700",
  },

  modalCloseBtn: {
    marginTop: verticalScale(10),
    alignItems: "center",
    paddingVertical: verticalScale(8),
  },

  modalCloseText: {
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontWeight: "700",
  },

  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    paddingHorizontal: moderateScale(16),
  },

  previewCloseArea: {
    ...StyleSheet.absoluteFillObject,
  },

  previewCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(14),
    padding: moderateScale(10),
    maxHeight: "80%",
  },

  previewImage: {
    width: "100%",
    height: verticalScale(360),
    borderRadius: moderateScale(10),
    backgroundColor: colors.background,
  },

  previewCloseBtn: {
    marginTop: verticalScale(10),
    alignSelf: "center",
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(10),
    backgroundColor: colors.surfaceBlueSoft,
  },

  previewCloseText: {
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontWeight: "700",
  },
});
