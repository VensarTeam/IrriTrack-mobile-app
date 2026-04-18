import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const AuthContext = createContext(null);

const normalizeSession = (session, referenceTime) =>
  normalizeAuthSession(session, createUser, referenceTime);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const refreshPromiseRef = useRef(null);
  const sessionRef = useRef(null);

  const setActiveSession = useCallback((nextSession) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, []);

  const clearSession = useCallback(async () => {
    refreshPromiseRef.current = null;
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
            }
            return;
          } catch (error) {
            if (isUnauthorizedApiError(error) && isMounted) {
              setActiveSession(null);
              return;
            }

            // Keep the stored session in memory during transient failures.
            if (isMounted) {
              setActiveSession(storedSession);
            }
            return;
          }
        }

        if (isMounted) {
          setActiveSession(storedSession);
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
      return verifiedSession;
    },
    [persistSession]
  );

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
      beginSignIn,
      finishFaceVerification,
      refreshProfile,
      logout,
    }),
    [
      beginSignIn,
      finishFaceVerification,
      isRestoring,
      logout,
      refreshProfile,
      session,
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
