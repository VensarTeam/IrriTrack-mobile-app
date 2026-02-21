export const STATUS_OPTIONS = ["Completed", "Partially Completed", "Pending"];

export const PIPE_SIZE_OPTIONS = [
  "50 mm",
  "63 mm",
  "75 mm",
  "90 mm",
  "110 mm",
  "125 mm",
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

export const DEFAULT_NODE_LOCATION = {
  latitude: 23.18,
  longitude: 75.78,
};

const checklist = (items) =>
  items.map((item, index) => ({
    id: `check_${index + 1}`,
    label: item,
  }));

export const MODULE_STATUS_SECTIONS = [
  {
    key: "pipeLaying",
    title: "Pipe Laying Status",
    description: "Update inlet/outlet laying progress and location finalization.",
    subOptions: [
      {
        id: "inletPipeLaying",
        label: "Inlet Pipe Laying",
        statusLabel: "Inlet Pipe Laying Status",
        needsPipeSize: true,
        pipeSizeLabel: "Inlet Pipe Size",
        remarkLabel: "Remark",
        photoRequirements: [
          {
            id: "inlet_laying_photo",
            label: "Upload Inlet Laying Photo",
          },
        ],
      },
      {
        id: "outletPipeLaying",
        label: "Outlet Pipe Laying",
        statusLabel: "Outlet Pipe Laying Status",
        needsPipeSize: true,
        pipeSizeLabel: "Outlet Pipe Size",
        remarkLabel: "Remark",
        photoRequirements: [
          {
            id: "outlet_laying_photo",
            label: "Upload Outlet Laying Photo",
          },
        ],
      },
      {
        id: "locationFinalization",
        label: "OMS/RMS Location Finalization",
        hideStatusRemark: true,
        needsLocationActions: true,
        canUpdateLocation: true,
      },
    ],
  },
  {
    key: "installation",
    title: "Installation Status",
    description: "Track mechanical and controller installation progress.",
    subOptions: [
      {
        id: "mechanicalInstallation",
        label: "Mechanical Installation",
        needsContractor: true,
        contractorLabel: "Activity Done By Contractor",
        checklistItems: checklist([
          "Check excavation for OMS up to 0.9 meter depth.",
          "Check placement of reinforced cement concrete (RCC) precast block.",
          "Check placement of pedestal inside the chamber.",
          "Check laying and connecting incoming pipelines.",
          "Check laying and connecting outgoing pipelines.",
          "Check installation of the enclosure cabinet.",
          "Check installation of inlet manifold assembly.",
          "Check installation of air release valve with isolation ball valve.",
          "Check installation of a butterfly valve with gasket and nut bolt.",
          "Check installation of strainer with gasket and Nut bolt.",
          "Check installation of PFCMD and Water Meter with Gasket and Nut bolt.",
          "Check installation of Outlet Manifold assembly.",
          "Check installation of ON-OFF valve.",
          "Check installation and tightness of MTA Compression Fitting.",
          "Check backfilling of excavation after installation completion with proper compaction up to original level.",
        ]),
        remarkLabel: "Remark",
        photoRequirements: [
          {
            id: "oms_before_backfill",
            label: "Full photo of OMS before backfilling",
          },
          {
            id: "oms_after_backfill_open",
            label: "Full photo of OMS after backfilling (open door)",
          },
          {
            id: "oms_after_backfill_close",
            label: "Full photo of OMS after backfilling (close door)",
          },
        ],
      },
      {
        id: "controllerInstallation",
        label: "Controller Installation",
        needsContractor: true,
        contractorLabel: "Activity Done By Contractor",
        checklistItems: checklist([
          "Check installation of RTU Controller with clamp and nut bolt.",
          "Check installation of antenna MS pipe and antenna with nut bolt.",
          "Check installation of door switch with nut bolt.",
          "Check installation of hydraulic tubing.",
          "Check installation of all PU fittings and elbows.",
          "Check connection of water meter with RTU Controller.",
          "Check cable and hydraulic tubing dressing.",
          "Check RTU Controller cable gland fitting.",
        ]),
        remarkLabel: "Remark",
        photoRequirements: [
          {
            id: "rtu_installation_photo",
            label: "RTU Controller installation photo",
          },
          {
            id: "antenna_ms_pipe_photo",
            label: "Antenna with MS pipe installation photo",
          },
          {
            id: "door_switch_photo",
            label: "Door switch installation photo",
          },
        ],
      },
    ],
  },
  {
    key: "commissioning",
    title: "Commissioning Status",
    description: "Track dry and wet commissioning updates.",
    subOptions: [
      {
        id: "dryCommissioning",
        label: "Dry Commissioning",
        checklistItems: checklist([
          "Check online status in the Web-SCADA.",
          "Check PFCMD solenoid operation through the Web-SCADA.",
          "Check ON-OFF valve solenoid operation through the Web-SCADA.",
          "Check pressure transmitter reading.",
          "Check door switch status in the Web-SCADA.",
          "Check water meter connection and reading.",
          "Check battery healthiness status in the Web-SCADA.",
          "Check controller LoRa ID in Web-SCADA.",
          "Check signal strength and node communication.",
        ]),
        remarkLabel: "Remark",
        photoRequirements: [
          {
            id: "dry_scada_photo",
            label: "SCADA screenshot or photo",
          },
          {
            id: "dry_node_distance_photo",
            label: "Full node photo with distance",
          },
        ],
      },
      {
        id: "wetCommissioning",
        label: "Wet Commissioning",
        checklistItems: checklist([
          "Check PFCMD valve operation through the Web-SCADA.",
          "Check ON-valve operation through the Web-SCADA.",
          "Check node schedule operation through the Web-SCADA.",
          "Check water meter readings and flow in the Web-SCADA.",
          "Check inlet pressure reading in the Web-SCADA.",
          "Check door switch status in the Web-SCADA.",
          "Check battery healthiness status in the Web-SCADA.",
          "Check signal strength and node communication.",
        ]),
        remarkLabel: "Remark",
        photoRequirements: [
          {
            id: "wet_scada_photo",
            label: "SCADA screenshot or photo",
          },
          {
            id: "wet_node_distance_photo",
            label: "Full node photo with distance",
          },
          {
            id: "wet_outlet_media",
            label: "Operational field outlet photo or video",
            allowVideo: true,
          },
        ],
      },
    ],
  },
  {
    key: "rectification",
    title: "Rectification Status",
    description: "Track mechanical/controller rectification activities.",
    subOptions: [
      {
        id: "mechanicalRectification",
        label: "Mechanical Rectification",
        checklistItems: checklist([
          "Visit for OMS flushing purpose.",
          "Visit for OMS leakage rectification purpose.",
          "Visit for OMS material reinstallation purpose.",
        ]),
        remarkLabel: "Other Remark",
        photoRequirements: [
          {
            id: "mechanical_rectification_photo",
            label: "Rectification photo",
          },
        ],
      },
      {
        id: "controllerRectification",
        label: "Controller Rectification",
        checklistItems: checklist([
          "Visit for offline OMS rectification purpose.",
          "Visit for OMS material reinstallation purpose.",
        ]),
        remarkLabel: "Other Remark",
        photoRequirements: [
          {
            id: "controller_rectification_photo",
            label: "Rectification photo",
          },
        ],
      },
    ],
  },
  {
    key: "theftDamageReinstall",
    title: "Theft, Damage and Reinstallation",
    description: "Capture theft/damage material updates and reinstallation details.",
    subOptions: [
      {
        id: "theftDamageReinstallation",
        label: "Theft, Damage and Reinstallation",
        hideStatusRemark: true,
        selectFields: [
          {
            key: "theftDamageMaterial",
            label: "Select the material theft and damage on the node",
            options: THEFT_DAMAGE_MATERIAL_OPTIONS,
            placeholder: "Select material",
          },
          {
            key: "reinstalledMaterial",
            label: "Select the material you reinstalled on the node",
            options: REINSTALL_MATERIAL_OPTIONS,
            placeholder: "Select material",
          },
        ],
        photoRequirements: [
          {
            id: "theft_damage_photo",
            label: "Theft and damage material photo",
          },
          {
            id: "reinstall_material_photo",
            label: "Re-install material photo",
          },
        ],
      },
    ],
  },
];

// Backward compatibility for existing imports
export const OMS_STATUS_SECTIONS = MODULE_STATUS_SECTIONS;
