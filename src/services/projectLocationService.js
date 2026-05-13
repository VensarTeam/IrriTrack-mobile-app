import { API_ENDPOINTS } from "../config/env";
import { apiRequestWithMeta } from "./apiClient";
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

const normalizeZoneOptions = (items = []) => {
  const zonesByKey = new Map();

  items.forEach((item) => {
    if (typeof item === "string") {
      const name = String(item).trim();

      if (!name || zonesByKey.has(name)) {
        return;
      }

      zonesByKey.set(name, {
        id: name,
        name,
        omsQty: null,
      });
      return;
    }

    const id = String(item?.id || item?.name || "").trim();
    const name = String(item?.name || "").trim();

    if (!id || !name || zonesByKey.has(name)) {
      return;
    }

    const totalOms = Number(
      item?.totalOms ?? item?.omsQty ?? item?.omsqty ?? item?.noOfOms ?? 0
    );

    zonesByKey.set(name, {
      id,
      name,
      totalOms,
      omsQty: totalOms,
    });
  });

  return Array.from(zonesByKey.values()).sort((left, right) =>
    compareByName(left.name, right.name)
  );
};

const normalizeVillageOptions = (items = []) => {
  const villagesById = new Map();

  items.forEach((item) => {
    const id = String(item?.id || "").trim();
    const name = String(item?.name || "").trim();

    if (!id || !name || villagesById.has(id)) {
      return;
    }

    const totalOms = Number(item?.totalOms ?? item?.noOfOms ?? item?.omsQty ?? 0);

    villagesById.set(id, {
      id,
      name,
      totalOms,
      noOfOms: totalOms,
      zoneNames: Array.isArray(item?.zoneNames) ? item.zoneNames : [],
    });
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

const fetchProjectFilters = async ({ path, params }) => {
  return apiRequestWithMeta({
    url: path,
    method: "GET",
    headers: {
      Accept: "*/*",
    },
    params,
  });
};

const buildFilterCacheKey = ({
  projectId,
  searchQuery = "",
  zoneName = "",
  villageId = "",
  page = FILTER_PAGE,
  limit = FILTER_PAGE_LIMIT,
}) =>
  [
    String(projectId || "").trim(),
    String(zoneName || "").trim() || "ALL",
    String(villageId || "").trim() || "ALL",
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
    villageId = "",
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
    villageId,
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
      fetchProjectFilters({
        path: API_ENDPOINTS.zones,
        params: {
          projectId,
          page,
          limit,
          ...(villageId ? { villageId } : {}),
          ...(String(searchQuery || "").trim()
            ? { q: String(searchQuery || "").trim() }
            : {}),
        },
      })
        .then((response) => {
          const normalizedResponse = normalizeFilterResponse(response, {
            page,
            limit,
            itemNormalizer: normalizeZoneOptions,
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
      fetchProjectFilters({
        path: API_ENDPOINTS.villages,
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
