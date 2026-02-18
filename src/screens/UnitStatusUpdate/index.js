import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, IconButton } from "react-native-paper";
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
    pickerState,
    openSelectModal,
    selectPickerValue,
    closePicker,
    updateActiveValues,
    getCurrentLocation,
    openMapForLocation,
    updateNodeLocation,
    showUploadOptions,
    submitActiveSubOption,
    handleBack,
    getSubOptionLabel,
    photoPreviewVisible,
    openPhotoPreview,
    closePhotoPreview,
  } = useUnitStatusUpdateViewModel(navigation, route);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={handleBack} />
          <Text style={styles.headerTitle}>{section.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.projectCard}>
            <Text style={styles.projectLabel}>Project</Text>
            <Text style={styles.projectText}>{projectName}</Text>
            <Text style={styles.projectMeta}>Unit: {unitLabel}</Text>
          </View>

          <View style={styles.stepHeaderRow}>
            <Text style={styles.stepTitle}>Sub Options</Text>
            <Text style={styles.stepSubtitle}>One view at a time</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepScroll}>
            {section.subOptions.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.stepChip,
                  sub.id === activeSubOptionId && styles.stepChipActive,
                ]}
                onPress={() => setActiveSubOptionId(sub.id)}
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
            <Text style={styles.formTitle}>{activeSubOptionLabel}</Text>

            {!shouldHideStatusRemark ? (
              <>
                <Text style={styles.fieldLabel}>Status</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => openSelectModal("status")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.selectValue}>
                    {activeValues.status || "Select Status"}
                  </Text>
                  <Icons.down width={12} height={12} />
                </TouchableOpacity>
                {activeErrors.status ? (
                  <Text style={styles.errorText}>{activeErrors.status}</Text>
                ) : null}
              </>
            ) : null}

            {activeSubOption.needsPipeSize ? (
              <>
                <Text style={styles.fieldLabel}>Pipe Size</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => openSelectModal("pipeSize")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.selectValue}>
                    {activeValues.pipeSize || "Select Pipe Size"}
                  </Text>
                  <Icons.down width={12} height={12} />
                </TouchableOpacity>
                {activeErrors.pipeSize ? (
                  <Text style={styles.errorText}>{activeErrors.pipeSize}</Text>
                ) : null}
              </>
            ) : null}

            {!shouldHideStatusRemark ? (
              <>
                <Text style={styles.fieldLabel}>Remark</Text>
                <TextInput
                  style={styles.remarkInput}
                  placeholder="Write remarks"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  value={activeValues.remark}
                  onChangeText={(text) => updateActiveValues({ remark: text })}
                  textAlignVertical="top"
                />
              </>
            ) : null}

            {activeSubOption.needsPhoto ? (
              <>
                <Text style={styles.fieldLabel}>Photo Upload</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={showUploadOptions}
                  activeOpacity={0.88}
                >
                  <Text style={styles.uploadButtonText}>
                    Choose Camera or Gallery
                  </Text>
                </TouchableOpacity>

                {activeValues.photo?.uri ? (
                  <TouchableOpacity
                    style={styles.photoPreviewWrap}
                    onPress={openPhotoPreview}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: activeValues.photo.uri }}
                      style={styles.photoPreviewImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.photoPreviewHint}>Tap to view photo</Text>
                  </TouchableOpacity>
                ) : null}

                {activeValues.photo ? (
                  <View style={styles.photoMetaCard}>
                    <Text style={styles.photoMetaText}>File: {activeValues.photo.name}</Text>
                    <Text style={styles.photoMetaText}>Source: {activeValues.photo.source}</Text>
                    <Text style={styles.photoMetaText}>
                      Size: {activeValues.photo.sizeKb ? `${activeValues.photo.sizeKb}KB` : "Unknown"}
                    </Text>
                  </View>
                ) : null}

                {activeErrors.photo ? (
                  <Text style={styles.errorText}>{activeErrors.photo}</Text>
                ) : null}
              </>
            ) : null}

            {activeSubOption.needsLocationActions ? (
              <>
                <Text style={styles.fieldLabel}>Node Location</Text>
                <View style={styles.locationCard}>
                  <Text style={styles.locationText}>
                    Default: {activeValues.defaultLocation.latitude},{" "}
                    {activeValues.defaultLocation.longitude}
                  </Text>
                  <Text style={styles.locationText}>
                    Updated:{" "}
                    {activeValues.updatedLocation
                      ? `${activeValues.updatedLocation.latitude}, ${activeValues.updatedLocation.longitude}`
                      : "Not updated"}
                  </Text>
                  <Text style={styles.locationText}>
                    Time: {activeValues.updatedAt ? activeValues.updatedAt : "Not updated"}
                  </Text>
                </View>

                <View style={styles.locationActionsRow}>
                  {activeSubOption.canUpdateLocation ? (
                    <TouchableOpacity
                      style={[styles.locationBtn, styles.locationBtnPrimary]}
                      onPress={updateNodeLocation}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.locationBtnPrimaryText}>
                        Update Current Location
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.locationBtn, styles.locationBtnSecondary]}
                    onPress={() => openMapForLocation(getCurrentLocation())}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.locationBtnSecondaryText}>
                      Check on Google Map
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}

            <Button
              mode="contained"
              onPress={submitActiveSubOption}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              Submit {activeSubOptionLabel}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
                    style={[styles.modalOption, selected && styles.modalOptionActive]}
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

            <TouchableOpacity style={styles.modalCloseBtn} onPress={closePicker}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={photoPreviewVisible} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewCloseArea} onPress={closePhotoPreview} />
          <View style={styles.previewCard}>
            {activeValues.photo?.uri ? (
              <Image
                source={{ uri: activeValues.photo.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : null}
            <TouchableOpacity style={styles.previewCloseBtn} onPress={closePhotoPreview}>
              <Text style={styles.previewCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ModuleStatusUpdateScreen;
