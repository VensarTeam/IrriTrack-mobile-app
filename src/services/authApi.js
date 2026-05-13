import { apiRequest } from "./apiClient";
import { API_ENDPOINTS } from "../config/env";

const buildFaceImagePayload = (faceImage) => {
  const formData = new FormData();

  formData.append("faceImage", {
    uri: faceImage.uri,
    name:
      faceImage.fileName ||
      faceImage.name ||
      `face-verification-${Date.now()}.jpg`,
    type: faceImage.type || "image/jpeg",
  });

  return formData;
};

export const startFaceLogin = ({ mobile, password }) =>
  apiRequest({
    url: API_ENDPOINTS.authLogin,
    method: "POST",
    skipAuth: true,
    data: { mobile, password },
  });

export const verifyFaceLogin = ({ verificationToken, faceImage }) =>
  apiRequest({
    url: API_ENDPOINTS.authFaceVerify,
    method: "POST",
    skipAuth: true,
    headers: {
      Accept: "*/*",
      Authorization: `Bearer ${verificationToken}`,
      "Content-Type": "multipart/form-data",
    },
    data: buildFaceImagePayload(faceImage),
  });

export const refreshAccessToken = ({ refreshToken }) =>
  apiRequest({
    url: API_ENDPOINTS.authTokenRefresh,
    method: "POST",
    skipAuth: true,
    data: { refreshToken },
  });

export const requestPasswordResetOtp = ({ identifier }) =>
  apiRequest({
    url: API_ENDPOINTS.authPasswordForgot,
    method: "POST",
    headers: {
      Accept: "*/*",
    },
    data: { identifier },
  });

export const resetPassword = ({ identifier, otp, newPassword }) =>
  apiRequest({
    url: API_ENDPOINTS.authPasswordReset,
    method: "POST",
    headers: {
      Accept: "*/*",
    },
    data: {
      identifier,
      otp,
      newPassword,
    },
  });

export const getProfile = () =>
  apiRequest({
    url: API_ENDPOINTS.authMe,
    method: "GET",
  });

export const logoutSession = ({ refreshToken }) =>
  apiRequest({
    url: API_ENDPOINTS.authLogout,
    method: "POST",
    data: { refreshToken },
  });
