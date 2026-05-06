import { apiRequest } from "./apiClient";

const CONTRACTOR_CREATE_PATHS = ["/contractors", "/api/v1/contractors"];

export const createContractor = async ({
  firmName,
  ownerName,
  mobileNumber,
  email,
}) => {
  let lastNotFoundError = null;

  for (const path of CONTRACTOR_CREATE_PATHS) {
    try {
      return await apiRequest({
        url: path,
        method: "POST",
        headers: {
          Accept: "*/*",
        },
        data: {
          firmName,
          ownerName,
          mobileNumber,
          email,
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

  throw lastNotFoundError || new Error("Unable to create contractor.");
};
