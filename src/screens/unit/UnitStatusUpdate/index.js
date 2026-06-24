import React from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button, IconButton } from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import styles from "./styles";
import colors from "../../../constants/colors";
import { Icons } from "../../../constants/icons";
import ImageViewerModal from "../../../components/ImageViewerModal";
import useUnitStatusUpdateViewModel from "../../../viewmodels/useUnitStatusUpdateViewModel";
import ChecklistSection from "./ChecklistSection";

const OUTLET_MANIFOLD_IMAGES = {
  2: require("../../../assets/images/2 outlet Manifold.png"),
  3: require("../../../assets/images/3 outlet Manifold.png"),
  4: require("../../../assets/images/4 outlet Manifold.png"),
  5: require("../../../assets/images/5 outlet Manifold.png"),
  6: require("../../../assets/images/6 outlet Manifold.png"),
  7: require("../../../assets/images/7 outlet Manifold.png"),
  8: require("../../../assets/images/8 outlet Manifold.png"),
};

const PEDESTAL_ENCLOSURE_SUBOPTION_ID = "pedestalEnclosureInstallation";
const PEDESTAL_PHOTO_DEPENDENCIES = {
  20: "99",
  23: "100",
  97: "25",
};
const PEDESTAL_STEP_GROUPS = [
  {
    key: "excavation",
    title: "Stage 1",
    subtitle: "Excavation pit",
    checklistIds: ["13"],
    repeatableChecklistIds: [],
  },
  {
    key: "outletInstallation",
    title: "Stage 2",
    subtitle: "Outlet identification, block, pipe and joint installation",
    checklistIds: ["14", "15", "17", "18", "19", "21", "20"],
    repeatableChecklistIds: ["22"],
  },
  {
    key: "backfill",
    title: "Stage 3",
    subtitle: "Backfill and final enclosure checks",
    checklistIds: ["23", "97"],
    repeatableChecklistIds: [],
  },
];

const getChecklistEntityId = (item = {}) =>
  String(item.checklistId || item.checklist_id || item.id || "").trim();

const normalizeCoordinate = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Number(numericValue.toFixed(6));
};

const areLocationsEqual = (first = null, second = null) => {
  const firstLatitude = normalizeCoordinate(first?.latitude);
  const firstLongitude = normalizeCoordinate(first?.longitude);
  const secondLatitude = normalizeCoordinate(second?.latitude);
  const secondLongitude = normalizeCoordinate(second?.longitude);

  if (
    firstLatitude === null ||
    firstLongitude === null ||
    secondLatitude === null ||
    secondLongitude === null
  ) {
    return false;
  }

  return firstLatitude === secondLatitude && firstLongitude === secondLongitude;
};

