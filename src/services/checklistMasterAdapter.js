import {
  CONTRACTOR_OPTIONS,
  FLUSHING_PRESSURE_OPTIONS,
  LEAKAGE_RECTIFICATION_REASON_OPTIONS,
  OFFLINE_RECTIFICATION_REASON_OPTIONS,
  PIPE_SIZE_OPTIONS,
  REINSTALL_MATERIAL_OPTIONS,
  SIGNAL_STRENGTH_OPTIONS,
  STATUS_OPTIONS,
  THEFT_DAMAGE_MATERIAL_OPTIONS,
  WATER_CLARITY_OPTIONS,
  YES_NO_OPTIONS,
} from "../constants/moduleStatusConfig";

const SECTION_KEY_BY_PROCESS = {
  "pipe laying process": "pipeLaying",
  "installation process": "installation",
  "flushing process": "flushing",
  "commissioning process": "commissioning",
  "rectification process": "rectification",
};

const SUB_OPTION_ID_BY_SUBPROCESS = {
  "location finalization": "locationFinalization",
  "inlet pipe laying": "inletPipeLaying",
  "outlet pipe laying": "outletPipeLaying",
  "pedestal and enclosure installation": "pedestalEnclosureInstallation",
  "mechanical accessories installation": "mechanicalAccessoriesInstallation",
  "automation installation": "automationInstallation",
  "flushing": "pipeFlushing",
  "dry commissioning": "dryCommissioning",
  "wet commissioning": "wetCommissioning",
  "mechanical rectification": "mechanicalRectification",
  "automation work rectification": "automationWorkRectification",
  "theft damage and reinstallation": "theftDamageReinstallation",
};

const normalizeText = (value) =>
  String(value || "")
    .replace(/&/g, "and")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const toSlug = (value, fallback) => {
  const normalized = normalizeText(value);

  if (!normalized) return fallback;

  return normalized.replace(/\s+([a-z0-9])/g, (_, char) => char.toUpperCase());
};

const sortBySequence = (items = []) =>
  [...items].sort((a, b) => (a.seq_no || 0) - (b.seq_no || 0));

const getSectionKey = (process, index) =>
  SECTION_KEY_BY_PROCESS[normalizeText(process?.description)] ||
  toSlug(process?.description, `process_${process?.process_id || index + 1}`);

const getSubOptionId = (subprocess, index) =>
  SUB_OPTION_ID_BY_SUBPROCESS[normalizeText(subprocess?.description)] ||
  toSlug(
    subprocess?.description,
    `subprocess_${subprocess?.subprocess_id || index + 1}`
  );

const getDropdownOptions = (checklist = {}) => {
  const apiOptions = Array.isArray(checklist.options)
    ? checklist.options
        .map((option) => {
          if (option && typeof option === "object") {
            return String(option.label ?? option.value ?? "").trim();
          }

          return String(option || "").trim();
        })
        .filter(Boolean)
    : [];

  if (apiOptions.length) {
    return apiOptions;
  }

  const label = normalizeText(checklist.description);

  if (label.includes("reinstalled")) return REINSTALL_MATERIAL_OPTIONS;
  if (label.includes("theft") || label.includes("damage")) {
    return THEFT_DAMAGE_MATERIAL_OPTIONS;
  }
  if (label.includes("offline")) return OFFLINE_RECTIFICATION_REASON_OPTIONS;
  if (label.includes("leakage rectification")) {
    return LEAKAGE_RECTIFICATION_REASON_OPTIONS;
  }
  if (label.includes("signal")) return SIGNAL_STRENGTH_OPTIONS;
  if (label.includes("clarity")) return WATER_CLARITY_OPTIONS;
  if (label.includes("pressure")) return FLUSHING_PRESSURE_OPTIONS;
  if (label.includes("leakage")) return YES_NO_OPTIONS;
  if (label.includes("pipe size")) return PIPE_SIZE_OPTIONS;
  if (label.includes("contractor") || label.includes("activity done")) {
    return CONTRACTOR_OPTIONS;
  }
  if (label.includes("status")) return STATUS_OPTIONS;

  return YES_NO_OPTIONS;
};

