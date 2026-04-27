const SUPPORTED_MODULE_KEYS = ["OMS", "RMS", "GW"];

const MODULE_KEY_ALIASES = {
  OMS: "OMS",
  RMS: "RMS",
  GW: "GW",
  GATEWAY: "GW",
  "LORA GATEWAY": "GW",
  LORA_GATEWAY: "GW",
};

const toSafeNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getMajorComponentNumberByLabels = (components = [], labels = []) => {
  const normalizedLabels = labels.map((label) =>
    String(label || "").trim().toLowerCase()
  );

  for (const component of components) {
    const componentName = String(component?.component || "")
      .trim()
      .toLowerCase();

    if (normalizedLabels.includes(componentName)) {
      const numericValue = toSafeNumber(component?.qty);

      if (numericValue > 0) {
        return numericValue;
      }
    }
  }

  return 0;
};

const normalizeModuleKey = (value = "") =>
  MODULE_KEY_ALIASES[String(value || "").trim().toUpperCase()] || null;

const normalizeStage = (stage = {}) => ({
  key: String(stage.key || "").trim(),
  label: String(stage.label || stage.key || "").trim(),
  completed: toSafeNumber(stage.completed),
  pending: toSafeNumber(stage.pending),
  partial: toSafeNumber(stage.partial),
});

export const createEmptyProjectModule = (module) => ({
  module,
  totalUnits: 0,
  installed: 0,
  installationBalance: 0,
  commissioned: 0,
  commissioningBalance: 0,
  stages: [],
});

const normalizeModules = (modules = {}, majorComponents = []) => {
  // Keep the UI contract stable even when the backend only returns OMS today.
  const normalizedModules = SUPPORTED_MODULE_KEYS.reduce((accumulator, module) => {
    accumulator[module] = createEmptyProjectModule(module);
    return accumulator;
  }, {});

  Object.entries(modules || {}).forEach(([moduleKey, moduleValue]) => {
    const normalizedKey = normalizeModuleKey(moduleValue?.module || moduleKey);

    if (!normalizedKey) {
      return;
    }

    normalizedModules[normalizedKey] = {
      module: normalizedKey,
      totalUnits: toSafeNumber(moduleValue?.totalUnits),
      installed: toSafeNumber(moduleValue?.installed),
      installationBalance: toSafeNumber(moduleValue?.installationBalance),
      commissioned: toSafeNumber(moduleValue?.commissioned),
      commissioningBalance: toSafeNumber(moduleValue?.commissioningBalance),
      stages: Array.isArray(moduleValue?.stages)
        ? moduleValue.stages.map((stage) => normalizeStage(stage))
        : [],
    };
  });

  normalizedModules.OMS.totalUnits =
    normalizedModules.OMS.totalUnits ||
    getMajorComponentNumberByLabels(majorComponents, [
      "Outlet Management System (OMS)",
      "OMS",
    ]);
  normalizedModules.RMS.totalUnits =
    normalizedModules.RMS.totalUnits ||
    getMajorComponentNumberByLabels(majorComponents, [
      "Remote Management System (RMS)",
      "RMS",
    ]);
  normalizedModules.GW.totalUnits =
    normalizedModules.GW.totalUnits ||
    getMajorComponentNumberByLabels(majorComponents, [
      "LORA Gateway",
      "LoRa Gateway",
      "Gateway",
    ]);

  return normalizedModules;
};

export const createProjectDetails = (data = {}) => ({
  id: data.id || "",
  projectId: data.projectId || "",
  serviceId: data.serviceId || "",
  name: data.name || "",
  shortName: data.shortName || data.name || "",
  title: data.title || "",
  stateCode: data.stateCode || "",
  workScope: data.workScope || "",
  majorComponents: Array.isArray(data.majorComponents) ? data.majorComponents : [],
  customFields: Array.isArray(data.customFields) ? data.customFields : [],
  updatedAt: data.updatedAt || "",
  modules: normalizeModules(
    data.modules,
    Array.isArray(data.majorComponents) ? data.majorComponents : []
  ),
});

export const createEmptyProjectDetails = (project = {}) =>
  createProjectDetails({
    ...project,
    modules: project?.modules || {},
  });
