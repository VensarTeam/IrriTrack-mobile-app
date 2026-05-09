import axios from "axios";
import { API_BASE_URL } from "../config/env";

const RETRYABLE_STATUSES = [408, 429, 500, 502, 503, 504];
const API_LOGS_ENABLED = typeof __DEV__ === "undefined" || __DEV__;

const ERROR_CODES_BY_STATUS = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  408: "REQUEST_TIMEOUT",
  409: "CONFLICT",
  422: "VALIDATION_ERROR",
  429: "TOO_MANY_REQUESTS",
};

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

export const API_MESSAGES = Object.freeze({
  networkUnavailable: DEFAULT_ERROR_MESSAGE,
  sessionExpired: "Your session has expired. Please log in again.",
  sessionIncomplete:
    "We could not complete your login session. Please try again.",
});

export const getUnsupportedVerificationMessage = (verificationType) =>
  `This account requires ${verificationType} verification, which is not supported in the app yet.`;

const authHandlers = {
  getAccessToken: null,
  refreshAccessToken: null,
};

const getHeadersForLog = (headers) =>
  axios.AxiosHeaders.from(headers || {}).toJSON();

const formatRequestUrl = (config) => {
  const baseUrl = config.baseURL || "";
  const path = config.url || "";
  const rawUrl = `${baseUrl}${path}`;

  if (!config.params || typeof config.params !== "object") {
    return rawUrl;
  }

  const query = new URLSearchParams();
  Object.entries(config.params).forEach(([key, value]) => {
    if (value === null || typeof value === "undefined") {
      return;
    }

    query.append(key, String(value));
  });

  const queryString = query.toString();

  if (!queryString) {
    return rawUrl;
  }

  return rawUrl.includes("?")
    ? `${rawUrl}&${queryString}`
    : `${rawUrl}?${queryString}`;
};

const quoteCurlValue = (value) =>
  `'${String(value ?? "").replace(/'/g, "'\\''")}'`;

const formDataToCurlParts = (data) => {
  const parts = Array.isArray(data?._parts) ? data._parts : [];

  return parts.map(([key, value]) => {
    if (value && typeof value === "object") {
      const filePath = String(value.uri || value.name || "file").replace(
        /^file:\/\//,
        ""
      );
      const contentType = value.type ? `;type=${value.type}` : "";

      return `-F ${quoteCurlValue(`${key}=@${filePath}${contentType}`)}`;
    }

    return `-F ${quoteCurlValue(`${key}=${value}`)}`;
  });
};

const stringifyDataForCurl = (data) => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    return String(data);
  }
};

const dataToCurlPart = (data) => {
  if (typeof data === "undefined" || data === null) {
    return [];
  }

  if (
    (typeof FormData !== "undefined" && data instanceof FormData) ||
    Array.isArray(data?._parts)
  ) {
    return formDataToCurlParts(data);
  }

  return [`--data ${quoteCurlValue(stringifyDataForCurl(data))}`];
};

const toCurlCommand = (config) => {
  const method = (config.method || "GET").toUpperCase();
  const parts = [
    `curl -X ${quoteCurlValue(method)}`,
    quoteCurlValue(formatRequestUrl(config)),
  ];
  const headers = getHeadersForLog(config.headers);

  Object.entries(headers).forEach(([key, value]) => {
    parts.push(`-H ${quoteCurlValue(`${key}: ${value}`)}`);
  });

  parts.push(...dataToCurlPart(config.data));

  return parts.join(" \\\n  ");
};

const logApiRequest = (config) => {
  if (!API_LOGS_ENABLED) return;

  const method = (config.method || "GET").toUpperCase();
  const url = formatRequestUrl(config);

  console.log(`[API] ${method} ${url}`);
  console.log("[API] curl", toCurlCommand(config));
  console.log("[API] headers", getHeadersForLog(config.headers));

  if (typeof config.data !== "undefined") {
    console.log("[API] request", config.data);
  }
};

const logApiResponse = (response) => {
  if (!API_LOGS_ENABLED) return;

  console.log("[API] response", {
    status: response.status,
    method: (response.config?.method || "GET").toUpperCase(),
    url: formatRequestUrl(response.config || {}),
    data: response.data,
  });
};

