const STATUS_KEY_BY_CODE = {
  0: "pending",
  1: "partial",
  2: "completed",
  3: "commented",
  4: "approved",
  5: "info",
};

import { IMAGE_BASE_URL } from "../config/env";

const STATUS_LABEL_BY_KEY = {
  pending: "Pending",
  toBeConfirm: "To be Confirm",
  partial: "Partial",
  submitted: "Submitted",
  completed: "Completed",
  verified: "Verified",
  commented: "Commented",
  approved: "Approved",
  updated: "Updated",
  info: "Info",
};

const DETAIL_VALUE_KEYS = [
  "value",
  "answer",
  "displayValue",
  "submittedValue",
  "filledValue",
  "fieldValue",
  "remark",
  "remarks",
  "comment",
  "comments",
];

const FILE_STORAGE_BASE_URL = IMAGE_BASE_URL;

const formatDetailLabel = (value = "") =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const toTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeDetailValue = (value) => {
  if (value === null || typeof value === "undefined") {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return value
        .map((item) => normalizeDetailValue(item))
        .filter(Boolean)
        .join(", ");
    }
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return "";
    }
  }

  return "";
};

const getProgressFileUrl = (checklist = {}) => {
  const rawValue = String(checklist?.value || "").trim();
  const objectKey = String(checklist?.objectKey || "").trim();

  if (rawValue.startsWith("http://") || rawValue.startsWith("https://")) {
    return rawValue;
  }

  if (objectKey) {
    return `${FILE_STORAGE_BASE_URL}${objectKey.replace(/^\/+/, "")}`;
  }

  if (rawValue) {
    return `${FILE_STORAGE_BASE_URL}${rawValue.replace(/^\/+/, "")}`;
  }

  return "";
};

