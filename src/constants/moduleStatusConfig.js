export const STATUS_OPTIONS = ["Pending", "Partially Completed", "Completed"];

export const PIPE_SIZE_OPTIONS = [
  "50 mm",
  "63 mm",
  "75 mm",
  "90 mm",
  "110 mm",
  "125 mm",
];

export const OUTLET_IDENTIFICATION_PIPE_SIZE_OPTIONS = [
  "75 mm",
  "90 mm",
  "110 mm",
  "125 mm",
  "140 mm",
  "160 mm",
];

export const CONTRACTOR_OPTIONS = [
  "Contractor-1",
  "Contractor-2",
  "Contractor-3",
  "Contractor-4",
  "Contractor-5",
];

export const THEFT_DAMAGE_MATERIAL_OPTIONS = [
  "Water Meter",
  "PFCMD",
  "ON-OFF Valve",
  "Antenna",
  "RTU Controller",
  "Door Switch",
  "Cable/Hydraulic Tubing",
  "Other",
];

export const REINSTALL_MATERIAL_OPTIONS = [
  "Water Meter",
  "PFCMD",
  "ON-OFF Valve",
  "Antenna",
  "RTU Controller",
  "Door Switch",
  "Cable/Hydraulic Tubing",
  "Other",
];

export const FLUSHING_PRESSURE_OPTIONS = ["Low Pressure", "High Pressure"];
export const WATER_CLARITY_OPTIONS = ["Clear", "Turbid"];
export const YES_NO_OPTIONS = ["Yes", "No"];
export const SIGNAL_STRENGTH_OPTIONS = ["Poor", "Good", "Excellent"];

export const LEAKAGE_RECTIFICATION_REASON_OPTIONS = [
  "Inlet Leakage",
  "Outlet Leakage",
  "Valve Leakage",
  "Joint Leakage",
  "Other",
];

export const OFFLINE_RECTIFICATION_REASON_OPTIONS = [
  "RTU Controller Offline",
  "Communication Failure",
  "Battery Issue",
  "Sensor Issue",
  "Other",
];

export const DEFAULT_NODE_LOCATION = {
  latitude: 23.18,
  longitude: 75.78,
};

const normalizeStoredStatus = (value) => {
  if (value === "Partial") {
    return "Partially Completed";
  }

  if (value === "Commented") {
    return "Commented";
  }

  if (value === "Approved") {
    return "Approved";
  }

  return value || "Pending";
};

const resolveStoredStatus = (...values) =>
  normalizeStoredStatus(values.find((value) => value !== undefined && value !== null && value !== ""));

export const getUnitStatusBySubOption = (unit = {}) => ({
  inletPipeLaying: resolveStoredStatus(unit.inletPipeLaying, unit.inlet),
  outletPipeLaying: resolveStoredStatus(unit.outletPipeLaying, unit.outlet),
  locationFinalization: unit.locationUpdatedAt ? "Updated" : "Pending",
  pedestalEnclosureInstallation: resolveStoredStatus(
    unit.pedestalEnclosureInstallation,
    unit.mechanical
  ),
  mechanicalAccessoriesInstallation: resolveStoredStatus(
    unit.mechanicalAccessoriesInstallation,
    unit.mechanical
  ),
  automationInstallation: resolveStoredStatus(
    unit.automationInstallation,
    unit.controller
  ),
  pipeFlushing: resolveStoredStatus(unit.pipeFlushing, unit.flushing),
  dryCommissioning: resolveStoredStatus(unit.dryCommissioning, unit.dry),
  wetCommissioning: resolveStoredStatus(unit.wetCommissioning, unit.wet),
  mechanicalRectification: resolveStoredStatus(unit.mechanicalRectification),
  automationWorkRectification: resolveStoredStatus(
    unit.automationWorkRectification,
    unit.controllerRectification
  ),
  theftDamageReinstallation: resolveStoredStatus(unit.theftDamageReinstallation),
});

export const UNIT_LIST_SECTION_KEYS = [
  "pipeLaying",
  "installation",
  "flushing",
  "commissioning",
  "rectification",
];

const checklist = (items) =>
  items.map((item, index) => ({
    id: `check_${index + 1}`,
    ...(typeof item === "string" ? { label: item } : item),
  }));

const checklistIncomplete = ({ values, subOption }) =>
  (subOption.checklistItems || []).some((item) => !values?.checks?.[item.id]);

const otherReasonRequired = ({ values }) =>
  values?.leakageRectificationReason === "Other" ||
  values?.offlineRectificationReason === "Other" ||
  values?.materialReinstallationReason === "Other";

