import { API_ENDPOINTS, buildApiEndpointPath } from "../config/env";
import { apiRequest } from "./apiClient";

const stripFileScheme = (uri = "") => String(uri).replace(/^file:\/\//, "");

const inferMimeType = (photo = {}) => {
  if (photo.type && photo.type.includes("/")) {
    return photo.type;
  }

  if (photo.mimeType) {
    return photo.mimeType;
  }

  if (photo.mime_type) {
    return photo.mime_type;
  }

  if (photo.mediaType === "video" || photo.media_type === "video") {
    return "video/mp4";
  }

  return "image/jpeg";
};

const toPositiveIntegerOrNull = (value) => {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue < 1) {
    return null;
  }

  return numericValue;
};

const toChecklistApiValue = (value, fallback = "") => {
  if (value === null || typeof value === "undefined") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) || typeof value === "object") {
    return value;
  }

  return fallback;
};

const isChecklistValueEmpty = (value) => {
  if (value === null || typeof value === "undefined") {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    if (value.updated_location || value.default_location) {
      const location = value.updated_location || value.default_location;
      return (
        !Number.isFinite(Number(location?.latitude)) ||
        !Number.isFinite(Number(location?.longitude))
      );
    }

    return Object.keys(value).length === 0;
  }

  return false;
};

const inferChecklistValueType = ({ item = {}, value, hasFile = false } = {}) => {
  const explicitValueType = item.valueType || item.value_type;

  if (typeof explicitValueType === "string" && explicitValueType.trim()) {
    return explicitValueType.trim();
  }

  if (hasFile) {
    return "file";
  }

  const normalizedInputType = String(item.input_type || item.inputType || "")
    .trim()
    .toLowerCase();
  const normalizedDataType = String(item.data_type || item.dataType || "")
    .trim()
    .toLowerCase();

  if (Array.isArray(value)) {
    return "array";
  }

  if (value && typeof value === "object") {
    return "object";
  }

  if (normalizedInputType === "photo") {
    return "file";
  }

  if (
    normalizedInputType === "number" ||
    ["int", "integer", "float", "double", "decimal", "number"].includes(
      normalizedDataType
    )
  ) {
    return "number";
  }

  return "string";
};

const normalizeAnswerFile = (item = {}) =>
  item?.file
    ? {
        ...item.file,
        filePath: item.file.file_path || item.file.filePath || item.file.local_uri,
        uri: item.file.local_uri || item.file.file_path || item.file.filePath,
        name: item.file.file_name || item.file.name,
        type: item.file.mime_type || item.file.mimeType || item.file.type,
        sizeKb: item.file.size_kb ?? item.file.sizeKb,
        width: item.file.width,
        height: item.file.height,
        mediaType: item.file.media_type || item.file.mediaType,
        takenAt: item.file.taken_at || item.file.takenAt,
        latitude: item.file.latitude ?? null,
        longitude: item.file.longitude ?? null,
      }
    : null;

const buildOmsSubmissionChecklist = (payload = {}) => {
  if (Array.isArray(payload.answers) && payload.answers.length) {
    return payload.answers
      .filter((item) => item?.checklist_id)
      .filter((item) => {
        const explicitValueType = String(item?.valueType || item?.value_type || "")
          .trim()
          .toLowerCase();
        const inputType = String(item?.input_type || item?.inputType || "")
          .trim()
          .toLowerCase();
        const isFileAnswer = explicitValueType === "file" || inputType === "photo";
        const file = normalizeAnswerFile(item);
        const fileUri = String(file?.filePath || file?.uri || "").trim();

        if (!isFileAnswer) {
          return true;
        }

        return Boolean(fileUri) || !isChecklistValueEmpty(item?.value);
      })
      .filter(
        (item) =>
          item?.is_required !== false || !isChecklistValueEmpty(item?.value)
      )
      .map((item) => {
        const file = normalizeAnswerFile(item);
        const value = file
          ? `__FILE_${item.checklist_id}__`
          : typeof item?.display_value === "string" &&
            typeof item?.value === "boolean"
          ? item.display_value
          : toChecklistApiValue(item?.value);

        return {
          checklistId: item.checklist_id,
          value,
          valueType: inferChecklistValueType({
            item,
            value: item?.value,
            hasFile: Boolean(file),
          }),
          file,
        };
      });
  }

  const checklistEntries = [];

  (payload.selectValues || []).forEach((item) => {
    if (!item?.checklist_id) return;

    checklistEntries.push({
      checklistId: item.checklist_id,
      value: toChecklistApiValue(item.value),
      valueType: inferChecklistValueType({ item, value: item.value }),
    });
  });

  (payload.inputValues || []).forEach((item) => {
    if (!item?.checklist_id) return;

    checklistEntries.push({
      checklistId: item.checklist_id,
      value: toChecklistApiValue(item.value),
      valueType: inferChecklistValueType({ item, value: item.value }),
    });
  });

  (payload.checklist || []).forEach((item) => {
    if (!item?.checklist_id) return;

    checklistEntries.push({
      checklistId: item.checklist_id,
      value: item.checked ? "Yes" : "No",
      valueType: "string",
    });
  });

  (payload.repeatableValues || []).forEach((item) => {
    if (!item?.checklist_id) return;

    checklistEntries.push({
      checklistId: item.checklist_id,
      value: (item.items || []).map((repeatableItem) =>
        (repeatableItem.values || []).reduce((acc, field) => {
          acc[field.key] = field.value;
          return acc;
        }, {})
      ),
      valueType: "array",
    });
  });

  (payload.photos || []).forEach((photo) => {
    if (!photo?.checklistId) return;

    checklistEntries.push({
      checklistId: photo.checklistId,
      value: `__FILE_${photo.checklistId}__`,
      valueType: "file",
      file: photo,
    });
  });

  return checklistEntries;
};

