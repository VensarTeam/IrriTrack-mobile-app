import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getUnitStatusBySubOption } from "../constants/moduleStatusConfig";
import {
  findOmsStatusFilterOptionByValue,
  findOmsSubprocessFilterOptionById,
  findOmsSubprocessFilterOptionByLabel,
  OMS_STATUS_FILTER_OPTIONS,
  OMS_SUBPROCESS_FILTER_OPTIONS,
} from "../constants/omsFilterConfig";
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
const STATUS_BOARD_BUCKETS = ["Approved", "Requested", "Pending", "Rejected"];
const DEFAULT_SORT_BY = "oms";
const DEFAULT_SORT_ORDER = "asc";
const DEFAULT_SUBPROCESS_FILTER_ID = null;
const DEFAULT_STATUS_FILTER_VALUE = null;
const HIDDEN_OMS_CARD_SECTION_KEYS = new Set(["rectification"]);
const TO_BE_VERIFY_STATUS_LABEL = "To be Confirm";
const OMS_CARD_SUBPROCESS_LABELS = {
  locationFinalization: "Location",
  inletPipeLaying: "Inlet Pipe",
  outletPipeLaying: "Outlet Pipe",
  pedestalEnclosureInstallation: "Pedestal",
  mechanicalAccessoriesInstallation: "Mechanical",
  automationInstallation: "Automation",
  pipeFlushing: "Flushing",
  dryCommissioning: "Dry Commissioning",
  wetCommissioning: "Commissioning",
};

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
    return "Partial";
  }

  return "Partial";
};

const PROCESS_STATUS_BY_CODE = {
  0: "Pending",
  1: "Partial",
  2: "Completed",
  3: "Commented",
  4: "Approved",
  5: "Info",
};

const normalizeProcessStatusValue = ({ status, statusLabel } = {}) => {
  const normalizedLabel = String(statusLabel || "")
    .trim()
    .toLowerCase();

  if (
    normalizedLabel === "to be confirm" ||
    normalizedLabel === "to be confirmed"
  ) {
    return TO_BE_VERIFY_STATUS_LABEL;
  }

  if (normalizedLabel === "approved") {
    return "Approved";
  }

  if (normalizedLabel === "updated") {
    return "Updated";
  }

  if (normalizedLabel === "verified") {
    return "Verified";
  }

  if (normalizedLabel === "submitted") {
    return "Submitted";
  }

  if (normalizedLabel === "commented") {
    return "Commented";
  }

  if (normalizedLabel === "completed") {
    return "Completed";
  }

  if (
    normalizedLabel === "partial" ||
    normalizedLabel === "partial completed" ||
    normalizedLabel === "partially completed"
  ) {
    return "Partial";
  }

  if (normalizedLabel === "info") {
    return "Info";
  }

  const statusCode = Number(status);

  if (Number.isFinite(statusCode) && PROCESS_STATUS_BY_CODE[statusCode]) {
    return PROCESS_STATUS_BY_CODE[statusCode];
  }

  return "Pending";
};

const getCardStatusValue = ({ apiSubprocess, fallbackValue }) => {
  const statusValue = apiSubprocess
    ? normalizeProcessStatusValue(apiSubprocess)
    : fallbackValue || "Pending";

  return statusValue;
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

const normalizeStatusBoardValue = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (
    normalizedValue === "approved" ||
    normalizedValue === "completed" ||
    normalizedValue === "updated"
  ) {
    return "Approved";
  }

  if (
    normalizedValue === "requested" ||
    normalizedValue === "partial completed" ||
    normalizedValue === "partially completed" ||
    normalizedValue === "partial"
  ) {
    return "Requested";
  }

  if (normalizedValue === "commented" || normalizedValue === "rejected") {
    return "Rejected";
  }

  return "Pending";
};

