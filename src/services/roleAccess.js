const CONTRIBUTOR_ROLES = new Set([
  "supervisor",
]);

const REVIEWER_ROLES = new Set([
  "manager",
  "admin",
  "super_admin",
  "engineer",
  "developer",
  "ho",
  "auditor_readonly",
]);

const ROLE_ALIASES = Object.freeze({
  field_engineer: "engineer",
  site_engineer: "engineer",
});

const toRoleLabel = (role = "") =>
  String(role || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const normalizeUserRole = (role) =>
  ROLE_ALIASES[String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")] ||
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const normalizeId = (value) => String(value || "").trim().toLowerCase();

export const createOmsWorkflowAccess = ({
  role,
  userId,
  assignedEngineerId,
  assignedManagerId,
} = {}) => {
  const normalizedRole = normalizeUserRole(role);
  const actorId = normalizeId(userId);
  const engineerId = normalizeId(assignedEngineerId);
  const managerId = normalizeId(assignedManagerId);
  const hasRouting = Boolean(engineerId || managerId);
  const isEngineer = normalizedRole === "engineer";
  const isManager = normalizedRole === "manager";
  const isAssignedEngineer = Boolean(actorId && engineerId === actorId);
  const isAssignedManager = Boolean(actorId && managerId === actorId);
  const canReview = hasRouting
    ? (isEngineer && isAssignedEngineer) ||
      (isManager && (isAssignedEngineer || isAssignedManager))
    : isEngineer || isManager;

  return {
    hasRouting,
    isAssignedEngineer,
    isAssignedManager,
    canReview,
    canVerify: canReview,
    canReject: canReview,
    canModify: canReview,
    canReviewModifyRequest: canReview,
    canApprove: hasRouting ? isManager && isAssignedManager : isManager,
  };
};

export const createRoleAccess = (role, authorization = null) => {
  const normalizedRole = normalizeUserRole(role);
  const isContributor = CONTRIBUTOR_ROLES.has(normalizedRole);
  const isReviewer = REVIEWER_ROLES.has(normalizedRole);
  const isManagedRole = isContributor || isReviewer;
  const hasMatchingAuthorization =
    authorization?.role === normalizedRole &&
    Array.isArray(authorization?.effectivePermissions);
  const isAuthorizationReady = Boolean(
    hasMatchingAuthorization && authorization?.syncedAt
  );
  const effectivePermissions = new Set(
    hasMatchingAuthorization ? authorization.effectivePermissions : []
  );
  const canViewOms = hasMatchingAuthorization
    ? Boolean(
        authorization?.permissions?.canViewOms ||
          effectivePermissions.has("oms.view")
      )
    : isManagedRole;

  if (!isManagedRole) {
    return {
      role: normalizedRole,
      roleLabel: toRoleLabel(normalizedRole),
      isContributor: false,
      isReviewer: false,
      isManagedRole: false,
      isAuthorizationReady: false,
      canVerifyChecklist: false,
      canApproveChecklist: false,
      canRejectChecklist: false,
      prefersSingleReviewAction: false,
      canViewProjectInsights: false,
      canOpenModuleList: false,
      canOpenUnitDetails: false,
      canViewUnitStatus: false,
      canOpenProcessTabs: false,
      canEditChecklist: false,
      canReviewChecklist: false,
      projectDetailsNotice: "",
      unitListNotice: "",
      checklistReadOnlyNotice: "",
      reviewNotice: "",
      canViewOms: false,
      canViewPipeLaying: false,
      effectivePermissions,
    };
  }

  return {
    role: normalizedRole,
    roleLabel: toRoleLabel(normalizedRole),
    isContributor,
    isReviewer,
    isManagedRole,
    isAuthorizationReady,
    canVerifyChecklist:
      isAuthorizationReady &&
      (normalizedRole === "engineer" || normalizedRole === "manager"),
    canApproveChecklist:
      isAuthorizationReady && normalizedRole === "manager",
    canRejectChecklist:
      isAuthorizationReady &&
      (normalizedRole === "engineer" || normalizedRole === "manager"),
    prefersSingleReviewAction: false,
    canViewProjectInsights: isReviewer,
    canOpenModuleList: true,
    canOpenUnitDetails: isReviewer,
    canViewUnitStatus: isReviewer,
    canOpenProcessTabs: true,
    canEditChecklist: isContributor,
    canReviewChecklist: isReviewer,
    canViewOms,
    canViewPipeLaying: hasMatchingAuthorization
      ? Boolean(
          authorization?.permissions?.canViewPipeLaying ||
            effectivePermissions.has("pipe_laying.view") ||
            [...effectivePermissions].some((permission) =>
              permission.startsWith("pipe_laying.screen.")
            )
        )
      : normalizedRole === "supervisor",
    effectivePermissions,
    projectDetailsNotice: isContributor
      ? "Module-wise analytics are available for super admin, admin, manager, and engineer roles. You can continue with OMS checklist work from the cards below."
      : "",
    unitListNotice: isContributor
      ? "Open a process card to fill the checklist. Unit details are available for super admin, admin, manager, and engineer roles."
      : "Open a unit card for full status details, or use a process card to review checklist data.",
    checklistReadOnlyNotice: isReviewer
      ? "Reviewer roles can inspect submitted checklist data here, but cannot edit field entries."
      : "",
    reviewNotice: isReviewer
      ? normalizedRole === "engineer" || normalizedRole === "manager"
        ? "Review workflow actions are available after opening an assigned item from Work Status."
        : `${toRoleLabel(normalizedRole)} can view every submission here, but cannot verify, approve, or reject.`
      : "",
  };
};
