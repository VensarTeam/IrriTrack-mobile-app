const getCustomFieldValue = (fields = [], label) =>
  fields.find(
    (field) =>
      String(field.label || "").trim().toLowerCase() ===
      String(label || "").trim().toLowerCase()
  )?.value || "";

const toSafeNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getCustomFieldNumberByLabels = (fields = [], labels = []) => {
  for (const label of labels) {
    const value = getCustomFieldValue(fields, label);
    const numericValue = toSafeNumber(value);

    if (numericValue > 0) {
      return numericValue;
    }
  }

  return 0;
};

const buildProjectModules = (data = {}, customFields = []) => {
  const modules = data.modules || {};
  const omsTotalUnits =
    toSafeNumber(data.omsTotalUnits) ||
    toSafeNumber(data.omsUnits) ||
    toSafeNumber(modules?.OMS?.totalUnits) ||
    getCustomFieldNumberByLabels(customFields, [
      "OMS Total Units",
      "OMS Units",
      "Total OMS Units",
    ]);
  const rmsTotalUnits =
    toSafeNumber(data.rmsTotalUnits) ||
    toSafeNumber(data.rmsUnits) ||
    toSafeNumber(modules?.RMS?.totalUnits) ||
    getCustomFieldNumberByLabels(customFields, [
      "RMS Total Units",
      "RMS Units",
      "Total RMS Units",
    ]);
  const gwTotalUnits =
    toSafeNumber(data.gwTotalUnits) ||
    toSafeNumber(data.gatewayTotalUnits) ||
    toSafeNumber(data.gwUnits) ||
    toSafeNumber(modules?.GW?.totalUnits) ||
    getCustomFieldNumberByLabels(customFields, [
      "GW Total Units",
      "GW Units",
      "Gateway Total Units",
      "LoRa Gateway Units",
    ]);

  return {
    OMS: { totalUnits: omsTotalUnits },
    RMS: { totalUnits: rmsTotalUnits },
    GW: { totalUnits: gwTotalUnits },
  };
};

const formatArea = (value) => {
  if (!value) return "";

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return `${numericValue.toLocaleString("en-IN")} Ha`;
  }

  return String(value);
};

export const createProject = (data = {}) => {
  const customFields = data.customFields || [];
  const totalCca = getCustomFieldValue(customFields, "Total CCA");

  return {
    id: data.id,
    projectId: data.projectId || "",
    serviceId: data.serviceId || "",
    client: data.client || getCustomFieldValue(customFields, "Client"),
    name: data.name,
    shortName: data.shortName || data.name,
    title: data.title || "",
    area: data.area || formatArea(totalCca),
    stateCode: data.stateCode || "",
    workScope: data.workScope || "",
    majorComponents: data.majorComponents || [],
    customFields,
    modules: buildProjectModules(data, customFields),
    updatedAt: data.updatedAt || "",
  };
};