export class ApiError extends Error {
  constructor(
    message,
    {
      code = "UNKNOWN_ERROR",
      status = null,
      details = null,
      cause = null,
      isRetryable = false,
    } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.cause = cause;
    this.isRetryable = isRetryable;
  }
}

const getApiErrorCode = (status) => {
  if (ERROR_CODES_BY_STATUS[status]) {
    return ERROR_CODES_BY_STATUS[status];
  }

  if (status >= 500) {
    return "SERVER_ERROR";
  }

  return "API_ERROR";
};

const getPayloadStatus = (payload, fallbackStatus) => {
  const status = Number(payload?.statusCode || payload?.status);

  return Number.isFinite(status)
    ? status
    : fallbackStatus;
};

const getPayloadMessage = (payload) => {
  if (!payload) return "";

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  const arrayCandidates = [
    payload.message,
    payload.error?.message,
    payload.detail,
    payload.details,
    payload?.data?.message,
    payload?.data?.error?.message,
    payload?.data?.detail,
  ].filter(Array.isArray);

  for (const candidate of arrayCandidates) {
    const firstMessage = candidate.find(
      (value) => typeof value === "string" && value.trim()
    );

    if (firstMessage) {
      return firstMessage.trim();
    }

    const nestedMessage = candidate.find(
      (value) => typeof value?.message === "string" && value.message.trim()
    );

    if (nestedMessage?.message) {
      return nestedMessage.message.trim();
    }
  }

  const candidates = [
    payload.message,
    payload.error,
    payload.error?.message,
    payload.error?.title,
    payload.error?.detail,
    payload.title,
    payload.detail,
    payload.details,
    payload?.data?.message,
    payload?.data?.error,
    payload?.data?.error?.message,
    payload?.data?.error?.title,
    payload?.data?.error?.detail,
    payload?.data?.title,
    payload?.data?.detail,
  ].filter((value) => typeof value === "string" && value.trim());

  if (candidates.length > 0) {
    return candidates[0].trim();
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const [firstError] = payload.errors;

    if (typeof firstError === "string" && firstError.trim()) {
      return firstError.trim();
    }

    if (typeof firstError?.message === "string" && firstError.message.trim()) {
      return firstError.message.trim();
    }
  }

  return "";
};

const logApiError = (error) => {
  if (!API_LOGS_ENABLED) return;

  const config = error?.config || {};
  const responseData = error?.response?.data;

  console.log("[API] error", {
    status: error?.response?.status || 0,
    method: (config.method || "GET").toUpperCase(),
    url: formatRequestUrl(config),
    message:
      getPayloadMessage(responseData) ||
      error?.message ||
      DEFAULT_ERROR_MESSAGE,
    code: error?.code || null,
    data: responseData,
  });
};

export const createApiError = (
  message,
  { code, status, details, cause, isRetryable } = {}
) =>
  new ApiError(message, {
    code,
    status,
    details,
    cause,
    isRetryable,
  });

export const createSessionExpiredError = () =>
  createApiError(API_MESSAGES.sessionExpired, {
    code: "SESSION_EXPIRED",
    status: 401,
    isRetryable: false,
  });

export const isUnauthorizedApiError = (error) =>
  error?.status === 401 ||
  error?.code === "UNAUTHORIZED" ||
  error?.code === "SESSION_EXPIRED";

const createPayloadApiError = (
  payload,
  {
    status = 200,
    fallbackMessage = DEFAULT_ERROR_MESSAGE,
    unauthorizedMessage,
  } = {}
) => {
  const payloadStatus = getPayloadStatus(payload, status);

  return createApiError(
    payloadStatus === 401
      ? getPayloadMessage(payload) || unauthorizedMessage || fallbackMessage
      : getPayloadMessage(payload) || fallbackMessage,
    {
      code: getApiErrorCode(payloadStatus),
      status: payloadStatus,
      details: payload,
      isRetryable: RETRYABLE_STATUSES.includes(payloadStatus),
    }
  );
};

