import { apiRequest } from "./apiClient";
import { API_ENDPOINTS } from "../config/env";

export const createContractor = async ({
  firmName,
  ownerName,
  mobileNumber,
  email,
}) => {
  return apiRequest({
    url: API_ENDPOINTS.contractors,
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
};
