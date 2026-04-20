const getCustomFieldValue = (fields = [], label) =>
  fields.find(
    (field) =>
      String(field.label || "").trim().toLowerCase() ===
      String(label || "").trim().toLowerCase()
  )?.value || "";

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
    updatedAt: data.updatedAt || "",
  };
};
