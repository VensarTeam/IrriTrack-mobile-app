import SQLite from "react-native-sqlite-storage";
import { apiRequest } from "./apiClient";
import { API_ENDPOINTS } from "../config/env";

SQLite.enablePromise(true);

const DB_NAME = "pmt_offline_master.db";
const CONTRACTOR_CACHE_ID = "contractors";
const LOG_PREFIX = "[ContractorLocal]";

let databasePromise = null;
let schemaPromise = null;

const logContractor = (message, details = undefined) => {
  if (typeof details === "undefined") {
    //console.log(LOG_PREFIX, message);
    return;
  }

  //console.log(LOG_PREFIX, message, details);
};

const warnContractor = (message, error) => {
  // console.warn(LOG_PREFIX, message, {
  //   message: error?.message || String(error),
  //   code: error?.code,
  //   status: error?.status,
  // });
};

const getDatabase = async () => {
  if (!databasePromise) {
    logContractor("Opening SQLite database", { name: DB_NAME });
    databasePromise = SQLite.openDatabase({
      name: DB_NAME,
      location: "default",
    });
  }

  const db = await databasePromise;

  if (!schemaPromise) {
    schemaPromise = (async () => {
      logContractor("Initializing contractor cache schema");
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS contractor_master_cache (
          id TEXT PRIMARY KEY NOT NULL,
          contractors_json TEXT NOT NULL,
          refreshed_at TEXT NOT NULL
        );
      `);
    })();
  }

  await schemaPromise;
  return db;
};

const normalizeContractor = (contractor = {}) => {
  const firmName = String(contractor?.firmName || "").trim();
  const ownerName = String(contractor?.ownerName || "").trim();
  const mobileNumber = String(contractor?.mobileNumber || "").trim();

  return {
    id: String(contractor?.id || "").trim(),
    firmName,
    ownerName,
    mobileNumber,
    email: String(contractor?.email || "").trim(),
    createdAt: contractor?.createdAt || "",
    updatedAt: contractor?.updatedAt || "",
    optionLabel: firmName,
  };
};

const normalizeContractors = (contractors = []) =>
  contractors
    .map((contractor) => normalizeContractor(contractor))
    .filter((contractor) => contractor.id && contractor.firmName);

const buildFallbackContractorId = (contractor = {}) => {
  const firmPart = String(contractor?.firmName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const mobilePart = String(contractor?.mobileNumber || "").trim();

  return `local-${mobilePart || firmPart || Date.now()}`;
};

const fetchContractorsFromApi = async () => {
  logContractor("Fetching contractors from API", { path: API_ENDPOINTS.contractors });
  const response = await apiRequest({
    url: API_ENDPOINTS.contractors,
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  return normalizeContractors(Array.isArray(response) ? response : response?.data);
};

export const refreshContractorList = async () => {
  const contractors = await fetchContractorsFromApi();
  const refreshedAt = new Date().toISOString();
  const db = await getDatabase();

  logContractor("Saving contractors to SQLite", {
    contractorCount: contractors.length,
    refreshedAt,
  });
  await db.executeSql(
    `
      INSERT OR REPLACE INTO contractor_master_cache
        (id, contractors_json, refreshed_at)
      VALUES (?, ?, ?);
    `,
    [CONTRACTOR_CACHE_ID, JSON.stringify(contractors), refreshedAt]
  );

  return contractors;
};

export const getCachedContractorList = async () => {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `
      SELECT contractors_json
      FROM contractor_master_cache
      WHERE id = ?
      LIMIT 1;
    `,
    [CONTRACTOR_CACHE_ID]
  );

  if (!result.rows.length) {
    logContractor("Contractor cache miss");
    return [];
  }

  try {
    const contractors = normalizeContractors(
      JSON.parse(result.rows.item(0).contractors_json || "[]")
    );
    logContractor("Contractor cache hit", {
      contractorCount: contractors.length,
    });
    return contractors;
  } catch (error) {
    warnContractor("Unable to parse contractor cache", error);
    return [];
  }
};

export const upsertCachedContractor = async (contractor = {}) => {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `
      SELECT contractors_json
      FROM contractor_master_cache
      WHERE id = ?
      LIMIT 1;
    `,
    [CONTRACTOR_CACHE_ID]
  );

  let cachedContractors = [];

  if (result.rows.length) {
    try {
      cachedContractors = normalizeContractors(
        JSON.parse(result.rows.item(0).contractors_json || "[]")
      );
    } catch (error) {
      warnContractor("Unable to parse contractor cache before upsert", error);
    }
  }

  const normalizedContractor = normalizeContractor({
    ...contractor,
    id: contractor?.id || buildFallbackContractorId(contractor),
  });

  if (!normalizedContractor.firmName) {
    return cachedContractors;
  }

  const nextContractors = [
    normalizedContractor,
    ...cachedContractors.filter((item) => item.id !== normalizedContractor.id),
  ];
  const refreshedAt = new Date().toISOString();

  await db.executeSql(
    `
      INSERT OR REPLACE INTO contractor_master_cache
        (id, contractors_json, refreshed_at)
      VALUES (?, ?, ?);
    `,
    [CONTRACTOR_CACHE_ID, JSON.stringify(nextContractors), refreshedAt]
  );

  logContractor("Contractor upserted in SQLite cache", {
    contractorId: normalizedContractor.id,
    firmName: normalizedContractor.firmName,
  });

  return nextContractors;
};
