import React from "react";
import { FlatList, Text, View } from "react-native";
import styles from "../screens/WorkStatus/styles";

const LABELS = {
  submitted: "Submitted",
  verified: "Verified",
  approved: "Approved",
  rejected: "Commented",
  modify_request: "Modification requested",
  modify_approved: "Modification allowed",
  modify_rejected: "Modification declined",
};
const titleCase = (value) => String(value || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
};

export default function PipeSubmissionHistory({ detail, currentStatus, bottomPadding, isOnline, isPendingSync }) {
  const history = detail?.history || [];
  let submissionCount = 0;
  const events = history.map((event) => ({
    ...event,
    label: event.action === "submitted"
      ? (++submissionCount === 1 ? "Submitted" : "Resubmitted")
      : LABELS[event.action] || titleCase(event.action),
  }));

  return (
    <>
      <View style={styles.historySummaryCard}>
        <View style={styles.historySummaryBlock}>
          <Text style={styles.historySummaryLabel}>Current Status</Text>
          <Text style={styles.historySummaryValue}>{LABELS[currentStatus] || titleCase(currentStatus || "pending")}</Text>
        </View>
        <View style={styles.historySummaryDivider} />
        <View style={styles.historySummaryBlock}>
          <Text style={styles.historySummaryLabel}>Comments</Text>
          <Text style={styles.historySummaryValue}>{history.filter((event) => event.action === "rejected").length}</Text>
        </View>
      </View>
      <FlatList
        data={events}
        keyExtractor={(event, index) => String(event.id || `${event.action}-${index}`)}
        style={[styles.sheetScroll, { flexShrink: 1, minHeight: 0 }]}
        contentContainerStyle={[styles.sheetScrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(!isOnline || isPendingSync) ? (
          <View style={styles.sheetStateCard}>
            <Text style={styles.sheetStateText}>{isPendingSync
              ? "Changes are saved on this device and awaiting sync. They will appear in history after the server accepts them."
              : "Offline: showing the last saved submission history."}</Text>
          </View>
        ) : null}
        renderItem={({ item, index }) => (
          <View style={styles.historyItem}>
            <View style={styles.historyRail}>
              <View style={styles.historyDot} />
              {index < events.length - 1 && <View style={styles.historyLine} />}
            </View>
            <View style={styles.historyCard}>
              <View style={styles.historyCardTopRow}>
                <Text style={styles.historyActionText}>{item.label}</Text>
                <Text style={styles.historyDateText}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.historyActorText}>
                {item.actorName || "Unknown"}{item.actorRole ? ` • ${titleCase(item.actorRole)}` : ""}
              </Text>
              {!!item.remark && <Text style={styles.historyRemarkText}>{item.remark}</Text>}
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.sheetStateCard}>
            <Text style={styles.sheetStateText}>No history is available for this submission yet.</Text>
          </View>
        )}
      />
    </>
  );
}
