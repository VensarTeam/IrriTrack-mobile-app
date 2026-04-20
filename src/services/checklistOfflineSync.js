import NetInfo from "@react-native-community/netinfo";
import RNFS from "react-native-fs";
import SQLite from "react-native-sqlite-storage";
import { CHECKLIST_SUBMIT_PATH } from "../config/env";
import { apiRequest } from "./apiClient";

SQLite.enablePromise(true);

const DB_NAME = "pmt_offline_checklists.db";
const ROOT_DIR_NAME = "pmt-offline-checklists";
const SYNCABLE_STATUSES = ["queued", "failed", "syncing"];

let databasePromise = null;
let schemaPromise = null;
let queueLock = Promise.resolve();
let syncPromise = null;

const getRootDir = () => `${RNFS.DocumentDirectoryPath}/${ROOT_DIR_NAME}`;
const getPhotoRootDir = () => `${getRootDir()}/photos`;
const getSubmissionPhotoDir = (submissionId) =>
  `${getPhotoRootDir()}/${submissionId}`;

const withQueueLock = async (work) => {
  const run = queueLock.then(work, work);
  queueLock = run.catch(() => {});
  return run;
};

const getDatabase = async () => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabase({
      name: DB_NAME,
      location: "default",
    });
  }

  const db = await databasePromise;

  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS checklist_submission_queue (
          id TEXT PRIMARY KEY NOT NULL,
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
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_checklist_submission_queue_status
        ON checklist_submission_queue(status, created_at);
      `);
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS checklist_process_master_cache (
          id TEXT PRIMARY KEY NOT NULL,
          device_type TEXT NOT NULL,
          active_only INTEGER NOT NULL DEFAULT 1,
          processes_json TEXT NOT NULL,
          refreshed_at TEXT NOT NULL
        );
      `);
    })();
  }

  await schemaPromise;
  return db;
};

const ensureDirectory = async (path) => {
  const exists = await RNFS.exists(path);

  if (!exists) {
    await RNFS.mkdir(path);
  }
};

const ensureStorage = async () => {
  await ensureDirectory(getRootDir());
  await ensureDirectory(getPhotoRootDir());
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

const toFileUri = (path = "") =>
  String(path).startsWith("file://") ? path : `file://${path}`;

const inferMimeType = (photo = {}) => {
  if (photo.type && photo.type.includes("/")) {
    return photo.type;
  }

  if (photo.mimeType) {
    return photo.mimeType;
  }

  if (photo.mediaType === "video") {
    return "video/mp4";
  }

  return "image/jpeg";
};

const copySubmissionPhotos = async (submissionId, photos = []) => {
  const photoDir = getSubmissionPhotoDir(submissionId);
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
        await RNFS.unlink(targetPath);
      }

      await RNFS.copyFile(sourcePath, targetPath);

      return {
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
      };
    })
  );
};

const deleteSubmissionPhotos = async (submissionId) => {
  try {
    const photoDir = getSubmissionPhotoDir(submissionId);

    if (await RNFS.exists(photoDir)) {
      await RNFS.unlink(photoDir);
    }
  } catch (error) {
    console.warn("Unable to remove synced checklist photos", error);
  }
};

const sortBySequence = (items = []) =>
  [...items].sort((a, b) => (a.seq_no || 0) - (b.seq_no || 0));

const normalizeProcessMaster = (processes = []) =>
  sortBySequence(processes).map((process) => ({
    ...process,
    subprocesses: sortBySequence(process.subprocesses || []),
  }));

const canUseNetwork = async () => {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected) && state.isInternetReachable !== false;
};

