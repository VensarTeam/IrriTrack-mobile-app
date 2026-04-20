import { useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../context/AuthContext";
import { refreshChecklistProcessMaster } from "../services/checklistOfflineSync";
import { refreshProjectList } from "../services/projectOfflineStore";

const canUseNetwork = (state = {}) =>
  Boolean(state.isConnected) && state.isInternetReachable !== false;

const logGate = (message, details = undefined) => {
  if (typeof details === "undefined") {
    console.log("[ChecklistNetwork]", message);
    return;
  }

  console.log("[ChecklistNetwork]", message, details);
};

const OfflineChecklistSyncGate = () => {
  const { isAuthenticated, isAppLocked, session, user } = useAuth();
  const isSyncingRef = useRef(false);
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

    if (!sessionKey) {
      logGate("One-time master sync skipped; session not ready");
      return undefined;
    }

    if (syncedSessionRef.current === sessionKey) {
      logGate("One-time master sync already completed for this login");
      return undefined;
    }

    logGate("One-time master sync active");

    const runSync = async (networkState = null) => {
      if (!isMounted) {
        logGate("Sync request ignored; component unmounted");
        return;
      }

      if (isSyncingRef.current) {
        logGate("Sync request ignored; sync already running");
        return;
      }

      if (networkState && !canUseNetwork(networkState)) {
        logGate("Sync request ignored; network unavailable", {
          isConnected: networkState.isConnected,
          isInternetReachable: networkState.isInternetReachable,
          type: networkState.type,
        });
        return;
      }

      isSyncingRef.current = true;
      logGate("One-time master sync started", {
        hasNetworkState: !!networkState,
        isConnected: networkState?.isConnected,
        isInternetReachable: networkState?.isInternetReachable,
        type: networkState?.type,
      });

      try {
        const [checklistResult, projectResult] = await Promise.allSettled([
          refreshChecklistProcessMaster({ deviceType: "OMS" }),
          refreshProjectList(),
        ]);

        if (checklistResult.status === "rejected") {
          logGate("Checklist master refresh failed", {
            message: checklistResult.reason?.message,
            status: checklistResult.reason?.status,
          });
        }

        if (projectResult.status === "rejected") {
          logGate("Project list refresh failed", {
            message: projectResult.reason?.message,
            status: projectResult.reason?.status,
          });
        }

        if (
          checklistResult.status === "rejected" &&
          projectResult.status === "rejected"
        ) {
          throw checklistResult.reason;
        }

        syncedSessionRef.current = sessionKey;
        logGate("One-time master data refresh completed", {
          checklistCount:
            checklistResult.status === "fulfilled"
              ? checklistResult.value.reduce(
                  (count, process) =>
                    count +
                    (process.subprocesses || []).reduce(
                      (subCount, subprocess) =>
                        subCount + (subprocess.checklists?.length || 0),
                      0
                    ),
                  0
                )
              : 0,
          projectCount:
            projectResult.status === "fulfilled" ? projectResult.value.length : 0,
        });
      } catch (error) {
        logGate("Master data refresh failed; using SQLite cache", {
          message: error?.message,
          status: error?.status,
        });
        // Master data remains available from the last successful cache refresh.
      } finally {
        logGate("One-time master sync finished");
        isSyncingRef.current = false;
      }
    };

    logGate("Checking network for one-time master sync");
    void NetInfo.fetch().then(runSync);

    return () => {
      logGate("Sync gate cleanup");
      isMounted = false;
    };
  }, [isAuthenticated, isAppLocked, session, user]);

  return null;
};

export default OfflineChecklistSyncGate;
