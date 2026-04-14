import { useMemo, useState } from "react";
import {
  getUnitStatusBySubOption,
  MODULE_STATUS_SECTIONS,
  UNIT_LIST_SECTION_KEYS,
} from "../constants/moduleStatusConfig";
import { ROUTES } from "../navigation/routes";
import { getFilterOptions, getUnits } from "../repositories/unitRepository";
import { openDirections } from "../services/mapService";
import { showAppAlert } from "../services/alertService";

const COMPLETED_STATES = ["Completed", "Updated"];
const PENDING_STATES = ["Pending", "", null, undefined];
const CERTIFICATE_STATUS_KEYS = [
  "inlet",
  "outlet",
  "mechanical",
  "controller",
  "flushing",
  "dry",
  "wet",
  "mechanicalRectification",
  "controllerRectification",
];

const getProcessValue = (states) => {
  if (states.every((state) => COMPLETED_STATES.includes(state))) {
    return "Completed";
  }

  if (states.every((state) => PENDING_STATES.includes(state))) {
    return "Pending";
  }

  return "Partial Completed";
};

const getCompactProgressLabel = (completedCount, totalCount) => {
  if (completedCount === totalCount) {
    return "Done";
  }

  return `${completedCount}/${totalCount}`;
};

const PROCESS_SECTIONS = UNIT_LIST_SECTION_KEYS.map((sectionKey) =>
  MODULE_STATUS_SECTIONS.find((section) => section.key === sectionKey)
).filter(Boolean);

const getProcessLabel = (section = {}) =>
  section.cardLabel ||
  (section.title || "").replace(/\s+(Status|Process)$/, "").trim();

const useUnitListViewModel = (navigation, route) => {
  const module = route?.params?.module || "OMS";
  const { zones, distributors, villages } = getFilterOptions();

  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("All");
  const [distributor, setDistributor] = useState("All");
  const [village, setVillage] = useState("All");
  const [filterType, setFilterType] = useState(null);

  const data = getUnits(module);
  const projectName =
    "Kayampur Sitamau Pressurized Micro Lift Major Irrigation Project";

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return (
        item.unitNo.toLowerCase().includes(search.toLowerCase()) &&
        (zone === "All" || item.zone === zone) &&
        (distributor === "All" || item.distributor === distributor) &&
        (village === "All" || item.village === village)
      );
    });
  }, [data, search, zone, distributor, village]);

  const hasActiveFilters =
    !!search.trim() || zone !== "All" || distributor !== "All" || village !== "All";

  const openMap = (lat, lng) => {
    openDirections(lat, lng);
  };

  const openGallery = (unit) => {
    navigation.navigate(ROUTES.ROOT.UNIT_GALLERY, {
      module,
      unit,
      projectName,
    });
  };

  const getActiveFilterValue = () => {
    if (filterType === "zone") return zone;
    if (filterType === "distributor") return distributor;
    if (filterType === "village") return village;
    return "";
  };

  const applyFilter = (item) => {
    if (filterType === "zone") setZone(item);
    if (filterType === "distributor") setDistributor(item);
    if (filterType === "village") setVillage(item);
    setFilterType(null);
  };

  const clearFilters = () => {
    setSearch("");
    setZone("All");
    setDistributor("All");
    setVillage("All");
  };

  const openUnitDetails = (unit) => {
    navigation.navigate(ROUTES.ROOT.UNIT_DETAILS, {
      module,
      unit,
      projectName,
    });
  };

  const openProcess = (unit, process) => {
    navigation.navigate(ROUTES.ROOT.UNIT_STATUS_UPDATE, {
      module,
      unit,
      projectName,
      sectionKey: process.sectionKey,
      subOptionId: process.subOptionId,
    });
  };

  const getCardProcesses = (unit) =>
    PROCESS_SECTIONS.map((section) => {
      const statusLookup = getUnitStatusBySubOption(unit);
      const states = (section.subOptions || []).map(
        (subOption) => statusLookup[subOption.id] || "Pending"
      );
      const completedCount = states.filter((state) =>
        COMPLETED_STATES.includes(state)
      ).length;

      return {
        key: section.key,
        label: getProcessLabel(section),
        sectionKey: section.key,
        subOptionId: section.subOptions[0]?.id,
        value: getProcessValue(states),
        progressLabel: getCompactProgressLabel(completedCount, states.length),
      };
    });

  const canDownloadCertificate = (unit) =>
    CERTIFICATE_STATUS_KEYS.every((key) =>
      COMPLETED_STATES.includes(unit?.[key] || "Pending")
    );

  const downloadCertificate = (unit) => {
    showAppAlert({
      type: "info",
      title: "Completion Certificate",
      message: `${
        unit?.unitNo || "This unit"
      } certificate download will be connected when API integration is done.`,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return {
    module,
    zones,
    distributors,
    villages,
    search,
    zone,
    distributor,
    village,
    filterType,
    setSearch,
    setFilterType,
    filteredData,
    hasActiveFilters,
    openMap,
    openGallery,
    getActiveFilterValue,
    applyFilter,
    clearFilters,
    openUnitDetails,
    getCardProcesses,
    openProcess,
    canDownloadCertificate,
    downloadCertificate,
    handleBack,
  };
};

export default useUnitListViewModel;
