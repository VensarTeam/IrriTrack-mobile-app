export const STATUS_OPTIONS = ["Completed", "Partially Completed", "Pending"];

export const PIPE_SIZE_OPTIONS = [
  "50 mm",
  "63 mm",
  "75 mm",
  "90 mm",
  "110 mm",
  "125 mm",
];

export const DEFAULT_NODE_LOCATION = {
  latitude: 23.18,
  longitude: 75.78,
};

export const MODULE_STATUS_SECTIONS = [
  {
    key: "pipeLaying",
    title: "Pipe Laying Status",
    description: "Update inlet/outlet laying progress and location finalization.",
    subOptions: [
      {
        id: "inletPipeLaying",
        label: "Inlet Pipe Laying",
        needsPipeSize: true,
        needsPhoto: true,
      },
      {
        id: "outletPipeLaying",
        label: "Outlet Pipe Laying",
        needsPipeSize: true,
        needsPhoto: true,
      },
      {
        id: "locationFinalization",
        label: "Location Finalization",
        needsLocationActions: true,
        hideStatusRemark: true,
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
        needsPhoto: true,
      },
      {
        id: "controllerInstallation",
        label: "Controller Installation",
        needsPhoto: true,
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
        needsPhoto: true,
      },
      {
        id: "wetCommissioning",
        label: "Wet Commissioning",
        needsPhoto: true,
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
        needsPhoto: true,
      },
      {
        id: "controllerRectification",
        label: "Controller Rectification",
        needsPhoto: true,
      },
    ],
  },
];

// Backward compatibility for existing imports
export const OMS_STATUS_SECTIONS = MODULE_STATUS_SECTIONS;
