import NetInfo from "@react-native-community/netinfo";
import RNFS from "react-native-fs";
import SQLite from "react-native-sqlite-storage";
import { API_ENDPOINTS } from "../config/env";
import { apiRequest } from "./apiClient";
import { submitOmsCommentedResubmission } from "./omsResubmitService";
import { removeCachedOmsWorkStatusSubmission } from "./workStatusOfflineStore";

SQLite.enablePromise(true);

const DB_NAME = "pmt_offline_checklists.db";
const ROOT_DIR_NAME = "pmt-offline-checklists";
const LOCAL_DRAFT_STATUSES = ["queued", "failed", "syncing", "draft_ready"];
const SYNCABLE_QUEUE_STATUSES = ["queued", "failed", "syncing", "draft_ready"];
const SUBMITTED_LOOKUP_STATUSES = [
  "queued",
  "failed",
  "syncing",
  "draft_ready",
];
const LOG_PREFIX = "[ChecklistLocal]";

let databasePromise = null;
let schemaPromise = null;
let queueLock = Promise.resolve();
let syncPromise = null;

const IMPORTANT_LOG_MESSAGES = [
  "Network state checked",
  "Offline-first submit requested",
  "Submitting checklist to API",
  "Offline-first submit finished via API",
  "Queueing checklist submission",
  "Checklist submission queued locally",
  "Offline-first submit finished with local draft fallback",
  "Checking local checklist drafts",
  "Local draft candidates selected",
  "Submitting queued checklist",
  "Queued checklist synced",
  "Checklist queue sync finished",
  "Pending checklist submission count",
];

const shouldLogSyncMessage = (message = "") =>
  IMPORTANT_LOG_MESSAGES.some((item) => String(message).startsWith(item));

const logSync = (message, details = undefined) => {
  if (!shouldLogSyncMessage(message)) {
    return;
  }

  if (typeof details === "undefined") {
    //console.log(LOG_PREFIX, message);
    return;
  }

  //console.log(LOG_PREFIX, message, details);
};

const warnSync = (message, error) => {
  // console.warn(LOG_PREFIX, message, {
  //   message: error?.message || String(error),
  //   code: error?.code,
  //   status: error?.status,
  // });
};

const getOwnerUserId = (value = "") => String(value || "").trim();

const getPayloadSummary = (payload = {}) => ({
  ownerUserId: payload.local_owner_user_id || "",
  unitNo: payload.unitNo,
  sectionKey: payload.sectionKey,
  subOptionId: payload.subOptionId,
  processId: payload.process_id,
  subprocessId: payload.subprocess_id,
  answerCount: payload.answers?.length || 0,
  checklistCount: payload.checklist?.length || 0,
  photoCount: payload.photos?.length || 0,
  selectCount: payload.selectValues?.length || 0,
  inputCount: payload.inputValues?.length || 0,
});

const getRootDir = () => `${RNFS.DocumentDirectoryPath}/${ROOT_DIR_NAME}`;
const getPhotoRootDir = () => `${getRootDir()}/photos`;
const getDraftRootDir = () => `${getRootDir()}/submit-drafts`;
const getSubmissionPhotoDir = (submissionId) =>
  `${getPhotoRootDir()}/${submissionId}`;
const getSubmissionDraftPath = (submissionId) =>
  `${getDraftRootDir()}/${submissionId}.json`;

const withQueueLock = async (work) => {
  const run = queueLock.then(work, work);
  queueLock = run.catch(() => {});
  return run;
};

const getDatabase = async () => {
  if (!databasePromise) {
    logSync("Opening SQLite database", { name: DB_NAME, location: "default" });
    databasePromise = SQLite.openDatabase({
      name: DB_NAME,
      location: "default",
    });
  }

  const db = await databasePromise;

  if (!schemaPromise) {
    schemaPromise = (async () => {
      logSync("Initializing SQLite schema");
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS checklist_submission_queue (
          id TEXT PRIMARY KEY NOT NULL,
          owner_user_id TEXT,
          status TEXT NOT NULL,
          device_type TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_attempt_at TEXT,
          last_error TEXT,
          attempts INTEGER NOT NULL DEFAULT 0,
          payload_json TEXT NOT NULL
        );
      `);
      try {
        await db.executeSql(`
          ALTER TABLE checklist_submission_queue
          ADD COLUMN owner_user_id TEXT;
        `);
      } catch (error) {
        const message = String(error?.message || "").toLowerCase();
        if (!message.includes("duplicate column")) {
          throw error;
        }
      }
      logSync("Ready table", { table: "checklist_submission_queue" });
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_checklist_submission_queue_status
        ON checklist_submission_queue(status, created_at);
      `);
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_checklist_submission_queue_owner_status
        ON checklist_submission_queue(owner_user_id, status, created_at);
      `);
      logSync("Ready index", {
        index: "idx_checklist_submission_queue_status",
      });
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS checklist_process_master_cache (
          id TEXT PRIMARY KEY NOT NULL,
          device_type TEXT NOT NULL,
          active_only INTEGER NOT NULL DEFAULT 1,
          processes_json TEXT NOT NULL,
          refreshed_at TEXT NOT NULL
        );
      `);
      logSync("Ready table", { table: "checklist_process_master_cache" });
    })();
  }

  await schemaPromise;
  logSync("SQLite database ready", { name: DB_NAME });
  return db;
};

