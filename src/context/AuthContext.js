import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { createUser } from "../models/user";
import {
  getPermissionMenu,
  getProfile,
  logoutSession,
  refreshAccessToken as requestTokenRefresh,
  startFaceLogin,
  verifyFaceLogin,
} from "../services/authApi";
import {
  API_MESSAGES,
  configureApiClientAuth,
  createSessionExpiredError,
  getUnsupportedVerificationMessage,
  isUnauthorizedApiError,
  setApiClientAuthorizationToken,
} from "../services/apiClient";
import {
  isSessionAvailable,
  isTokenExpired,
  mergeAuthSession,
  normalizeAuthSession,
  shouldRefreshToken,
} from "../services/authSession";
import {
  isAuthorizationSnapshotForUser,
  normalizeAuthorizationSnapshot,
} from "../services/authPermissions";
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  saveAuthSession,
} from "../services/authStorage";
import { authenticateDeviceForAppUnlock } from "../services/deviceAuthentication";
import { createRoleAccess } from "../services/roleAccess";

const AuthContext = createContext(null);
const PROFILE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const PROFILE_REFRESH_RETRY_BACKOFF_MS = 30 * 1000;
const apiAuthCallbackRef = {
  getAccessToken: null,
  refreshAccessToken: null,
};

const normalizeSession = (session, referenceTime) =>
  normalizeAuthSession(session, createUser, referenceTime);

const areUserProfilesEqual = (currentUser, nextUser) =>
  JSON.stringify(currentUser || null) === JSON.stringify(nextUser || null);

const areAuthorizationSnapshotsEqual = (currentValue, nextValue) => {
  const { syncedAt: _currentSyncedAt, ...currentComparable } =
    currentValue || {};
  const { syncedAt: _nextSyncedAt, ...nextComparable } = nextValue || {};

  return JSON.stringify(currentComparable) === JSON.stringify(nextComparable);
};

