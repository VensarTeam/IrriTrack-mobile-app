import { IMAGE_BASE_URL } from "../../config/env";

export const normalizeText = (value) =>
  String(value || "")
    .replace(/&/g, "and")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Finds a server-progress checklist by ID first, then by normalized label.
 */
export const findProgressChecklistMatch = (
  checklistsById,
  checklistsByName,
  source = {},
  fallbackLabel = ""
) => {
  const checklistId = String(
    source.checklistId || source.id || source.key || ""
  ).trim();

  if (checklistId && checklistsById.has(checklistId)) {
    return checklistsById.get(checklistId) || null;
  }

  const candidateNames = [
    source.label,
    source.description,
    fallbackLabel,
  ]
    .map((item) => normalizeText(item))
    .filter(Boolean);

  for (const candidateName of candidateNames) {
    if (checklistsByName.has(candidateName)) {
      return checklistsByName.get(candidateName) || null;
    }
  }

  return null;
};

/**
 * Checks nested server data for any value that represents submitted content.
 */
export const hasMeaningfulServerValue = (value) => {
  if (value === null || typeof value === "undefined") {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulServerValue(item));
  }

  if (typeof value === "object") {
    return Object.values(value).some((item) => hasMeaningfulServerValue(item));
  }

  return false;
};

/**
 * Resolves a server photo value or storage object key into a displayable URI.
 */
export const resolveServerPhotoUri = (remoteValue, objectKey = "") => {
  const rawValue = String(remoteValue || "").trim();
  const rawObjectKey = String(objectKey || "").trim();

  if (rawValue.startsWith("http://") || rawValue.startsWith("https://")) {
    return rawValue;
  }

  if (rawObjectKey) {
    return `${IMAGE_BASE_URL}${rawObjectKey.replace(/^\/+/, "")}`;
  }

  if (rawValue) {
    return `${IMAGE_BASE_URL}${rawValue.replace(/^\/+/, "")}`;
  }

  return "";
};
