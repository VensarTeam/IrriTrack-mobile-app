import { normalizeUserRole } from "./roleAccess";

const normalizeId = (value) => String(value || "").trim();

const normalizeFeaturePermissions = (permissions = {}) => ({
  canViewOms: Boolean(permissions.canViewOms),
  canAssignWork: Boolean(permissions.canAssignWork),
  canCreateProject: Boolean(permissions.canCreateProject),
  canViewDistributaryNetwork: Boolean(
    permissions.canViewDistributaryNetwork
  ),
  canViewPipeLaying: Boolean(permissions.canViewPipeLaying),
  canViewDeveloperModule: Boolean(permissions.canViewDeveloperModule),
  canViewTracking: Boolean(permissions.canViewTracking),
  canViewConfiguration: Boolean(permissions.canViewConfiguration),
});

const normalizePermissionList = (values = []) =>
  [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    ),
  ].sort();

export const normalizeAuthorizationSnapshot = (
  menu = {},
  fallbackRole = ""
) => ({
  userId: normalizeId(menu.userId),
  role: normalizeUserRole(menu.role || fallbackRole),
  permissions: normalizeFeaturePermissions(menu.permissions),
  effectivePermissions: normalizePermissionList(menu.effectivePermissions),
  // Keep SecureStore compact. Allowed projects and OMS data are persisted in
  // their dedicated offline stores after this menu has authorized the session.
  serviceIds: normalizePermissionList(
    (Array.isArray(menu.services) ? menu.services : []).map(
      (item) => item?.serviceId || item?.id
    )
  ),
  projectIds: normalizePermissionList(
    (Array.isArray(menu.projects) ? menu.projects : []).map(
      (item) => item?.id || item?.projectId
    )
  ),
  syncedAt: new Date().toISOString(),
});

export const isProjectAllowed = (authorization, project) => {
  if (!authorization || !project) return false;

  const allowedIds = new Set(
    (authorization.projectIds || []).map((value) => normalizeId(value).toLowerCase())
  );

  // Older offline snapshots stored the project code rather than the UUID.
  return [project.id, project.projectId].some(
    (value) => value && allowedIds.has(normalizeId(value).toLowerCase())
  );
};

export const isAuthorizationSnapshotForUser = (
  snapshot,
  user = {}
) => {
  if (!snapshot) {
    return false;
  }

  const snapshotUserId = normalizeId(snapshot.userId);
  const userId = normalizeId(user.id);

  return (
    snapshot.role === normalizeUserRole(user.role) &&
    (!snapshotUserId || !userId || snapshotUserId === userId)
  );
};
