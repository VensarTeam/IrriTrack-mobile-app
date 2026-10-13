import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { IconButton } from "react-native-paper";
import colors from "../constants/colors";
import fonts from "../constants/fonts";

export default function ModuleStatusHeader({ title, projectName, onBack }) {
  return <View style={styles.header}>
    <View style={styles.side}><IconButton icon="arrow-left" size={24} iconColor={colors.primaryBlue} onPress={onBack} accessibilityLabel="Back to modules" /></View>
    <View style={styles.copy}><Text accessibilityRole="header" style={styles.title}>{title}</Text><Text style={styles.project} numberOfLines={2}>{projectName}</Text></View>
    <View style={styles.side} />
  </View>;
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 8, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  side: { width: 52, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0, alignItems: "center", gap: 3 },
  title: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 25, color: colors.primaryBlue, textAlign: "center" },
  project: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textSecondary, textAlign: "center" },
});
