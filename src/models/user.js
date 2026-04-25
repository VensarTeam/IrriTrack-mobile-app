import { resolveAssetUrl } from "../config/env";
import { normalizeUserRole } from "../services/roleAccess";

export const createUser = (data = {}) => ({
  id: data.id || "",
  name: data.username || data.name || "",
  username: data.username || data.name || "",
  mobile: data.mobile || "",
  email: data.email || "",
  designation: data.designation || "",
  role: normalizeUserRole(data.role),
  projectId: data.projectId ?? null,
  profileUrl: data.profileUrl ? resolveAssetUrl(data.profileUrl) : "",
  verifyFaceRegistered: Boolean(data.verifyFaceRegistered),
  isActive: data.isActive !== false,
});