const ensureDirectory = async (path) => {
  const exists = await RNFS.exists(path);

  if (!exists) {
    logSync("Creating local directory", { path });
    await RNFS.mkdir(path);
  } else {
    logSync("Local directory exists", { path });
  }
};

const ensureStorage = async () => {
  //logSync("Ensuring local storage directories");
  await ensureDirectory(getRootDir());
  await ensureDirectory(getPhotoRootDir());
  await ensureDirectory(getDraftRootDir());
};

const normalizeText = (value) =>
  String(value || "")
    .replace(/&/g, "and")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const createSubmissionId = () =>
  `checklist_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const getCacheId = (deviceType = "OMS", activeOnly = true) =>
  `${deviceType}:${activeOnly ? 1 : 0}`;

const rowsToArray = (rows) =>
  Array.from({ length: rows.length }, (_, index) => rows.item(index));

const parseQueueRow = (row) => ({
  id: row.id,
  ownerUserId: getOwnerUserId(row.owner_user_id),
  status: row.status,
  deviceType: row.device_type,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastAttemptAt: row.last_attempt_at,
  lastError: row.last_error || "",
  attempts: Number(row.attempts || 0),
  payload: JSON.parse(row.payload_json || "{}"),
});

const getFileExtension = (photo = {}) => {
  const source = `${photo.name || photo.fileName || photo.filePath || photo.uri || ""}`;
  const match = source.match(/\.([a-zA-Z0-9]{2,5})(?:\?.*)?$/);

  if (match?.[1]) {
    return match[1].toLowerCase();
  }

  return photo.mediaType === "video" ? "mp4" : "jpg";
};

const sanitizeFileName = (value) =>
  String(value || "photo")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 90) || "photo";

const stripFileScheme = (uri = "") => String(uri).replace(/^file:\/\//, "");

const inferMimeType = (photo = {}) => {
  if (photo.type && photo.type.includes("/")) {
    return photo.type;
  }

  if (photo.mimeType) {
    return photo.mimeType;
  }

  if (photo.mime_type) {
    return photo.mime_type;
  }

  if (photo.mediaType === "video" || photo.media_type === "video") {
    return "video/mp4";
  }

  return "image/jpeg";
};

const copySubmissionPhotos = async (submissionId, photos = []) => {
  const photoDir = getSubmissionPhotoDir(submissionId);
  //logSync("Preparing local photo storage", {
  //  submissionId,
  //  photoDir,
  //  photoCount: photos.length,
  //});
  await ensureDirectory(photoDir);

  return Promise.all(
    photos.map(async (photo, index) => {
      const extension = getFileExtension(photo);
      const baseName = sanitizeFileName(
        photo.name || `${photo.requirementId || "photo"}_${index + 1}`
      ).replace(/\.[a-zA-Z0-9]{2,5}$/, "");
      const targetPath = `${photoDir}/${index + 1}_${baseName}.${extension}`;
      const sourcePath = stripFileScheme(photo.filePath || photo.uri);

      if (await RNFS.exists(targetPath)) {
        //logSync("Replacing existing local photo file", {
        //  submissionId,
        //  targetPath,
        //});
        await RNFS.unlink(targetPath);
      }

      //logSync("Copying photo into local storage", {
      //  submissionId,
      //  requirementId: photo.requirementId,
      //  sourcePath,
      //  targetPath,
      //  sizeKb: photo.sizeKb,
      //});
      await RNFS.copyFile(sourcePath, targetPath);

      return {
        checklistId: photo.checklistId || null,
        requirementId: photo.requirementId,
        requirementLabel: photo.requirementLabel,
        filePath: targetPath,
        name: `${baseName}.${extension}`,
        type: inferMimeType(photo),
        sizeKb: photo.sizeKb,
        width: photo.width,
        height: photo.height,
        mediaType: photo.mediaType || "image",
        takenAt: photo.takenAt,
        latitude: photo.latitude ?? null,
        longitude: photo.longitude ?? null,
      };
    })
  );
};

const deleteSubmissionDraft = async (submissionId) => {
  try {
    const draftPath = getSubmissionDraftPath(submissionId);

    if (await RNFS.exists(draftPath)) {
      //logSync("Deleting local draft JSON", { submissionId, draftPath });
      await RNFS.unlink(draftPath);
    }
  } catch (error) {
    warnSync("Unable to remove synced checklist draft", error);
  }
};

const deleteSubmissionPhotos = async (submissionId) => {
  try {
    const photoDir = getSubmissionPhotoDir(submissionId);

    if (await RNFS.exists(photoDir)) {
      //logSync("Deleting local photos", { submissionId, photoDir });
      await RNFS.unlink(photoDir);
    } else {
      //logSync("No local photo directory to delete", { submissionId, photoDir });
    }
  } catch (error) {
    warnSync("Unable to remove synced checklist photos", error);
  }
};

const sortBySequence = (items = []) =>
  [...items].sort((a, b) => (a.seq_no || 0) - (b.seq_no || 0));

const normalizeProcessMaster = (processes = []) =>
  sortBySequence(processes)
    .filter((process) => process?.is_active !== false)
    .map((process) => ({
      ...process,
      subprocesses: sortBySequence(process.subprocesses || [])
        .filter((subprocess) => subprocess?.is_active !== false)
        .map((subprocess) => ({
          ...subprocess,
          checklists: sortBySequence(subprocess.checklists || []).filter(
            (checklist) => checklist?.is_active !== false
          ),
        })),
    }));

const canUseNetwork = async () => {
  const state = await NetInfo.fetch();
  const online =
    state.isInternetReachable === true || state.isConnected !== false;
  //logSync("Network state checked", {
  //  isConnected: state.isConnected,
  //  isInternetReachable: state.isInternetReachable,
  //  type: state.type,
  //  online,
  //});
  return online;
};

const shouldFallbackToOfflineSubmission = (error) =>
  error?.code === "NETWORK_ERROR" ||
  error?.status === 0 ||
  error?.message === "Network Error";

const isCommentedResubmissionPayload = (payload = {}) =>
  String(payload?.submission_mode || "")
    .trim()
    .toLowerCase() === "commented_resubmit" &&
  String(payload?.resubmit_submission_id || "").trim();

const removeSyncedCommentedWorkStatusCache = async (payload = {}) => {
  if (!isCommentedResubmissionPayload(payload)) {
    return;
  }

  await removeCachedOmsWorkStatusSubmission({
    ownerUserId: payload.local_owner_user_id || "",
    projectId: payload.projectId || payload.unit?.project_id || "",
    submissionId: payload.resubmit_submission_id || "",
  });
};

export const fetchChecklistProcessMaster = async ({
  deviceType = "OMS",
  activeOnly = true,
} = {}) => {
  //logSync("Fetching process master from API", { deviceType, activeOnly });
  const processes = normalizeProcessMaster(
    await apiRequest({
      url: API_ENDPOINTS.masterProcesses,
      method: "GET",
      headers: {
        Accept: "*/*",
      },
      params: {
        deviceType,
        activeOnly,
      },
    })
  );
  logSync("Fetched process master from API", {
    deviceType,
    activeOnly,
    processCount: processes.length,
    subprocessCount: processes.reduce(
      (count, process) => count + (process.subprocesses?.length || 0),
      0
    ),
  });
  return processes;
};

export const refreshChecklistProcessMaster = async ({
  deviceType = "OMS",
  activeOnly = true,
} = {}) => {
  const processes = await fetchChecklistProcessMaster({ deviceType, activeOnly });
  const refreshedAt = new Date().toISOString();
  const db = await getDatabase();

  // logSync("Saving process master cache to SQLite", {
  //   deviceType,
  //   activeOnly,
  //   processCount: processes.length,
  //   refreshedAt,
  // });
  await db.executeSql(
    `
      INSERT OR REPLACE INTO checklist_process_master_cache
        (id, device_type, active_only, processes_json, refreshed_at)
      VALUES (?, ?, ?, ?, ?);
    `,
    [
      getCacheId(deviceType, activeOnly),
      deviceType,
      activeOnly ? 1 : 0,
      JSON.stringify(processes),
      refreshedAt,
    ]
  );

  return processes;
};

export const getCachedChecklistProcessMaster = async ({
  deviceType = "OMS",
  activeOnly = true,
} = {}) => {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `
      SELECT processes_json
      FROM checklist_process_master_cache
      WHERE id = ?
      LIMIT 1;
    `,
    [getCacheId(deviceType, activeOnly)]
  );

  if (!result.rows.length) {
    logSync("Process master cache miss", { deviceType, activeOnly });
    return [];
  }

  try {
    const processes = JSON.parse(result.rows.item(0).processes_json || "[]");
    logSync("Process master cache hit", {
      deviceType,
      activeOnly,
      processCount: processes.length,
    });
    return processes;
  } catch (error) {
    warnSync("Unable to parse process master cache", error);
    return [];
  }
};

const findByDescription = (items = [], candidates = []) => {
  const normalizedCandidates = candidates.map(normalizeText).filter(Boolean);

  return items.find((item) =>
    normalizedCandidates.includes(normalizeText(item.description))
  );
};

const getProcessReference = async ({ deviceType, section, subOption }) => {
  const processes = await getCachedChecklistProcessMaster({ deviceType });

  if (!processes.length) {
    logSync("Process master cache empty while queueing checklist", {
      deviceType,
    });
  }

  const process = findByDescription(processes, [
    section?.apiDescription,
    section?.title,
    section?.cardLabel,
  ]);
  const subprocess = findByDescription(process?.subprocesses || [], [
    subOption?.apiDescription,
    subOption?.label,
  ]);

  const reference = {
    process_id: process?.process_id || null,
    process_description: process?.description || section?.title || "",
    subprocess_id: subprocess?.subprocess_id || null,
    subprocess_description: subprocess?.description || subOption?.label || "",
  };
  logSync("Resolved process reference", {
    deviceType,
    sectionKey: section?.key,
    subOptionId: subOption?.id,
    ...reference,
  });
  return reference;
};

const getProcessReferenceFromDescriptions = async ({
  deviceType,
  processDescription,
  subprocessDescription,
}) => {
  const processes = await getCachedChecklistProcessMaster({ deviceType });

  if (!processes.length) {
    logSync("Process master cache empty while preparing local draft", {
      deviceType,
    });
  }

  const process = findByDescription(processes, [processDescription]);
  const subprocess = findByDescription(process?.subprocesses || [], [
    subprocessDescription,
  ]);

  const reference = {
    process_id: process?.process_id || null,
    process_description: process?.description || processDescription || "",
    subprocess_id: subprocess?.subprocess_id || null,
    subprocess_description:
      subprocess?.description || subprocessDescription || "",
  };
  logSync("Resolved process reference from queued descriptions", reference);
  return reference;
};

const enrichProcessReference = async (submission) => {
  if (submission.payload?.process_id && submission.payload?.subprocess_id) {
    logSync("Queued submission already has process reference", {
      submissionId: submission.id,
      processId: submission.payload.process_id,
      subprocessId: submission.payload.subprocess_id,
    });
    return submission;
  }

  logSync("Enriching queued submission with process reference", {
    submissionId: submission.id,
    processDescription: submission.payload?.process_description,
    subprocessDescription: submission.payload?.subprocess_description,
  });
  const processReference = await getProcessReferenceFromDescriptions({
    deviceType: submission.deviceType || submission.payload?.deviceType,
    processDescription: submission.payload?.process_description,
    subprocessDescription: submission.payload?.subprocess_description,
  });

  if (!processReference.process_id && !processReference.subprocess_id) {
    logSync("Process reference still unavailable for queued submission", {
      submissionId: submission.id,
    });
    return submission;
  }

  return {
    ...submission,
    payload: {
      ...submission.payload,
      ...processReference,
    },
  };
};

const saveQueuedSubmission = async (submission) => {
  const db = await getDatabase();

  logSync("Saving queued submission to SQLite", {
    submissionId: submission.id,
    status: submission.status,
    attempts: submission.attempts,
    summary: getPayloadSummary(submission.payload),
    lastError: submission.lastError || "",
  });
  await db.executeSql(
    `
      INSERT OR REPLACE INTO checklist_submission_queue
        (
          id,
          owner_user_id,
          status,
          device_type,
          created_at,
          updated_at,
          last_attempt_at,
          last_error,
          attempts,
          payload_json
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      submission.id,
      getOwnerUserId(submission.ownerUserId),
      submission.status,
      submission.deviceType,
      submission.createdAt,
      submission.updatedAt,
      submission.lastAttemptAt,
      submission.lastError || "",
      submission.attempts || 0,
      JSON.stringify(submission.payload),
    ]
  );

  return submission;
};

