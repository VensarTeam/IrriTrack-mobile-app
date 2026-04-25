import SQLite from "react-native-sqlite-storage";
import { apiRequest } from "./apiClient";

SQLite.enablePromise(true);

const DB_NAME = "pmt_offline_master.db";
const LOG_PREFIX = "[OmsLocal]";
const DEFAULT_PAGE_LIMIT = 5;
const OMS_BASIC_API_PATHS = ["/api/v1/oms/basic", "/oms/basic"];

let databasePromise = null;
let schemaPromise = null;
const syncPromisesByProject = new Map();

const normalizeSubChakQuantity = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : null;
};

const logOms = (message, details = undefined) => {
  if (typeof details === "undefined") {
    console.log(LOG_PREFIX, message);
    return;
  }

  console.log(LOG_PREFIX, message, details);
};

const warnOms = (message, error) => {
  console.warn(LOG_PREFIX, message, {
    message: error?.message || String(error),
    code: error?.code,
    status: error?.status,
  });
};

const getDatabase = async () => {
  if (!databasePromise) {
    logOms("Opening SQLite database", { name: DB_NAME });
    databasePromise = SQLite.openDatabase({
      name: DB_NAME,
      location: "default",
    });
  }

  const db = await databasePromise;

  if (!schemaPromise) {
    schemaPromise = (async () => {
      logOms("Initializing OMS cache schema");
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS oms_basic_units_cache (
          id TEXT PRIMARY KEY NOT NULL,
          project_id TEXT NOT NULL,
          node_name TEXT NOT NULL,
          sub_chak_quantity INTEGER,
          refreshed_at TEXT NOT NULL
        );
      `);
      try {
        await db.executeSql(`
          ALTER TABLE oms_basic_units_cache
          ADD COLUMN sub_chak_quantity INTEGER;
        `);
      } catch (error) {
        // Ignore duplicate-column errors on existing databases.
      }
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_oms_basic_units_cache_project_node
        ON oms_basic_units_cache(project_id, node_name);
      `);
    })();
  }

  await schemaPromise;
  return db;
};

const createMeta = ({ page = 1, limit = DEFAULT_PAGE_LIMIT, totalItems = 0 }) => {
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 0;

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: totalPages > 0 && page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
};

