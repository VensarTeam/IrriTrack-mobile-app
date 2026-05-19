const normalizeText = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");

export const OMS_STATUS_FILTER_OPTIONS = [
  { value: 0, label: "Pending" },
  { value: 1, label: "Partial" },
  { value: 2, label: "Completed" },
  { value: 3, label: "Commented" },
  { value: 4, label: "Approved" },
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
  const normalizedValue = Number(value);

  return OMS_STATUS_FILTER_OPTIONS.find(
    (item) => Number(item.value) === normalizedValue
  ) || null;
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
