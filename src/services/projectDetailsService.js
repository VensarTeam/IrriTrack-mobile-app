import { API_ENDPOINTS, buildApiEndpointPath } from "../config/env";
import { apiRequest } from "./apiClient";
import {
  createEmptyProjectDetails,
  createProjectDetails,
} from "../models/projectDetails";

const projectDetailsResponseCache = new Map();
const projectDetailsRequestPromises = new Map();
const projectDetailsCacheVersions = new Map();

const buildProjectDetailsCacheKey = ({
  projectId,
  zoneName = "",
  villageId = "",
}) => `${projectId}::${zoneName || "ALL"}::${villageId || "ALL"}`;

const buildProjectDetailsParams = ({ zoneName, villageId }) => {
  const params = {};

  // When filters are omitted, the API returns the project-wide summary.
  if (zoneName && zoneName !== "All") {
    params.zoneName = zoneName;
  }

  if (villageId) {
    // Project details filtering expects the camelCase query key.
    params.villageId = villageId;
  }

  return params;
};

const fetchProjectDetailsFromApi = async ({ projectId, params }) => {
  return apiRequest({
    url: buildApiEndpointPath(API_ENDPOINTS.projectDetails, { projectId }),
    method: "GET",
    headers: {
      Accept: "*/*",
    },
    params,
  });
};

export const fetchProjectDetails = async ({
  projectId,
  zoneName,
  villageId,
  forceRefresh = false,
} = {}) => {
  if (!projectId) {
    return createEmptyProjectDetails();
  }

  const cacheKey = buildProjectDetailsCacheKey({
    projectId,
    zoneName,
    villageId,
  });

  if (forceRefresh) {
    projectDetailsCacheVersions.set(
      cacheKey,
      (projectDetailsCacheVersions.get(cacheKey) || 0) + 1
    );
    projectDetailsResponseCache.delete(cacheKey);
    projectDetailsRequestPromises.delete(cacheKey);
  }

  if (projectDetailsResponseCache.has(cacheKey)) {
    return projectDetailsResponseCache.get(cacheKey);
  }

  if (!projectDetailsRequestPromises.has(cacheKey)) {
    const params = buildProjectDetailsParams({ zoneName, villageId });
    const cacheVersion = projectDetailsCacheVersions.get(cacheKey) || 0;
    console.log("[ProjectDetails]", "Fetching project details", {
      projectId,
      zoneName: zoneName || "All",
      villageId: villageId || "",
      params,
    });

    const requestPromise = fetchProjectDetailsFromApi({
      projectId,
      params,
    })
      .then((response) => {
        const normalizedProjectDetails = createProjectDetails(response);

        if ((projectDetailsCacheVersions.get(cacheKey) || 0) === cacheVersion) {
          projectDetailsResponseCache.set(cacheKey, normalizedProjectDetails);
        }

        return normalizedProjectDetails;
      })
      .finally(() => {
        if (projectDetailsRequestPromises.get(cacheKey) === requestPromise) {
          projectDetailsRequestPromises.delete(cacheKey);
        }
      });

    projectDetailsRequestPromises.set(cacheKey, requestPromise);
  }

  return projectDetailsRequestPromises.get(cacheKey);
};
