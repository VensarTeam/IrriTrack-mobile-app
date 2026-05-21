import React from "react";
import {
  Animated,
  Easing,
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, IconButton } from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";
import SearchableFilterModal from "../../../components/SearchableFilterModal";
import styles from "./styles";
import colors from "../../../constants/colors";
import { Icons } from "../../../constants/icons";
import useUnitListViewModel from "../../../viewmodels/useUnitListViewModel";
import {
  getUnitStatusColor,
  getUnitStatusPalette,
} from "../../../utils/unitStatusPalette";

const SHIMMER_DURATION = 1150;
const { width } = Dimensions.get("window");
const SORT_BY_OPTIONS = [
  { key: "oms", label: "OMS Name" },
  { key: "date", label: "By Date" },
  { key: "contractor", label: "By Contractor" },
];
const SORT_ORDER_OPTIONS = [
  { key: "asc", label: "Ascending" },
  { key: "desc", label: "Descending" },
];

const formatUnitNo = (value = "", module = "") => {
  const normalizedUnitNo = String(value || "").trim();

  if (!normalizedUnitNo) {
    return "";
  }

  if (String(module || "").trim().toUpperCase() !== "OMS") {
    return normalizedUnitNo;
  }

  return normalizedUnitNo.toUpperCase().startsWith("OMS-")
    ? normalizedUnitNo
    : `OMS-${normalizedUnitNo}`;
};

const shouldUseWideProcessTile = (process, fallbackWide = false) =>
  fallbackWide || String(process?.label || "").length > 13;

