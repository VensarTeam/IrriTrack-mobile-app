import { apiRequest } from "./apiClient";

export const fetchManagedUsers = ({ q, page = 1, limit = 50, signal } = {}) =>
  apiRequest({
    url: "developer/configuration/users",
    method: "GET",
    params: { q: q?.trim() || undefined, page, limit, status: "all" },
    signal,
  });

export const fetchManagedUserPermissions = ({ userId, signal }) =>
  apiRequest({
    url: `developer/configuration/users/${userId}/permissions`,
    method: "GET",
    signal,
  });

export const fetchRoleOptions = ({ signal } = {}) =>
  apiRequest({ url: "roles", method: "GET", signal });

export const updateManagedUserRole = ({ userId, roleId }) =>
  apiRequest({
    url: `developer/configuration/users/${userId}/role`,
    method: "PATCH",
    data: { roleId },
  });

export const updateManagedUserPermissions = ({ userId, overrides }) =>
  apiRequest({
    url: `developer/configuration/users/${userId}/permissions`,
    method: "PATCH",
    data: { overrides },
  });
