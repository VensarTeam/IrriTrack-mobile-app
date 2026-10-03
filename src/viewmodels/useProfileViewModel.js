import { useCallback, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { ROUTES } from "../navigation/routes";
import { showAppAlert } from "../services/alertService";
import { useAuth } from "../context/AuthContext";
import {
  getPendingChecklistSubmissionCount,
  syncQueuedChecklistSubmissions,
} from "../services/checklistOfflineSync";
import { refreshOfflineMasterData } from "../services/offlineMasterSync";

const useProfileViewModel = (navigation) => {
  const { logout, refreshProfile, user: authenticatedUser, roleAccess } = useAuth();
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [isSyncingMasterData, setIsSyncingMasterData] = useState(false);
  const [isSyncingOmsData, setIsSyncingOmsData] = useState(false);
  const user = authenticatedUser || {};
  const initials = (user.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("");

  const handleRefreshProfile = useCallback(async () => {
    if (isRefreshingProfile) return;

    setIsRefreshingProfile(true);
    console.log("[Profile]", "Pull refresh requested");

    try {
      const networkState = await NetInfo.fetch();
      const isOnline =
        Boolean(networkState.isConnected) &&
        networkState.isInternetReachable !== false;

      if (!isOnline) {
        console.log("[Profile]", "Pull refresh skipped; offline", {
          isConnected: networkState.isConnected,
          isInternetReachable: networkState.isInternetReachable,
          type: networkState.type,
        });
        showAppAlert({
          type: "info",
          title: "Offline",
          message: "Showing saved profile data.",
        });
        return;
      }

      await refreshProfile({ force: true });
      console.log("[Profile]", "Profile refreshed and saved locally");
    } catch (error) {
      console.warn("Unable to refresh profile", error);
      showAppAlert({
        type: "danger",
        title: "Refresh failed",
        message: error?.message || "Unable to refresh profile.",
      });
    } finally {
      setIsRefreshingProfile(false);
    }
  }, [isRefreshingProfile, refreshProfile]);

  const handleSyncMasterData = async () => {
    if (isSyncingMasterData) return;

    setIsSyncingMasterData(true);
    console.log("[ChecklistProfile]", "Manual master sync pressed");

    try {
      const summary = await refreshOfflineMasterData({
        deviceType: "OMS",
      });

      showAppAlert({
        type: "success",
        title: "Master data synced",
        message: `${summary.projectCount} project(s), ${summary.omsUnitCount} OMS unit(s), ${summary.contractorCount} contractor(s), ${summary.processCount} process(es), ${summary.subprocessCount} subprocess(es), ${summary.checklistCount} checklist item(s).`,
      });
    } catch (error) {
      console.log("[ChecklistProfile]", "Manual master sync failed", {
        message: error?.message,
        status: error?.status,
      });
      showAppAlert({
        type: "danger",
        title: "Sync failed",
        message:
          error?.message ||
          "Unable to sync checklist data. Please try again.",
      });
    } finally {
      setIsSyncingMasterData(false);
    }
  };

  const handleSyncOmsData = async () => {
    if (isSyncingOmsData) return;

    setIsSyncingOmsData(true);
    console.log("[ChecklistProfile]", "Manual OMS data sync pressed");

    try {
      const ownerUserId = String(user?.id || user?.mobile || "").trim();
      const pendingCount = await getPendingChecklistSubmissionCount({
        ownerUserId,
      });

      if (!pendingCount) {
        showAppAlert({
          type: "info",
          title: "No data to sync",
          message: "No saved OMS checklist data found.",
        });
        return;
      }

      const result = await syncQueuedChecklistSubmissions({
        ownerUserId,
      });
      const syncedCount = result.synced || 0;
      const syncMessage = result.skippedOffline
        ? "Network unavailable. OMS data is still saved locally."
        : result.submitApiConnected
          ? `${syncedCount} saved OMS item(s) synced.`
          : `${pendingCount} saved OMS item(s) are still available locally.`;

      showAppAlert({
        type: result.failed || result.skippedOffline ? "warning" : "info",
        title: "OMS data checked",
        message: syncMessage,
      });
    } catch (error) {
      console.log("[ChecklistProfile]", "Manual OMS data sync failed", {
        message: error?.message,
        status: error?.status,
      });
      showAppAlert({
        type: "danger",
        title: "Sync failed",
        message:
          error?.message ||
          "Unable to sync saved OMS data. Please try again.",
      });
    } finally {
      setIsSyncingOmsData(false);
    }
  };

  const handleLogout = () => {
    showAppAlert({
      type: "warning",
      title: "Confirm Logout",
      message: "Are you sure you want to logout?",
      actions: [
        {
          label: "Cancel",
          variant: "secondary",
        },
        {
          label: "Logout",
          variant: "danger",
          onPress: () => {
            void (async () => {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: ROUTES.ROOT.AUTH_STACK }],
              });
            })();
          },
        },
      ],
      cancelable: true,
    });
  };

  const handleOpenAddContractor = useCallback(() => {
    navigation.navigate(ROUTES.ROOT.ADD_CONTRACTOR);
  }, [navigation]);

  return {
    user,
    initials,
    canShowSyncActions: roleAccess.isContributor,
    canShowAddContractor:
      roleAccess.role === "manager" ||
      roleAccess.role === "admin" ||
      roleAccess.role === "super_admin",
    isRefreshingProfile,
    isSyncingMasterData,
    isSyncingOmsData,
    handleRefreshProfile,
    handleSyncMasterData,
    handleSyncOmsData,
    handleOpenAddContractor,
    handleLogout,
  };
};

export default useProfileViewModel;
