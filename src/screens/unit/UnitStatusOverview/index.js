import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../../constants/colors";
import useUnitStatusOverviewViewModel from "../../../viewmodels/useUnitStatusOverviewViewModel";

const getStatusColor = (value) => {
  if (value === "Completed" || value === "Updated") return colors.completed;
  if (value === "Partially Completed" || value === "Partial")
    return colors.partial;
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
    0,
  );
  const completedStatuses = sections.reduce(
    (sum, section) =>
      sum +
      section.subStatuses.filter((item) => isCompletedStatus(item.status))
        .length,
    0,
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroOrb1} pointerEvents="none" />
          <View style={styles.heroOrb2} pointerEvents="none" />
          <View style={styles.heroOrb3} pointerEvents="none" />

          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
               <Text style={styles.heroBadgeText}>PROJECT</Text>
            </View>
            <View style={styles.heroUnitBadge}>
              <Text style={styles.heroUnitText}>
                Unit: {unit?.unitNo || `${module}-001`}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle} numberOfLines={2}>
            {projectName}
          </Text>
        </View>

        {/* ── Section Cards ── */}
        {sections.map((section) => (
          <View key={section.key} style={styles.sectionCard}>
            <View style={styles.sectionHeadRow}>
              <View style={styles.sectionIconWrap}>
                <IconButton
                  icon="clipboard-list-outline"
                  size={14}
                  iconColor={colors.primaryBlue}
                />
              </View>
              <View style={styles.sectionHeadCopy}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionSubtitle} numberOfLines={1}>
                  {section.description}
                </Text>
              </View>
              <View style={styles.sectionCountBadge}>
                <Text style={styles.sectionCountText}>
                  {section.subStatuses.length} step
                  {section.subStatuses.length === 1 ? "" : "s"}
                </Text>
              </View>
            </View>

            <View style={styles.subStatusList}>
              {section.subStatuses.map((item, index) => {
                const statusColor = getStatusColor(item.status);
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.subStatusItem,
                      index === section.subStatuses.length - 1 &&
                        styles.subStatusItemLast,
                    ]}
                  >
                    <View style={styles.subStatusCopy}>
                      <View style={styles.subStatusDot} />
                      <Text style={styles.subStatusLabel}>
                        {item.displayLabel}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: statusColor },
                      ]}
                    >
                      <Text style={styles.statusPillText}>{item.status}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* ── Actions Card ── */}
        <View style={styles.actionsCard}>
          <View style={styles.actionsHeadRow}>
            <View style={styles.actionsIconWrap}>
              <IconButton
                icon="clipboard-list-outline"
                size={16}
                iconColor={colors.primaryBlue}
              />
            </View>
            <View>
              <Text style={styles.actionsTitle}>Downloads</Text>
              <Text style={styles.actionsSubtitle}>
                Export the status summary or certificate.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={downloadReportPdf}
          >
            {/* <Icons.download width={14} height={14} color={colors.primaryBlue} /> */}
            <IconButton
              icon="download-outline"
              size={14}
              iconColor={colors.primaryBlue}
            />
            <Text style={styles.reportButtonText}>Download Report PDF</Text>
          </TouchableOpacity>

          {allStatusesCompleted ? (
            <TouchableOpacity
              style={styles.certificateButton}
              onPress={downloadCertificate}
            >
              <Icons.download width={14} height={14} color={colors.white} />
              <Text style={styles.certificateButtonText}>
                Download Certificate
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UnitStatusOverviewScreen;
