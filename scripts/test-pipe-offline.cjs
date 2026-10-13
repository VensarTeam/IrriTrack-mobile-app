// Run with node scripts/test-pipe-offline.cjs. Uses real SQLite and mocked device/API boundaries.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { DatabaseSync } = require('node:sqlite');
const babel = require('@babel/core');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pipe-offline-'));
const db = new DatabaseSync(path.join(root, 'queue.db'));
const localFiles = new Set();
const fileSystem = {
  documentDirectory: 'file:///documents/',
  getInfoAsync: async uri => ({ exists: localFiles.has(uri), size: 100 }),
  deleteAsync: async uri => { localFiles.delete(uri); },
};
const sqlite = {
  enablePromise() {},
  openDatabase: async () => ({ executeSql: async (sql, args = []) => {
    const statement = db.prepare(sql);
    const rows = /^\s*SELECT/i.test(sql) ? statement.all(...args) : (statement.run(...args), []);
    return [{ rows: { length: rows.length, item: index => rows[index] } }];
  } }),
};
function load(file, dependencies) {
  const { code } = babel.transformFileSync(path.resolve(file), {
    configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, console, Date, Map, Set,
    require: name => { if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`); return dependencies[name]; },
  }, { filename: file });
  return module.exports;
}
const storeDeps = { 'react-native-sqlite-storage': sqlite, 'expo-file-system/legacy': fileSystem };
let store = load('src/services/pipeNetworkOfflineStore.js', storeDeps);
const calls = [];
let failure = null;
let serverStatus = 'rejected';
const accepted = new Set();
let applications = 0;
let loseResponse = false;
const upload = async (kind, args) => {
  calls.push({ kind, ...args });
  if (failure) throw failure;
  if (!accepted.has(args.payload.clientMutationId)) {
    accepted.add(args.payload.clientMutationId);
    applications++;
  }
  if (loseResponse) { loseResponse = false; throw Object.assign(new Error('Connection lost'), { status: 0 }); }
  return { submissionId: 'submission', workflowStatus: 'submitted', items: [] };
};
const sync = load('src/services/pipeNetworkSync.js', {
  'expo-file-system/legacy': fileSystem,
  './checklistImageStorage': { compressChecklistImage: async () => { throw new Error('Unexpected compression'); } },
  './pipeNetworkOfflineStore': store,
  './pipeStageProgress': {},
  './pipeNetworkApi': {
    resubmitRejectedPipeChecklist: args => upload('correction', args),
    submitPipeChecklist: args => upload('modification', args),
    fetchPipeSubmission: async () => ({ workflowStatus: serverStatus }),
  },
});
async function queue(id, mode = 'rejected', photo = true, ownerUserId = 'owner') {
  const uri = `file:///documents/pipe-network-entries/${id}.jpg`;
  if (photo) localFiles.add(uri);
  await store.queuePipeMutation({ id, ownerUserId, projectId: 'project', operation: 'resubmit_pipe_entry',
    payload: { submissionId: 'submission', packageId: 'package', resubmitMode: mode,
      resubmitFile: photo ? uri : null,
      checklistPayload: { processCode: 'excavation', checklist: [{ checklistId: 1, value: true }] }, files: {} },
  });
  return uri;
}
(async () => {
  const photo = await queue('lost-response');
  // Reload the store as after an app restart: queue and file references survive.
  store = load('src/services/pipeNetworkOfflineStore.js', storeDeps);
  assert.equal((await store.listPendingPipeMutations('owner'))[0].payload.resubmitFile, photo);
  loseResponse = true;
  let result = await sync.flushPendingPipeMutations('owner', { force: true });
  assert.equal(result.failed, 1);
  assert.equal(localFiles.has(photo), true);
  assert.equal((await store.listPendingPipeMutations('owner')).length, 0, 'retry backoff');
  result = await sync.flushPendingPipeMutations('owner', { force: true });
  assert.equal(result.synced, 1);
  assert.equal(applications, 1, 'lost response retries use the same mutation ID');
  assert.equal(localFiles.has(photo), false);
  assert.equal(await store.getPendingPipeMutationCount('owner'), 0);
  assert.equal((await store.getPipeCache({ ownerUserId: 'owner', projectId: 'project', resource: 'submission-detail:submission' })).payload.workflowStatus, 'submitted');

  await queue('modify', 'modify_approved', false);
  result = await sync.flushPendingPipeMutations('owner', { force: true });
  assert.equal(result.synced, 1);
  assert.equal(calls.at(-1).kind, 'modification');

  await queue('session-retry');
  failure = Object.assign(new Error('Session expired'), { status: 401 });
  await sync.flushPendingPipeMutations('owner', { force: true });
  assert.equal((await store.listPendingPipeMutations('owner', { force: true }))[0].state, 'retry');
  failure = Object.assign(new Error('Status changed'), { status: 400 });
  await sync.flushPendingPipeMutations('owner', { force: true });
  assert.equal((await store.listPendingPipeMutations('owner', { force: true }))[0].state, 'needs_attention');
  assert.equal((await store.listPendingPipeMutations('owner')).length, 0);
  failure = null;
  await sync.flushPendingPipeMutations('owner', { force: true });

  await queue('legacy-photo-missing', undefined, false);
  // Explicitly emulate an older payload without its mode discriminator.
  const legacy = (await store.listPendingPipeMutations('owner', { force: true }))[0];
  delete legacy.payload.resubmitMode;
  await store.queuePipeMutation({ id: legacy.id, ownerUserId: 'owner', projectId: 'project', operation: legacy.operation, payload: legacy.payload });
  result = await sync.flushPendingPipeMutations('owner', { force: true });
  assert.equal(result.failed, 1);
  assert.match(result.failures[0].message, /new photo/);
  assert.equal(await store.getPendingPipeMutationCount('owner'), 1);
  await store.completePipeMutation(legacy.id);

  await queue('other-user', 'rejected', true, 'other');
  assert.equal((await sync.flushPendingPipeMutations('owner', { force: true })).checked, 0);
  assert.equal(await store.getPendingPipeMutationCount('other'), 1);

  const { getPipeWorkflowActions, filterCachedPipeWorkStatus, getPipeReviewRemark } = load('src/services/pipeWorkflow.js', {});
  const item = { createdBy: 'supervisor', assignedEngineerId: 'engineer', assignedManagerId: 'manager', workflowStatus: 'rejected' };
  const actions = (role, id) => Array.from(getPipeWorkflowActions(item, { role, id }), value => value.key);
  assert.deepEqual(actions('supervisor', 'supervisor'), ['edit_resubmit']);
  assert.deepEqual(actions('supervisor', 'someone-else'), []);
  item.workflowStatus = 'verified';
  assert.deepEqual(actions('engineer', 'engineer'), ['modify_approved', 'reject']);
  assert.deepEqual(actions('manager', 'manager'), ['approve', 'modify_approved', 'reject']);
  assert.deepEqual(actions('admin', 'manager'), []);
  const cachedList = { items: [
    { workflowStatus: 'rejected', startNode: 'N1' },
    { workflowStatus: 'approved', startNode: 'N2' },
  ], counts: { total: 2 } };
  assert.equal(filterCachedPipeWorkStatus(cachedList, { status: 'rejected', search: 'n1' }).items.length, 1);
  assert.equal(filterCachedPipeWorkStatus(cachedList, { status: 'rejected', search: 'n2' }).items.length, 0);
  assert.equal(cachedList.items.length, 2);
  assert.equal(getPipeReviewRemark({ workflowStatus: 'modify_approved', history: [
    { action: 'modify_approved', remark: 'Old change' }, { action: 'modify_approved', remark: 'Fix depth' },
  ] }), 'Fix depth');
  assert.equal(getPipeReviewRemark({ workflowStatus: 'rejected', rejectionRemark: 'Replace photo' }), 'Replace photo');
  console.log('PASS: persistent SQLite outbox, correction/modification routing, lost-response retry, photo retention/cleanup, cached result, 401 retry, 400 attention, missing photo, account isolation and role actions.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  db.close(); fs.rmSync(root, { recursive: true, force: true });
});
