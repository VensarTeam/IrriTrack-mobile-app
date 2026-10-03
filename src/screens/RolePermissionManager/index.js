import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import {
  fetchManagedUserPermissions,
  fetchManagedUsers,
  fetchRoleOptions,
  updateManagedUserPermissions,
  updateManagedUserRole,
} from "../../services/rolePermissionManagerApi";

const normalizeRole = (value) => String(value || "").trim().toLowerCase().replace(/[ -]+/g, "_");
const title = (value) => String(value || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const permissionRows = (detail) => {
  const rows = [];
  const seen = new Set();
  const add = (row) => {
    if (!row?.key || seen.has(row.key)) return;
    seen.add(row.key);
    rows.push(row);
  };
  (detail?.accessColumns || []).forEach((column) => add({
    key: column.key,
    label: column.label,
    group: column.group || "Configuration",
    allowed: Boolean(column.allowed),
  }));
  (detail?.matrix || []).forEach((row) => {
    Object.entries(row.actions || {}).forEach(([action, config]) => add({
      key: config.key,
      label: `${row.label} · ${title(action)}`,
      group: "Permission matrix",
      allowed: Boolean(config.allowed),
    }));
  });
  return rows.sort((a, b) => `${a.group}:${a.label}`.localeCompare(`${b.group}:${b.label}`));
};

export default function RolePermissionManagerScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isDeveloper = normalizeRole(user?.role) === "developer";
  const [users, setUsers] = useState(null);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [permissionDraft, setPermissionDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const controllerRef = useRef(null);

  React.useEffect(() => NetInfo.addEventListener((state) => {
    setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
  }), []);

  const load = useCallback(async () => {
    if (!isDeveloper) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const [userResponse, roleResponse] = await Promise.all([
        fetchManagedUsers({ q: search, page: 1, limit: 100, signal: controller.signal }),
        fetchRoleOptions({ signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      setUsers(userResponse?.items || []);
      setRoles((Array.isArray(roleResponse) ? roleResponse : []).filter((role) => normalizeRole(role.code) !== "developer"));
    } catch (loadError) {
      if (!controller.signal.aborted) setError(loadError?.message || "Could not load users and roles.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [isDeveloper, search]);

  useFocusEffect(useCallback(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => { clearTimeout(timer); controllerRef.current?.abort(); };
  }, [load]));

  const openUser = async (managedUser) => {
    setSelectedUser(managedUser);
    setDetail(null);
    setPermissionDraft({});
    setDetailLoading(true);
    try {
      const response = await fetchManagedUserPermissions({ userId: managedUser.id });
      const currentRole = roles.find((role) => normalizeRole(role.code) === normalizeRole(response?.role || managedUser.role));
      setDetail(response);
      setSelectedRoleId(currentRole?.id || null);
      setPermissionDraft(Object.fromEntries(permissionRows(response).map((row) => [row.key, row.allowed])));
    } catch (detailError) {
      Alert.alert("Could not load permissions", detailError?.message || "Please try again.");
      setSelectedUser(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const rows = useMemo(() => permissionRows(detail), [detail]);
  const originalPermissions = useMemo(
    () => Object.fromEntries(rows.map((row) => [row.key, row.allowed])),
    [rows],
  );
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const roleChanged = Boolean(selectedRole && normalizeRole(selectedRole.code) !== normalizeRole(detail?.role));
  const changedOverrides = rows
    .filter((row) => Boolean(permissionDraft[row.key]) !== Boolean(originalPermissions[row.key]))
    .map((row) => ({ key: row.key, allowed: Boolean(permissionDraft[row.key]) }));
  const targetLocked = normalizeRole(selectedUser?.role) === "developer" || selectedUser?.id === user?.id;
  const hasChanges = roleChanged || changedOverrides.length > 0;

  const save = async () => {
    if (!selectedUser || !hasChanges || saving) return;
    if (!isOnline) {
      Alert.alert("Internet required", "Role and permission changes cannot be queued offline.");
      return;
    }
    setSaving(true);
    try {
      if (roleChanged) await updateManagedUserRole({ userId: selectedUser.id, roleId: selectedRoleId });
      if (changedOverrides.length) {
        await updateManagedUserPermissions({ userId: selectedUser.id, overrides: changedOverrides });
      }
      Alert.alert("Access updated", `${selectedUser.username || selectedUser.name}'s role and permissions were updated.`);
      setSelectedUser(null);
      await load();
    } catch (saveError) {
      Alert.alert("Update failed", saveError?.message || "Changes were not fully saved. Refresh and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isDeveloper) {
    return <View style={styles.state}><Icon source="shield-lock-outline" size={42} color={colors.textSecondary} /><Text style={styles.stateTitle}>Developer access required</Text><Text style={styles.stateText}>Only the Developer role can manage roles and permissions from mobile.</Text></View>;
  }

  return <View style={styles.screen}>
    <View style={styles.search}><Icon source="magnify" size={20} color={colors.textSecondary} /><TextInput value={search} onChangeText={setSearch} placeholder="Search name, mobile, email or role" style={styles.searchInput} autoCorrect={false} /></View>
    {!isOnline ? <View style={styles.offline}><Text style={styles.offlineText}>Offline · changes are disabled</Text></View> : null}
    {!!error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={load}><Text style={styles.link}>Retry</Text></Pressable></View> : null}
    <FlatList
      data={users || []}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading && users !== null} onRefresh={load} />}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
      renderItem={({ item }) => <Pressable onPress={() => openUser(item)} style={styles.userCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{String(item.username || "U").slice(0, 2).toUpperCase()}</Text></View>
        <View style={styles.userCopy}><Text style={styles.userName}>{item.username || "Unnamed user"}</Text><Text style={styles.userMeta}>{item.mobile || item.email || "No contact"}</Text><Text style={styles.roleLabel}>{title(item.role)} · {item.isActive === false ? "Disabled" : "Active"}</Text></View>
        <Icon source="chevron-right" size={22} color={colors.primaryBlue} />
      </Pressable>}
      ListEmptyComponent={loading && users === null ? <View style={styles.state}><ActivityIndicator color={colors.primaryBlue} /><Text style={styles.stateText}>Loading users…</Text></View> : <View style={styles.state}><Icon source="account-search-outline" size={38} color={colors.textSecondary} /><Text style={styles.stateTitle}>No users found</Text><Text style={styles.stateText}>Try a different search.</Text></View>}
    />

    <Modal visible={Boolean(selectedUser)} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => !saving && setSelectedUser(null)}>
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}><View style={styles.userCopy}><Text style={styles.sheetTitle}>{selectedUser?.username || "User access"}</Text><Text style={styles.userMeta}>{selectedUser?.mobile || selectedUser?.email}</Text></View><Pressable disabled={saving} onPress={() => setSelectedUser(null)}><Icon source="close" size={25} /></Pressable></View>
        {detailLoading ? <View style={styles.state}><ActivityIndicator color={colors.primaryBlue} /><Text style={styles.stateText}>Loading permissions…</Text></View> : <>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            {targetLocked ? <View style={styles.locked}><Text style={styles.lockedText}>Developer accounts and your own account are protected from role/permission changes.</Text></View> : null}
            <Text style={styles.sectionTitle}>Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roles}>
              {roles.map((role) => <Pressable key={role.id} disabled={targetLocked || saving || !isOnline} onPress={() => setSelectedRoleId(role.id)} style={[styles.roleChip, selectedRoleId === role.id && styles.roleChipActive]}><Text style={[styles.roleChipText, selectedRoleId === role.id && styles.roleChipTextActive]}>{role.name}</Text></Pressable>)}
            </ScrollView>
            <Text style={styles.sectionTitle}>Permissions</Text>
            {rows.map((row, index) => <View key={row.key} style={[styles.permissionRow, index === rows.length - 1 && styles.permissionRowLast]}><View style={styles.permissionCopy}><Text style={styles.permissionLabel}>{row.label}</Text><Text style={styles.permissionKey}>{row.group} · {row.key}</Text></View><Switch value={Boolean(permissionDraft[row.key])} disabled={targetLocked || saving || !isOnline} onValueChange={(allowed) => setPermissionDraft((current) => ({ ...current, [row.key]: allowed }))} trackColor={{ false: "#CBD7E3", true: "#9CC7F2" }} thumbColor={permissionDraft[row.key] ? colors.primaryBlue : "#F5F7FA"} /></View>)}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}><Pressable disabled={saving} onPress={() => setSelectedUser(null)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable disabled={!hasChanges || targetLocked || saving || !isOnline} onPress={save} style={[styles.save, (!hasChanges || targetLocked || saving || !isOnline) && styles.disabled]}>{saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveText}>Save changes</Text>}</Pressable></View>
        </>}
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F7FB" }, search: { margin: 14, marginBottom: 8, borderRadius: 12, backgroundColor: "white", flexDirection: "row", alignItems: "center", paddingHorizontal: 12 }, searchInput: { flex: 1, padding: 12 }, list: { padding: 14, gap: 10, flexGrow: 1 }, userCard: { backgroundColor: "white", borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#E1EAF2" }, avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF4FF" }, avatarText: { fontWeight: "800", color: colors.primaryBlue }, userCopy: { flex: 1, minWidth: 0 }, userName: { fontSize: 16, fontWeight: "700", color: "#173B5E" }, userMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 12 }, roleLabel: { marginTop: 5, color: colors.primaryBlue, fontWeight: "600", fontSize: 12 }, state: { flex: 1, minHeight: 240, alignItems: "center", justifyContent: "center", padding: 28, gap: 9 }, stateTitle: { fontSize: 17, fontWeight: "700", color: "#173B5E", textAlign: "center" }, stateText: { color: colors.textSecondary, textAlign: "center" }, error: { marginHorizontal: 14, padding: 11, borderRadius: 10, backgroundColor: "#FDECEC", flexDirection: "row", gap: 10 }, errorText: { flex: 1, color: "#A43A3A" }, link: { color: colors.primaryBlue, fontWeight: "700" }, offline: { marginHorizontal: 14, padding: 8, backgroundColor: "#FFF3D9", borderRadius: 8 }, offlineText: { color: "#805B17", textAlign: "center", fontWeight: "600" }, sheet: { flex: 1, backgroundColor: "#F7F9FC" }, sheetHeader: { padding: 18, paddingTop: 22, backgroundColor: "white", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: "#E1EAF2" }, sheetTitle: { fontSize: 19, fontWeight: "800", color: "#173B5E" }, sheetContent: { padding: 16, paddingBottom: 30 }, sectionTitle: { marginTop: 10, marginBottom: 10, fontSize: 15, fontWeight: "800", color: "#173B5E" }, roles: { gap: 8, paddingBottom: 8 }, roleChip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20, backgroundColor: "white", borderWidth: 1, borderColor: "#CBD7E3" }, roleChipActive: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue }, roleChipText: { color: "#38566F", fontWeight: "600" }, roleChipTextActive: { color: "white" }, permissionRow: { minHeight: 66, backgroundColor: "white", paddingHorizontal: 13, paddingVertical: 10, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#DDE6EE" }, permissionRowLast: { borderBottomWidth: 0 }, permissionCopy: { flex: 1, paddingRight: 10 }, permissionLabel: { color: "#173B5E", fontWeight: "700" }, permissionKey: { marginTop: 3, color: colors.textSecondary, fontSize: 10 }, locked: { padding: 12, borderRadius: 10, backgroundColor: "#FFF3D9" }, lockedText: { color: "#805B17" }, footer: { padding: 14, flexDirection: "row", gap: 10, backgroundColor: "white", borderTopWidth: 1, borderColor: "#E1EAF2" }, cancel: { flex: 1, alignItems: "center", padding: 13, borderRadius: 10, borderWidth: 1, borderColor: "#CBD7E3" }, cancelText: { color: "#38566F", fontWeight: "700" }, save: { flex: 1.5, alignItems: "center", padding: 13, borderRadius: 10, backgroundColor: colors.primaryBlue }, saveText: { color: "white", fontWeight: "800" }, disabled: { opacity: 0.45 },
});
