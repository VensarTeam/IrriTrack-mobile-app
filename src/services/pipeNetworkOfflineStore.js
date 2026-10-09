import SQLite from "react-native-sqlite-storage";
import * as FileSystem from "expo-file-system/legacy";

SQLite.enablePromise(true);

const DB_NAME = "pmt_offline_master.db";
let databasePromise;
let schemaPromise;

const getDatabase = async () => {
  if (!databasePromise) databasePromise = SQLite.openDatabase({ name: DB_NAME, location: "default" });
  const db = await databasePromise;
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS pipe_network_cache (
          cache_key TEXT PRIMARY KEY NOT NULL,
          owner_user_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          refreshed_at TEXT NOT NULL
        );
      `);
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS pipe_network_sync_queue (
          id TEXT PRIMARY KEY NOT NULL,
          owner_user_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          state TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      // Older builds marked 403 failures as blocked, which hid them from both
      // automatic sync and the manual sync control. Keep those rows recoverable.
      await db.executeSql(`UPDATE pipe_network_sync_queue SET state = 'retry' WHERE state = 'blocked';`);
      await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_pipe_sync_owner_state ON pipe_network_sync_queue(owner_user_id, state, created_at);`);
    })();
  }
  await schemaPromise;
  return db;
};

const cacheKey = (ownerUserId, projectId, resource) => `${ownerUserId}:${projectId}:${resource}`;

export const savePipeCache = async ({ ownerUserId, projectId, resource, payload }) => {
  if (!ownerUserId || !projectId || !resource) return;
  const db = await getDatabase();
  await db.executeSql(
    `INSERT OR REPLACE INTO pipe_network_cache(cache_key, owner_user_id, project_id, payload_json, refreshed_at) VALUES (?, ?, ?, ?, ?);`,
    [cacheKey(ownerUserId, projectId, resource), ownerUserId, projectId, JSON.stringify(payload), new Date().toISOString()],
  );
};

export const getPipeCache = async ({ ownerUserId, projectId, resource }) => {
  if (!ownerUserId || !projectId || !resource) return null;
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT payload_json, refreshed_at FROM pipe_network_cache WHERE cache_key = ? AND owner_user_id = ? LIMIT 1;`,
    [cacheKey(ownerUserId, projectId, resource), ownerUserId],
  );
  if (!result.rows.length) return null;
  const row = result.rows.item(0);
  try {
    return { payload: JSON.parse(row.payload_json), refreshedAt: row.refreshed_at };
  } catch {
    return null;
  }
};

export const queuePipeMutation = async ({ id, ownerUserId, projectId, operation, payload }) => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.executeSql(
    `INSERT OR REPLACE INTO pipe_network_sync_queue(id, owner_user_id, project_id, operation, payload_json, state, attempts, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?);`,
    [id, ownerUserId, projectId, operation, JSON.stringify(payload), now, now],
  );
  return id;
};

export const listPendingPipeMutations = async (ownerUserId, { force = false } = {}) => {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT * FROM pipe_network_sync_queue WHERE owner_user_id = ? AND state IN ('pending', 'retry', 'needs_attention', 'waiting_prerequisite') ORDER BY created_at ASC;`,
    [ownerUserId],
  );
  const now = Date.now();
  return Array.from({ length: result.rows.length }, (_, index) => {
    const row = result.rows.item(index);
    return { ...row, payload: JSON.parse(row.payload_json) };
  }).filter((row) => {
    if (row.state === "needs_attention") return force;
    if (row.state === "waiting_prerequisite" && !force) {
      return now - Date.parse(row.updated_at || "") >= 5 * 60_000;
    }
    if (force || row.state !== "retry") return true;
    const attempts = Math.max(1, Number(row.attempts || 1));
    const retryDelayMs = Math.min(15 * 60_000, 30_000 * (2 ** Math.min(attempts - 1, 5)));
    const lastAttemptAt = Date.parse(row.updated_at || "");
    return !Number.isFinite(lastAttemptAt) || now - lastAttemptAt >= retryDelayMs;
  });
};

export const getPendingPipeMutationCount = async (ownerUserId) => {
  if (!ownerUserId) return 0;
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT COUNT(*) AS count FROM pipe_network_sync_queue WHERE owner_user_id = ? AND state IN ('pending', 'retry', 'needs_attention', 'waiting_prerequisite');`,
    [ownerUserId],
  );
  return Number(result.rows.item(0)?.count || 0);
};

export const getPendingPipeMutationSummaries = async (ownerUserId) => {
  if (!ownerUserId) return [];
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT id, operation, state, last_error, attempts
     FROM pipe_network_sync_queue
     WHERE owner_user_id = ? AND state IN ('pending', 'retry', 'needs_attention', 'waiting_prerequisite')
     ORDER BY created_at ASC;`,
    [ownerUserId]
  );
  return Array.from({ length: result.rows.length }, (_, index) => {
    const row = result.rows.item(index);
    return {
      id: row.id,
      operation: row.operation,
      state: row.state,
      lastError: row.last_error || "",
      attempts: Number(row.attempts || 0),
    };
  });
};

export const cleanupPipeMutationFiles = async (payload = {}) => {
  const safeRoot = `${FileSystem.documentDirectory || ""}pipe-network-entries/`;
  if (!FileSystem.documentDirectory || !safeRoot) return;

  const fileUris = [...Object.values(payload?.files || {}), payload?.resubmitFile, payload?.cleanupFiles]
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => String(value || ""))
    .filter((value) => value.startsWith(safeRoot));

  await Promise.all(fileUris.map(async (uri) => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // The server submission is already complete; stale-file cleanup can retry later.
    }
  }));
};

export const completePipeMutation = async (id, payload = null) => {
  const db = await getDatabase();
  await db.executeSql(`DELETE FROM pipe_network_sync_queue WHERE id = ?;`, [id]);
  if (payload) await cleanupPipeMutationFiles(payload);
};

export const failPipeMutation = async ({ id, error, blocked = false }) => {
  const db = await getDatabase();
  await db.executeSql(
    `UPDATE pipe_network_sync_queue SET state = ?, attempts = attempts + 1, last_error = ?, updated_at = ? WHERE id = ?;`,
    [blocked ? "needs_attention" : "retry", error || "Sync failed", new Date().toISOString(), id],
  );
};

export const deferPipeMutation = async ({ id, reason }) => {
  const db = await getDatabase();
  await db.executeSql(
    `UPDATE pipe_network_sync_queue SET state = 'waiting_prerequisite', last_error = ?, updated_at = ? WHERE id = ?;`,
    [reason || "Waiting for previous stage approval", new Date().toISOString(), id],
  );
};
