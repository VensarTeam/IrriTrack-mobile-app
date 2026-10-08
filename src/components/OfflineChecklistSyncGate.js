import { useEffect, useRef } from "react";
import { AppState, InteractionManager } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../context/AuthContext";
import {
  getPendingChecklistSubmissionCount,
  syncQueuedChecklistSubmissions,
} from "../services/checklistOfflineSync";
import { refreshOfflineMasterData } from "../services/offlineMasterSync";
import { normalizeUserRole } from "../services/roleAccess";
import {
  flushPendingPipeMutations,
} from "../services/pipeNetworkSync";
import {
  getPendingPipeMutationCount,
} from "../services/pipeNetworkOfflineStore";

const canUseNetwork = (state = {}) =>
  state.isConnected === true && state.isInternetReachable !== false;

const logGate = (message, details = undefined) => {
  if (typeof details === "undefined") {
    //console.log("[ChecklistNetwork]", message);
    return;
  }

  //console.log("[ChecklistNetwork]", message, details);
};

const OfflineChecklistSyncGate = () => {
  const {
    authorization,
    isAuthenticated,
    isAppLocked,
    refreshProfile,
    session,
    user,
  } = useAuth();
  const isMasterSyncingRef = useRef(false);
  const isQueueSyncingRef = useRef(false);
  const syncedSessionRef = useRef(null);
  const authorizationScopeKey = authorization
    ? [
        authorization.role,
        JSON.stringify(authorization.permissions || {}),
        (authorization.effectivePermissions || []).join(","),
        (authorization.serviceIds || []).join(","),
        (authorization.projectIds || []).join(","),
      ].join("|")
    : "permissions-pending";

  useEffect(() => {
    if (!isAuthenticated || isAppLocked) {
      logGate("Sync gate inactive", { isAuthenticated, isAppLocked });
      if (!isAuthenticated) {
        syncedSessionRef.current = null;
      }
      return undefined;
    }

    let isMounted = true;
    const sessionUserId =
      session?.user?.id || user?.id || user?.mobile || session?.accessToken;
    const sessionKey = sessionUserId
      ? `${sessionUserId}:${normalizeUserRole(
          user?.role || session?.user?.role
        )}:${authorizationScopeKey}`
      : "";
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

    const runMasterSync = async (
      networkState = null,
      activeSessionKey = sessionKey
    ) => {
      if (!isMounted) {
        logGate("Master sync ignored; component unmounted");
        return;
      }

      if (syncedSessionRef.current === activeSessionKey) {
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

        syncedSessionRef.current = activeSessionKey;
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

    const runQueueSync = async (networkState = null, activeProfile = user) => {
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

      isQueueSyncingRef.current = true;

      try {
        const ownerUserId = String(
          activeProfile?.id || activeProfile?.mobile || ""
        ).trim();
        const canSyncOmsChecklist = normalizeUserRole(activeProfile?.role) === "supervisor";

        logGate("Queue sync started", {
          canSyncOmsChecklist,
          isConnected: networkState?.isConnected,
          isInternetReachable: networkState?.isInternetReachable,
          type: networkState?.type,
        });

        const [result, pipeResult] = await Promise.all([
          (async () => {
            let pendingCount = 0;
            try {
              pendingCount = canSyncOmsChecklist
                ? await getPendingChecklistSubmissionCount({ ownerUserId })
                : 0;
              if (!pendingCount) {
                return { checked: 0, synced: 0, failed: 0, skippedOffline: 0 };
              }
              return await syncQueuedChecklistSubmissions({ ownerUserId });
            } catch (error) {
              logGate("OMS queue sync failed", { message: error?.message, status: error?.status });
              return { checked: pendingCount, synced: 0, failed: pendingCount, skippedOffline: 0 };
            }
          })(),
          (async () => {
            try {
              const pendingPipeCount = await getPendingPipeMutationCount(ownerUserId);
              return pendingPipeCount > 0
                ? await flushPendingPipeMutations(ownerUserId)
                : { checked: 0, synced: 0, failed: 0 };
            } catch (error) {
              logGate("Pipe queue sync failed", { message: error?.message, status: error?.status });
              return { checked: 0, synced: 0, failed: 1 };
            }
          })(),
        ]);
        logGate("Queue sync finished", {
          checked: result.checked,
          synced: result.synced,
          failed: result.failed,
          skippedOffline: result.skippedOffline,
          pipeSynced: pipeResult.synced,
          pipeFailed: pipeResult.failed,
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
      if (networkState && !canUseNetwork(networkState)) {
        return;
      }

      let activeProfile = user;

      try {
        activeProfile = (await refreshProfile()) || user;
      } catch (error) {
        logGate("Profile sync failed; continuing with cached profile", {
          message: error?.message,
          status: error?.status,
        });
        // A transient profile refresh must not strand locally queued work.
        activeProfile = user;
      }

      const activeSessionKey = activeProfile?.id
        ? `${activeProfile.id}:${normalizeUserRole(
            activeProfile.role
          )}:${authorizationScopeKey}`
        : sessionKey;

      await Promise.all([
        runMasterSync(networkState, activeSessionKey),
        runQueueSync(networkState, activeProfile),
      ]);
    };

    let syncTask = null;
    let syncTimer = null;
    let syncScheduled = false;
    let appIsActive = AppState.currentState === "active";
    const retryPipeQueue = async () => {
      if (!isMounted || !appIsActive || isQueueSyncingRef.current) return;
      try {
        const networkState = await NetInfo.fetch();
        if (!canUseNetwork(networkState)) return;
        const ownerUserId = String(user?.id || user?.mobile || "").trim();
        const pendingCount = await getPendingPipeMutationCount(ownerUserId);
        if (!pendingCount) return;
        const result = await flushPendingPipeMutations(ownerUserId);
        logGate("Pipe queue retry finished", {
          checked: result.checked,
          synced: result.synced,
          failed: result.failed,
        });
      } catch (error) {
        logGate("Pipe queue retry failed", { message: error?.message, status: error?.status });
      }
    };
    const pipeRetryInterval = setInterval(() => {
      void retryPipeQueue();
    }, 45_000);
    const scheduleSync = (networkState) => {
      if (!isMounted || !canUseNetwork(networkState) || syncScheduled) return;
      syncScheduled = true;
      syncTask = InteractionManager.runAfterInteractions(() => {
        syncTimer = setTimeout(() => {
          syncTimer = null;
          syncTask = null;
          void runSync(networkState).finally(() => {
            syncScheduled = false;
          });
        }, 1200);
      });
    };

    let hasHandledNetworkState = false;
    let wasNetworkUsable = false;
    const handleNetworkState = (networkState) => {
      const isNetworkUsable = canUseNetwork(networkState);
      const shouldRunSync =
        isNetworkUsable &&
        (!hasHandledNetworkState || !wasNetworkUsable);

      hasHandledNetworkState = true;
      wasNetworkUsable = isNetworkUsable;

      if (shouldRunSync) {
        //logGate("Network restored; triggering checklist sync", {
        //   isConnected: networkState.isConnected,
        //   isInternetReachable: networkState.isInternetReachable,
        //   type: networkState.type,
        // });
        scheduleSync(networkState);
      }
    };

    logGate("Checking network for checklist sync gate");
    void NetInfo.fetch().then(handleNetworkState);
    const unsubscribe = NetInfo.addEventListener(handleNetworkState);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      appIsActive = state === "active";
      if (state !== "active") return;
      void NetInfo.fetch().then((networkState) => {
        if (canUseNetwork(networkState)) scheduleSync(networkState);
      });
    });

    return () => {
      logGate("Sync gate cleanup");
      isMounted = false;
      syncTask?.cancel?.();
      if (syncTimer) clearTimeout(syncTimer);
      clearInterval(pipeRetryInterval);
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [
    isAuthenticated,
    isAppLocked,
    authorizationScopeKey,
    refreshProfile,
    session?.user?.id,
    session?.user?.role,
    user?.id,
    user?.mobile,
    user?.role,
  ]);

  return null;
};

export default OfflineChecklistSyncGate;