const getQueuedSubmission = async (submissionId) => {
  const db = await getDatabase();
  logSync("Loading queued submission from SQLite", { submissionId });
  const [result] = await db.executeSql(
    `
      SELECT *
      FROM checklist_submission_queue
      WHERE id = ?
      LIMIT 1;
    `,
    [submissionId]
  );

  const submission = result.rows.length ? parseQueueRow(result.rows.item(0)) : null;
  logSync("Loaded queued submission from SQLite", {
    submissionId,
    found: !!submission,
    status: submission?.status,
    attempts: submission?.attempts,
  });
  return submission;
};

export const getLatestChecklistSubmissionSnapshot = async ({
  unitId,
  processId,
  subprocessId,
  ownerUserId = "",
} = {}) => {
  if (!unitId || !processId || !subprocessId) {
    return null;
  }

  const db = await getDatabase();
  const placeholders = SUBMITTED_LOOKUP_STATUSES.map(() => "?").join(", ");
  const [result] = await db.executeSql(
    `
      SELECT *
      FROM checklist_submission_queue
      WHERE status IN (${placeholders})
      ORDER BY updated_at DESC, created_at DESC;
    `,
    SUBMITTED_LOOKUP_STATUSES
  );

  const targetUnitId = String(unitId);
  const targetProcessId = Number(processId);
  const targetSubprocessId = Number(subprocessId);
  const targetOwnerUserId = getOwnerUserId(ownerUserId);

  return rowsToArray(result.rows)
    .map(parseQueueRow)
    .find((item) => {
      const payload = item.payload || {};

      return (
        (!targetOwnerUserId || !item.ownerUserId || item.ownerUserId === targetOwnerUserId) &&
        String(payload.unitId || payload.unit?.unit_id || "") === targetUnitId &&
        Number(payload.process_id) === targetProcessId &&
        Number(payload.subprocess_id) === targetSubprocessId
      );
    }) || null;
};

