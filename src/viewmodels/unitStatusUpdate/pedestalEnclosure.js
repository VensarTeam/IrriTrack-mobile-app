import {
  findProgressChecklistMatch,
  hasMeaningfulServerValue,
  normalizeText,
  resolveServerPhotoUri,
} from "./helpers";

// Pedestal completion is driven by backend checklist IDs, never descriptions.
export const PED_ENCLOSURE_SUBOPTION_ID = "pedestalEnclosureInstallation";
export const PED_ENCLOSURE_SIZE_CHECKLIST_ID = "22";
export const PED_ENCLOSURE_REQUIRED_CHECKLIST_IDS = Object.freeze([
  "13",
  "14",
  "15",
  "17",
  "18",
  "19",
  "20",
  "21",
  "23",
  "97",
]);
export const PED_ENCLOSURE_COMPLETION_PHOTO_IDS = Object.freeze([
  "99",
  "100",
  "25",
  "26",
]);

const PHOTO_REQUIRED_BY_CHECKLIST_ID = Object.freeze({
  "20": "99",
  "23": "100",
  "97": "25",
});

/**
 * Returns true when media came from a previous server submission.
 */
export const isServerSourcedMedia = (media = null) =>
  String(media?.source || "").trim().toLowerCase() === "server";

/**
 * Normalizes checklist IDs across form, snapshot, and API payload shapes.
 */
export const getSubmissionChecklistId = (entry = {}) =>
  String(entry?.checklist_id || entry?.checklistId || entry?.id || "").trim();

/**
 * Determines whether a submitted value represents completed or filled data.
 */
export const hasSubmissionValue = (value) => {
  if (value === null || typeof value === "undefined") {
    return false;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalizedValue = normalizeText(value);

    return (
      Boolean(normalizedValue) &&
      !["no", "false", "0", "null"].includes(normalizedValue)
    );
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasSubmissionValue(item));
  }

  if (typeof value === "object") {
    return Object.values(value).some((item) => hasSubmissionValue(item));
  }

  return Boolean(value);
};

export const getSubmissionPhotoId = (photo = {}) =>
  String(
    photo?.checklistId ||
      photo?.checklist_id ||
      photo?.requirementId ||
      photo?.requirement_id ||
      photo?.id ||
      ""
  ).trim();

/**
 * Checks all supported photo path fields used by local and server submissions.
 */
export const hasSubmissionPhoto = (photo = {}) =>
  hasSubmissionValue(photo?.uri) ||
  hasSubmissionValue(photo?.filePath) ||
  hasSubmissionValue(photo?.local_uri) ||
  hasSubmissionValue(photo?.objectKey) ||
  hasSubmissionValue(photo?.object_key);

const mapSnapshotRepeatableItemsToValues = (repeatableValue = null) => {
  if (!repeatableValue?.items?.length) {
    return [];
  }

  return repeatableValue.items.map((item = {}) =>
    (item.values || []).reduce((acc, field = {}) => {
      if (field?.key) {
        acc[field.key] = field.value ?? "";
      }
      return acc;
    }, {})
  );
};

/**
 * Resolves checklist 22 pipe-size entries from current values or the saved snapshot.
 */
export const resolvePedestalLinkedSizeEntries = ({
  repeatableGroups = [],
  activeValues = {},
  localSubmissionSnapshot = null,
} = {}) => {
  const sizeGroup = repeatableGroups.find(
    (group) =>
      String(group?.checklistId || "").trim() ===
      PED_ENCLOSURE_SIZE_CHECKLIST_ID
  );

  if (!sizeGroup) {
    return {
      sizeGroup: null,
      linkedSizeEntries: [],
    };
  }

  const currentItems = activeValues.repeatableGroups?.[sizeGroup.key] || [];
  const snapshotRepeatableValue = (
    localSubmissionSnapshot?.payload?.repeatableValues || []
  ).find(
    (item) =>
      String(item?.checklist_id || item?.checklistId || item?.id || "").trim() ===
      PED_ENCLOSURE_SIZE_CHECKLIST_ID
  );
  const snapshotItems = mapSnapshotRepeatableItemsToValues(
    snapshotRepeatableValue
  );
  const sourceItems = currentItems.length ? currentItems : snapshotItems;

  return {
    sizeGroup,
    linkedSizeEntries: sourceItems
      .map((item = {}, itemIndex = 0) => ({
        itemIndex: itemIndex + 1,
        subChakName: String(item.subChakName || "").trim(),
        pipeSize: String(item.pipeSize || "").trim(),
      }))
      .filter((item) => item.subChakName || item.pipeSize),
  };
};

