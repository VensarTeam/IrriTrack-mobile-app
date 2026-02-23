import { useMemo, useState } from "react";
import { ROUTES } from "../navigation/routes";
import { getFilterOptions, getUnits } from "../repositories/unitRepository";
import { showAppAlert } from "../services/alertService";
import { openDirections } from "../services/mapService";

const useUnitListViewModel = (navigation, route) => {
  const module = route?.params?.module || "OMS";
  const { zones, distributors, villages } = getFilterOptions();

  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("All");
  const [distributor, setDistributor] = useState("All");
  const [village, setVillage] = useState("All");
  const [filterType, setFilterType] = useState(null);

  const data = getUnits(module);

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

  const openGallery = (unitNo) => {
    showAppAlert({
      type: "info",
      title: "Gallery",
      message: `Gallery for ${unitNo} will be available soon.`,
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
      projectName: "Kayampur Sitamau Pressurized Micro Lift Major Irrigation Project",
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
    handleBack,
  };
};

export default useUnitListViewModel;
