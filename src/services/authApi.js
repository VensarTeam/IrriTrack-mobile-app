import { apiRequest } from "./apiClient";

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
    url: "/api/v1/auth/login",
    method: "POST",
    skipAuth: true,
    data: { mobile, password },
  });

export const verifyFaceLogin = ({ verificationToken, faceImage }) =>
  apiRequest({
    url: "/api/v1/auth/face/verify",
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
    url: "/api/v1/auth/token/refresh",
    method: "POST",
    skipAuth: true,
    data: { refreshToken },
  });

export const requestPasswordResetOtp = ({ identifier }) =>
  apiRequest({
    url: "/api/v1/auth/password/forgot",
    method: "POST",
    headers: {
      Accept: "*/*",
    },
    data: { identifier },
  });

export const resetPassword = ({ identifier, otp, newPassword }) =>
  apiRequest({
    url: "/api/v1/auth/password/reset",
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
    url: "/api/v1/auth/me",
    method: "GET",
  });

export const logoutSession = ({ refreshToken }) =>
  apiRequest({
    url: "/api/v1/auth/logout",
    method: "POST",
    data: { refreshToken },
  });
