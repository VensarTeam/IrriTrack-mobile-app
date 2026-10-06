import {
  createPipeChecklistPackage,
  createPipeDailyWork,
  fetchPipeChecklistPackages,
  submitPipeChecklist,
} from "./pipeNetworkApi";
import {
  completePipeMutation,
  failPipeMutation,
  listPendingPipeMutations,
  queuePipeMutation,
} from "./pipeNetworkOfflineStore";

let activeFlush = null;

const syncPipeEntry = async (entry) => {
  const payload = { ...entry.payload };
  if (!payload.syncedWorkId) {
    const work = await createPipeDailyWork(payload.workPayload);
    payload.syncedWorkId = work?.id || work?.workId || null;
    await queuePipeMutation({
      id: entry.id,
      ownerUserId: entry.owner_user_id,
      projectId: entry.project_id,
      operation: entry.operation,
      payload,
    });
  }
  if (!payload.syncedPackageId) {
    const existingPackages = await fetchPipeChecklistPackages({
      projectId: entry.project_id,
      segmentId: payload.packagePayload.segmentId,
      material: payload.packagePayload.material,
      page: 1,
      pageSize: 1,
    });
    const checklistPackage = existingPackages?.items?.[0]?.packageId
      ? null
      : await createPipeChecklistPackage(payload.packagePayload);
    payload.syncedPackageId = existingPackages?.items?.[0]?.packageId || checklistPackage?.packageId || checklistPackage?.id || checklistPackage?.package?.packageId;
    if (!payload.syncedPackageId) throw new Error("Checklist package ID was not returned by the server.");
    await queuePipeMutation({
      id: entry.id,
      ownerUserId: entry.owner_user_id,
      projectId: entry.project_id,
      operation: entry.operation,
      payload,
    });
  }
  await submitPipeChecklist({
    payload: { ...payload.checklistPayload, packageId: payload.syncedPackageId },
    files: payload.files,
  });
};

export const flushPendingPipeMutations = (ownerUserId) => {
  if (!ownerUserId) return Promise.resolve({ checked: 0, synced: 0, failed: 0 });
  if (activeFlush) return activeFlush;
  activeFlush = (async () => {
    const entries = await listPendingPipeMutations(ownerUserId);
    const result = { checked: entries.length, synced: 0, failed: 0 };
    for (const entry of entries) {
      try {
        if (entry.operation !== "create_pipe_entry") throw new Error(`Unsupported Pipe Network operation: ${entry.operation}`);
        await syncPipeEntry(entry);
        await completePipeMutation(entry.id, entry.payload);
        result.synced += 1;
      } catch (error) {
        if (Number(error?.status) === 400 && /submission already exists/i.test(String(error?.message || ""))) {
          await completePipeMutation(entry.id, entry.payload);
          result.synced += 1;
          continue;
        }
        await failPipeMutation({ id: entry.id, error: error?.message, blocked: Number(error?.status) === 403 });
        result.failed += 1;
        if (Number(error?.status) === 401) break;
      }
    }
    return result;
  })().finally(() => { activeFlush = null; });
  return activeFlush;
};