configureApiClientAuth({
  getAccessToken: (...args) => apiAuthCallbackRef.getAccessToken?.(...args),
  refreshAccessToken: (...args) =>
    apiAuthCallbackRef.refreshAccessToken?.(...args),
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState === "active"
  );
  const refreshPromiseRef = useRef(null);
  const profileRefreshPromiseRef = useRef(null);
  const lastProfileRefreshAttemptAtRef = useRef(0);
  const lastProfileRefreshSuccessAtRef = useRef(0);
  const unlockPromiseRef = useRef(null);
  const sessionRef = useRef(null);

  const setActiveSession = useCallback((nextSession) => {
    sessionRef.current = nextSession;
    setApiClientAuthorizationToken(nextSession?.accessToken);
    setSession(nextSession);
  }, []);

  const clearSession = useCallback(async () => {
    refreshPromiseRef.current = null;
    profileRefreshPromiseRef.current = null;
    lastProfileRefreshAttemptAtRef.current = 0;
    lastProfileRefreshSuccessAtRef.current = 0;
    unlockPromiseRef.current = null;
    setIsAppLocked(false);
    setIsUnlocking(false);
    setUnlockError("");
    setActiveSession(null);
    await clearStoredAuthSession();
  }, [setActiveSession]);

  const persistSession = useCallback(
    async (nextSession) => {
      setActiveSession(nextSession);
      await saveAuthSession(nextSession);
      return nextSession;
    },
    [setActiveSession]
  );

  const refreshSession = useCallback(
    async (sessionToRefresh = sessionRef.current) => {
      if (!sessionToRefresh?.refreshToken) {
        await clearSession();
        throw createSessionExpiredError();
      }

      if (isTokenExpired(sessionToRefresh.refreshTokenExpiresAt)) {
        await clearSession();
        throw createSessionExpiredError();
      }

      if (!refreshPromiseRef.current) {
        refreshPromiseRef.current = (async () => {
          try {
            const refreshedTokens = await requestTokenRefresh({
              refreshToken: sessionToRefresh.refreshToken,
            });

            const refreshedSession = mergeAuthSession(
              sessionToRefresh,
              refreshedTokens,
              createUser
            );

            if (!refreshedSession) {
              throw createSessionExpiredError();
            }

            await persistSession(refreshedSession);
            return refreshedSession;
          } catch (error) {
            if (isUnauthorizedApiError(error)) {
              await clearSession();
              throw createSessionExpiredError();
            }

            throw error;
          } finally {
            refreshPromiseRef.current = null;
          }
        })();
      }

      return refreshPromiseRef.current;
    },
    [clearSession, persistSession]
  );

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedSession = normalizeSession(await getStoredAuthSession());

        if (!storedSession || !isSessionAvailable(storedSession)) {
          await clearStoredAuthSession();

          if (isMounted) {
            setActiveSession(null);
            setIsAppLocked(false);
          }
          return;
        }

        if (
          isTokenExpired(storedSession.accessTokenExpiresAt) ||
          shouldRefreshToken(storedSession.accessTokenExpiresAt)
        ) {
          try {
            const refreshedSession = await refreshSession(storedSession);

            if (isMounted) {
              setActiveSession(refreshedSession);
              setIsAppLocked(true);
              setUnlockError("");
            }
            return;
          } catch (error) {
            if (isUnauthorizedApiError(error) && isMounted) {
              setActiveSession(null);
              setIsAppLocked(false);
              return;
            }

            // Keep the stored session in memory during transient failures.
            if (isMounted) {
              setActiveSession(storedSession);
              setIsAppLocked(true);
              setUnlockError("");
            }
            return;
          }
        }

        if (isMounted) {
          setActiveSession(storedSession);
          setIsAppLocked(true);
          setUnlockError("");
        }
      } finally {
        if (isMounted) {
          setIsRestoring(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [refreshSession, setActiveSession]);

  const beginSignIn = useCallback(async (credentials) => {
    const data = await startFaceLogin(credentials);

    if (data?.requiredVerification && data.requiredVerification !== "face") {
      throw new Error(
        getUnsupportedVerificationMessage(data.requiredVerification)
      );
    }

    return data;
  }, []);

  const finishFaceVerification = useCallback(
    async ({ verificationToken, faceImage }) => {
      const verifiedSession = normalizeSession(
        await verifyFaceLogin({ verificationToken, faceImage })
      );

      if (!verifiedSession) {
        throw new Error(API_MESSAGES.sessionIncomplete);
      }

      await persistSession(verifiedSession);
      setIsAppLocked(false);
      setUnlockError("");
      return verifiedSession;
    },
    [persistSession]
  );

  const unlockSession = useCallback(async () => {
    const currentSession = sessionRef.current;

    if (!currentSession || !isSessionAvailable(currentSession)) {
      setIsAppLocked(false);
      setUnlockError("");
      return false;
    }

    if (!unlockPromiseRef.current) {
      unlockPromiseRef.current = (async () => {
        setIsUnlocking(true);

        try {
          const result = await authenticateDeviceForAppUnlock();

          if (result.success) {
            setIsAppLocked(false);
            setUnlockError("");
            return true;
          }

          setIsAppLocked(true);
          setUnlockError(result.error);
          return false;
        } finally {
          setIsUnlocking(false);
          unlockPromiseRef.current = null;
        }
      })();
    }

    return unlockPromiseRef.current;
  }, []);

  useEffect(() => {
    if (
      isRestoring ||
      !isAppActive ||
      !isSessionAvailable(session) ||
      !isAppLocked
    ) {
      return;
    }

    void unlockSession();
  }, [isAppActive, isAppLocked, isRestoring, session, unlockSession]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      setIsAppActive(nextAppState === "active");
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const getValidAccessToken = useCallback(
    async ({ forceRefresh = false } = {}) => {
      const currentSession = sessionRef.current;

      if (!currentSession || !isSessionAvailable(currentSession)) {
        await clearSession();
        return null;
      }

      if (
        forceRefresh ||
        isTokenExpired(currentSession.accessTokenExpiresAt) ||
        shouldRefreshToken(currentSession.accessTokenExpiresAt)
      ) {
        const refreshedSession = await refreshSession(currentSession);
        return refreshedSession?.accessToken ?? null;
      }

      return currentSession.accessToken;
    },
    [clearSession, refreshSession]
  );

  apiAuthCallbackRef.getAccessToken = getValidAccessToken;
  apiAuthCallbackRef.refreshAccessToken = () =>
    getValidAccessToken({ forceRefresh: true });

  useEffect(() => {
    return () => {
      apiAuthCallbackRef.getAccessToken = null;
      apiAuthCallbackRef.refreshAccessToken = null;
      setApiClientAuthorizationToken(null);
    };
  }, []);

  const refreshProfile = useCallback(
    ({ force = false, maxAgeMs = PROFILE_REFRESH_INTERVAL_MS } = {}) => {
      const currentSession = sessionRef.current;

      if (!currentSession || !isSessionAvailable(currentSession)) {
        return clearSession().then(() => null);
      }

      const now = Date.now();

      if (!force && !profileRefreshPromiseRef.current) {
        const hasFreshProfile =
          lastProfileRefreshSuccessAtRef.current > 0 &&
          now - lastProfileRefreshSuccessAtRef.current <
            Math.max(0, Number(maxAgeMs) || 0);
        const isRetryCoolingDown =
          lastProfileRefreshAttemptAtRef.current > 0 &&
          now - lastProfileRefreshAttemptAtRef.current <
            PROFILE_REFRESH_RETRY_BACKOFF_MS;

        if (hasFreshProfile || isRetryCoolingDown) {
          return Promise.resolve(currentSession.user || null);
        }
      }

      if (!profileRefreshPromiseRef.current) {
        lastProfileRefreshAttemptAtRef.current = now;
        profileRefreshPromiseRef.current = (async () => {
          let profile;

          try {
            profile = createUser(await getProfile());
          } catch (error) {
            if (isUnauthorizedApiError(error)) {
              await clearSession();
            }

            throw error;
          }

          let latestSession = sessionRef.current;

          if (!latestSession || !isSessionAvailable(latestSession)) {
            return null;
          }

          const didRoleChange = latestSession.user?.role !== profile.role;

          if (didRoleChange) {
            const roleChangedSession = {
              ...latestSession,
              user: profile,
              authorization: null,
            };

            // Apply the safer UI role immediately and discard the old role's
            // offline permission snapshot even if token rotation is interrupted.
            await persistSession(roleChangedSession);

            // The API authorizes OMS workflow actions from the JWT role. Rotate the
            // access token immediately so the UI role and server role cannot drift.
            latestSession = await refreshSession(roleChangedSession);
          }

          let authorization = isAuthorizationSnapshotForUser(
            latestSession.authorization,
            profile
          )
            ? latestSession.authorization
            : null;

          try {
            const refreshedAuthorization = normalizeAuthorizationSnapshot(
              await getPermissionMenu(),
              profile.role
            );
            authorization = areAuthorizationSnapshotsEqual(
              authorization,
              refreshedAuthorization
            )
              ? authorization
              : refreshedAuthorization;
          } catch (error) {
            if (isUnauthorizedApiError(error)) {
              await clearSession();
              throw error;
            }

            // A matching snapshot is safe for offline use. Never retain access
            // cached for a different role after a web-side role update.
            console.log("[Auth] Permission sync deferred; using saved access", {
              hasMatchingSnapshot: Boolean(authorization),
              message: error?.message,
              status: error?.status,
            });
          }

          const nextSession = {
            ...latestSession,
            user: profile,
            authorization,
          };

          if (
            !areUserProfilesEqual(latestSession.user, profile) ||
            JSON.stringify(latestSession.authorization || null) !==
              JSON.stringify(authorization || null)
          ) {
            await persistSession(nextSession);
          }
          lastProfileRefreshSuccessAtRef.current = Date.now();
          return profile;
        })().finally(() => {
          profileRefreshPromiseRef.current = null;
        });
      }

      return profileRefreshPromiseRef.current;
    },
    [clearSession, persistSession, refreshSession]
  );

  useEffect(() => {
    if (
      isRestoring ||
      !isAppActive ||
      !isSessionAvailable(session)
    ) {
      return undefined;
    }

    const syncProfile = (options) => {
      void refreshProfile(options).catch((error) => {
        if (!isUnauthorizedApiError(error)) {
          console.log("[Auth] Profile sync deferred; using saved profile", {
            message: error?.message,
            status: error?.status,
          });
        }
      });
    };

    syncProfile({ force: true });
    const intervalId = setInterval(
      () => syncProfile(),
      PROFILE_REFRESH_INTERVAL_MS
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [
    isAppActive,
    isRestoring,
    refreshProfile,
    session?.refreshToken,
  ]);

  const logout = useCallback(async () => {
    const currentSession = sessionRef.current;

    if (currentSession?.refreshToken) {
      await logoutSession({ refreshToken: currentSession.refreshToken });
    }

    await clearSession();
  }, [clearSession]);

  const roleAccess = useMemo(
    () => createRoleAccess(session?.user?.role, session?.authorization),
    [session?.authorization, session?.user?.role]
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      authorization: session?.authorization ?? null,
      roleAccess,
      isAuthenticated: isSessionAvailable(session),
      isRestoring,
      isAppLocked,
      isUnlocking,
      unlockError,
      beginSignIn,
      finishFaceVerification,
      unlockSession,
      refreshProfile,
      logout,
    }),
    [
      beginSignIn,
      finishFaceVerification,
      isAppLocked,
      isRestoring,
      isUnlocking,
      logout,
      refreshProfile,
      roleAccess,
      session,
      unlockError,
      unlockSession,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const contextValue = useContext(AuthContext);

  if (!contextValue) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return contextValue;
};
