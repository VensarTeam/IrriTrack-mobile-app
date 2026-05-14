const CONTRIBUTOR_ROLES = new Set([
  "supervisor",
]);

const REVIEWER_ROLES = new Set(["manager", "admin", "engineer"]);

const toRoleLabel = (role = "") =>
  String(role || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const normalizeUserRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

export const createRoleAccess = (role) => {
  const normalizedRole = normalizeUserRole(role);
  const isContributor = CONTRIBUTOR_ROLES.has(normalizedRole);
  const isReviewer = REVIEWER_ROLES.has(normalizedRole);
  const isManagedRole = isContributor || isReviewer;

  if (!isManagedRole) {
    return {
      role: normalizedRole,
      roleLabel: toRoleLabel(normalizedRole),
      isContributor: false,
      isReviewer: false,
      isManagedRole: false,
      canVerifyChecklist: false,
      canApproveChecklist: false,
      canRejectChecklist: false,
      prefersSingleReviewAction: false,
      canViewProjectInsights: true,
      canOpenModuleList: true,
      canOpenUnitDetails: true,
      canViewUnitStatus: true,
      canOpenProcessTabs: true,
      canEditChecklist: true,
      canReviewChecklist: false,
      projectDetailsNotice: "",
      unitListNotice: "",
      checklistReadOnlyNotice: "",
      reviewNotice: "",
    };
  }

  return {
    role: normalizedRole,
    roleLabel: toRoleLabel(normalizedRole),
    isContributor,
    isReviewer,
    isManagedRole,
    canVerifyChecklist:
      normalizedRole === "engineer" || normalizedRole === "manager",
    canApproveChecklist: normalizedRole === "manager",
    canRejectChecklist:
      normalizedRole === "engineer" || normalizedRole === "manager",
    prefersSingleReviewAction: false,
    // Temporary override: allow supervisor to see full Project Details insights.
    canViewProjectInsights: true,
    canOpenModuleList: true,
    canOpenUnitDetails: true,
    canViewUnitStatus: true,
    canOpenProcessTabs: true,
    canEditChecklist: isContributor,
    canReviewChecklist: isReviewer,
    projectDetailsNotice: isContributor
      ? "Module-wise analytics are available for admin, manager, and engineer roles. You can continue with OMS checklist work from the cards below."
      : "",
    unitListNotice: isContributor
      ? "Open a process card to fill the checklist. Unit details are available for admin, manager, and engineer roles."
      : "Open a unit card for full status details, or use a process card to review checklist data.",
    checklistReadOnlyNotice: isReviewer
      ? "Admin, manager, and engineer roles can review submitted checklist data here, but cannot edit field entries."
      : "",
    reviewNotice:
      normalizedRole === "admin"
        ? "Admin can view every submission here, but cannot verify, approve, or reject."
        : isReviewer
          ? "Review workflow actions are available after opening a submitted item from Work Status."
          : "",
  };
};