const getSyncCandidates = async ({
  submissionIds = null,
  maxItems = Infinity,
  ownerUserId = "",
}) => {
  const db = await getDatabase();
  logSync("Reading sync candidates from SQLite", {
    submissionIds,
    maxItems: Number.isFinite(maxItems) ? maxItems : "all",
  });
  const placeholders = SYNCABLE_QUEUE_STATUSES.map(() => "?").join(", ");
  const [result] = await db.executeSql(
    `
      SELECT *
      FROM checklist_submission_queue
      WHERE status IN (${placeholders})
      ORDER BY created_at ASC;
    `,
    SYNCABLE_QUEUE_STATUSES
  );
  const wantedIds = Array.isArray(submissionIds) ? new Set(submissionIds) : null;
  const targetOwnerUserId = getOwnerUserId(ownerUserId);

  const candidates = rowsToArray(result.rows)
    .map(parseQueueRow)
    .filter((item) => !targetOwnerUserId || !item.ownerUserId || item.ownerUserId === targetOwnerUserId)
    .filter((item) => !wantedIds || wantedIds.has(item.id))
    .slice(0, maxItems);
  logSync("Sync candidates ready", {
    count: candidates.length,
    ids: candidates.map((item) => item.id),
  });
  return candidates;
};

export const enqueueChecklistSubmission = async ({
  deviceType,
  section,
  subOption,
  payload,
  ownerUserId = "",
}) => {
  logSync("Queueing checklist submission", {
    deviceType,
    sectionKey: section?.key,
    subOptionId: subOption?.id,
    summary: getPayloadSummary(payload),
  });
  await ensureStorage();

  const id = createSubmissionId();
  const processReference = await getProcessReference({
    deviceType,
    section,
    subOption,
  });
  const photos = await copySubmissionPhotos(id, payload.photos || []);
  const now = new Date().toISOString();
  const submission = {
    id,
    ownerUserId: getOwnerUserId(ownerUserId),
    status: "queued",
    attempts: 0,
    deviceType,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: null,
    lastError: "",
    payload: {
      ...payload,
      local_owner_user_id: getOwnerUserId(ownerUserId),
      ...processReference,
      photos,
    },
  };

  try {
    const savedSubmission = await withQueueLock(() =>
      saveQueuedSubmission(submission)
    );
    logSync("Checklist submission queued locally", {
      submissionId: savedSubmission.id,
      summary: getPayloadSummary(savedSubmission.payload),
    });
    return savedSubmission;
  } catch (error) {
    warnSync("Failed to save queued submission; cleaning copied photos", error);
    await deleteSubmissionPhotos(id);
    throw error;
  }
};

