import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../../constants/colors";
import useUnitStatusOverviewViewModel from "../../../viewmodels/useUnitStatusOverviewViewModel";

const getStatusColor = (value) => {
  if (value === "Completed" || value === "Updated") return colors.completed;
  if (value === "Partially Completed" || value === "Partial") return colors.partial;
  return colors.pending;
};

const isCompletedStatus = (value) =>
  value === "Completed" || value === "Updated";

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
  const totalStatuses = sections.reduce(
    (sum, section) => sum + section.subStatuses.length,
    0
  );
  const completedStatuses = sections.reduce(
    (sum, section) =>
      sum + section.subStatuses.filter((item) => isCompletedStatus(item.status)).length,
    0
  );
  const pendingStatuses = Math.max(totalStatuses - completedStatuses, 0);
  const overviewSummary = [
    { key: "processes", value: sections.length, label: "Processes" },
    { key: "completed", value: completedStatuses, label: "Completed" },
    { key: "pending", value: pendingStatuses, label: "Pending" },
  ];

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

        <View style={styles.overviewSummaryRow}>
          {overviewSummary.map((item) => (
            <View key={item.key} style={styles.overviewSummaryCard}>
              <Text style={styles.overviewSummaryValue}>{item.value}</Text>
              <Text style={styles.overviewSummaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {sections.map((section) => (
          <View key={section.key} style={styles.sectionCard}>
            <View style={styles.sectionHeadRow}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCountBadge}>
                <Text style={styles.sectionCountText}>
                  {section.subStatuses.length} step
                  {section.subStatuses.length === 1 ? "" : "s"}
                </Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>{section.description}</Text>

            <View style={styles.subStatusList}>
              {section.subStatuses.map((item) => {
                const statusColor = getStatusColor(item.status);

                return (
                  <View key={item.id} style={styles.subStatusItem}>
                    <View style={styles.subStatusCopy}>
                      <View style={styles.subStatusDot} />
                      <Text style={styles.subStatusLabel}>{item.displayLabel}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                      <Text style={[styles.statusPillText, { color: colors.white }]}>{item.status}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Downloads</Text>
          <Text style={styles.actionsSubtitle}>
            Export the current status summary or completion certificate.
          </Text>

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
