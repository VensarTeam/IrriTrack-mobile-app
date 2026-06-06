import { API_ENDPOINTS } from "../config/env";
import { apiRequestWithMeta } from "./apiClient";
import { getCachedOmsBasicUnitsPage } from "./omsOfflineStore";
import { getOmsStatusFilterApiValue } from "../constants/omsFilterConfig";

export const DEFAULT_OMS_PAGE_LIMIT = 5;

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
  subprocessId,
  status,
  sortBy,
  sortOrder,
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
    // Keep casing aligned with the backend filter contract.
    params.villageId = villageId;
  }

  const normalizedSearchQuery = String(searchQuery || "").trim();

  if (normalizedSearchQuery) {
    params.q = normalizedSearchQuery;
  }

  const hasSubprocessId =
    subprocessId !== null && subprocessId !== undefined && subprocessId !== "";
  const hasStatus =
    status !== null && status !== undefined && status !== "";
  const normalizedSubprocessId = hasSubprocessId ? Number(subprocessId) : NaN;
  const normalizedStatus = getOmsStatusFilterApiValue(status);

  if (hasSubprocessId && Number.isInteger(normalizedSubprocessId) && normalizedSubprocessId > 0) {
    params.subprocessId = normalizedSubprocessId;
  }

  if (hasStatus && String(normalizedStatus || "").trim()) {
    params.status = normalizedStatus;
  }

  const normalizedSortBy = String(sortBy || "").trim().toLowerCase();
  const normalizedSortOrder = String(sortOrder || "").trim().toLowerCase();

  if (["oms", "date", "contractor"].includes(normalizedSortBy)) {
    params.sortBy = normalizedSortBy;
  }

  if (["asc", "desc"].includes(normalizedSortOrder)) {
    params.sortOrder = normalizedSortOrder;
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

const fetchOmsListFromApi = async ({ params }) => {
  return apiRequestWithMeta({
    url: API_ENDPOINTS.omsList,
    method: "GET",
    headers: {
      Accept: "*/*",
    },
    params,
  });
};

export const fetchOmsList = async ({
  projectId,
  zoneName,
  villageId,
  searchQuery,
  subprocessId,
  status,
  sortBy,
  sortOrder,
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

  const response = await fetchOmsListFromApi({
    params: buildOmsListParams({
      projectId,
      zoneName,
      villageId,
      searchQuery,
      subprocessId,
      status,
      sortBy,
      sortOrder,
      page,
      limit,
    }),
  });

  return normalizeOmsListResponse(response, { page, limit });
};
