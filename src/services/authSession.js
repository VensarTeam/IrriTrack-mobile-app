const REFRESH_BUFFER_MS = 60 * 1000;

const toExpiryTime = (expiresAt, expiresIn, referenceTime = Date.now()) => {
  if (typeof expiresAt === "number" && Number.isFinite(expiresAt)) {
    return expiresAt;
  }

  if (typeof expiresIn === "number" && Number.isFinite(expiresIn)) {
    return referenceTime + expiresIn * 1000;
  }

  return null;
};

export const normalizeAuthSession = (session, createUser, referenceTime = Date.now()) => {
  if (!session?.accessToken || !session?.refreshToken) {
    return null;
  }

  return {
    accessToken: session.accessToken,
    accessExpiresIn: session.accessExpiresIn ?? null,
    accessTokenExpiresAt: toExpiryTime(
      session.accessTokenExpiresAt,
      session.accessExpiresIn,
      referenceTime
    ),
    refreshToken: session.refreshToken,
    refreshExpiresIn: session.refreshExpiresIn ?? null,
    refreshTokenExpiresAt: toExpiryTime(
      session.refreshTokenExpiresAt,
      session.refreshExpiresIn,
      referenceTime
    ),
    user: createUser(session.user),
  };
};

export const mergeAuthSession = (
  currentSession,
  incomingSession,
  createUser,
  referenceTime = Date.now()
) =>
  normalizeAuthSession(
    {
      ...currentSession,
      ...incomingSession,
      user: incomingSession?.user || currentSession?.user,
    },
    createUser,
    referenceTime
  );

export const isTokenExpired = (expiresAt, now = Date.now()) =>
  typeof expiresAt === "number" && Number.isFinite(expiresAt)
    ? now >= expiresAt
    : false;

export const shouldRefreshToken = (expiresAt, now = Date.now()) =>
  typeof expiresAt === "number" && Number.isFinite(expiresAt)
    ? now + REFRESH_BUFFER_MS >= expiresAt
    : false;

export const isSessionAvailable = (session, now = Date.now()) =>
  Boolean(session?.refreshToken) && !isTokenExpired(session?.refreshTokenExpiresAt, now);