/**
 * Validates pedestal completion against the merged current, local, and server state.
 */
export const validatePedestalEnclosureSubmission = ({
  activeSubOption = {},
  activeValues = {},
  checklistItems = [],
  photoRequirements = [],
  localSubmissionSnapshot = null,
  progressMatch = null,
} = {}) => {
  if (activeSubOption.id !== PED_ENCLOSURE_SUBOPTION_ID) {
    return {
      isRelevant: false,
      isComplete: false,
      errorMessage: "",
    };
  }

  const snapshotPayload = localSubmissionSnapshot?.payload || {};
  const progressSubprocess = progressMatch?.subprocess || null;
  const progressChecklistsById = new Map(
    (progressSubprocess?.checklists || []).map((item) => [String(item.id), item])
  );
  const progressChecklistsByName = new Map(
    (progressSubprocess?.checklists || []).map((item) => [
      normalizeText(item.name),
      item,
    ])
  );
  const currentChecklistIds = new Set();
  const snapshotChecklistIds = new Set();
  const currentPhotoIds = new Set();
  const snapshotPhotoIds = new Set();
  const progressPhotoIds = new Set();

  checklistItems.forEach((item) => {
    const checklistId = getSubmissionChecklistId(item);

    if (item?.id && activeValues.checks?.[item.id]) {
      currentChecklistIds.add(checklistId);
    }
  });

  (snapshotPayload.checklist || []).forEach((entry) => {
    if (!hasSubmissionValue(entry?.checked ?? entry?.response ?? entry?.value)) {
      return;
    }

    const checklistId = getSubmissionChecklistId(entry);

    if (checklistId) {
      snapshotChecklistIds.add(checklistId);
    }
  });

  photoRequirements.forEach((requirement) => {
    const checklistId = String(
      requirement?.checklistId || requirement?.id || ""
    ).trim();
    const media = activeValues.photos?.[requirement.id];

    if (checklistId && hasSubmissionPhoto(media)) {
      currentPhotoIds.add(checklistId);
    }

    const progressChecklist = findProgressChecklistMatch(
      progressChecklistsById,
      progressChecklistsByName,
      requirement,
      requirement?.label || ""
    );
    const progressChecklistId = String(
      progressChecklist?.id ||
        progressChecklist?.checklist_id ||
        progressChecklist?.checklistId ||
        checklistId ||
        ""
    ).trim();
    const serverPhotoValue =
      progressChecklist?.detail?.rawValue ??
      progressChecklist?.detail?.value ??
      progressChecklist?.rawChecklist?.value ??
      progressChecklist?.rawChecklist?.objectKey ??
      "";

    if (progressChecklistId && hasMeaningfulServerValue(serverPhotoValue)) {
      progressPhotoIds.add(progressChecklistId);
    }
  });

  (snapshotPayload.photos || []).forEach((photo) => {
    const checklistId = getSubmissionPhotoId(photo);

    if (checklistId && hasSubmissionPhoto(photo)) {
      snapshotPhotoIds.add(checklistId);
    }
  });

  const mergedChecklistIds = new Set([
    ...currentChecklistIds,
    ...snapshotChecklistIds,
  ]);
  const mergedPhotoIds = new Set([
    ...currentPhotoIds,
    ...snapshotPhotoIds,
    ...progressPhotoIds,
  ]);

  // Completion uses merged state so earlier partial submissions remain valid.
  const isMandatoryChecklistComplete =
    PED_ENCLOSURE_REQUIRED_CHECKLIST_IDS.every((id) =>
      mergedChecklistIds.has(id)
    );
  const isCompletionPhotoSetComplete = PED_ENCLOSURE_COMPLETION_PHOTO_IDS.every(
    (id) => mergedPhotoIds.has(id)
  );

  let errorMessage = "";

  // Return the earliest missing dependency so the UI can highlight one clear action.
  if (mergedPhotoIds.has("99") && !mergedChecklistIds.has("20")) {
    errorMessage =
      "Checklist 20 is required because the inlet and outlet pipeline connections photo is uploaded.";
  } else if (mergedPhotoIds.has("100") && !mergedChecklistIds.has("23")) {
    errorMessage = "Checklist 23 is required because photo 100 is uploaded.";
  } else if (mergedPhotoIds.has("25") && !mergedChecklistIds.has("97")) {
    errorMessage = "Checklist 97 is required because photo 25 is uploaded.";
  } else if (
    mergedChecklistIds.has("20") &&
    !mergedPhotoIds.has(PHOTO_REQUIRED_BY_CHECKLIST_ID["20"])
  ) {
    errorMessage =
      "Full photo of inlet and outlet pipeline connections is required because checklist 20 is completed.";
  } else if (mergedChecklistIds.has("23") && !mergedPhotoIds.has("100")) {
    errorMessage = "Photo 100 is required because checklist 23 is completed.";
  } else if (
    mergedChecklistIds.has("97") &&
    !mergedPhotoIds.has("25")
  ) {
    errorMessage = "Photo 25 is required because checklist 97 is completed.";
  } else if (isMandatoryChecklistComplete && !isCompletionPhotoSetComplete) {
    if (!mergedPhotoIds.has("99")) {
      errorMessage =
        "Full photo of inlet and outlet pipeline connections is required because checklist 20 is completed.";
    } else if (!mergedPhotoIds.has("100")) {
      errorMessage = "Photo 100 is required because checklist 23 is completed.";
    } else if (!mergedPhotoIds.has("25")) {
      errorMessage = "Photo 25 is required because checklist 97 is completed.";
    } else if (!mergedPhotoIds.has("26")) {
      errorMessage =
        "Signed checklist photo 26 is required to complete Pedestal & Enclosure.";
    }
  }

  return {
    isRelevant: true,
    isComplete: isMandatoryChecklistComplete && isCompletionPhotoSetComplete,
    errorMessage,
  };
};

