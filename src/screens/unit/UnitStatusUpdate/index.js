import React from "react";
import {
  ActivityIndicator,
  Image,
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

  const {
    module,
    projectName,
    section,
    unitLabel,
    activeSubOption,
    activeSubOptionLabel,
    activeSubOptionId,
    setActiveSubOptionId,
    activeValues,
    activeErrors,
    showStatusField,
    showRemarkField,
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
    getCurrentLocation,
    openMapForLocation,
    updateNodeLocation,
    isUpdatingLocation,
    showUploadOptions,
    removeSelectedPhoto,
    submitActiveSubOption,
    handleBack,
    getSubOptionLabel,
    openPhotoPreview,
    closePhotoPreview,
    statusOptions,
  } = useUnitStatusUpdateViewModel(navigation, route);

  const checklistProgress = getChecklistProgress();

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
        style={[styles.selectField, error && styles.selectFieldError]}
        onPress={() =>
          openSelectModal({
            field,
            title: label,
            options,
            target,
          })
        }
        activeOpacity={0.86}
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
        ]}
        placeholder={field.placeholder || "Enter value"}
        placeholderTextColor={colors.textSecondary}
        keyboardType={field.keyboardType || "default"}
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
                            ]}
                            onPress={() =>
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
                              })
                            }
                            activeOpacity={0.86}
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
                            groupField.readOnly && styles.readOnlyInput,
                          ]}
                          placeholder={groupField.placeholder || "Enter value"}
                          placeholderTextColor={colors.textSecondary}
                          keyboardType={groupField.keyboardType || "default"}
                          editable={groupField.readOnly !== true}
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
                    style={styles.repeatableRemoveButton}
                    activeOpacity={0.86}
                    onPress={() => removeRepeatableGroupItem(group, itemIndex)}
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
              group.maxItems && items.length >= group.maxItems && styles.repeatableAddButtonDisabled,
            ]}
            activeOpacity={0.86}
            onPress={() => addRepeatableGroupItem(group)}
            disabled={group.maxItems ? items.length >= group.maxItems : false}
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
            <Text style={styles.stepSubtitle}>Tap and continue</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.stepScroll}
          >
            {section.subOptions.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.stepChip,
                  sub.id === activeSubOptionId && styles.stepChipActive,
                ]}
                onPress={() => setActiveSubOptionId(sub.id)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.stepChipText,
                    sub.id === activeSubOptionId && styles.stepChipTextActive,
                  ]}
                >
                  {getSubOptionLabel(sub)}
                </Text>
              </TouchableOpacity>
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
                <Text style={styles.checklistTitle}>Checklist</Text>

                {checklistItems.map((item) => {
                  const checked = !!activeValues.checks?.[item.id];

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.checkItem,
                        checked && styles.checkItemChecked,
                      ]}
                      onPress={() => toggleChecklistItem(item.id)}
                      activeOpacity={0.86}
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
                  ]}
                  placeholder="Write remarks"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  value={activeValues.remark}
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
                <Text style={styles.photoSectionTitle}>
                  Photos with Timestamp
                </Text>

                {photoRequirements.map((requirement, index) => {
                  const media = activeValues.photos?.[requirement.id];
                  const slotError = activeErrors.photoSlots?.[requirement.id];

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
                        {media ? (
                          <TouchableOpacity
                            style={styles.photoRemoveBtn}
                            onPress={() => removeSelectedPhoto(requirement.id)}
                          >
                            <Icons.delete height={20} width={20} />
                            <Text style={styles.photoRemoveBtnText}>
                              Remove
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => showUploadOptions(requirement)}
                        activeOpacity={0.88}
                      >
                        <Icons.uploadfile height={22} width={22} />
                        <Text style={styles.uploadButtonText}>
                          {media ? "Replace File" : "Upload File"}
                        </Text>
                      </TouchableOpacity>

                      {media?.uri ? (
                        <TouchableOpacity
                          style={styles.photoPreviewWrap}
                          onPress={() => openPhotoPreview(requirement.id)}
                          activeOpacity={0.9}
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
                              File: {media.name}
                            </Text>
                            <Text style={styles.photoMetaText}>
                              Source: {media.source}
                            </Text>
                            <Text style={styles.photoMetaText}>
                              Size:{" "}
                              {media.sizeKb ? `${media.sizeKb}KB` : "Unknown"}
                            </Text>
                            <Text style={styles.photoMetaText}>
                              Time: {media.takenAt}
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
                  <Text style={styles.locationLabel}>Default Address</Text>
                  <View style={styles.locationHighlight}>
                    <Text style={styles.locationHighlightText}>
                      {activeValues.defaultAddress || "Address not available"}
                    </Text>
                  </View>

                  <Text style={styles.locationLabel}>Updated Address</Text>
                  <View style={styles.locationHighlight}>
                    <Text style={styles.locationHighlightText}>
                      {activeValues.updatedAddress || "Not updated"}
                    </Text>
                  </View>

                  <Text style={styles.locationText}>
                    Updated On: {activeValues.updatedAt || "Not updated"}
                  </Text>
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
                      disabled={isUpdatingLocation}
                      activeOpacity={0.88}
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

                  <TouchableOpacity
                    style={[styles.locationBtn, styles.locationBtnSecondary]}
                    onPress={() => openMapForLocation(getCurrentLocation())}
                    disabled={isUpdatingLocation}
                    activeOpacity={0.88}
                  >
                    <Icons.googleIcon height={22} width={22} />
                    <Text style={styles.locationBtnSecondaryText}>
                      Check on Google Map
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {activeErrors.form ? (
              <Text style={styles.errorText}>{activeErrors.form}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={submitActiveSubOption}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              Submit
            </Button>
          </View>
        </KeyboardAwareScrollView>
      </View>

      <Modal visible={pickerState.visible} transparent animationType="fade">
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

      <Modal
        visible={photoPreviewState.visible}
        transparent
        animationType="fade"
      >
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewCloseArea}
            onPress={closePhotoPreview}
          />
          <View style={styles.previewCard}>
            {photoPreviewState.media?.uri ? (
              photoPreviewState.media.mediaType === "video" ? (
                <View style={styles.videoPreviewModalPlaceholder}>
                  <Text style={styles.videoPreviewModalText}>
                    Video preview is not available in-app yet.
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: photoPreviewState.media.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              )
            ) : null}

            {photoPreviewState.media ? (
              <Text style={styles.previewMetaText}>
                Captured: {photoPreviewState.media.takenAt}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.previewCloseBtn}
              onPress={closePhotoPreview}
            >
              <Text style={styles.previewCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={referencePreviewState.visible}
        transparent
        animationType="fade"
        onRequestClose={closeReferencePreview}
      >
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewCloseArea}
            onPress={closeReferencePreview}
          />
          <View style={styles.referencePreviewCard}>
            <Text style={styles.referencePreviewTitle}>
              {referencePreviewState.title}
            </Text>

            {referencePreviewState.source ? (
              <Image
                source={referencePreviewState.source}
                style={styles.referencePreviewImage}
                resizeMode="contain"
              />
            ) : null}

            <TouchableOpacity
              style={styles.previewCloseBtn}
              onPress={closeReferencePreview}
            >
              <Text style={styles.previewCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ModuleStatusUpdateScreen;