const fetchOmsBasicWithFallbackPaths = async (projectId) => {
  let lastNotFoundError = null;

  for (const path of OMS_BASIC_API_PATHS) {
    try {
      return await apiRequest({
        url: path,
        method: "GET",
        headers: {
          Accept: "*/*",
        },
        params: { projectId },
      });
    } catch (error) {
      if (error?.status === 404) {
        lastNotFoundError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastNotFoundError || new Error("Unable to fetch OMS basic list.");
};

export const refreshOmsBasicUnitsForProject = async (projectId) => {
  if (!projectId) {
    return 0;
  }

  const normalizedProjectId = String(projectId).trim();

  if (!normalizedProjectId) {
    return 0;
  }

  const units = await fetchOmsBasicWithFallbackPaths(normalizedProjectId);
  const db = await getDatabase();
  const refreshedAt = new Date().toISOString();

  logOms("Saving OMS basic units", {
    projectId: normalizedProjectId,
    count: Array.isArray(units) ? units.length : 0,
  });

  await db.executeSql(
    `
      DELETE FROM oms_basic_units_cache
      WHERE project_id = ?;
    `,
    [normalizedProjectId]
  );

  for (const unit of Array.isArray(units) ? units : []) {
    const id = String(unit?.id || "").trim();
    const nodeName = String(unit?.nodeName || "").trim();
    const subChakQuantity = normalizeSubChakQuantity(
      unit?.subCheckQty ?? unit?.subChakQty ?? unit?.subChakQuantity
    );

    if (!id || !nodeName) {
      continue;
    }

    await db.executeSql(
      `
        INSERT OR REPLACE INTO oms_basic_units_cache
          (id, project_id, node_name, sub_chak_quantity, refreshed_at)
        VALUES (?, ?, ?, ?, ?);
      `,
      [id, normalizedProjectId, nodeName, subChakQuantity, refreshedAt]
    );
  }

  return Array.isArray(units) ? units.length : 0;
};

export const syncOmsBasicUnitsForProjectInBackground = (projectId) => {
  if (!projectId) {
    return Promise.resolve(0);
  }

  const normalizedProjectId = String(projectId).trim();

  if (!normalizedProjectId) {
    return Promise.resolve(0);
  }

  if (!syncPromisesByProject.has(normalizedProjectId)) {
    const syncPromise = refreshOmsBasicUnitsForProject(normalizedProjectId)
      .catch((error) => {
        warnOms("Background OMS sync failed", error);
        return 0;
      })
      .finally(() => {
        syncPromisesByProject.delete(normalizedProjectId);
      });

    syncPromisesByProject.set(normalizedProjectId, syncPromise);
  }

  return syncPromisesByProject.get(normalizedProjectId);
};

export const getCachedOmsBasicUnitsPage = async ({
  projectId,
  searchQuery = "",
  page = 1,
  limit = DEFAULT_PAGE_LIMIT,
} = {}) => {
  const normalizedProjectId = String(projectId || "").trim();

  if (!normalizedProjectId) {
    return {
      success: true,
      data: [],
      meta: createMeta({ page, limit, totalItems: 0 }),
    };
  }

  const db = await getDatabase();
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.max(1, Number(limit) || DEFAULT_PAGE_LIMIT);
  const offset = (normalizedPage - 1) * normalizedLimit;
  const normalizedSearch = String(searchQuery || "").trim();
  const likeSearch = `%${normalizedSearch}%`;

  const [countResult] = await db.executeSql(
    `
      SELECT COUNT(*) AS total_count
      FROM oms_basic_units_cache
      WHERE project_id = ?
        AND (? = '' OR node_name LIKE ? COLLATE NOCASE);
    `,
    [normalizedProjectId, normalizedSearch, likeSearch]
  );
  const totalItems = Number(countResult.rows.item(0)?.total_count || 0);
  const meta = createMeta({
    page: normalizedPage,
    limit: normalizedLimit,
    totalItems,
  });

  const [dataResult] = await db.executeSql(
    `
      SELECT id, project_id, node_name, sub_chak_quantity
      FROM oms_basic_units_cache
      WHERE project_id = ?
        AND (? = '' OR node_name LIKE ? COLLATE NOCASE)
      ORDER BY node_name ASC
      LIMIT ? OFFSET ?;
    `,
    [normalizedProjectId, normalizedSearch, likeSearch, normalizedLimit, offset]
  );

  const data = Array.from({ length: dataResult.rows.length }, (_, index) => {
    const row = dataResult.rows.item(index);

    return {
      id: row.id,
      nodeName: row.node_name,
      projectId: row.project_id,
      subChakQuantity: normalizeSubChakQuantity(row.sub_chak_quantity),
    };
  });

  logOms("Loaded OMS units from cache", {
    projectId: normalizedProjectId,
    page: normalizedPage,
    limit: normalizedLimit,
    totalItems,
    returnedItems: data.length,
    hasNextPage: meta.hasNextPage,
  });

  return {
    success: true,
    data,
    meta,
  };
};

export const getCachedOmsBasicUnitsCount = async (projectId) => {
  const normalizedProjectId = String(projectId || "").trim();

  if (!normalizedProjectId) {
    return 0;
  }

  const db = await getDatabase();
  const [countResult] = await db.executeSql(
    `
      SELECT COUNT(*) AS total_count
      FROM oms_basic_units_cache
      WHERE project_id = ?;
    `,
    [normalizedProjectId]
  );

  return Number(countResult.rows.item(0)?.total_count || 0);
};
