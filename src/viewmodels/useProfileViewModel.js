import { useCallback, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { ROUTES } from "../navigation/routes";
import { showAppAlert } from "../services/alertService";
import { useAuth } from "../context/AuthContext";
import {
  getPendingChecklistSubmissionCount,
  getPendingChecklistSubmissionSummaries,
  syncQueuedChecklistSubmissions,
} from "../services/checklistOfflineSync";
import { refreshOfflineMasterData } from "../services/offlineMasterSync";
import { flushPendingPipeMutations } from "../services/pipeNetworkSync";
import {
  getPendingPipeMutationCount,
  getPendingPipeMutationSummaries,
} from "../services/pipeNetworkOfflineStore";

const describeSyncError = (error) => {
  const message = String(error || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (/\b413\b/.test(message)) return "Upload too large (HTTP 413)";
  return message.length > 120 ? `${message.slice(0, 117)}...` : message;
};

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
      const networkState = await NetInfo.fetch().catch(() => ({}));
      if (networkState.isConnected === false || networkState.isInternetReachable === false) {
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
          ? syncQueuedChecklistSubmissions({ ownerUserId, ensureLatest: true })
          : Promise.resolve({ synced: 0, failed: 0, skippedOffline: false }),
        pendingPipeCount
          ? flushPendingPipeMutations(ownerUserId, { force: true })
          : Promise.resolve({ synced: 0, failed: 0 }),
      ]);
      const [remainingOms, remainingPipe] = await Promise.all([
        canSyncOmsChecklist
          ? getPendingChecklistSubmissionSummaries({ ownerUserId })
          : Promise.resolve([]),
        getPendingPipeMutationSummaries(ownerUserId),
      ]);
      const syncedCount = Number(omsResult.synced || 0) + Number(pipeResult.synced || 0);
      const stillQueuedCount = remainingOms.length + remainingPipe.length;
      const errorDetails = [
        ...remainingOms.map((entry, index) => ({
          label: `OMS ${index + 1}`,
          state: entry.state,
          error: describeSyncError(entry.lastError),
        })),
        ...remainingPipe.map((entry, index) => ({
          label: `Pipe ${index + 1}`,
          state: entry.state,
          error: describeSyncError(entry.lastError),
        })),
      ];
      console.info("[PendingWorkSync] Manual sync result", {
        oms: { checked: omsResult.checked, synced: omsResult.synced, remaining: remainingOms.length },
        pipe: { checked: pipeResult.checked, synced: pipeResult.synced, remaining: remainingPipe.length },
        failures: errorDetails,
      });
      const detailLines = errorDetails.slice(0, 3).map((item) =>
        `${item.label} (${item.state}): ${item.error || "Not sent yet"}`
      );
      if (errorDetails.length > detailLines.length) {
        detailLines.push(`+${errorDetails.length - detailLines.length} more saved item(s)`);
      }
      const syncMessage = omsResult.skippedOffline
        ? "Network unavailable. Offline work remains saved locally."
        : stillQueuedCount
          ? `${syncedCount} synced. ${stillQueuedCount} still saved on this device (OMS ${remainingOms.length}, Pipe ${remainingPipe.length}).\n${detailLines.join("\n")}`
          : `${syncedCount} item(s) synced. No pending work remains.`;

      showAppAlert({
        type: stillQueuedCount || omsResult.skippedOffline ? "warning" : "success",
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
