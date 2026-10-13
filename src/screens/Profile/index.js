import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import GradientScreenHeader from "../../components/GradientScreenHeader";
import styles from "./styles";
import colors from "../../constants/colors";
import { APP_VERSION } from "../../constants/appInfo";
import useProfileViewModel from "../../viewmodels/useProfileViewModel";
import { ROUTES } from "../../navigation/routes";
import LegalDocumentViewer from "../../components/LegalDocumentViewer";
import ConsentIcon from "../../components/ConsentIcon";
import { ACCOUNT_DELETION_CONTACT, LEGAL_DOCUMENTS } from "../../constants/legalDocuments";

const toTitleCase = (value = "") => String(value || "").trim().split(/[\s_]+/)
  .filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

const ProfileScreen = ({ navigation }) => {
  const [legalDocument, setLegalDocument] = useState(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const {
    user, initials, canShowSyncActions, canShowAddContractor, isRefreshingProfile,
    isSyncingMasterData, isSyncingPendingWork, handleRefreshProfile,
    handleSyncMasterData, handleSyncPendingWork, handleOpenAddContractor, handleLogout,
  } = useProfileViewModel(navigation);
  useEffect(() => setAvatarFailed(false), [user.profileUrl]);
  const handleOpenPermissions = useCallback(() => navigation.navigate(ROUTES.ROOT.PERMISSIONS), [navigation]);
  const handleOpenRoleManager = useCallback(() => navigation.navigate(ROUTES.ROOT.ROLE_PERMISSION_MANAGER), [navigation]);
  const role = toTitleCase(user.role) || "No role assigned";
  const canManageRoles = String(user.role || "").toLowerCase() === "developer";

  return (
    <SafeAreaView style={[styles.screen, Platform.OS === "ios" && styles.iosScreen]}
      edges={Platform.OS === "ios" ? ["top", "left", "right"] : ["left", "right"]}>
      <GradientScreenHeader>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </GradientScreenHeader>
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshingProfile} onRefresh={handleRefreshProfile}
          colors={[colors.primaryGreen]} tintColor={colors.primaryGreen} />}>
        <View style={styles.identityCard}>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              {user.profileUrl && !avatarFailed ? (
                <Image source={{ uri: user.profileUrl }} style={styles.avatarImage} resizeMode="cover"
                  onError={() => setAvatarFailed(true)} accessibilityLabel="Profile photo" />
              ) : <Text style={styles.initials}>{String(initials || "U").slice(0, 2)}</Text>}
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.name}>{user.name || "User"}</Text>
              <View style={styles.roleBadge}><Text style={styles.role}>{role}</Text></View>
              {user.isActive === true && <View style={styles.status}><View style={styles.statusDot} />
                <Text style={styles.statusText}>Active account</Text></View>}
            </View>
          </View>
          <View style={styles.contactDetails}>
            <ContactLine icon="cellphone" label="Mobile" value={user.mobile} />
            <ContactLine icon="email-outline" label="Email" value={user.email} />
          </View>
        </View>

        {canShowSyncActions && <View style={styles.section}>
          <SectionHeading title="Offline workspace" caption="Keep your field work up to date" />
          <View style={styles.syncRow}>
            <SyncAction title="Master Data" subtitle="Refresh offline references" icon="database-refresh-outline"
              busy={isSyncingMasterData} onPress={handleSyncMasterData} />
            <SyncAction title="Pending Work" subtitle="Send saved submissions" icon="cloud-sync-outline"
              busy={isSyncingPendingWork} onPress={handleSyncPendingWork} />
          </View>
        </View>}

        <View style={styles.section}>
          <SectionHeading title="Account settings" />
          <View style={styles.group}>
            {canShowAddContractor && <ActionRow icon="account-plus-outline" title="Add Contractor" onPress={handleOpenAddContractor} />}
            {canManageRoles && <ActionRow icon="account-key-outline" title="Role & Permissions" onPress={handleOpenRoleManager} />}
            <ActionRow icon="shield-check-outline" title="App Permissions" subtitle="Review device access" onPress={handleOpenPermissions} />
            <ActionRow icon="account-remove-outline" title="Request account deletion" last
              subtitle="Manage your account & personal data"
              onPress={() => setLegalDocument(ACCOUNT_DELETION_CONTACT)}
              hint="Opens contact instructions. This does not delete your account or submit a request." />
          </View>
        </View>

        <View style={styles.footer}>
        <TouchableOpacity style={styles.logout} activeOpacity={0.7} onPress={handleLogout}
          accessibilityRole="button" accessibilityLabel="Log out">
          <Icon source="logout-variant" size={19} color={colors.danger} /><Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
        <View style={styles.legalRow}>
          {[LEGAL_DOCUMENTS.privacy, LEGAL_DOCUMENTS.terms].map(document => (
            <TouchableOpacity key={document.id} style={styles.legalLink} onPress={() => setLegalDocument(document)}
              accessibilityRole="button" activeOpacity={0.7}>
              <Text style={styles.legalText}>{document.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.version}>IrriTrack · Version {APP_VERSION}</Text>
        </View>
      </ScrollView>
      <LegalDocumentViewer document={legalDocument} onClose={() => setLegalDocument(null)} onOpenDocument={setLegalDocument} />
    </SafeAreaView>
  );
};

const SectionHeading = ({ title, caption }) => <View style={styles.sectionHeading}>
  <Text style={styles.sectionTitle}>{title}</Text>
  {caption && <Text style={styles.sectionCaption}>{caption}</Text>}
</View>;
const ContactLine = ({ icon, label, value }) => <View style={styles.contactLine}>
  <Icon source={icon} size={16} color={colors.textSecondary} />
  <View style={styles.contactCopy}>
    <Text style={styles.contactLabel}>{label}</Text>
    <Text style={styles.contactText} selectable accessibilityLabel={`${label}: ${value || "Not provided"}`}>
      {value || "Not provided"}
    </Text>
  </View>
</View>;
const ActionRow = ({ icon, title, subtitle, onPress, last, hint }) => <TouchableOpacity
  style={styles.actionRow} onPress={onPress} activeOpacity={0.7} accessibilityRole="button"
  accessibilityLabel={title} accessibilityHint={hint}>
  <View style={styles.rowIcon}><Icon source={icon} size={20} color={colors.primaryBlue} /></View>
  <View style={[styles.rowBody, !last && styles.rowDivider]}>
    <View style={styles.rowCopy}>
      <Text style={styles.rowTitle}>{title}</Text>
      {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
    </View>
    <ConsentIcon name="chevron" size={18} color={colors.textSecondary} />
  </View>
</TouchableOpacity>;
const SyncAction = ({ title, subtitle, icon, busy, onPress }) => <TouchableOpacity
  style={[styles.syncTile, busy && styles.disabled]} disabled={busy} onPress={onPress} activeOpacity={0.7}
  accessibilityRole="button" accessibilityLabel={title} accessibilityHint={subtitle}
  accessibilityState={{ disabled: busy, busy }}>
  <View style={styles.syncIcon}>{busy ? <ActivityIndicator size="small" color={colors.primaryGreen} />
    : <Icon source={icon} size={21} color={colors.primaryGreen} />}</View>
  <Text style={styles.syncTitle}>{busy ? "Syncing…" : title}</Text>
  <Text style={styles.syncCaption}>{subtitle}</Text>
</TouchableOpacity>;
export default ProfileScreen;