/**
 * Resolves a pedestal photo using current form, local snapshot, then server progress.
 */
export const resolvePedestalPhotoMedia = ({
  checklistId,
  requirementId,
  activeValues = {},
  localSubmissionSnapshot = null,
  progressMatch = null,
} = {}) => {
  const currentMedia = requirementId
    ? activeValues.photos?.[requirementId] || null
    : null;

  if (hasSubmissionPhoto(currentMedia)) {
    return currentMedia;
  }

  const snapshotPhoto = (localSubmissionSnapshot?.payload?.photos || []).find(
    (photo) =>
      getSubmissionPhotoId(photo) === String(checklistId || "").trim()
  );

  if (hasSubmissionPhoto(snapshotPhoto)) {
    return snapshotPhoto;
  }

  const progressSubprocess = progressMatch?.subprocess || null;
  const progressChecklistsById = new Map(
    (progressSubprocess?.checklists || []).map((item) => [String(item.id), item])
  );
  const progressChecklistsByName = new Map(
    (progressSubprocess?.checklists || []).map((item) => [
      normalizeText(item.name),
      item,
    ])
  );
  const progressChecklist = findProgressChecklistMatch(
    progressChecklistsById,
    progressChecklistsByName,
    { checklistId },
    ""
  );
  const serverPhotoValue =
    progressChecklist?.detail?.rawValue ??
    progressChecklist?.detail?.value ??
    progressChecklist?.rawChecklist?.value ??
    progressChecklist?.rawChecklist?.objectKey ??
    "";

  if (!hasMeaningfulServerValue(serverPhotoValue)) {
    return null;
  }

  return {
    uri: resolveServerPhotoUri(
      serverPhotoValue,
      progressChecklist?.rawChecklist?.objectKey || ""
    ),
    filePath: "",
    source: "server",
    objectKey: progressChecklist?.rawChecklist?.objectKey || "",
  };
};
