
import { useState } from "react";
import { LogOut, RefreshCw, ShieldCheck, UserCircle } from "lucide-react";
import { useToast } from "../components/common/toastContext";
import { useAuth } from "../features/auth/authContext";
import { fetchProfile } from "../services/authService";
import type { UserProfile } from "../types/api";

function SettingsPage() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const latest = await fetchProfile();
      setProfile(latest);
      toast.success("Profile refreshed.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to refresh profile.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    // AuthProvider reports success/failure through the shared toast system.
    await signOut();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          View your account details and manage your session.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <UserCircle size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Account profile
              </h2>
              <p className="text-sm text-slate-500">
                Details from the authenticated Django API.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ["Username", profile?.username ?? "—"],
            ["Email", profile?.email || "Not provided"],
            ["Role", profile?.role ?? "—"],
            ["Status", profile?.is_active ? "Active" : "Inactive"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
              </dt>
              <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-3 text-green-600">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Security</h2>
            <p className="text-sm text-slate-500">
              Sessions use JWT access and refresh tokens with automatic
              renewal.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Signing out revokes the refresh token on the backend and clears the
          local session. You will be returned to the login screen.
        </p>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="mt-5 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          <LogOut size={17} />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </section>
    </div>
  );
}

export default SettingsPage;
