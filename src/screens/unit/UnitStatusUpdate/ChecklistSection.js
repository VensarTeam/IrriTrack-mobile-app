import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Icons } from "../../../constants/icons";
import styles from "./styles";

const PHOTO_REQUIRED_CHECKLIST_IDS = new Set(["20", "23", "97"]);
const OUTLET_SUB_CHAK_DESIGN_CHECKLIST_ID = "7";
const OUTLET_PIPE_LAID_CHECKLIST_ID = "8";
const OUTLET_SUB_CHAK_MAX_COUNT = 8;

const getChecklistId = (item = {}) =>
  String(item.checklistId || item.checklist_id || item.id || "").trim();

const getNumberFromValue = (value) => {
  const parsedValue = Number.parseInt(`${value ?? ""}`.match(/\d+/)?.[0], 10);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const getDesignCount = (value) => {
  const parsedValue = getNumberFromValue(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return Math.min(parsedValue, OUTLET_SUB_CHAK_MAX_COUNT);
};

/**
 * Renders checklist progress and marks items that trigger a photo requirement.
 */
const ChecklistSection = ({
  checklistItems,
  checklistProgress,
  activeValues,
  isReadOnly,
  toggleChecklistItem,
  toggleOutletSubChakItem,
  activeSubOptionId,
  inputFields = [],
  subChakQuantity,
  photoDependencyByChecklistId = {},
  onPhotoDependencyPress,
}) => {
  if (!checklistItems.length) {
    return null;
  }

  const isOutletPipeLaying = activeSubOptionId === "outletPipeLaying";
  const subChakDesignField = inputFields.find(
    (field) => getChecklistId(field) === OUTLET_SUB_CHAK_DESIGN_CHECKLIST_ID
  );
  const selectedSubChakCount = getNumberFromValue(
    subChakDesignField ? activeValues[subChakDesignField.key] : ""
  );
  const designSubChakCount =
    getDesignCount(subChakQuantity) ||
    (isOutletPipeLaying && subChakDesignField
      ? OUTLET_SUB_CHAK_MAX_COUNT
      : getDesignCount(selectedSubChakCount));
  const outletSubChakSelections = activeValues.outletSubChakChecks || {};
  const showOutletSubChakControls =
    isOutletPipeLaying && designSubChakCount && toggleOutletSubChakItem;
  const outletSubChakNumbers = showOutletSubChakControls
    ? Array.from({ length: designSubChakCount }, (_, index) => index + 1)
    : [];
  const showSubChakCountRow = isOutletPipeLaying && subChakDesignField;
  const subChakDisplayCount = Number.isFinite(selectedSubChakCount)
    ? selectedSubChakCount
    : 0;

  return (
    <View style={styles.checklistCard}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.checklistTitle}>Checklist</Text>
        {checklistProgress.total ? (
          <View style={styles.progressPill}>
            <Text style={styles.progressPillText}>
              {checklistProgress.completed}/{checklistProgress.total} Done
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.sectionHelperText}>
        Tick each point after verifying it on site.
      </Text>

      {showSubChakCountRow ? (
        <View style={styles.subChakCountRow}>
          <Text style={styles.subChakCountLabel}>
            {subChakDesignField.label}
          </Text>
          <View style={styles.subChakDesignBadge}>
            <Text style={styles.subChakDesignValue}>
              {subChakDisplayCount}
            </Text>
          </View>
        </View>
      ) : null}

      {checklistItems.map((item) => {
        const checked = !!activeValues.checks?.[item.id];
        const checklistId = getChecklistId(item);
        const photoDependency = photoDependencyByChecklistId[checklistId];
        const requiresPhoto =
          PHOTO_REQUIRED_CHECKLIST_IDS.has(checklistId) || photoDependency;
        const isOutletPipeLaid =
          isOutletPipeLaying && checklistId === OUTLET_PIPE_LAID_CHECKLIST_ID;

        return (
          <View key={item.id}>
            <TouchableOpacity
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
                style={[styles.checkbox, checked && styles.checkboxChecked]}
              >
                {checked ? <Icons.tickGreen width={14} height={14} /> : null}
              </View>
              <View style={styles.checkItemContent}>
                <View style={styles.checkItemLabelRow}>
                  <Text
                    style={[
                      styles.checkItemText,
                      checked && styles.checkItemTextChecked,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {requiresPhoto ? (
                    <TouchableOpacity
                      style={[
                        styles.photoDependencyBadge,
                        photoDependency && styles.photoDependencyBadgeAction,
                      ]}
                      activeOpacity={photoDependency ? 0.82 : 1}
                      disabled={!photoDependency || isReadOnly}
                      onPress={(event) => {
                        event?.stopPropagation?.();
                        photoDependency && onPhotoDependencyPress?.(
                          photoDependency,
                          item
                        );
                      }}
                    >
                      <Icons.camera width={12} height={12} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
            {isOutletPipeLaid && showOutletSubChakControls ? (
              <View style={styles.subChakSelectorRow}>
                {outletSubChakNumbers.map((number) => {
                  const selected =
                    typeof outletSubChakSelections[number] === "boolean"
                      ? outletSubChakSelections[number]
                      : selectedSubChakCount >= number;

                  return (
                    <TouchableOpacity
                      key={`sub_chak_${number}`}
                      style={[
                        styles.subChakOption,
                        number % 4 !== 0 && styles.subChakOptionSpaced,
                        selected && styles.subChakOptionSelected,
                        isReadOnly && styles.fieldDisabled,
                      ]}
                      activeOpacity={isReadOnly ? 1 : 0.86}
                      disabled={isReadOnly}
                      onPress={() => toggleOutletSubChakItem(number)}
                    >
                      <View
                        style={[
                          styles.subChakCheckbox,
                          selected && styles.subChakCheckboxSelected,
                        ]}
                      >
                        {selected ? (
                          <Icons.tickGreen width={12} height={12} />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.subChakOptionText,
                          selected && styles.subChakOptionTextSelected,
                        ]}
                      >
                        S{number}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

export default ChecklistSection;
