
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, Search } from "lucide-react";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import StateMessage from "../components/common/StateMessage";
import { useToast } from "../components/common/toastContext";
import { isUnauthorized, useAuth } from "../features/auth/authContext";
import InventoryTransactionForm from "../features/inventory/InventoryTransactionForm";
import {
  getInventoryTransaction,
  listInventoryTransactions,
} from "../features/inventory/inventoryService";
import { listProducts } from "../features/products/productsService";
import type { InventoryTransaction, Product } from "../types/api";

type TransactionType = InventoryTransaction["transaction_type"];

const PAGE_SIZE = 10;

const typeStyles: Record<TransactionType, string> = {
  STOCK_IN: "bg-green-100 text-green-700",
  STOCK_OUT: "bg-red-100 text-red-700",
  ADJUSTMENT: "bg-blue-100 text-blue-700",
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function InventoryPage() {
  const { handleUnauthorized } = useAuth();
  const toast = useToast();
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<InventoryTransaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await listProducts());
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
        return;
      }
      setError(
        err instanceof Error ? err.message : "Unable to load product options.",
      );
    }
  }, [handleUnauthorized]);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const list = await listInventoryTransactions({
        product: productFilter === "all" ? undefined : Number(productFilter),
        type: typeFilter === "all" ? undefined : typeFilter,
      });
      setTransactions(list);
      setError(null);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
        return;
      }
      const message =
        err instanceof Error ? err.message : "Unable to load transactions.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, productFilter, typeFilter, toast]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadProducts();
    });
    return () => {
      cancelled = true;
    };
  }, [loadProducts]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadTransactions();
    });
    return () => {
      cancelled = true;
    };
  }, [loadTransactions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return transactions;
    return transactions.filter(
      (item) =>
        item.product_name?.toLowerCase().includes(term) ||
        item.sku?.toLowerCase().includes(term),
    );
  }, [transactions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  async function handleCreated() {
    await Promise.all([loadTransactions(), loadProducts()]);
  }

  async function handleView(id: number) {
    setDetailLoading(true);
    try {
      setDetail(await getInventoryTransaction(id));
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
        return;
      }
      toast.error(
        err instanceof Error ? err.message : "Unable to load transaction details.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review stock movements and adjust product stock levels.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} /> New Transaction
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
            placeholder="Search by product name or SKU…"
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
          <option value="all">All transaction types</option>
          <option value="STOCK_IN">Stock In</option>
          <option value="STOCK_OUT">Stock Out</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
        <select
          value={productFilter}
          onChange={(event) => {
            setProductFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="all">All products</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => void loadTransactions()}
            className="ml-2 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <StateMessage kind="loading" message="Loading transactions…" />
        ) : filtered.length === 0 ? (
          <StateMessage
            kind="empty"
            message={
              transactions.length === 0
                ? "No transactions recorded yet. Create the first stock movement."
                : "No transactions match your search."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Previous</th>
                    <th className="px-6 py-4">New</th>
                    <th className="px-6 py-4">Date &amp; Time</th>
                    <th className="px-6 py-4">Notes</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-slate-400">{item.sku}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${typeStyles[item.transaction_type]}`}
                        >
                          {item.transaction_type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {item.transaction_type === "ADJUSTMENT" ? "→" : "±"}
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.previous_stock}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {item.new_stock}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-slate-600">
                        {item.notes || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => void handleView(item.id)}
                          disabled={detailLoading}
                          className="text-slate-500 hover:text-blue-600 disabled:opacity-50"
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

      {formOpen && (
        <InventoryTransactionForm
          products={products}
          onCreated={() => void handleCreated()}
          onClose={() => setFormOpen(false)}
        />
      )}

      {detail && (
        <Modal
          title="Transaction Details"
          subtitle={`#${detail.id} · ${formatDate(detail.created_at)}`}
          onClose={() => setDetail(null)}
        >
          <dl className="divide-y divide-slate-100">
            {[
              ["Product", detail.product_name],
              ["SKU", detail.sku ?? "—"],
              ["Type", detail.transaction_type.replace("_", " ")],
              ["Quantity", String(detail.quantity)],
              ["Previous stock", String(detail.previous_stock)],
              ["New stock", String(detail.new_stock)],
              ["Notes", detail.notes || "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 py-3"
              >
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-right text-sm font-medium text-slate-800">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
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

export default InventoryPage;