const buildDynamicListGroup = (checklist, base, fieldLabel) => {
  const label = normalizeText(checklist.description);

  if (label.includes("outlet pipe identification and marking")) {
    return {
      key: `api_dynamic_list_${checklist.checklist_id}`,
      title: fieldLabel,
      subtitle: "{subChakQuantity} outlet entries created by default.",
      addButtonLabel: "Add Outlet",
      itemLabel: "Outlet",
      itemTitleField: "subChakName",
      useSubChakQuantity: true,
      imageBySubChakQuantity: true,
      minItems: 1,
      maxItems: 8,
      ...base,
      itemFields: [
        {
          key: "subChakName",
          label: "Outlet ID",
          placeholder: "V1",
          readOnly: true,
          getDefaultValue: ({ itemIndex }) => `V${itemIndex + 1}`,
        },
        {
          key: "pipeSize",
          type: "select",
          label: "Pipe Size",
          options: PIPE_SIZE_OPTIONS,
          placeholder: "Select pipe size",
        },
      ],
    };
  }

  return {
    key: `api_dynamic_list_${checklist.checklist_id}`,
    title: fieldLabel,
    subtitle: "Add item details.",
    addButtonLabel: "Add Item",
    itemLabel: "Item",
    minItems: base.required ? 1 : 0,
    ...base,
    itemFields: [
      {
        key: "value",
        label: fieldLabel,
        placeholder: `Enter ${checklist.description}`,
      },
    ],
  };
};

const getChecklistBase = (checklist = {}) => ({
  checklistId: checklist.checklist_id,
  description: checklist.description,
  inputType: checklist.input_type,
  dataType: checklist.data_type,
  inputUnit: checklist.input_unit,
  seqNo: checklist.seq_no,
  required: checklist.is_required !== false,
  apiChecklist: checklist,
});

const getFieldLabel = (checklist = {}) =>
  checklist.input_unit
    ? `${checklist.description} (${checklist.input_unit})`
    : checklist.description;

const isLocationChecklist = (checklist = {}) => {
  const label = normalizeText(checklist.description);

  return label.includes("current location") || label.includes("node location");
};

const addChecklistToSubOption = (subOption, checklist) => {
  const base = getChecklistBase(checklist);
  const fieldLabel = getFieldLabel(checklist);
  const inputType = normalizeText(checklist.input_type);
  const fieldKey = `api_${inputType || "field"}_${checklist.checklist_id}`;

  if (inputType === "tick") {
    subOption.checklistItems.push({
      id: fieldKey,
      label: fieldLabel,
      ...base,
    });
    return;
  }

  if (inputType === "photo") {
    subOption.photoRequirements.push({
      id: fieldKey,
      label: fieldLabel,
      ...base,
    });
    return;
  }

  if (inputType === "dropdown") {
    subOption.selectFields.push({
      key: fieldKey,
      label: fieldLabel,
      placeholder: `Select ${checklist.description}`,
      options: getDropdownOptions(checklist),
      ...base,
    });
    return;
  }

  if (inputType === "dynamic list") {
    subOption.repeatableGroups.push(
      buildDynamicListGroup(checklist, base, fieldLabel)
    );
    return;
  }

  if (inputType === "textarea") {
    subOption.showRemarkField = true;
    subOption.remarkLabel = fieldLabel;
    subOption.remarkChecklist = base;
    subOption.remarkRequiredWhen = checklist.is_required
      ? () => true
      : undefined;
    return;
  }

  if (isLocationChecklist(checklist)) {
    subOption.locationChecklist = base;
    subOption.needsLocationActions = true;
    subOption.canUpdateLocation = true;
    return;
  }

  subOption.inputFields.push({
    key: fieldKey,
    label: fieldLabel,
    placeholder: `Enter ${checklist.description}`,
    keyboardType:
      checklist.input_type === "number" || checklist.data_type === "int"
        ? "numeric"
        : "default",
    ...base,
  });
};

const buildSubOption = (subprocess = {}, index = 0) => {
  const subOption = {
    id: getSubOptionId(subprocess, index),
    label: subprocess.description,
    apiDescription: subprocess.description,
    apiSubprocessId: subprocess.subprocess_id,
    apiProcessId: subprocess.process_id,
    apiSeqNo: subprocess.seq_no,
    showStatusField: false,
    showRemarkField: false,
    checklistItems: [],
    photoRequirements: [],
    selectFields: [],
    inputFields: [],
    repeatableGroups: [],
    apiChecklists: sortBySequence(subprocess.checklists || []),
  };

  subOption.apiChecklists.forEach((checklist) => {
    addChecklistToSubOption(subOption, checklist);
  });

  return subOption;
};

export const buildChecklistSectionsFromMaster = ({
  processes = [],
  module = "OMS",
} = {}) =>
  sortBySequence(processes).map((process, processIndex) => ({
    key: getSectionKey(process, processIndex),
    title: process.description,
    cardLabel: String(process.description || "").replace(/\s+Process$/i, ""),
    description: `${process.description} checklist for ${module}.`,
    apiDescription: process.description,
    apiProcessId: process.process_id,
    apiSeqNo: process.seq_no,
    subOptions: sortBySequence(process.subprocesses || []).map(
      (subprocess, subprocessIndex) => buildSubOption(subprocess, subprocessIndex)
    ),
  }));
