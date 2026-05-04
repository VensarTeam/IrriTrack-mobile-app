import SQLite from "react-native-sqlite-storage";

SQLite.enablePromise(true);

const DB_NAME = "pmt_offline_work_status.db";
const STATUS_KEY_ALL = "__all__";

let databasePromise = null;
let schemaPromise = null;

const normalizeOwnerUserId = (value = "") => String(value || "").trim();
const normalizeProjectId = (value = "") => String(value || "").trim();
const normalizeStatusKey = (value = "") =>
  String(value || "").trim().toLowerCase() || STATUS_KEY_ALL;

const createEmptyWorkStatusResponse = () => ({
  counts: {
    total: 0,
    submitted: 0,
    verified: 0,
    approved: 0,
    rejected: 0,
  },
  items: [],
});

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
        CREATE TABLE IF NOT EXISTS oms_work_status_cache (
          id TEXT PRIMARY KEY NOT NULL,
          owner_user_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          status_key TEXT NOT NULL,
          counts_json TEXT NOT NULL,
          items_json TEXT NOT NULL,
          refreshed_at TEXT NOT NULL
        );
      `);
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_oms_work_status_cache_owner_project
        ON oms_work_status_cache(owner_user_id, project_id, status_key);
      `);
    })();
  }

  await schemaPromise;
  return db;
};

const buildCacheId = ({ ownerUserId = "", projectId = "", status = "" } = {}) =>
  [
    normalizeOwnerUserId(ownerUserId),
    normalizeProjectId(projectId),
    normalizeStatusKey(status),
  ].join(":");

const safeParseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const normalizeWorkStatusResponse = (response) => {
  const payload =
    response && typeof response === "object" ? response : createEmptyWorkStatusResponse();

  return {
    counts: {
      ...createEmptyWorkStatusResponse().counts,
      ...(payload.counts || {}),
    },
    items: Array.isArray(payload.items) ? payload.items : [],
  };
};

const matchesSearch = (item = {}, search = "") => {
  const normalizedSearch = String(search || "").trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const haystacks = [
    item?.omsName,
    item?.omsId,
    item?.processName,
    item?.subprocessName,
    item?.submittedByName,
    item?.verifiedByName,
    item?.approvedByName,
    item?.rejectedByName,
    item?.rejectionRemark,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return haystacks.some((value) => value.includes(normalizedSearch));
};

export const saveCachedOmsWorkStatus = async ({
  ownerUserId = "",
  projectId = "",
  status = "",
  response,
} = {}) => {
  const normalizedOwnerUserId = normalizeOwnerUserId(ownerUserId);
  const normalizedProjectId = normalizeProjectId(projectId);

  if (!normalizedOwnerUserId || !normalizedProjectId) {
    return;
  }

  const normalizedResponse = normalizeWorkStatusResponse(response);
  const db = await getDatabase();

  await db.executeSql(
    `
      INSERT OR REPLACE INTO oms_work_status_cache
        (id, owner_user_id, project_id, status_key, counts_json, items_json, refreshed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    [
      buildCacheId({ ownerUserId: normalizedOwnerUserId, projectId: normalizedProjectId, status }),
      normalizedOwnerUserId,
      normalizedProjectId,
      normalizeStatusKey(status),
      JSON.stringify(normalizedResponse.counts),
      JSON.stringify(normalizedResponse.items),
      new Date().toISOString(),
    ]
  );
};

export const getCachedOmsWorkStatus = async ({
  ownerUserId = "",
  projectId = "",
  status = "",
  search = "",
} = {}) => {
  const normalizedOwnerUserId = normalizeOwnerUserId(ownerUserId);
  const normalizedProjectId = normalizeProjectId(projectId);

  if (!normalizedOwnerUserId || !normalizedProjectId) {
    return createEmptyWorkStatusResponse();
  }

  const db = await getDatabase();
  const [result] = await db.executeSql(
    `
      SELECT counts_json, items_json
      FROM oms_work_status_cache
      WHERE id = ?
      LIMIT 1;
    `,
    [buildCacheId({ ownerUserId: normalizedOwnerUserId, projectId: normalizedProjectId, status })]
  );

  if (!result.rows.length) {
    return createEmptyWorkStatusResponse();
  }

  const row = result.rows.item(0);
  const response = normalizeWorkStatusResponse({
    counts: safeParseJson(row.counts_json, createEmptyWorkStatusResponse().counts),
    items: safeParseJson(row.items_json, []),
  });

  return {
    counts: response.counts,
    items: response.items.filter((item) => matchesSearch(item, search)),
  };
};

export const removeCachedOmsWorkStatusSubmission = async ({
  ownerUserId = "",
  projectId = "",
  submissionId = "",
} = {}) => {
  const normalizedOwnerUserId = normalizeOwnerUserId(ownerUserId);
  const normalizedProjectId = normalizeProjectId(projectId);
  const normalizedSubmissionId = String(submissionId || "").trim();

  if (!normalizedOwnerUserId || !normalizedProjectId || !normalizedSubmissionId) {
    return;
  }

  const db = await getDatabase();
  const [result] = await db.executeSql(
    `
      SELECT *
      FROM oms_work_status_cache
      WHERE owner_user_id = ? AND project_id = ?;
    `,
    [normalizedOwnerUserId, normalizedProjectId]
  );

  const rows = Array.from({ length: result.rows.length }, (_, index) =>
    result.rows.item(index)
  );
  const hasSubmissionInCache = rows.some((row) =>
    safeParseJson(row.items_json, []).some(
      (item) => String(item?.submissionId || "").trim() === normalizedSubmissionId
    )
  );

  if (!hasSubmissionInCache) {
    return;
  }

  for (const row of rows) {
    const items = safeParseJson(row.items_json, []);
    const filteredItems = items.filter(
      (item) => String(item?.submissionId || "").trim() !== normalizedSubmissionId
    );

    const counts = {
      ...createEmptyWorkStatusResponse().counts,
      ...safeParseJson(row.counts_json, createEmptyWorkStatusResponse().counts),
    };
    const nextCounts = {
      ...counts,
      total: Math.max(0, Number(counts.total || 0) - 1),
      rejected: Math.max(0, Number(counts.rejected || 0) - 1),
    };

    await db.executeSql(
      `
        UPDATE oms_work_status_cache
        SET counts_json = ?, items_json = ?, refreshed_at = ?
        WHERE id = ?;
      `,
      [
        JSON.stringify(nextCounts),
        JSON.stringify(filteredItems),
        new Date().toISOString(),
        row.id,
      ]
    );
  }
};
