import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../context/AuthContext";
import {
  refreshChecklistProcessMaster,
  syncQueuedChecklistSubmissions,
} from "../services/checklistOfflineSync";

const canUseNetwork = (state = {}) =>
  Boolean(state.isConnected) && state.isInternetReachable !== false;

const OfflineChecklistSyncGate = () => {
  const { isAuthenticated, isAppLocked } = useAuth();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || isAppLocked) {
      return undefined;
    }

    let isMounted = true;

    const runSync = async (networkState = null) => {
      if (!isMounted || isSyncingRef.current) return;
      if (networkState && !canUseNetwork(networkState)) return;

      isSyncingRef.current = true;

      try {
        await refreshChecklistProcessMaster({ deviceType: "OMS" });
      } catch (error) {
        // Master data remains available from the last successful cache refresh.
      }

      try {
        await syncQueuedChecklistSubmissions();
      } catch (error) {
        // Individual submissions stay in the queue and retry on the next pass.
      } finally {
        isSyncingRef.current = false;
      }
    };

    const handleAppStateChange = (nextState) => {
      if (nextState === "active") {
        void NetInfo.fetch().then(runSync);
      }
    };

    void NetInfo.fetch().then(runSync);
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (canUseNetwork(state)) {
        void runSync(state);
      }
    });
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      isMounted = false;
      unsubscribeNetInfo();
      subscription.remove();
    };
  }, [isAuthenticated, isAppLocked]);

  return null;
};

export default OfflineChecklistSyncGate;