const updateQueuedSubmission = async (submissionId, updater) =>
  withQueueLock(async () => {
    const current = await getQueuedSubmission(submissionId);
    if (!current) {
      logSync("Queued submission update skipped; row not found", {
        submissionId,
      });
      return null;
    }

    const nextSubmission = updater(current);
    logSync("Updating queued submission", {
      submissionId,
      fromStatus: current.status,
      toStatus: nextSubmission.status,
      attempts: nextSubmission.attempts,
      lastError: nextSubmission.lastError || "",
    });
    return saveQueuedSubmission(nextSubmission);
  });

const deleteQueuedSubmission = async (submissionId) =>
  withQueueLock(async () => {
    const db = await getDatabase();
    await db.executeSql(
      `
        DELETE FROM checklist_submission_queue
        WHERE id = ?;
      `,
      [submissionId]
    );
  });

export const buildChecklistSubmitJson = (submission) => {
  const photos = submission.payload?.photos || [];

  return {
    owner_user_id: getOwnerUserId(submission.ownerUserId),
    offline_submission_id: submission.id,
    offline_status: submission.status,
    offline_created_at: submission.createdAt,
    offline_updated_at: submission.updatedAt,
    submit_api_status: "not_connected",
    ...submission.payload,
    photos: photos.map((photo) => ({
      checklist_id: photo.checklistId || null,
      requirement_id: photo.requirementId,
      requirement_label: photo.requirementLabel,
      file_name: photo.name,
      file_path: photo.filePath,
      mime_type: inferMimeType(photo),
      size_kb: photo.sizeKb,
      width: photo.width,
      height: photo.height,
      media_type: photo.mediaType || "image",
      taken_at: photo.takenAt,
      latitude: photo.latitude ?? null,
      longitude: photo.longitude ?? null,
    })),
  };
};

const toChecklistApiValue = (value, fallback = "") => {
  if (value === null || typeof value === "undefined") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) || typeof value === "object") {
    return value;
  }

  return fallback;
};

const inferChecklistValueType = ({ item = {}, value, hasFile = false } = {}) => {
  const explicitValueType = item.valueType || item.value_type;

  if (typeof explicitValueType === "string" && explicitValueType.trim()) {
    return explicitValueType.trim();
  }

  if (hasFile) {
    return "file";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  if (value && typeof value === "object") {
    return "object";
  }

  const normalizedInputType = String(item.input_type || item.inputType || "")
    .trim()
    .toLowerCase();
  const normalizedDataType = String(item.data_type || item.dataType || "")
    .trim()
    .toLowerCase();

  if (normalizedInputType === "photo") {
    return "file";
  }

  if (
    ["number"].includes(normalizedInputType) ||
    ["int", "integer", "float", "double", "decimal", "number"].includes(
      normalizedDataType
    )
  ) {
    return "number";
  }

  return "string";
};

const toPositiveIntegerOrNull = (value) => {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue < 1) {
    return null;
  }

  return numericValue;
};

const isChecklistValueEmpty = (value) => {
  if (value === null || typeof value === "undefined") {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (typeof value === "boolean") {
    return false;
  }

  if (typeof value === "number") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    if (value.updated_location || value.default_location) {
      const location = value.updated_location || value.default_location;
      return !Number.isFinite(Number(location?.latitude)) ||
        !Number.isFinite(Number(location?.longitude));
    }

    return Object.keys(value).length === 0;
  }

  return false;
};

