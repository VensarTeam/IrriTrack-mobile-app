import { useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../context/AuthContext";
import {
  getPendingChecklistSubmissionCount,
  syncQueuedChecklistSubmissions,
} from "../services/checklistOfflineSync";
import { refreshOfflineMasterData } from "../services/offlineMasterSync";

const canUseNetwork = (state = {}) =>
  state.isInternetReachable === true || state.isConnected !== false;

const logGate = (message, details = undefined) => {
  if (typeof details === "undefined") {
    console.log("[ChecklistNetwork]", message);
    return;
  }

  console.log("[ChecklistNetwork]", message, details);
};

const OfflineChecklistSyncGate = () => {
  const { isAuthenticated, isAppLocked, session, user } = useAuth();
  const isMasterSyncingRef = useRef(false);
  const isQueueSyncingRef = useRef(false);
  const syncedSessionRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || isAppLocked) {
      logGate("Sync gate inactive", { isAuthenticated, isAppLocked });
      if (!isAuthenticated) {
        syncedSessionRef.current = null;
      }
      return undefined;
    }

    let isMounted = true;
    const sessionKey =
      session?.user?.id || user?.id || user?.mobile || session?.accessToken;
    const isMasterAlreadySynced = syncedSessionRef.current === sessionKey;

    if (!sessionKey) {
      logGate("One-time master sync skipped; session not ready");
      return undefined;
    }

    if (isMasterAlreadySynced) {
      logGate("One-time master sync already completed for this login");
    } else {
      logGate("One-time master sync active");
    }

    const runMasterSync = async (networkState = null) => {
      if (!isMounted) {
        logGate("Master sync ignored; component unmounted");
        return;
      }

      if (isMasterAlreadySynced) {
        logGate("Master sync skipped; already completed for this login");
        return;
      }

      if (isMasterSyncingRef.current) {
        logGate("Master sync ignored; sync already running");
        return;
      }

      if (networkState && !canUseNetwork(networkState)) {
        logGate("Master sync ignored; network unavailable", {
          isConnected: networkState.isConnected,
          isInternetReachable: networkState.isInternetReachable,
          type: networkState.type,
        });
        return;
      }

      isMasterSyncingRef.current = true;
      logGate("One-time master sync started", {
        hasNetworkState: !!networkState,
        isConnected: networkState?.isConnected,
        isInternetReachable: networkState?.isInternetReachable,
        type: networkState?.type,
      });

      try {
        const summary = await refreshOfflineMasterData({ deviceType: "OMS" });

        syncedSessionRef.current = sessionKey;
        logGate("One-time master data refresh completed", {
          checklistCount: summary.checklistCount,
          projectCount: summary.projectCount,
          contractorCount: summary.contractorCount,
          omsProjectCount: summary.omsProjectCount,
          omsUnitCount: summary.omsUnitCount,
        });
      } catch (error) {
        logGate("Master data refresh failed; using SQLite cache", {
          message: error?.message,
          status: error?.status,
        });
        // Master data remains available from the last successful cache refresh.
      } finally {
        logGate("One-time master sync finished");
        isMasterSyncingRef.current = false;
      }
    };

    const runQueueSync = async (networkState = null) => {
      if (!isMounted) {
        logGate("Queue sync ignored; component unmounted");
        return;
      }

      if (networkState && !canUseNetwork(networkState)) {
        logGate("Queue sync ignored; network unavailable", {
          isConnected: networkState.isConnected,
          isInternetReachable: networkState.isInternetReachable,
          type: networkState.type,
        });
        return;
      }

      if (isQueueSyncingRef.current) {
        logGate("Queue sync ignored; sync already running");
        return;
      }

      try {
        const pendingCount = await getPendingChecklistSubmissionCount();

        if (!pendingCount) {
          logGate("Queue sync skipped; no pending checklist submissions");
          return;
        }

        isQueueSyncingRef.current = true;
        logGate("Queue sync started", {
          pendingCount,
          isConnected: networkState?.isConnected,
          isInternetReachable: networkState?.isInternetReachable,
          type: networkState?.type,
        });

        const result = await syncQueuedChecklistSubmissions();
        logGate("Queue sync finished", {
          checked: result.checked,
          synced: result.synced,
          failed: result.failed,
          skippedOffline: result.skippedOffline,
        });
      } catch (error) {
        logGate("Queue sync failed", {
          message: error?.message,
          status: error?.status,
        });
      } finally {
        isQueueSyncingRef.current = false;
      }
    };

    const runSync = async (networkState = null) => {
      await runMasterSync(networkState);
      await runQueueSync(networkState);
    };

    logGate("Checking network for checklist sync gate");
    void NetInfo.fetch().then(runSync);
    const unsubscribe = NetInfo.addEventListener((networkState) => {
      if (canUseNetwork(networkState)) {
        logGate("Network restored; triggering checklist sync", {
          isConnected: networkState.isConnected,
          isInternetReachable: networkState.isInternetReachable,
          type: networkState.type,
        });
        void runSync(networkState);
      }
    });

    return () => {
      logGate("Sync gate cleanup");
      isMounted = false;
      unsubscribe();
    };
  }, [isAuthenticated, isAppLocked, session, user]);

  return null;
};

export default OfflineChecklistSyncGate;
