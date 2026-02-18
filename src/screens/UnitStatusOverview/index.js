import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../constants/colors";
import useUnitStatusOverviewViewModel from "../../viewmodels/useUnitStatusOverviewViewModel";

const getStatusColor = (value) => {
  if (value === "Completed" || value === "Updated") return colors.completed;
  if (value === "Partially Completed" || value === "Partial") return colors.partial;
  return colors.pending;
};

const UnitStatusOverviewScreen = ({ navigation, route }) => {
  const {
    module,
    unit,
    projectName,
    sections,
    allStatusesCompleted,
    handleBack,
    downloadReportPdf,
    downloadCertificate,
  } = useUnitStatusOverviewViewModel(navigation, route);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={handleBack} />
        <Text style={styles.headerTitle}>All Status</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.projectCard}>
          <Text style={styles.projectLabel}>Project Name</Text>
          <Text style={styles.projectName}>{projectName}</Text>
          <Text style={styles.projectMeta}>Unit: {unit?.unitNo || `${module}-001`}</Text>
        </View>

        {sections.map((section) => (
          <View key={section.key} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.description}</Text>

            <View style={styles.subStatusList}>
              {section.subStatuses.map((item) => {
                const statusColor = getStatusColor(item.status);

                return (
                  <View key={item.id} style={styles.subStatusItem}>
                    <Text style={styles.subStatusLabel}>{item.displayLabel}</Text>
                    <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
                      <Text style={[styles.statusPillText, { color: statusColor }]}>{item.status}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.reportButton} onPress={downloadReportPdf}>
            <Text style={styles.reportButtonText}>Download Report PDF</Text>
          </TouchableOpacity>

          {allStatusesCompleted ? (
            <TouchableOpacity style={styles.certificateButton} onPress={downloadCertificate}>
              <Text style={styles.certificateButtonText}>Download Certificate</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UnitStatusOverviewScreen;
