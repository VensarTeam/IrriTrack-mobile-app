const normalizeText = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");

export const OMS_STATUS_FILTER_KEYS = {
  pending: "pending",
  partial: "partial",
  completed: "completed",
  commented: "commented",
  approved: "approved",
  verified: "verified",
  totalInstalled: "totalInstalled",
};

export const OMS_STATUS_FILTER_OPTIONS = [
  { value: OMS_STATUS_FILTER_KEYS.pending, label: "Pending", apiValue: "0" },
  { value: OMS_STATUS_FILTER_KEYS.partial, label: "Partial", apiValue: "1" },
  {
    value: OMS_STATUS_FILTER_KEYS.completed,
    label: "Completed",
    apiValue: "2",
  },
  {
    value: OMS_STATUS_FILTER_KEYS.totalInstalled,
    label: "Total Installed",
    apiValue: "2,3,4,5,6,7",
  },
  {
    value: OMS_STATUS_FILTER_KEYS.commented,
    label: "Commented",
    apiValue: "3",
  },
  {
    value: OMS_STATUS_FILTER_KEYS.approved,
    label: "Approved",
    apiValue: "4",
  },
  {
    value: OMS_STATUS_FILTER_KEYS.verified,
    label: "Verified",
    apiValue: "4,5",
  },
];

export const OMS_SUBPROCESS_FILTER_OPTIONS = [
  {
    id: 2,
    key: "inletPipeLaying",
    label: "Inlet Pipe Laying",
    shortLabel: "Inlet Pipe Laying",
    aliases: [
      "Inlet Pipe Laying",
      "Inlet pipe conn.",
      "Inlet Pipe",
    ],
  },
  {
    id: 3,
    key: "outletPipeLaying",
    label: "Outlet Pipe Laying",
    shortLabel: "Outlet Pipe Laying",
    aliases: [
      "Outlet Pipe Laying",
      "Outlet pipe conn.",
      "Outlet Pipe",
    ],
  },
  {
    id: 4,
    key: "pedestalEnclosureInstallation",
    label: "Pedestal and Enclosure Installation",
    shortLabel: "Pedestal & Enclosure",
    aliases: [
      "Pedestal and Enclosure Installation",
      "Padestal and Inclosure Inst.",
    ],
  },
  {
    id: 5,
    key: "mechanicalAccessoriesInstallation",
    label: "Mechanical Accessories Installation",
    shortLabel: "Mechanical Accessories",
    aliases: [
      "Mechanical Accessories Installation",
      "Mechanical Accessories Inst.",
    ],
  },
  {
    id: 6,
    key: "automationInstallation",
    label: "Automation Installation",
    shortLabel: "Automation Installation",
    aliases: [
      "Automation Installation",
      "Automation Inst.",
      "Controller Installation",
    ],
  },
  {
    id: 9,
    key: "wetCommissioning",
    label: "Wet Commissioning",
    shortLabel: "Commissioning",
    aliases: ["Wet Commissioning", "Wet commissioning"],
  },
];

export const findOmsStatusFilterOptionByValue = (value) => {
  const normalizedValue = normalizeText(value);
  const rawValue = String(value ?? "").trim();
  const normalizedNumericValue = Number(value);

  return (
    OMS_STATUS_FILTER_OPTIONS.find((item) => {
      const candidates = [item.value, item.label, item.apiValue];

      return candidates.some((candidate) => {
        if (candidate === null || candidate === undefined) {
          return false;
        }

        const candidateRaw = String(candidate).trim();
        return (
          normalizeText(candidateRaw) === normalizedValue ||
          candidateRaw === rawValue
        );
      });
    }) ||
    OMS_STATUS_FILTER_OPTIONS.find((item) => {
      if (!Number.isFinite(normalizedNumericValue)) {
        return false;
      }

      return String(item.apiValue || "")
        .split(",")
        .map((entry) => Number(entry.trim()))
        .some((entry) => entry === normalizedNumericValue);
    }) ||
    null
  );
};

export const getOmsStatusFilterApiValue = (value) => {
  const matchedOption = findOmsStatusFilterOptionByValue(value);

  if (matchedOption) {
    return matchedOption.apiValue;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .join(",");
  }

  return String(value ?? "").trim();
};

export const findOmsSubprocessFilterOptionById = (value) => {
  const normalizedValue = Number(value);

  return OMS_SUBPROCESS_FILTER_OPTIONS.find(
    (item) => Number(item.id) === normalizedValue
  ) || null;
};

export const findOmsSubprocessFilterOptionByLabel = (value) => {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  return (
    OMS_SUBPROCESS_FILTER_OPTIONS.find((item) => {
      const haystack = [
        item.label,
        item.shortLabel,
        ...(Array.isArray(item.aliases) ? item.aliases : []),
      ];

      return haystack.some(
        (candidate) => normalizeText(candidate) === normalizedValue
      );
    }) || null
  );
};
