import React from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../../constants/colors";
import useUnitDetailsViewModel from "../../../viewmodels/useUnitDetailsViewModel";

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

const UnitDetailsScreen = ({ navigation, route }) => {
  const {
    unitLabel,
    projectName,
    detailItems,
    processes,
    overviewActionLabel,
    isLoading,
    isRefreshing,
    error,
    refreshProgress,
    openHelper,
    handleBack,
    openViewAll,
    toggleProcess,
    isProcessExpanded,
    openSubprocessDetails,
  } = useUnitDetailsViewModel(navigation, route);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={handleBack} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {`OMS-${unitLabel}`}
        </Text>
        <IconButton
          icon="help-circle-outline"
          iconColor={colors.primaryBlue}
          size={20}
          onPress={openHelper}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshProgress}
            tintColor={colors.primaryBlue}
            colors={[colors.primaryBlue]}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroOrb1} pointerEvents="none" />
          <View style={styles.heroOrb2} pointerEvents="none" />

          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>PROJECT</Text>
            </View>
            <View style={styles.heroUnitBadge}>
              <Text style={styles.heroUnitText}>Node {unitLabel}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle} numberOfLines={2}>
            {projectName}
          </Text>
        </View>

        <View style={styles.sectionMetaBlock}>
          <View style={styles.sectionMetaIconWrap}>
            <Icon source="clipboard-list-outline" size={18} color={colors.primaryBlue} />
          </View>
          <View style={styles.sectionMetaCopy}>
            <Text style={styles.sectionMetaTitle}>Node Details</Text>
            <Text style={styles.sectionMetaSubtitle}>
              Quick summary before you open a process.
            </Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          {detailItems.map((item, index) => {
            const accentColors = [
              colors.primaryBlue,
              colors.darkGreen,
              "#E3A008",
              "#9061F9",
            ];
            const accent = accentColors[index % accentColors.length];

            return (
              <View
                style={[styles.detailCard, { borderLeftColor: accent }]}
                key={item.label}
              >
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {item.value}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.statusListHeader}>
          <View style={styles.statusListCopy}>
            <Text style={styles.statusListTitle}>Process Status</Text>
            <Text style={styles.statusListSubtitle}>
              Tap a subprocess to see all checklist items.
            </Text>
          </View>
          <TouchableOpacity style={styles.viewAllButton} onPress={openViewAll}>
            <Text style={styles.viewAllText}>{overviewActionLabel}</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={[styles.stateCard, styles.stateCardError]}>
            <Text style={styles.stateTitle}>Unable to load progress</Text>
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
            <Text style={styles.stateTitle}>No progress available yet</Text>
            <Text style={styles.stateCopy}>
              This node does not have any process progress from the API yet.
            </Text>
          </View>
        ) : null}

        {!error
          ? processes.map((process) => {
              const expanded = isProcessExpanded(process.id);

              return (
                <View key={process.id} style={styles.processCard}>
                  <TouchableOpacity
                    style={styles.processHead}
                    activeOpacity={0.88}
                    onPress={() => toggleProcess(process.id)}
                  >
                    <View style={styles.processHeadCopy}>
                      <View style={styles.processBadge}>
                        <Text style={styles.processBadgeText}>PROCESS</Text>
                      </View>
                      <View style={styles.processTitleRow}>
                        <Text style={styles.processTitle}>{process.name}</Text>
                        <StatusPill status={process.status} />
                      </View>

                      <Text style={styles.processMeta}>
                        {process.subprocessCount} subprocess
                        {process.subprocessCount === 1 ? "" : "es"} •{" "}
                        {process.checklistCount} checklist
                        {process.checklistCount === 1 ? "" : "s"}
                      </Text>
                    </View>

                    <View style={styles.processChevronWrap}>
                      <Icon
                        source={expanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={colors.primaryBlue}
                      />
                    </View>
                  </TouchableOpacity>

                  {expanded ? (
                    <View style={styles.subprocessList}>
                      {process.subprocesses.map((subprocess, subprocessIndex) => (
                        <TouchableOpacity
                          key={subprocess.id}
                          style={[
                            styles.subprocessItem,
                            subprocessIndex === process.subprocesses.length - 1 &&
                              styles.subprocessItemLast,
                          ]}
                          activeOpacity={0.86}
                          onPress={() =>
                            openSubprocessDetails(process, subprocess)
                          }
                        >
                          <View style={styles.subprocessLead}>
                            <View
                              style={[
                                styles.subprocessDot,
                                {
                                  backgroundColor: getStatusColors(
                                    subprocess.status?.key
                                  ).solid,
                                },
                              ]}
                            />
                            <View style={styles.subprocessCopy}>
                              <Text style={styles.subprocessLabel}>
                                {subprocess.name}
                              </Text>
                              <Text style={styles.subprocessHint}>
                                {subprocess.checklistCount} checklist
                                {subprocess.checklistCount === 1 ? "" : "s"}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.subprocessMeta}>
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
                  ) : null}
                </View>
              );
            })
          : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default UnitDetailsScreen;