const ModuleStatusUpdateScreen = ({ navigation, route }) => {
  const safeAreaInsets = useSafeAreaInsets();
  const [referencePreviewState, setReferencePreviewState] = React.useState({
    visible: false,
    source: null,
    title: "",
  });
  const [photoActionState, setPhotoActionState] = React.useState({
    visible: false,
    requirement: null,
  });
  const formScrollRef = React.useRef(null);

  const {
    module,
    projectName,
    section,
    unitLabel,
    activeSubOption,
    activeSubOptionLabel,
    activeSubOptionId,
    stepSubmissionStateById,
    setActiveSubOptionId,
    activeValues,
    activeErrors,
    designSubChakQuantity,
    showStatusField,
    showRemarkField,
    isReadOnly,
    readOnlyTitle,
    readOnlyNotice,
    isCommentedForEdit,
    isModifyApprovedForEdit,
    canAddCommentedPhoto,
    commentedRemark,
    isRemarkRequired,
    checklistItems,
    photoRequirements,
    selectFields,
    inputFields,
    repeatableGroups,
    pickerState,
    photoPreviewState,
    openSelectModal,
    getPickerSelectedValue,
    selectPickerValue,
    closePicker,
    getRepeatableSelectOptions,
    updateInputValue,
    updateRemarkValue,
    updateRepeatableGroupItem,
    addRepeatableGroupItem,
    removeRepeatableGroupItem,
    toggleChecklistItem,
    toggleOutletSubChakItem,
    getChecklistProgress,
    openMapForLocation,
    updateNodeLocation,
    confirmUpdatedLocation,
    discardPendingUpdatedLocation,
    isUpdatingLocation,
    isSubmitting,
    pickFromCamera,
    pickFromGallery,
    removeSelectedPhoto,
    addCommentedPhotoUpload,
    dismissCommentedPhotoUpload,
    submitActiveSubOption,
    handleBack,
    getSubOptionLabel,
    openPhotoPreview,
    closePhotoPreview,
    statusOptions,
    isPhotoProcessing,
    photoProcessingRequirementId,
    photoProcessingMessage,
  } = useUnitStatusUpdateViewModel(navigation, route);

  const checklistProgress = getChecklistProgress();
  const hasDistinctUpdatedLocation = Boolean(
    activeValues.updatedLocation &&
    !areLocationsEqual(
      activeValues.updatedLocation,
      activeValues.defaultLocation,
    ),
  );
  const locationCards = [
    {
      key: "default",
      label: "Default Address",
      address: activeValues.defaultAddress || "Address not available",
      location: activeValues.defaultLocation,
      meta: "Saved project location",
      disabled: !activeValues.defaultLocation,
    },
    {
      key: "updated",
      label: "Updated Address",
      address: activeValues.updatedAddress || "Not updated",
      location: activeValues.updatedLocation,
      meta: activeValues.updatedAt
        ? `Updated on ${activeValues.updatedAt}`
        : "Current location not captured yet",
      disabled: !hasDistinctUpdatedLocation,
    },
  ].filter(
    (item) =>
      !(item.key === "default" && item.disabled) &&
      !(item.key === "updated" && item.disabled),
  );
  const hasPendingUpdatedLocation = Boolean(
    activeValues.pendingUpdatedLocation,
  );
  const openReferencePreview = (source, title) => {
    setReferencePreviewState({
      visible: true,
      source,
      title,
    });
  };

  const closeReferencePreview = () => {
    setReferencePreviewState({
      visible: false,
      source: null,
      title: "",
    });
  };

  const openPhotoActionSheet = React.useCallback((requirement) => {
    const media = requirement ? activeValues.photos?.[requirement.id] : null;

    if (!requirement || isReadOnly || media?.source === "server") {
      return;
    }

    setPhotoActionState({
      visible: true,
      requirement,
    });
  }, [activeValues.photos, isReadOnly]);

  const closePhotoActionSheet = React.useCallback(() => {
    setPhotoActionState({
      visible: false,
      requirement: null,
    });
  }, []);

  const handlePhotoAction = React.useCallback(
    (source) => {
      const requirement = photoActionState.requirement;

      if (!requirement) {
        return;
      }

      closePhotoActionSheet();

      if (source === "camera") {
        pickFromCamera(requirement);
        return;
      }

      pickFromGallery(requirement);
    },
    [
      closePhotoActionSheet,
      photoActionState.requirement,
      pickFromCamera,
      pickFromGallery,
    ]
  );

  const scrollFocusedFieldIntoView = React.useCallback((event) => {
    const target = event?.target ?? event?.nativeEvent?.target ?? null;

    if (!target) {
      return;
    }

    requestAnimationFrame(() => {
      setTimeout(() => {
        formScrollRef.current?.scrollResponderScrollNativeHandleToKeyboard?.(
          target,
          80,
          true,
        );
      }, 80);
    });
  }, []);

  const renderSelectField = ({
    elementKey,
    label,
    field,
    value,
    options,
    placeholder,
    error,
    target,
  }) => (
    <View style={styles.fieldBlock} key={elementKey || field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.selectField,
          error && styles.selectFieldError,
          isReadOnly && styles.fieldDisabled,
        ]}
        onPress={() => {
          Keyboard.dismiss();
          openSelectModal({
            field,
            title: label,
            options,
            target,
          });
        }}
        activeOpacity={isReadOnly ? 1 : 0.86}
        disabled={isReadOnly}
      >
        <Text style={[styles.selectValue, !value && styles.selectPlaceholder]}>
          {value || placeholder}
        </Text>
        <Icons.down width={12} height={12} />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  const renderInputField = ({ field }) => (
    <View style={styles.fieldBlock} key={field.key}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      <TextInput
        style={[
          styles.singleLineInput,
          activeErrors[field.key] && styles.selectFieldError,
          isReadOnly && styles.readOnlyInput,
        ]}
        placeholder={field.placeholder || "Enter value"}
        placeholderTextColor={colors.textSecondary}
        keyboardType={field.keyboardType || "default"}
        editable={!isReadOnly}
        value={activeValues[field.key]}
        onChangeText={(text) => updateInputValue(field.key, text)}
      />
      {activeErrors[field.key] ? (
        <Text style={styles.errorText}>{activeErrors[field.key]}</Text>
      ) : null}
    </View>
  );

  const renderRepeatableGroup = (group) => {
    const items = activeValues.repeatableGroups?.[group.key] || [];
    const groupErrors = activeErrors.repeatableGroups?.[group.key] || {};
    const referenceImage = group.imageBySubChakQuantity
      ? OUTLET_MANIFOLD_IMAGES[group.fixedItemCount]
      : null;

    return (
      <View style={styles.repeatableSection} key={group.key}>
        <View style={styles.repeatableHeader}>
          <View style={styles.repeatableTitleWrap}>
            <Text style={styles.repeatableTitle}>{group.title}</Text>
            {group.subtitle ? (
              <Text style={styles.repeatableSubtitle}>{group.subtitle}</Text>
            ) : null}
          </View>
        </View>

        {referenceImage ? (
          <TouchableOpacity
            style={styles.repeatableReferenceImageWrap}
            activeOpacity={0.9}
            onPress={() =>
              openReferencePreview(
                referenceImage,
                `${group.title} - ${group.fixedItemCount} Outlet`,
              )
            }
          >
            <Image
              source={referenceImage}
              style={styles.repeatableReferenceImage}
              resizeMode="contain"
            />
            <View style={styles.repeatableReferenceAction}>
              <Text style={styles.repeatableReferenceActionText}>
                View Image
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {items.map((item, itemIndex) => {
          const itemErrors = groupErrors.items?.[itemIndex] || {};
          const itemTitle = group.itemTitleField
            ? item[group.itemTitleField] ||
              (group.itemTitleFallbackPrefix
                ? `${group.itemTitleFallbackPrefix}${itemIndex + 1}`
                : itemIndex + 1)
            : itemIndex + 1;
          const displayFields = (group.itemFields || []).filter(
            (groupField) =>
              groupField.key !== group.itemTitleField &&
              groupField.hidden !== true,
          );

          return (
            <View
              style={styles.repeatableItemCard}
              key={`${group.key}_${itemIndex}`}
            >
              <View style={styles.repeatableCompactRow}>
                <View style={styles.repeatableValueBadge}>
                  <Text style={styles.repeatableValueText}>{itemTitle}</Text>
                </View>

                <View style={styles.repeatableFieldArea}>
                  {displayFields.length ? null : (
                    <Text style={styles.repeatableStaticText}>
                      {group.itemLabel || "Item"} {itemTitle}
                    </Text>
                  )}

                  <View
                    style={[
                      styles.repeatableFieldRow,
                      displayFields.length === 1 &&
                        styles.repeatableFieldRowSingle,
                    ]}
                  >
                    {displayFields.map((groupField) => {
                      const isOutletNaPipeSizeField =
                        groupField.key === "pipeSize" &&
                        String(item?.subChakName || "")
                          .trim()
                          .toUpperCase() === "NA";

                      if (groupField.type === "select") {
                        return (
                          <View
                            style={[
                              styles.repeatableInlineField,
                              styles.repeatableInlineFieldRowItem,
                            ]}
                            key={`${group.key}_${itemIndex}_${groupField.key}`}
                          >
                            <Text style={styles.repeatableInlineLabel}>
                              {groupField.label}
                            </Text>
                            <TouchableOpacity
                              style={[
                                styles.repeatableInlineSelect,
                                itemErrors[groupField.key] &&
                                  styles.selectFieldError,
                                (isReadOnly || isOutletNaPipeSizeField) &&
                                  styles.fieldDisabled,
                              ]}
                              onPress={() => {
                                if (isOutletNaPipeSizeField) {
                                  return;
                                }
                                Keyboard.dismiss();
                                openSelectModal({
                                  field: groupField.key,
                                  title: groupField.label,
                                  options: getRepeatableSelectOptions(
                                    group,
                                    itemIndex,
                                    groupField,
                                  ),
                                  target: {
                                    type: "repeatable",
                                    groupKey: group.key,
                                    itemIndex,
                                    fieldKey: groupField.key,
                                  },
                                });
                              }}
                              activeOpacity={isReadOnly ? 1 : 0.86}
                              disabled={isReadOnly || isOutletNaPipeSizeField}
                            >
                              <Text
                                style={[
                                  styles.repeatableInlineValue,
                                  !item[groupField.key] &&
                                    styles.selectPlaceholder,
                                ]}
                                numberOfLines={1}
                              >
                                {item[groupField.key] ||
                                  (isOutletNaPipeSizeField ? "NA" : "") ||
                                  groupField.placeholder ||
                                  "Select option"}
                              </Text>
                              <Icons.down width={12} height={12} />
                            </TouchableOpacity>
                            {itemErrors[groupField.key] ? (
                              <Text style={styles.errorText}>
                                {itemErrors[groupField.key]}
                              </Text>
                            ) : null}
                          </View>
                        );
                      }

                      return (
                        <View
                          style={[
                            styles.repeatableInlineField,
                            styles.repeatableInlineFieldRowItem,
                          ]}
                          key={`${group.key}_${itemIndex}_${groupField.key}`}
                        >
                          <Text style={styles.repeatableInlineLabel}>
                            {groupField.label}
                          </Text>
                          <TextInput
                            style={[
                              styles.repeatableInlineInput,
                              itemErrors[groupField.key] &&
                                styles.selectFieldError,
                              isReadOnly && styles.readOnlyInput,
                              groupField.readOnly && styles.readOnlyInput,
                            ]}
                            placeholder={
                              groupField.placeholder || "Enter value"
                            }
                            placeholderTextColor={colors.textSecondary}
                            keyboardType={groupField.keyboardType || "default"}
                            editable={
                              !isReadOnly && groupField.readOnly !== true
                            }
                            value={item[groupField.key]}
                            onChangeText={(text) =>
                              updateRepeatableGroupItem(
                                group.key,
                                itemIndex,
                                groupField.key,
                                text,
                              )
                            }
                          />
                          {itemErrors[groupField.key] ? (
                            <Text style={styles.errorText}>
                              {itemErrors[groupField.key]}
                            </Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </View>

                {items.length > (group.minItems || 0) ? (
                  <TouchableOpacity
                    style={[
                      styles.repeatableRemoveButton,
                      isReadOnly && styles.fieldDisabled,
                    ]}
                    activeOpacity={isReadOnly ? 1 : 0.86}
                    onPress={() => removeRepeatableGroupItem(group, itemIndex)}
                    disabled={isReadOnly}
                  >
                    <Text style={styles.repeatableRemoveText}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}

        {group.fixedItemCount ? null : (
          <TouchableOpacity
            style={[
              styles.repeatableAddButton,
              isReadOnly && styles.repeatableAddButtonDisabled,
              group.maxItems &&
                items.length >= group.maxItems &&
                styles.repeatableAddButtonDisabled,
            ]}
            activeOpacity={isReadOnly ? 1 : 0.86}
            onPress={() => addRepeatableGroupItem(group)}
            disabled={
              isReadOnly ||
              (group.maxItems ? items.length >= group.maxItems : false)
            }
          >
            <Text
              style={[
                styles.repeatableAddButtonText,
                group.maxItems &&
                  items.length >= group.maxItems &&
                  styles.repeatableAddButtonTextDisabled,
              ]}
            >
              {group.maxItems && items.length >= group.maxItems
                ? `Maximum ${group.maxItems} ${group.itemLabel || "item"} entries added`
                : group.addButtonLabel || "Add"}
            </Text>
          </TouchableOpacity>
        )}

        {groupErrors.message ? (
          <Text style={styles.errorText}>{groupErrors.message}</Text>
        ) : null}
      </View>
    );
  };

  const renderPhotoRequirement = (requirement, index = 0) => {
    const media = activeValues.photos?.[requirement.id];
    const slotError = activeErrors.photoSlots?.[requirement.id];
    const isProcessingPhoto = photoProcessingRequirementId === requirement.id;
    const isServerPrefilledPhoto = media?.source === "server";
    const canEditPhoto =
      !isReadOnly && !isServerPrefilledPhoto && !isProcessingPhoto;

    return (
      <View
        key={requirement.id}
        style={[
          styles.photoSlotCard,
          slotError && styles.photoSlotCardError,
        ]}
      >
        <View style={styles.photoSlotHeader}>
          <Text style={styles.photoSlotTitle}>
            {index + 1}. {requirement.label}
          </Text>
          {isCommentedForEdit ? (
            <TouchableOpacity
              style={styles.photoRemoveBtn}
              onPress={dismissCommentedPhotoUpload}
              disabled={!canEditPhoto}
            >
              <Text style={styles.photoRemoveBtnText}>Close</Text>
            </TouchableOpacity>
          ) : media && !isServerPrefilledPhoto ? (
            <TouchableOpacity
              style={styles.photoRemoveBtn}
              onPress={() => removeSelectedPhoto(requirement.id)}
              disabled={!canEditPhoto}
            >
              <Icons.delete height={20} width={20} />
              <Text style={styles.photoRemoveBtnText}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {!isServerPrefilledPhoto ? (
          <View style={styles.uploadActionsRow}>
            <TouchableOpacity
              style={[
                styles.uploadButton,
                styles.uploadCameraButton,
                !canEditPhoto && styles.fieldDisabled,
                isProcessingPhoto && styles.uploadButtonDisabled,
              ]}
              onPress={() => pickFromCamera(requirement)}
              activeOpacity={canEditPhoto ? 0.88 : 1}
              disabled={!canEditPhoto}
            >
              {isProcessingPhoto ? (
                <ActivityIndicator size="small" color={colors.primaryBlue} />
              ) : (
                <Icons.uploadfile height={22} width={22} />
              )}
              <Text style={styles.uploadButtonText}>
                {isProcessingPhoto
                  ? "Preparing Photo..."
                  : media
                    ? "Retake Photo"
                    : "Open Camera"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.uploadButton,
                styles.uploadGalleryButton,
                !canEditPhoto && styles.fieldDisabled,
                isProcessingPhoto && styles.uploadButtonDisabled,
              ]}
              onPress={() => pickFromGallery(requirement)}
              activeOpacity={canEditPhoto ? 0.88 : 1}
              disabled={!canEditPhoto}
            >
              <Icons.gallery height={22} width={22} />
              <Text style={styles.uploadGalleryButtonText}>
                {media ? "Replace from Gallery" : "Open Gallery"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isProcessingPhoto ? (
          <View style={styles.photoProcessingWrap}>
            <ActivityIndicator size="small" color={colors.primaryBlue} />
            <Text style={styles.photoProcessingText}>
              {photoProcessingMessage || "Preparing image..."}
            </Text>
          </View>
        ) : null}

        {media?.uri ? (
          <TouchableOpacity
            style={styles.photoPreviewWrap}
            onPress={() => openPhotoPreview(requirement.id)}
            activeOpacity={0.9}
            disabled={isProcessingPhoto}
          >
            {media.mediaType === "video" ? (
              <View style={styles.videoPreviewPlaceholder}>
                <Text style={styles.videoPreviewText}>Video Selected</Text>
              </View>
            ) : (
              <Image
                source={{ uri: media.uri }}
                style={styles.photoPreviewImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.photoMetaCard}>
              <Text style={styles.photoMetaText}>
                Size: {media.sizeKb ? `${media.sizeKb}KB` : "Unknown"}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.photoEmptyText}>No file selected</Text>
        )}

        {slotError ? <Text style={styles.errorText}>{slotError}</Text> : null}
      </View>
    );
  };

  const getChecklistProgressForItems = (items = []) => ({
    total: items.length,
    completed: items.filter((item) => activeValues.checks?.[item.id]).length,
  });

  const pedestalPhotoDependencyByChecklistId = Object.entries(
    PEDESTAL_PHOTO_DEPENDENCIES
  ).reduce((acc, [checklistId, photoChecklistId]) => {
    const requirement = photoRequirements.find(
      (item) => getChecklistEntityId(item) === photoChecklistId
    );

    if (requirement) {
      acc[checklistId] = requirement;
    }

    return acc;
  }, {});

  const sortByConfiguredChecklistOrder = (items = [], order = []) => {
    const orderById = new Map(order.map((id, index) => [String(id), index]));

    return [...items].sort((first, second) => {
      const firstOrder = orderById.get(getChecklistEntityId(first)) ?? 999;
      const secondOrder = orderById.get(getChecklistEntityId(second)) ?? 999;

      return firstOrder - secondOrder;
    });
  };

  const renderPedestalStepView = () => (
    <View style={styles.pedestalStepsWrap}>
      {PEDESTAL_STEP_GROUPS.map((step) => {
        const stepChecklistItems = sortByConfiguredChecklistOrder(
          checklistItems.filter((item) =>
            step.checklistIds.includes(getChecklistEntityId(item))
          ),
          step.checklistIds
        );
        const stepRepeatableGroups = repeatableGroups.filter((group) =>
          step.repeatableChecklistIds.includes(getChecklistEntityId(group))
        );

        if (
          !stepChecklistItems.length &&
          !stepRepeatableGroups.length
        ) {
          return null;
        }

        return (
          <View style={styles.pedestalStepSection} key={step.key}>
            <View style={styles.pedestalStepHeader}>
              <View style={styles.pedestalStepNumberBadge}>
                <Text style={styles.pedestalStepNumberText}>
                  {step.title.replace("Stage ", "")}
                </Text>
              </View>
              <View style={styles.pedestalStepTitleWrap}>
                <Text style={styles.pedestalStepTitle}>{step.title}</Text>
                <Text style={styles.pedestalStepSubtitle}>
                  {step.subtitle}
                </Text>
              </View>
            </View>

            {stepRepeatableGroups.map((group) => renderRepeatableGroup(group))}

            {stepChecklistItems.length ? (
              <ChecklistSection
                checklistItems={stepChecklistItems}
                checklistProgress={getChecklistProgressForItems(
                  stepChecklistItems
                )}
                activeValues={activeValues}
                isReadOnly={isReadOnly}
                toggleChecklistItem={toggleChecklistItem}
                toggleOutletSubChakItem={toggleOutletSubChakItem}
                activeSubOptionId={activeSubOptionId}
                inputFields={inputFields}
                subChakQuantity={designSubChakQuantity}
                photoDependencyByChecklistId={
                  pedestalPhotoDependencyByChecklistId
                }
                onPhotoDependencyPress={openPhotoActionSheet}
              />
            ) : null}
          </View>
        );
      })}

    </View>
  );

  const shouldUsePedestalStepView =
    activeSubOptionId === PEDESTAL_ENCLOSURE_SUBOPTION_ID &&
    !isCommentedForEdit;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.keyboardContainer}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={handleBack} />
          <Text style={styles.headerTitle}>{section.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAwareScrollView
          innerRef={formScrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          enableAutomaticScroll
          extraScrollHeight={24}
        >
          <View style={styles.projectCard}>
            <View style={styles.projectTopRow}>
              <View style={styles.projectNameWrap}>
                <Text style={styles.projectLabel}>Project</Text>
                <Text style={styles.projectText} numberOfLines={2}>
                  {projectName}
                </Text>
              </View>

              <View style={styles.unitNumberBadge}>
                <Text style={styles.unitNumberLabel}>{module} No.</Text>
                <Text style={styles.unitNumberText} numberOfLines={1}>
                  {unitLabel}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.stepHeaderRow}>
            <Text style={styles.stepTitle}>Update Steps</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.stepScroll}
            contentContainerStyle={styles.stepScrollContent}
          >
            {section.subOptions.map((sub, index) =>
              (() => {
                const submissionState = stepSubmissionStateById[sub.id] || {};
                const isSubmitted = Boolean(submissionState.isSubmitted);
                const isPartial = Boolean(submissionState.isPartial);
                const isCommented = Boolean(submissionState.isCommented);
                const isFilled = isSubmitted || isPartial;

                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.stepChip,
                      sub.id === activeSubOptionId && styles.stepChipActive,
                      isFilled && styles.stepChipSubmitted,
                    ]}
                    onPress={() => setActiveSubOptionId(sub.id)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.stepChipNumber,
                        sub.id === activeSubOptionId &&
                          styles.stepChipNumberActive,
                        isFilled && styles.stepChipNumberSubmitted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepChipNumberText,
                          sub.id === activeSubOptionId &&
                            styles.stepChipNumberTextActive,
                          isFilled && styles.stepChipNumberTextSubmitted,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.stepChipContent}>
                      <Text
                        style={[
                          styles.stepChipText,
                          sub.id === activeSubOptionId &&
                            styles.stepChipTextActive,
                          isFilled && styles.stepChipTextSubmitted,
                        ]}
                        numberOfLines={2}
                      >
                        {getSubOptionLabel(sub)}
                      </Text>
                      {isCommented ? (
                        <Text
                          style={[
                            styles.stepChipStatus,
                            sub.id === activeSubOptionId &&
                              styles.stepChipStatusActive,
                          ]}
                        >
                          Commented
                        </Text>
                      ) : isPartial ? (
                        <Text
                          style={[
                            styles.stepChipStatus,
                            sub.id === activeSubOptionId &&
                              styles.stepChipStatusActive,
                          ]}
                        >
                          Partial
                        </Text>
                      ) : isSubmitted ? (
                        <Text
                          style={[
                            styles.stepChipStatus,
                            sub.id === activeSubOptionId &&
                              styles.stepChipStatusActive,
                          ]}
                        >
                          Submitted
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.stepChipDot,
                        sub.id === activeSubOptionId &&
                          styles.stepChipDotActive,
                        isFilled && styles.stepChipDotSubmitted,
                      ]}
                    />
                  </TouchableOpacity>
                );
              })(),
            )}
          </ScrollView>

          <View style={styles.formCard}>
            <View style={styles.formHeadingRow}>
              <Text style={styles.formTitle}>{activeSubOptionLabel}</Text>
            </View>

            {isReadOnly ? (
              <View style={styles.readOnlyBanner}>
                <Text style={styles.readOnlyBannerTitle}>{readOnlyTitle}</Text>
                <Text style={styles.readOnlyBannerText}>{readOnlyNotice}</Text>
              </View>
            ) : null}

            {isCommentedForEdit && commentedRemark ? (
              <View style={styles.readOnlyBanner}>
                <Text style={styles.readOnlyBannerTitle}>Comment</Text>
                <Text style={styles.readOnlyBannerText}>{commentedRemark}</Text>
              </View>
            ) : null}

            {isModifyApprovedForEdit ? (
              <View style={styles.readOnlyBanner}>
                <Text style={styles.readOnlyBannerTitle}>Modify Approved</Text>
                <Text style={styles.readOnlyBannerText}>
                  Update checklist values only. Photo changes are disabled for this request.
                </Text>
              </View>
            ) : null}

            {showStatusField
              ? renderSelectField({
                  elementKey: "status",
                  label: activeSubOption.statusLabel || "Status",
                  field: "status",
                  value: activeValues.status,
                  options: statusOptions,
                  placeholder: "Select Status",
                  error: activeErrors.status,
                })
              : null}

            {selectFields.map((field) =>
              renderSelectField({
                elementKey: field.key,
                label: field.label,
                field: field.key,
                value: activeValues[field.key],
                options: field.options,
                placeholder: field.placeholder || "Select Option",
                error: activeErrors[field.key],
              }),
            )}

            {inputFields
              .filter(
                (field) =>
                  !(
                    activeSubOptionId === "outletPipeLaying" &&
                    String(
                      field.checklistId || field.checklist_id || "",
                    ).trim() === "7"
                  ),
              )
              .map((field) => renderInputField({ field }))}

            {shouldUsePedestalStepView ? (
              renderPedestalStepView()
            ) : (
              <>
                {repeatableGroups.map((group) => renderRepeatableGroup(group))}

                <ChecklistSection
                  checklistItems={checklistItems}
                  checklistProgress={checklistProgress}
                  activeValues={activeValues}
                  isReadOnly={isReadOnly}
                  toggleChecklistItem={toggleChecklistItem}
                  toggleOutletSubChakItem={toggleOutletSubChakItem}
                  activeSubOptionId={activeSubOptionId}
                  inputFields={inputFields}
                  subChakQuantity={designSubChakQuantity}
                />
              </>
            )}

            {showRemarkField ? (
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  {activeSubOption.remarkLabel || "Remark"}
                  {isRemarkRequired ? " *" : ""}
                </Text>
                <TextInput
                  style={[
                    styles.remarkInput,
                    activeErrors.remark && styles.selectFieldError,
                    isReadOnly && styles.readOnlyInput,
                  ]}
                  placeholder="Write remarks"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  editable={!isReadOnly}
                  value={activeValues.remark}
                  onFocus={scrollFocusedFieldIntoView}
                  onChangeText={updateRemarkValue}
                  textAlignVertical="top"
                />
                {activeErrors.remark ? (
                  <Text style={styles.errorText}>{activeErrors.remark}</Text>
                ) : null}
              </View>
            ) : null}

            {canAddCommentedPhoto ? (
              <View style={styles.optionalPhotoPrompt}>
                <View style={styles.optionalPhotoCopy}>
                  <Text style={styles.optionalPhotoTitle}>
                    Add rectification photo
                  </Text>
                  <Text style={styles.optionalPhotoText}>
                    Add only if a fresh photo is needed for this commented subprocess.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.optionalPhotoAddButton}
                  activeOpacity={0.88}
                  onPress={addCommentedPhotoUpload}
                >
                  <Text style={styles.optionalPhotoAddIcon}>+</Text>
                  <Text style={styles.optionalPhotoAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {photoRequirements.length ? (
              <View style={styles.photoSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.photoSectionTitle}>
                    Photos with Timestamp
                  </Text>
                  <View style={styles.sectionCountBadge}>
                    <Text style={styles.sectionCountBadgeText}>
                      {photoRequirements.length} photo
                      {photoRequirements.length === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.sectionHelperText}>
                  {isCommentedForEdit
                    ? "Capture fresh rectification photos for this commented subprocess."
                    : "Capture clear site photos so the submission is easy to verify."}
                </Text>

                {photoRequirements.map((requirement, index) =>
                  renderPhotoRequirement(requirement, index)
                )}

                {activeErrors.photos ? (
                  <Text style={styles.errorText}>{activeErrors.photos}</Text>
                ) : null}
              </View>
            ) : null}

            {activeSubOption.needsLocationActions ? (
              <View style={styles.locationSection}>
                <Text style={styles.locationTitle}>Node Location</Text>
                <View style={styles.locationCard}>
                  {locationCards.map((item) => (
                    <View
                      key={item.key}
                      style={[
                        styles.locationEntry,
                        item.disabled && styles.locationEntryMuted,
                      ]}
                    >
                      <View style={styles.locationEntryHeader}>
                        <Text style={styles.locationLabel}>{item.label}</Text>
                        <TouchableOpacity
                          style={[
                            styles.locationMiniBtn,
                            item.disabled && styles.locationMiniBtnDisabled,
                          ]}
                          onPress={() => openMapForLocation(item.location)}
                          disabled={item.disabled || isUpdatingLocation}
                          activeOpacity={0.88}
                        >
                          <Icons.googleIcon height={14} width={14} />
                          <Text
                            style={[
                              styles.locationMiniBtnText,
                              item.disabled &&
                                styles.locationMiniBtnTextDisabled,
                            ]}
                          >
                            Directions
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Text
                        style={[
                          styles.locationHighlightText,
                          item.disabled && styles.locationHighlightTextMuted,
                        ]}
                      >
                        {item.address}
                      </Text>
                      <Text style={styles.locationMetaText}>{item.meta}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.locationActionsRow}>
                  {activeSubOption.canUpdateLocation ? (
                    <View style={styles.locationPrimaryActions}>
                      <TouchableOpacity
                        style={[
                          styles.locationBtn,
                          styles.locationBtnPrimary,
                          isUpdatingLocation && styles.locationBtnDisabled,
                        ]}
                        onPress={updateNodeLocation}
                        disabled={isUpdatingLocation || isReadOnly}
                        activeOpacity={isReadOnly ? 1 : 0.88}
                      >
                        {isUpdatingLocation ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.white}
                          />
                        ) : (
                          <Icons.location height={22} width={22} />
                        )}
                        <Text style={styles.locationBtnPrimaryText}>
                          {isUpdatingLocation
                            ? "Fetching current location..."
                            : "Update Location"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {hasPendingUpdatedLocation ? (
                    <View style={styles.locationConfirmationCard}>
                      <Text style={styles.locationConfirmationTitle}>
                        Use this updated location?
                      </Text>
                      <Text style={styles.locationConfirmationAddress}>
                        {activeValues.pendingUpdatedAddress ||
                          "Resolving address..."}
                      </Text>
                      <Text style={styles.locationConfirmationMeta}>
                        {activeValues.pendingUpdatedAt
                          ? `Captured on ${activeValues.pendingUpdatedAt}`
                          : "New location captured"}
                      </Text>

                      <View style={styles.locationConfirmationActions}>
                        <TouchableOpacity
                          style={[
                            styles.locationBtn,
                            styles.locationBtnSecondary,
                          ]}
                          onPress={discardPendingUpdatedLocation}
                          disabled={isUpdatingLocation || isReadOnly}
                          activeOpacity={isReadOnly ? 1 : 0.88}
                        >
                          <Text style={styles.locationBtnSecondaryText}>
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.locationBtn,
                            styles.locationBtnPrimary,
                          ]}
                          onPress={confirmUpdatedLocation}
                          disabled={isUpdatingLocation || isReadOnly}
                          activeOpacity={isReadOnly ? 1 : 0.88}
                        >
                          <Text style={styles.locationBtnPrimaryText}>
                            Yes, Use This
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {activeErrors.form ? (
              <Text style={styles.errorText}>{activeErrors.form}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={submitActiveSubOption}
              style={[
                styles.submitButton,
                (isSubmitting || isPhotoProcessing || isReadOnly) &&
                  styles.submitButtonDisabled,
              ]}
              contentStyle={styles.submitButtonContent}
              buttonColor={
                isSubmitting || isPhotoProcessing || isReadOnly
                  ? "#EAF1F8"
                  : colors.primaryBlue
              }
              textColor={
                isSubmitting || isPhotoProcessing || isReadOnly
                  ? colors.textSecondary
                  : colors.white
              }
              loading={isSubmitting}
              disabled={isSubmitting || isPhotoProcessing || isReadOnly}
            >
              {isSubmitting
                ? "Saving"
                : isPhotoProcessing
                  ? "Preparing Photo..."
                  : isReadOnly
                    ? readOnlyTitle === "Already Submitted"
                      ? "Submitted"
                      : readOnlyTitle === "Already Updated"
                        ? "Updated"
                        : readOnlyTitle === "Info Status"
                          ? "Info"
                          : "Locked"
                    : "Submit"}
            </Button>
          </View>
        </KeyboardAwareScrollView>
      </View>

      <Modal
        visible={pickerState.visible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pickerState.title}</Text>

            <ScrollView>
              {pickerState.options.map((item) => {
                const optionValue =
                  typeof item === "string"
                    ? item
                    : String(item?.value ?? item?.label ?? "").trim();
                const optionLabel =
                  typeof item === "string"
                    ? item
                    : String(item?.label ?? item?.value ?? "").trim();
                const optionDisabled =
                  typeof item === "object" && Boolean(item?.disabled);
                const selected = getPickerSelectedValue() === optionValue;

                return (
                  <TouchableOpacity
                    key={optionValue}
                    style={[
                      styles.modalOption,
                      optionDisabled && styles.modalOptionDisabled,
                      selected && styles.modalOptionActive,
                    ]}
                    onPress={() =>
                      optionDisabled ? null : selectPickerValue(optionValue)
                    }
                    disabled={optionDisabled}
                  >
                    <View style={styles.modalOptionContent}>
                      <Text
                        style={[
                          styles.modalOptionText,
                          optionDisabled && styles.modalOptionTextDisabled,
                          selected && styles.modalOptionTextActive,
                        ]}
                      >
                        {optionLabel}
                      </Text>
                      <View
                        style={[
                          styles.modalOptionIndicator,
                          optionDisabled && styles.modalOptionIndicatorDisabled,
                          selected && styles.modalOptionIndicatorActive,
                        ]}
                      >
                        {selected ? (
                          <Text style={styles.modalOptionIndicatorText}>✓</Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={closePicker}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={photoActionState.visible}
        transparent
        animationType="slide"
        onRequestClose={closePhotoActionSheet}
      >
        <View style={styles.photoActionOverlay}>
          <TouchableOpacity
            style={styles.photoActionBackdrop}
            activeOpacity={1}
            onPress={closePhotoActionSheet}
          />
          <IconButton
            icon="close"
            iconColor={colors.primaryBlue}
            size={22}
            style={[
              styles.photoActionFloatingClose,
              { bottom: safeAreaInsets.bottom + 154 },
            ]}
            onPress={closePhotoActionSheet}
          />
          <View
            style={[
              styles.photoActionSheet,
              { paddingBottom: safeAreaInsets.bottom + 18 },
            ]}
          >
            <View style={styles.photoActionHandle} />
            <Text style={styles.photoActionTitle}>
              {photoActionState.requirement?.label || "Select photo"}
            </Text>
            <View style={styles.photoActionRow}>
              <TouchableOpacity
                style={[
                  styles.photoActionButton,
                  styles.photoActionCameraButton,
                ]}
                activeOpacity={0.88}
                onPress={() => handlePhotoAction("camera")}
              >
                <Icons.uploadfile height={22} width={22} />
                <Text style={styles.photoActionButtonText}>Open Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoActionButton}
                activeOpacity={0.88}
                onPress={() => handlePhotoAction("gallery")}
              >
                <Icons.gallery height={22} width={22} />
                <Text style={styles.photoActionButtonText}>Open Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ImageViewerModal
        visible={
          photoPreviewState.visible &&
          photoPreviewState.media?.mediaType !== "video"
        }
        items={
          photoPreviewState.media?.uri
            ? [
                {
                  id: photoPreviewState.media.uri,
                  uri: photoPreviewState.media.uri,
                  title: activeSubOptionLabel,
                  meta: photoPreviewState.media.takenAt || "",
                },
              ]
            : []
        }
        onRequestClose={closePhotoPreview}
      />

      <ImageViewerModal
        visible={referencePreviewState.visible}
        items={
          referencePreviewState.source
            ? [
                {
                  id: referencePreviewState.title || "reference-image",
                  source: referencePreviewState.source,
                  title: referencePreviewState.title || "Reference Image",
                },
              ]
            : []
        }
        onRequestClose={closeReferencePreview}
      />
    </SafeAreaView>
  );
};

export default ModuleStatusUpdateScreen;
