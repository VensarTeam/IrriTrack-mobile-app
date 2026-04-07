import { createUnit } from "../models/unit";

const unitTemplates = [
  {
    id: "1",
    unitSuffix: "001",
    zone: "Zone-1",
    distributor: "Sub Minor",
    village: "Village-A",
    latitude: 23.18,
    longitude: 75.78,
    inlet: "Completed",
    outlet: "Pending",
    mechanical: "Partial",
    controller: "Completed",
    flushing: "Pending",
    dry: "Completed",
    wet: "Pending",
    locationUpdatedAt: null,
    mechanicalRectification: "Pending",
    controllerRectification: "Pending",
    theftDamageReinstallation: "Pending",
    area: "30 ha",
    chakArea: "5.0 ha",
  },
  {
    id: "2",
    unitSuffix: "002",
    zone: "Zone-2",
    distributor: "Minor",
    village: "Village-B",
    latitude: 23.19,
    longitude: 75.77,
    inlet: "Completed",
    outlet: "Completed",
    mechanical: "Completed",
    controller: "Completed",
    flushing: "Completed",
    dry: "Completed",
    wet: "Completed",
    locationUpdatedAt: "2026-04-06T10:30:00.000Z",
    mechanicalRectification: "Completed",
    controllerRectification: "Completed",
    theftDamageReinstallation: "Completed",
    area: "32 ha",
    chakArea: "5.2 ha",
  },
];

const zones = Array.from({ length: 21 }, (_, i) => `Zone-${i + 1}`);
const distributors = ["Minor", "Sub Minor"];
const villages = ["Village-A", "Village-B", "Village-C", "Village-D"];

export const getUnits = (module = "OMS") =>
  unitTemplates.map((item) =>
    createUnit({
      ...item,
      unitNo: `${module}-${item.unitSuffix}`,
    })
  );

export const getFilterOptions = () => ({
  zones,
  distributors,
  villages,
});
