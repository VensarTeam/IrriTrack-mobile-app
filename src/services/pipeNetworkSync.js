import * as FileSystem from "expo-file-system/legacy";
import { compressChecklistImage } from "./checklistImageStorage";
import {
  createPipeChecklistPackage,
  createPipeDailyWork,
  fetchPipeSubmission,
  resubmitRejectedPipeChecklist,
  submitPipeChecklist,
} from "./pipeNetworkApi";
import {
  completePipeMutation,
  deferPipeMutation,
  failPipeMutation,
  listPendingPipeMutations,
  queuePipeMutation,
} from "./pipeNetworkOfflineStore";
import {
  fetchAndCachePipeStagePackages,
  fetchAndCachePipeStageWork,
  findExactPipePackage,
  isPipeStageRangeApproved,
  previousPipeStage,
} from "./pipeStageProgress";

const flushPromisesByOwner = new Map();
const PIPE_UPLOAD_PHOTO_LIMIT_BYTES = 300 * 1024;
const logPipeSync = (message, details = {}) => {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.info(`[PipeQueueSync] ${message}`, details);
  }
};

const atSyncPhase = async (phase, work) => {
  try {
    return await work();
  } catch (error) {
    if (error && typeof error === "object") error.syncPhase = phase;
    throw error;
  }
};

