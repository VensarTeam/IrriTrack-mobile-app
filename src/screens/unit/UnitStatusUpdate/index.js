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
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, IconButton } from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import styles from "./styles";
import colors from "../../../constants/colors";
import { Icons } from "../../../constants/icons";
import ImageViewerModal from "../../../components/ImageViewerModal";
import useUnitStatusUpdateViewModel from "../../../viewmodels/useUnitStatusUpdateViewModel";

const OUTLET_MANIFOLD_IMAGES = {
  2: require("../../../assets/images/2 outlet Manifold.png"),
  3: require("../../../assets/images/3 outlet Manifold.png"),
  4: require("../../../assets/images/4 outlet Manifold.png"),
  5: require("../../../assets/images/5 outlet Manifold.png"),
  6: require("../../../assets/images/6 outlet Manifold.png"),
  7: require("../../../assets/images/7 outlet Manifold.png"),
  8: require("../../../assets/images/8 outlet Manifold.png"),
};

const ModuleStatusUpdateScreen = ({ navigation, route }) => {
  const [referencePreviewState, setReferencePreviewState] = React.useState({
    visible: false,
    source: null,
    title: "",
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
    showStatusField,
    showRemarkField,
    isReadOnly,
    readOnlyTitle,
    readOnlyNotice,
    isCommentedForEdit,
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
    updateInputValue,
    updateRemarkValue,
    updateRepeatableGroupItem,
    addRepeatableGroupItem,
    removeRepeatableGroupItem,
    toggleChecklistItem,
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
  const compactMetaItems = [
    {
      key: "steps",
      label: `${section.subOptions.length} Step${
        section.subOptions.length === 1 ? "" : "s"
      }`,
    },
    {
      key: "checks",
      label: `${checklistProgress.total} Check${
        checklistProgress.total === 1 ? "" : "s"
      }`,
    },
  ];
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
      disabled: !activeValues.updatedLocation,
    },
  ].filter((item) => !(item.key === "default" && item.disabled));
  const hasPendingUpdatedLocation = Boolean(activeValues.pendingUpdatedLocation);

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

  const scrollFocusedFieldIntoView = React.useCallback((event) => {
    const target =
      event?.target ??
      event?.nativeEvent?.target ??
      null;

    if (!target) {
      return;
    }

    requestAnimationFrame(() => {
      setTimeout(() => {
        formScrollRef.current?.scrollResponderScrollNativeHandleToKeyboard?.(
          target,
          80,
          true
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
                `${group.title} - ${group.fixedItemCount} Outlet`
              )
            }
          >
            <Image
              source={referenceImage}
              style={styles.repeatableReferenceImage}
              resizeMode="contain"
            />
            <View style={styles.repeatableReferenceAction}>
              <Text style={styles.repeatableReferenceActionText}>View Image</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {items.map((item, itemIndex) => {
          const itemErrors = groupErrors.items?.[itemIndex] || {};
          const itemTitle = group.itemTitleField
            ? item[group.itemTitleField] || itemIndex + 1
            : itemIndex + 1;
          const displayFields = (group.itemFields || []).filter(
            (groupField) => groupField.key !== group.itemTitleField
          );

          return (
            <View style={styles.repeatableItemCard} key={`${group.key}_${itemIndex}`}>
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

                  {displayFields.map((groupField) => {
                    if (groupField.type === "select") {
                      return (
                        <View
                          style={styles.repeatableInlineField}
                          key={`${group.key}_${itemIndex}_${groupField.key}`}
                        >
                          <Text style={styles.repeatableInlineLabel}>
                            {groupField.label}
                          </Text>
                          <TouchableOpacity
                            style={[
                            styles.repeatableInlineSelect,
                            itemErrors[groupField.key] && styles.selectFieldError,
                            isReadOnly && styles.fieldDisabled,
                          ]}
                            onPress={() => {
                              Keyboard.dismiss();
                              openSelectModal({
                                field: groupField.key,
                                title: groupField.label,
                                options: groupField.options,
                                target: {
                                  type: "repeatable",
                                  groupKey: group.key,
                                  itemIndex,
                                  fieldKey: groupField.key,
                                },
                              });
                            }}
                            activeOpacity={isReadOnly ? 1 : 0.86}
                            disabled={isReadOnly}
                          >
                            <Text
                              style={[
                                styles.repeatableInlineValue,
                                !item[groupField.key] && styles.selectPlaceholder,
                              ]}
                              numberOfLines={1}
                            >
                              {item[groupField.key] ||
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
                        style={styles.repeatableInlineField}
                        key={`${group.key}_${itemIndex}_${groupField.key}`}
                      >
                        <Text style={styles.repeatableInlineLabel}>
                          {groupField.label}
                        </Text>
                        <TextInput
                          style={[
                            styles.repeatableInlineInput,
                            itemErrors[groupField.key] && styles.selectFieldError,
                            isReadOnly && styles.readOnlyInput,
                            groupField.readOnly && styles.readOnlyInput,
                          ]}
                          placeholder={groupField.placeholder || "Enter value"}
                          placeholderTextColor={colors.textSecondary}
                          keyboardType={groupField.keyboardType || "default"}
                          editable={!isReadOnly && groupField.readOnly !== true}
                          value={item[groupField.key]}
                          onChangeText={(text) =>
                            updateRepeatableGroupItem(
                              group.key,
                              itemIndex,
                              groupField.key,
                              text
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
              group.maxItems && items.length >= group.maxItems && styles.repeatableAddButtonDisabled,
            ]}
            activeOpacity={isReadOnly ? 1 : 0.86}
            onPress={() => addRepeatableGroupItem(group)}
            disabled={isReadOnly || (group.maxItems ? items.length >= group.maxItems : false)}
          >
            <Text
              style={[
                styles.repeatableAddButtonText,
                group.maxItems && items.length >= group.maxItems && styles.repeatableAddButtonTextDisabled,
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
            <View style={styles.stepMetaRow}>
              {compactMetaItems.map((item) => (
                <View key={item.key} style={styles.stepMetaChip}>
                  <Text style={styles.stepMetaChipText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.stepScroll}
            contentContainerStyle={styles.stepScrollContent}
          >
            {section.subOptions.map((sub, index) => (
              (() => {
                const submissionState = stepSubmissionStateById[sub.id] || {};
                const isSubmitted = Boolean(submissionState.isSubmitted);
                const isCommented = Boolean(submissionState.isCommented);

                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.stepChip,
                      sub.id === activeSubOptionId && styles.stepChipActive,
                      isSubmitted && styles.stepChipSubmitted,
                    ]}
                    onPress={() => setActiveSubOptionId(sub.id)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.stepChipNumber,
                        sub.id === activeSubOptionId && styles.stepChipNumberActive,
                        isSubmitted && styles.stepChipNumberSubmitted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepChipNumberText,
                          sub.id === activeSubOptionId &&
                            styles.stepChipNumberTextActive,
                          isSubmitted && styles.stepChipNumberTextSubmitted,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.stepChipContent}>
                      <Text
                        style={[
                          styles.stepChipText,
                          sub.id === activeSubOptionId && styles.stepChipTextActive,
                          isSubmitted && styles.stepChipTextSubmitted,
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
                        sub.id === activeSubOptionId && styles.stepChipDotActive,
                        isSubmitted && styles.stepChipDotSubmitted,
                      ]}
                    />
                  </TouchableOpacity>
                );
              })()
            ))}
          </ScrollView>

          <View style={styles.formCard}>
            <View style={styles.formHeadingRow}>
              <Text style={styles.formTitle}>{activeSubOptionLabel}</Text>
              {checklistProgress.total ? (
                <View style={styles.progressPill}>
                  <Text style={styles.progressPillText}>
                    {checklistProgress.completed}/{checklistProgress.total} Done
                  </Text>
                </View>
              ) : null}
            </View>

            {isReadOnly ? (
              <View style={styles.readOnlyBanner}>
                <Text style={styles.readOnlyBannerTitle}>{readOnlyTitle}</Text>
                <Text style={styles.readOnlyBannerText}>
                  {readOnlyNotice}
                </Text>
              </View>
            ) : null}

            {isCommentedForEdit && commentedRemark ? (
              <View style={styles.readOnlyBanner}>
                <Text style={styles.readOnlyBannerTitle}>Comment</Text>
                <Text style={styles.readOnlyBannerText}>
                  {commentedRemark}
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
              })
            )}

            {inputFields.map((field) => renderInputField({ field }))}

            {repeatableGroups.map((group) => renderRepeatableGroup(group))}

            {checklistItems.length ? (
              <View style={styles.checklistCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.checklistTitle}>Checklist</Text>
                  <View style={styles.sectionCountBadge}>
                    <Text style={styles.sectionCountBadgeText}>
                      {checklistItems.length} item{checklistItems.length === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.sectionHelperText}>
                  Tick each point after verifying it on site.
                </Text>

                {checklistItems.map((item) => {
                  const checked = !!activeValues.checks?.[item.id];

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.checkItem,
                        checked && styles.checkItemChecked,
                        isReadOnly && styles.fieldDisabled,
                      ]}
                      onPress={() => toggleChecklistItem(item.id)}
                      activeOpacity={isReadOnly ? 1 : 0.86}
                      disabled={isReadOnly}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          checked && styles.checkboxChecked,
                        ]}
                      >
                        {checked ? (
                          <Icons.tickGreen width={14} height={14} />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.checkItemText,
                          checked && styles.checkItemTextChecked,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

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

                {photoRequirements.map((requirement, index) => {
                  const media = activeValues.photos?.[requirement.id];
                  const slotError = activeErrors.photoSlots?.[requirement.id];
                  const isProcessingPhoto =
                    photoProcessingRequirementId === requirement.id;
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
                        {media && !isServerPrefilledPhoto ? (
                          <TouchableOpacity
                            style={styles.photoRemoveBtn}
                            onPress={() => removeSelectedPhoto(requirement.id)}
                            disabled={!canEditPhoto}
                          >
                            <Icons.delete height={20} width={20} />
                            <Text style={styles.photoRemoveBtnText}>
                              Remove
                            </Text>
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
                              <ActivityIndicator
                                size="small"
                                color={colors.primaryBlue}
                              />
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
                          <ActivityIndicator
                            size="small"
                            color={colors.primaryBlue}
                          />
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
                              <Text style={styles.videoPreviewText}>
                                Video Selected
                              </Text>
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
                              Size:{" "}
                              {media.sizeKb ? `${media.sizeKb}KB` : "Unknown"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.photoEmptyText}>
                          No file selected
                        </Text>
                      )}

                      {slotError ? (
                        <Text style={styles.errorText}>{slotError}</Text>
                      ) : null}
                    </View>
                  );
                })}

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
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Icons.location height={22} width={22} />
                      )}
                      <Text style={styles.locationBtnPrimaryText}>
                        {isUpdatingLocation
                          ? "Fetching current location..."
                          : "Update Current Location"}
                      </Text>
                    </TouchableOpacity>
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
                const selected = getPickerSelectedValue() === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.modalOption,
                      selected && styles.modalOptionActive,
                    ]}
                    onPress={() => selectPickerValue(item)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selected && styles.modalOptionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
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
