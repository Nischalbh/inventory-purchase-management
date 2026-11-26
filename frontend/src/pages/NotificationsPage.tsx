
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Check, Search } from "lucide-react";
import Pagination from "../components/common/Pagination";
import StateMessage from "../components/common/StateMessage";
import { useToast } from "../components/common/toastContext";
import { isUnauthorized, useAuth } from "../features/auth/authContext";
import {
  listNotifications,
  markNotificationAsRead,
} from "../features/notifications/notificationsService";
import type { Notification } from "../types/api";

interface Props {
  onUnreadChange?: () => void;
}

const PAGE_SIZE = 10;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function NotificationsPage({ onUnreadChange }: Props) {
  const { handleUnauthorized } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setNotifications(await listNotifications());
      setError(null);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
        return;
      }
      const message =
        err instanceof Error ? err.message : "Unable to load notifications.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, toast]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.message.toLowerCase().includes(term) ||
        (item.product_name ?? "").toLowerCase().includes(term);
      const matchesType =
        typeFilter === "all" || item.notification_type === typeFilter;
      const matchesRead =
        readFilter === "all" ||
        (readFilter === "unread" ? !item.is_read : item.is_read);
      return matchesSearch && matchesType && matchesRead;
    });
  }, [notifications, search, typeFilter, readFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  async function handleMarkRead(id: number) {
    setBusyId(id);
    try {
      const updated = await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      onUnreadChange?.();
      toast.success("Notification marked as read.");
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
        return;
      }
      toast.error(
        err instanceof Error ? err.message : "Unable to update notification.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      for (const item of notifications.filter((entry) => !entry.is_read)) {
        const updated = await markNotificationAsRead(item.id);
        setNotifications((current) =>
          current.map((entry) => (entry.id === updated.id ? updated : entry)),
        );
      }
      onUnreadChange?.();
      toast.success("All notifications marked as read.");
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
        return;
      }
      toast.error(
        err instanceof Error ? err.message : "Unable to update notifications.",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
              : "You are all caught up."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleMarkAllRead()}
          disabled={markingAll || unreadCount === 0}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Check size={18} />
          {markingAll ? "Updating…" : "Mark all as read"}
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search notifications…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) => {
            setTypeFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="all">All types</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="GENERAL">General</option>
        </select>
        <select
          value={readFilter}
          onChange={(event) => {
            setReadFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="all">All notifications</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      {error && (
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
          <StateMessage kind="loading" message="Loading notifications…" />
        ) : filtered.length === 0 ? (
          <StateMessage
            kind="empty"
            message={
              notifications.length === 0
                ? "No notifications have been generated yet."
                : "No notifications match your filters."
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {visible.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-start gap-4 px-6 py-5 ${
                    item.is_read ? "bg-white" : "bg-blue-50/40"
                  }`}
                >
                  <div
                    className={`mt-0.5 rounded-lg p-2 ${
                      item.is_read
                        ? "bg-slate-100 text-slate-400"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <Bell size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`text-sm font-semibold ${
                          item.is_read ? "text-slate-600" : "text-slate-900"
                        }`}
                      >
                        {item.title}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {item.notification_type.replace("_", " ")}
                      </span>
                      {item.product_name && (
                        <span className="text-xs text-slate-500">
                          · {item.product_name}
                        </span>
                      )}
                      {!item.is_read && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                          Unread
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(item.created_at)}
                    </p>
                  </div>

                  {!item.is_read && (
                    <button
                      type="button"
                      onClick={() => void handleMarkRead(item.id)}
                      disabled={busyId === item.id}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white disabled:opacity-50"
                    >
                      {busyId === item.id ? "Updating…" : "Mark as read"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <Pagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
