
import { useState, type FormEvent } from "react";
import Modal from "../../components/common/Modal";
import { errorMessageFrom, type Product, type ProductInput } from "../../types/api";
import { formatZodError, productSchema } from "../../validation/schemas";

interface Props {
  product: Product | null;
  onSubmit: (input: ProductInput) => Promise<void>;
  onClose: () => void;
}

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  description: "",
  cost_price: "0",
  selling_price: "0",
  current_stock: "0",
  reorder_level: "10",
};

function ProductForm({ product, onSubmit, onClose }: Props) {
  const [form, setForm] = useState({
    name: product?.name ?? emptyForm.name,
    sku: product?.sku ?? emptyForm.sku,
    category: product?.category ?? emptyForm.category,
    description: product?.description ?? emptyForm.description,
    cost_price: product?.cost_price ?? emptyForm.cost_price,
    selling_price: product?.selling_price ?? emptyForm.selling_price,
    current_stock: String(product?.current_stock ?? emptyForm.current_stock),
    reorder_level: String(product?.reorder_level ?? emptyForm.reorder_level),
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = productSchema.safeParse(form);
    if (!parsed.success) {
      setError(formatZodError(parsed.error));
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        name: parsed.data.name,
        sku: parsed.data.sku.toUpperCase(),
        category: parsed.data.category,
        description: parsed.data.description,
        cost_price: Number(parsed.data.cost_price).toFixed(2),
        selling_price: Number(parsed.data.selling_price).toFixed(2),
        current_stock: Number(parsed.data.current_stock),
        reorder_level: Number(parsed.data.reorder_level),
      });
      onClose();
    } catch (err) {
      setError(
        err && typeof err === "object" && "data" in err
          ? errorMessageFrom(
              (err as { data: unknown }).data,
              err instanceof Error ? err.message : "Unable to save product.",
            )
          : err instanceof Error
            ? err.message
            : "Unable to save product.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <Modal
      title={product ? "Edit Product" : "Add Product"}
      subtitle={
        product ? "Update product details." : "Create a new product record."
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              SKU
            </label>
            <input
              value={form.sku}
              onChange={(event) => setField("sku", event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Category
            </label>
            <input
              value={form.category}
              onChange={(event) => setField("category", event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <input
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Cost Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost_price}
              onChange={(event) => setField("cost_price", event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Selling Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.selling_price}
              onChange={(event) => setField("selling_price", event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Current Stock
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.current_stock}
              onChange={(event) => setField("current_stock", event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Reorder Level
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.reorder_level}
              onChange={(event) => setField("reorder_level", event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting
              ? "Saving…"
              : product
                ? "Save Changes"
                : "Create Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductForm;
