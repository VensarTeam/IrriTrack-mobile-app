import React, { useState, useMemo } from "react";
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
import { Icon } from "react-native-paper";

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

  /* ================= DUMMY DATA ================= */

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

  /* ================= FILTER LOGIC ================= */

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

  /* ================= MAP ================= */

  const openMap = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  /* ================= CARD ================= */

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.unitNo}>{item.unitNo}</Text>

        <TouchableOpacity
          style={styles.directionBtn}
          onPress={() => openMap(item.latitude, item.longitude)}
        >
          <Text style={styles.directionText}>Direction</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusGrid}>
        <Status label="Inlet" value={item.inlet} />
        <Status label="Outlet" value={item.outlet} />
        <Status label="Mechanical" value={item.mechanical} />
        <Status label="Controller" value={item.controller} />
        <Status label="Dry Comm." value={item.dry} />
        <Status label="Wet Comm." value={item.wet} />
      </View>

      <View style={styles.metaRow}>
        <Meta label="Zone" value={item.zone} />
        <Meta label="Distributor" value={item.distributor} />
        <Meta label="Village" value={item.village} />
      </View>
    </View>
  );

  const FilterButton = ({ icon, label, active, onPress }) => {
    return (
      <TouchableOpacity
        style={[styles.filterBtn, active && styles.filterBtnActive]}
        onPress={onPress}
      >
        <Icon
          source={icon}
          size={18}
          color={active ? colors.white : colors.primaryBlue}
        />
        <Text
          style={[styles.filterText, active && styles.filterTextActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{module} Units</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* SEARCH */}
      <TextInput
        placeholder={`Search ${module} No...`}
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      {/* FILTER CHIPS */}
      <View style={styles.filterContainer}>
        <FilterButton
          icon="map-marker-outline"
          label={zone}
          active={zone !== "All"}
          onPress={() => setFilterType("zone")}
        />

        <FilterButton
          icon="domain"
          label={distributor}
          active={distributor !== "All"}
          onPress={() => setFilterType("distributor")}
        />

        <FilterButton
          icon="home-city-outline"
          label={village}
          active={village !== "All"}
          onPress={() => setFilterType("village")}
        />
      </View>

      {/* LIST */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* FILTER MODAL */}
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
                  style={styles.modalItem}
                  onPress={() => {
                    if (filterType === "zone") setZone(item);
                    if (filterType === "distributor") setDistributor(item);
                    if (filterType === "village") setVillage(item);
                    setFilterType(null);
                  }}
                >
                  <Text style={styles.modalText}>{item}</Text>
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

/* ================= SUB COMPONENTS ================= */

const Status = ({ label, value }) => {
  const getColor = () => {
    if (value === "Completed") return colors.completed;
    if (value === "Pending") return colors.pending;
    return colors.partial;
  };

  return (
    <View style={styles.statusItem}>
      <View style={[styles.statusDot, { backgroundColor: getColor() }]} />
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
};

const Meta = ({ label, value }) => (
  <View style={styles.metaItem}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

const FilterChip = ({ label, onPress }) => (
  <TouchableOpacity style={styles.filterChip} onPress={onPress}>
    <Text style={styles.filterChipText}>{label}</Text>
  </TouchableOpacity>
);
