import colors from "../constants/colors";

const UNIT_STATUS_PALETTE = {
  completed: {
    solid: colors.completed,
    soft: "#E8FFF2",
    text: "#117A4D",
  },
  approved: {
    solid: "#0F8F5F",
    soft: "#EAF8F1",
    text: "#0B6B47",
  },
  verified: {
    solid: "#2563EB",
    soft: "#EAF1FF",
    text: "#1D4ED8",
  },
  toBeConfirm: {
    solid: colors.toBeConfirm,
    soft: "#EEF6FF",
    text: colors.toBeConfirm,
  },
  pending: {
    solid: colors.pending,
    soft: "#FFF2E5",
    text: "#A85D10",
  },
  submitted: {
    solid: "#0891B2",
    soft: "#E6F8FC",
    text: "#0E7490",
  },
  partial: {
    solid: colors.partial,
    soft: "#FFF7E3",
    text: "#A56D00",
  },
  commented: {
    solid: colors.danger,
    soft: "#FFF1F1",
    text: colors.danger,
  },
  info: {
    solid: colors.primaryBlue,
    soft: "#EAF3FF",
    text: colors.primaryBlue,
  },
};

const normalizeUnitStatusKey = (status) => {
  const value =
    typeof status === "string"
      ? status
      : status?.key || status?.value || status?.label || "";
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (
    normalizedValue === "tobeconfirm" ||
    normalizedValue === "to be confirm" ||
    normalizedValue === "to be confirmed" ||
    normalizedValue === "to_be_confirm" ||
    normalizedValue === "to-be-confirm"
  ) {
    return "toBeConfirm";
  }

  if (normalizedValue === "updated") {
    return "completed";
  }

  if (
    normalizedValue === "partial completed" ||
    normalizedValue === "partially completed"
  ) {
    return "partial";
  }

  if (normalizedValue === "rejected") {
    return "commented";
  }

  return normalizedValue;
};

export const getUnitStatusPalette = (status) =>
  UNIT_STATUS_PALETTE[normalizeUnitStatusKey(status)] ||
  UNIT_STATUS_PALETTE.partial;

export const getUnitStatusColor = (status) =>
  getUnitStatusPalette(status).solid;
