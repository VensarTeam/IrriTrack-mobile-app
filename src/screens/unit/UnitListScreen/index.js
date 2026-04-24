import React from "react";
import {
  Animated,
  Easing,
  View,
  Text,
  FlatList,
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

const SHIMMER_DURATION = 1150;
const { width } = Dimensions.get("window");

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

const UnitListScreen = ({ navigation, route }) => {
  const [showStatusInfo, setShowStatusInfo] = React.useState(false);
  const shimmerTranslateX = React.useRef(new Animated.Value(0)).current;
  const shimmerTravelDistance = width + 180;
  const onEndReachedCalledDuringMomentumRef = React.useRef(false);
  const {
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
    setFilterType,
    setLocationFilterSearchQuery,
    loadMoreFilterOptions,
    filteredData,
    hasActiveFilters,
    locationSummary,
    clearFilters,
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
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => openUnitDetails(item)}
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
                    processCards.length % 2 === 1 &&
                    index === processCards.length - 1
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
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => openUnitDetails(item)}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.unitInfoBlock}>
            <Text style={styles.unitNo}>{formatUnitNo(item.unitNo, module)}</Text>

            <View style={styles.locationRow}>
              <InlineMeta icon={Icons.zone} value={item.zone} />
              <View style={styles.locationDivider} />
              <InlineMeta
                icon={Icons.village}
                value={item.chakName || item.village || item.villageId}
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
                isWide={processCards.length % 2 === 1 && index === processCards.length - 1}
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
    active,
    disabled,
    onPress,
    icon: FilterIcon,
  }) => (
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
          {FilterIcon ? <FilterIcon width={14} height={14} /> : null}
        </View>

        <View style={styles.filterTextBlock}>
          <Text
            style={styles.filterTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {title}
          </Text>
          <Text
            style={[styles.filterValue, active && styles.filterValueActive]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
        </View>
      </View>

      <View style={styles.filterArrowWrap}>
        <Icons.down width={10} height={10} />
      </View>
    </TouchableOpacity>
  );

  const CompactMeta = ({ label, value }) => (
    <View style={styles.compactMeta}>
      <Text style={styles.compactMetaLabel}>{label}</Text>
      <Text style={styles.compactMetaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );

  const filterLabel = filterType === "zone" ? "Zone" : "Village";
  const filterOptions =
    filterType === "zone" ? ["All", ...zones] : ["All", ...villages];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerActionSlot}>
          <IconButton icon="arrow-left" onPress={handleBack} />
        </View>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{module} Units</Text>
        </View>
        <View style={styles.headerActionSlot}>
          <IconButton
            icon="eye-outline"
            iconColor={colors.primaryBlue}
            size={22}
            style={styles.headerInfoButton}
            onPress={() => setShowStatusInfo(true)}
          />
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

      {canUseLocationFilters ? (
        <View style={styles.filterPanel}>
          <View style={styles.filterPanelHeader}>
            <View style={styles.filterPanelTitleWrap}>
              <CompactMeta label="Showing" value={locationSummary} />
            </View>

            {hasActiveFilters ? (
              <TouchableOpacity
                style={styles.filterResetButton}
                onPress={clearFilters}
              >
                <Text style={styles.filterResetText}>Reset</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.filterContainer}>
            <FilterButton
              title="Zone"
              label={zone}
              icon={Icons.zone}
              active={zone !== "All"}
              onPress={() => setFilterType("zone")}
            />

            <FilterButton
              title="Village"
              label={village}
              icon={Icons.village}
              active={village !== "All"}
              onPress={() => setFilterType("village")}
            />
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

      {canUseLocationFilters ? (
        <SearchableFilterModal
          visible={!!filterType}
          title={filterType === "zone" ? "Select Zone" : "Select Village"}
          subtitle={
            filterType === "zone"
              ? "Choose any zone to refine the unit results."
              : "Choose any village to refine the unit results."
          }
          options={filterOptions}
          isLoading={isFilterOptionsLoading}
          isFetchingMore={isFetchingMoreFilterOptions}
          hasMoreOptions={hasMoreFilterOptions}
          selectedValue={getActiveFilterValue()}
          onSelect={applyFilter}
          onClose={() => setFilterType(null)}
          onEndReached={loadMoreFilterOptions}
          searchQuery={locationFilterSearchQuery}
          onSearchQueryChange={setLocationFilterSearchQuery}
          searchPlaceholder={`Search ${filterLabel.toLowerCase()}`}
          emptyMessage={`No ${filterLabel.toLowerCase()} found.`}
        />
      ) : null}

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
                color={colors.completed}
                title="Completed"
                subtitle="Every step in the process has been finished."
              />
              <LegendItem
                color={colors.pending}
                title="Pending"
                subtitle="The process has not started yet."
              />
              <LegendItem
                color={colors.partial}
                title="Partial Completed"
                subtitle="The process is underway but still has remaining steps."
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
  if (value === "Completed") return colors.completed;
  if (value === "Pending") return colors.pending;
  return colors.partial;
};

const ProcessTile = ({ process, isWide, onPress,isOffline=false }) => {
  const statusColor = getStatusColor(process.value);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${process.label}, ${process.value}`}
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
          <View
            style={[
              styles.processStatusDot,
              isOffline
                ? styles.processStatusDotOffline
                : { backgroundColor: statusColor },
            ]}
          />
          <Text
            style={[styles.processLabel, isOffline && styles.processLabelOffline]}
            numberOfLines={2}
          >
            {process.label}
          </Text>
        </View>
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