const toApiError = (
  error,
  {
    fallbackMessage = DEFAULT_ERROR_MESSAGE,
    networkMessage = API_MESSAGES.networkUnavailable,
    unauthorizedMessage,
  } = {}
) => {
  if (error instanceof ApiError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return createApiError(error?.message || fallbackMessage, {
      code: "UNKNOWN_ERROR",
      cause: error,
      isRetryable: false,
    });
  }

  if (!error.response) {
    return createApiError(networkMessage, {
      code: "NETWORK_ERROR",
      status: 0,
      cause: error,
      isRetryable: true,
    });
  }

  const { status, data } = error.response;
  const payloadMessage = getPayloadMessage(data);
  const message =
    status === 401
      ? payloadMessage || unauthorizedMessage || fallbackMessage
      : payloadMessage || fallbackMessage;

  return createApiError(message, {
    code: getApiErrorCode(status),
    status,
    details: data,
    cause: error,
    isRetryable: RETRYABLE_STATUSES.includes(status),
  });
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    Accept: "application/json",
  },
});

export const configureApiClientAuth = ({
  getAccessToken,
  refreshAccessToken,
} = {}) => {
  authHandlers.getAccessToken =
    typeof getAccessToken === "function" ? getAccessToken : null;
  authHandlers.refreshAccessToken =
    typeof refreshAccessToken === "function" ? refreshAccessToken : null;
};

export const setApiClientAuthorizationToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
};

const hasAuthorizationHeader = (headers) =>
  Boolean(axios.AxiosHeaders.from(headers || {}).get("Authorization"));

const setAuthorizationHeader = (config, token) => {
  const headers = axios.AxiosHeaders.from(config.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return {
    ...config,
    headers,
  };
};

apiClient.interceptors.request.use(async (config) => {
  let requestConfig = config;

  if (!requestConfig.skipAuth && !hasAuthorizationHeader(requestConfig.headers)) {
    const token = await authHandlers.getAccessToken?.();

    if (token) {
      requestConfig = setAuthorizationHeader(requestConfig, token);
    }
  }

  logApiRequest(requestConfig);
  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => {
    //logApiResponse(response);
    return response;
  },
  async (error) => {
    logApiError(error);
    const originalConfig = error?.config;

    if (
      error?.response?.status !== 401 ||
      originalConfig?.skipAuth ||
      originalConfig?._retry ||
      !authHandlers.refreshAccessToken
    ) {
      throw error;
    }

    originalConfig._retry = true;

    const refreshedToken = await authHandlers.refreshAccessToken();

    if (!refreshedToken) {
      throw error;
    }

    return apiClient.request(
      setAuthorizationHeader(originalConfig, refreshedToken)
    );
  }
);

const requestApiPayload = async (config, errorOptions = {}) => {
  try {
    const response = await apiClient.request(config);
    const payload = response?.data;

    if (payload?.success === false) {
      throw createPayloadApiError(payload, {
        status: response?.status,
        ...errorOptions,
      });
    }

    return payload?.data ?? payload;
  } catch (error) {
    throw toApiError(error, errorOptions);
  }
};

export const apiRequest = async (config, errorOptions = {}) => {
  const payload = await requestApiPayload(config, errorOptions);
  return payload?.data ?? payload;
};

export const apiRequestWithMeta = async (config, errorOptions = {}) => {
  try {
    const response = await apiClient.request(config);
    const payload = response?.data;

    if (payload?.success === false) {
      throw createPayloadApiError(payload, {
        status: response?.status,
        ...errorOptions,
      });
    }

    // Shape A: { success, data: [...], meta: {...} }
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      if (Array.isArray(payload.data) || payload.meta) {
        return {
          success: payload.success !== false,
          data: Array.isArray(payload.data) ? payload.data : payload.data ?? [],
          meta: payload.meta ?? null,
        };
      }

      // Shape B: { success, data: { data: [...], meta: {...} } }
      if (
        payload.data &&
        typeof payload.data === "object" &&
        !Array.isArray(payload.data) &&
        (Array.isArray(payload.data.data) || payload.data.meta)
      ) {
        return {
          success: payload.success !== false,
          data: Array.isArray(payload.data.data) ? payload.data.data : [],
          meta: payload.data.meta ?? null,
        };
      }

      return payload;
    }

    return {
      success: true,
      data: payload,
      meta: null,
    };
  } catch (error) {
    throw toApiError(error, errorOptions);
  }
};
