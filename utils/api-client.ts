import axios, { type AxiosError } from "axios";

export const DEFAULT_API_BASE_URL =
  "https://api-calcify-production.up.railway.app";

const DESKTOP_API_PROXY_BASE_URL = "/__calcify_api";
const DESKTOP_USER_AGENT_MARKER = "CalcifyDesktop";

export const resolveApiBaseUrl = () =>
  (typeof window !== "undefined" &&
  window.navigator.userAgent.includes(DESKTOP_USER_AGENT_MARKER)
    ? DESKTOP_API_PROXY_BASE_URL
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL)
  ).replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = "Não foi possível concluir a solicitação.",
) => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error && error.message.trim().length > 0
      ? error.message
      : fallbackMessage;
  }

  const responseData = error.response?.data as
    | { message?: string; Message?: string }
    | undefined;

  return responseData?.message ?? responseData?.Message ?? fallbackMessage;
};

export type ApiAxiosError = AxiosError<{
  message?: string;
  Message?: string;
}>;
