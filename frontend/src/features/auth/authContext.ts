
import { createContext, useContext } from "react";
import { ApiError } from "../../services/api";
import type { UserProfile } from "../../types/api";

export interface AuthContextValue {
  user: UserProfile | null;
  ready: boolean;
  sessionExpired: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  handleUnauthorized: () => void;
  acknowledgeExpired: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
