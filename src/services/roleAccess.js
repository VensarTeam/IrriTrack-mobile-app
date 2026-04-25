const CONTRIBUTOR_ROLES = new Set([
  "field_engineer",
  "engineer",
  "technician",
]);

const REVIEWER_ROLES = new Set(["manager", "admin"]);

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
    canViewProjectInsights: isReviewer,
    canOpenModuleList: true,
    canOpenUnitDetails: isReviewer,
    canViewUnitStatus: isReviewer,
    canOpenProcessTabs: true,
    canEditChecklist: isContributor,
    canReviewChecklist: isReviewer,
    projectDetailsNotice: isContributor
      ? "Module-wise analytics are available for manager and admin roles. You can continue with OMS checklist work from the cards below."
      : "",
    unitListNotice: isContributor
      ? "Open a process card to fill the checklist. Unit details are available for manager and admin roles."
      : "Open a unit card for full status details, or use a process card to review checklist data.",
    checklistReadOnlyNotice: isReviewer
      ? "Manager and admin roles can review submitted checklist data here, but cannot edit field entries."
      : "",
    reviewNotice: isReviewer
      ? "Approve or reject after reviewing the submitted checklist data."
      : "",
  };
};
