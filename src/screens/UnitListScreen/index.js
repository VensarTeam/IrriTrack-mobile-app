import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../constants/colors";
import { Icons } from "../../constants/icons";
import { ROUTES } from "../../navigation/routes";

const zones = Array.from({ length: 21 }, (_, i) => `Zone-${i + 1}`);
const distributors = ["Minor", "Sub Minor"];
const villages = ["Village-A", "Village-B", "Village-C", "Village-D"];

const UnitListScreen = ({ navigation, route }) => {
  const module = route?.params?.module || "OMS";

  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("All");
  const [distributor, setDistributor] = useState("All");
  const [village, setVillage] = useState("All");
  const [filterType, setFilterType] = useState(null);

  const data = [
    {
      id: "1",
      unitNo: `${module}-001`,
      zone: "Zone-1",
      distributor: "Sub Minor",
      village: "Village-A",
      latitude: 23.18,
      longitude: 75.78,
      inlet: "Completed",
      outlet: "Pending",
      mechanical: "Partial",
      controller: "Completed",
      dry: "Completed",
      wet: "Pending",
    },
    {
      id: "2",
      unitNo: `${module}-002`,
      zone: "Zone-2",
      distributor: "Minor",
      village: "Village-B",
      latitude: 23.19,
      longitude: 75.77,
      inlet: "Completed",
      outlet: "Completed",
      mechanical: "Completed",
      controller: "Pending",
      dry: "Partial",
      wet: "Pending",
    },
  ];

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return (
        item.unitNo.toLowerCase().includes(search.toLowerCase()) &&
        (zone === "All" || item.zone === zone) &&
        (distributor === "All" || item.distributor === distributor) &&
        (village === "All" || item.village === village)
      );
    });
  }, [search, zone, distributor, village]);

  const hasActiveFilters =
    !!search.trim() || zone !== "All" || distributor !== "All" || village !== "All";

  const openMap = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
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

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate(ROUTES.ROOT.UNIT_DETAILS, {
          module,
          unit: item,
          projectName: "Kayampur Sitamau P.M.I.P",
        })
      }
    >
      <View style={styles.cardTopRow}>
        <View style={styles.unitInfoBlock}>
          <View style={styles.unitBadge}>
            <Text style={styles.unitBadgeText}>{module}</Text>
          </View>
          <Text style={styles.unitNo}>{item.unitNo}</Text>
        </View>

        <TouchableOpacity
          style={styles.directionBtn}
          onPress={() => openMap(item.latitude, item.longitude)}
        >
          <Icons.direction width={14} height={14} />
          <Text style={styles.directionText}>Direction</Text>
        </TouchableOpacity>
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

  const FilterButton = ({ title, label, active, onPress }) => {
    return (
      <TouchableOpacity
        style={[styles.filterBtn, active && styles.filterBtnActive]}
        onPress={onPress}
      >
        <View style={styles.filterTextBlock}>
          <Text style={styles.filterTitle}>{title}</Text>
          <Text
            style={[styles.filterValue, active && styles.filterValueActive]}
            numberOfLines={1}
          >
            {label}
          </Text>
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
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{module} Units</Text>
        <View style={{ width: 40 }} />
      </View>

      <TextInput
        placeholder={`Search ${module} No...`}
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      <View style={styles.filterContainer}>
        <FilterButton
          title="Zone"
          label={zone}
          active={zone !== "All"}
          onPress={() => setFilterType("zone")}
        />

        <FilterButton
          title="Distributor"
          label={distributor}
          active={distributor !== "All"}
          onPress={() => setFilterType("distributor")}
        />

        <FilterButton
          title="Village"
          label={village}
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
