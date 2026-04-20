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
} from "../services/apiClient";
import {
  isSessionAvailable,
  isTokenExpired,
  mergeAuthSession,
  normalizeAuthSession,
  shouldRefreshToken,
} from "../services/authSession";
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  saveAuthSession,
} from "../services/authStorage";
import { authenticateDeviceForAppUnlock } from "../services/deviceAuthentication";

const AuthContext = createContext(null);

const normalizeSession = (session, referenceTime) =>
  normalizeAuthSession(session, createUser, referenceTime);

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
  const unlockPromiseRef = useRef(null);
  const sessionRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const setActiveSession = useCallback((nextSession) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, []);

  const clearSession = useCallback(async () => {
    refreshPromiseRef.current = null;
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
      const wasActive = appStateRef.current === "active";
      appStateRef.current = nextAppState;
      setIsAppActive(nextAppState === "active");

      if (
        wasActive &&
        nextAppState !== "active" &&
        isSessionAvailable(sessionRef.current)
      ) {
        setIsAppLocked(true);
        setUnlockError("");
      }
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

  useEffect(() => {
    configureApiClientAuth({
      getAccessToken: getValidAccessToken,
      refreshAccessToken: async () =>
        getValidAccessToken({ forceRefresh: true }),
    });

    return () => {
      configureApiClientAuth();
    };
  }, [getValidAccessToken]);

  const refreshProfile = useCallback(async () => {
    const currentSession = sessionRef.current;

    if (!currentSession || !isSessionAvailable(currentSession)) {
      await clearSession();
      return null;
    }

    let profile;

    try {
      profile = createUser(await getProfile());
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        await clearSession();
      }

      throw error;
    }

    const nextSession = {
      ...currentSession,
      user: profile,
    };

    await persistSession(nextSession);
    return profile;
  }, [clearSession, persistSession]);

  const logout = useCallback(async () => {
    const currentSession = sessionRef.current;

    if (currentSession?.refreshToken) {
      try {
        await logoutSession({ refreshToken: currentSession.refreshToken });
      } catch (error) {
        console.warn("Unable to logout from server", error);
      }
    }

    await clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
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
