import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Icons } from "../../../constants/icons";
import styles from "./styles";

const PHOTO_REQUIRED_CHECKLIST_IDS = new Set(["20", "23", "97"]);

/**
 * Renders checklist progress and marks items that trigger a photo requirement.
 */
const ChecklistSection = ({
  checklistItems,
  checklistProgress,
  activeValues,
  isReadOnly,
  toggleChecklistItem,
}) => {
  if (!checklistItems.length) {
    return null;
  }

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

      {checklistItems.map((item) => {
        const checked = !!activeValues.checks?.[item.id];
        const checklistId = String(item.checklistId || item.id || "").trim();
        const requiresPhoto = PHOTO_REQUIRED_CHECKLIST_IDS.has(checklistId);

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
                  <View style={styles.photoDependencyBadge}>
                    <Icons.camera width={12} height={12} />
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default ChecklistSection;
