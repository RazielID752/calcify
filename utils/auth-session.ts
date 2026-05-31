export const AUTH_TOKEN_STORAGE_KEY = "calcify_auth_token_v1";
export const AUTH_USER_STORAGE_KEY = "calcify_auth_user_v1";
export const AUTH_SESSION_COOKIE_NAME = "calcify_auth_session_v1";

export type StoredAuthUser = {
  id: string;
  name: string;
  email: string;
  lastLoginAt: string | null;
};

export const hasStoredAuthSession = () => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const user = localStorage.getItem(AUTH_USER_STORAGE_KEY);

    return Boolean(token?.trim() && user);
  } catch {
    return false;
  }
};

export const persistAuthSession = (session: {
  token: string;
  user: StoredAuthUser;
}) => {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
  // biome-ignore lint/suspicious/noDocumentCookie: the proxy needs a small browser-visible session marker.
  document.cookie = `${AUTH_SESSION_COOKIE_NAME}=1; path=/; max-age=2592000; samesite=lax`;
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  // biome-ignore lint/suspicious/noDocumentCookie: clear the proxy session marker on logout.
  document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
};
