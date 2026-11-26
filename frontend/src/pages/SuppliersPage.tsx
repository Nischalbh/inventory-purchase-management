
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Pagination from "../components/common/Pagination";
import StateMessage from "../components/common/StateMessage";
import { useToast } from "../components/common/toastContext";
import SupplierDetails from "../features/suppliers/SupplierDetails";
import SupplierForm from "../features/suppliers/SupplierForm";
import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from "../features/suppliers/suppliersService";
import { isUnauthorized, useAuth } from "../features/auth/authContext";
import type { Supplier, SupplierInput } from "../types/api";

type FormState = { mode: "create" } | { mode: "edit"; supplier: Supplier } | null;

const PAGE_SIZE = 10;

function SuppliersPage() {
  const { handleUnauthorized } = useAuth();
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState<FormState>(null);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reportError = useCallback(
    (err: unknown) => {
      if (isUnauthorized(err)) {
        handleUnauthorized();
        return;
      }
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      toast.error(message);
    },
    [handleUnauthorized, toast],
  );

  const load = useCallback(async () => {
    try {
      const list = await listSuppliers();
      setSuppliers(list);
      setError(null);
    } catch (err) {
      reportError(err);
    } finally {
      setLoading(false);
    }
  }, [reportError]);

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
    return suppliers.filter((supplier) => {
      const matchesSearch =
        !term ||
        supplier.name.toLowerCase().includes(term) ||
        supplier.email.toLowerCase().includes(term) ||
        supplier.phone.toLowerCase().includes(term);
      const matchesStatus = status === "all" || supplier.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  async function handleSubmit(input: SupplierInput) {
    const editing = formState?.mode === "edit";
    try {
      if (formState?.mode === "edit") {
        await updateSupplier(formState.supplier.id, input);
      } else {
        await createSupplier(input);
      }
      toast.success(editing ? "Supplier updated." : "Supplier created.");
      await load();
    } catch (err) {
      if (!isUnauthorized(err)) {
        toast.error(
          err instanceof Error ? err.message : "Unable to save supplier.",
        );
      }
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSupplier(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Supplier deleted.");
      await load();
    } catch (err) {
      reportError(err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Suppliers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage supplier contacts and statuses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormState({ mode: "create" })}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
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
          <StateMessage kind="loading" message="Loading suppliers…" />
        ) : filtered.length === 0 ? (
          <StateMessage
            kind="empty"
            message={
              suppliers.length === 0
                ? "No suppliers yet. Add your first supplier."
                : "No suppliers match your search."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {supplier.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {supplier.email}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {supplier.phone}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-slate-600">
                        {supplier.address}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            supplier.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="View"
                            onClick={() => setViewSupplier(supplier)}
                            className="text-slate-500 hover:text-blue-600"
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() =>
                              setFormState({ mode: "edit", supplier })
                            }
                            className="text-slate-500 hover:text-blue-600"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setDeleteTarget(supplier)}
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
        <SupplierForm
          supplier={formState.mode === "edit" ? formState.supplier : null}
          onSubmit={handleSubmit}
          onClose={() => setFormState(null)}
        />
      )}

      {viewSupplier && (
        <SupplierDetails
          supplier={viewSupplier}
          onClose={() => setViewSupplier(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete supplier"
          message={`Are you sure you want to delete “${deleteTarget.name}”? This cannot be undone.`}
          loading={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default SuppliersPage;
