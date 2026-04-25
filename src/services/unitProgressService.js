import { apiRequest } from "./apiClient";
import {
  createEmptyUnitProgress,
  createUnitProgress,
} from "../models/unitProgress";
//{{localUrl}}projects/b10a7bd2-b516-430f-b292-fe2cda41de75/oms/d3631dd3-8e3a-4381-847a-0168d995c664/progress
const UNIT_PROGRESS_API_PATHS = (projectId, unitId) => [
  `/api/v1/oms/${projectId}/${unitId}/progress`,
  `/projects/${projectId}/oms/${unitId}/progress`,
  `/api/v1/projects/id/${projectId}/oms/${unitId}/progress`,
];

const unitProgressResponseCache = new Map();
const unitProgressRequestPromises = new Map();

const buildUnitProgressCacheKey = ({ projectId, unitId }) =>
  `${projectId || "UNKNOWN"}::${unitId || "UNKNOWN"}`;

const fetchWithFallbackPaths = async ({ paths }) => {
  let lastNotFoundError = null;

  for (const path of paths) {
    try {
      return await apiRequest({
        url: path,
        method: "GET",
        headers: {
          Accept: "*/*",
        },
      });
    } catch (error) {
      if (error?.status === 404) {
        lastNotFoundError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastNotFoundError || new Error("Unable to fetch unit progress.");
};

export const fetchUnitProgress = async ({
  projectId,
  unitId,
  forceRefresh = false,
} = {}) => {
  if (!projectId || !unitId) {
    return createEmptyUnitProgress();
  }

  const cacheKey = buildUnitProgressCacheKey({ projectId, unitId });

  if (forceRefresh) {
    unitProgressResponseCache.delete(cacheKey);
    unitProgressRequestPromises.delete(cacheKey);
  }

  if (unitProgressResponseCache.has(cacheKey)) {
    return unitProgressResponseCache.get(cacheKey);
  }

  if (!unitProgressRequestPromises.has(cacheKey)) {
    unitProgressRequestPromises.set(
      cacheKey,
      fetchWithFallbackPaths({
        paths: UNIT_PROGRESS_API_PATHS(projectId, unitId),
      })
        .then((response) => {
          const normalizedProgress = createUnitProgress(response);
          unitProgressResponseCache.set(cacheKey, normalizedProgress);
          return normalizedProgress;
        })
        .finally(() => {
          unitProgressRequestPromises.delete(cacheKey);
        }),
    );
  }

  return unitProgressRequestPromises.get(cacheKey);
};
