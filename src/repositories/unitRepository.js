import { createOmsUnitListPage, createUnit } from "../models/unit";
import { fetchOmsList } from "../services/unitListService";

const unitTemplates = [
  {
    id: "1",
    unitSuffix: "001",
    zone: "ZONE-05",
    distributor: "Sub Minor",
    village: "Abakhedi",
    latitude: 23.18,
    longitude: 75.78,
    inlet: "Completed",
    inletPipeLaying: "Completed",
    outlet: "Pending",
    outletPipeLaying: "Pending",
    mechanical: "Partially Completed",
    pedestalEnclosureInstallation: "Completed",
    mechanicalAccessoriesInstallation: "Partially Completed",
    controller: "Completed",
    automationInstallation: "Completed",
    flushing: "Pending",
    pipeFlushing: "Pending",
    dry: "Completed",
    dryCommissioning: "Completed",
    wet: "Pending",
    wetCommissioning: "Pending",
    locationUpdatedAt: null,
    mechanicalRectification: "Pending",
    controllerRectification: "Pending",
    automationWorkRectification: "Pending",
    theftDamageReinstallation: "Pending",
    area: "30 ha",
    chakArea: "5.0 ha",
    subChakQuantity: "6",
  },
  {
    id: "2",
    unitSuffix: "002",
    zone: "ZONE-05",
    distributor: "Minor",
    village: "Kolwa",
    latitude: 23.19,
    longitude: 75.77,
    inlet: "Completed",
    inletPipeLaying: "Completed",
    outlet: "Completed",
    outletPipeLaying: "Completed",
    mechanical: "Completed",
    pedestalEnclosureInstallation: "Completed",
    mechanicalAccessoriesInstallation: "Completed",
    controller: "Completed",
    automationInstallation: "Completed",
    flushing: "Completed",
    pipeFlushing: "Completed",
    dry: "Completed",
    dryCommissioning: "Completed",
    wet: "Completed",
    wetCommissioning: "Completed",
    locationUpdatedAt: "2026-04-06T10:30:00.000Z",
    mechanicalRectification: "Completed",
    controllerRectification: "Completed",
    automationWorkRectification: "Completed",
    theftDamageReinstallation: "Completed",
    area: "32 ha",
    chakArea: "5.2 ha",
    subChakQuantity: "6",
  },
  {
    id: "3",
    unitSuffix: "003",
    zone: "ZONE-02",
    distributor: "Minor",
    village: "Nahargarh",
    latitude: 23.16,
    longitude: 75.81,
    inlet: "Completed",
    inletPipeLaying: "Completed",
    outlet: "Completed",
    outletPipeLaying: "Pending",
    mechanical: "Partially Completed",
    pedestalEnclosureInstallation: "Completed",
    mechanicalAccessoriesInstallation: "Partially Completed",
    controller: "Pending",
    automationInstallation: "Pending",
    flushing: "Pending",
    pipeFlushing: "Pending",
    dry: "Pending",
    dryCommissioning: "Pending",
    wet: "Pending",
    wetCommissioning: "Pending",
    locationUpdatedAt: "2026-04-12T10:30:00.000Z",
    mechanicalRectification: "Pending",
    controllerRectification: "Pending",
    automationWorkRectification: "Pending",
    theftDamageReinstallation: "Pending",
    area: "28 ha",
    chakArea: "4.6 ha",
    subChakQuantity: "5",
  },
  {
    id: "4",
    unitSuffix: "004",
    zone: "ZONE-04",
    distributor: "Sub Minor",
    village: "Gariyakheda",
    latitude: 23.14,
    longitude: 75.82,
    inlet: "Completed",
    inletPipeLaying: "Completed",
    outlet: "Completed",
    outletPipeLaying: "Completed",
    mechanical: "Completed",
    pedestalEnclosureInstallation: "Completed",
    mechanicalAccessoriesInstallation: "Completed",
    controller: "Completed",
    automationInstallation: "Completed",
    flushing: "Completed",
    pipeFlushing: "Completed",
    dry: "Completed",
    dryCommissioning: "Completed",
    wet: "Partially Completed",
    wetCommissioning: "Pending",
    locationUpdatedAt: "2026-04-18T08:15:00.000Z",
    mechanicalRectification: "Completed",
    controllerRectification: "Completed",
    automationWorkRectification: "Pending",
    theftDamageReinstallation: "Pending",
    area: "35 ha",
    chakArea: "5.8 ha",
    subChakQuantity: "7",
  },
];

const distributors = ["Minor", "Sub Minor"];
const zones = Array.from(new Set(unitTemplates.map((item) => item.zone))).sort(
  (left, right) =>
    left.localeCompare(right, "en", { sensitivity: "base", numeric: true })
);
const villages = Array.from(
  new Set(unitTemplates.map((item) => item.village))
).sort((left, right) =>
  left.localeCompare(right, "en", { sensitivity: "base", numeric: true })
);

export const getUnits = (module = "OMS") =>
  unitTemplates.map((item) =>
    createUnit({
      ...item,
      unitNo: `${module}-${item.unitSuffix}`,
    })
  );

export const fetchOmsUnitsPage = async (params = {}) => {
  const response = await fetchOmsList(params);
  return createOmsUnitListPage(response);
};

export const getFilterOptions = () => ({
  zones,
  distributors,
  villages,
});
