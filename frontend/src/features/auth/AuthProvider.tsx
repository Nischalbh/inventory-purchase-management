
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "../../components/common/toastContext";
import { clearTokens } from "../../services/api";
import {
  fetchProfile,
  hasSession,
  login,
  logout,
} from "../../services/authService";
import type { UserProfile } from "../../types/api";
import LoginPage from "./LoginPage";
import { AuthContext, type AuthContextValue } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(async () => {
      if (!hasSession()) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const profile = await fetchProfile();
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) {
          clearTokens();
          setSessionExpired(true);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (username: string, password: string) => {
      try {
        await login(username, password);
        const profile = await fetchProfile();
        setUser(profile);
        setSessionExpired(false);
        toast.success(`Signed in as ${profile.username}.`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Unable to sign in.",
        );
        throw err;
      }
    },
    [toast],
  );

  const signOut = useCallback(async () => {
    try {
      await logout();
      toast.success("Signed out successfully.");
    } catch (err) {
      // Logout always clears local tokens; report the backend failure only.
      toast.error(
        err instanceof Error ? err.message : "Unable to complete sign out.",
      );
    } finally {
      setUser(null);
      setSessionExpired(false);
    }
  }, [toast]);

  const handleUnauthorized = useCallback(() => {
    clearTokens();
    setUser(null);
    setSessionExpired(true);
  }, []);

  const acknowledgeExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      sessionExpired,
      signIn,
      signOut,
      handleUnauthorized,
      acknowledgeExpired,
    }),
    [
      user,
      ready,
      sessionExpired,
      signIn,
      signOut,
      handleUnauthorized,
      acknowledgeExpired,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {!ready ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
          Loading…
        </div>
      ) : user ? (
        children
      ) : (
        <LoginPage />
      )}
    </AuthContext.Provider>
  );
}
