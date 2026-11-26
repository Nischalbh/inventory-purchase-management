
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Eye, Search, ShieldAlert } from "lucide-react";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import StateMessage from "../components/common/StateMessage";
import { isUnauthorized, useAuth } from "../features/auth/authContext";
import { listAuditLogs } from "../features/audit/auditService";
import { ApiError } from "../services/api";
import type { AuditLog } from "../types/api";

const PAGE_SIZE = 10;

const actionStyles: Record<AuditLog["action"], string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function AuditLogsPage() {
  const { handleUnauthorized } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [modelName, setModelName] = useState("all");
  const [newestFirst, setNewestFirst] = useState(true);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await listAuditLogs({
        action: action === "all" ? undefined : action,
        model_name: modelName === "all" ? undefined : modelName,
      });
      setLogs(list);
      setError(null);
      setForbidden(false);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
        setError(
          "Audit logs are restricted to administrators. Ask an admin for access.",
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Unable to load audit logs.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [action, modelName, handleUnauthorized]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const models = useMemo(
    () => Array.from(new Set(logs.map((log) => log.model_name))).sort(),
    [logs],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = logs.filter((log) => {
      if (!term) return true;
      return [
        log.username ?? "",
        log.action,
        log.model_name,
        log.object_id,
        log.description,
      ].some((value) => value.toLowerCase().includes(term));
    });

    return [...matches].sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return newestFirst ? diff : -diff;
    });
  }, [logs, search, newestFirst]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track create, update and delete activity across the system.
          </p>
        </div>
      </div>

      {forbidden && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <ShieldAlert size={24} className="text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Administrator access required
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Your account can use the rest of StockFlow, but the audit API is
              restricted to ADMIN users by the backend.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search user, action, object or description…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="all">All actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
        <select
          value={modelName}
          onChange={(event) => {
            setModelName(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="all">All models</option>
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setNewestFirst((current) => !current)}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <ArrowDownUp size={16} />
          {newestFirst ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {error && !forbidden && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => void load()}
            className="ml-2 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <StateMessage kind="loading" message="Loading audit logs…" />
        ) : filtered.length === 0 ? (
          <StateMessage
            kind="empty"
            message={
              forbidden
                ? "No audit records are available to this account."
                : logs.length === 0
                  ? "No audit records found."
                  : "No audit records match your filters."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4">Object ID</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-700">
                        {log.username ?? "System"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${actionStyles[log.action]}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {log.model_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {log.object_id}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-slate-600">
                        {log.description || "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => setDetail(log)}
                          className="text-slate-500 hover:text-blue-600"
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {detail && (
        <Modal
          title="Audit Log Details"
          subtitle={`#${detail.id} · ${formatDate(detail.created_at)}`}
          onClose={() => setDetail(null)}
          wide
        >
          <dl className="mb-5 divide-y divide-slate-100">
            {[
              ["User", detail.username ?? "System"],
              ["Action", detail.action],
              ["Model", detail.model_name],
              ["Object ID", detail.object_id],
              ["IP address", detail.ip_address ?? "—"],
              ["Description", detail.description || "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 py-3"
              >
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-right text-sm font-medium text-slate-800">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Previous data
              </p>
              <pre className="max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                {detail.old_data
                  ? JSON.stringify(detail.old_data, null, 2)
                  : "—"}
              </pre>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                New data
              </p>
              <pre className="max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                {detail.new_data
                  ? JSON.stringify(detail.new_data, null, 2)
                  : "—"}
              </pre>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AuditLogsPage;
