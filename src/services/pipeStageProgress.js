import { fetchPipeChecklistPackages, fetchPipeCoveredIntervals } from "./pipeNetworkApi";
import { getPipeCache, savePipeCache } from "./pipeNetworkOfflineStore";

const PAGE_SIZE = 100;
const TOLERANCE_M = 0.0001;
const PREVIOUS_STAGE = {
  pipe_laying: "excavation",
  backfilling: "pipe_laying",
};

const cacheResource = (segmentId, material) => `stage-packages:${segmentId}:${material}`;
const workCacheResource = (segmentId, stage) => `stage-work:${segmentId}:${stage}`;
const mergeIntervals = (intervals) => {
  const merged = [];
  for (const [from, to] of intervals.sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1];
    if (last && from <= last[1] + TOLERANCE_M) last[1] = Math.max(last[1], to);
    else merged.push([from, to]);
  }
  return merged;
};

export const previousPipeStage = (stage) => PREVIOUS_STAGE[stage] || null;

export const getCachedPipeStagePackages = async ({ ownerUserId, projectId, segmentId, material }) => {
  const cached = await getPipeCache({
    ownerUserId,
    projectId,
    resource: cacheResource(segmentId, material),
  });
  return cached && Array.isArray(cached.payload) ? cached : null;
};

export const getCachedPipeStageWork = async ({ ownerUserId, projectId, segmentId, stage }) => {
  const cached = await getPipeCache({
    ownerUserId, projectId, resource: workCacheResource(segmentId, stage),
  });
  return cached && Array.isArray(cached.payload) ? cached : null;
};

export const fetchAndCachePipeStageWork = async ({ ownerUserId, projectId, segmentId, stage, signal }) => {
  const intervals = await fetchPipeCoveredIntervals({ projectId, segmentId, workType: stage, signal });
  try {
    await savePipeCache({
      ownerUserId, projectId, resource: workCacheResource(segmentId, stage), payload: intervals,
    });
  } catch (error) {
    console.warn("[PipeStageProgress] Could not cache completed work for offline use", error?.message);
  }
  return intervals;
};

export const fetchAndCachePipeStagePackages = async ({ ownerUserId, projectId, segmentId, material, signal }) => {
  const packages = [];
  for (let page = 1; ; page += 1) {
    const response = await fetchPipeChecklistPackages({
      projectId, segmentId, material, page, pageSize: PAGE_SIZE, signal,
    });
    const items = Array.isArray(response?.items) ? response.items : [];
    packages.push(...items);
    if (items.length < PAGE_SIZE || packages.length >= Number(response?.total || 0)) break;
  }
  try {
    await savePipeCache({
      ownerUserId,
      projectId,
      resource: cacheResource(segmentId, material),
      payload: packages,
    });
  } catch (error) {
    console.warn("[PipeStageProgress] Could not cache approved stages for offline use", error?.message);
  }
  return packages;
};

export const approvedPipeStageIntervals = (packages, stage) => {
  const intervals = (Array.isArray(packages) ? packages : [])
    .filter((pkg) => pkg?.processes?.some((process) =>
      process.processCode === stage && process.submission?.workflowStatus === "approved")
      && pkg.chainageFromM != null && pkg.chainageToM != null)
    .map((pkg) => [Number(pkg.chainageFromM), Number(pkg.chainageToM)])
    .filter(([from, to]) => Number.isFinite(from) && Number.isFinite(to) && to > from);
  return mergeIntervals(intervals);
};

export const eligiblePipeStageIntervals = (packages, previousWorkIntervals, stage) => {
  const previous = previousPipeStage(stage);
  if (!previous || !Array.isArray(previousWorkIntervals)) return [];
  const approved = approvedPipeStageIntervals(packages, previous);
  return mergeIntervals(approved.flatMap(([start, end]) => previousWorkIntervals
    .map(([from, to]) => [Math.max(start, Number(from)), Math.min(end, Number(to))])
    .filter(([from, to]) => Number.isFinite(from) && Number.isFinite(to) && to - from > TOLERANCE_M)));
};

export const approvedRangesForPipeStage = (ranges, packages, stage, previousWorkIntervals) => {
  if (!previousPipeStage(stage)) return ranges;
  const eligible = eligiblePipeStageIntervals(packages, previousWorkIntervals, stage);
  return ranges.flatMap(([start, end]) => eligible
    .map(([from, to]) => [Math.max(start, from), Math.min(end, to)])
    .filter(([from, to]) => to - from > TOLERANCE_M));
};

export const isPipeStageRangeApproved = (packages, previousWorkIntervals, stage, from, to) => {
  if (!previousPipeStage(stage)) return true;
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return false;
  const intervals = eligiblePipeStageIntervals(packages, previousWorkIntervals, stage)
    .sort((a, b) => a[0] - b[0]);
  let cursor = from;
  for (const [approvedFrom, approvedTo] of intervals) {
    if (approvedFrom > cursor + TOLERANCE_M) return false;
    if (approvedTo > cursor) cursor = approvedTo;
    if (cursor >= to - TOLERANCE_M) return true;
  }
  return false;
};

export const findExactPipePackage = (packages, payload) => (Array.isArray(packages) ? packages : [])
  .find((pkg) => pkg.segmentId === payload.segmentId
    && pkg.material === payload.material
    && pkg.chainageFromM != null && pkg.chainageToM != null
    && Math.abs(Number(pkg.chainageFromM) - Number(payload.chainageFromM)) <= TOLERANCE_M
    && Math.abs(Number(pkg.chainageToM) - Number(payload.chainageToM)) <= TOLERANCE_M);
