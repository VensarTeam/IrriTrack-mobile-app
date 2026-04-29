import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Icon, IconButton, Searchbar } from "react-native-paper";
import { TabBar, TabView } from "react-native-tab-view";
import styles from "./styles";
import colors from "../../constants/colors";
import useWorkStatusViewModel from "../../viewmodels/useWorkStatusViewModel";

const TAB_THEME = {
  Requests: {
    solid: colors.primaryOrange,
    soft: "#FFF1E7",
    accent: "#D96D14",
    icon: "timeline-clock-outline",
  },
  Pending: {
    solid: colors.pending,
    soft: "#FFF5EA",
    accent: "#C96E12",
    icon: "progress-clock",
  },
  Verified: {
    solid: colors.primaryBlue,
    soft: "#ECF4FF",
    accent: "#123B63",
    icon: "shield-check-outline",
  },
  Approved: {
    solid: colors.completed,
    soft: "#EDFCF4",
    accent: "#108D57",
    icon: "check-decagram-outline",
  },
  Commented: {
    solid: "#D15D42",
    soft: "#FFF1EC",
    accent: "#A8472E",
    icon: "message-alert-outline",
  },
};

const formatHistoryDate = (value) => {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch (error) {
    return String(value);
  }
};

const toTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

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

const getCompactValueState = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (
    normalized === "yes" ||
    normalized === "true" ||
    normalized === "completed" ||
    normalized === "done" ||
    normalized === "approved" ||
    normalized === "verified"
  ) {
    return {
      icon: "check-circle",
      tone: "success",
    };
  }

  if (
    normalized === "no" ||
    normalized === "false" ||
    normalized === "rejected" ||
    normalized === "commented"
  ) {
    return {
      icon: "close-circle",
      tone: "danger",
    };
  }

  return {
    icon: "circle-medium",
    tone: "neutral",
  };
};

const getSimpleChecklistState = (checklist) => {
  const rawValue = checklist?.detail?.rawValue;

  if (
    checklist?.isFile ||
    Array.isArray(rawValue) ||
    isPlainObject(rawValue)
  ) {
    return null;
  }

  const valueText = formatValueText(rawValue ?? checklist?.detail?.value);
  const normalized = String(valueText || "")
    .trim()
    .toLowerCase();

  if (
    normalized === "yes" ||
    normalized === "true" ||
    normalized === "completed" ||
    normalized === "done" ||
    normalized === "approved" ||
    normalized === "verified"
  ) {
    return {
      icon: "check-circle",
      color: colors.completed,
      backgroundColor: "#ECFBF3",
      borderColor: "#C7EFD8",
    };
  }

  if (normalized === "no" || normalized === "false") {
    return {
      icon: "close-circle",
      color: colors.danger,
      backgroundColor: "#FFF3F0",
      borderColor: "#F1C5B8",
    };
  }

  return null;
};