const buildOmsSubmissionBody = (payload = {}) => {
  const checklist = buildOmsSubmissionChecklist(payload);
  const rawFiles = [
    ...checklist.map((item) => item.file).filter(Boolean),
    ...(payload.photos || []).filter((photo) =>
      Boolean(photo?.filePath || photo?.uri || photo?.local_uri)
    ),
  ];
  const seenFiles = new Set();
  const files = rawFiles.filter((file) => {
    const key = [
      file?.filePath || file?.uri || file?.local_uri || "",
      file?.name || file?.file_name || "",
    ].join("|");

    if (!key || seenFiles.has(key)) {
      return false;
    }

    seenFiles.add(key);
    return true;
  });

  return {
    projectId:
      payload.projectId ||
      payload.project_id ||
      payload.projectid ||
      payload.unit?.project_id ||
      payload.unit?.projectId,
    omsId: payload.unitId || payload.omsId || payload.oms_id || payload.omsid,
    nodeNo: payload.unitNo || payload.nodeNo || payload.node_no,
    processId: toPositiveIntegerOrNull(payload.process_id),
    subprocessId: toPositiveIntegerOrNull(payload.subprocess_id),
    remark: payload.remark || "",
    checklist,
    files,
  };
};

const buildOmsResubmitFormData = (body = {}) => {
  const formData = new FormData();

  formData.append(
    "payload",
    JSON.stringify({
      projectId: body.projectId || null,
      omsId: body.omsId || null,
      nodeNo: body.nodeNo || "",
      processId: body.processId ?? null,
      subprocessId: body.subprocessId ?? null,
      remark: body.remark || "",
      checklist: (body.checklist || []).map((item) => ({
        checklistId: item.checklistId,
        value: item.value,
        ...(item.valueType ? { valueType: item.valueType } : {}),
      })),
    })
  );

  (body.files || []).forEach((fileItem, index) => {
    if (!fileItem) {
      return;
    }

    const fileUri = stripFileScheme(
      fileItem.filePath || fileItem.uri || fileItem.local_uri || ""
    );

    if (!fileUri) {
      return;
    }

    formData.append("resubmitFiles", {
      uri: `file://${fileUri}`,
      name:
        fileItem.name ||
        fileItem.file_name ||
        `resubmit_file_${index + 1}.jpg`,
      type: inferMimeType(fileItem),
    });
  });

  return formData;
};

export const submitOmsCommentedResubmission = async ({
  submissionId,
  payload,
} = {}) => {
  const normalizedSubmissionId = String(submissionId || "").trim();

  if (!normalizedSubmissionId) {
    throw new Error("Submission ID is required to resubmit this subprocess.");
  }

  const body = buildOmsSubmissionBody(payload);
  const data = buildOmsResubmitFormData(body);
  console.log("[OMSResubmit]", "Submitting commented subprocess", {
    submissionId: normalizedSubmissionId,
    projectId: body.projectId,
    omsId: body.omsId,
    processId: body.processId,
    subprocessId: body.subprocessId,
    checklistCount: body.checklist.length,
    fileCount: (body.files || []).length,
  });

  return apiRequest({
    url: buildApiEndpointPath(API_ENDPOINTS.omsSubmissionResubmit, {
      submissionId: normalizedSubmissionId,
    }),
    method: "PATCH",
    headers: {
      Accept: "*/*",
      "Content-Type": "multipart/form-data",
    },
    data,
  });
};
