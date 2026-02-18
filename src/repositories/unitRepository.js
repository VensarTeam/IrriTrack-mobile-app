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
    dry: "Completed",
    wet: "Pending",
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
    controller: "Pending",
    dry: "Partial",
    wet: "Pending",
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
