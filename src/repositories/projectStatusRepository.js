export const MODULE_TOTALS = {
  OMS: 3841,
  RMS: 399,
  GW: 45,
};

const moduleStageData = {
  OMS: [
    { label: "Inlet pipe conn.", completed: 3465, pending: 228, partial: 148 },
    { label: "Outlet pipe conn.", completed: 3210, pending: 381, partial: 250 },
    { label: "Padestal and Inclosure Inst.", completed: 2740, pending: 661, partial: 440 },
    { label: "Mechanical Accessories Inst.", completed: 2485, pending: 818, partial: 538 },
    { label: "Automation Inst.", completed: 2140, pending: 1028, partial: 673 },
    { label: "Pipe flushing", completed: 1820, pending: 1186, partial: 835 },
    { label: "Dry commissioning", completed: 1488, pending: 1367, partial: 986 },
    { label: "Wet commissioning", completed: 1196, pending: 1575, partial: 1070 },
  ],
  RMS: [
    { label: "Inlet pipe conn.", completed: 332, pending: 44, partial: 23 },
    { label: "Outlet pipe conn.", completed: 301, pending: 61, partial: 37 },
    { label: "Padestal and Inclosure Inst.", completed: 268, pending: 78, partial: 53 },
    { label: "Mechanical Accessories Inst.", completed: 241, pending: 89, partial: 69 },
    { label: "Automation Inst.", completed: 214, pending: 101, partial: 84 },
    { label: "Pipe flushing", completed: 182, pending: 112, partial: 105 },
    { label: "Dry commissioning", completed: 149, pending: 128, partial: 122 },
    { label: "Wet commissioning", completed: 126, pending: 141, partial: 132 },
  ],
  GW: [
    { label: "Inlet pipe conn.", completed: 34, pending: 7, partial: 4 },
    { label: "Outlet pipe conn.", completed: 29, pending: 9, partial: 7 },
    { label: "Padestal and Inclosure Inst.", completed: 24, pending: 11, partial: 10 },
    { label: "Mechanical Accessories Inst.", completed: 21, pending: 12, partial: 12 },
    { label: "Automation Inst.", completed: 18, pending: 14, partial: 13 },
    { label: "Pipe flushing", completed: 15, pending: 15, partial: 15 },
    { label: "Dry commissioning", completed: 11, pending: 17, partial: 17 },
    { label: "Wet commissioning", completed: 8, pending: 19, partial: 18 },
  ],
};

export const getProjectStatusDataSet = () => moduleStageData;
