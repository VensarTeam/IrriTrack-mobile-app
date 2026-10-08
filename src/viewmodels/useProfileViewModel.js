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
import { flushPendingPipeMutations } from "../services/pipeNetworkSync";
import { getPendingPipeMutationCount } from "../services/pipeNetworkOfflineStore";

const useProfileViewModel = (navigation) => {
  const { logout, refreshProfile, user: authenticatedUser, roleAccess } = useAuth();
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [isSyncingMasterData, setIsSyncingMasterData] = useState(false);
  const [isSyncingPendingWork, setIsSyncingPendingWork] = useState(false);
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

  const handleSyncPendingWork = async () => {
    if (isSyncingPendingWork) return;

    setIsSyncingPendingWork(true);
    console.log("[ChecklistProfile]", "Manual all-module pending-work sync pressed");

    try {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected !== true || networkState.isInternetReachable === false) {
        showAppAlert({
          type: "warning",
          title: "You’re offline",
          message: "Pending work remains saved on this device and will sync when the connection returns.",
        });
        return;
      }

      const ownerUserId = String(user?.id || user?.mobile || "").trim();
      const canSyncOmsChecklist = String(user?.role || "").toLowerCase() === "supervisor";
      const [pendingOmsCount, pendingPipeCount] = await Promise.all([
        canSyncOmsChecklist
          ? getPendingChecklistSubmissionCount({ ownerUserId })
          : Promise.resolve(0),
        getPendingPipeMutationCount(ownerUserId),
      ]);

      if (!pendingOmsCount && !pendingPipeCount) {
        showAppAlert({
          type: "info",
          title: "No data to sync",
          message: "No saved offline work is waiting to sync for any module.",
        });
        return;
      }

      const [omsResult, pipeResult] = await Promise.all([
        pendingOmsCount
          ? syncQueuedChecklistSubmissions({ ownerUserId })
          : Promise.resolve({ synced: 0, failed: 0, skippedOffline: false }),
        pendingPipeCount
          ? flushPendingPipeMutations(ownerUserId, { force: true })
          : Promise.resolve({ synced: 0, failed: 0 }),
      ]);
      const syncedCount = Number(omsResult.synced || 0) + Number(pipeResult.synced || 0);
      const failedCount = Number(omsResult.failed || 0) + Number(pipeResult.failed || 0);
      const stillQueuedCount = Math.max(0, pendingOmsCount + pendingPipeCount - syncedCount);
      const syncMessage = omsResult.skippedOffline
        ? "Network unavailable. Offline work remains saved locally."
        : failedCount || stillQueuedCount
          ? `${syncedCount} item(s) synced. ${stillQueuedCount} remain saved for retry.`
          : `${syncedCount} offline item(s) synced across all available modules.`;

      showAppAlert({
        type: failedCount || omsResult.skippedOffline ? "warning" : "success",
        title: "Pending work checked",
        message: syncMessage,
      });
    } catch (error) {
      console.log("[ChecklistProfile]", "Manual pending-work sync failed", {
        message: error?.message,
        status: error?.status,
      });
      showAppAlert({
        type: "danger",
        title: "Sync failed",
        message:
          error?.message ||
          "Unable to sync saved offline work. Please try again.",
      });
    } finally {
      setIsSyncingPendingWork(false);
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
    isSyncingPendingWork,
    handleRefreshProfile,
    handleSyncMasterData,
    handleSyncPendingWork,
    handleOpenAddContractor,
    handleLogout,
  };
};

export default useProfileViewModel;