export const normalizeUnitProgressStatus = ({
  status = 0,
  statusLabel = "",
} = {}) => {
  const normalizedLabel = String(statusLabel || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  const normalizedStatus = Number(status);

  const key =
    {
      pending: "pending",
      "to be confirm": "toBeConfirm",
      "to be confirmed": "toBeConfirm",
      partial: "partial",
      "partially completed": "partial",
      submitted: "submitted",
      completed: "completed",
      verified: "verified",
      rejected: "commented",
      commented: "commented",
      approved: "approved",
      updated: "updated",
      info: "info",
    }[normalizedLabel] ||
    STATUS_KEY_BY_CODE[normalizedStatus] ||
    "pending";

  return {
    code: Number.isFinite(normalizedStatus) ? normalizedStatus : 0,
    key,
    label: STATUS_LABEL_BY_KEY[key] || toTitleCase(key),
  };
};

const getChecklistDetail = (checklist = {}) => {
  const detailKey = DETAIL_VALUE_KEYS.find((key) => {
    const value = checklist?.[key];

    if (value === null || typeof value === "undefined") {
      return false;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  });

  const rawValue =
    typeof detailKey === "string" ? checklist?.[detailKey] : undefined;
  const detailValue = normalizeDetailValue(rawValue);

  if (!detailValue) {
    return null;
  }

  return {
    label: String(
      checklist?.detailLabel || checklist?.valueLabel || "Value",
    ).trim(),
    value: detailValue,
    rawValue,
  };
};

const getNamedDetailItem = (source = {}, keys = [], label = "") => {
  const matchedKey = keys.find((key) => {
    const value = source?.[key];

    if (value === null || typeof value === "undefined") {
      return false;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  });

  if (!matchedKey) {
    return null;
  }

  const rawValue = source?.[matchedKey];
  const value = normalizeDetailValue(rawValue);

  if (!value) {
    return null;
  }

  return {
    key: matchedKey,
    label: label || formatDetailLabel(matchedKey),
    value,
    rawValue,
  };
};

const getSubprocessDetailItems = (subprocess = {}) =>
  [
    getNamedDetailItem(subprocess, ["remark", "remarks"], "Remark"),
    getNamedDetailItem(
      subprocess,
      [
        "reviewRemark",
        "review_remarks",
        "reviewComment",
        "review_comment",
        "rejectionRemark",
        "rejection_remark",
        "comment",
        "comments",
        "rejectRemark",
        "reject_remark",
      ],
      "Review Comment"
    ),
    getNamedDetailItem(
      subprocess,
      [
        "verifiedByName",
        "verified_by_name",
        "verifiedBy",
        "verified_by",
        "reviewedBy",
        "reviewed_by",
        "approvedBy",
        "approved_by",
      ],
      "Reviewed By"
    ),
    getNamedDetailItem(
      subprocess,
      [
        "verifiedAt",
        "verified_at",
        "reviewedAt",
        "reviewed_at",
        "approvedAt",
        "approved_at",
      ],
      "Reviewed On"
    ),
  ].filter(Boolean);

export const createUnitProgressChecklist = (checklist = {}, index = 0) => {
  const status = normalizeUnitProgressStatus(checklist);
  const detail = getChecklistDetail(checklist);
  const valueType = String(
    checklist.valueType || checklist.value_type || "",
  ).trim();
  const isFile = valueType === "file";

  return {
    id:
      checklist.checklistId ||
      checklist.checklist_id ||
      `checklist-${index + 1}`,
    name:
      checklist.checklistName ||
      checklist.checklist_name ||
      checklist.title ||
      checklist.description ||
      `Checklist ${index + 1}`,
    description:
      checklist.requirement ||
      checklist.checklistRequirement ||
      checklist.checklist_requirement ||
      "",
    isRequired: checklist.isRequired !== false && checklist.is_required !== false,
    status,
    detail,
    valueType,
    isFile,
    fileUrl: isFile ? getProgressFileUrl(checklist) : "",
    metadata: checklist.metadata || null,
    objectKey: checklist.objectKey || "",
    rawChecklist: checklist,
  };
};

export const createUnitProgressSubprocess = (subprocess = {}, index = 0) => {
  const checklists = Array.isArray(subprocess.checklists)
    ? subprocess.checklists.map((item, checklistIndex) =>
        createUnitProgressChecklist(item, checklistIndex),
      )
    : [];

  return {
    id:
      subprocess.subprocessId ||
      subprocess.subprocess_id ||
      `subprocess-${index + 1}`,
    name:
      subprocess.subprocessName ||
      subprocess.subprocess_name ||
      subprocess.description ||
      `Subprocess ${index + 1}`,
    status: normalizeUnitProgressStatus(subprocess),
    detailItems: getSubprocessDetailItems(subprocess),
    checklists,
    checklistCount: checklists.length,
    completedChecklistCount: checklists.filter(
      (item) =>
        item.status.key === "completed" ||
        item.status.key === "approved" ||
        item.status.key === "updated",
    ).length,
    rawSubprocess: subprocess,
  };
};

export const createUnitProgressProcess = (process = {}, index = 0) => {
  const subprocesses = Array.isArray(process.subprocesses)
    ? process.subprocesses.map((item, subprocessIndex) =>
        createUnitProgressSubprocess(item, subprocessIndex),
      )
    : [];
  const completedSubprocessCount = subprocesses.filter(
    (item) =>
      item.status.key === "completed" ||
      item.status.key === "approved" ||
      item.status.key === "updated",
  ).length;
  const partialSubprocessCount = subprocesses.filter(
    (item) => item.status.key === "partial" || item.status.key === "commented",
  ).length;
  const pendingSubprocessCount = Math.max(
    subprocesses.length - completedSubprocessCount - partialSubprocessCount,
    0,
  );

  return {
    id: process.processId || process.process_id || `process-${index + 1}`,
    name:
      process.processName ||
      process.process_name ||
      process.description ||
      `Process ${index + 1}`,
    status: normalizeUnitProgressStatus(process),
    reviewRemark:
      process.rejectionRemark ||
      process.rejection_remark ||
      process.reviewRemark ||
      process.review_remark ||
      "",
    subprocesses,
    subprocessCount: subprocesses.length,
    completedSubprocessCount,
    partialSubprocessCount,
    pendingSubprocessCount,
    checklistCount: subprocesses.reduce(
      (count, item) => count + item.checklists.length,
      0,
    ),
    rawProcess: process,
  };
};

export const createEmptyUnitProgress = () => ({
  processes: [],
});

export const createUnitProgress = (response = {}) => ({
  processes: Array.isArray(response?.processes)
    ? response.processes.map((item, index) =>
        createUnitProgressProcess(item, index),
      )
    : [],
});

export const getUnitProgressSummary = (progress = createEmptyUnitProgress()) => {
  const processes = Array.isArray(progress?.processes) ? progress.processes : [];
  const subprocesses = processes.flatMap((item) => item.subprocesses || []);
  const totalChecklists = subprocesses.reduce(
    (count, item) => count + (item.checklists?.length || 0),
    0,
  );
  const completedSubprocesses = subprocesses.filter(
    (item) =>
      item.status.key === "completed" ||
      item.status.key === "approved" ||
      item.status.key === "updated",
  ).length;
  const partialSubprocesses = subprocesses.filter(
    (item) => item.status.key === "partial" || item.status.key === "commented",
  ).length;
  const completedProcesses = processes.filter(
    (item) =>
      item.status.key === "completed" ||
      item.status.key === "approved" ||
      item.status.key === "updated",
  ).length;
  const partialProcesses = processes.filter(
    (item) => item.status.key === "partial" || item.status.key === "commented",
  ).length;

  return {
    processCount: processes.length,
    completedProcessCount: completedProcesses,
    partialProcessCount: partialProcesses,
    pendingProcessCount: Math.max(
      processes.length - completedProcesses - partialProcesses,
      0,
    ),
    subprocessCount: subprocesses.length,
    completedSubprocessCount: completedSubprocesses,
    partialSubprocessCount: partialSubprocesses,
    pendingSubprocessCount: Math.max(
      subprocesses.length - completedSubprocesses - partialSubprocesses,
      0,
    ),
    checklistCount: totalChecklists,
  };
};

export const findUnitProgressSubprocess = (
  progress = createEmptyUnitProgress(),
  subprocessId,
) => {
  const targetId = String(subprocessId || "").trim();

  if (!targetId) {
    return null;
  }

  for (const process of progress.processes || []) {
    const subprocess = (process.subprocesses || []).find(
      (item) => String(item.id) === targetId,
    );

    if (subprocess) {
      return {
        process,
        subprocess,
      };
    }
  }

  return null;
};
