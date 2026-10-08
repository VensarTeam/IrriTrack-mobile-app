import {
  createPipeChecklistPackage,
  createPipeDailyWork,
  fetchPipeChecklistPackages,
  fetchPipeSubmission,
  resubmitRejectedPipeChecklist,
  submitPipeChecklist,
} from "./pipeNetworkApi";
import {
  completePipeMutation,
  failPipeMutation,
  listPendingPipeMutations,
  queuePipeMutation,
} from "./pipeNetworkOfflineStore";

const flushPromisesByOwner = new Map();
const logPipeSync = (message, details = {}) => {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.info(`[PipeQueueSync] ${message}`, details);
  }
};

const syncPipeEntry = async (entry) => {
  const payload = { ...entry.payload };
  if (entry.operation === "resubmit_pipe_entry") {
    if (!payload.submissionId || !payload.packageId || !payload.checklistPayload?.processCode) {
      throw new Error("The saved resubmission is missing its submission, package or process reference.");
    }
    let resubmitMode = payload.resubmitMode;
    if (!resubmitMode) {
      const detail = await fetchPipeSubmission({ submissionId: payload.submissionId });
      const currentStatus = detail?.workflowStatus || detail?.status;
      if (currentStatus === "rejected") resubmitMode = "rejected";
      else if (currentStatus === "modify_approved") resubmitMode = "modify_approved";
      else throw new Error(`This older saved resubmission cannot be retried while its server status is ${currentStatus || "unknown"}. Review it in Work Status; the saved copy has been kept.`);
    }
    if (resubmitMode === "rejected") {
      if (!payload.resubmitFile) {
        throw new Error("This saved correction needs one new photo. Open the rejected request in Work Status and save it again.");
      }
      await resubmitRejectedPipeChecklist({
        submissionId: payload.submissionId,
        payload: {
          ...payload.checklistPayload,
          packageId: payload.packageId,
          clientMutationId: entry.id,
        },
        resubmitFile: payload.resubmitFile,
        files: payload.files || {},
      });
      return;
    }
    if (resubmitMode !== "modify_approved") throw new Error(`Unsupported resubmission mode: ${resubmitMode}`);
    await submitPipeChecklist({
      payload: { ...payload.checklistPayload, packageId: payload.packageId, clientMutationId: entry.id },
      files: payload.files || {},
    });
    return;
  }
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
    payload: { ...payload.checklistPayload, packageId: payload.syncedPackageId, clientMutationId: entry.id },
    files: payload.files,
  });
};

export const flushPendingPipeMutations = (ownerUserId, { force = false } = {}) => {
  if (!ownerUserId) return Promise.resolve({ checked: 0, synced: 0, failed: 0 });
  const ownerKey = String(ownerUserId);
  if (flushPromisesByOwner.has(ownerKey)) return flushPromisesByOwner.get(ownerKey);
  const flushPromise = (async () => {
    const entries = await listPendingPipeMutations(ownerUserId, { force });
    const result = { checked: entries.length, synced: 0, failed: 0 };
    logPipeSync("flush started", { queued: entries.length, force });
    for (const entry of entries) {
      try {
        if (!["create_pipe_entry", "resubmit_pipe_entry"].includes(entry.operation)) throw new Error(`Unsupported Pipe Network operation: ${entry.operation}`);
        await syncPipeEntry(entry);
        await completePipeMutation(entry.id, entry.payload);
        result.synced += 1;
        logPipeSync("submission synced", { operation: entry.operation, attempts: Number(entry.attempts || 0) });
      } catch (error) {
        // Keep every failed submission available for automatic/manual retry.
        // A permission error must not silently disappear from the pending queue.
        await failPipeMutation({ id: entry.id, error: error?.message });
        result.failed += 1;
        logPipeSync("submission retry scheduled", {
          operation: entry.operation,
          status: Number(error?.status || 0),
          code: error?.code || "",
          message: error?.message || "Sync failed",
        });
        if (Number(error?.status) === 401) break;
      }
    }
    logPipeSync("flush finished", result);
    return result;
  })().finally(() => {
    if (flushPromisesByOwner.get(ownerKey) === flushPromise) {
      flushPromisesByOwner.delete(ownerKey);
    }
  });
  flushPromisesByOwner.set(ownerKey, flushPromise);
  return flushPromise;
};
