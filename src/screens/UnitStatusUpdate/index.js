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
import colors from "../../constants/colors";
import { Icons } from "../../constants/icons";
import useUnitStatusUpdateViewModel from "../../viewmodels/useUnitStatusUpdateViewModel";

const ModuleStatusUpdateScreen = ({ navigation, route }) => {
  const {
    projectName,
    section,
    unitLabel,
    activeSubOption,
    activeSubOptionLabel,
    activeSubOptionId,
    setActiveSubOptionId,
    activeValues,
    activeErrors,
    shouldHideStatusRemark,
    checklistItems,
    photoRequirements,
    selectFields,
    pickerState,
    openSelectModal,
    selectPickerValue,
    closePicker,
    updateActiveValues,
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
    photoPreviewState,
    openPhotoPreview,
    closePhotoPreview,
    statusOptions,
    pipeSizeOptions,
    contractorOptions,
  } = useUnitStatusUpdateViewModel(navigation, route);

  const checklistProgress = getChecklistProgress();

  const renderSelectField = ({
    label,
    field,
    value,
    options,
    placeholder,
    error,
  }) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectField, error && styles.selectFieldError]}
        onPress={() =>
          openSelectModal({
            field,
            title: label,
            options,
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
            <Text style={styles.projectLabel}>Project</Text>
            <Text style={styles.projectText}>{projectName}</Text>
            <View style={styles.projectMetaRow}>
              <Text style={styles.projectMeta}>Unit: {unitLabel}</Text>
              {/* <Text style={styles.projectMeta}>Field Ready Form</Text> */}
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

            {!shouldHideStatusRemark
              ? renderSelectField({
                  label: activeSubOption.statusLabel || "Status",
                  field: "status",
                  value: activeValues.status,
                  options: statusOptions,
                  placeholder: "Select Status",
                  error: activeErrors.status,
                })
              : null}

            {activeSubOption.needsPipeSize
              ? renderSelectField({
                  label: activeSubOption.pipeSizeLabel || "Pipe Size",
                  field: "pipeSize",
                  value: activeValues.pipeSize,
                  options: pipeSizeOptions,
                  placeholder: "Select Pipe Size",
                  error: activeErrors.pipeSize,
                })
              : null}

            {activeSubOption.needsContractor
              ? renderSelectField({
                  label:
                    activeSubOption.contractorLabel ||
                    "Activity Done By Contractor",
                  field: "contractor",
                  value: activeValues.contractor,
                  options: contractorOptions,
                  placeholder: "Select Contractor",
                  error: activeErrors.contractor,
                })
              : null}

            {selectFields.map((field) =>
              renderSelectField({
                label: field.label,
                field: field.key,
                value: activeValues[field.key],
                options: field.options,
                placeholder: field.placeholder || "Select Option",
                error: activeErrors[field.key],
              }),
            )}

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

            {!shouldHideStatusRemark ? (
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  {activeSubOption.remarkLabel || "Remark"}
                </Text>
                <TextInput
                  style={styles.remarkInput}
                  placeholder="Write remarks"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  value={activeValues.remark}
                  onChangeText={(text) => updateActiveValues({ remark: text })}
                  textAlignVertical="top"
                />
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
                const selected = activeValues[pickerState.field] === item;

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
    </SafeAreaView>
  );
};

export default ModuleStatusUpdateScreen;