const ChecklistValueBlock = ({ checklist }) => {
  const rawValue = checklist?.detail?.rawValue;
  const valueText = checklist?.detail?.value || "";

  if (checklist?.isFile) {
    return (
      <View style={styles.valueBlock}>
        <View style={styles.fileRow}>
          <Text style={styles.fileName} numberOfLines={2}>
            {checklist?.metadata?.originalName ||
              checklist?.metadata?.original_name ||
              checklist?.name ||
              "Uploaded file"}
          </Text>
          {checklist.fileUrl ? (
            <Image
              source={{ uri: checklist.fileUrl }}
              style={styles.inlinePreviewImage}
              resizeMode="cover"
            />
          ) : null}
        </View>
      </View>
    );
  }

  if (Array.isArray(rawValue) && rawValue.length) {
    return (
      <View style={styles.valueBlock}>
        <View style={styles.arrayGroup}>
          {rawValue.map((item, itemIndex) => (
            <View key={`${checklist.id}-${itemIndex}`} style={styles.arrayCard}>
              {isPlainObject(item) ? (
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

  const compactState = getCompactValueState(valueText);
  const compactToneStyle =
    compactState.tone === "success"
      ? styles.compactValueToneSuccess
      : compactState.tone === "danger"
      ? styles.compactValueToneDanger
      : styles.compactValueToneNeutral;
  const compactTextToneStyle =
    compactState.tone === "success"
      ? styles.compactValueTextSuccess
      : compactState.tone === "danger"
      ? styles.compactValueTextDanger
      : styles.compactValueTextNeutral;

  return (
    <View style={styles.valueBlock}>
      <View style={[styles.compactValueRow, compactToneStyle]}>
        <Icon
          source={compactState.icon}
          size={16}
          color={
            compactState.tone === "success"
              ? colors.completed
              : compactState.tone === "danger"
              ? colors.danger
              : colors.primaryBlue
          }
        />
        <Text
          style={[styles.compactValueText, compactTextToneStyle]}
          numberOfLines={2}
        >
          {valueText}
        </Text>
      </View>
    </View>
  );
};

const WorkStatusScreen = ({ route, navigation }) => {
  const {
    stageLabel,
    zoneName,
    villageName,
    search,
    setSearch,
    tabs,
    activeTabIndex,
    setActiveTabIndex,
    countsByTab,
    unitsByTab,
    isLoading,
    isRefreshing,
    isFetchingMore,
    error,
    canReviewChecklist,
    reviewCapabilities,
    canLoadMore,
    loadMore,
    refresh,
    openWorkItem,
    selectedWorkItem,
    selectedProgressMatch,
    selectedWorkflowStatusKey,
    isSelectedProgressLoading,
    selectedProgressError,
    selectedHistoryWorkItem,
    submissionHistory,
    isSubmissionHistoryLoading,
    submissionHistoryError,
    reviewRemark,
    reviewError,
    isWorkflowSubmitting,
    closeWorkItemSheet,
    openSubmissionHistory,
    closeSubmissionHistory,
    refreshSubmissionHistory,
    updateReviewRemark,
    submitWorkItemAction,
    refreshSelectedProgress,
    getUnitSubtitle,
    getUnitWorkBucket,
    handleBack,
  } = useWorkStatusViewModel(navigation, route);
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isRejectRemarkModalVisible, setIsRejectRemarkModalVisible] =
    React.useState(false);
  const [isRejectSubmitPending, setIsRejectSubmitPending] = React.useState(false);
  const [isRejectKeyboardVisible, setIsRejectKeyboardVisible] =
    React.useState(false);
  const selectedProcess = selectedProgressMatch?.process || null;
  const selectedSubprocess = selectedProgressMatch?.subprocess || null;
  const selectedChecklistItems = selectedSubprocess?.checklists || [];
  const selectedDetailItems = selectedSubprocess?.detailItems || [];
  const sheetBottomPadding = insets.bottom + 24;
  const historySheetBottomPadding = insets.bottom + 20;
  const canVerifySelected =
    reviewCapabilities.canVerify && selectedWorkflowStatusKey === "submitted";
  const canApproveSelected =
    reviewCapabilities.canApprove && selectedWorkflowStatusKey === "verified";
  const canRejectSelected =
    reviewCapabilities.canReject &&
    (selectedWorkflowStatusKey === "submitted" ||
      selectedWorkflowStatusKey === "verified");

  React.useEffect(() => {
    setIsRejectRemarkModalVisible(false);
    setIsRejectSubmitPending(false);
  }, [selectedWorkItem?.submissionId, selectedWorkflowStatusKey]);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsRejectKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsRejectKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  React.useEffect(() => {
    if (!isRejectSubmitPending || isWorkflowSubmitting) {
      return;
    }

    if (!reviewError) {
      setIsRejectRemarkModalVisible(false);
    }

    setIsRejectSubmitPending(false);
  }, [isRejectSubmitPending, isWorkflowSubmitting, reviewError]);

  const openRejectRemarkModal = React.useCallback(() => {
    updateReviewRemark("");
    setIsRejectRemarkModalVisible(true);
  }, [updateReviewRemark]);

  const closeRejectRemarkModal = React.useCallback(() => {
    if (isWorkflowSubmitting) {
      return;
    }

    setIsRejectRemarkModalVisible(false);
    updateReviewRemark("");
  }, [isWorkflowSubmitting, updateReviewRemark]);

  const handleRejectModalRequestClose = React.useCallback(() => {
    if (isWorkflowSubmitting) {
      return;
    }

    if (isRejectKeyboardVisible) {
      Keyboard.dismiss();
      return;
    }

    closeRejectRemarkModal();
  }, [closeRejectRemarkModal, isRejectKeyboardVisible, isWorkflowSubmitting]);

  const submitRejectFromModal = React.useCallback(async () => {
    setIsRejectSubmitPending(true);
    await submitWorkItemAction("reject");
  }, [submitWorkItemAction]);

  const routes = React.useMemo(
    () =>
      tabs.map((tab) => ({
        key: tab,
        title: tab,
      })),
    [tabs]
  );

  const contextChips = [
    stageLabel !== "All" ? stageLabel : "",
    zoneName !== "All" ? zoneName : "",
    villageName !== "All" ? villageName : "",
  ].filter(Boolean);

  const renderUnitCard = React.useCallback(
    ({ item }) => {
      const bucket = getUnitWorkBucket(item);
      const theme = TAB_THEME[bucket] || TAB_THEME.Pending;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => openWorkItem(item)}
          activeOpacity={0.9}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardEyebrow} numberOfLines={1}>
                {item?.omsName || item?.omsId || "OMS"}
              </Text>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item?.processName || "Process"}
              </Text>
              <View style={styles.subprocessHighlight}>
                <Text style={styles.subprocessHighlightText} numberOfLines={1}>
                  {item?.subprocessName || "Subprocess"}
                </Text>
              </View>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {getUnitSubtitle(item)}
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: theme.soft,
                  borderColor: theme.solid,
                },
              ]}
            >
              <Icon source={theme.icon} size={13} color={theme.accent} />
              <Text style={[styles.statusPillText, { color: theme.accent }]}>
                {bucket}
              </Text>
            </View>
          </View>

          <View style={styles.cardBottomRow}>
            <View style={styles.cardActionRow}>
              {item?.rejectionRemark ? (
                <Text style={styles.cardRemarkText} numberOfLines={2}>
                  {item.rejectionRemark}
                </Text>
              ) : (
                <Text style={styles.cardActionText}>
                  {canReviewChecklist ? "View submission" : "Open work"}
                </Text>
              )}
              <View style={styles.cardActionIcon}>
                <Icon source="arrow-top-right" size={14} color={colors.white} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [canReviewChecklist, getUnitSubtitle, getUnitWorkBucket, openWorkItem]
  );

  const renderScene = React.useCallback(
    ({ route: sceneRoute }) => {
      const items = unitsByTab[sceneRoute.key] || [];
      const isActive = routes[activeTabIndex]?.key === sceneRoute.key;

      return (
        <FlatList
          data={items}
          keyExtractor={(unit, index) =>
            String(
              unit?.id ||
                unit?.submissionId ||
                unit?.omsId ||
                `${sceneRoute.key}-${index}`
            )
          }
          renderItem={renderUnitCard}
          contentContainerStyle={styles.sceneContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconShell}>
                <Icon
                  source="layers-search-outline"
                  size={28}
                  color={colors.primaryBlue}
                />
              </View>
              <Text style={styles.emptyTitle}>No items in {sceneRoute.title}</Text>
              <Text style={styles.emptyText}>This lane is currently clear.</Text>
            </View>
          }
          ListFooterComponent={
            isActive && items.length > 0 && (canLoadMore || isFetchingMore) ? (
              <View style={styles.loadMoreWrap}>
                {isFetchingMore ? (
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                ) : (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={loadMore}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.loadMoreButtonText}>Load More</Text>
                    <Icon
                      source="chevron-down"
                      size={16}
                      color={colors.primaryBlue}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
        />
      );
    },
    [
      activeTabIndex,
      canLoadMore,
      isFetchingMore,
      isRefreshing,
      loadMore,
      refresh,
      renderUnitCard,
      routes,
      unitsByTab,
    ]
  );

  const renderTabBar = React.useCallback(
    (props) => (
      <TabBar
        {...props}
        scrollEnabled
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
        tabStyle={styles.tabStyle}
        pressColor="transparent"
        pressOpacity={0.88}
        indicatorStyle={styles.tabIndicator}
        indicatorContainerStyle={styles.tabIndicatorContainer}
        gap={0}
        renderLabel={({ route: tabRoute, focused }) => {
          const count = Number(countsByTab?.[tabRoute.title] || 0);

          return (
            <View style={styles.tabItem}>
              <Text
                style={[
                  styles.tabLabel,
                  focused && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {tabRoute.title}
              </Text>
              <View
                style={[
                  styles.tabCountBadge,
                  focused && styles.tabCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    focused && styles.tabCountTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </View>
          );
        }}
      />
    ),
    [countsByTab]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        visible={isRejectRemarkModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleRejectModalRequestClose}
      >
        <Pressable
          style={styles.rejectModalBackdrop}
          onPress={handleRejectModalRequestClose}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.rejectModalRoot}
          >
            <Pressable style={styles.rejectModalCard} onPress={() => {}}>
              <Text style={styles.rejectModalTitle}>Reject Remark</Text>
              <Text style={styles.rejectModalSubtitle}>
                Add a short remark before sending this subprocess back.
              </Text>

              <TextInput
                style={[
                  styles.reviewRemarkInput,
                  styles.rejectModalInput,
                  reviewError && styles.reviewRemarkInputError,
                ]}
                placeholder="Write reject remark"
                placeholderTextColor={colors.textSecondary}
                multiline
                value={reviewRemark}
                onChangeText={updateReviewRemark}
                textAlignVertical="top"
                autoFocus
              />

              {reviewError ? (
                <Text style={styles.reviewErrorText}>{reviewError}</Text>
              ) : null}

              <View style={styles.rejectModalActionRow}>
                <TouchableOpacity
                  style={[
                    styles.reviewActionButton,
                    styles.reviewCancelButton,
                    isWorkflowSubmitting && styles.reviewActionButtonDisabled,
                  ]}
                  activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                  disabled={isWorkflowSubmitting}
                  onPress={closeRejectRemarkModal}
                >
                  <Text style={styles.reviewCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.reviewActionButton,
                    styles.reviewRejectButton,
                    isWorkflowSubmitting && styles.reviewActionButtonDisabled,
                  ]}
                  activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                  disabled={isWorkflowSubmitting}
                  onPress={submitRejectFromModal}
                >
                  {isWorkflowSubmitting ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <Text style={styles.reviewRejectText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={handleBack} size={22} />
          <Text style={styles.headerTitle}>Work Status</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.headerCard}>
          {contextChips.length ? (
            <View style={styles.contextRow}>
              {contextChips.map((item) => (
                <View key={item} style={styles.contextChip}>
                  <Text style={styles.contextChipText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Search by Node or Subprocess"
            onChangeText={setSearch}
            value={search}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor={colors.textSecondary}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {isLoading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={styles.stateText}>Loading board…</Text>
          </View>
        ) : error ? (
          <View style={styles.stateWrap}>
            <View style={styles.emptyIconShell}>
              <Icon source="alert-circle-outline" size={28} color={colors.primaryOrange} />
            </View>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.88}
              onPress={refresh}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TabView
            navigationState={{
              index: activeTabIndex,
              routes,
            }}
            renderScene={renderScene}
            onIndexChange={setActiveTabIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={renderTabBar}
            lazy
            style={styles.tabView}
            sceneContainerStyle={styles.sceneContainer}
            swipeEnabled={false}
          />
        )}
      </View>

      <Modal
        visible={Boolean(selectedHistoryWorkItem)}
        transparent
        animationType="slide"
        onRequestClose={closeSubmissionHistory}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={closeSubmissionHistory}
          />

          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetEyebrow}>
                  {selectedHistoryWorkItem?.omsName ||
                    selectedHistoryWorkItem?.omsId ||
                    "OMS"}
                </Text>
                <Text style={styles.sheetTitle}>Submission History</Text>
                <Text style={styles.sheetSubtitle}>
                  Track each workflow step for this subprocess submission.
                </Text>
              </View>

              <IconButton
                icon="close"
                size={20}
                iconColor={colors.textDark}
                onPress={closeSubmissionHistory}
              />
            </View>

            <View style={styles.historySummaryCard}>
              <View style={styles.historySummaryBlock}>
                <Text style={styles.historySummaryLabel}>Current Status</Text>
                <Text style={styles.historySummaryValue}>
                  {toTitleCase(submissionHistory?.currentStatus || "pending")}
                </Text>
              </View>

              <View style={styles.historySummaryDivider} />

              <View style={styles.historySummaryBlock}>
                <Text style={styles.historySummaryLabel}>Comments</Text>
                <Text style={styles.historySummaryValue}>
                  {Number(submissionHistory?.rejectionCount || 0)}
                </Text>
              </View>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={[
                styles.sheetScrollContent,
                { paddingBottom: historySheetBottomPadding },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {isSubmissionHistoryLoading ? (
                <View style={styles.sheetStateCard}>
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                  <Text style={styles.sheetStateText}>
                    Loading submission history...
                  </Text>
                </View>
              ) : submissionHistoryError ? (
                <View style={styles.sheetStateCard}>
                  <Text style={styles.sheetStateText}>
                    {submissionHistoryError}
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    activeOpacity={0.88}
                    onPress={refreshSubmissionHistory}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (submissionHistory?.history || []).length ? (
                <View style={styles.historyTimeline}>
                  {(submissionHistory?.history || []).map((entry, index) => (
                    <View
                      key={`${entry.action}-${entry.actionAt}-${index}`}
                      style={styles.historyItem}
                    >
                      <View style={styles.historyRail}>
                        <View style={styles.historyDot} />
                        {index !== (submissionHistory?.history || []).length - 1 ? (
                          <View style={styles.historyLine} />
                        ) : null}
                      </View>

                      <View style={styles.historyCard}>
                        <View style={styles.historyCardTopRow}>
                          <Text style={styles.historyActionText}>
                            {toTitleCase(entry.action)}
                          </Text>
                          <Text style={styles.historyDateText}>
                            {formatHistoryDate(entry.actionAt)}
                          </Text>
                        </View>

                        <Text style={styles.historyActorText}>
                          {entry.actorName || "Unknown"}
                          {entry.actorRole
                            ? ` • ${toTitleCase(entry.actorRole)}`
                            : ""}
                        </Text>

                        {entry.remark ? (
                          <Text style={styles.historyRemarkText}>
                            {entry.remark}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.sheetStateCard}>
                  <Text style={styles.sheetStateText}>
                    No history is available for this submission yet.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(selectedWorkItem)}
        transparent
        animationType="slide"
        onRequestClose={closeWorkItemSheet}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={closeWorkItemSheet} />

          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetEyebrow}>
                  {selectedProcess?.name || selectedWorkItem?.processName || "Process"}
                </Text>
                <Text style={styles.sheetTitle}>
                  {selectedSubprocess?.name ||
                    selectedWorkItem?.subprocessName ||
                    "Subprocess"}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  Check the submitted details and continue workflow from here.
                </Text>
              </View>

              <IconButton
                icon="close"
                size={20}
                iconColor={colors.textDark}
                onPress={closeWorkItemSheet}
              />
            </View>

            <View style={styles.sheetStatusRow}>
              <View style={styles.sheetStatusGroup}>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        (TAB_THEME[getUnitWorkBucket(selectedWorkItem)] || TAB_THEME.Pending)
                          .soft,
                      borderColor:
                        (TAB_THEME[getUnitWorkBucket(selectedWorkItem)] || TAB_THEME.Pending)
                          .solid,
                    },
                  ]}
                >
                  <Icon
                    source={
                      (TAB_THEME[getUnitWorkBucket(selectedWorkItem)] || TAB_THEME.Pending).icon
                    }
                    size={13}
                    color={
                      (TAB_THEME[getUnitWorkBucket(selectedWorkItem)] || TAB_THEME.Pending)
                        .accent
                    }
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          (TAB_THEME[getUnitWorkBucket(selectedWorkItem)] || TAB_THEME.Pending)
                            .accent,
                      },
                    ]}
                  >
                    {selectedWorkflowStatusKey === "submitted"
                      ? "Submitted"
                      : getUnitWorkBucket(selectedWorkItem)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.historyButton}
                  activeOpacity={0.88}
                  onPress={openSubmissionHistory}
                >
                  <Icon source="history" size={14} color={colors.primaryBlue} />
                  <Text style={styles.historyButtonText}>History</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetStatusCount}>
                {selectedChecklistItems.length} checklist
                {selectedChecklistItems.length === 1 ? "" : "s"}
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
              {isSelectedProgressLoading ? (
                <View style={styles.sheetStateCard}>
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                  <Text style={styles.sheetStateText}>
                    Loading submitted subprocess details...
                  </Text>
                </View>
              ) : selectedProgressError ? (
                <View style={styles.sheetStateCard}>
                  <Text style={styles.sheetStateText}>{selectedProgressError}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    activeOpacity={0.88}
                    onPress={refreshSelectedProgress}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {selectedChecklistItems.map((checklist, index) => (
                    (() => {
                      const simpleChecklistState =
                        getSimpleChecklistState(checklist);

                      return (
                        <View
                          key={checklist.id}
                          style={[
                            styles.checklistCard,
                            simpleChecklistState && styles.checklistCardCompact,
                            index === selectedChecklistItems.length - 1 &&
                              styles.checklistCardLast,
                          ]}
                        >
                          {simpleChecklistState ? (
                            <View style={styles.checklistInlineRow}>
                              <View style={styles.checklistInlineCopy}>
                                <Text style={styles.checklistTitle}>
                                  {checklist.name}
                                </Text>
                                {!checklist.isRequired ? (
                                  <Text style={styles.optionalText}>Optional</Text>
                                ) : null}
                              </View>

                              <View
                                style={[
                                  styles.checklistInlineStatus,
                                  {
                                    backgroundColor:
                                      simpleChecklistState.backgroundColor,
                                    borderColor: simpleChecklistState.borderColor,
                                  },
                                ]}
                              >
                                <Icon
                                  source={simpleChecklistState.icon}
                                  size={18}
                                  color={simpleChecklistState.color}
                                />
                              </View>
                            </View>
                          ) : (
                            <View style={styles.checklistHead}>
                              <View style={styles.checklistCopy}>
                                <Text style={styles.checklistTitle}>
                                  {checklist.name}
                                </Text>
                                {!checklist.isRequired ? (
                                  <Text style={styles.optionalText}>Optional</Text>
                                ) : null}
                                <ChecklistValueBlock checklist={checklist} />
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })()
                  ))}

                  {selectedDetailItems.length ? (
                    <View style={styles.reviewDetailsSection}>
                      <Text style={styles.sectionBlockTitle}>Review Details</Text>
                      <View style={styles.detailMetaGrid}>
                        {selectedDetailItems.map((item) => (
                          <View key={item.key} style={styles.detailMetaCard}>
                            <Text style={styles.detailMetaLabel}>{item.label}</Text>
                            <Text style={styles.detailMetaValue}>{item.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {canReviewChecklist ? (
                    <View style={styles.workflowSection}>
                      <Text style={styles.sectionBlockTitle}>Workflow</Text>
                      <Text style={styles.reviewActionSubtitle}>
                        {selectedWorkflowStatusKey === "commented"
                          ? "This subprocess was commented and is waiting for field rectification."
                          : selectedWorkflowStatusKey === "approved"
                          ? "This subprocess is already approved."
                          : selectedWorkflowStatusKey === "verified" && !canApproveSelected
                          ? "This subprocess is already verified."
                          : selectedWorkflowStatusKey === "verified"
                          ? "This subprocess is verified and ready for approval."
                          : "This submitted subprocess is ready for review."}
                      </Text>

                      {reviewError && !isRejectRemarkModalVisible ? (
                        <Text style={styles.reviewErrorText}>{reviewError}</Text>
                      ) : null}

                      {canVerifySelected || canApproveSelected || canRejectSelected ? (
                        <View style={styles.reviewActionRow}>
                          {canRejectSelected ? (
                            <TouchableOpacity
                              style={[
                                styles.reviewActionButton,
                                styles.reviewRejectButton,
                                isWorkflowSubmitting &&
                                  styles.reviewActionButtonDisabled,
                              ]}
                              activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                              disabled={isWorkflowSubmitting}
                              onPress={openRejectRemarkModal}
                            >
                              <Text style={styles.reviewRejectText}>Reject</Text>
                            </TouchableOpacity>
                          ) : null}

                          {canVerifySelected ? (
                            <TouchableOpacity
                              style={[
                                styles.reviewActionButton,
                                styles.reviewVerifyButton,
                                isWorkflowSubmitting &&
                                  styles.reviewActionButtonDisabled,
                              ]}
                              activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                              disabled={isWorkflowSubmitting}
                              onPress={() => submitWorkItemAction("verify")}
                            >
                              {isWorkflowSubmitting ? (
                                <ActivityIndicator
                                  size="small"
                                  color={colors.primaryBlue}
                                />
                              ) : (
                                <Text style={styles.reviewVerifyText}>Verify</Text>
                              )}
                            </TouchableOpacity>
                          ) : null}

                          {canApproveSelected ? (
                            <TouchableOpacity
                              style={[
                                styles.reviewActionButton,
                                styles.reviewApproveButton,
                                isWorkflowSubmitting &&
                                  styles.reviewActionButtonDisabled,
                              ]}
                              activeOpacity={isWorkflowSubmitting ? 1 : 0.9}
                              disabled={isWorkflowSubmitting}
                              onPress={() => submitWorkItemAction("approve")}
                            >
                              {isWorkflowSubmitting ? (
                                <ActivityIndicator size="small" color={colors.white} />
                              ) : (
                                <Text style={styles.reviewApproveText}>Approve</Text>
                              )}
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      ) : (
                        <View style={styles.workflowStateNotice}>
                          <Text style={styles.workflowStateNoticeText}>
                            {selectedWorkflowStatusKey === "approved"
                              ? "Approved"
                              : selectedWorkflowStatusKey === "verified"
                              ? "Verified"
                              : "View only"}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default WorkStatusScreen;
