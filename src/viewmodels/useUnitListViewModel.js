import { useEffect, useMemo, useRef, useState } from "react";
import { getUnitStatusBySubOption } from "../constants/moduleStatusConfig";
import { useAuth } from "../context/AuthContext";
import useProjectLocationFilters from "../hooks/useProjectLocationFilters";
import { ROUTES } from "../navigation/routes";
import { fetchOmsUnitsPage, getUnits } from "../repositories/unitRepository";
import { openDirections } from "../services/mapService";
import { showAppAlert } from "../services/alertService";
import useChecklistSections from "./useChecklistSections";

const COMPLETED_STATES = ["Completed", "Updated", "Approved"];
const PENDING_STATES = ["Pending", "", null, undefined];
const PARTIAL_STATES = ["Partial", "Partial Completed", "Partially Completed", "Commented"];
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
const DEFAULT_SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_PAGE_LIMIT = 5;

const createEmptyPagination = () => ({
  page: 1,
  limit: DEFAULT_PAGE_LIMIT,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
});

const getProcessValue = (states) => {
  if (states.every((state) => COMPLETED_STATES.includes(state))) {
    return "Completed";
  }

  if (states.every((state) => PENDING_STATES.includes(state))) {
    return "Pending";
  }

  if (states.some((state) => PARTIAL_STATES.includes(state))) {
    return "Partial Completed";
  }

  return "Partial Completed";
};

const PROCESS_STATUS_BY_CODE = {
  0: "Pending",
  1: "Partial Completed",
  2: "Completed",
  3: "Commented",
  4: "Approved",
};

const normalizeProcessStatusValue = ({ status, statusLabel } = {}) => {
  const statusCode = Number(status);

  if (Number.isFinite(statusCode) && PROCESS_STATUS_BY_CODE[statusCode]) {
    return PROCESS_STATUS_BY_CODE[statusCode];
  }

  const normalizedLabel = String(statusLabel || "")
    .trim()
    .toLowerCase();

  if (normalizedLabel === "approved") {
    return "Approved";
  }

  if (normalizedLabel === "commented") {
    return "Commented";
  }

  if (normalizedLabel === "completed") {
    return "Completed";
  }

  if (normalizedLabel === "partial" || normalizedLabel === "partially completed") {
    return "Partial Completed";
  }

  return "Pending";
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

const isOmsModule = (module = "") =>
  String(module || "").trim().toUpperCase() === "OMS";

const toDisplayText = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const preferredValue =
      value.name || value.label || value.title || value.code || value.id;

    if (preferredValue === null || preferredValue === undefined) {
      return fallback;
    }

    return String(preferredValue);
  }

  return fallback;
};

const getUnitIdentity = (item = {}) =>
  item?.id || item?.unitNo || item?.nodeName || "";

const mergeUnitsById = (currentUnits = [], nextUnits = []) => {
  const unitsById = new Map();
  const mergedUnits = [];

  currentUnits.forEach((item) => {
    const identity = getUnitIdentity(item);

    if (!identity) {
      mergedUnits.push(item);
      return;
    }

    unitsById.set(identity, item);
  });

  nextUnits.forEach((item) => {
    const identity = getUnitIdentity(item);

    if (!identity) {
      mergedUnits.push(item);
      return;
    }

    unitsById.set(identity, item);
  });

  return [...Array.from(unitsById.values()), ...mergedUnits];
};