const normalizeStageLabel = (value = "") =>
  String(value || "")
    .replace(/&/g, "and")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getCardSubprocessLabel = (subOption = {}) =>
  OMS_CARD_SUBPROCESS_LABELS[subOption?.id] ||
  subOption?.cardLabel ||
  subOption?.shortLabel ||
  subOption?.apiDescription ||
  subOption?.label ||
  "";

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
  const [zone, setZone] = useState(route?.params?.zoneName || "All");
  const [village, setVillage] = useState(route?.params?.villageName || "All");
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
    zoneOptions,
    zones: onlineZones,
    villages: onlineVillages,
    villageOptions,
    filterTotalItems,
    zoneTotalOms,
    zoneTotalItems,
    villageTotalOms,
    villageTotalItems,
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
  const hasFocusedListOnceRef = useRef(false);
  const remoteUnitCountRef = useRef(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSubprocessId, setSelectedSubprocessId] = useState(() => {
    const routeSubprocessId = route?.params?.subprocessId;
    const matchedOption = findOmsSubprocessFilterOptionById(routeSubprocessId);

    return matchedOption?.id ?? DEFAULT_SUBPROCESS_FILTER_ID;
  });
  const [selectedStatusValue, setSelectedStatusValue] = useState(() => {
    const routeStatusValue = route?.params?.status;
    const matchedOption = findOmsStatusFilterOptionByValue(routeStatusValue);

    return matchedOption?.value ?? DEFAULT_STATUS_FILTER_VALUE;
  });
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] = useState(DEFAULT_SORT_ORDER);
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
  const statusBoardEnabled = Boolean(route?.params?.statusBoardEnabled);
  const statusBoardStageLabel = String(
    route?.params?.statusBoardStageLabel || "All"
  ).trim();
  const statusBoardTitle = String(
    route?.params?.statusBoardTitle || `${module} Status Board`
  ).trim();
  const hasRouteLocationFilters = Boolean(
    (route?.params?.zoneName && route?.params?.zoneName !== "All") ||
      (route?.params?.villageName && route?.params?.villageName !== "All")
  );
  const [selectedStatusBucket, setSelectedStatusBucket] = useState(
    STATUS_BOARD_BUCKETS[0]
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

  const zoneDisplayCount = useMemo(() => {
    if (zone === "All") {
      return zoneTotalOms;
    }

    const matchedZone = zoneOptions.find((item) => item?.name === zone);
    return Number(
      matchedZone?.totalOms ?? matchedZone?.omsQty ?? zoneTotalOms ?? 0
    );
  }, [zone, zoneOptions, zoneTotalOms]);

  const villageDisplayCount = useMemo(() => {
    if (village === "All") {
      return villageTotalOms;
    }

    const matchedVillage = villageOptions.find((item) => item?.name === village);
    return Number(
      matchedVillage?.totalOms ?? matchedVillage?.noOfOms ?? villageTotalOms ?? 0
    );
  }, [village, villageOptions, villageTotalOms]);

  const subprocessFilterOptions = useMemo(() => {
    if (!shouldUseOmsApi) {
      return [];
    }

    const masterOptions = processSections
      .filter((section) =>
        ["installation", "commissioning"].includes(String(section?.key || ""))
      )
      .flatMap((section) => section?.subOptions || [])
      .map((subOption) => {
        const fallbackOption = findOmsSubprocessFilterOptionByLabel(
          subOption?.apiDescription || subOption?.label
        );
        const fallbackId = fallbackOption?.id ?? null;
        const nextId = Number(subOption?.apiSubprocessId || fallbackId);

        if (!Number.isInteger(nextId) || nextId <= 0) {
          return null;
        }

        return {
          id: nextId,
          label: subOption?.apiDescription || subOption?.label || "",
          shortLabel:
            fallbackOption?.shortLabel ||
            subOption?.apiDescription ||
            subOption?.label ||
            "",
        };
      })
      .filter(Boolean);

    if (masterOptions.length) {
      const optionsById = new Map();

      masterOptions.forEach((item) => {
        optionsById.set(Number(item.id), item);
      });

      OMS_SUBPROCESS_FILTER_OPTIONS.forEach((item) => {
        if (!optionsById.has(Number(item.id))) {
          optionsById.set(Number(item.id), {
            id: item.id,
            label: item.label,
            shortLabel: item.shortLabel || item.label,
          });
        }
      });

      return Array.from(optionsById.values()).sort(
        (left, right) => Number(left.id) - Number(right.id)
      );
    }

    return OMS_SUBPROCESS_FILTER_OPTIONS.map((item) => ({
      id: item.id,
      label: item.label,
      shortLabel: item.shortLabel || item.label,
    }));
  }, [processSections, shouldUseOmsApi]);

  const statusFilterOptions = useMemo(
    () =>
      OMS_STATUS_FILTER_OPTIONS.map((item) => ({
        value: item.value,
        label: item.label,
      })),
    []
  );

  const selectedSubprocessOption = useMemo(
    () =>
      subprocessFilterOptions.find(
        (item) => Number(item.id) === Number(selectedSubprocessId)
      ) ||
      findOmsSubprocessFilterOptionById(selectedSubprocessId),
    [selectedSubprocessId, subprocessFilterOptions]
  );

  const selectedStatusOption = useMemo(
    () =>
      selectedStatusValue === null || selectedStatusValue === undefined
        ? null
        : statusFilterOptions.find(
            (item) => Number(item.value) === Number(selectedStatusValue)
          ) || findOmsStatusFilterOptionByValue(selectedStatusValue),
    [selectedStatusValue, statusFilterOptions]
  );

  useEffect(() => {
    if (!canUseLocationFilters && !hasRouteLocationFilters) {
      setZone("All");
      setVillage("All");
    }
  }, [canUseLocationFilters, hasRouteLocationFilters]);

  useEffect(() => {
    // Debounce search input so we avoid firing an API request on every key press.
    const timerId = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, DEFAULT_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timerId);
    };
  }, [search]);

  useEffect(() => {
    remoteUnitCountRef.current = remoteUnits.length;
  }, [remoteUnits.length]);

  const fetchRemoteUnits = useCallback(
    async ({ page = 1, append = false, refreshing = false } = {}) => {
      const requestId = requestSequenceRef.current + 1;
      requestSequenceRef.current = requestId;

      if (refreshing) {
        setIsRefreshing(true);
      } else if (append) {
        isFetchingMoreRef.current = true;
        setIsFetchingMore(true);
      } else if (remoteUnitCountRef.current === 0) {
        setIsInitialLoading(true);
      }

      setUnitsError("");

      try {
        const response = await fetchOmsUnitsPage({
          projectId,
          zoneName: zone,
          villageId: selectedVillageId,
          searchQuery: debouncedSearch,
          subprocessId: selectedSubprocessId,
          status: selectedStatusValue,
          sortBy,
          sortOrder,
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
    },
    [
      debouncedSearch,
      isOnline,
      pagination.limit,
      projectId,
      selectedStatusValue,
      selectedSubprocessId,
      selectedVillageId,
      shouldUseOmsApi,
      sortBy,
      sortOrder,
      zone,
    ]
  );

  useEffect(() => {
    if (!shouldUseOmsApi) {
      requestSequenceRef.current += 1;
      hasFocusedListOnceRef.current = false;
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
  }, [fetchRemoteUnits, shouldUseOmsApi]);

  useEffect(() => {
    if (!shouldUseOmsApi) {
      hasFocusedListOnceRef.current = false;
      return undefined;
    }

    const unsubscribe = navigation.addListener("focus", () => {
      if (!hasFocusedListOnceRef.current) {
        hasFocusedListOnceRef.current = true;
        return;
      }

      void fetchRemoteUnits({
        page: 1,
        refreshing: true,
      });
    });

    return unsubscribe;
  }, [fetchRemoteUnits, navigation, shouldUseOmsApi]);

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

  const hasActiveFilters =
    !!search.trim() ||
    selectedSubprocessId !== DEFAULT_SUBPROCESS_FILTER_ID ||
    selectedStatusValue !== DEFAULT_STATUS_FILTER_VALUE ||
    (canUseLocationFilters && (zone !== "All" || village !== "All"));
  const hasActiveSort =
    sortBy !== DEFAULT_SORT_BY || sortOrder !== DEFAULT_SORT_ORDER;
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
      projectId: projectId || unit?.projectId || "",
      deviceName: unit?.nodeName || unit?.unitNo || "",
      projectName,
    });
  };

  const getActiveFilterValue = () => {
    if (filterType === "zone") return zone;
    if (filterType === "village") return village;
    if (filterType === "subprocess") {
      return selectedSubprocessOption?.label || "All";
    }
    if (filterType === "status") {
      return selectedStatusOption?.label || "All";
    }
    return "";
  };

  const applyFilter = (item) => {
    if (filterType === "zone") {
      setZone(item);
    }
    if (filterType === "village") {
      setVillage(item);
    }
    if (filterType === "subprocess") {
      const selectedOption =
        item === "All"
          ? null
          : subprocessFilterOptions.find((option) => option.label === item) ||
            findOmsSubprocessFilterOptionByLabel(item);

      setSelectedSubprocessId(selectedOption?.id ?? DEFAULT_SUBPROCESS_FILTER_ID);
    }
    if (filterType === "status") {
      const selectedOption =
        item === "All"
          ? null
          : statusFilterOptions.find((option) => option.label === item) ||
            null;

      setSelectedStatusValue(
        selectedOption?.value ?? DEFAULT_STATUS_FILTER_VALUE
      );
    }
    closeFilterSheet();
  };

  const openFilterSheet = (nextFilterType) => {
    setLocationFilterSearchQuery("");
    if (nextFilterType === "zone" || nextFilterType === "village") {
      prepareFilterOptions(nextFilterType);
    }
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
    setSelectedSubprocessId(DEFAULT_SUBPROCESS_FILTER_ID);
    setSelectedStatusValue(DEFAULT_STATUS_FILTER_VALUE);
    setSortBy(DEFAULT_SORT_BY);
    setSortOrder(DEFAULT_SORT_ORDER);
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

  const getUnitStageStatus = (unit, stageLabel = statusBoardStageLabel) => {
    if (stageLabel === "All") {
      const processStatuses = getCardProcesses(unit)
        .map((process) => process.value)
        .filter(Boolean)
        .map((value) => normalizeStatusBoardValue(value));

      if (!processStatuses.length) {
        return "Pending";
      }

      if (processStatuses.every((value) => value === "Approved")) {
        return "Approved";
      }

      if (processStatuses.some((value) => value === "Rejected")) {
        return "Rejected";
      }

      if (processStatuses.some((value) => value === "Requested")) {
        return "Requested";
      }

      return "Pending";
    }

    const normalizedStageLabel = normalizeStageLabel(stageLabel);
    const statusLookup = getUnitStatusBySubOption(unit);

    for (const section of processSections) {
      const normalizedSectionLabel = normalizeStageLabel(getProcessLabel(section));

      if (normalizedSectionLabel === normalizedStageLabel) {
        const states = (section.subOptions || [])
          .map((subOption) => statusLookup[subOption.id] || null)
          .filter(Boolean);

        if (states.length) {
          return normalizeStatusBoardValue(getProcessValue(states));
        }
      }

      for (const subOption of section.subOptions || []) {
        const normalizedSubOptionLabel = normalizeStageLabel(
          subOption.apiDescription || subOption.label
        );

        if (normalizedSubOptionLabel === normalizedStageLabel) {
          return normalizeStatusBoardValue(statusLookup[subOption.id] || "Pending");
        }
      }
    }

    const apiProcesses = Array.isArray(unit?.processes) ? unit.processes : [];

    for (const process of apiProcesses) {
      if (
        normalizeStageLabel(process?.processName || process?.name) ===
        normalizedStageLabel
      ) {
        return normalizeStatusBoardValue(normalizeProcessStatusValue(process));
      }

      for (const subprocess of process?.subprocesses || []) {
        if (
          normalizeStageLabel(subprocess?.subprocessName || subprocess?.name) ===
          normalizedStageLabel
        ) {
          return normalizeStatusBoardValue(
            normalizeProcessStatusValue(subprocess)
          );
        }
      }
    }

    return "Pending";
  };

  const findMatchingApiSubprocess = (unit, section, subOption) => {
    const apiProcesses = Array.isArray(unit?.processes) ? unit.processes : [];
    const targetSubprocessId = Number(subOption?.apiSubprocessId);

    if (Number.isInteger(targetSubprocessId) && targetSubprocessId > 0) {
      for (const process of apiProcesses) {
        const matchedSubprocess = (process?.subprocesses || []).find(
          (item) =>
            Number(item?.subprocessId || item?.subprocess_id) ===
            targetSubprocessId
        );

        if (matchedSubprocess) {
          return matchedSubprocess;
        }
      }
    }

    const normalizedProcessName = normalizeStageLabel(
      section?.apiDescription || section?.title || ""
    );
    const normalizedSubprocessName = normalizeStageLabel(
      subOption?.apiDescription || subOption?.label || ""
    );

    for (const process of apiProcesses) {
      const processName = normalizeStageLabel(
        process?.processName || process?.name || process?.description || ""
      );

      if (normalizedProcessName && processName !== normalizedProcessName) {
        continue;
      }

      const matchedSubprocess = (process?.subprocesses || []).find(
        (item) =>
          normalizeStageLabel(
            item?.subprocessName || item?.name || item?.description || ""
          ) === normalizedSubprocessName
      );

      if (matchedSubprocess) {
        return matchedSubprocess;
      }
    }

    return null;
  };

  const getCardProcesses = (unit) => {
    const statusLookup = getUnitStatusBySubOption(unit);

    return processSections
      .filter(
        (section) => !HIDDEN_OMS_CARD_SECTION_KEYS.has(String(section?.key || ""))
      )
      .flatMap((section) =>
        (section.subOptions || []).map((subOption) => {
          const apiSubprocess = findMatchingApiSubprocess(
            unit,
            section,
            subOption
          );

          return {
            key: `${section.key}_${subOption.id}`,
            label: getCardSubprocessLabel(subOption),
            sectionKey: section.key,
            subOptionId: subOption.id,
            value: getCardStatusValue({
              apiSubprocess,
              fallbackValue: statusLookup[subOption.id] || "Pending",
            }),
            progressLabel: "",
          };
        })
      );
  };

  const baseFilteredData = shouldUseOmsApi ? remoteUnits : localFilteredData;
  const shouldApplyStatusBoard = statusBoardEnabled && !isOfflineOmsList;
  const filteredData = shouldApplyStatusBoard
    ? baseFilteredData.filter(
        (unit) => getUnitStageStatus(unit) === selectedStatusBucket
      )
    : baseFilteredData;
  const statusBoardCounts = STATUS_BOARD_BUCKETS.reduce((acc, bucket) => {
    acc[bucket] = baseFilteredData.filter(
      (unit) => getUnitStageStatus(unit) === bucket
    ).length;
    return acc;
  }, {});

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
    statusBoardEnabled,
    statusBoardTitle,
    statusBoardStageLabel,
    selectedStatusBucket,
    statusBoardCounts,
    zones,
    villages,
    filterTotalItems,
    zoneTotalItems,
    villageTotalItems,
    zoneDisplayCount,
    villageDisplayCount,
    subprocessFilterOptions,
    statusFilterOptions,
    selectedSubprocessId,
    selectedStatusValue,
    selectedSubprocessLabel: selectedSubprocessOption?.label || "All",
    selectedSubprocessShortLabel:
      selectedSubprocessOption?.shortLabel ||
      selectedSubprocessOption?.label ||
      "All",
    selectedStatusLabel: selectedStatusOption?.label || "All",
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
    setSelectedStatusBucket,
    openFilterSheet,
    closeFilterSheet,
    setLocationFilterSearchQuery,
    loadMoreFilterOptions,
    filteredData,
    hasActiveFilters,
    hasActiveSort,
    locationSummary,
    sortBy,
    sortOrder,
    openMap,
    openGallery,
    getActiveFilterValue,
    applyFilter,
    clearFilters,
    setSortBy,
    setSortOrder,
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
