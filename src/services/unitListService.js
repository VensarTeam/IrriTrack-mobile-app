import { apiRequestWithMeta } from "./apiClient";
import { getCachedOmsBasicUnitsPage } from "./omsOfflineStore";

export const DEFAULT_OMS_PAGE_LIMIT = 20;

const OMS_LIST_API_PATHS = ["/api/v1/oms", "/oms"];

const createEmptyMeta = ({ page = 1, limit = DEFAULT_OMS_PAGE_LIMIT } = {}) => ({
  page,
  limit,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
});

const buildOmsListParams = ({
  projectId,
  zoneName,
  villageId,
  searchQuery,
  page = 1,
  limit = DEFAULT_OMS_PAGE_LIMIT,
} = {}) => {
  const params = {
    projectId,
    page,
    limit,
  };

  if (zoneName && zoneName !== "All") {
    params.zoneName = zoneName;
  }

  if (villageId && villageId !== "All") {
    // The OMS list API currently expects the lowercase query key from the backend contract.
    params.villageid = villageId;
  }

  const normalizedSearchQuery = String(searchQuery || "").trim();

  if (normalizedSearchQuery) {
    params.q = normalizedSearchQuery;
  }

  return params;
};

const normalizeOmsListResponse = (
  response,
  { page = 1, limit = DEFAULT_OMS_PAGE_LIMIT } = {}
) => ({
  success: response?.success !== false,
  data: Array.isArray(response?.data) ? response.data : [],
  meta: {
    ...createEmptyMeta({ page, limit }),
    ...(response?.meta || {}),
  },
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

  throw lastNotFoundError || new Error("Unable to fetch OMS units.");
};

export const fetchOmsList = async ({
  projectId,
  zoneName,
  villageId,
  searchQuery,
  page = 1,
  limit = DEFAULT_OMS_PAGE_LIMIT,
  offline = false,
} = {}) => {
  if (!projectId) {
    return normalizeOmsListResponse(null, { page, limit });
  }

  if (offline) {
    const cachedResponse = await getCachedOmsBasicUnitsPage({
      projectId,
      searchQuery,
      page,
      limit,
    });

    return normalizeOmsListResponse(cachedResponse, { page, limit });
  }

  const response = await fetchWithFallbackPaths({
    paths: OMS_LIST_API_PATHS,
    params: buildOmsListParams({
      projectId,
      zoneName,
      villageId,
      searchQuery,
      page,
      limit,
    }),
  });

  return normalizeOmsListResponse(response, { page, limit });
};