const useUnitListViewModel = (navigation, route) => {
  const { user, roleAccess } = useAuth();
  const module = route?.params?.module || "OMS";
  const project = route?.params?.project || null;
  const projectId = project?.id || project?.projectId || user?.projectId || "";
  const { sections: processSections } = useChecklistSections({ module });
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("All");
  const [village, setVillage] = useState("All");
  const [filterType, setFilterType] = useState(null);
  const [locationFilterSearchQuery, setLocationFilterSearchQuery] = useState("");
  const {
    isOnline,
    canUseLocationFilters,
    isFilterOptionsLoading,
    isFetchingMoreFilterOptions,
    hasMoreFilterOptions,
    prepareFilterOptions,
    loadMoreFilterOptions,
    zones: onlineZones,
    villages: onlineVillages,
    villageOptions,
  } = useProjectLocationFilters({
    projectId,
    zoneName: zone,
    villageName: village,
    activeFilterType: filterType,
    searchQuery: locationFilterSearchQuery,
  });
  const zones = canUseLocationFilters ? onlineZones : [];
  const villages = canUseLocationFilters ? onlineVillages : [];
  const data = getUnits(module);
  const requestSequenceRef = useRef(0);
  const isFetchingMoreRef = useRef(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [remoteUnits, setRemoteUnits] = useState([]);
  const [pagination, setPagination] = useState(createEmptyPagination());
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [unitsError, setUnitsError] = useState("");
  const projectName = toDisplayText(
    route?.params?.projectName || project?.name,
    "IrriTrack"
  );
  const shouldUseOmsApi = isOmsModule(module) && Boolean(projectId);
  const isOfflineOmsList = shouldUseOmsApi && !isOnline;

  const selectedVillageId = useMemo(() => {
    if (village === "All") {
      return "";
    }

    return (
      villageOptions.find((item) => item?.name === village)?.id || ""
    );
  }, [village, villageOptions]);

  useEffect(() => {
    if (!canUseLocationFilters) {
      setZone("All");
      setVillage("All");
    }
  }, [canUseLocationFilters]);

  useEffect(() => {
    // Debounce search input so we avoid firing an API request on every key press.
    const timerId = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, DEFAULT_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timerId);
    };
  }, [search]);

  const fetchRemoteUnits = async ({
    page = 1,
    append = false,
    refreshing = false,
  } = {}) => {
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;

    if (refreshing) {
      setIsRefreshing(true);
    } else if (append) {
      isFetchingMoreRef.current = true;
      setIsFetchingMore(true);
    } else if (remoteUnits.length === 0) {
      setIsInitialLoading(true);
    }

    setUnitsError("");

    try {
      const response = await fetchOmsUnitsPage({
        projectId,
        zoneName: zone,
        villageId: selectedVillageId,
        searchQuery: debouncedSearch,
        page,
        limit: pagination.limit || DEFAULT_PAGE_LIMIT,
        offline: shouldUseOmsApi && !isOnline,
      });

      // Ignore stale responses so quick filter/search changes do not flash old data.
      if (requestSequenceRef.current !== requestId) {
        return;
      }

      setRemoteUnits((currentUnits) =>
        append
          ? mergeUnitsById(currentUnits, response.data)
          : response.data
      );
      setPagination(response.meta);
    } catch (error) {
      if (requestSequenceRef.current !== requestId) {
        return;
      }

      if (!append) {
        setRemoteUnits([]);
        setPagination(createEmptyPagination());
      }

      setUnitsError(error?.message || "Unable to load OMS units.");
    } finally {
      if (requestSequenceRef.current === requestId) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
        setIsFetchingMore(false);
        isFetchingMoreRef.current = false;
      }
    }
  };

  useEffect(() => {
    if (!shouldUseOmsApi) {
      requestSequenceRef.current += 1;
      setRemoteUnits([]);
      setPagination(createEmptyPagination());
      setUnitsError("");
      setIsInitialLoading(false);
      setIsRefreshing(false);
      setIsFetchingMore(false);
      isFetchingMoreRef.current = false;
      return;
    }

    void fetchRemoteUnits({ page: 1 });
  }, [
    debouncedSearch,
    isOnline,
    projectId,
    selectedVillageId,
    shouldUseOmsApi,
    zone,
  ]);

  const localFilteredData = useMemo(() => {
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

  const filteredData = shouldUseOmsApi ? remoteUnits : localFilteredData;

  const hasActiveFilters =
    !!search.trim() ||
    (canUseLocationFilters && (zone !== "All" || village !== "All"));
  const locationSummary =
    !canUseLocationFilters
      ? "Filters available online only"
      : zone !== "All" && village !== "All"
        ? `${zone} / ${village}`
        : village !== "All"
          ? `${village} overview`
          : zone !== "All"
            ? `${zone} overview`
            : "All zones overview";
  const emptyTitle = unitsError ? "Unable to load units" : "No units found";
  const emptySubtitle = unitsError
    ? unitsError
    : "No data matches your current search and filters.";
  const emptyActionLabel = unitsError ? "Retry" : "Clear Filters";

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
    }
    if (filterType === "village") setVillage(item);
    closeFilterSheet();
  };

  const openFilterSheet = (nextFilterType) => {
    setLocationFilterSearchQuery("");
    prepareFilterOptions(nextFilterType);
    setFilterType(nextFilterType);
  };

  const closeFilterSheet = () => {
    setLocationFilterSearchQuery("");
    setFilterType(null);
  };

  const clearFilters = () => {
    setSearch("");
    setZone("All");
    setVillage("All");
    setLocationFilterSearchQuery("");
  };

  const refreshUnits = async () => {
    if (!shouldUseOmsApi || isRefreshing) {
      return;
    }

    await fetchRemoteUnits({
      page: 1,
      refreshing: true,
    });
  };

  const loadNextPage = async () => {
    const currentPage = Number(pagination.page) || 1;

    if (
      !shouldUseOmsApi ||
      isInitialLoading ||
      isRefreshing ||
      isFetchingMoreRef.current ||
      !pagination.hasNextPage
    ) {
      return;
    }

    await fetchRemoteUnits({
      page: currentPage + 1,
      append: true,
    });
  };

  const handleEmptyAction = () => {
    if (unitsError) {
      void refreshUnits();
      return;
    }

    clearFilters();
  };

  const openUnitDetails = (unit) => {
    if (!roleAccess.canOpenUnitDetails) {
      return;
    }

    navigation.navigate(ROUTES.ROOT.UNIT_DETAILS, {
      module,
      unit,
      projectId,
      projectName,
    });
  };

  const openProcess = (unit, process) => {
    if (!roleAccess.canOpenProcessTabs) {
      showAppAlert({
        type: "warning",
        title: "Action unavailable",
        message: "You do not have access to open this process.",
      });
      return;
    }

    if (roleAccess.canReviewChecklist) {
      navigation.navigate(ROUTES.ROOT.UNIT_STATUS_OVERVIEW, {
        module,
        unit,
        unitId: unit?.id || "",
        projectId: projectId || unit?.projectId || "",
        projectName,
      });
      return;
    }

    navigation.navigate(ROUTES.ROOT.UNIT_STATUS_UPDATE, {
      module,
      unit,
      projectId: projectId || unit?.projectId || "",
      projectName,
      sectionKey: process.sectionKey,
      subOptionId: process.subOptionId,
    });
  };

  const getCardProcesses = (unit) =>
    processSections.map((section, index) => {
      const apiProcess = Array.isArray(unit?.processes)
        ? unit.processes.find(
            (item) =>
              Number(item?.processId) ===
              Number(section.apiProcessId || index + 1)
          )
        : null;

      if (apiProcess) {
        return {
          key: section.key,
          label: getProcessLabel(section),
          sectionKey: section.key,
          subOptionId: section.subOptions[0]?.id,
          value: normalizeProcessStatusValue(apiProcess),
          progressLabel: "",
        };
      }

      const statusLookup = getUnitStatusBySubOption(unit);
      const states = (section.subOptions || []).map(
        (subOption) => statusLookup[subOption.id] || null
      );
      const hasTrackedState = states.some(
        (state) => state && !PENDING_STATES.includes(state)
      );
      const completedCount = states.filter((state) =>
        COMPLETED_STATES.includes(state)
      ).length;

      return {
        key: section.key,
        label: getProcessLabel(section),
        sectionKey: section.key,
        subOptionId: section.subOptions[0]?.id,
        value:
          isOfflineOmsList && !hasTrackedState
            ? ""
            : getProcessValue(states.map((state) => state || "Pending")),
        progressLabel: "",
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
    canOpenUnitDetails: roleAccess.canOpenUnitDetails,
    canUseLocationFilters,
    module,
    zones,
    villages,
    search,
    zone,
    village,
    filterType,
    isFilterOptionsLoading,
    isFetchingMoreFilterOptions,
    hasMoreFilterOptions,
    locationFilterSearchQuery,
    isInitialLoading,
    isRefreshing,
    isFetchingMore,
    shouldUseOmsApi,
    isOfflineOmsList,
    emptyTitle,
    emptySubtitle,
    emptyActionLabel,
    setSearch,
    openFilterSheet,
    closeFilterSheet,
    setLocationFilterSearchQuery,
    loadMoreFilterOptions,
    filteredData,
    hasActiveFilters,
    locationSummary,
    openMap,
    openGallery,
    getActiveFilterValue,
    applyFilter,
    clearFilters,
    refreshUnits,
    loadNextPage,
    handleEmptyAction,
    openUnitDetails,
    getCardProcesses,
    openProcess,
    canDownloadCertificate,
    downloadCertificate,
    handleBack,
  };
};

export default useUnitListViewModel;
