import RNFS from "react-native-fs";

const DRAFT_DIRECTORY = `${RNFS.DocumentDirectoryPath}/checklist_image_drafts`;

const sanitizeKeyPart = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "unknown";

const ensureDraftDirectory = async () => {
  const exists = await RNFS.exists(DRAFT_DIRECTORY);

  if (!exists) {
    await RNFS.mkdir(DRAFT_DIRECTORY);
  }
};

const buildDraftPath = (scopeKey) =>
  `${DRAFT_DIRECTORY}/${sanitizeKeyPart(scopeKey)}.json`;

export const buildChecklistImageDraftScopeKey = ({
  ownerUserId = "",
  module = "OMS",
  unitId = "",
  omsId = "",
  processId = "",
  subprocessId = "",
} = {}) =>
  [
    sanitizeKeyPart(ownerUserId),
    sanitizeKeyPart(module),
    sanitizeKeyPart(unitId || omsId || "unit"),
    sanitizeKeyPart(processId),
    sanitizeKeyPart(subprocessId),
  ].join("__");

export const saveChecklistImageDraft = async ({
  scopeKey = "",
  photos = [],
} = {}) => {
  if (!scopeKey) {
    return null;
  }

  await ensureDraftDirectory();

  const normalizedPhotos = (photos || [])
    .filter((photo) => photo?.requirementId && (photo?.uri || photo?.filePath))
    .map((photo) => ({
      requirementId: String(photo.requirementId),
      checklistId: photo.checklistId ?? null,
      label: photo.label || "",
      uri: photo.uri || "",
      filePath: photo.filePath || "",
      name: photo.name || "",
      sizeKb: photo.sizeKb ?? null,
      width: photo.width ?? null,
      height: photo.height ?? null,
      mediaType: photo.mediaType || "image",
      type: photo.type || "image/jpeg",
      takenAt: photo.takenAt || "",
      latitude: photo.latitude ?? null,
      longitude: photo.longitude ?? null,
      source: "cached",
    }));

  const payload = {
    scopeKey,
    updatedAt: new Date().toISOString(),
    photos: normalizedPhotos,
  };

  await RNFS.writeFile(
    buildDraftPath(scopeKey),
    JSON.stringify(payload),
    "utf8"
  );

  return payload;
};

export const getChecklistImageDraft = async ({ scopeKey = "" } = {}) => {
  if (!scopeKey) {
    return null;
  }

  try {
    const draftPath = buildDraftPath(scopeKey);
    const exists = await RNFS.exists(draftPath);

    if (!exists) {
      return null;
    }

    const rawValue = await RNFS.readFile(draftPath, "utf8");
    const parsedValue = JSON.parse(rawValue);
    const photos = Array.isArray(parsedValue?.photos) ? parsedValue.photos : [];
    const existingPhotos = [];

    for (const photo of photos) {
      const candidatePath = String(photo?.filePath || photo?.uri || "").replace(
        /^file:\/\//,
        ""
      );

      if (!candidatePath) {
        continue;
      }

      // Keep only draft entries whose local file still exists on device.
      // This prevents restoring broken image references after OS cleanup.
      if (await RNFS.exists(candidatePath)) {
        existingPhotos.push(photo);
      }
    }

    if (!existingPhotos.length) {
      await RNFS.unlink(draftPath).catch(() => {});
      return null;
    }

    return {
      scopeKey,
      updatedAt: parsedValue?.updatedAt || "",
      photos: existingPhotos,
    };
  } catch (error) {
    return null;
  }
};

export const clearChecklistImageDraft = async ({ scopeKey = "" } = {}) => {
  if (!scopeKey) {
    return;
  }

  const draftPath = buildDraftPath(scopeKey);
  const exists = await RNFS.exists(draftPath);

  if (exists) {
    await RNFS.unlink(draftPath).catch(() => {});
  }
};
