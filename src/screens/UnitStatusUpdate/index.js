import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import {
  DEFAULT_NODE_LOCATION,
  MODULE_STATUS_SECTIONS,
  PIPE_SIZE_OPTIONS,
  STATUS_OPTIONS,
} from "../../constants/moduleStatusConfig";

const getInitialFormValues = (section, unit) => {
  const baseLocation = {
    latitude: unit?.latitude || DEFAULT_NODE_LOCATION.latitude,
    longitude: unit?.longitude || DEFAULT_NODE_LOCATION.longitude,
  };

  return section.subOptions.reduce((acc, sub) => {
    acc[sub.id] = {
      status: "Pending",
      pipeSize: PIPE_SIZE_OPTIONS[0],
      remark: "",
      photo: null,
      defaultLocation: baseLocation,
      updatedLocation: null,
    };

    return acc;
  }, {});
};

const ModuleStatusUpdateScreen = ({ navigation, route }) => {
  const module = route?.params?.module || "OMS";
  const unit = route?.params?.unit || {};
  const projectName = route?.params?.projectName || "Kayampur Sitamau P.M.I.P";
  const sectionKey = route?.params?.sectionKey || "pipeLaying";

  const section =
    MODULE_STATUS_SECTIONS.find((item) => item.key === sectionKey) || MODULE_STATUS_SECTIONS[0];

  const [activeSubOptionId, setActiveSubOptionId] = useState(section.subOptions[0]?.id);
  const [formValues, setFormValues] = useState(() => getInitialFormValues(section, unit));
  const [fieldErrors, setFieldErrors] = useState({});
  const [pickerState, setPickerState] = useState({
    visible: false,
    field: "",
    title: "",
    options: [],
  });

  const activeSubOption = useMemo(
    () => section.subOptions.find((sub) => sub.id === activeSubOptionId) || section.subOptions[0],
    [activeSubOptionId, section.subOptions]
  );

  const activeValues = formValues[activeSubOption.id];
  const activeErrors = fieldErrors[activeSubOption.id] || {};
  const shouldHideStatusRemark = !!activeSubOption.hideStatusRemark;

  const unitLabel = unit?.unitNo || `${module}-001`;

  const updateActiveValues = (updates) => {
    setFormValues((prev) => ({
      ...prev,
      [activeSubOption.id]: {
        ...prev[activeSubOption.id],
        ...updates,
      },
    }));
  };

  const openSelectModal = (field) => {
    if (field === "status") {
      setPickerState({
        visible: true,
        field,
        title: "Select Status",
        options: STATUS_OPTIONS,
      });
      return;
    }

    setPickerState({
      visible: true,
      field,
      title: "Select Pipe Size",
      options: PIPE_SIZE_OPTIONS,
    });
  };

  const selectPickerValue = (value) => {
    updateActiveValues({ [pickerState.field]: value });
    setFieldErrors((prev) => ({
      ...prev,
      [activeSubOption.id]: {
        ...(prev[activeSubOption.id] || {}),
        [pickerState.field]: null,
      },
    }));
    setPickerState((prev) => ({ ...prev, visible: false }));
  };

  const getCurrentLocation = () => {
    return activeValues.updatedLocation || activeValues.defaultLocation;
  };

  const openMapForLocation = async (location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Unable to open map", "Please check map availability on your device.");
    }
  };

  const updateNodeLocation = () => {
    const current = getCurrentLocation();
    const nextLocation = {
      latitude: Number((current.latitude + 0.0007).toFixed(6)),
      longitude: Number((current.longitude + 0.0007).toFixed(6)),
    };

    updateActiveValues({ updatedLocation: nextLocation });
    openMapForLocation(nextLocation);
  };

  const uploadPhoto = (source) => {
    const stamp = Date.now();
    const originalKb = source === "camera" ? 360 : 420;
    const compressedKb = Math.round(originalKb * 0.58);

    updateActiveValues({
      photo: {
        name: `${activeSubOption.label.replace(/\s+/g, "_")}_${stamp}.jpg`,
        source,
        originalKb,
        compressedKb,
      },
    });

    setFieldErrors((prev) => ({
      ...prev,
      [activeSubOption.id]: {
        ...(prev[activeSubOption.id] || {}),
        photo: null,
      },
    }));
  };

  const showUploadOptions = () => {
    Alert.alert("Upload Photo", "Choose source", [
      { text: "Camera", onPress: () => uploadPhoto("camera") },
      { text: "Gallery", onPress: () => uploadPhoto("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!shouldHideStatusRemark && !activeValues.status) {
      nextErrors.status = "Please select status";
    }

    if (activeSubOption.needsPipeSize && !activeValues.pipeSize) {
      nextErrors.pipeSize = "Please select pipe size";
    }

    if (activeSubOption.needsPhoto && !activeValues.photo) {
      nextErrors.photo = "Please upload one photo";
    }

    setFieldErrors((prev) => ({
      ...prev,
      [activeSubOption.id]: nextErrors,
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const submitActiveSubOption = () => {
    if (!validateForm()) return;

    const activeIndex = section.subOptions.findIndex((item) => item.id === activeSubOption.id);
    const hasNext = activeIndex < section.subOptions.length - 1;

    Alert.alert("Submitted", `${activeSubOption.label} updated successfully.`, [
      {
        text: hasNext ? "Next" : "Done",
        onPress: () => {
          if (hasNext) {
            setActiveSubOptionId(section.subOptions[activeIndex + 1].id);
          } else {
            navigation.goBack();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
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
                  sub.id === activeSubOption.id && styles.stepChipActive,
                ]}
                onPress={() => setActiveSubOptionId(sub.id)}
              >
                <Text
                  style={[
                    styles.stepChipText,
                    sub.id === activeSubOption.id && styles.stepChipTextActive,
                  ]}
                >
                  {sub.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{activeSubOption.label}</Text>

            {!shouldHideStatusRemark ? (
              <>
                <Text style={styles.fieldLabel}>Status</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => openSelectModal("status")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.selectValue}>{activeValues.status || "Select Status"}</Text>
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
                  <Text style={styles.selectValue}>{activeValues.pipeSize || "Select Pipe Size"}</Text>
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
                  <Text style={styles.uploadButtonText}>Choose Camera or Gallery</Text>
                </TouchableOpacity>

                {activeValues.photo ? (
                  <View style={styles.photoMetaCard}>
                    <Text style={styles.photoMetaText}>File: {activeValues.photo.name}</Text>
                    <Text style={styles.photoMetaText}>Source: {activeValues.photo.source}</Text>
                    <Text style={styles.photoMetaText}>
                      Compression: {activeValues.photo.originalKb}KB → {activeValues.photo.compressedKb}KB
                    </Text>
                  </View>
                ) : null}

                {activeErrors.photo ? <Text style={styles.errorText}>{activeErrors.photo}</Text> : null}
              </>
            ) : null}

            {activeSubOption.needsLocationActions ? (
              <>
                <Text style={styles.fieldLabel}>Node Location</Text>
                <View style={styles.locationCard}>
                  <Text style={styles.locationText}>
                    Default: {activeValues.defaultLocation.latitude}, {activeValues.defaultLocation.longitude}
                  </Text>
                  <Text style={styles.locationText}>
                    Updated: {activeValues.updatedLocation
                      ? `${activeValues.updatedLocation.latitude}, ${activeValues.updatedLocation.longitude}`
                      : "Not updated"}
                  </Text>
                </View>

                <View style={styles.locationActionsRow}>
                  {activeSubOption.canUpdateLocation ? (
                    <TouchableOpacity
                      style={[styles.locationBtn, styles.locationBtnPrimary]}
                      onPress={updateNodeLocation}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.locationBtnPrimaryText}>Update Node Location</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.locationBtn, styles.locationBtnSecondary]}
                    onPress={() => openMapForLocation(getCurrentLocation())}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.locationBtnSecondaryText}>Check on Google Map</Text>
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
              Submit {activeSubOption.label}
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
                    <Text style={[styles.modalOptionText, selected && styles.modalOptionTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setPickerState((prev) => ({ ...prev, visible: false }))}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ModuleStatusUpdateScreen;
