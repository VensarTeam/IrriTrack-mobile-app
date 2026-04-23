import { apiRequest } from "./apiClient";

const ZONE_API_PATHS = ["/api/v1/zones", "/zones"];
const VILLAGE_API_PATHS = ["/api/v1/villages", "/villages"];
const zoneResponseCache = new Map();
const villageResponseCache = new Map();
const zoneRequestPromises = new Map();
const villageRequestPromises = new Map();

const compareByName = (left, right) =>
  String(left || "").localeCompare(String(right || ""), "en", {
    sensitivity: "base",
    numeric: true,
  });

const normalizeNames = (items = [], key) =>
  Array.from(
    new Set(
      items
        .map((item) => String(item?.[key] || "").trim())
        .filter(Boolean)
    )
  ).sort(compareByName);

const normalizeVillageOptions = (items = []) => {
  const villagesById = new Map();

  items.forEach((item) => {
    const id = String(item?.id || "").trim();
    const name = String(item?.name || "").trim();

    if (!id || !name || villagesById.has(id)) {
      return;
    }

    villagesById.set(id, { id, name });
  });

  return Array.from(villagesById.values()).sort((left, right) =>
    compareByName(left.name, right.name)
  );
};

const fetchWithFallbackPaths = async ({ paths, params }) => {
  let lastNotFoundError = null;

  for (const path of paths) {
    try {
      return await apiRequest({
        url: path,
        method: "GET",
        headers: {
          Accept: "*/*",
        },
        params,
      });
    } catch (error) {
      if (error?.status === 404) {
        lastNotFoundError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastNotFoundError || new Error("Unable to fetch project filters.");
};

export const fetchProjectZones = async (projectId) => {
  if (!projectId) {
    return [];
  }

  const cacheKey = String(projectId);

  if (zoneResponseCache.has(cacheKey)) {
    return zoneResponseCache.get(cacheKey);
  }

  if (!zoneRequestPromises.has(cacheKey)) {
    zoneRequestPromises.set(
      cacheKey,
      fetchWithFallbackPaths({
        paths: ZONE_API_PATHS,
        params: { projectId },
      })
        .then((response) => {
          const normalizedZones = normalizeNames(response, "name");
          zoneResponseCache.set(cacheKey, normalizedZones);
          return normalizedZones;
        })
        .finally(() => {
          zoneRequestPromises.delete(cacheKey);
        })
    );
  }

  return zoneRequestPromises.get(cacheKey);
};

export const fetchProjectVillageOptions = async (projectId, zoneName) => {
  if (!projectId || !zoneName || zoneName === "All") {
    return [];
  }

  const cacheKey = `${projectId}::${zoneName}`;

  if (villageResponseCache.has(cacheKey)) {
    return villageResponseCache.get(cacheKey);
  }

  if (!villageRequestPromises.has(cacheKey)) {
    villageRequestPromises.set(
      cacheKey,
      fetchWithFallbackPaths({
        paths: VILLAGE_API_PATHS,
        params: {
          projectId,
          zoneName,
        },
      })
        .then((response) => {
          const normalizedVillages = normalizeVillageOptions(response);
          villageResponseCache.set(cacheKey, normalizedVillages);
          return normalizedVillages;
        })
        .finally(() => {
          villageRequestPromises.delete(cacheKey);
        })
    );
  }

  return villageRequestPromises.get(cacheKey);
};
