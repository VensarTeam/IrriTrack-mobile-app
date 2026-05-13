import { API_ENDPOINTS, buildApiEndpointPath } from "../config/env";
import { apiRequest } from "./apiClient";
import {
  createEmptyUnitProgress,
  createUnitProgress,
} from "../models/unitProgress";
const unitProgressResponseCache = new Map();
const unitProgressRequestPromises = new Map();

const buildUnitProgressCacheKey = ({ projectId, unitId }) =>
  `${projectId || "UNKNOWN"}::${unitId || "UNKNOWN"}`;

const fetchUnitProgressFromApi = async ({ projectId, unitId, forceRefresh = false }) => {
  const headers = {
    Accept: "*/*",
  };
  const params = {};

  if (forceRefresh) {
    headers["Cache-Control"] = "no-cache, no-store, max-age=0";
    headers.Pragma = "no-cache";
    headers.Expires = "0";
    params._ = Date.now();
  }

  return apiRequest({
    url: buildApiEndpointPath(API_ENDPOINTS.omsProgress, {
      projectId,
      unitId,
    }),
    method: "GET",
    headers,
    params,
  });
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
      fetchUnitProgressFromApi({
        projectId,
        unitId,
        forceRefresh,
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
