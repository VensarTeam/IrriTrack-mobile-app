import { apiRequestWithMeta } from "./apiClient";

const ZONE_API_PATHS = ["/api/v1/zones", "/zones"];
const VILLAGE_API_PATHS = ["/api/v1/villages", "/villages"];
const FILTER_PAGE = 1;
export const FILTER_PAGE_LIMIT = 20;
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
        .map((item) => {
          if (typeof item === "string") {
            return String(item).trim();
          }

          return String(item?.[key] || "").trim();
        })
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

const createEmptyMeta = ({
  page = FILTER_PAGE,
  limit = FILTER_PAGE_LIMIT,
} = {}) => ({
  page,
  limit,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
});

const fetchWithFallbackPaths = async ({ paths, params }) => {
  let lastNotFoundError = null;

  for (const path of paths) {
    try {
      return await apiRequestWithMeta({
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

const buildFilterCacheKey = ({
  projectId,
  searchQuery = "",
  zoneName = "",
  page = FILTER_PAGE,
  limit = FILTER_PAGE_LIMIT,
}) =>
  [
    String(projectId || "").trim(),
    String(zoneName || "").trim() || "ALL",
    String(searchQuery || "").trim().toLowerCase() || "ALL",
    String(page || FILTER_PAGE),
    String(limit || FILTER_PAGE_LIMIT),
  ].join("::");

const normalizeFilterItems = (response) =>
  Array.isArray(response?.data) ? response.data : [];

const normalizeFilterMeta = (
  response,
  { page = FILTER_PAGE, limit = FILTER_PAGE_LIMIT } = {}
) => ({
  ...createEmptyMeta({ page, limit }),
  ...(response?.meta || {}),
});

const normalizeFilterResponse = (
  response,
  {
    page = FILTER_PAGE,
    limit = FILTER_PAGE_LIMIT,
    itemNormalizer = (items) => items,
  } = {}
) => {
  if (Array.isArray(response?.items)) {
    return {
      items: itemNormalizer(response.items),
      meta: {
        ...createEmptyMeta({ page, limit }),
        ...(response?.meta || {}),
      },
    };
  }

  if (Array.isArray(response)) {
    return {
      items: itemNormalizer(response),
      meta: createEmptyMeta({ page, limit }),
    };
  }

  return {
    items: itemNormalizer(normalizeFilterItems(response)),
    meta: normalizeFilterMeta(response, { page, limit }),
  };
};

export const fetchProjectZones = async (
  projectId,
  {
    searchQuery = "",
    page = FILTER_PAGE,
    limit = FILTER_PAGE_LIMIT,
  } = {}
) => {
  if (!projectId) {
    return {
      items: [],
      meta: createEmptyMeta({ page, limit }),
    };
  }

  const cacheKey = buildFilterCacheKey({
    projectId,
    searchQuery,
    page,
    limit,
  });

  if (zoneResponseCache.has(cacheKey)) {
    return zoneResponseCache.get(cacheKey);
  }

  if (!zoneRequestPromises.has(cacheKey)) {
    zoneRequestPromises.set(
      cacheKey,
      fetchWithFallbackPaths({
        paths: ZONE_API_PATHS,
        params: {
          projectId,
          page,
          limit,
          ...(String(searchQuery || "").trim()
            ? { q: String(searchQuery || "").trim() }
            : {}),
        },
      })
        .then((response) => {
          const normalizedResponse = normalizeFilterResponse(response, {
            page,
            limit,
            itemNormalizer: (items) => normalizeNames(items, "name"),
          });
          zoneResponseCache.set(cacheKey, normalizedResponse);
          return normalizedResponse;
        })
        .finally(() => {
          zoneRequestPromises.delete(cacheKey);
        })
    );
  }

  return zoneRequestPromises.get(cacheKey);
};

export const fetchProjectVillageOptions = async (
  projectId,
  {
    zoneName = "",
    searchQuery = "",
    page = FILTER_PAGE,
    limit = FILTER_PAGE_LIMIT,
  } = {}
) => {
  if (!projectId) {
    return {
      items: [],
      meta: createEmptyMeta({ page, limit }),
    };
  }

  const cacheKey = buildFilterCacheKey({
    projectId,
    zoneName,
    searchQuery,
    page,
    limit,
  });

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
          page,
          limit,
          ...(zoneName && zoneName !== "All" ? { zoneName } : {}),
          ...(String(searchQuery || "").trim()
            ? { q: String(searchQuery || "").trim() }
            : {}),
        },
      })
        .then((response) => {
          const normalizedResponse = normalizeFilterResponse(response, {
            page,
            limit,
            itemNormalizer: normalizeVillageOptions,
          });
          villageResponseCache.set(cacheKey, normalizedResponse);
          return normalizedResponse;
        })
        .finally(() => {
          villageRequestPromises.delete(cacheKey);
        })
    );
  }

  return villageRequestPromises.get(cacheKey);
};
