import NetInfo from "@react-native-community/netinfo";
import RNFS from "react-native-fs";
import SQLite from "react-native-sqlite-storage";
import { apiRequest } from "./apiClient";

SQLite.enablePromise(true);

const DB_NAME = "pmt_offline_checklists.db";
const ROOT_DIR_NAME = "pmt-offline-checklists";
const LOCAL_DRAFT_STATUSES = ["queued", "failed", "syncing", "draft_ready"];
const PREPARE_DRAFT_STATUSES = ["queued", "failed", "syncing"];
const LOG_PREFIX = "[ChecklistLocal]";

let databasePromise = null;
let schemaPromise = null;
let queueLock = Promise.resolve();
let syncPromise = null;

const logSync = (message, details = undefined) => {
  if (typeof details === "undefined") {
    console.log(LOG_PREFIX, message);
    return;
  }

  console.log(LOG_PREFIX, message, details);
};

const warnSync = (message, error) => {
  console.warn(LOG_PREFIX, message, {
    message: error?.message || String(error),
    code: error?.code,
    status: error?.status,
  });
};

const stringifySubmissionForLog = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return `[unserializable: ${error?.message || "unknown"}]`;
  }
};

const getPayloadSummary = (payload = {}) => ({
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
      logSync("Ready table", { table: "checklist_submission_queue" });
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_checklist_submission_queue_status
        ON checklist_submission_queue(status, created_at);
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
  logSync("Ensuring local storage directories");
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

  if (photo.mediaType === "video") {
    return "video/mp4";
  }

  return "image/jpeg";
};

const copySubmissionPhotos = async (submissionId, photos = []) => {
  const photoDir = getSubmissionPhotoDir(submissionId);
  logSync("Preparing local photo storage", {
    submissionId,
    photoDir,
    photoCount: photos.length,
  });
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
        logSync("Replacing existing local photo file", {
          submissionId,
          targetPath,
        });
        await RNFS.unlink(targetPath);
      }

      logSync("Copying photo into local storage", {
        submissionId,
        requirementId: photo.requirementId,
        sourcePath,
        targetPath,
        sizeKb: photo.sizeKb,
      });
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
      logSync("Deleting local photos", { submissionId, photoDir });
      await RNFS.unlink(photoDir);
    } else {
      logSync("No local photo directory to delete", { submissionId, photoDir });
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
  const online = Boolean(state.isConnected) && state.isInternetReachable !== false;
  logSync("Network state checked", {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
    online,
  });
  return online;
};

export const fetchChecklistProcessMaster = async ({
  deviceType = "OMS",
  activeOnly = true,
} = {}) => {
  logSync("Fetching process master from API", { deviceType, activeOnly });
  const processes = normalizeProcessMaster(
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

  logSync("Saving process master cache to SQLite", {
    deviceType,
    activeOnly,
    processCount: processes.length,
    refreshedAt,
  });
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

const getSyncCandidates = async ({ submissionIds = null, maxItems = Infinity }) => {
  const db = await getDatabase();
  logSync("Reading sync candidates from SQLite", {
    submissionIds,
    maxItems: Number.isFinite(maxItems) ? maxItems : "all",
  });
  const [result] = await db.executeSql(
    `
      SELECT *
      FROM checklist_submission_queue
      WHERE status IN (?, ?, ?)
      ORDER BY created_at ASC;
    `,
    PREPARE_DRAFT_STATUSES
  );
  const wantedIds = Array.isArray(submissionIds) ? new Set(submissionIds) : null;

  const candidates = rowsToArray(result.rows)
    .map(parseQueueRow)
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

export const buildChecklistSubmitJson = (submission) => {
  const photos = submission.payload?.photos || [];

  return {
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
    })),
  };
};

const writeSubmissionDraftJson = async (submission) => {
  const draftJson = buildChecklistSubmitJson(submission);
  const draftPath = getSubmissionDraftPath(submission.id);

  await ensureDirectory(getDraftRootDir());
  await RNFS.writeFile(draftPath, JSON.stringify(draftJson, null, 2), "utf8");
  console.log("[ChecklistDraft]", "Submit JSON ready", {
    submissionId: submission.id,
    draftPath,
    processId: draftJson.process_id,
    subprocessId: draftJson.subprocess_id,
    answerCount: draftJson.answers?.length || 0,
    photoCount: draftJson.photos?.length || 0,
  });
  console.log("[ChecklistDraft][JSON]", stringifySubmissionForLog(draftJson));

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

const syncQueue = async ({ submissionIds = null, maxItems = Infinity } = {}) => {
  logSync("Checking local checklist drafts", {
    submissionIds,
    maxItems: Number.isFinite(maxItems) ? maxItems : "all",
  });
  await ensureStorage();

  const result = {
    checked: 0,
    prepared: 0,
    failed: 0,
    skippedOffline: false,
    draftIds: [],
    draftPaths: [],
    failedIds: [],
    submitApiConnected: false,
  };

  if (!(await canUseNetwork())) {
    result.skippedOffline = true;
    logSync("Network offline; drafts stay local", result);
    return result;
  }

  const candidates = await withQueueLock(() =>
    getSyncCandidates({ submissionIds, maxItems })
  );
  result.checked = candidates.length;
  logSync("Local draft candidates selected", {
    checked: result.checked,
    ids: candidates.map((item) => item.id),
  });

  for (const candidate of candidates) {
    logSync("Preparing local submit JSON", {
      submissionId: candidate.id,
      status: candidate.status,
      summary: getPayloadSummary(candidate.payload),
    });

    try {
      const prepared = await prepareQueuedSubmissionDraft(candidate);
      result.prepared += 1;
      result.draftIds.push(prepared.submission.id);
      result.draftPaths.push(prepared.draftPath);
    } catch (error) {
      warnSync("Unable to prepare submit JSON; keeping draft local", error);
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

  logSync("Local draft check finished; submit API not connected yet", result);
  return result;
};

export const syncQueuedChecklistSubmissions = (options = {}) => {
  if (!syncPromise) {
    logSync("Creating sync promise", options);
    syncPromise = syncQueue(options).finally(() => {
      logSync("Sync promise settled");
      syncPromise = null;
    });
  } else {
    logSync("Reusing active sync promise", options);
  }

  return syncPromise;
};

export const submitChecklistOfflineFirst = async ({
  deviceType = "OMS",
  section,
  subOption,
  payload,
}) => {
  logSync("Offline-first submit requested", {
    deviceType,
    sectionKey: section?.key,
    subOptionId: subOption?.id,
    summary: getPayloadSummary(payload),
  });
  const submission = await enqueueChecklistSubmission({
    deviceType,
    section,
    subOption,
    payload,
  });
  const draft = await prepareQueuedSubmissionDraft(submission);

  logSync("Offline-first submit finished", {
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
      failed: 0,
      skippedOffline: false,
      draftIds: [draft.submission.id],
      draftPaths: [draft.draftPath],
      submitApiConnected: false,
    },
    synced: false,
  };
};

export const getPendingChecklistSubmissionCount = async () => {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `
      SELECT COUNT(*) AS pending_count
      FROM checklist_submission_queue
      WHERE status IN (?, ?, ?, ?);
    `,
    LOCAL_DRAFT_STATUSES
  );

  const pendingCount = Number(result.rows.item(0)?.pending_count || 0);
  logSync("Pending checklist submission count", { pendingCount });
  return pendingCount;
};
