
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Pagination from "../components/common/Pagination";
import StateMessage from "../components/common/StateMessage";
import { useToast } from "../components/common/toastContext";
import ProductDetails from "../features/products/ProductDetails";
import ProductForm from "../features/products/ProductForm";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "../features/products/productsService";
import { isUnauthorized, useAuth } from "../features/auth/authContext";
import type { Product, ProductInput } from "../types/api";

type FormState = { mode: "create" } | { mode: "edit"; product: Product } | null;

const PAGE_SIZE = 10;

function ProductsPage() {
  const { handleUnauthorized } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState<FormState>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
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
      const list = await listProducts();
      setProducts(list);
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

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term);
      const matchesCategory =
        category === "all" || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  async function handleSubmit(input: ProductInput) {
    const editing = formState?.mode === "edit";
    try {
      if (formState?.mode === "edit") {
        await updateProduct(formState.product.id, input);
      } else {
        await createProduct(input);
      }
      toast.success(editing ? "Product updated." : "Product created.");
      await load();
    } catch (err) {
      if (!isUnauthorized(err)) {
        toast.error(
          err instanceof Error ? err.message : "Unable to save product.",
        );
      }
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Product deleted.");
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
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your catalogue, stock levels and pricing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormState({ mode: "create" })}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
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
          <StateMessage kind="loading" message="Loading products…" />
        ) : filtered.length === 0 ? (
          <StateMessage
            kind="empty"
            message={
              products.length === 0
                ? "No products yet. Add your first product."
                : "No products match your search."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Reorder</th>
                    <th className="px-6 py-4">Cost</th>
                    <th className="px-6 py-4">Selling</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-400">{product.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {product.category}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            product.current_stock <= product.reorder_level
                              ? "font-medium text-red-600"
                              : "text-slate-600"
                          }
                        >
                          {product.current_stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {product.reorder_level}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {Number(product.cost_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {Number(product.selling_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="View"
                            onClick={() => setViewProduct(product)}
                            className="text-slate-500 hover:text-blue-600"
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() =>
                              setFormState({ mode: "edit", product })
                            }
                            className="text-slate-500 hover:text-blue-600"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setDeleteTarget(product)}
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
        <ProductForm
          product={formState.mode === "edit" ? formState.product : null}
          onSubmit={handleSubmit}
          onClose={() => setFormState(null)}
        />
      )}

      {viewProduct && (
        <ProductDetails
          product={viewProduct}
          onClose={() => setViewProduct(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete product"
          message={`Are you sure you want to delete “${deleteTarget.name}”? This cannot be undone.`}
          loading={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default ProductsPage;
