import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "react-native-paper";
import styles from "./styles";
import { ROUTES } from "../../navigation/routes";
import { MODULE_STATUS_SECTIONS } from "../../constants/moduleStatusConfig";
import colors from "../../constants/colors";
import { Icons } from "../../constants/icons";

const ModuleDetailsScreen = ({ navigation, route }) => {
  const module = route?.params?.module || "OMS";
  const unit = route?.params?.unit || {};
  const projectName = route?.params?.projectName || "Kayampur Sitamau P.M.I.P";

  const detailItems = [
    { label: "Unit Number", value: unit.unitNo || `${module}-001` },
    { label: "Village", value: unit.village || "Village-A" },
    { label: "Area", value: unit.area || "30 ha" },
    { label: "Chak Area", value: unit.chakArea || "30 ha" },
  ];

  const openSection = (section) => {
    navigation.navigate(ROUTES.ROOT.UNIT_STATUS_UPDATE, {
      module,
      unit,
      projectName,
      sectionKey: section.key,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Unit Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.projectCard}>
          <Text style={styles.projectLabel}>Project Name</Text>
          <Text style={styles.projectName}>{projectName}</Text>
        </View>

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeading}>Unit Details</Text>
          <TouchableOpacity
            style={styles.helperButton}
            onPress={() => Alert.alert("Helper", "Support videos and photos will be added here.")}
          >
            <IconButton icon="eye-outline" size={18} iconColor={colors.primaryBlue} />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsGrid}>
          {detailItems.map((item) => (
            <View style={styles.detailCard} key={item.label}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statusListHeader}>
          <Text style={styles.statusListTitle}>Update Status</Text>
          <Text style={styles.statusListSubtitle}>Select one section and update sub-options.</Text>
        </View>

        {MODULE_STATUS_SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.key}
            style={styles.statusCard}
            activeOpacity={0.9}
            onPress={() => openSection(section)}
          >
            <View style={styles.statusCardHead}>
              <Text style={styles.statusCardTitle}>{section.title}</Text>
              <Icons.down width={14} height={14} />
            </View>
            <Text style={styles.statusCardDescription}>{section.description}</Text>
            <View style={styles.chipsRow}>
              {section.subOptions.map((sub) => (
                <View key={sub.id} style={styles.subChip}>
                  <Text style={styles.subChipText}>{sub.label}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ModuleDetailsScreen;