export const fetchChecklistProcessMaster = async ({
  deviceType = "OMS",
  activeOnly = true,
} = {}) =>
  normalizeProcessMaster(
    await apiRequest({
      url: "/api/v1/master/processes",
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

export const refreshChecklistProcessMaster = async ({
  deviceType = "OMS",
  activeOnly = true,
} = {}) => {
  const processes = await fetchChecklistProcessMaster({ deviceType, activeOnly });
  const refreshedAt = new Date().toISOString();
  const db = await getDatabase();

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
    return [];
  }

  try {
    return JSON.parse(result.rows.item(0).processes_json || "[]");
  } catch (error) {
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
  let processes = await getCachedChecklistProcessMaster({ deviceType });

  if (!processes.length && (await canUseNetwork())) {
    try {
      processes = await refreshChecklistProcessMaster({ deviceType });
    } catch (error) {
      processes = [];
    }
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

  return {
    process_id: process?.process_id || null,
    process_description: process?.description || section?.title || "",
    subprocess_id: subprocess?.subprocess_id || null,
    subprocess_description: subprocess?.description || subOption?.label || "",
  };
};

const getProcessReferenceFromDescriptions = async ({
  deviceType,
  processDescription,
  subprocessDescription,
}) => {
  let processes = await getCachedChecklistProcessMaster({ deviceType });

  if (!processes.length && (await canUseNetwork())) {
    try {
      processes = await refreshChecklistProcessMaster({ deviceType });
    } catch (error) {
      processes = [];
    }
  }

  const process = findByDescription(processes, [processDescription]);
  const subprocess = findByDescription(process?.subprocesses || [], [
    subprocessDescription,
  ]);

  return {
    process_id: process?.process_id || null,
    process_description: process?.description || processDescription || "",
    subprocess_id: subprocess?.subprocess_id || null,
    subprocess_description:
      subprocess?.description || subprocessDescription || "",
  };
};

const enrichProcessReference = async (submission) => {
  if (submission.payload?.process_id && submission.payload?.subprocess_id) {
    return submission;
  }

  const processReference = await getProcessReferenceFromDescriptions({
    deviceType: submission.deviceType || submission.payload?.deviceType,
    processDescription: submission.payload?.process_description,
    subprocessDescription: submission.payload?.subprocess_description,
  });

  if (!processReference.process_id && !processReference.subprocess_id) {
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

  await db.executeSql(
    `
      INSERT OR REPLACE INTO checklist_submission_queue
        (
          id,
          status,
          device_type,
          created_at,
          updated_at,
          last_attempt_at,
          last_error,
          attempts,
          payload_json
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      submission.id,
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
  const [result] = await db.executeSql(
    `
      SELECT *
      FROM checklist_submission_queue
      WHERE id = ?
      LIMIT 1;
    `,
    [submissionId]
  );

  return result.rows.length ? parseQueueRow(result.rows.item(0)) : null;
};

const getSyncCandidates = async ({ submissionIds = null, maxItems = Infinity }) => {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `
      SELECT *
      FROM checklist_submission_queue
      WHERE status IN (?, ?, ?)
      ORDER BY created_at ASC;
    `,
    SYNCABLE_STATUSES
  );
  const wantedIds = Array.isArray(submissionIds) ? new Set(submissionIds) : null;

  return rowsToArray(result.rows)
    .map(parseQueueRow)
    .filter((item) => !wantedIds || wantedIds.has(item.id))
    .slice(0, maxItems);
};

export const enqueueChecklistSubmission = async ({
  deviceType,
  section,
  subOption,
  payload,
}) => {
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
    status: "queued",
    attempts: 0,
    deviceType,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: null,
    lastError: "",
    payload: {
      ...payload,
      ...processReference,
      photos,
    },
  };

  try {
    return await withQueueLock(() => saveQueuedSubmission(submission));
  } catch (error) {
    await deleteSubmissionPhotos(id);
    throw error;
  }
};

const updateQueuedSubmission = async (submissionId, updater) =>
  withQueueLock(async () => {
    const current = await getQueuedSubmission(submissionId);
    if (!current) return null;

    return saveQueuedSubmission(updater(current));
  });

const removeQueuedSubmission = async (submissionId) =>
  withQueueLock(async () => {
    const db = await getDatabase();

    await db.executeSql(
      "DELETE FROM checklist_submission_queue WHERE id = ?;",
      [submissionId]
    );
  });

const buildSubmissionFormData = (submission) => {
  const formData = new FormData();
  const photos = submission.payload.photos || [];
  const payload = {
    ...submission.payload,
    photos: photos.map((photo) => ({
      requirementId: photo.requirementId,
      requirementLabel: photo.requirementLabel,
      name: photo.name,
      type: photo.type,
      sizeKb: photo.sizeKb,
      width: photo.width,
      height: photo.height,
      mediaType: photo.mediaType,
      takenAt: photo.takenAt,
    })),
    offlineSubmissionId: submission.id,
    offlineCreatedAt: submission.createdAt,
  };

  formData.append("payload", JSON.stringify(payload));

  photos.forEach((photo) => {
    formData.append("photos", {
      uri: toFileUri(photo.filePath),
      name: photo.name || `${photo.requirementId || "photo"}.jpg`,
      type: inferMimeType(photo),
    });
  });

  return formData;
};

const submitQueuedChecklistSubmission = (submission) =>
  apiRequest(
    {
      url: CHECKLIST_SUBMIT_PATH,
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "multipart/form-data",
      },
      data: buildSubmissionFormData(submission),
    },
    {
      fallbackMessage: "Unable to sync checklist data. It will retry later.",
      networkMessage: "Network unavailable. Checklist data will retry later.",
    }
  );

const syncQueue = async ({ submissionIds = null, maxItems = Infinity } = {}) => {
  await ensureStorage();

  const result = {
    attempted: 0,
    synced: 0,
    failed: 0,
    skippedOffline: false,
    syncedIds: [],
    failedIds: [],
  };

  if (!(await canUseNetwork())) {
    result.skippedOffline = true;
    return result;
  }

  const candidates = await withQueueLock(() =>
    getSyncCandidates({ submissionIds, maxItems })
  );
  result.attempted = candidates.length;

  for (const candidate of candidates) {
    const attemptStartedAt = new Date().toISOString();
    let queuedItem = await updateQueuedSubmission(candidate.id, (item) => ({
      ...item,
      status: "syncing",
      attempts: (item.attempts || 0) + 1,
      lastAttemptAt: attemptStartedAt,
      updatedAt: attemptStartedAt,
      lastError: "",
    }));

    if (!queuedItem) {
      continue;
    }

    try {
      const enrichedItem = await enrichProcessReference(queuedItem);

      if (enrichedItem !== queuedItem) {
        queuedItem =
          (await updateQueuedSubmission(queuedItem.id, (item) => ({
            ...item,
            payload: enrichedItem.payload,
            updatedAt: new Date().toISOString(),
          }))) || enrichedItem;
      }

      await submitQueuedChecklistSubmission(queuedItem);
      await removeQueuedSubmission(queuedItem.id);
      await deleteSubmissionPhotos(queuedItem.id);
      result.synced += 1;
      result.syncedIds.push(queuedItem.id);
    } catch (error) {
      const failedAt = new Date().toISOString();
      await updateQueuedSubmission(queuedItem.id, (item) => ({
        ...item,
        status: "failed",
        updatedAt: failedAt,
        lastError: error?.message || "Sync failed",
      }));
      result.failed += 1;
      result.failedIds.push(queuedItem.id);
    }
  }

  return result;
};

export const syncQueuedChecklistSubmissions = (options = {}) => {
  if (!syncPromise) {
    syncPromise = syncQueue(options).finally(() => {
      syncPromise = null;
    });
  }

  return syncPromise;
};

export const submitChecklistOfflineFirst = async ({
  deviceType = "OMS",
  section,
  subOption,
  payload,
}) => {
  const submission = await enqueueChecklistSubmission({
    deviceType,
    section,
    subOption,
    payload,
  });
  const syncResult = await syncQueuedChecklistSubmissions({
    submissionIds: [submission.id],
    maxItems: 1,
  });

  return {
    submission,
    syncResult,
    synced: syncResult.syncedIds.includes(submission.id),
  };
};

export const getPendingChecklistSubmissionCount = async () => {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `
      SELECT COUNT(*) AS pending_count
      FROM checklist_submission_queue
      WHERE status IN (?, ?, ?);
    `,
    SYNCABLE_STATUSES
  );

  return Number(result.rows.item(0)?.pending_count || 0);
};