const buildOmsSubmissionChecklist = (payload = {}) => {
  if (Array.isArray(payload.answers) && payload.answers.length) {
    return payload.answers
      .filter((item) => item?.checklist_id)
      .filter((item) => {
        const explicitValueType = String(item?.valueType || item?.value_type || "")
          .trim()
          .toLowerCase();
        const inputType = String(item?.input_type || item?.inputType || "")
          .trim()
          .toLowerCase();
        const isFileAnswer = explicitValueType === "file" || inputType === "photo";
        const file = item?.file
          ? {
              ...item.file,
              filePath:
                item.file.file_path || item.file.filePath || item.file.local_uri,
              uri:
                item.file.local_uri || item.file.file_path || item.file.filePath,
            }
          : null;
        const fileUri = String(file?.filePath || file?.uri || "").trim();

        if (!isFileAnswer) {
          return true;
        }

        return Boolean(fileUri) || !isChecklistValueEmpty(item?.value);
      })
      .filter((item) => item?.is_required !== false || !isChecklistValueEmpty(item?.value))
      .map((item) => {
        const file = item?.file
          ? {
              ...item.file,
              filePath: item.file.file_path || item.file.filePath || item.file.local_uri,
              uri: item.file.local_uri || item.file.file_path || item.file.filePath,
              name: item.file.file_name || item.file.name,
              type: item.file.mime_type || item.file.mimeType || item.file.type,
              sizeKb: item.file.size_kb ?? item.file.sizeKb,
              width: item.file.width,
              height: item.file.height,
              mediaType: item.file.media_type || item.file.mediaType,
              takenAt: item.file.taken_at || item.file.takenAt,
              latitude: item.file.latitude ?? null,
              longitude: item.file.longitude ?? null,
            }
          : null;
        const value = file
          ? `__FILE_${item.checklist_id}__`
          : typeof item?.display_value === "string" &&
              typeof item?.value === "boolean"
            ? item.display_value
            : toChecklistApiValue(item?.value);

        return {
          checklistId: item.checklist_id,
          value,
          valueType: inferChecklistValueType({
            item,
            value: item?.value,
            hasFile: Boolean(file),
          }),
          ...(item.Pipelaid ? { Pipelaid: item.Pipelaid } : {}),
          file,
        };
      });
  }

  const checklistEntries = [];

  (payload.selectValues || []).forEach((item) => {
    if (!item?.checklist_id) return;

    checklistEntries.push({
      checklistId: item.checklist_id,
      value: toChecklistApiValue(item.value),
      valueType: inferChecklistValueType({ item, value: item.value }),
    });
  });

  (payload.inputValues || []).forEach((item) => {
    if (!item?.checklist_id) return;

    checklistEntries.push({
      checklistId: item.checklist_id,
      value: toChecklistApiValue(item.value),
      valueType: inferChecklistValueType({ item, value: item.value }),
    });
  });

  (payload.checklist || []).forEach((item) => {
    if (!item?.checklist_id) return;

    checklistEntries.push({
      checklistId: item.checklist_id,
      value: item.checked ? "Yes" : "No",
      valueType: "string",
      ...(item.Pipelaid ? { Pipelaid: item.Pipelaid } : {}),
    });
  });

  (payload.repeatableValues || []).forEach((item) => {
    if (!item?.checklist_id) return;

    checklistEntries.push({
      checklistId: item.checklist_id,
      value: (item.items || []).map((repeatableItem) =>
        (repeatableItem.values || []).reduce((acc, field) => {
          acc[field.key] = field.value;
          return acc;
        }, {})
      ),
      valueType: "array",
    });
  });

  (payload.photos || []).forEach((photo) => {
    if (!photo?.checklistId) return;

    checklistEntries.push({
      checklistId: photo.checklistId,
      value: `__FILE_${photo.checklistId}__`,
      valueType: "file",
      file: photo,
    });
  });

  return checklistEntries;
};

const buildOmsSubmissionBody = (payload = {}) => {
  const checklist = buildOmsSubmissionChecklist(payload);

  return {
    projectId:
      payload.projectId ||
      payload.project_id ||
      payload.projectid ||
      payload.unit?.project_id ||
      payload.unit?.projectId,
    omsId: payload.unitId || payload.omsId || payload.oms_id || payload.omsid,
    nodeNo: payload.unitNo || payload.nodeNo || payload.node_no,
    processId: toPositiveIntegerOrNull(payload.process_id),
    subprocessId: toPositiveIntegerOrNull(payload.subprocess_id),
    remark: payload.remark || "",
    checklist,
  };
};

const buildOmsSubmissionJsonBody = (body = {}) => ({
  projectId: body.projectId,
  omsId: body.omsId,
  nodeNo: body.nodeNo,
  processId: body.processId,
  subprocessId: body.subprocessId,
  remark: body.remark || "",
  checklist: (body.checklist || []).map((item) => ({
    checklistId: item.checklistId,
    value: item.value,
    valueType: item.valueType || "",
    ...(item.Pipelaid ? { Pipelaid: item.Pipelaid } : {}),
  })),
});

const buildOmsSubmissionFormData = (body = {}) => {
  const formData = new FormData();

  const payload = {
    projectId: body.projectId || null,
    omsId: body.omsId || null,
    nodeNo: body.nodeNo || "",
    processId: body.processId ?? null,
    subprocessId: body.subprocessId ?? null,
    remark: body.remark || "",
    checklist: (body.checklist || []).map((item) => ({
      checklistId: item.checklistId,
      value: item.value,
      ...(item.valueType ? { valueType: item.valueType } : {}),
      ...(item.Pipelaid ? { Pipelaid: item.Pipelaid } : {}),
    })),
  };

  formData.append("payload", JSON.stringify(payload));

  (body.checklist || []).forEach((item) => {
    if (!item.file) {
      return;
    }

    const fileUri = stripFileScheme(
      item.file.filePath || item.file.uri || item.file.local_uri || ""
    );

    if (!fileUri) {
      return;
    }

    formData.append(String(item.checklistId), {
      uri: `file://${fileUri}`,
      name:
        item.file.name ||
        item.file.file_name ||
        `checklist_${item.checklistId}.jpg`,
      type: inferMimeType(item.file),
    });
  });

  return formData;
};

