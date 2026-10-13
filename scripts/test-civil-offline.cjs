const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), vm = require('node:vm');
const { DatabaseSync } = require('node:sqlite');
const babel = require('@babel/core');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'civil-cache-'));
let database = new DatabaseSync(path.join(dir, 'cache.db'));
const sqlite = { enablePromise() {}, openDatabase: async () => ({ executeSql: async (sql, args = []) => {
 const statement = database.prepare(sql);
 const rows = /^SELECT/.test(sql) ? statement.all(...args) : (statement.run(...args), []);
 return [{ rows: { length: rows.length, item: i => rows[i] } }];
} }) };
const load = () => {
 const module = { exports: {} };
 const { code } = babel.transformFileSync('src/services/civilOfflineStore.js', { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] });
 vm.runInNewContext(code, { module, exports: module.exports, Date, Map, Promise, JSON, Number, Error, require: () => sqlite });
 return module.exports;
};
(async () => {
 let store = load();
 const data = { projectId: 'project', groups: [{ type: 'intake', count: 3 }], history: [{ id: 'entry' }], checklistProgress: [{ completedQuantity: 20 }] };
 const time = new Date('2026-10-13T12:00:00Z');
 await store.saveCivilCache('user', 'project', data, time, store.civilCacheRevision('user', 'project'));
 database.close(); database = new DatabaseSync(path.join(dir, 'cache.db')); store = load();
 const cached = await store.readCivilCache('user', 'project');
 assert.equal(JSON.stringify(cached.data), JSON.stringify(data));
 assert.equal(cached.time.toISOString(), time.toISOString());
 assert.equal(await store.readCivilCache('other-user', 'project'), null);
 assert.equal(await store.readCivilCache('user', 'other-project'), null);
 const old = store.civilCacheRevision('user', 'project');
 await store.clearCivilCache('user', 'project');
 await store.saveCivilCache('user', 'project', data, time, old);
 assert.equal(await store.readCivilCache('user', 'project'), null);
 await store.saveCivilCache('user', 'project', data, time, store.civilCacheRevision('user', 'project'));
 const beforeLogout = store.civilCacheRevision('user', 'project');
 await store.clearCivilCache('user');
 await store.saveCivilCache('user', 'project', data, time, beforeLogout);
 assert.equal(await store.readCivilCache('user', 'project'), null);
 console.log('PASS: disk persistence/reopen, complete register/history, account/project isolation, access revocation, logout and late-write protection.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { database.close(); fs.rmSync(dir, { recursive: true, force: true }); });
