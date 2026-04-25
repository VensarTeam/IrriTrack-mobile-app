import SQLite from "react-native-sqlite-storage";
import { apiRequest } from "./apiClient";

SQLite.enablePromise(true);

const DB_NAME = "pmt_offline_master.db";
const CONTRACTOR_CACHE_ID = "contractors";
const LOG_PREFIX = "[ContractorLocal]";
const CONTRACTOR_API_PATHS = ["/contractors", "/api/v1/contractors"];

let databasePromise = null;
let schemaPromise = null;

const logContractor = (message, details = undefined) => {
  if (typeof details === "undefined") {
    console.log(LOG_PREFIX, message);
    return;
  }

  console.log(LOG_PREFIX, message, details);
};

const warnContractor = (message, error) => {
  console.warn(LOG_PREFIX, message, {
    message: error?.message || String(error),
    code: error?.code,
    status: error?.status,
  });
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

const fetchContractorsFromApi = async () => {
  let lastNotFoundError = null;

  for (const path of CONTRACTOR_API_PATHS) {
    try {
      logContractor("Fetching contractors from API", { path });
      const response = await apiRequest({
        url: path,
        method: "GET",
        headers: {
          Accept: "*/*",
        },
      });

      return normalizeContractors(Array.isArray(response) ? response : response?.data);
    } catch (error) {
      if (error?.status === 404) {
        lastNotFoundError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastNotFoundError || new Error("Unable to fetch contractors.");
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