const flushingRemarkRequired = ({ values }) =>
  values?.flushedPressure === "Low Pressure" ||
  values?.waterClarityStatus === "Turbid" ||
  values?.inletLeakageObserved === "Yes";

export const MODULE_STATUS_SECTIONS = [
  {
    key: "pipeLaying",
    title: "Pipe Laying Process",
    cardLabel: "Pipe Laying",
    description:
      "Finalize node location and update inlet and outlet pipe laying work.",
    subOptions: [
      {
        id: "locationFinalization",
        label: "Location Finalization",
        showStatusField: false,
        showRemarkField: false,
        needsLocationActions: true,
        canUpdateLocation: true,
      },
      {
        id: "inletPipeLaying",
        label: "Inlet Pipe Laying",
        statusLabel: "Status",
        inputFields: [
          {
            key: "inletPipeSize",
            label: "Inlet Pipe Size (mm)",
            placeholder: "Enter inlet pipe size in mm",
            keyboardType: "numeric",
          },
        ],
        checklistItems: checklist([
          "Check 110 mm OMS inlet pipe joined with pipeline.",
        ]),
        remarkLabel: "Remark",
        remarkRequiredWhen: ({ values }) =>
          values?.status === "Partially Completed",
      },
      {
        id: "outletPipeLaying",
        label: "Outlet Pipe Laying",
        statusLabel: "Status",
        inputFields: [
          {
            key: "outletPipeSize",
            label: "Outlet Pipe Size (mm)",
            placeholder: "Enter outlet pipe size in mm",
            keyboardType: "numeric",
          },
        ],
        checklistItems: checklist([
          "Check 63 mm OMS outlet pipe joined with pipeline.",
          "No. of outlet pipes({subChakQuantity})",
        ]),
        remarkLabel: "Remark",
      },
    ],
  },
  {
    key: "installation",
    title: "Installation Process",
    cardLabel: "Installation",
    description:
      "Capture pedestal, mechanical accessories, and automation installation work.",
    subOptions: [
      {
        id: "pedestalEnclosureInstallation",
        label: "Pedestal and Enclosure Installation",
        showStatusField: false,
        selectFields: [
          {
            key: "contractorName",
            label: "Activity Done By Contractor",
            options: CONTRACTOR_OPTIONS,
            placeholder: "Select contractor",
          },
        ],
        checklistItems: checklist([
          "Check Excavation for OMS up to 0.9 Meter Depth.",
          "Check Placement of Reinforced Cement Concrete (RCC) precast block.",
          "Check the placement and horizontality of the pedestal inside the chamber using a spirit level.",
          "Check 110 mm inlet Pipe Jointed with Pipeline.",
          "Check 63 mm outlet Pipes Jointed with Pipelines.",
          "Check MS Companion Flange (100 mm) provided at the inlet pipe Stub End.",
          "Check All the Butt Fusion Joints are Properly welded.",
          "Check Installation of Enclosure cabinet.",
          "Check Outlet Pipe Identification and Marking.",
          "Check Backfilling of excavation after installation completion, with proper compaction up to original level.",
        ]),
        repeatableGroups: [
          {
            key: "subChakDefinitions",
            title: "Outlet Pipe Identification and Marking",
            subtitle: "{subChakQuantity} sub chak entries created from Sub Chak Quantity.",
            addButtonLabel: "Add Sub Chak",
            itemLabel: "Sub Chak",
            itemTitleField: "subChakName",
            useSubChakQuantity: true,
            imageBySubChakQuantity: true,
            minItems: 1,
            maxItems: 8,
            itemFields: [
              {
                key: "subChakName",
                label: "Sub Chak Name",
                placeholder: "O1",
                readOnly: true,
                getDefaultValue: ({ itemIndex }) => `O${itemIndex + 1}`,
              },
              {
                key: "pipeSize",
                type: "select",
                label: "Pipe Size",
                options: OUTLET_IDENTIFICATION_PIPE_SIZE_OPTIONS,
                placeholder: "Select pipe size",
              },
            ],
          },
        ],
        remarkLabel: "Remark",
        remarkRequiredWhen: checklistIncomplete,
        photoRequirements: [
          {
            id: "pedestal_open_door_photo",
            label: "Full photo of OMS installation before backfilling with open door",
          },
          {
            id: "pedestal_closed_door_photo",
            label: "Full photo of OMS after backfilling with a closed door",
          },
          {
            id: "pedestal_signed_copy",
            label: "Duly signed copy",
          },
        ],
      },
      {
        id: "mechanicalAccessoriesInstallation",
        label: "Mechanical Accessories Installation",
        showStatusField: false,
        selectFields: [
          {
            key: "contractorName",
            label: "Activity Done By Contractor",
            options: CONTRACTOR_OPTIONS,
            placeholder: "Select contractor",
          },
        ],
        checklistItems: checklist([
          "Check Installation of Inlet Manifold assembly.",
          "Check Installation of air release valve with isolation ball valve.",
          "Check Installation of a butterfly valve with gasket and nut bolt.",
          "Check Installation of Strainer with Gasket and Nut bolt.",
          "Check Installation of PFCMD with Gasket and Nut Bolt.",
          "Check Installation of Outlet Manifold assembly.",
          "Check all Nut Bolts are properly Tighten.",
          "Check all Victaulic Joints are properly fixed and tighten.",
          "Check Installation of ON-OFF valve.",
          "Check Installation and Tightness of MTA Compression Fitting.",
        ]),
        remarkLabel: "Remark",
        remarkRequiredWhen: checklistIncomplete,
        photoRequirements: [
          {
            id: "mechanical_accessories_open_door_photo",
            label: "Photo with open door",
          },
          {
            id: "mechanical_accessories_close_door_photo",
            label: "Photo with close door",
          },
          {
            id: "mechanical_accessories_signed_copy",
            label: "Duly signed copy",
          },
        ],
      },
      {
        id: "automationInstallation",
        label: "Automation Installation",
        showStatusField: false,
        selectFields: [
          {
            key: "contractorName",
            label: "Activity Done By Contractor",
            options: CONTRACTOR_OPTIONS,
            placeholder: "Select contractor",
          },
        ],
        checklistItems: checklist([
          "Check Installation of RTU Controller with Clamp and Nut Bolt.",
          "Check Installation of Antenna MS Pipe and Antenna with Nut Bolt.",
          "Check Installation of Door Switch with Nut Bolt.",
          "Check Installation of Hydraulic Tubing.",
          "Check Installation of All PU Fittings and Elbows.",
          "Check Installation and Connection of Pressure Transducer with RTU Controller.",
          "Check Connection of Water Meter with RTU Controller.",
          "Check Cable and Hydraulic Tubing Dressing.",
          "Check RTU Controller Cable Gland Fitting.",
        ]),
        remarkLabel: "Remark",
        remarkRequiredWhen: checklistIncomplete,
        photoRequirements: [
          {
            id: "automation_rtu_controller_photo",
            label: "RTU controller",
          },
          {
            id: "automation_full_close_door_photo",
            label: "Full photo of OMS including antenna with close door",
          },
          {
            id: "automation_signed_copy",
            label: "Duly signed copy",
          },
        ],
      },
    ],
  },
  {
    key: "flushing",
    title: "Flushing Process",
    cardLabel: "Flushing",
    description: "Capture flushing duration, pressure, clarity, and leakage data.",
    subOptions: [
      {
        id: "pipeFlushing",
        label: "Flushing",
        showStatusField: false,
        selectFields: [
          {
            key: "flushedPressure",
            label: "Flushed",
            options: FLUSHING_PRESSURE_OPTIONS,
            placeholder: "Select pressure",
          },
          {
            key: "waterClarityStatus",
            label: "Water Clarity Status",
            options: WATER_CLARITY_OPTIONS,
            placeholder: "Select water clarity",
          },
          {
            key: "inletLeakageObserved",
            label: "Any Leakage Observed in OMS Inlet",
            options: YES_NO_OPTIONS,
            placeholder: "Select option",
          },
        ],
        inputFields: [
          {
            key: "totalFlushingDurationMinutes",
            label: "Total Duration of Flushing (Minutes)",
            placeholder: "Enter total duration",
            keyboardType: "numeric",
          },
        ],
        remarkLabel: "Remark",
        remarkRequiredWhen: flushingRemarkRequired,
        photoRequirements: [
          {
            id: "flushing_photo",
            label: "Photo of flushing",
          },
        ],
      },
    ],
  },
  {
    key: "commissioning",
    title: "Commissioning Process",
    cardLabel: "Commissioning",
    description: "Capture dry and wet commissioning validation checks.",
    subOptions: [
      {
        id: "dryCommissioning",
        label: "Dry Commissioning",
        showStatusField: false,
        selectFields: [
          {
            key: "signalStrength",
            label: "Check Signal Strength",
            options: SIGNAL_STRENGTH_OPTIONS,
            placeholder: "Select signal strength",
          },
        ],
        checklistItems: checklist([
          "Check Online Status In The Web-SCADA.",
          "Check PFCMD solenoid operation through the Web-SCADA.",
          "Check ON-OFF valve solenoid operation through the Web-SCADA.",
          "Check whether the specific valve that was commanded has opened or not.",
          "Check Pressure Transmitter Reading is Zero.",
          "Check Door Switch Status In The Web-SCADA.",
          "Check Water Meter Connection and Reading.",
          "Check Battery Healthiness Status In The Web-SCADA.",
          "Check Controller Lora Id In Web-SCADA.",
        ]),
        remarkLabel: "Remark",
        remarkRequiredWhen: checklistIncomplete,
        photoRequirements: [
          {
            id: "dry_commissioning_scada_parameters_and_valve_operation",
            label: "Real time parameters and valve operation on SCADA",
          },
        ],
      },
      {
        id: "wetCommissioning",
        label: "Wet Commissioning",
        showStatusField: false,
        selectFields: [
          {
            key: "signalStrength",
            label: "Check Signal Strength",
            options: SIGNAL_STRENGTH_OPTIONS,
            placeholder: "Select signal strength",
          },
        ],
        checklistItems: checklist([
          "Check PFCMD valve operation through the Web-SCADA.",
          "Check ON-valve operation through the Web-SCADA.",
          "Check whether the specific valve that was commanded has opened or not.",
          "Check Node Schedule Operation Through The Web-SCADA.",
          "Check Water Meter Readings and Flow In The Web-SCADA.",
          "Check Inlet Pressure Reading In The Web-SCADA.",
          "Check Door Switch Status In The Web-SCADA.",
          "Check Battery Healthiness Status In The Web-SCADA.",
        ]),
        remarkLabel: "Remark",
        photoRequirements: [
          {
            id: "wet_commissioning_scada_parameters_and_valve_operation",
            label: "Real time parameters and valve operation on SCADA",
          },
        ],
      },
    ],
  },
  {
    key: "rectification",
    title: "Rectification Process",
    cardLabel: "Rectification",
    description: "Capture mechanical and automation rectification visits.",
    subOptions: [
      {
        id: "mechanicalRectification",
        label: "Mechanical Rectification",
        showStatusField: false,
        showRemarkField: false,
        selectFields: [
          {
            key: "leakageRectificationReason",
            label: "Visit For OMS Leakage Rectification Purpose",
            options: LEAKAGE_RECTIFICATION_REASON_OPTIONS,
            placeholder: "Select reason",
          },
          {
            key: "materialReinstallationReason",
            label: "Visit For OMS Material Reinstallation Purpose",
            options: REINSTALL_MATERIAL_OPTIONS,
            placeholder: "Select reason",
          },
        ],
        inputFields: [
          {
            key: "otherReason",
            label: "Other",
            placeholder: "Type here",
            required: false,
            requiredWhen: otherReasonRequired,
          },
        ],
        photoRequirements: [
          {
            id: "mechanical_rectification_photo",
            label: "Photo with timestamp",
          },
        ],
      },
      {
        id: "automationWorkRectification",
        label: "Automation Work Rectification",
        showStatusField: false,
        showRemarkField: false,
        selectFields: [
          {
            key: "offlineRectificationReason",
            label: "Visit For Offline OMS Rectification Purpose",
            options: OFFLINE_RECTIFICATION_REASON_OPTIONS,
            placeholder: "Select reason",
          },
          {
            key: "materialReinstallationReason",
            label: "Visit For OMS Material Reinstallation Purpose",
            options: REINSTALL_MATERIAL_OPTIONS,
            placeholder: "Select reason",
          },
        ],
        inputFields: [
          {
            key: "otherReason",
            label: "Other",
            placeholder: "Type here",
            required: false,
            requiredWhen: otherReasonRequired,
          },
        ],
        photoRequirements: [
          {
            id: "automation_rectification_photo",
            label: "Photo with timestamp",
          },
        ],
      },
      {
        id: "theftDamageReinstallation",
        label: "Theft, Damage and Reinstallation",
        showStatusField: false,
        showRemarkField: false,
        selectFields: [
          {
            key: "theftDamageMaterial",
            label: "Select The Material Theft & Damage On The Node",
            options: THEFT_DAMAGE_MATERIAL_OPTIONS,
            placeholder: "Select material",
          },
          {
            key: "reinstalledMaterial",
            label: "Select The Material You Reinstalled On The Node",
            options: REINSTALL_MATERIAL_OPTIONS,
            placeholder: "Select material",
          },
        ],
        photoRequirements: [
          {
            id: "theft_damage_photo",
            label: "Photo with timestamp",
          },
          {
            id: "reinstall_material_photo",
            label: "Photo with timestamp",
          },
        ],
      },
    ],
  },
];

export const OMS_STATUS_SECTIONS = MODULE_STATUS_SECTIONS;
