import React from "react";
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, IconButton } from "react-native-paper";
import styles from "./styles";
import sheetStyles from "../../WorkStatus/styles";
import colors from "../../../constants/colors";
import ImageViewerModal from "../../../components/ImageViewerModal";
import useUnitDetailsViewModel from "../../../viewmodels/useUnitDetailsViewModel";
import { getUnitStatusPalette } from "../../../utils/unitStatusPalette";

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const formatValueLabel = (value = "") =>
  String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatValueText = (value) => {
  if (value === null || typeof value === "undefined") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return "";
};

const getOutletRowValue = (item = {}, key = "") =>
  formatValueText(item?.[key]) || "-";

const isOutletIdentificationItem = (item = {}) =>
  isPlainObject(item) &&
  ["valveNo", "subChakName", "pipeSize"].every((key) =>
    Object.prototype.hasOwnProperty.call(item, key)
  );

const OutletIdentificationRow = ({ item, index }) => (
  <View style={sheetStyles.outletArrayRow}>
    <View style={sheetStyles.outletArrayCell}>
      <Text style={sheetStyles.outletArrayLabel}>Valve No.</Text>
      <Text style={sheetStyles.outletArrayValue}>
        {getOutletRowValue(item, "valveNo") || `V${index + 1}`}
      </Text>
    </View>
    <View style={sheetStyles.outletArrayCell}>
      <Text style={sheetStyles.outletArrayLabel}>SC No.</Text>
      <Text style={sheetStyles.outletArrayValue}>
        {getOutletRowValue(item, "subChakName")}
      </Text>
    </View>
    <View style={sheetStyles.outletArrayCell}>
      <Text style={sheetStyles.outletArrayLabel}>Pipe Size</Text>
      <Text style={sheetStyles.outletArrayValue}>
        {getOutletRowValue(item, "pipeSize")}
      </Text>
    </View>
  </View>
);

const getCompactValueState = (value) => {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (
    ["yes", "true", "completed", "done", "approved", "verified"].includes(
      normalizedValue
    )
  ) {
    return { icon: "check-circle", tone: "success" };
  }

  if (["no", "false"].includes(normalizedValue)) {
    return { icon: "close-circle", tone: "danger" };
  }

  return { icon: "circle-medium", tone: "neutral" };
};

const getSimpleChecklistState = (checklist) => {
  const rawValue = checklist?.detail?.rawValue;

  if (checklist?.isFile || Array.isArray(rawValue) || isPlainObject(rawValue)) {
    return null;
  }

  const valueText = formatValueText(rawValue ?? checklist?.detail?.value);
  const normalizedText = String(valueText || "").trim();
  const statusKey = String(checklist?.status?.key || "").trim().toLowerCase();
  const statusCode = Number(checklist?.status?.code ?? checklist?.rawChecklist?.status);
  const isRemarkChecklist = String(checklist?.name || "")
    .trim()
    .toLowerCase()
    .startsWith("remark");

  if (!normalizedText) {
    if (isRemarkChecklist) {
      return null;
    }

    if (
      statusKey === "completed" ||
      statusKey === "approved" ||
      statusKey === "updated" ||
      statusKey === "verified" ||
      statusCode === 2 ||
      statusCode === 4
    ) {
      return {
        icon: "check-circle",
        color: colors.completed,
        backgroundColor: "#ECFBF3",
        borderColor: "#C7EFD8",
      };
    }

    return null;
  }

  const normalizedValue = String(valueText || "").trim().toLowerCase();

  if (
    ["yes", "true", "completed", "done", "approved", "verified"].includes(
      normalizedValue
    )
  ) {
    return {
      icon: "check-circle",
      color: colors.completed,
      backgroundColor: "#ECFBF3",
      borderColor: "#C7EFD8",
    };
  }

  if (["no", "false"].includes(normalizedValue)) {
    return {
      icon: "close-circle",
      color: colors.danger,
      backgroundColor: "#FFF3F0",
      borderColor: "#F1C5B8",
    };
  }

  return null;
};

const isSubChakCountChecklist = (checklist) => {
  const checklistId = Number(
    checklist?.rawChecklist?.checklistId ||
      checklist?.rawChecklist?.checklist_id ||
      checklist?.id
  );
  const label = String(checklist?.name || "").trim().toLowerCase();

  return (
    checklistId === 6 ||
    label.includes("sub-chak as per design") ||
    label.includes("sub chak as per design") ||
    label.includes("subchak as per design") ||
    label.includes("no. of outlet pipes") ||
    label.includes("no of outlet pipes") ||
    label.includes("number of outlet pipes") ||
    label.includes("numbers of outlet pipes")
  );
};

