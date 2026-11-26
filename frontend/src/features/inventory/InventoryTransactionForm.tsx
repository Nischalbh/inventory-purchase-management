
import { useState, type FormEvent } from "react";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Modal from "../../components/common/Modal";
import { useToast } from "../../components/common/toastContext";
import {
  errorMessageFrom,
  type InventoryTransactionInput,
  type Product,
} from "../../types/api";
import { formatZodError, inventorySchema } from "../../validation/schemas";
import { createInventoryTransaction } from "./inventoryService";

interface Props {
  products: Product[];
  onCreated: () => void;
  onClose: () => void;
}

type TransactionType = InventoryTransactionInput["transaction_type"];

const typeLabels: Record<TransactionType, string> = {
  STOCK_IN: "Stock In",
  STOCK_OUT: "Stock Out",
  ADJUSTMENT: "Adjustment",
};

function InventoryTransactionForm({ products, onCreated, onClose }: Props) {
  const toast = useToast();
  const [type, setType] = useState<TransactionType>("STOCK_IN");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<InventoryTransactionInput | null>(null);

  const selectedProduct = products.find((item) => item.id === Number(product));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = inventorySchema.safeParse({
      product,
      transaction_type: type,
      quantity,
      notes,
    });
    if (!parsed.success) {
      setError(formatZodError(parsed.error));
      return;
    }

    const amount = Number(parsed.data.quantity);
    if (
      type === "STOCK_OUT" &&
      selectedProduct &&
      amount > selectedProduct.current_stock
    ) {
      setError(
        `Only ${selectedProduct.current_stock} units are available for ${selectedProduct.name}.`,
      );
      return;
    }

    setPending({
      product: Number(parsed.data.product),
      transaction_type: parsed.data.transaction_type,
      quantity: amount,
      notes: parsed.data.notes,
    });
  }

  async function confirm() {
    if (!pending) return;
    setSubmitting(true);

    try {
      await createInventoryTransaction(pending);
      toast.success(`${typeLabels[pending.transaction_type]} recorded successfully.`);
      setPending(null);
      onCreated();
      onClose();
    } catch (err) {
      const message =
        err && typeof err === "object" && "data" in err
          ? errorMessageFrom(
              (err as { data: unknown }).data,
              err instanceof Error ? err.message : "Unable to record transaction.",
            )
          : err instanceof Error
            ? err.message
            : "Unable to record transaction.";
      setError(message);
      toast.error(message);
      setPending(null);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <Modal
      title="New Stock Transaction"
      subtitle="Adjust product stock levels"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Transaction Type
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TransactionType)}
            className={inputClass}
          >
            <option value="STOCK_IN">Stock In</option>
            <option value="STOCK_OUT">Stock Out</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Product
          </label>
          <select
            value={product}
            onChange={(event) => setProduct(event.target.value)}
            required
            className={inputClass}
          >
            <option value="">Select product…</option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.sku}) — stock {item.current_stock}
              </option>
            ))}
          </select>
          {selectedProduct && (
            <p className="mt-1 text-xs text-slate-500">
              Current stock: {selectedProduct.current_stock} · Reorder level:{" "}
              {selectedProduct.reorder_level}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {type === "ADJUSTMENT" ? "New stock level" : "Quantity"}
          </label>
          <input
            type="number"
            min={type === "ADJUSTMENT" ? 0 : 1}
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
            className={inputClass}
          />
          {type === "ADJUSTMENT" && (
            <p className="mt-1 text-xs text-slate-500">
              Adjustment sets the stock to this exact number. Use 0 to mark it
              out of stock.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className={inputClass}
          />
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
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </form>

      {pending && (
        <ConfirmDialog
          title={`Confirm ${typeLabels[pending.transaction_type]}`}
          message={
            pending.transaction_type === "ADJUSTMENT"
              ? `Set ${selectedProduct?.name} stock to ${pending.quantity}?`
              : `${typeLabels[pending.transaction_type]} ${pending.quantity} units of ${selectedProduct?.name}?`
          }
          confirmLabel="Record transaction"
          loading={submitting}
          onConfirm={() => void confirm()}
          onCancel={() => setPending(null)}
        />
      )}
    </Modal>
  );
}

export default InventoryTransactionForm;
