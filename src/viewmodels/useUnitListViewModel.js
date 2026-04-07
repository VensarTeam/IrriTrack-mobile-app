import { useMemo, useState } from "react";
import { ROUTES } from "../navigation/routes";
import { getFilterOptions, getUnits } from "../repositories/unitRepository";
import { openDirections } from "../services/mapService";
import { showAppAlert } from "../services/alertService";

const COMPLETED_STATES = ["Completed", "Updated"];

const CARD_STATUSES = [
  { key: "inlet", label: "Inlet" },
  { key: "outlet", label: "Outlet" },
  { key: "mechanical", label: "Mechanical" },
  { key: "controller", label: "Controller" },
  { key: "flushing", label: "Flushing" },
  { key: "dry", label: "Dry Comm." },
  { key: "wet", label: "Wet Comm." },
  { key: "mechanicalRectification", label: "Mech Rect." },
  { key: "controllerRectification", label: "Ctrl Rect." },
];

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

  const getCardStatuses = (unit) =>
    CARD_STATUSES.map((status) => ({
      ...status,
      value: unit?.[status.key] || "Pending",
    }));

  const canDownloadCertificate = (unit) =>
    getCardStatuses(unit).every((status) => COMPLETED_STATES.includes(status.value));

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
    getCardStatuses,
    canDownloadCertificate,
    downloadCertificate,
    handleBack,
  };
};

export default useUnitListViewModel;
