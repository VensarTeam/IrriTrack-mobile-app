import SQLite from "react-native-sqlite-storage";
SQLite.enablePromise(true);
let database;
let pending = Promise.resolve();
const revisions = new Map();
const key = (owner, project) => JSON.stringify([owner, project]);
export const civilCacheRevision = (owner, project) => `${revisions.get(owner) || 0}:${revisions.get(key(owner, project)) || 0}`;
const serial = task => { const result = pending.then(task); pending = result.catch(() => {}); return result; };
async function db() {
  if (!database) database = (async () => {
    const connection = await SQLite.openDatabase({ name: "pmt_offline_master.db", location: "default" });
    await connection.executeSql(`CREATE TABLE IF NOT EXISTS civil_status_cache (owner TEXT NOT NULL, project TEXT NOT NULL, payload TEXT NOT NULL, saved_at TEXT NOT NULL, PRIMARY KEY(owner, project));`);
    return connection;
  })().catch(error => { database = null; throw error; });
  return database;
}
export const readCivilCache = (owner, project) => serial(async () => {
  if (!owner || !project) return null;
  const connection = await db();
  const [result] = await connection.executeSql('SELECT payload, saved_at FROM civil_status_cache WHERE owner = ? AND project = ?;', [owner, project]);
  if (!result.rows.length) return null;
  try {
    const row = result.rows.item(0), data = JSON.parse(row.payload);
    return data.projectId === project && Array.isArray(data.groups) && Number.isFinite(Date.parse(row.saved_at)) ? { data, time: new Date(row.saved_at) } : null;
  } catch { return null; }
});
export const saveCivilCache = (owner, project, data, time, revision) => serial(async () => {
  if (!owner || !project || data.projectId !== project || !Array.isArray(data.groups)) throw new Error('Invalid civil cache');
  if (revision !== civilCacheRevision(owner, project)) return;
  const connection = await db();
  if (revision !== civilCacheRevision(owner, project)) return;
  await connection.executeSql('INSERT OR REPLACE INTO civil_status_cache (owner, project, payload, saved_at) VALUES (?, ?, ?, ?);', [owner, project, JSON.stringify(data), time.toISOString()]);
});
export const clearCivilCache = (owner, project) => {
  if (!owner) return Promise.resolve();
  const revisionKey = project ? key(owner, project) : owner;
  revisions.set(revisionKey, (revisions.get(revisionKey) || 0) + 1);
  return serial(async () => {
    const connection = await db();
    await connection.executeSql(project ? 'DELETE FROM civil_status_cache WHERE owner = ? AND project = ?;' : 'DELETE FROM civil_status_cache WHERE owner = ?;', project ? [owner, project] : [owner]);
  });
};