const getSubChakCountValue = (checklist, unit) => {
  const candidates = [
    unit?.subCheckQty,
    unit?.subChakQuantity,
    unit?.subChakQty,
    checklist?.detail?.rawValue,
    checklist?.detail?.value,
    checklist?.rawChecklist?.value,
    checklist?.rawChecklist?.submittedValue,
    checklist?.rawChecklist?.answer,
  ];

  for (const candidate of candidates) {
    const match = String(candidate ?? "").match(/\d+/);
    const parsed = Number.parseInt(match?.[0], 10);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const getChecklistDisplayTitle = (checklist, unit) => {
  const baseTitle = String(checklist?.name || "").trim();

  if (!baseTitle || !isSubChakCountChecklist(checklist)) {
    return baseTitle;
  }

  if (/\(\s*\d+\s*\)/.test(baseTitle)) {
    return baseTitle;
  }

  const subChakCount = getSubChakCountValue(checklist, unit);

  return subChakCount ? `${baseTitle} (${subChakCount})` : baseTitle;
};

const getChecklistInlineCountValue = (checklist, unit) => {
  if (!isSubChakCountChecklist(checklist)) {
    return "";
  }

  return String(getSubChakCountValue(checklist, unit) || "");
};

const ChecklistValueBlock = ({ checklist, onViewImage }) => {
  const rawValue = checklist?.detail?.rawValue;
  const valueText = checklist?.detail?.value || "";

  if (checklist?.isFile) {
    return (
      <View style={sheetStyles.valueBlock}>
        <View style={sheetStyles.fileRow}>
          {checklist.fileUrl ? (
            <TouchableOpacity
              style={sheetStyles.filePreviewTouch}
              activeOpacity={0.88}
              onPress={() =>
                onViewImage({
                  uri: checklist.fileUrl,
                  title: checklist.name,
                })
              }
            >
              <Image
                source={{ uri: checklist.fileUrl }}
                style={sheetStyles.inlinePreviewImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View style={sheetStyles.filePlaceholder}>
              <Icon
                source="image-off-outline"
                size={22}
                color={colors.textSecondary}
              />
              <Text style={sheetStyles.filePlaceholderText}>No image uploaded</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (Array.isArray(rawValue) && rawValue.length) {
    return (
      <View style={sheetStyles.valueBlock}>
        <View style={sheetStyles.arrayGroup}>
          {rawValue.map((item, itemIndex) => (
            <View key={`${checklist.id}-${itemIndex}`} style={sheetStyles.arrayCard}>
              {isOutletIdentificationItem(item) ? (
                <OutletIdentificationRow item={item} index={itemIndex} />
              ) : isPlainObject(item) ? (
                Object.entries(item).map(([key, value]) => (
                  <View key={key} style={sheetStyles.arrayRow}>
                    <Text style={sheetStyles.arrayKey}>{formatValueLabel(key)}</Text>
                    <Text style={sheetStyles.arrayValue}>
                      {formatValueText(value) || "-"}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={sheetStyles.arrayValue}>{formatValueText(item)}</Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (isPlainObject(rawValue)) {
    return (
      <View style={sheetStyles.valueBlock}>
        <View style={sheetStyles.arrayCard}>
          {Object.entries(rawValue).map(([key, value]) => (
            <View key={key} style={sheetStyles.arrayRow}>
              <Text style={sheetStyles.arrayKey}>{formatValueLabel(key)}</Text>
              <Text style={sheetStyles.arrayValue}>
                {formatValueText(value) || "-"}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!valueText) {
    return null;
  }

  const state = getCompactValueState(valueText);
  const toneStyle =
    state.tone === "success"
      ? sheetStyles.compactValueToneSuccess
      : state.tone === "danger"
        ? sheetStyles.compactValueToneDanger
        : sheetStyles.compactValueToneNeutral;
  const textStyle =
    state.tone === "success"
      ? sheetStyles.compactValueTextSuccess
      : state.tone === "danger"
        ? sheetStyles.compactValueTextDanger
        : sheetStyles.compactValueTextNeutral;

  return (
    <View style={sheetStyles.valueBlock}>
      <View style={[sheetStyles.compactValueRow, toneStyle]}>
        <Icon
          source={state.icon}
          size={16}
          color={
            state.tone === "success"
              ? colors.completed
              : state.tone === "danger"
                ? colors.danger
                : colors.primaryBlue
          }
        />
        <Text style={[sheetStyles.compactValueText, textStyle]} numberOfLines={2}>
          {valueText}
        </Text>
      </View>
    </View>
  );
};

const getDisplayStatus = (status) => status;

const StatusPill = ({ status, subprocessId }) => {
  const displayStatus = getDisplayStatus(status, subprocessId);
  const palette = getUnitStatusPalette(displayStatus);

  return (
    <View style={[styles.statusPill, { backgroundColor: palette.soft }]}>
      <View
        style={[styles.statusPillDot, { backgroundColor: palette.solid }]}
      />
      <Text style={[styles.statusPillText, { color: palette.text }]}>
        {displayStatus?.label || "Pending"}
      </Text>
    </View>
  );
};

const UnitDetailsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    unit,
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
  } = useUnitDetailsViewModel(navigation, route);
  const [selectedSheetState, setSelectedSheetState] = React.useState({
    process: null,
    subprocess: null,
  });
  const [imagePreview, setImagePreview] = React.useState({
    visible: false,
    uri: "",
    title: "",
  });
  const subprocessRows = processes.flatMap((process) =>
    (process.subprocesses || []).map((subprocess, subprocessIndex) => ({
      process,
      subprocess,
      key: `${process.id}-${subprocess.id}`,
      isLast:
        subprocessIndex === (process.subprocesses || []).length - 1 &&
        process === processes[processes.length - 1],
    }))
  );
  const selectedProcess = selectedSheetState.process;
  const selectedSubprocess = selectedSheetState.subprocess;
  const selectedSubprocessDetails = selectedSubprocess?.detailItems || [];
  const sheetBottomPadding = insets.bottom + 20;
  const selectedSubprocessStatus = getDisplayStatus(
    selectedSubprocess?.status,
    selectedSubprocess?.id
  );

  const openSubprocessDetails = (process, subprocess) => {
    setSelectedSheetState({ process, subprocess });
  };

  const closeSubprocessSheet = () => {
    setSelectedSheetState({ process: null, subprocess: null });
  };

  const openImagePreview = ({ uri = "", title = "" } = {}) => {
    if (!uri) {
      return;
    }

    setImagePreview({
      visible: true,
      uri,
      title,
    });
  };

  const closeImagePreview = () => {
    setImagePreview((currentValue) => ({
      ...currentValue,
      visible: false,
    }));
  };

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
              Quick summary before you open a subprocess.
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
            <Text style={styles.statusListTitle}>Subprocess Status</Text>
            <Text style={styles.statusListSubtitle}>
              Tap any subprocess to see all checklist items.
            </Text>
          </View>
          {/*
          <TouchableOpacity style={styles.viewAllButton} onPress={openViewAll}>
            <Text style={styles.viewAllText}>{overviewActionLabel}</Text>
          </TouchableOpacity>
          */}
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
              This node does not have any subprocess progress from the API yet.
            </Text>
          </View>
        ) : null}

        {!error
          ? (
            <View style={styles.subprocessList}>
              {subprocessRows.map(({ process, subprocess, key, isLast }) =>
                        (() => {
                          const displaySubprocessStatus = getDisplayStatus(
                            subprocess.status,
                            subprocess.id
                          );

                          return (
                            <TouchableOpacity
                              key={key}
                              style={[
                                styles.subprocessItem,
                                isLast && styles.subprocessItemLast,
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
                                      backgroundColor: getUnitStatusPalette(
                                        displaySubprocessStatus
                                      ).solid,
                                    },
                                  ]}
                                />
                                <View style={styles.subprocessCopy}>
                                  <Text style={styles.subprocessLabel}>
                                    {subprocess.name}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.subprocessMeta}>
                                <StatusPill
                                  status={subprocess.status}
                                  subprocessId={subprocess.id}
                                />
                                <Icon
                                  source="chevron-right"
                                  size={18}
                                  color={colors.textSecondary}
                                />
                              </View>
                            </TouchableOpacity>
                          );
                        })()
              )}
            </View>
          )
          : null}
      </ScrollView>

      <Modal
        visible={Boolean(selectedSubprocess)}
        transparent
        animationType="slide"
        onRequestClose={closeSubprocessSheet}
      >
        <View style={sheetStyles.sheetOverlay}>
          <Pressable style={sheetStyles.sheetBackdrop} onPress={closeSubprocessSheet} />

          <View style={sheetStyles.bottomSheet}>
            <View style={sheetStyles.sheetHandle} />

            <View style={sheetStyles.sheetHeader}>
              <View style={sheetStyles.sheetHeaderCopy}>
                <Text style={sheetStyles.sheetEyebrow} numberOfLines={1}>
                  {selectedProcess?.name || "Checklist Status"}
                </Text>
                <Text style={sheetStyles.sheetTitle} numberOfLines={2}>
                  {selectedSubprocess?.name || "Subprocess"}
                </Text>
              </View>

              <IconButton
                icon="close"
                size={20}
                iconColor={colors.textDark}
                onPress={closeSubprocessSheet}
              />
            </View>

            <View style={sheetStyles.sheetStatusRow}>
              <StatusPill
                status={selectedSubprocessStatus}
                subprocessId={selectedSubprocess?.id}
              />
            </View>

            <ScrollView
              style={sheetStyles.sheetScroll}
              contentContainerStyle={[
                sheetStyles.sheetScrollContent,
                { paddingBottom: sheetBottomPadding },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {(selectedSubprocess?.checklists || []).map((checklist, index) => {
                const simpleState = getSimpleChecklistState(checklist);
                const checklistTitle = getChecklistDisplayTitle(
                  checklist,
                  unit
                );
                const inlineCountValue = getChecklistInlineCountValue(
                  checklist,
                  unit
                );
                const displaySimpleState = inlineCountValue ? null : simpleState;

                return (
                  <View
                    key={checklist.id}
                    style={[
                      sheetStyles.checklistCard,
                      displaySimpleState && sheetStyles.checklistCardCompact,
                      index === (selectedSubprocess?.checklists || []).length - 1 &&
                        sheetStyles.checklistCardLast,
                    ]}
                  >
                    {displaySimpleState ? (
                      <View>
                        <View style={sheetStyles.checklistInlineRow}>
                          <View style={sheetStyles.checklistInlineCopy}>
                            <Text style={sheetStyles.checklistTitle}>
                              {checklistTitle}
                            </Text>
                            {!checklist.isRequired ? (
                              <Text style={sheetStyles.optionalText}>Optional</Text>
                            ) : null}
                          </View>
                          <View
                            style={[
                              sheetStyles.checklistInlineStatus,
                              {
                                backgroundColor: displaySimpleState.backgroundColor,
                                borderColor: displaySimpleState.borderColor,
                              },
                            ]}
                          >
                            <Icon
                              source={displaySimpleState.icon}
                              size={18}
                              color={displaySimpleState.color}
                            />
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={sheetStyles.checklistHead}>
                        <View style={sheetStyles.checklistCopy}>
                          {inlineCountValue ? (
                            <View style={sheetStyles.checklistCountRow}>
                              <Text style={sheetStyles.checklistCountTitle}>
                                {checklistTitle}
                              </Text>
                              <View style={sheetStyles.checklistCountBadge}>
                                <Text style={sheetStyles.checklistCountBadgeText}>
                                  {inlineCountValue}
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <Text style={sheetStyles.checklistTitle}>
                              {checklistTitle}
                            </Text>
                          )}
                          {!checklist.isRequired ? (
                            <Text style={sheetStyles.optionalText}>Optional</Text>
                          ) : null}
                          {inlineCountValue ? null : (
                            <ChecklistValueBlock
                              checklist={checklist}
                              onViewImage={openImagePreview}
                            />
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              {selectedSubprocessDetails.length ? (
                <View style={sheetStyles.reviewDetailsSection}>
                  <Text style={sheetStyles.sectionBlockTitle}>Review Details</Text>
                  <View style={sheetStyles.detailMetaGrid}>
                    {selectedSubprocessDetails.map((item) => (
                      <View key={item.key} style={sheetStyles.detailMetaCard}>
                        <Text style={sheetStyles.detailMetaLabel}>{item.label}</Text>
                        <Text style={sheetStyles.detailMetaValue}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ImageViewerModal
        visible={imagePreview.visible}
        items={
          imagePreview.uri
            ? [
                {
                  id: imagePreview.uri,
                  uri: imagePreview.uri,
                  title: imagePreview.title || "Submitted Image",
                },
              ]
            : []
        }
        onRequestClose={closeImagePreview}
      />
    </SafeAreaView>
  );
};

export default UnitDetailsScreen;
