import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Icon, IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../../constants/colors";
import useUnitStatusOverviewViewModel from "../../../viewmodels/useUnitStatusOverviewViewModel";

const getStatusColors = (statusKey) => {
  if (
    statusKey === "completed" ||
    statusKey === "approved" ||
    statusKey === "updated"
  ) {
    return {
      solid: colors.completed,
      soft: "#E8FFF2",
      text: "#117A4D",
    };
  }

  if (statusKey === "commented") {
    return {
      solid: colors.primaryBlue,
      soft: "#EAF3FF",
      text: colors.primaryBlue,
    };
  }

  if (statusKey === "partial") {
    return {
      solid: colors.partial,
      soft: "#FFF7E3",
      text: "#A56D00",
    };
  }

  return {
    solid: colors.pending,
    soft: "#FFF2E5",
    text: "#A85D10",
  };
};

const StatusPill = ({ status }) => {
  const palette = getStatusColors(status?.key);

  return (
    <View style={[styles.statusPill, { backgroundColor: palette.soft }]}>
      <View
        style={[styles.statusPillDot, { backgroundColor: palette.solid }]}
      />
      <Text style={[styles.statusPillText, { color: palette.text }]}>
        {status?.label || "Pending"}
      </Text>
    </View>
  );
};

const UnitStatusOverviewScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    module,
    unit,
    unitLabel,
    projectName,
    processes,
    summary,
    isLoading,
    error,
    refreshProgress,
    selectedProcess,
    selectedSubprocess,
    handleBack,
    openSubprocessModal,
    closeSubprocessModal,
  } = useUnitStatusOverviewViewModel(navigation, route);
  const sheetBottomPadding = insets.bottom + 20;

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
        <View style={styles.heroCard}>
          <View style={styles.heroOrb1} pointerEvents="none" />
          <View style={styles.heroOrb2} pointerEvents="none" />
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>PROJECT</Text>
            </View>
            <View style={styles.heroUnitBadge}>
              <Text style={styles.heroUnitText}>{unitLabel}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle} numberOfLines={2}>
            {projectName}
          </Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatChip}>
              <Text style={styles.heroStatValue}>{summary.processCount}</Text>
              <Text style={styles.heroStatLabel}>Processes</Text>
            </View>
            <View style={[styles.heroStatChip, styles.heroStatChipGreen]}>
              <Text style={styles.heroStatValue}>
                {summary.completedSubprocessCount}
              </Text>
              <Text style={styles.heroStatLabel}>Completed</Text>
            </View>
            <View style={[styles.heroStatChip, styles.heroStatChipAmber]}>
              <Text style={styles.heroStatValue}>
                {summary.pendingSubprocessCount}
              </Text>
              <Text style={styles.heroStatLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading all process status...</Text>
            <Text style={styles.stateCopy}>
              We are fetching the latest subprocess and checklist data.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.stateCard, styles.stateCardError]}>
            <Text style={styles.stateTitle}>Unable to load status</Text>
            <Text style={styles.stateCopy}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={refreshProgress}
              activeOpacity={0.86}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isLoading && !error && !processes.length ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No process data available</Text>
            <Text style={styles.stateCopy}>
              This node does not have any checklist progress from the API yet.
            </Text>
          </View>
        ) : null}

        {!error
          ? processes.map((process) => {
              return (
                <View key={process.id} style={styles.sectionCard}>
                  <View style={styles.sectionHeadRow}>
                    <View style={styles.sectionHeadCopy}>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>PROCESS</Text>
                      </View>
                      <View style={styles.sectionTitleRow}>
                        <Text style={styles.sectionTitle}>{process.name}</Text>
                        <StatusPill status={process.status} />
                      </View>
                      <Text style={styles.sectionSubtitle}>
                        {process.subprocessCount} subprocess
                        {process.subprocessCount === 1 ? "" : "es"} •{" "}
                        {process.checklistCount} checklist
                        {process.checklistCount === 1 ? "" : "s"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.subStatusList}>
                    {process.subprocesses.map((subprocess, subprocessIndex) => (
                      <TouchableOpacity
                        key={subprocess.id}
                        style={[
                          styles.subStatusItem,
                          subprocessIndex === process.subprocesses.length - 1 &&
                            styles.subStatusItemLast,
                        ]}
                        activeOpacity={0.86}
                        onPress={() => openSubprocessModal(process, subprocess)}
                      >
                        <View style={styles.subStatusCopy}>
                          <Text style={styles.subStatusLabel}>
                            {subprocess.name}
                          </Text>
                          <Text style={styles.subStatusHint}>
                            {subprocess.checklistCount} checklist
                            {subprocess.checklistCount === 1 ? "" : "s"}
                          </Text>
                        </View>
                        <View style={styles.subStatusMeta}>
                          <StatusPill status={subprocess.status} />
                          <Icon
                            source="chevron-right"
                            size={18}
                            color={colors.textSecondary}
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })
          : null}
      </ScrollView>

      <Modal
        visible={Boolean(selectedSubprocess)}
        transparent
        animationType="slide"
        onRequestClose={closeSubprocessModal}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={closeSubprocessModal} />

          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetEyebrow}>
                  {selectedProcess?.name || "Checklist Status"}
                </Text>
                <Text style={styles.sheetTitle}>
                  {selectedSubprocess?.name || "Subprocess"}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  Only filled values are shown below when the API provides them.
                </Text>
              </View>

              <IconButton
                icon="close"
                size={20}
                iconColor={colors.textDark}
                onPress={closeSubprocessModal}
              />
            </View>

            <View style={styles.sheetStatusRow}>
              <StatusPill status={selectedSubprocess?.status} />
              <Text style={styles.sheetStatusCount}>
                {selectedSubprocess?.checklistCount || 0} checklist
                {(selectedSubprocess?.checklistCount || 0) === 1 ? "" : "s"}
              </Text>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={[
                styles.sheetScrollContent,
                { paddingBottom: sheetBottomPadding },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {(selectedSubprocess?.checklists || []).map((checklist, index) => (
                <View
                  key={checklist.id}
                  style={[
                    styles.checklistCard,
                    index === (selectedSubprocess?.checklists || []).length - 1 &&
                      styles.checklistCardLast,
                  ]}
                >
                  <View style={styles.checklistHead}>
                    <View style={styles.checklistCopy}>
                      <Text style={styles.checklistTitle}>{checklist.name}</Text>
                      {!checklist.isRequired ? (
                        <Text style={styles.optionalText}>Optional</Text>
                      ) : null}
                      {checklist.detail?.value ? (
                        <Text style={styles.checklistDetail}>
                          {checklist.detail.label}: {checklist.detail.value}
                        </Text>
                      ) : null}
                    </View>

                    {checklist.isRequired ? (
                      <View style={styles.checklistMeta}>
                        <StatusPill status={checklist.status} />
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default UnitStatusOverviewScreen;
