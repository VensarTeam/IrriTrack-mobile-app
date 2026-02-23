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
import { IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../constants/colors";
import { Icons } from "../../constants/icons";
import useUnitListViewModel from "../../viewmodels/useUnitListViewModel";

const UnitListScreen = ({ navigation, route }) => {
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
    handleBack,
  } = useUnitListViewModel(navigation, route);

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => openUnitDetails(item)}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.unitInfoBlock}>
          <View style={styles.unitBadge}>
            <Text style={styles.unitBadgeText}>{module}</Text>
          </View>
          <Text style={styles.unitNo}>{item.unitNo}</Text>
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

      <View style={styles.metaRow}>
        <Meta label="Zone" value={item.zone} />
        <Meta label="Distributor" value={item.distributor} />
        <Meta label="Village" value={item.village} />
      </View>

      <View style={styles.statusGrid}>
        <Status label="Inlet" value={item.inlet} />
        <Status label="Outlet" value={item.outlet} />
        <Status label="Mechanical" value={item.mechanical} />
        <Status label="Controller" value={item.controller} />
        <Status label="Dry Comm." value={item.dry} />
        <Status label="Wet Comm." value={item.wet} />
      </View>
    </TouchableOpacity>
  );

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
  }) => {
    return (
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={handleBack} />
        <Text style={styles.headerTitle}>{module} Units</Text>
        <View style={{ width: 40 }} />
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
        />
      </View>
      {/* <TextInput
        placeholder={`Search ${module} No...`}
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      /> */}

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
    </SafeAreaView>
  );
};

export default UnitListScreen;

const getStatusColor = (value) => {
  if (value === "Completed") return colors.completed;
  if (value === "Pending") return colors.pending;
  return colors.partial;
};

const Status = ({ label, value }) => {
  const statusColor = getStatusColor(value);

  return (
    <View style={[styles.statusItem, { backgroundColor: `${statusColor}1A` }]}>
      <View style={styles.statusHeader}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.statusLabel}>{label}</Text>
      </View>
      <Text style={[styles.statusValue, { color: statusColor }]}>{value}</Text>
    </View>
  );
};

const Meta = ({ label, value }) => (
  <View style={styles.metaItem}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);
