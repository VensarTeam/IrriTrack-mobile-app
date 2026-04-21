import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../../constants/colors";
import { Icons } from "../../../constants/icons";
import useUnitListViewModel from "../../../viewmodels/useUnitListViewModel";

const UnitListScreen = ({ navigation, route }) => {
  const [showStatusInfo, setShowStatusInfo] = React.useState(false);
  const {
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
  } = useUnitListViewModel(navigation, route);

  const renderCard = ({ item }) => {
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
            <Text style={styles.unitNo}>{item.unitNo}</Text>

            <View style={styles.locationRow}>
              <InlineMeta icon={Icons.zone} value={item.zone} />
              <View style={styles.locationDivider} />
              <InlineMeta icon={Icons.village} value={item.village} />
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
    <View style={styles.emptyWrapper}>
      <View style={styles.emptyIconWrap}>
        <Icons.down width={16} height={16} />
      </View>

      <Text style={styles.emptyTitle}>No units found</Text>
      <Text style={styles.emptySubtitle}>
        No data matches your current search and filters.
      </Text>

      {hasActiveFilters ? (
        <TouchableOpacity style={styles.emptyActionBtn} onPress={clearFilters}>
          <Text style={styles.emptyActionText}>Clear Filters</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const FilterButton = ({
    title,
    label,
    active,
    onPress,
    icon: FilterIcon,
  }) => (
    <TouchableOpacity
      style={[styles.filterBtn, active && styles.filterBtnActive]}
      onPress={onPress}
    >
      <View style={styles.filterLeftSection}>
        <View
          style={[
            styles.filterIconWrap,
            active && styles.filterIconWrapActive,
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

      <View style={styles.filterContainer}>
        <FilterButton
          title="Zone"
          label={zone}
          icon={Icons.zone}
          active={zone !== "All"}
          onPress={() => setFilterType("zone")}
        />

        <FilterButton
          title="Distributor"
          label={distributor}
          icon={Icons.distributor}
          active={distributor !== "All"}
          onPress={() => setFilterType("distributor")}
        />

        <FilterButton
          title="Village"
          label={village}
          icon={Icons.village}
          active={village !== "All"}
          onPress={() => setFilterType("village")}
        />
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          filteredData.length === 0 && styles.listEmptyContent,
        ]}
      />

      <Modal visible={!!filterType} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select {filterType}</Text>

            <ScrollView>
              {(filterType === "zone"
                ? ["All", ...zones]
                : filterType === "distributor"
                  ? ["All", ...distributors]
                  : ["All", ...villages]
              ).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.modalItem,
                    item === getActiveFilterValue() && styles.modalItemActive,
                  ]}
                  onPress={() => applyFilter(item)}
                >
                  <Text
                    style={[
                      styles.modalText,
                      item === getActiveFilterValue() && styles.modalTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={() => setFilterType(null)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
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

const ProcessTile = ({ process, isWide, onPress }) => {
  const statusColor = getStatusColor(process.value);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${process.label}, ${process.value}, ${process.progressLabel}`}
      style={[
        styles.processTile,
        isWide && styles.processTileWide,
        {
          backgroundColor: `${statusColor}12`,
          borderColor: `${statusColor}26`,
        },
      ]}
    >
      <View style={styles.processTileMain}>
        <View style={styles.processTileMeta}>
          <View
            style={[
              styles.processStatusDot,
              { backgroundColor: statusColor },
            ]}
          />
          <Text style={styles.processLabel} numberOfLines={2}>
            {process.label}
          </Text>
        </View>
      </View>

      <View style={styles.processTileRight}>
        <View
          style={[
            styles.processProgressBadge,
            { backgroundColor: `${statusColor}18` },
          ]}
        >
          <Text
            style={[styles.processProgressText, { color: statusColor }]}
            numberOfLines={1}
          >
            {process.progressLabel}
          </Text>
        </View>

        <View
          style={[
            styles.processArrowWrap,
            { backgroundColor: `${statusColor}18` },
          ]}
        >
          <Icon source="chevron-right" size={16} color={statusColor} />
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