const getOmsSubmissionPreview = (body = {}) => ({
  projectId: body.projectId || null,
  omsId: body.omsId || null,
  nodeNo: body.nodeNo || "",
  processId: body.processId ?? null,
  subprocessId: body.subprocessId ?? null,
  remark: body.remark || "",
  checklist: (body.checklist || []).map((item) => ({
    checklistId: item.checklistId,
    valueType: item.valueType || "",
    value: item.value,
    ...(item.Pipelaid ? { Pipelaid: item.Pipelaid } : {}),
    fileKey: item.file ? String(item.checklistId) : null,
    file: item.file
      ? {
          name:
            item.file.name ||
            item.file.file_name ||
            `checklist_${item.checklistId}.jpg`,
          path:
            item.file.filePath ||
            item.file.uri ||
            item.file.local_uri ||
            "",
          type: inferMimeType(item.file),
        }
      : null,
  })),
});

const submitOmsChecklistToApi = async (payload = {}) => {
  const body = buildOmsSubmissionBody(payload);
  const hasFiles = body.checklist.some((item) => Boolean(item.file));
  const data = hasFiles
    ? buildOmsSubmissionFormData(body)
    : buildOmsSubmissionJsonBody(body);

  logSync("Submitting checklist to API", {
    processId: body.processId,
    subprocessId: body.subprocessId,
    checklistCount: body.checklist.length,
    hasFiles,
  });
  console.log(
    "[ChecklistSubmit] Server payload",
    JSON.stringify(getOmsSubmissionPreview(body), null, 2)
  );

  return apiRequest({
    url: API_ENDPOINTS.omsSubmissions,
    method: "POST",
    headers: hasFiles
      ? {
          Accept: "*/*",
          "Content-Type": "multipart/form-data",
        }
      : {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
    data,
  });
};

const submitQueuedChecklistToApi = async (payload = {}) => {
  if (isCommentedResubmissionPayload(payload)) {
    return submitOmsCommentedResubmission({
      submissionId: payload.resubmit_submission_id,
      payload,
    });
  }

  return submitOmsChecklistToApi(payload);
};

const writeSubmissionDraftJson = async (submission) => {
  const draftJson = buildChecklistSubmitJson(submission);
  const draftPath = getSubmissionDraftPath(submission.id);

  await ensureDirectory(getDraftRootDir());
  await RNFS.writeFile(draftPath, JSON.stringify(draftJson, null, 2), "utf8");

  return {
    draftJson,
    draftPath,
  };
};

const prepareQueuedSubmissionDraft = async (submission) => {
  const enrichedSubmission = await enrichProcessReference(submission);
  const now = new Date().toISOString();
  const readySubmission = {
    ...enrichedSubmission,
    status: "draft_ready",
    updatedAt: now,
    lastAttemptAt: now,
    lastError: "",
  };
  const draft = await writeSubmissionDraftJson(readySubmission);
  const savedSubmission = await saveQueuedSubmission(readySubmission);

  return {
    submission: savedSubmission,
    ...draft,
  };
};

const syncQueue = async ({
  submissionIds = null,
  maxItems = Infinity,
  ownerUserId = "",
} = {}) => {
  logSync("Checking local checklist drafts", {
    submissionIds,
    maxItems: Number.isFinite(maxItems) ? maxItems : "all",
  });
  await ensureStorage();

  const result = {
    checked: 0,
    prepared: 0,
    synced: 0,
    failed: 0,
    skippedOffline: false,
    draftIds: [],
    draftPaths: [],
    failedIds: [],
    syncedIds: [],
    submitApiConnected: true,
  };

  if (!(await canUseNetwork())) {
    result.skippedOffline = true;
    logSync("Network offline; drafts stay local", result);
    return result;
  }

  const candidates = await withQueueLock(() =>
    getSyncCandidates({ submissionIds, maxItems, ownerUserId })
  );
  result.checked = candidates.length;
  logSync("Local draft candidates selected", {
    checked: result.checked,
    ids: candidates.map((item) => item.id),
  });

  for (const candidate of candidates) {
    logSync("Submitting queued checklist", {
      submissionId: candidate.id,
      status: candidate.status,
      summary: getPayloadSummary(candidate.payload),
    });

    try {
      await updateQueuedSubmission(candidate.id, (item) => ({
        ...item,
        status: "syncing",
        updatedAt: new Date().toISOString(),
        lastError: "",
      }));

      const response = await submitQueuedChecklistToApi(candidate.payload);
      const syncedAt = new Date().toISOString();

      await updateQueuedSubmission(candidate.id, (item) => ({
        ...item,
        status: "synced",
        updatedAt: syncedAt,
        lastAttemptAt: syncedAt,
        lastError: "",
      }));
      await removeSyncedCommentedWorkStatusCache(candidate.payload);
      await deleteSubmissionPhotos(candidate.id);
      await deleteSubmissionDraft(candidate.id);
      await deleteQueuedSubmission(candidate.id);

      result.synced += 1;
      result.syncedIds.push(candidate.id);
      logSync("Queued checklist synced", {
        submissionId: candidate.id,
        serverSubmissionId: response?.submissionId,
        statusLabel: response?.statusLabel,
      });
    } catch (error) {
      warnSync("Unable to sync queued submission; keeping draft local", error);
      const failedAt = new Date().toISOString();
      await updateQueuedSubmission(candidate.id, (item) => ({
        ...item,
        status: "failed",
        updatedAt: failedAt,
        lastError: error?.message || "Draft JSON failed",
      }));
      result.failed += 1;
      result.failedIds.push(candidate.id);
    }
  }

  //logSync("Checklist queue sync finished", result);
  return result;
};

export const syncQueuedChecklistSubmissions = (options = {}) => {
  if (syncPromise && options.ensureLatest) {
    return syncPromise.then(() => syncQueuedChecklistSubmissions({
      ...options,
      ensureLatest: false,
    }));
  }
  if (!syncPromise) {
    //logSync("Creating sync promise", options);
    syncPromise = syncQueue(options).finally(() => {
      //logSync("Sync promise settled");
      syncPromise = null;
    });
  } else {
    //logSync("Reusing active sync promise", options);
  }

  return syncPromise;
};

export const submitChecklistOfflineFirst = async ({
  deviceType = "OMS",
  section,
  subOption,
  payload,
  ownerUserId = "",
  offlineOnly = false,
  submissionMode = "submit",
  resubmitSubmissionId = "",
}) => {
  const normalizedSubmissionMode = String(submissionMode || "submit")
    .trim()
    .toLowerCase();
  const normalizedResubmitSubmissionId = String(
    resubmitSubmissionId || ""
  ).trim();
  const requestPayload =
    normalizedSubmissionMode === "commented_resubmit"
      ? {
          ...payload,
          submission_mode: "commented_resubmit",
          resubmit_submission_id: normalizedResubmitSubmissionId,
        }
      : payload;

  // logSync("Offline-first submit requested", {
  //   deviceType,
  //   sectionKey: section?.key,
  //   subOptionId: subOption?.id,
  //   offlineOnly,
  //   submissionMode: normalizedSubmissionMode,
  //   summary: getPayloadSummary(requestPayload),
  // });
  if (!offlineOnly && (await canUseNetwork())) {
    try {
      const response = await submitQueuedChecklistToApi(requestPayload);

      // logSync("Offline-first submit finished via API", {
      //   submitApiConnected: true,x
      //   serverSubmissionId: response?.submissionId,
      //   statusLabel: response?.statusLabel,
      // });
      await removeSyncedCommentedWorkStatusCache(requestPayload);
      return {
        submission: null,
        draftJson: null,
        draftJsonPath: "",
        syncResult: {
          checked: 1,
          prepared: 0,
          synced: 1,
          failed: 0,
          skippedOffline: false,
          draftIds: [],
          draftPaths: [],
          syncedIds: [response?.submissionId].filter(Boolean),
          submitApiConnected: true,
        },
        synced: true,
        response,
      };
    } catch (error) {
      if (!shouldFallbackToOfflineSubmission(error)) {
        warnSync("API submit failed while online; not falling back to offline", error);
        throw error;
      }

      warnSync("API submit failed due to connectivity; falling back to offline queue", error);
    }
  }

  const submission = await enqueueChecklistSubmission({
    deviceType,
    section,
    subOption,
    payload: requestPayload,
    ownerUserId,
  });
  const draft = await prepareQueuedSubmissionDraft(submission);

  logSync("Offline-first submit finished with local draft fallback", {
    submissionId: draft.submission.id,
    draftPath: draft.draftPath,
    submitApiConnected: false,
  });
  return {
    submission: draft.submission,
    draftJson: draft.draftJson,
    draftJsonPath: draft.draftPath,
    syncResult: {
      checked: 1,
      prepared: 1,
      synced: 0,
      failed: 0,
      skippedOffline: false,
      draftIds: [draft.submission.id],
      draftPaths: [draft.draftPath],
      syncedIds: [],
      submitApiConnected: false,
    },
    synced: false,
    response: null,
  };
};

export const getPendingChecklistSubmissionCount = async ({
  ownerUserId = "",
} = {}) => {
  const db = await getDatabase();
  const targetOwnerUserId = getOwnerUserId(ownerUserId);
  const [result] = targetOwnerUserId
    ? await db.executeSql(
        `
          SELECT COUNT(*) AS pending_count
          FROM checklist_submission_queue
          WHERE (owner_user_id = ? OR owner_user_id = '' OR owner_user_id IS NULL)
            AND status IN (?, ?, ?, ?);
        `,
        [targetOwnerUserId, ...LOCAL_DRAFT_STATUSES]
      )
    : await db.executeSql(
        `
          SELECT COUNT(*) AS pending_count
          FROM checklist_submission_queue
          WHERE status IN (?, ?, ?, ?);
        `,
        LOCAL_DRAFT_STATUSES
      );

  const pendingCount = Number(result.rows.item(0)?.pending_count || 0);
  // logSync("Pending checklist submission count", {
  //   pendingCount,
  //   ownerUserId: targetOwnerUserId,
  // });
  return pendingCount;
};

export const getPendingChecklistSubmissionSummaries = async ({
  ownerUserId = "",
} = {}) => {
  const db = await getDatabase();
  const targetOwnerUserId = getOwnerUserId(ownerUserId);
  const placeholders = LOCAL_DRAFT_STATUSES.map(() => "?").join(", ");
  const ownerCondition = targetOwnerUserId
    ? "(owner_user_id = ? OR owner_user_id = '' OR owner_user_id IS NULL) AND "
    : "";
  const params = targetOwnerUserId
    ? [targetOwnerUserId, ...LOCAL_DRAFT_STATUSES]
    : LOCAL_DRAFT_STATUSES;
  const [result] = await db.executeSql(
    `SELECT id, status, last_error, attempts
     FROM checklist_submission_queue
     WHERE ${ownerCondition}status IN (${placeholders})
     ORDER BY created_at ASC;`,
    params
  );
  return rowsToArray(result.rows).map((row) => ({
    id: row.id,
    state: row.status,
    lastError: row.last_error || "",
    attempts: Number(row.attempts || 0),
  }));
};
