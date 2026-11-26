
import LoginPanel from "../../components/layout/LoginPanel";
import { useAuth } from "./authContext";

function LoginPage() {
  const { signIn, sessionExpired, acknowledgeExpired } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Stock<span className="text-blue-500">Flow</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Inventory &amp; Purchase Management
          </p>
        </div>

        {sessionExpired && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Your session has expired. Please sign in again.
          </div>
        )}

        <LoginPanel
          onSubmit={signIn}
          onSuccess={acknowledgeExpired}
        />

        <p className="mt-6 text-center text-xs text-slate-400">
          Access is limited to authorised staff accounts.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