const UnitListScreen = ({ navigation, route }) => {
  const [showStatusInfo, setShowStatusInfo] = React.useState(false);
  const [showSortSheet, setShowSortSheet] = React.useState(false);
  const [draftSortBy, setDraftSortBy] = React.useState("");
  const [draftSortOrder, setDraftSortOrder] = React.useState("");
  const shimmerTranslateX = React.useRef(new Animated.Value(0)).current;
  const shimmerTravelDistance = width + 180;
  const onEndReachedCalledDuringMomentumRef = React.useRef(false);
  const {
    canOpenUnitDetails,
    canUseLocationFilters,
    module,
    statusBoardEnabled,
    statusBoardTitle,
    statusBoardStageLabel,
    selectedStatusBucket,
    statusBoardCounts,
    zones,
    villages,
    search,
    zone,
    village,
    filterType,
    isFilterOptionsLoading,
    isFetchingMoreFilterOptions,
    hasMoreFilterOptions,
    filterTotalItems,
    zoneTotalItems,
    villageTotalItems,
    totalOmsCount,
    isTotalOmsCountLoading,
    zoneDisplayCount,
    villageDisplayCount,
    subprocessFilterOptions,
    statusFilterOptions,
    selectedSubprocessLabel,
    selectedSubprocessShortLabel,
    selectedStatusLabel,
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
    clearFilters,
    setSortBy,
    setSortOrder,
    openMap,
    openGallery,
    getActiveFilterValue,
    applyFilter,
    refreshUnits,
    loadNextPage,
    handleEmptyAction,
    openUnitDetails,
    getCardProcesses,
    openProcess,
    canDownloadCertificate,
    downloadCertificate,
    handleBack,
  } = useUnitListViewModel(navigation, route);

  const canShowSortControl = shouldUseOmsApi && !isOfflineOmsList;
  const canShowWorkflowFilters = shouldUseOmsApi && !isOfflineOmsList;
  const canShowStatusBoard = statusBoardEnabled && !isOfflineOmsList;
  const canShowStatusInfo = !isOfflineOmsList;
  const sortByLabel =
    SORT_BY_OPTIONS.find((item) => item.key === sortBy)?.label || "";
  const sortOrderLabel =
    SORT_ORDER_OPTIONS.find((item) => item.key === sortOrder)?.label || "";
  const sortSummaryLabel = sortByLabel && sortOrderLabel
    ? `${sortByLabel} • ${sortOrderLabel}`
    : sortByLabel || sortOrderLabel || "Select one";

  const openSortSheet = React.useCallback(() => {
    setDraftSortBy(sortBy || "");
    setDraftSortOrder(sortOrder || "");
    setShowSortSheet(true);
  }, [sortBy, sortOrder]);

  const closeSortSheet = React.useCallback(() => {
    setShowSortSheet(false);
  }, []);

  const resetDraftSort = React.useCallback(() => {
    setDraftSortBy("");
    setDraftSortOrder("");
  }, []);

  const applyDraftSort = React.useCallback(() => {
    setSortBy(draftSortBy);
    setSortOrder(draftSortOrder);
    setShowSortSheet(false);
  }, [draftSortBy, draftSortOrder, setSortBy, setSortOrder]);

  React.useEffect(() => {
    shimmerTranslateX.setValue(0);

    const animation = Animated.loop(
      Animated.timing(shimmerTranslateX, {
        toValue: shimmerTravelDistance,
        duration: SHIMMER_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmerTranslateX, shimmerTravelDistance]);

  const ShimmerBlock = ({ style }) => (
    <View style={[styles.shimmerBlock, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmerSweep,
          {
            transform: [{ translateX: shimmerTranslateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.78)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );

  const SkeletonProcessTile = () => (
    <View style={styles.skeletonProcessTile}>
      <View style={styles.skeletonProcessMain}>
        <ShimmerBlock style={styles.skeletonProcessDot} />
        <ShimmerBlock style={styles.skeletonProcessLabel} />
      </View>
      <ShimmerBlock style={styles.skeletonProcessArrow} />
    </View>
  );

  const SkeletonUnitCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.unitInfoBlock}>
          <ShimmerBlock style={styles.skeletonUnitNo} />

          <View style={styles.locationRow}>
            <ShimmerBlock style={styles.skeletonMetaChip} />
            <View style={styles.locationDivider} />
            <ShimmerBlock style={styles.skeletonMetaChip} />
          </View>
        </View>

        <View style={styles.cardActionsRow}>
          <ShimmerBlock style={styles.skeletonRoundAction} />
          <ShimmerBlock style={styles.skeletonDirectionAction} />
        </View>
      </View>

      <View style={styles.processSection}>
        <View style={styles.processGrid}>
          {[1, 2, 3, 4, 5].map((item, index, items) => (
            <View
              key={item}
              style={[
                styles.skeletonProcessTileWrap,
                items.length % 2 === 1 && index === items.length - 1
                  ? styles.processTileWide
                  : null,
              ]}
            >
              <SkeletonProcessTile />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const UnitListSkeleton = ({ count = 3, compact = false }) => (
    <View style={compact ? styles.footerSkeletonList : styles.skeletonList}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonUnitCard key={`skeleton-${index}`} />
      ))}
    </View>
  );

  const renderCard = ({ item }) => {
    if (isOfflineOmsList) {
      const processCards = getCardProcesses(item);

      return (
        <TouchableOpacity
          style={[styles.card, !canOpenUnitDetails && styles.cardDisabled]}
          activeOpacity={canOpenUnitDetails ? 0.9 : 1}
          onPress={() => openUnitDetails(item)}
          disabled={!canOpenUnitDetails}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.unitInfoBlock}>
              <Text style={styles.unitNo}>{formatUnitNo(item.unitNo, module)}</Text>
            </View>
          </View>

          <View style={styles.processSection}>
            <View style={styles.processGrid}>
              {processCards.map((process, index) => (
                <ProcessTile
                  key={process.key}
                  process={process}
                  isWide={
                    shouldUseWideProcessTile(
                      process,
                      processCards.length % 2 === 1 &&
                        index === processCards.length - 1
                    )
                  }
                  isOffline={isOfflineOmsList}
                  onPress={() => openProcess(item, process)}
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    const processCards = getCardProcesses(item);
    const showCertificate = canDownloadCertificate(item);

    return (
      <TouchableOpacity
        style={[styles.card, !canOpenUnitDetails && styles.cardDisabled]}
        activeOpacity={canOpenUnitDetails ? 0.9 : 1}
        onPress={() => openUnitDetails(item)}
        disabled={!canOpenUnitDetails}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.unitInfoBlock}>
            <Text style={styles.unitNo}>{formatUnitNo(item?.unitNo, module)}</Text>

            <View style={styles.locationRow}>
              <InlineMeta icon={Icons.zone} value={item?.zone} />
              <View style={styles.locationDivider} />
              <InlineMeta
                icon={Icons.village}
                value={item?.village}
              />
            </View>
          </View>

          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={styles.galleryBtn}
              onPress={() => openGallery(item)}
            >
              <Icons.gallery height={16} width={16} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.directionBtn}
              onPress={() => openMap(item.latitude, item.longitude)}
            >
              <Icons.googleIcon width={14} height={14} />
              <Text style={styles.directionText}>Direction</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.processSection}>
          <View style={styles.processGrid}>
            {processCards.map((process, index) => (
              <ProcessTile
                key={process.key}
                process={process}
                isWide={shouldUseWideProcessTile(
                  process,
                  processCards.length % 2 === 1 &&
                    index === processCards.length - 1
                )}
                onPress={() => openProcess(item, process)}
              />
            ))}
          </View>
        </View>

        {showCertificate ? (
          <TouchableOpacity
            style={styles.certificateButton}
            onPress={() => downloadCertificate(item)}
          >
            <Text style={styles.certificateButtonText}>Download Certificate</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    isInitialLoading ? (
      <UnitListSkeleton count={3} />
    ) : (
      <View style={styles.emptyWrapper}>
        <View style={styles.emptyIconWrap}>
          <Icons.down width={16} height={16} />
        </View>

        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>

        {(hasActiveFilters || emptyActionLabel === "Retry") ? (
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={handleEmptyAction}
          >
            <Text style={styles.emptyActionText}>{emptyActionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    )
  );

  const renderListFooter = () => {
    if (isFetchingMore) {
      return <UnitListSkeleton count={1} compact />;
    }

    return null;
  };

  const FilterButton = ({
    title,
    label,
    totalCount = 0,
    active,
    disabled,
    onPress,
    icon: FilterIcon,
    paperIcon,
  }) => {
    const displayLabel = Number.isFinite(totalCount)
      ? `${label}`
      : label;

    return (
      <TouchableOpacity
        style={[
          styles.filterBtn,
          active && styles.filterBtnActive,
          disabled && styles.filterBtnDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <View style={styles.filterLeftSection}>
          <View
            style={[
              styles.filterIconWrap,
              active && styles.filterIconWrapActive,
              disabled && styles.filterIconWrapDisabled,
            ]}
          >
            {paperIcon ? (
              <Icon
                source={paperIcon}
                size={16}
                color={
                  active
                    ? colors.white
                    : disabled
                      ? colors.textSecondary
                      : colors.primaryBlue
                }
              />
            ) : FilterIcon ? (
              <FilterIcon width={14} height={14} />
            ) : null}
          </View>
          

          <View style={styles.filterTextBlock}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <Text
              style={styles.filterTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {title}
            </Text>
             <View style={styles.filterArrowWrap}>
          <Icons.down width={10} height={10} />
        </View>
            </View>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <Text
                style={[styles.filterValue, active && styles.filterValueActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                ellipsizeMode="tail"
              >
                {displayLabel}
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  color: active ? colors.primaryBlue : "#666",
                  marginLeft: 4,
                  marginRight:10,
                }}
              >
                {totalCount > 0 ? `(${totalCount})` : null}
              </Text>

            </View>
          </View>
        </View>

        {/* <View style={styles.filterArrowWrap}>
          <Icons.down width={10} height={10} />
        </View> */}
      </TouchableOpacity>
    );
  };

  const CompactMeta = ({ label, value }) => (
    <View style={styles.compactMeta}>
      <Text style={styles.compactMetaLabel}>{label}</Text>
      <Text style={styles.compactMetaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );

  const SortActionButton = () => (
    <TouchableOpacity
      style={[
        styles.sortActionButton,
        hasActiveSort && styles.sortActionButtonActive,
      ]}
      onPress={openSortSheet}
      activeOpacity={0.88}
    >
      <View
        style={[
          styles.sortActionIconWrap,
          hasActiveSort && styles.sortActionIconWrapActive,
        ]}
      >
        <Icon
          source={
            !hasActiveSort
              ? "sort"
              : sortOrder === "desc"
                ? "sort-descending"
                : "sort-ascending"
          }
          size={16}
          color={hasActiveSort ? colors.white : colors.primaryBlue}
        />
      </View>
      <View style={styles.sortActionTextBlock}>
        <Text style={styles.sortActionTitle}>Sort By</Text>
        <Text
          style={[
            styles.sortActionValue,
            hasActiveSort && styles.sortActionValueActive,
          ]}
          numberOfLines={1}
        >
          {sortSummaryLabel}
        </Text>
      </View>
      <View style={styles.sortChevronWrap}>
        <Icons.down width={10} height={10} />
      </View>
    </TouchableOpacity>
  );

  const TotalOmsCount = () => (
    <View style={styles.sortOmsCountBox}>
      <Text style={styles.sortOmsCountLabel}>Total OMS</Text>
      <Text style={styles.sortOmsCountValue}>
        {isTotalOmsCountLoading ? "..." : totalOmsCount}
      </Text>
    </View>
  );

  const filterLabel =
    filterType === "zone"
      ? "Zone"
      : filterType === "village"
        ? "Village"
        : filterType === "subprocess"
          ? "Sub Process"
          : "Status";
  const filterOptions =
    filterType === "zone"
      ? ["All", ...zones]
      : filterType === "village"
        ? ["All", ...villages]
        : filterType === "subprocess"
          ? ["All", ...subprocessFilterOptions.map((item) => item.label)]
          : ["All", ...statusFilterOptions.map((item) => item.label)];
  const filterSubtitle =
    filterType === "zone"
      ? "Choose any zone to refine the unit results."
      : filterType === "village"
        ? "Choose any village to refine the unit results."
        : filterType === "subprocess"
          ? "Choose a subprocess to filter the online OMS list."
          : "Choose a status bucket to filter the online OMS list.";
  const isLocationFilterType =
    filterType === "zone" || filterType === "village";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerActionSlot}>
          <IconButton icon="arrow-left" onPress={handleBack} />
        </View>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            {canShowStatusBoard ? statusBoardTitle : `${module} Units`}
          </Text>
        </View>
        <View style={styles.headerActionSlot}>
          {canShowStatusInfo ? (
            <IconButton
              icon="information-outline"
              iconColor={colors.primaryBlue}
              size={22}
              style={styles.headerInfoButton}
              onPress={() => setShowStatusInfo(true)}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Icons.search
          width={22}
          height={22}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder={`Search ${module} No...`}
          placeholderTextColor="#999"
          style={styles.searchInput}
          onChangeText={setSearch}
          value={search}
        />
      </View>

      {canUseLocationFilters || canShowWorkflowFilters || canShowSortControl ? (
        <View style={styles.filterPanel}>
          <View style={styles.filterPanelHeader}>
            <View style={styles.filterPanelTitleWrap}>
              <CompactMeta label="Showing" value={locationSummary} />
            </View>

            <View style={styles.filterPanelActions}>
              {(hasActiveFilters || hasActiveSort) ? (
                <TouchableOpacity
                  style={styles.filterResetButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.filterResetText}>Reset</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
            style={styles.filterScroll}
          >
            {canUseLocationFilters ? (
              <>
                <FilterButton
                  title="Zone"
                  label={zone}
                  totalCount={zoneDisplayCount}
                  icon={Icons.zone}
                  active={zone !== "All"}
                  onPress={() => openFilterSheet("zone")}
                />

                <FilterButton
                  title="Village"
                  label={village}
                  totalCount={villageDisplayCount}
                  icon={Icons.village}
                  active={village !== "All"}
                  onPress={() => openFilterSheet("village")}
                />
              </>
            ) : null}

            {canShowWorkflowFilters ? (
              <>
                <FilterButton
                  title="Sub Process"
                  label={selectedSubprocessShortLabel}
                  paperIcon="timeline-text-outline"
                  active={selectedSubprocessLabel !== "All"}
                  onPress={() => openFilterSheet("subprocess")}
                />

                <FilterButton
                  title="Status"
                  label={selectedStatusLabel}
                  paperIcon="checkbox-marked-circle-outline"
                  active={selectedStatusLabel !== "All"}
                  onPress={() => openFilterSheet("status")}
                />
              </>
            ) : null}
          </ScrollView>

          {canShowSortControl ? (
            <View style={styles.sortActionRow}>
              <SortActionButton />
              <TotalOmsCount />
            </View>
          ) : null}
        </View>
      ) : null}

      {canShowStatusBoard ? (
        <View style={styles.statusBoardPanel}>
          <Text style={styles.statusBoardTitle}>
            {statusBoardStageLabel === "All"
              ? "Overall Status"
              : `${statusBoardStageLabel} Status`}
          </Text>
          <View style={styles.statusBoardChipRow}>
            {["Approved", "Requested", "Pending", "Rejected"].map((item) => {
              const isActive = selectedStatusBucket === item;
              const count = Number(statusBoardCounts?.[item] || 0);

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.statusBoardChip,
                    isActive && styles.statusBoardChipActive,
                  ]}
                  onPress={() => setSelectedStatusBucket(item)}
                  activeOpacity={0.86}
                >
                  <Text
                    style={[
                      styles.statusBoardChipText,
                      isActive && styles.statusBoardChipTextActive,
                    ]}
                  >
                    {item} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <FlatList
        data={filteredData}
        keyExtractor={(item, index) =>
          String(item?.id || item?.unitNo || item?.nodeName || index)
        }
        renderItem={renderCard}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderListFooter}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentumRef.current = false;
        }}
        onScrollBeginDrag={() => {
          onEndReachedCalledDuringMomentumRef.current = false;
        }}
        onEndReached={() => {
          if (onEndReachedCalledDuringMomentumRef.current) {
            return;
          }

          onEndReachedCalledDuringMomentumRef.current = true;
          void loadNextPage();
        }}
        onEndReachedThreshold={0.2}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          shouldUseOmsApi ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshUnits}
              tintColor={colors.primaryBlue}
              colors={[colors.primaryBlue]}
            />
          ) : undefined
        }
        contentContainerStyle={[
          styles.listContent,
          filteredData.length === 0 &&
          !isInitialLoading &&
          styles.listEmptyContent,
        ]}
      />

      {filterType ? (
        <SearchableFilterModal
          visible={!!filterType}
          title={`Select ${filterLabel}`}
          subtitle={filterSubtitle}
          totalItems={isLocationFilterType ? filterTotalItems : null}
          options={filterOptions}
          isLoading={isLocationFilterType ? isFilterOptionsLoading : false}
          isFetchingMore={isLocationFilterType ? isFetchingMoreFilterOptions : false}
          hasMoreOptions={isLocationFilterType ? hasMoreFilterOptions : false}
          selectedValue={getActiveFilterValue()}
          onSelect={applyFilter}
          onClose={closeFilterSheet}
          onEndReached={isLocationFilterType ? loadMoreFilterOptions : undefined}
          searchQuery={locationFilterSearchQuery}
          onSearchQueryChange={setLocationFilterSearchQuery}
          searchPlaceholder={`Search ${filterLabel.toLowerCase()}`}
          emptyMessage={`No ${filterLabel.toLowerCase()} found.`}
        />
      ) : null}

      <Modal
        visible={showSortSheet}
        transparent
        animationType="fade"
        onRequestClose={closeSortSheet}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalCard}>
            <View style={styles.sortModalHandle} />
            <View style={styles.sortModalHeader}>
              <View style={styles.sortModalHeaderText}>
                <Text style={styles.modalTitle}>Sort OMS List</Text>
                <Text style={styles.sortModalSubtitle}>
                  Choose how online OMS units should be ordered.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sortModalTopCloseButton}
                onPress={closeSortSheet}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Close sort options"
              >
                <Icon source="close" size={18} color={colors.primaryBlue} />
              </TouchableOpacity>
            </View>

            <View style={styles.sortSection}>
              <Text style={styles.sortSectionTitle}>Sort By</Text>
              <View style={styles.sortChipRow}>
                {SORT_BY_OPTIONS.map((option) => {
                  const isActive = draftSortBy === option.key;

                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.sortChip,
                        isActive && styles.sortChipActive,
                      ]}
                      onPress={() => setDraftSortBy(option.key)}
                      activeOpacity={0.88}
                    >
                      <Text
                        style={[
                          styles.sortChipText,
                          isActive && styles.sortChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.sortSection}>
              <Text style={styles.sortSectionTitle}>Order</Text>
              <View style={styles.sortChipRow}>
                {SORT_ORDER_OPTIONS.map((option) => {
                  const isActive = draftSortOrder === option.key;

                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.sortChip,
                        isActive && styles.sortChipActive,
                      ]}
                      onPress={() => setDraftSortOrder(option.key)}
                      activeOpacity={0.88}
                    >
                      <Text
                        style={[
                          styles.sortChipText,
                          isActive && styles.sortChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.sortModalFooter}>
              <TouchableOpacity
                style={styles.sortModalResetButton}
                onPress={resetDraftSort}
                activeOpacity={0.88}
              >
                <Text style={styles.sortModalResetText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortModalCloseButton}
                onPress={applyDraftSort}
                activeOpacity={0.88}
              >
                <Text style={styles.sortModalCloseText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showStatusInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalCard}>
            <Text style={styles.modalTitle}>Process Indicator Info</Text>
            <Text style={styles.infoModalSubtitle}>
              Color meaning used in {module} process cards.
            </Text>

            <View style={styles.legendList}>
              <LegendItem
                color={getUnitStatusPalette("Completed").solid}
                title="Completed"
                subtitle="The process is fully finished."
              />
              <LegendItem
                color={getUnitStatusPalette("Approved").solid}
                title="Approved"
                subtitle="The process has been approved after review."
              />
              <LegendItem
                color={getUnitStatusPalette("Verified").solid}
                title="Verified"
                subtitle="The process has been verified."
              />
              <LegendItem
                color={getUnitStatusPalette("Pending").solid}
                title="Pending"
                subtitle="The process has not started yet."
              />
              <LegendItem
                color={getUnitStatusPalette("To be Confirm").solid}
                title="To be Confirmed"
                subtitle="Work requires confirmation before proceeding."
              />
              <LegendItem
                color={getUnitStatusPalette("Submitted").solid}
                title="Submitted"
                subtitle="Work has been submitted for review."
              />
              <LegendItem
                color={getUnitStatusPalette("Partial").solid}
                title="Partial"
                subtitle="The process is underway but still has remaining steps."
              />
              <LegendItem
                color={getUnitStatusPalette("Commented").solid}
                title="Commented"
                subtitle="Work was reviewed with comments or sent back for correction."
              />
              <LegendItem
                color={getUnitStatusPalette("Info").solid}
                title="Info"
                subtitle="Additional information is available for the process."
              />
            </View>

            <TouchableOpacity
              style={styles.infoModalCloseButton}
              onPress={() => setShowStatusInfo(false)}
            >
              <Text style={styles.infoModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default UnitListScreen;

const getStatusColor = (value) => {
  return getUnitStatusColor(value);
};

const ProcessTile = ({ process, isWide, onPress, isOffline = false }) => {
  const statusColor = getStatusColor(process.value);
  const statusText = process.progressLabel
    ? process.value
      ? `${process.value} • ${process.progressLabel}`
      : process.progressLabel
    : process.value;
  const displayStatusText = isOffline ? "" : statusText;
  const accessibilityLabel = displayStatusText
    ? `${process.label}, ${displayStatusText}`
    : process.label;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.processTile,
        isWide && styles.processTileWide,
        isOffline
          ? styles.processTileOffline
          : {
            backgroundColor: `${statusColor}12`,
            borderColor: `${statusColor}26`,
          },
      ]}
    >
      {isOffline ? (
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(41, 85, 152, 0.28)",
            "rgba(22, 58, 112, 0.08)",
            "rgba(12, 34, 70, 0.24)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.processTileOfflineGradient}
        />
      ) : null}

      <View style={styles.processTileMain}>
        <View style={styles.processTileMeta}>
          {!isOffline ? (
            <View
              style={[
                styles.processStatusDot,
                { backgroundColor: statusColor },
              ]}
            />
          ) : null}
          <Text
            style={[styles.processLabel, isOffline && styles.processLabelOffline]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            ellipsizeMode="tail"
          >
            {process.label}
          </Text>
        </View>

        {displayStatusText ? (
          <Text
            style={[
              styles.processValue,
              { color: isOffline ? "rgba(255, 255, 255, 0.9)" : statusColor },
            ]}
            numberOfLines={1}
          >
            {displayStatusText}
          </Text>
        ) : null}
      </View>

      <View style={styles.processTileRight}>
        <View
          style={[
            styles.processArrowWrap,
            isOffline
              ? styles.processArrowWrapOffline
              : { backgroundColor: `${statusColor}18` },
          ]}
        >
          <Icon
            source="chevron-right"
            size={16}
            color={isOffline ? "#163A70" : statusColor}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const InlineMeta = ({ icon: MetaIcon, value }) => (
  <View style={styles.inlineMeta}>
    <View style={styles.inlineMetaIcon}>
      {MetaIcon ? <MetaIcon width={12} height={12} /> : null}
    </View>
    <Text style={styles.inlineMetaValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const LegendItem = ({ color, title, subtitle }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendSwatch, { backgroundColor: color }]} />
    <View style={styles.legendTextWrap}>
      <Text style={styles.legendTitle}>{title}</Text>
      <Text style={styles.legendSubtitle}>{subtitle}</Text>
    </View>
  </View>
);
