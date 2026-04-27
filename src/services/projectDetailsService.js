import { apiRequest } from "./apiClient";
import {
  createEmptyProjectDetails,
  createProjectDetails,
} from "../models/projectDetails";

const PROJECT_DETAILS_API_PATHS = (projectId) => [
  `/api/v1/projects/id/${projectId}`,
  `/projects/id/${projectId}`,
];

const projectDetailsResponseCache = new Map();
const projectDetailsRequestPromises = new Map();

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

  throw lastNotFoundError || new Error("Unable to fetch project details.");
};

export const fetchProjectDetails = async ({
  projectId,
  zoneName,
  villageId,
} = {}) => {
  if (!projectId) {
    return createEmptyProjectDetails();
  }

  const cacheKey = buildProjectDetailsCacheKey({
    projectId,
    zoneName,
    villageId,
  });

  if (projectDetailsResponseCache.has(cacheKey)) {
    return projectDetailsResponseCache.get(cacheKey);
  }

  if (!projectDetailsRequestPromises.has(cacheKey)) {
    const params = buildProjectDetailsParams({ zoneName, villageId });
    console.log("[ProjectDetails]", "Fetching project details", {
      projectId,
      zoneName: zoneName || "All",
      villageId: villageId || "",
      params,
    });

    projectDetailsRequestPromises.set(
      cacheKey,
      fetchWithFallbackPaths({
        paths: PROJECT_DETAILS_API_PATHS(projectId),
        params,
      })
        .then((response) => {
          const normalizedProjectDetails = createProjectDetails(response);
          projectDetailsResponseCache.set(cacheKey, normalizedProjectDetails);
          return normalizedProjectDetails;
        })
        .finally(() => {
          projectDetailsRequestPromises.delete(cacheKey);
        })
    );
  }

  return projectDetailsRequestPromises.get(cacheKey);
};
