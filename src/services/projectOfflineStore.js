import SQLite from "react-native-sqlite-storage";
import { createProject } from "../models/project";
import { API_ENDPOINTS } from "../config/env";
import { apiRequest } from "./apiClient";

SQLite.enablePromise(true);

const DB_NAME = "pmt_offline_master.db";
const PROJECT_CACHE_ID = "projects";
const LOG_PREFIX = "[ProjectLocal]";

let databasePromise = null;
let schemaPromise = null;

const logProject = (message, details = undefined) => {
  if (typeof details === "undefined") {
    //console.log(LOG_PREFIX, message);
    return;
  }

  //console.log(LOG_PREFIX, message, details);
};

const warnProject = (message, error) => {
  // console.warn(LOG_PREFIX, message, {
  //   message: error?.message || String(error),
  //   code: error?.code,
  //   status: error?.status,
  // });
};

const getDatabase = async () => {
  if (!databasePromise) {
    logProject("Opening SQLite database", { name: DB_NAME });
    databasePromise = SQLite.openDatabase({
      name: DB_NAME,
      location: "default",
    });
  }

  const db = await databasePromise;

  if (!schemaPromise) {
    schemaPromise = (async () => {
      logProject("Initializing project cache schema");
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS project_master_cache (
          id TEXT PRIMARY KEY NOT NULL,
          projects_json TEXT NOT NULL,
          refreshed_at TEXT NOT NULL
        );
      `);
    })();
  }

  await schemaPromise;
  return db;
};

const normalizeProjects = (projects = []) =>
  projects.map((project) => createProject(project));

export const fetchProjectList = async () => {
  logProject("Fetching projects from API");
  const projects = normalizeProjects(
    await apiRequest({
      url: API_ENDPOINTS.projects,
      method: "GET",
      headers: {
        Accept: "*/*",
      },
    })
  );

  logProject("Fetched projects from API", { projectCount: projects.length });
  return projects;
};

export const refreshProjectList = async () => {
  const projects = await fetchProjectList();
  const refreshedAt = new Date().toISOString();
  const db = await getDatabase();

  logProject("Saving projects to SQLite", {
    projectCount: projects.length,
    refreshedAt,
  });
  await db.executeSql(
    `
      INSERT OR REPLACE INTO project_master_cache
        (id, projects_json, refreshed_at)
      VALUES (?, ?, ?);
    `,
    [PROJECT_CACHE_ID, JSON.stringify(projects), refreshedAt]
  );

  return projects;
};

export const getCachedProjectList = async () => {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `
      SELECT projects_json
      FROM project_master_cache
      WHERE id = ?
      LIMIT 1;
    `,
    [PROJECT_CACHE_ID]
  );

  if (!result.rows.length) {
    logProject("Project cache miss");
    return [];
  }

  try {
    const projects = normalizeProjects(
      JSON.parse(result.rows.item(0).projects_json || "[]")
    );
    logProject("Project cache hit", { projectCount: projects.length });
    return projects;
  } catch (error) {
    warnProject("Unable to parse project cache", error);
    return [];
  }
};
