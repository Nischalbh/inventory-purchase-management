
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Pagination from "../components/common/Pagination";
import StateMessage from "../components/common/StateMessage";
import { useToast } from "../components/common/toastContext";
import { isUnauthorized, useAuth } from "../features/auth/authContext";
import PurchaseOrderDetails from "../features/purchases/PurchaseOrderDetails";
import PurchaseOrderForm from "../features/purchases/PurchaseOrderForm";
import {
  deletePurchaseOrder,
  listPurchaseOrders,
} from "../features/purchases/purchasesService";
import type { PurchaseOrder, PurchaseOrderStatus } from "../types/api";

type FormState =
  | { mode: "create" }
  | { mode: "edit"; order: PurchaseOrder }
  | null;

const PAGE_SIZE = 10;

const statusStyles: Record<PurchaseOrderStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  RECEIVED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function PurchaseOrdersPage() {
  const { handleUnauthorized } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState<FormState>(null);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await listPurchaseOrders();
      setOrders(list);
      setError(null);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
        return;
      }
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
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
    return orders.filter((order) => {
      const matchesSearch =
        !term ||
        order.order_number.toLowerCase().includes(term) ||
        order.supplier_name.toLowerCase().includes(term);
      const matchesStatus = status === "all" || order.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePurchaseOrder(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Purchase order deleted.");
      await load();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
      } else {
        const message =
          err instanceof Error ? err.message : "Unable to delete order.";
        setError(message);
        toast.error(message);
      }
    } finally {
      setDeleting(false);
    }
  }

  function refreshAfterChange() {
    void load();
    setViewOrder(null);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Purchase Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track orders, suppliers and delivery status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormState({ mode: "create" })}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} /> New Order
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order number or supplier…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="all">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
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
          <StateMessage kind="loading" message="Loading purchase orders…" />
        ) : filtered.length === 0 ? (
          <StateMessage
            kind="empty"
            message={
              orders.length === 0
                ? "No purchase orders yet. Create your first order."
                : "No orders match your search."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Order Date</th>
                    <th className="px-6 py-4">Expected</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {order.supplier_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {order.expected_delivery_date
                          ? new Date(order.expected_delivery_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {Number(order.total_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="View"
                            onClick={() => setViewOrder(order)}
                            className="text-slate-500 hover:text-blue-600"
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => setFormState({ mode: "edit", order })}
                            className="text-slate-500 hover:text-blue-600"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setDeleteTarget(order)}
                            className="text-slate-500 hover:text-red-600"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
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

      {formState && (
        <PurchaseOrderForm
          order={formState.mode === "edit" ? formState.order : null}
          onSaved={() => void load()}
          onClose={() => setFormState(null)}
        />
      )}

      {viewOrder && (
        <PurchaseOrderDetails
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onEdit={() => {
            setFormState({ mode: "edit", order: viewOrder });
            setViewOrder(null);
          }}
          onChanged={refreshAfterChange}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete purchase order"
          message={`Are you sure you want to delete “${deleteTarget.order_number}”? This cannot be undone.`}
          loading={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default PurchaseOrdersPage;
