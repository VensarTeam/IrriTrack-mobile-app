import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Icon } from "react-native-paper";
import styles from "./styles";
import colors from "../../constants/colors";
import { APP_VERSION } from "../../constants/appInfo";
import useProfileViewModel from "../../viewmodels/useProfileViewModel";
import { ROUTES } from "../../navigation/routes";

const toTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const ProfileScreen = ({ navigation }) => {
  const {
    user,
    initials,
    canShowSyncActions,
    canShowAddContractor,
    isRefreshingProfile,
    isSyncingMasterData,
    isSyncingPendingWork,
    handleRefreshProfile,
    handleSyncMasterData,
    handleSyncPendingWork,
    handleOpenAddContractor,
    handleLogout,
  } = useProfileViewModel(navigation);

  const handleOpenPermissions = useCallback(() => {
    navigation.navigate(ROUTES.ROOT.PERMISSIONS);
  }, [navigation]);

  const handleOpenRoleManager = useCallback(() => {
    navigation.navigate(ROUTES.ROOT.ROLE_PERMISSION_MANAGER);
  }, [navigation]);

  const isActiveUser = user.isActive === true;
  const role = toTitleCase(user.role) || "No Role Assigned";
  const canManageRoles = String(user.role || "").toLowerCase() === "developer";

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[
          colors.loginHeroGradientStart,
          colors.loginHeroGradientMid,
          colors.loginHeroGradientEnd,
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.bodyWrapper}
        contentContainerStyle={styles.detailsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingProfile}
            onRefresh={handleRefreshProfile}
            colors={[colors.primaryGreen]}
            tintColor={colors.primaryGreen}
          />
        }
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatarBorder}>
            {user.profileUrl ? (
              <Image
                source={{ uri: user.profileUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
          </View>

          {isActiveUser ? <View style={styles.activeDot} /> : null}
        </View>

        <Text style={styles.name}>{user.name || "User"}</Text>

        <LinearGradient
          colors={[
            "rgba(255,255,255,0.78)",
            "rgba(234,243,255,0.62)",
            "rgba(255,255,255,0.84)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.designationPill}
        >
          <Text style={styles.designationText} numberOfLines={1}>
            {role}
          </Text>
        </LinearGradient>

        <View style={styles.infoCard}>
          <InfoRow icon="cellphone" label="Mobile" value={user.mobile} />
          <InfoRow icon="email-outline" label="Email" value={user.email} />
          <InfoRow
            icon="briefcase-outline"
            label="Role"
            value={role}
          />
        </View>

        {canShowAddContractor ? (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleOpenAddContractor}
            activeOpacity={0.9}
          >
            <View style={styles.actionCardIconWrap}>
              <Icon source="account-plus-outline" size={22} color={colors.navyFreshDark} />
            </View>

            <View style={styles.actionCardCopy}>
              <Text style={styles.actionCardTitle}>Add Contractor</Text>
            </View>

            <View style={styles.actionCardArrowWrap}>
              <Icon source="chevron-right" size={22} color={colors.primaryBlue} />
            </View>
          </TouchableOpacity>
        ) : null}

        {canManageRoles ? (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleOpenRoleManager}
            activeOpacity={0.9}
          >
            <View style={styles.actionCardIconWrap}>
              <Icon source="account-key-outline" size={22} color={colors.navyFreshDark} />
            </View>
            <View style={styles.actionCardCopy}>
              <Text style={styles.actionCardTitle}>Role & Permissions</Text>
              <Text style={styles.actionCardSubtitle}>Manage mobile access for users</Text>
            </View>
            <View style={styles.actionCardArrowWrap}>
              <Icon source="chevron-right" size={22} color={colors.primaryBlue} />
            </View>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleOpenPermissions}
          activeOpacity={0.9}
        >
          <View style={styles.actionCardIconWrap}>
            <Icon source="shield-check-outline" size={22} color={colors.navyFreshDark} />
          </View>

          <View style={styles.actionCardCopy}>
            <Text style={styles.actionCardTitle}>App Permissions</Text>
          </View>

          <View style={styles.actionCardArrowWrap}>
            <Icon source="chevron-right" size={22} color={colors.primaryBlue} />
          </View>
        </TouchableOpacity>

        {canShowSyncActions ? (
          <View style={styles.syncCard}>
            <View style={styles.syncHeaderRow}>
              <View>
                <Text style={styles.syncTitle}>Sync</Text>
                <Text style={styles.syncSubtitle}>Offline data sync</Text>
              </View>
              <Icon source="sync" size={22} color={colors.navyFresh} />
            </View>

            <View style={styles.syncActionsRow}>
              <TouchableOpacity
                style={[
                  styles.syncButton,
                  isSyncingMasterData && styles.actionButtonDisabled,
                ]}
                onPress={handleSyncMasterData}
                disabled={isSyncingMasterData}
                activeOpacity={0.88}
              >
                {isSyncingMasterData ? (
                  <ActivityIndicator size="small" color={colors.navyFreshDark} />
                ) : (
                  <Icon
                    source="database-refresh-outline"
                    size={20}
                    color={colors.navyFreshDark}
                  />
                )}
                <Text style={styles.syncButtonText}>
                  {isSyncingMasterData ? "Syncing" : "Master Data"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.syncButton,
                  styles.syncButtonPrimary,
                  isSyncingPendingWork && styles.actionButtonDisabled,
                ]}
                onPress={handleSyncPendingWork}
                disabled={isSyncingPendingWork}
                activeOpacity={0.88}
              >
                {isSyncingPendingWork ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Icon source="cloud-sync-outline" size={20} color={colors.white} />
                )}
                <Text style={styles.syncButtonPrimaryText}>
                  {isSyncingPendingWork ? "Syncing" : "Pending Work"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon source="logout-variant" size={21} color={colors.white} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>App Version {APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Icon source={icon} size={19} color={colors.navyFresh} />
    </View>

    <View style={styles.infoCopy}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value || "-"}
      </Text>
    </View>
  </View>
);
