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

const locationWeights = [
  { zone: "ZONE-05", village: "Abakhedi", weight: 0.07 },
  { zone: "ZONE-05", village: "Beed nirdhari", weight: 0.06 },
  { zone: "ZONE-05", village: "Khanderiya maru", weight: 0.1 },
  { zone: "ZONE-05", village: "Kolwa", weight: 0.12 },
  { zone: "ZONE-05", village: "Lildan", weight: 0.07 },
  { zone: "ZONE-05", village: "Nirdhari", weight: 0.07 },
  { zone: "ZONE-05", village: "Padliyamaru", weight: 0.1 },
  { zone: "ZONE-05", village: "Pithakhedi nahargarh", weight: 0.06 },
  { zone: "ZONE-04", village: "Gariyakheda", weight: 0.08 },
  { zone: "ZONE-06", village: "Gariyakheda", weight: 0.06 },
  { zone: "ZONE-02", village: "Khanukheda", weight: 0.08 },
  { zone: "ZONE-02", village: "Nahargarh", weight: 0.08 },
  { zone: "ZONE-03", village: "Shakkarkhedi_1", weight: 0.05 },
];

const cloneStageSet = (dataSet) =>
  Object.keys(dataSet).reduce((acc, moduleKey) => {
    acc[moduleKey] = dataSet[moduleKey].map((stage) => ({ ...stage }));
    return acc;
  }, {});

const emptyStageSet = () =>
  Object.keys(moduleStageData).reduce((acc, moduleKey) => {
    acc[moduleKey] = moduleStageData[moduleKey].map((stage) => ({
      label: stage.label,
      completed: 0,
      pending: 0,
      partial: 0,
    }));
    return acc;
  }, {});

const scaleStageValue = (value, weight) => Math.round(value * weight);

const locationStageData = locationWeights.map((location) => ({
  ...location,
  modules: Object.keys(moduleStageData).reduce((acc, moduleKey) => {
    acc[moduleKey] = moduleStageData[moduleKey].map((stage) => ({
      label: stage.label,
      completed: scaleStageValue(stage.completed, location.weight),
      pending: scaleStageValue(stage.pending, location.weight),
      partial: scaleStageValue(stage.partial, location.weight),
    }));
    return acc;
  }, {}),
}));

const villagesByZone = locationWeights.reduce((acc, item) => {
  if (!acc[item.zone]) {
    acc[item.zone] = [];
  }

  if (!acc[item.zone].includes(item.village)) {
    acc[item.zone].push(item.village);
  }

  return acc;
}, {});

const aggregateStages = (stageGroups) => {
  if (!stageGroups.length) return [];

  return stageGroups[0].map((stage, index) => ({
    label: stage.label,
    completed: stageGroups.reduce(
      (sum, current) => sum + (current[index]?.completed || 0),
      0,
    ),
    pending: stageGroups.reduce(
      (sum, current) => sum + (current[index]?.pending || 0),
      0,
    ),
    partial: stageGroups.reduce(
      (sum, current) => sum + (current[index]?.partial || 0),
      0,
    ),
  }));
};

export const getProjectFilterOptions = () => ({
  zones: Object.keys(villagesByZone),
  villagesByZone,
});

export const getProjectStatusDataSet = (filters = {}) => {
  const zone = filters.zone || "All";
  const village = filters.village || "All";

  if (zone === "All" && village === "All") {
    return cloneStageSet(moduleStageData);
  }

  const scopedLocations = locationStageData.filter((item) => {
    const matchesZone = zone === "All" || item.zone === zone;
    const matchesVillage = village === "All" || item.village === village;

    return matchesZone && matchesVillage;
  });

  if (!scopedLocations.length) {
    return emptyStageSet();
  }

  return Object.keys(moduleStageData).reduce((acc, moduleKey) => {
    acc[moduleKey] = aggregateStages(
      scopedLocations.map((item) => item.modules[moduleKey]),
    );
    return acc;
  }, {});
};