const optimizeSavedPhotos = async (entry, payload) => {
  const savedPhotoRoot = `${FileSystem.documentDirectory || ""}pipe-network-entries/`;
  if (!FileSystem.documentDirectory) return payload;

  const cleanupFiles = [...(payload.cleanupFiles || [])];
  let changed = false;
  const optimizeUri = async (uri, suffix) => {
    if (!String(uri || "").startsWith("file://")) return uri;
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || Number(info.size || 0) <= PIPE_UPLOAD_PHOTO_LIMIT_BYTES) return uri;

    const photo = await compressChecklistImage(
      { uri, type: "image/jpeg" },
      { targetSizeBytes: PIPE_UPLOAD_PHOTO_LIMIT_BYTES }
    );
    if (!photo?.uri || photo.uri === uri ||
        Number(photo.fileSize || 0) >= Number(info.size || 0)) return uri;

    await FileSystem.makeDirectoryAsync(savedPhotoRoot, { intermediates: true });
    const optimizedUri = `${savedPhotoRoot}${entry.id}-${suffix}-${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: photo.uri, to: optimizedUri });
    if (uri.startsWith(savedPhotoRoot)) cleanupFiles.push(uri);
    changed = true;
    return optimizedUri;
  };

  const files = {};
  for (const [checklistId, value] of Object.entries(payload.files || {})) {
    const uris = Array.isArray(value) ? value : [value];
    const optimized = [];
    for (const [index, uri] of uris.entries()) {
      optimized.push(await optimizeUri(uri, `${checklistId}-${index}`));
    }
    files[checklistId] = Array.isArray(value) ? optimized : optimized[0];
  }
  const resubmitFile = payload.resubmitFile
    ? await optimizeUri(payload.resubmitFile, "correction")
    : payload.resubmitFile;
  if (!changed) return payload;

  const updated = { ...payload, files, resubmitFile, cleanupFiles };
  await queuePipeMutation({
    id: entry.id,
    ownerUserId: entry.owner_user_id,
    projectId: entry.project_id,
    operation: entry.operation,
    payload: updated,
  });
  return updated;
};

const syncPipeEntry = async (entry) => {
  const payload = await atSyncPhase("photo preparation", () =>
    optimizeSavedPhotos(entry, { ...entry.payload })
  );
  if (entry.operation === "resubmit_pipe_entry") {
    if (!payload.submissionId || !payload.packageId || !payload.checklistPayload?.processCode) {
      throw new Error("The saved resubmission is missing its submission, package or process reference.");
    }
    let resubmitMode = payload.resubmitMode;
    if (!resubmitMode) {
      const detail = await atSyncPhase("resubmission lookup", () =>
        fetchPipeSubmission({ submissionId: payload.submissionId })
      );
      const currentStatus = detail?.workflowStatus || detail?.status;
      if (currentStatus === "rejected") resubmitMode = "rejected";
      else if (currentStatus === "modify_approved") resubmitMode = "modify_approved";
      else throw new Error(`This older saved resubmission cannot be retried while its server status is ${currentStatus || "unknown"}. Review it in Work Status; the saved copy has been kept.`);
    }
    if (resubmitMode === "rejected") {
      if (!payload.resubmitFile) {
        throw new Error("This saved correction needs one new photo. Open the rejected request in Work Status and save it again.");
      }
      await atSyncPhase("correction upload", () => resubmitRejectedPipeChecklist({
        submissionId: payload.submissionId,
        payload: {
          ...payload.checklistPayload,
          packageId: payload.packageId,
          clientMutationId: entry.id,
        },
        resubmitFile: payload.resubmitFile,
        files: payload.files || {},
      }));
      return payload;
    }
    if (resubmitMode !== "modify_approved") throw new Error(`Unsupported resubmission mode: ${resubmitMode}`);
    await atSyncPhase("resubmission upload", () => submitPipeChecklist({
      payload: { ...payload.checklistPayload, packageId: payload.packageId, clientMutationId: entry.id },
      files: payload.files || {},
    }));
    return payload;
  }
  let stagePackages = null;
  const work = payload.workPayload;
  if (previousPipeStage(work.workType)) {
    const prerequisite = previousPipeStage(work.workType);
    const [packages, previousWork] = await atSyncPhase("stage approval check", () => Promise.all([
      fetchAndCachePipeStagePackages({
        ownerUserId: entry.owner_user_id,
        projectId: entry.project_id,
        segmentId: work.segmentId,
        material: payload.packagePayload.material,
      }),
      fetchAndCachePipeStageWork({
        ownerUserId: entry.owner_user_id,
        projectId: entry.project_id,
        segmentId: work.segmentId,
        stage: prerequisite,
      }),
    ]));
    stagePackages = packages;
    if (!isPipeStageRangeApproved(stagePackages, previousWork, work.workType, Number(work.chainageFromM), Number(work.chainageToM))) {
      const error = new Error(`Waiting for ${previousPipeStage(work.workType).replace(/_/g, " ")} approval for this chainage range.`);
      error.code = "WAITING_PREREQUISITE";
      throw error;
    }
  }
  if (!payload.syncedWorkId) {
    const createdWork = await atSyncPhase("daily work", () =>
      createPipeDailyWork(payload.workPayload)
    );
    payload.syncedWorkId = createdWork?.id || createdWork?.workId || null;
    await queuePipeMutation({
      id: entry.id,
      ownerUserId: entry.owner_user_id,
      projectId: entry.project_id,
      operation: entry.operation,
      payload,
    });
  }
  if (!payload.syncedPackageId) {
    if (!stagePackages) stagePackages = await atSyncPhase("package lookup", () => fetchAndCachePipeStagePackages({
      ownerUserId: entry.owner_user_id,
      projectId: entry.project_id,
      segmentId: payload.packagePayload.segmentId,
      material: payload.packagePayload.material,
    }));
    const exactPackage = findExactPipePackage(stagePackages, payload.packagePayload);
    const checklistPackage = exactPackage?.packageId
      ? null
      : await atSyncPhase("package creation", () =>
          createPipeChecklistPackage(payload.packagePayload)
        );
    payload.syncedPackageId = exactPackage?.packageId || checklistPackage?.packageId || checklistPackage?.id || checklistPackage?.package?.packageId;
    if (!payload.syncedPackageId) throw new Error("Checklist package ID was not returned by the server.");
    await queuePipeMutation({
      id: entry.id,
      ownerUserId: entry.owner_user_id,
      projectId: entry.project_id,
      operation: entry.operation,
      payload,
    });
  }
  await atSyncPhase("checklist upload", () => submitPipeChecklist({
    payload: { ...payload.checklistPayload, packageId: payload.syncedPackageId, clientMutationId: entry.id },
    files: payload.files,
  }));
  return payload;
};

export const flushPendingPipeMutations = (ownerUserId, { force = false, onlyIds = null } = {}) => {
  if (!ownerUserId) return Promise.resolve({ checked: 0, synced: 0, failed: 0, deferred: 0, syncedIds: [], deferredIds: [], failures: [] });
  const ownerKey = String(ownerUserId);
  const activeFlush = flushPromisesByOwner.get(ownerKey);
  if (activeFlush) {
    // An entry saved while a background pass is running may not be in that pass.
    // Wait for it, then explicitly check the newly saved entry.
    return force || onlyIds?.length
      ? activeFlush.then(() => flushPendingPipeMutations(ownerUserId, { force, onlyIds }))
      : activeFlush;
  }
  const flushPromise = (async () => {
    const allEntries = await listPendingPipeMutations(ownerUserId, { force });
    const targetIds = onlyIds?.length ? new Set(onlyIds.map(String)) : null;
    const entries = targetIds
      ? allEntries.filter((entry) => targetIds.has(String(entry.id)))
      : allEntries;
    const result = { checked: entries.length, synced: 0, failed: 0, deferred: 0, syncedIds: [], deferredIds: [], failures: [] };
    logPipeSync("flush started", { queued: entries.length, force, targeted: Boolean(targetIds) });
    for (const entry of entries) {
      try {
        if (!["create_pipe_entry", "resubmit_pipe_entry"].includes(entry.operation)) throw new Error(`Unsupported Pipe Network operation: ${entry.operation}`);
        const submittedPayload = await syncPipeEntry(entry);
        await completePipeMutation(entry.id, submittedPayload);
        result.synced += 1;
        result.syncedIds.push(entry.id);
        logPipeSync("submission synced", { operation: entry.operation, attempts: Number(entry.attempts || 0) });
      } catch (error) {
        if (error?.code === "WAITING_PREREQUISITE") {
          await deferPipeMutation({ id: entry.id, reason: error.message });
          result.deferred += 1;
          result.deferredIds.push(entry.id);
          logPipeSync("submission waiting for stage approval", { operation: entry.operation, message: error.message });
          continue;
        }
        // Keep every failed submission available for automatic/manual retry.
        // Validation/permission/upload-limit errors need user attention; an
        // unchanged automatic retry would just repeat the same server error.
        const status = Number(error?.status || 0);
        const needsAttention = status >= 400 && status < 500 && status !== 408 && status !== 429;
        const phase = error?.syncPhase || "sync";
        await failPipeMutation({
          id: entry.id,
          error: `${phase}: ${status ? `HTTP ${status}: ` : ""}${error?.message || "Sync failed"}`,
          blocked: needsAttention,
        });
        result.failed += 1;
        result.failures.push({
          id: entry.id,
          status: Number(error?.status || 0),
          code: error?.code || "",
          phase,
          message: error?.message || "Sync failed",
        });
        logPipeSync("submission retry scheduled", {
          operation: entry.operation,
          status: Number(error?.status || 0),
          code: error?.code || "",
          phase,
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
