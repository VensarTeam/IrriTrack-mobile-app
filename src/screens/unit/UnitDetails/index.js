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
import { IconButton } from "react-native-paper";
import styles from "./styles";
import colors from "../../../constants/colors";
import { Icons } from "../../../constants/icons";
import { moderateScale, verticalScale } from "../../../constants/metrics";
import useUnitDetailsViewModel from "../../../viewmodels/useUnitDetailsViewModel";

const getStatusColor = (value) => {
  if (value === "Completed" || value === "Updated") return colors.completed;
  if (value === "Partially Completed" || value === "Partial")
    return colors.partial;
  return colors.pending;
};

const isCompletedStatus = (value) =>
  value === "Completed" || value === "Updated";

const ModuleDetailsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    unitLabel,
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
  const sectionSummaries = sections.map((section) => ({
    ...section,
    subStatuses: getSectionSubStatuses(section),
  }));
  const totalSubStatuses = sectionSummaries.reduce(
    (sum, section) => sum + section.subStatuses.length,
    0,
  );
  const completedSubStatuses = sectionSummaries.reduce(
    (sum, section) =>
      sum +
      section.subStatuses.filter((subStatus) =>
        isCompletedStatus(subStatus.status),
      ).length,
    0,
  );
  const detailSummary = [
    { key: "processes", value: sectionSummaries.length, label: "Processes" },
    { key: "steps", value: totalSubStatuses, label: "Steps" },
    { key: "done", value: completedSubStatuses, label: "Completed" },
  ];
  const sheetBottomPadding =
    Math.max(insets.bottom, verticalScale(14)) + verticalScale(12);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={handleBack} />
        <Text
          style={styles.headerTitle}
          numberOfLines={1}
        >{`OMS-${unitLabel}`}</Text>
        <IconButton
          icon="eye-outline"
          iconColor={colors.primaryBlue}
          size={22}
          onPress={openHelper}
          style={styles.helperHeaderButton}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          {/* Decorative circles */}
          <View style={styles.heroOrb1} pointerEvents="none" />
          <View style={styles.heroOrb2} pointerEvents="none" />

          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              {/* <Icons.project
                width={10}
                height={10}
                color="rgba(255,255,255,0.9)"
              /> */}
              <Text style={styles.heroBadgeText}>PROJECT</Text>
            </View>
          </View>

          <Text style={styles.heroTitle} numberOfLines={2}>
            {projectName}
          </Text>
        </View>

        {/* ── Node Details Header ── */}
        <View style={styles.sectionMetaBlock}>
          <View style={styles.sectionMetaIconWrap}>
            {/* <Icons.clipboard width={16} height={16} color={colors.primaryBlue} /> */}
            <IconButton icon="clipboard-list-outline" />
          </View>
          <View style={styles.sectionMetaCopy}>
            <Text style={styles.sectionMetaTitle}>Node Details</Text>
            <Text style={styles.sectionMetaSubtitle}>
              Quick summary before you open a process.
            </Text>
          </View>
        </View>

        {/* ── Details Grid ── */}
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
            <Text style={styles.statusListTitle}>Update Status</Text>
            <Text style={styles.statusListSubtitle}>
              Tap a process to update from the field.
            </Text>
          </View>
          <TouchableOpacity style={styles.viewAllButton} onPress={openViewAll}>
            <Text style={styles.viewAllText}>All Status</Text>
          </TouchableOpacity>
        </View>

        {sectionSummaries.map((section) => {
          const expanded = isSectionExpanded(section.key);
          const subStatuses = section.subStatuses;

          return (
            <View key={section.key} style={styles.statusCard}>
              <View style={styles.statusCardHead}>
                <View style={styles.statusHeadMain}>
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
                      <Icons.down
                        width={12}
                        height={12}
                        style={{ marginLeft: moderateScale(6) }}
                      />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.statusCountText}>
                    {subStatuses.length} step
                    {subStatuses.length === 1 ? "" : "s"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={() => openUpdatePicker(section)}
                >
                  <Text style={styles.updateButtonText}>Update</Text>
                  <Icons.update
                    width={14}
                    height={14}
                    style={{ marginLeft: moderateScale(6) }}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.statusCardDescription} numberOfLines={2}>
                {section.description}
              </Text>

              {expanded ? (
                <View style={styles.subStatusList}>
                  {subStatuses.map((subStatus, index) => {
                    const statusColor = getStatusColor(subStatus.status);

                    return (
                      <TouchableOpacity
                        key={subStatus.id}
                        style={[
                          styles.subStatusItem,
                          index === subStatuses.length - 1 &&
                            styles.subStatusItemLast,
                        ]}
                        activeOpacity={0.85}
                        onPress={() => openSubStatus(section, subStatus)}
                      >
                        <View style={styles.subStatusCopy}>
                          <View style={styles.subStatusDot} />
                          <Text style={styles.subStatusLabel}>
                            {subStatus.displayLabel}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            { backgroundColor: statusColor },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              { color: colors.white },
                            ]}
                          >
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
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeUpdatePicker}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={closeUpdatePicker}
            accessibilityRole="button"
            accessibilityLabel="Close update status"
          />

          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetEyebrow}>Update Status</Text>
                <Text style={styles.sheetTitle} numberOfLines={2}>
                  {updatePicker.section?.title || "Select Process"}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  Choose a process to continue the field update.
                </Text>
              </View>

              <IconButton
                icon="close"
                iconColor={colors.textDark}
                size={20}
                onPress={closeUpdatePicker}
                style={styles.sheetCloseButton}
                accessibilityLabel="Close update status"
              />
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={[
                styles.sheetScrollContent,
                { paddingBottom: sheetBottomPadding },
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
            >
              {updateOptions.map((sub) => {
                const statusColor = getStatusColor(sub.status);

                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={styles.sheetOption}
                    onPress={() => selectUpdateOption(sub)}
                    activeOpacity={0.86}
                  >
                    <View style={styles.sheetOptionIcon}>
                      <Icons.update width={16} height={16} />
                    </View>

                    <View style={styles.sheetOptionCopy}>
                      <Text style={styles.sheetOptionTitle} numberOfLines={2}>
                        {sub.displayLabel}
                      </Text>
                      <Text style={styles.sheetOptionHint}>
                        Tap to update this process
                      </Text>
                    </View>

                    <View style={styles.sheetOptionMeta}>
                      <View
                        style={[
                          styles.sheetStatusPill,
                          { backgroundColor: statusColor },
                        ]}
                      >
                        <Text style={styles.sheetStatusText} numberOfLines={1}>
                          {sub.status}
                        </Text>
                      </View>
                      <Icons.down
                        width={11}
                        height={11}
                        style={styles.sheetOptionChevron}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ModuleDetailsScreen;
