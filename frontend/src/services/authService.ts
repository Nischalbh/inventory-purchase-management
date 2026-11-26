
import type { UserProfile } from "../types/api";
import {
  apiGet,
  apiPost,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  storeTokens,
} from "./api";

interface TokenResponse {
  access: string;
  refresh: string;
}

function tokenIsExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(
      atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")),
    ) as { exp?: number };

    if (!decoded.exp) return true;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function hasSession(): boolean {
  const access = getAccessToken();
  const refresh = getRefreshToken();

  if (access && !tokenIsExpired(access)) return true;
  return Boolean(refresh && !tokenIsExpired(refresh));
}

export async function login(username: string, password: string): Promise<void> {
  const tokens = await apiPost<TokenResponse>("/api/auth/login/", {
    username,
    password,
  });

  storeTokens(tokens.access, tokens.refresh);
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();

  if (refresh) {
    try {
      await apiPost("/api/auth/logout/", { refresh });
    } catch {
      // Always clear local tokens, even if the backend logout fails.
    }
  }

  clearTokens();
}

export function fetchProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>("/api/auth/profile/");
}
