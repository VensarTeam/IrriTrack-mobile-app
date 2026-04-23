import { useEffect, useMemo, useState } from "react";
import {
  getUnitStatusBySubOption,
} from "../constants/moduleStatusConfig";
import { useAuth } from "../context/AuthContext";
import useProjectLocationFilters from "../hooks/useProjectLocationFilters";
import { ROUTES } from "../navigation/routes";
import { getUnits } from "../repositories/unitRepository";
import { openDirections } from "../services/mapService";
import { showAppAlert } from "../services/alertService";
import useChecklistSections from "./useChecklistSections";

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

const getProcessLabel = (section = {}) =>
  section.cardLabel ||
  (section.title || "").replace(/\s+(Status|Process)$/, "").trim();

const normalizeLocationValue = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .replace(/ZONE0+(\d+)/g, "ZONE$1");

const useUnitListViewModel = (navigation, route) => {
  const { user } = useAuth();
  const module = route?.params?.module || "OMS";
  const project = route?.params?.project || null;
  const projectId = project?.id || project?.projectId || user?.projectId || "";
  const { sections: processSections } = useChecklistSections({ module });
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("All");
  const [village, setVillage] = useState("All");
  const [filterType, setFilterType] = useState(null);
  const {
    canUseLocationFilters,
    zones: onlineZones,
    villages: onlineVillages,
  } = useProjectLocationFilters({
    projectId,
    selectedZone: zone,
  });
  const zones = canUseLocationFilters ? onlineZones : [];
  const villages = canUseLocationFilters ? onlineVillages : [];
  const data = getUnits(module);
  const projectName =
    route?.params?.projectName ||
    "Kayampur Sitamau Pressurized Micro Lift Major Irrigation Project";

  useEffect(() => {
    if (!canUseLocationFilters) {
      setZone("All");
      setVillage("All");
      return;
    }

    if (zone !== "All" && !zones.includes(zone)) {
      setZone("All");
      setVillage("All");
    }
  }, [canUseLocationFilters, zone, zones]);

  useEffect(() => {
    if (!canUseLocationFilters) {
      return;
    }

    if (village !== "All" && !villages.includes(village)) {
      setVillage("All");
    }
  }, [canUseLocationFilters, village, villages]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesZone =
        zone === "All" ||
        normalizeLocationValue(item.zone) === normalizeLocationValue(zone);
      const matchesVillage =
        village === "All" ||
        normalizeLocationValue(item.village) === normalizeLocationValue(village);

      return (
        item.unitNo.toLowerCase().includes(search.toLowerCase()) &&
        (!canUseLocationFilters || (matchesZone && matchesVillage))
      );
    });
  }, [canUseLocationFilters, data, search, zone, village]);

  const hasActiveFilters =
    !!search.trim() ||
    (canUseLocationFilters && (zone !== "All" || village !== "All"));

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
    if (filterType === "village") return village;
    return "";
  };

  const applyFilter = (item) => {
    if (filterType === "zone") {
      setZone(item);
      setVillage("All");
    }
    if (filterType === "village") setVillage(item);
    setFilterType(null);
  };

  const clearFilters = () => {
    setSearch("");
    setZone("All");
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
    processSections.map((section) => {
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
    canUseLocationFilters,
    module,
    zones,
    villages,
    search,
    zone,
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
