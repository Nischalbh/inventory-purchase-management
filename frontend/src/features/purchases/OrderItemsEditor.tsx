
import { Plus, Trash2 } from "lucide-react";
import type { Product } from "../../types/api";
import {
  createDraftItem,
  lineTotal,
  type DraftOrderItem,
} from "./orderItem.types";

interface Props {
  products: Product[];
  items: DraftOrderItem[];
  onChange: (items: DraftOrderItem[]) => void;
  disabled?: boolean;
}

function OrderItemsEditor({ products, items, onChange, disabled = false }: Props) {
  function updateItem(key: string, field: keyof DraftOrderItem, value: string) {
    onChange(
      items.map((item) =>
        item.key === key
          ? {
              ...item,
              [field]: field === "product" ? Number(value) || "" : value,
            }
          : item,
      ),
    );
  }

  const total = items.reduce((sum, item) => sum + lineTotal(item), 0);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Order Items</h3>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange([...items, createDraftItem()])}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus size={16} /> Add item
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-500">
          No items added yet.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const usedProducts = new Set(
              items
                .filter((row) => row.key !== item.key && row.product !== "")
                .map((row) => Number(row.product)),
            );

            return (
            <div
              key={item.key}
              className="grid grid-cols-1 items-end gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Product
                </label>
                <select
                  value={item.product}
                  onChange={(event) =>
                    updateItem(item.key, "product", event.target.value)
                  }
                  disabled={disabled}
                  required
                  className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Select product…</option>
                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                      disabled={usedProducts.has(product.id)}
                    >
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(item.key, "quantity", event.target.value)
                  }
                  disabled={disabled}
                  required
                  className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Unit Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_cost}
                  onChange={(event) =>
                    updateItem(item.key, "unit_cost", event.target.value)
                  }
                  disabled={disabled}
                  required
                  className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Line Total
                </label>
                <p className="rounded-lg bg-slate-50 px-2 py-2 text-sm font-medium text-slate-800">
                  {lineTotal(item).toFixed(2)}
                </p>
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(items.filter((row) => row.key !== item.key))}
                  aria-label={`Remove item ${index + 1}`}
                  className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Estimated total
          </p>
          <p className="text-xl font-bold text-slate-800">{total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default OrderItemsEditor;
