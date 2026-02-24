import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../../constants/colors";
import { Icons } from "../../../constants/icons";
import { moderateScale } from "../../../constants/metrics";
import useUnitDetailsViewModel from "../../../viewmodels/useUnitDetailsViewModel";

const getStatusColor = (value) => {
  if (value === "Completed" || value === "Updated") return colors.completed;
  if (value === "Partially Completed" || value === "Partial") return colors.partial;
  return colors.pending;
};

const ModuleDetailsScreen = ({ navigation, route }) => {
  const {
    projectName,
    detailItems,
    sections,
    openHelper,
    handleBack,
    openViewAll,
    toggleSection,
    isSectionExpanded,
    updatePicker,
    openUpdatePicker,
    closeUpdatePicker,
    selectUpdateOption,
    openSubStatus,
    getUpdateOptions,
    getSectionSubStatuses,
  } = useUnitDetailsViewModel(navigation, route);

  const updateOptions = getUpdateOptions();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={handleBack} />
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
          <TouchableOpacity style={styles.helperButton} onPress={openHelper}>
            <Icons.support height={22} width={22} />
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
          <View>
            <Text style={styles.statusListTitle}>Update Status</Text>
            <Text style={styles.statusListSubtitle}>
              View all statuses on the summary page.
            </Text>
          </View>
          <TouchableOpacity style={styles.viewAllButton} onPress={openViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {sections.map((section) => {
          const expanded = isSectionExpanded(section.key);
          const subStatuses = getSectionSubStatuses(section);

          return (
            <View key={section.key} style={styles.statusCard}>
              <View style={styles.statusCardHead}>
                <TouchableOpacity
                  style={styles.sectionToggleButton}
                  activeOpacity={0.85}
                  onPress={() => toggleSection(section.key)}
                >
                  <Text style={styles.statusCardTitle}>{section.title}</Text>
                  <View
                    style={[
                      styles.chevronWrap,
                      expanded && styles.chevronWrapExpanded,
                    ]}
                  >
                    <Icons.down width={12} height={12} style={{ marginLeft: moderateScale(6) }} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={() => openUpdatePicker(section)}
                >
                  <Text style={styles.updateButtonText}>Update</Text>
                  <Icons.down width={10} height={10} style={{ marginLeft: moderateScale(6) }} />
                </TouchableOpacity>
              </View>

              <Text style={styles.statusCardDescription}>{section.description}</Text>

              {expanded ? (
                <View style={styles.subStatusList}>
                  {subStatuses.map((subStatus, index) => {
                    const statusColor = getStatusColor(subStatus.status);

                    return (
                      <TouchableOpacity
                        key={subStatus.id}
                        style={[
                          styles.subStatusItem,
                          index === subStatuses.length - 1 && styles.subStatusItemLast,
                        ]}
                        activeOpacity={0.85}
                        onPress={() => openSubStatus(section, subStatus)}
                      >
                        <Text style={styles.subStatusLabel}>{subStatus.displayLabel}</Text>
                        <View
                          style={[
                            styles.statusPill,
                            { backgroundColor: `${statusColor}20` },
                          ]}
                        >
                          <Text style={[styles.statusPillText, { color: statusColor }]}>
                            {subStatus.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={updatePicker.visible}
        transparent
        animationType="fade"
        onRequestClose={closeUpdatePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Update {updatePicker.section?.title || "Status"}
            </Text>

            <ScrollView>
              {updateOptions.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.modalItem}
                  onPress={() => selectUpdateOption(sub)}
                >
                  <Text style={styles.modalText}>{sub.displayLabel}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={closeUpdatePicker}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ModuleDetailsScreen;
