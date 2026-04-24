import { StyleSheet } from "react-native";
import colors from "../../../constants/colors";
import fonts from "../../../constants/fonts";
import { moderateScale, verticalScale } from "../../../constants/metrics";

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
    fontFamily: fonts.bold,
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
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    elevation: 2,
  },

  projectTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  projectNameWrap: {
    flex: 1,
    paddingRight: moderateScale(10),
  },

  projectLabel: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    marginBottom: verticalScale(2),
  },

  projectText: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    lineHeight: moderateScale(16),
  },

  unitNumberBadge: {
    minWidth: moderateScale(104),
    maxWidth: moderateScale(136),
    backgroundColor: colors.primaryBlue,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(8),
    alignItems: "center",
    justifyContent: "center",
  },

  unitNumberLabel: {
    fontSize: moderateScale(9),
    color: colors.white,
    fontFamily: fonts.medium,
    marginBottom: verticalScale(2),
  },

  unitNumberText: {
    fontSize: moderateScale(14),
    color: colors.white,
    fontFamily: fonts.bold,
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
    fontFamily: fonts.bold,
  },

  stepMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  stepMetaChip: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(999),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  stepMetaChipText: {
    fontSize: moderateScale(9.5),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
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
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
    elevation: 1,
  },

  stepChipText: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  stepChipTextActive: {
    color: colors.white,
  },

  formCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(14),
    elevation: 2,
  },

  formHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },

  formTitle: {
    flex: 1,
    fontSize: moderateScale(15),
    color: colors.textDark,
    fontFamily: fonts.bold,
    marginRight: moderateScale(8),
  },

  progressPill: {
    backgroundColor: colors.lightGreen,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderWidth: 1,
    borderColor: "#BCE9D2",
  },

  progressPillText: {
    fontSize: moderateScale(10),
    color: colors.primaryGreen,
    fontFamily: fonts.bold,
  },

  fieldBlock: {
    marginTop: verticalScale(8),
  },

  fieldLabel: {
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    marginBottom: verticalScale(5),
    fontFamily: fonts.medium,
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

  selectFieldError: {
    borderColor: colors.danger,
  },

  selectValue: {
    flex: 1,
    marginRight: moderateScale(10),
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  selectPlaceholder: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  singleLineInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(12),
    backgroundColor: colors.inputBg,
    paddingVertical: verticalScale(11),
    paddingHorizontal: moderateScale(12),
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  readOnlyInput: {
    backgroundColor: colors.surfaceBlueSoft,
    color: colors.textSecondary,
  },

  repeatableSection: {
    marginTop: verticalScale(12),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(14),
    backgroundColor: colors.surfaceBluePale,
    padding: moderateScale(10),
  },

  repeatableHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: verticalScale(6),
  },

  repeatableTitleWrap: {
    flex: 1,
  },

  repeatableTitle: {
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  repeatableSubtitle: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    lineHeight: moderateScale(14),
  },

  repeatableReferenceImageWrap: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    padding: moderateScale(8),
    marginBottom: verticalScale(8),
  },

  repeatableReferenceImage: {
    width: "100%",
    height: verticalScale(190),
  },

  repeatableReferenceAction: {
    alignSelf: "center",
    marginTop: verticalScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(7),
  },

  repeatableReferenceActionText: {
    fontSize: moderateScale(11),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  repeatableAddButton: {
    borderRadius: moderateScale(10),
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(9),
    alignItems: "center",
    justifyContent: "center",
  },

  repeatableAddButtonText: {
    color: colors.white,
    fontSize: moderateScale(10.5),
    fontFamily: fonts.bold,
  },

  repeatableAddButtonDisabled: {
    backgroundColor: colors.surfaceBlueSoft,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  repeatableAddButtonTextDisabled: {
    color: colors.textSecondary,
  },

  repeatableItemCard: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(8),
  },

  repeatableCompactRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  repeatableValueBadge: {
    minWidth: moderateScale(44),
    minHeight: verticalScale(42),
    borderRadius: moderateScale(8),
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(8),
    marginRight: moderateScale(8),
  },

  repeatableValueText: {
    fontSize: moderateScale(13),
    color: colors.white,
    fontFamily: fonts.bold,
  },

  repeatableFieldArea: {
    flex: 1,
  },

  repeatableInlineField: {
    flex: 1,
  },

  repeatableInlineLabel: {
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: verticalScale(4),
  },

  repeatableInlineSelect: {
    minHeight: verticalScale(38),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    backgroundColor: colors.inputBg,
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  repeatableInlineInput: {
    minHeight: verticalScale(38),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(8),
    backgroundColor: colors.inputBg,
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(8),
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  repeatableInlineValue: {
    flex: 1,
    marginRight: moderateScale(8),
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  repeatableStaticText: {
    fontSize: moderateScale(12),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  repeatableRemoveButton: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
    backgroundColor: colors.surfaceBlueSoft,
  },

  repeatableRemoveText: {
    fontSize: moderateScale(10),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  checklistCard: {
    marginTop: verticalScale(12),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(14),
    backgroundColor: colors.surfaceBluePale,
    padding: moderateScale(10),
  },

  checklistTitle: {
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(4),
    gap: moderateScale(8),
  },

  sectionCountBadge: {
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(999),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  sectionCountBadgeText: {
    fontSize: moderateScale(9.5),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  sectionHelperText: {
    marginBottom: verticalScale(8),
    fontSize: moderateScale(10),
    color: colors.textSecondary,
    lineHeight: moderateScale(14),
  },

  checkItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(6),
  },

  checkItemChecked: {
    borderColor: colors.primaryGreen,
    backgroundColor: colors.lightGreen,
  },

  checkbox: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(5),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(1),
  },

  checkboxChecked: {
    borderColor: colors.primaryGreen,
    backgroundColor: colors.primaryGreen,
  },

  checkboxMark: {
    color: colors.white,
    fontSize: moderateScale(11),
    fontFamily: fonts.bold,
    lineHeight: moderateScale(12),
  },

  checkItemText: {
    flex: 1,
    marginLeft: moderateScale(8),
    fontSize: moderateScale(11),
    color: colors.textDark,
    lineHeight: moderateScale(15),
  },

  checkItemTextChecked: {
    color: colors.navyFreshDark,
    fontFamily: fonts.medium,
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

  photoSection: {
    marginTop: verticalScale(12),
  },

  photoSectionTitle: {
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  photoSlotCard: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(12),
    backgroundColor: colors.surfaceBluePale,
    padding: moderateScale(10),
    marginBottom: verticalScale(8),
  },

  photoSlotCardError: {
    borderColor: colors.danger,
  },

  photoSlotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(6),
  },

  photoSlotTitle: {
    flex: 1,
    marginRight: moderateScale(8),
    fontSize: moderateScale(11),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  photoRemoveBtn: {
    flexDirection:'row',
    gap:4,
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(8),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.danger,
  },

  photoRemoveBtnText: {
    fontSize: moderateScale(12),
    color: colors.danger,
    fontFamily: fonts.bold,
  },

  uploadActionsRow: {
    flex:1,
    flexDirection: "row",
    gap: moderateScale(8),
  },

  uploadButton: {
    flex: 1,
    flexDirection: "row",
    gap: moderateScale(4),
    borderWidth: 1,
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(10),
  },

  uploadCameraButton: {
    borderColor: colors.primaryBlue,
    backgroundColor: colors.surfaceBlue,
  },

  uploadGalleryButton: {
    borderColor: colors.cardBorder,
    backgroundColor: colors.white,
  },

  uploadGalleryButtonText: {
    color: colors.primaryBlue,
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
  },

  uploadButtonText: {
    color: colors.primaryBlue,
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
  },

  photoPreviewWrap: {
    marginTop: verticalScale(8),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: moderateScale(10),
    overflow: "hidden",
    backgroundColor: colors.white,
  },

  photoPreviewImage: {
    width: "100%",
    height: verticalScale(170),
  },

  videoPreviewPlaceholder: {
    height: verticalScale(140),
    backgroundColor: colors.surfaceBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  videoPreviewText: {
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
  },

  photoMetaCard: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(10),
    backgroundColor: colors.background,
  },

  photoMetaText: {
    fontSize: moderateScale(10),
    color: colors.textDark,
    marginBottom: verticalScale(2),
  },

  photoEmptyText: {
    marginTop: verticalScale(6),
    fontSize: moderateScale(10),
    color: colors.textSecondary,
  },

  locationSection: {
  marginTop: verticalScale(16),
  gap: verticalScale(8),
},

locationTitle: {
  fontSize: moderateScale(11),
  color: colors.primaryBlue,
  fontFamily: fonts.bold,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  marginBottom: verticalScale(8),
},

locationCard: {
  borderRadius: moderateScale(20),
  backgroundColor: colors.white,
  paddingVertical: verticalScale(14),
  paddingHorizontal: moderateScale(14),
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.cardBorder,
  elevation: 2,
},

locationLabel: {
  fontSize: moderateScale(9.5),
  color: colors.textSecondary,
  fontFamily: fonts.bold,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: verticalScale(6),
},

locationEntry: {
  backgroundColor: colors.inputBg,
  borderRadius: moderateScale(14),
  paddingHorizontal: moderateScale(12),
  paddingVertical: verticalScale(10),
  marginBottom: verticalScale(8),
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.06)",
},

locationEntryMuted: {
  opacity: 0.7,
},

locationEntryHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: verticalScale(6),
  gap: moderateScale(8),
},

locationHighlight: {
  borderRadius: moderateScale(14),
  paddingHorizontal: moderateScale(12),
  paddingVertical: verticalScale(10),
  marginBottom: verticalScale(8),
  backgroundColor: colors.surfaceBlueSoft,
  borderLeftWidth: 3,
  borderLeftColor: colors.primaryBlue,
  borderTopWidth: 0,
  borderBottomWidth: 0,
  borderRightWidth: 0,
},

locationHighlightText: {
  fontSize: moderateScale(11.5),
  color: colors.primaryBlue,
  fontFamily: fonts.bold,
  letterSpacing: 0.2,
},

locationHighlightTextMuted: {
  color: colors.textSecondary,
  fontFamily: fonts.medium,
},

locationMetaText: {
  marginTop: verticalScale(4),
  fontSize: moderateScale(10),
  color: colors.textSecondary,
  fontFamily: fonts.medium,
  lineHeight: moderateScale(15),
},

locationMiniBtn: {
  minHeight: verticalScale(30),
  borderRadius: moderateScale(999),
  backgroundColor: colors.surfaceBlueSoft,
  borderWidth: 1,
  borderColor: colors.primaryBlue,
  paddingHorizontal: moderateScale(12),
  paddingVertical: verticalScale(5),
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: moderateScale(5),
  shadowColor: colors.primaryBlue,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 6,
  elevation: 2,
},

locationMiniBtnDisabled: {
  borderColor: colors.border,
  backgroundColor: colors.white,
  shadowOpacity: 0,
  elevation: 0,
},

locationMiniBtnText: {
  fontSize: moderateScale(10),
  color: colors.primaryBlue,
  fontFamily: fonts.bold,
  letterSpacing: 0.3,
},

locationMiniBtnTextDisabled: {
  color: colors.textSecondary,
},

locationText: {
  fontSize: moderateScale(11.5),
  color: colors.textDark,
  fontFamily: fonts.medium,
  lineHeight: moderateScale(17),
  marginBottom: verticalScale(2),
},

locationActionsRow: {
  marginTop: verticalScale(12),
  gap: verticalScale(8),
},

locationBtn: {
  flexDirection: "row",
  gap: moderateScale(6),
  borderRadius: moderateScale(14),
  paddingVertical: verticalScale(12),
  alignItems: "center",
  justifyContent: "center",
},

locationBtnPrimary: {
  backgroundColor: colors.primaryBlue,
  shadowColor: colors.primaryBlue,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.28,
  shadowRadius: 10,
  elevation: 5,
},

locationBtnDisabled: {
  opacity: 0.55,
  shadowOpacity: 0,
  elevation: 0,
},

locationBtnPrimaryText: {
  fontSize: moderateScale(12.5),
  color: colors.white,
  fontFamily: fonts.bold,
  letterSpacing: 0.4,
},

locationBtnSecondary: {
  backgroundColor: "transparent",
  borderWidth: 1.5,
  borderColor: colors.primaryBlue,
},

locationBtnSecondaryText: {
  fontSize: moderateScale(12.5),
  color: colors.primaryBlue,
  fontFamily: fonts.bold,
  letterSpacing: 0.4,
},

  submitButton: {
    marginTop: verticalScale(8),
    borderRadius: moderateScale(12),
    backgroundColor: colors.primaryBlue,
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
    fontFamily: fonts.bold,
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
    fontFamily: fonts.bold,
  },

  modalCloseBtn: {
    marginTop: verticalScale(10),
    alignItems: "center",
    paddingVertical: verticalScale(8),
  },

  modalCloseText: {
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
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

  referencePreviewCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(14),
    padding: moderateScale(10),
    maxHeight: "88%",
  },

  referencePreviewTitle: {
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontFamily: fonts.bold,
    marginBottom: verticalScale(8),
    textAlign: "center",
  },

  referencePreviewImage: {
    width: "100%",
    height: verticalScale(520),
    borderRadius: moderateScale(10),
    backgroundColor: colors.background,
  },

  previewImage: {
    width: "100%",
    height: verticalScale(360),
    borderRadius: moderateScale(10),
    backgroundColor: colors.background,
  },

  previewMetaText: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(11),
    color: colors.textDark,
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
    fontFamily: fonts.bold,
  },

  videoPreviewModalPlaceholder: {
    height: verticalScale(220),
    borderRadius: moderateScale(10),
    backgroundColor: colors.surfaceBlue,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(16),
  },

  videoPreviewModalText: {
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
    fontFamily: fonts.bold,
    textAlign: "center",
  },
});
