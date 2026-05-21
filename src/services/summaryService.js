import { API_ENDPOINTS } from "../config/env";
import { apiRequestWithMeta } from "./apiClient";

const DEFAULT_PAGE_LIMIT = 20;
const phaseSummaryCache = new Map();
const phaseSummaryRequestPromises = new Map();

const normalizeEndpointPath = (path) => {
  const trimmedPath = String(path).trim();
  if (
    !trimmedPath ||
    trimmedPath.toLowerCase() === "undefined" ||
    trimmedPath.toLowerCase() === "null"
  ) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmedPath)) return trimmedPath;
  return trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
};

const toSafeNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const SUBPROCESS_SUMMARY_KEYS = {
  2: {
    completed: "inlet pipe laying",
    coveredArea: "inlet pipe laying installed area",
  },
  3: {
    completed: "outlet pipe laying",
    coveredArea: "outlet pipe laying installed area",
  },
  4: {
    completed: "pedestal",
    coveredArea: "pedestal installed area",
  },
  5: {
    completed: "mechanical accessories",
    coveredArea: "mechanical accessories installed area",
  },
  6: {
    completed: "automation",
    coveredArea: "automation installed area",
  },
  9: {
    completed: "wet commissioning",
    coveredArea: "wet commissioning installed area",
  },
};

const pickFirstNumber = (source = {}, keys = []) => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return toSafeNumber(source[key]);
    }
  }

  return 0;
};

const getCompletedOms = (source = {}, subprocessId = null) => {
  const subprocessKeys = SUBPROCESS_SUMMARY_KEYS[Number(subprocessId)];

  if (subprocessKeys?.completed) {
    return pickFirstNumber(source, [
      subprocessKeys.completed,
      "totalInstalledOms",
      "totalSubmittedOms",
      "totalApprovedOms",
    ]);
  }

  return toSafeNumber(source.totalApprovedOms);
};

const getCoveredArea = (source = {}, subprocessId = null) => {
  const subprocessKeys = SUBPROCESS_SUMMARY_KEYS[Number(subprocessId)];

  if (subprocessKeys?.coveredArea) {
    return pickFirstNumber(source, [
      subprocessKeys.coveredArea,
      "totalInstalledArea",
      "totalSubmittedArea",
      "totalApprovedArea",
    ]);
  }

  return toSafeNumber(source.totalApprovedArea);
};

const normalizePhaseSummary = (phase = {}, subprocessId = null) => ({
  totalOms: toSafeNumber(phase.totalOms),
  areaHa: toSafeNumber(phase.totalArea),
  totalZone: toSafeNumber(phase.totalZone),
  completedOms: getCompletedOms(phase, subprocessId),
  completedAreaHa: getCoveredArea(phase, subprocessId),
  pedestal: toSafeNumber(phase.pedestal),
  mechanical: toSafeNumber(phase["mechanical accessories"]),
  automation: toSafeNumber(phase.automation),
  commissioning: toSafeNumber(phase["wet commissioning"]),
});

const normalizeZoneSummary = (zone = {}, index = 0, subprocessId = null) => ({
  id: zone.zoneName || `zone-${index + 1}`,
  zoneName: zone.zoneName || `ZONE-${index + 1}`,
  totalOms: toSafeNumber(zone.totalOms),
  areaHa: toSafeNumber(zone.totalArea),
  completedOms: getCompletedOms(zone, subprocessId),
  completedAreaHa: getCoveredArea(zone, subprocessId),
  pedestal: toSafeNumber(zone.pedestal),
  mechanical: toSafeNumber(zone["mechanical accessories"]),
  automation: toSafeNumber(zone.automation),
  commissioning: toSafeNumber(zone["wet commissioning"]),
});

const buildPhaseSummaryCacheKey = ({
  projectId,
  subprocessId,
  phase,
  deviceType,
  page,
  limit,
}) =>
  [
    projectId,
    subprocessId || "",
    phase,
    deviceType,
    page,
    limit,
  ].join("::");

const buildPhaseSummaryCachePrefix = ({
  projectId,
  subprocessId,
  phase,
  deviceType,
}) => [projectId, subprocessId || "", phase, deviceType].join("::");

const clearPhaseSummaryCacheForRequest = (params) => {
  const cachePrefix = buildPhaseSummaryCachePrefix(params);

  Array.from(phaseSummaryCache.keys()).forEach((cacheKey) => {
    if (cacheKey.startsWith(cachePrefix)) {
      phaseSummaryCache.delete(cacheKey);
    }
  });
};

export const fetchPhaseSummary = async ({
  projectId,
  subprocessId,
  phase,
  deviceType = "oms",
  page = 1,
  limit = DEFAULT_PAGE_LIMIT,
  forceRefresh = false,
} = {}) => {
  if (!projectId || !phase) {
    return {
      phase: normalizePhaseSummary(),
      zones: [],
      meta: null,
    };
  }

  const endpointPath = normalizeEndpointPath(API_ENDPOINTS.omsPhaseSummary);

  if (!endpointPath) {
    throw new Error("OMS phase summary API path is not configured.");
  }

  const params = {
    projectId,
  };

  if (subprocessId) {
    params.subprocessId = subprocessId;
  }

  params.phase = phase;
  params.deviceType = deviceType;
  params.page = page;
  params.limit = limit;

  const cacheKey = buildPhaseSummaryCacheKey(params);

  if (forceRefresh) {
    clearPhaseSummaryCacheForRequest(params);
    phaseSummaryRequestPromises.delete(cacheKey);
  }

  if (!forceRefresh && phaseSummaryCache.has(cacheKey)) {
    return phaseSummaryCache.get(cacheKey);
  }

  if (!forceRefresh && phaseSummaryRequestPromises.has(cacheKey)) {
    return phaseSummaryRequestPromises.get(cacheKey);
  }

  const requestPromise = apiRequestWithMeta({
    url: endpointPath,
    method: "GET",
    headers: {
      Accept: "*/*",
    },
    params,
  })
    .then((response) => {
      const normalizedResponse = {
        phase: normalizePhaseSummary(response?.data?.phase, subprocessId),
        zones: Array.isArray(response?.data?.zones)
          ? response.data.zones.map((zone, index) =>
              normalizeZoneSummary(zone, index, subprocessId)
            )
          : [],
        meta: response?.meta || null,
      };

      phaseSummaryCache.set(cacheKey, normalizedResponse);
      return normalizedResponse;
    })
    .finally(() => {
      if (phaseSummaryRequestPromises.get(cacheKey) === requestPromise) {
        phaseSummaryRequestPromises.delete(cacheKey);
      }
    });

  phaseSummaryRequestPromises.set(cacheKey, requestPromise);

  return requestPromise;
};
