import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import {
  FILTER_PAGE_LIMIT,
  fetchProjectVillageOptions,
  fetchProjectZones,
} from "../services/projectLocationService";

const EMPTY_ARRAY = [];
const DEFAULT_META = {
  page: 1,
  limit: FILTER_PAGE_LIMIT,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const createFilterState = () => ({
  items: EMPTY_ARRAY,
  meta: DEFAULT_META,
  hasLoaded: false,
  isLoading: false,
  isFetchingMore: false,
});

const mergeUniqueStrings = (currentItems = EMPTY_ARRAY, nextItems = EMPTY_ARRAY) =>
  Array.from(new Set([...currentItems, ...nextItems]));

const mergeUniqueVillageOptions = (
  currentItems = EMPTY_ARRAY,
  nextItems = EMPTY_ARRAY
) => {
  const villagesById = new Map();

  currentItems.forEach((item) => {
    if (item?.id) {
      villagesById.set(item.id, item);
    }
  });

  nextItems.forEach((item) => {
    if (item?.id) {
      villagesById.set(item.id, item);
    }
  });

  return Array.from(villagesById.values());
};

const useProjectLocationFilters = ({
  projectId,
  zoneName = "All",
  villageName = "All",
  activeFilterType = null,
  searchQuery = "",
}) => {
  const [isOnline, setIsOnline] = useState(false);
  const [zoneState, setZoneState] = useState(createFilterState);
  const [villageState, setVillageState] = useState(createFilterState);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const zoneRequestIdRef = useRef(0);
  const villageRequestIdRef = useRef(0);
  const normalizedZoneSearchQuery =
    activeFilterType === "zone"
      ? String(debouncedSearchQuery || "").trim()
      : "";
  const normalizedVillageSearchQuery =
    activeFilterType === "village"
      ? String(debouncedSearchQuery || "").trim()
      : "";
  const selectedVillageId = useMemo(
    () =>
      villageName === "All"
        ? ""
        : villageState.items.find((item) => item?.name === villageName)?.id || "",
    [villageName, villageState.items]
  );

  useEffect(() => {
    const updateOnlineState = (state) => {
      const nextOnline =
        state?.isInternetReachable === true || state?.isConnected !== false;
      setIsOnline((currentValue) =>
        currentValue === nextOnline ? currentValue : nextOnline
      );
    };

    const subscription = NetInfo.addEventListener(updateOnlineState);
    void NetInfo.fetch().then(updateOnlineState);

    return () => {
      subscription();
    };
  }, []);

  useEffect(() => {
    const nextSearchQuery = String(searchQuery || "");

    if (!nextSearchQuery.trim()) {
      setDebouncedSearchQuery("");
      return undefined;
    }

    const timerId = setTimeout(() => {
      setDebouncedSearchQuery(nextSearchQuery);
    }, 250);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchQuery]);

  const loadFilterOptions = useCallback(
    async ({ type, page = 1, append = false } = {}) => {
      if (!isOnline || !projectId || !type) {
        return;
      }

      const isZoneFilter = type === "zone";
      const requestIdRef = isZoneFilter ? zoneRequestIdRef : villageRequestIdRef;
      const setFilterState = isZoneFilter ? setZoneState : setVillageState;
      const currentSearchQuery = isZoneFilter
        ? normalizedZoneSearchQuery
        : normalizedVillageSearchQuery;
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setFilterState((currentState) => ({
        items: currentState.items,
        meta: currentState.meta,
        hasLoaded: currentState.hasLoaded,
        isLoading: !append,
        isFetchingMore: append,
      }));

      try {
        const response = isZoneFilter
          ? await fetchProjectZones(projectId, {
              villageId: selectedVillageId,
              searchQuery: currentSearchQuery,
              page,
              limit: FILTER_PAGE_LIMIT,
            })
          : await fetchProjectVillageOptions(projectId, {
              zoneName,
              searchQuery: currentSearchQuery,
              page,
              limit: FILTER_PAGE_LIMIT,
            });

        if (requestIdRef.current !== requestId) {
          return;
        }

        setFilterState((currentState) => ({
          items: append
            ? isZoneFilter
              ? mergeUniqueStrings(currentState.items, response?.items || EMPTY_ARRAY)
              : mergeUniqueVillageOptions(
                  currentState.items,
                  response?.items || EMPTY_ARRAY
                )
            : (response?.items || EMPTY_ARRAY).length
              ? response.items
              : currentState.items,
          meta: response.meta || DEFAULT_META,
          hasLoaded: true,
          isLoading: false,
          isFetchingMore: false,
        }));
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        console.log(
          "[ProjectFilters]",
          isZoneFilter ? "Unable to load zones" : "Unable to load villages",
          {
            message: error?.message,
            status: error?.status,
            projectId,
            page,
            searchQuery: currentSearchQuery,
          }
        );

        setFilterState((currentState) => ({
          ...currentState,
          items: currentState.items,
          meta: currentState.meta,
          hasLoaded: true,
          isLoading: false,
          isFetchingMore: false,
        }));
      }
    },
    [
      isOnline,
      normalizedVillageSearchQuery,
      normalizedZoneSearchQuery,
      projectId,
      selectedVillageId,
      zoneName,
    ]
  );

  useEffect(() => {
    if (!isOnline || !projectId) {
      setZoneState(createFilterState());
      setVillageState(createFilterState());
      return;
    }

    if (activeFilterType) {
      void loadFilterOptions({ type: activeFilterType, page: 1, append: false });
    }
  }, [activeFilterType, isOnline, loadFilterOptions, projectId]);

  const prepareFilterOptions = useCallback((type) => {
    if (type !== "zone" && type !== "village") {
      return;
    }

    if (type === "zone") {
      zoneRequestIdRef.current += 1;
    }

    if (type === "village") {
      villageRequestIdRef.current += 1;
    }

    const setFilterState = type === "zone" ? setZoneState : setVillageState;
    setFilterState((currentState) => ({
      items: currentState.items,
      meta: currentState.meta,
      hasLoaded: currentState.hasLoaded,
      isLoading: currentState.items.length === 0,
      isFetchingMore: false,
    }));
  }, []);

  const loadMoreFilterOptions = useCallback(() => {
    if (activeFilterType === "zone") {
      if (zoneState.isLoading || zoneState.isFetchingMore || !zoneState.meta?.hasNextPage) {
        return;
      }

      void loadFilterOptions({
        type: "zone",
        page: (Number(zoneState.meta?.page) || 1) + 1,
        append: true,
      });
    }

    if (activeFilterType === "village") {
      if (
        villageState.isLoading ||
        villageState.isFetchingMore ||
        !villageState.meta?.hasNextPage
      ) {
        return;
      }

      void loadFilterOptions({
        type: "village",
        page: (Number(villageState.meta?.page) || 1) + 1,
        append: true,
      });
    }
  }, [activeFilterType, loadFilterOptions, villageState, zoneState]);

  const zones = useMemo(() => zoneState.items, [zoneState.items]);
  const villageOptions = useMemo(() => villageState.items, [villageState.items]);
  const villages = useMemo(
    () => villageOptions.map((item) => item.name),
    [villageOptions]
  );
  const currentFilterState =
    activeFilterType === "zone"
      ? zoneState
      : activeFilterType === "village"
        ? villageState
        : createFilterState();

  return {
    isOnline,
    canUseLocationFilters: isOnline && Boolean(projectId),
    isFilterOptionsLoading:
      currentFilterState.isLoading ||
      (Boolean(activeFilterType) &&
        isOnline &&
        Boolean(projectId) &&
        !currentFilterState.hasLoaded),
    isFetchingMoreFilterOptions: currentFilterState.isFetchingMore,
    hasMoreFilterOptions: Boolean(currentFilterState.meta?.hasNextPage),
    prepareFilterOptions,
    loadMoreFilterOptions,
    zones,
    villages,
    villageOptions,
  };
};

export default useProjectLocationFilters;
