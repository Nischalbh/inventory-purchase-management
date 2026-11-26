
import { errorMessageFrom, type PaginatedResponse } from "../types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getAccessToken(): string | null {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem(ACCESS_KEY) ||
    localStorage.getItem("token")
  );
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem(REFRESH_KEY);
}

export function storeTokens(access: string, refresh?: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let data: unknown = null;
  const text = await response.text();

  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  const detail = errorMessageFrom(data, response.statusText || "Request failed");

  return new ApiError(response.status, `API error ${response.status}: ${detail}`, data);
}

async function refreshAccess(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { access?: string; refresh?: string };
    if (!data.access) return false;

    //simplejwt rotates refresh tokens, so the new one must replace the old one.
    storeTokens(data.access, data.refresh);
    return true;
  } catch {
    return false;
  }
}

async function apiRequest<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const token = getAccessToken();
  const isAuthEndpoint = endpoint.startsWith("/api/auth/");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (response.status === 401 && !isAuthEndpoint) {
    const refreshed = await refreshAccess();

    if (refreshed) {
      return apiRequest<T>(method, endpoint, body);
    }
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  // DRF logout returns 205 with an empty body, and DELETEs may return no body.
  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>("GET", endpoint);
}

export function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  return apiRequest<T>("POST", endpoint, body);
}

export function apiPatch<T>(endpoint: string, body: unknown): Promise<T> {
  return apiRequest<T>("PATCH", endpoint, body);
}

export function apiPut<T>(endpoint: string, body: unknown): Promise<T> {
  return apiRequest<T>("PUT", endpoint, body);
}

export function apiDelete(endpoint: string): Promise<void> {
  return apiRequest<void>("DELETE", endpoint);
}

/**
 * The Django API paginates every list at 10 items and has no search params.
 * Collect all pages so the UI can search/filter/paginate locally.
 */
export async function getAllPages<T>(endpoint: string): Promise<T[]> {
  const all: T[] = [];
  let nextEndpoint: string | null = endpoint;

  while (nextEndpoint) {
    const response: PaginatedResponse<T> | T[] =
      await apiGet<PaginatedResponse<T> | T[]>(nextEndpoint);

    if (Array.isArray(response)) {
      all.push(...response);
      break;
    }

    all.push(...(response.results ?? []));

    if (!response.next) {
      break;
    }

    const nextUrl: URL = new URL(response.next);
    nextEndpoint = `${nextUrl.pathname}${nextUrl.search}`;
  }

  return all;
}
