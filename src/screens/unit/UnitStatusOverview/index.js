import React from "react";
import {
  Image,
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
import ImageViewerModal from "../../../components/ImageViewerModal";
import useUnitStatusOverviewViewModel from "../../../viewmodels/useUnitStatusOverviewViewModel";

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
  <View style={styles.outletArrayRow}>
    <View style={styles.outletArrayCell}>
      <Text style={styles.outletArrayLabel}>Valve No.</Text>
      <Text style={styles.outletArrayValue}>
        {getOutletRowValue(item, "valveNo") || `V${index + 1}`}
      </Text>
    </View>
    <View style={styles.outletArrayCell}>
      <Text style={styles.outletArrayLabel}>SC No.</Text>
      <Text style={styles.outletArrayValue}>
        {getOutletRowValue(item, "subChakName")}
      </Text>
    </View>
    <View style={styles.outletArrayCell}>
      <Text style={styles.outletArrayLabel}>Pipe Size</Text>
      <Text style={styles.outletArrayValue}>
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

const getSubChakCountValue = (checklist, workItem) => {
  const candidates = [
    workItem?.subCheckQty,
    workItem?.subChakQuantity,
    workItem?.subChakQty,
    workItem?.rawItem?.subCheckQty,
    workItem?.rawItem?.sub_check_qty,
    workItem?.rawItem?.subChakQuantity,
    workItem?.rawItem?.sub_chak_quantity,
    workItem?.rawItem?.subChakQty,
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

const getChecklistDisplayTitle = (checklist, workItem) => {
  const baseTitle = String(checklist?.name || "").trim();

  if (!baseTitle || !isSubChakCountChecklist(checklist)) {
    return baseTitle;
  }

  if (/\(\s*\d+\s*\)/.test(baseTitle)) {
    return baseTitle;
  }

  const subChakCount = getSubChakCountValue(checklist, workItem);

  return subChakCount ? `${baseTitle} (${subChakCount})` : baseTitle;
};

const getChecklistInlineCountValue = (checklist, workItem) => {
  if (!isSubChakCountChecklist(checklist)) {
    return "";
  }

  return String(getSubChakCountValue(checklist, workItem) || "");
};

const ChecklistValueBlock = ({ checklist, onViewImage }) => {
  const rawValue = checklist?.detail?.rawValue;
  const valueText = checklist?.detail?.value || "";

  if (checklist?.isFile) {
    return (
      <View style={styles.valueBlock}>
        <View style={styles.fileRow}>
          {checklist.fileUrl ? (
            <TouchableOpacity
              style={styles.filePreviewTouch}
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
                style={styles.inlinePreviewImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.filePlaceholder}>
              <Icon
                source="image-off-outline"
                size={22}
                color={colors.textSecondary}
              />
              <Text style={styles.filePlaceholderText}>No image uploaded</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (Array.isArray(rawValue) && rawValue.length) {
    return (
      <View style={styles.valueBlock}>
        <Text style={styles.valueLabel}>
          {checklist?.detail?.label || "Submitted Values"}
        </Text>
        <View style={styles.arrayGroup}>
          {rawValue.map((item, itemIndex) => (
            <View key={`${checklist.id}-${itemIndex}`} style={styles.arrayCard}>
              {isOutletIdentificationItem(item) ? (
                <OutletIdentificationRow item={item} index={itemIndex} />
              ) : isPlainObject(item) ? (
                Object.entries(item).map(([key, value]) => (
                  <View key={key} style={styles.arrayRow}>
                    <Text style={styles.arrayKey}>{formatValueLabel(key)}</Text>
                    <Text style={styles.arrayValue}>
                      {formatValueText(value) || "-"}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.arrayValue}>{formatValueText(item)}</Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (isPlainObject(rawValue)) {
    return (
      <View style={styles.valueBlock}>
        <Text style={styles.valueLabel}>
          {checklist?.detail?.label || "Submitted Values"}
        </Text>
        <View style={styles.arrayCard}>
          {Object.entries(rawValue).map(([key, value]) => (
            <View key={key} style={styles.arrayRow}>
              <Text style={styles.arrayKey}>{formatValueLabel(key)}</Text>
              <Text style={styles.arrayValue}>
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
      ? styles.compactValueToneSuccess
      : state.tone === "danger"
        ? styles.compactValueToneDanger
        : styles.compactValueToneNeutral;
  const textStyle =
    state.tone === "success"
      ? styles.compactValueTextSuccess
      : state.tone === "danger"
        ? styles.compactValueTextDanger
        : styles.compactValueTextNeutral;

  return (
    <View style={styles.valueBlock}>
      <View style={[styles.compactValueRow, toneStyle]}>
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
        <Text style={[styles.compactValueText, textStyle]} numberOfLines={2}>
          {valueText}
        </Text>
      </View>
    </View>
  );
};

const getStatusColors = (statusKey) => {
  if (statusKey === "verified") {
    return {
      solid: colors.primaryBlue,
      soft: "#EAF3FF",
      text: colors.primaryBlue,
    };
  }

  if (statusKey === "submitted") {
    return {
      solid: colors.pending,
      soft: "#FFF5EA",
      text: "#A85D10",
    };
  }

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

const toStatusObject = (statusKey, fallbackStatus) => {
  if (!statusKey) {
    return fallbackStatus;
  }

  const normalizedKey = String(statusKey).trim().toLowerCase();
  const labelMap = {
    submitted: "Submitted",
    verified: "Verified",
    approved: "Approved",
    commented: "Commented",
    rejected: "Commented",
  };

  return {
    ...(fallbackStatus || {}),
    key: normalizedKey === "rejected" ? "commented" : normalizedKey,
    label:
      labelMap[normalizedKey] ||
      fallbackStatus?.label ||
      "Pending",
  };
};

const getWorkItemWorkflowStatusKey = (workItem) => {
  if (!workItem) {
    return "";
  }

  const rawStatus = String(workItem?.status || "")
    .trim()
    .toLowerCase();

  if (
    workItem?.rejectedAt ||
    workItem?.rejectionRemark ||
    rawStatus === "rejected" ||
    rawStatus === "commented"
  ) {
    return "commented";
  }

  if (workItem?.approvedAt || rawStatus === "approved") {
    return "approved";
  }

  if (workItem?.verifiedAt || rawStatus === "verified") {
    return "verified";
  }

  if (
    workItem?.submittedAt ||
    rawStatus === "submitted" ||
    rawStatus === "completed"
  ) {
    return "submitted";
  }

  return "";
};

const UnitStatusOverviewScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    unitLabel,
    projectName,
    screenTitle,
    canReviewChecklist,
    processes,
    summary,
    isLoading,
    error,
    refreshProgress,
    selectedProcess,
    selectedSubprocess,
    selectedSubprocessDetails,
    selectedSubprocessLocation,
    workflowStatusOverrides,
    workItem,
    selectedWorkflowProcessId,
    selectedWorkflowSubprocessId,
    imagePreview,
    handleBack,
    toggleProcess,
    isProcessExpanded,
    openSubprocessModal,
    closeSubprocessModal,
    openSelectedSubprocessDirections,
    openImagePreview,
    closeImagePreview,
  } = useUnitStatusOverviewViewModel(navigation, route);
  const sheetBottomPadding = insets.bottom + 20;
  const selectedWorkItemStatusKey = getWorkItemWorkflowStatusKey(workItem);
  const selectedSubprocessStatusOverride =
    workflowStatusOverrides[String(selectedSubprocess?.id || "")] || "";
  const selectedSubprocessMatchesWorkItem =
    selectedWorkflowProcessId !== null &&
    selectedWorkflowSubprocessId !== null &&
    Number(selectedProcess?.id) === Number(selectedWorkflowProcessId) &&
    Number(selectedSubprocess?.id) === Number(selectedWorkflowSubprocessId);
  const effectiveSelectedSubprocessStatus = toStatusObject(
    selectedSubprocessStatusOverride ||
      (selectedSubprocessMatchesWorkItem ? selectedWorkItemStatusKey : ""),
    selectedSubprocess?.status
  );
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={handleBack} />
        <Text style={styles.headerTitle}>{screenTitle}</Text>
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
              const expanded = isProcessExpanded(process.id);
              const selectedProcessMatchesWorkflowItem =
                selectedWorkflowProcessId !== null &&
                Number(process.id) === Number(selectedWorkflowProcessId);

              return (
                <View key={process.id} style={styles.processCard}>
                  <TouchableOpacity
                    style={styles.processHead}
                    activeOpacity={0.88}
                    onPress={() => toggleProcess(process.id)}
                  >
                    <View style={styles.processHeadCopy}>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>PROCESS</Text>
                      </View>
                      <View style={styles.processTitleRow}>
                        <Text style={styles.processTitle}>{process.name}</Text>
                        <StatusPill status={process.status} />
                      </View>
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
                        (() => {
                          const subprocessMatchesWorkflowItem =
                            selectedProcessMatchesWorkflowItem &&
                            selectedWorkflowSubprocessId !== null &&
                            Number(subprocess.id) ===
                              Number(selectedWorkflowSubprocessId);
                          const subprocessStatusOverride =
                            workflowStatusOverrides[String(subprocess.id)] || "";
                          const effectiveSubprocessStatus = toStatusObject(
                            subprocessStatusOverride ||
                              (subprocessMatchesWorkflowItem
                                ? selectedWorkItemStatusKey
                                : ""),
                            subprocess.status
                          );
                          const subprocessActionHint =
                            !subprocessMatchesWorkflowItem
                              ? ""
                              : effectiveSubprocessStatus?.key === "commented"
                              ? "Commented submission"
                              : effectiveSubprocessStatus?.key === "approved"
                              ? "Approved submission"
                              : effectiveSubprocessStatus?.key === "verified"
                              ? "Verified submission"
                              : "Selected review submission";

                          return (
                            <TouchableOpacity
                              key={subprocess.id}
                              style={[
                                styles.subprocessItem,
                                subprocessMatchesWorkflowItem &&
                                  styles.subprocessItemActive,
                                subprocessIndex ===
                                  process.subprocesses.length - 1 &&
                                  styles.subprocessItemLast,
                              ]}
                              activeOpacity={0.86}
                              onPress={() => openSubprocessModal(process, subprocess)}
                            >
                              <View style={styles.subprocessLead}>
                                <View
                                  style={[
                                    styles.subprocessDot,
                                    {
                                      backgroundColor: getStatusColors(
                                        effectiveSubprocessStatus?.key
                                      ).solid,
                                    },
                                  ]}
                                />
                                <View style={styles.subprocessCopy}>
                                  <Text style={styles.subprocessLabel}>
                                    {subprocess.name}
                                  </Text>
                                  {subprocessActionHint ? (
                                    <Text style={styles.subprocessActionHint}>
                                      {subprocessActionHint}
                                    </Text>
                                  ) : null}
                                </View>
                              </View>
                              <View style={styles.subprocessMeta}>
                                <StatusPill status={effectiveSubprocessStatus} />
                              </View>
                            </TouchableOpacity>
                          );
                        })()
                      ))}
                    </View>
                  ) : null}

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
              </View>

              <IconButton
                icon="close"
                size={20}
                iconColor={colors.textDark}
                onPress={closeSubprocessModal}
              />
            </View>
            <View style={styles.sheetStatusRow}>
              <StatusPill status={effectiveSelectedSubprocessStatus} />
            </View>

            {selectedSubprocessLocation ? (
              <TouchableOpacity
                style={styles.directionButton}
                activeOpacity={0.88}
                onPress={openSelectedSubprocessDirections}
              >
                <Icon
                  source="directions"
                  size={16}
                  color={colors.white}
                />
                <Text style={styles.directionButtonText}>Check Direction</Text>
              </TouchableOpacity>
            ) : null}

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={[
                styles.sheetScrollContent,
                { paddingBottom: sheetBottomPadding },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {(selectedSubprocess?.checklists || []).map((checklist, index) => {
                const simpleState = getSimpleChecklistState(checklist);
                const checklistTitle = getChecklistDisplayTitle(
                  checklist,
                  workItem
                );
                const inlineCountValue = getChecklistInlineCountValue(
                  checklist,
                  workItem
                );
                const displaySimpleState = inlineCountValue ? null : simpleState;

                return (
                  <View
                    key={checklist.id}
                    style={[
                      styles.checklistCard,
                      displaySimpleState && styles.checklistCardCompact,
                      index === (selectedSubprocess?.checklists || []).length - 1 &&
                        styles.checklistCardLast,
                    ]}
                  >
                    {displaySimpleState ? (
                      <View>
                        <View style={styles.checklistInlineRow}>
                          <View style={styles.checklistInlineCopy}>
                            <Text style={styles.checklistTitle}>{checklistTitle}</Text>
                            {!checklist.isRequired ? (
                              <Text style={styles.optionalText}>Optional</Text>
                            ) : null}
                          </View>
                          <View
                            style={[
                              styles.checklistInlineStatus,
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
                      <View style={styles.checklistHead}>
                        <View style={styles.checklistCopy}>
                          {inlineCountValue ? (
                            <View style={styles.checklistCountRow}>
                              <Text style={styles.checklistCountTitle}>
                                {checklistTitle}
                              </Text>
                              <View style={styles.checklistCountBadge}>
                                <Text style={styles.checklistCountBadgeText}>
                                  {inlineCountValue}
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <Text style={styles.checklistTitle}>{checklistTitle}</Text>
                          )}
                          {!checklist.isRequired ? (
                            <Text style={styles.optionalText}>Optional</Text>
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
                <View style={styles.reviewDetailsSection}>
                  <Text style={styles.sectionBlockTitle}>Review Details</Text>
                  <View style={styles.detailMetaGrid}>
                    {selectedSubprocessDetails.map((item) => (
                      <View key={item.key} style={styles.detailMetaCard}>
                        <Text style={styles.detailMetaLabel}>{item.label}</Text>
                        <Text style={styles.detailMetaValue}>{item.value}</Text>
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

export default UnitStatusOverviewScreen;
