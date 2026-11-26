
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Modal from "../../components/common/Modal";
import { useToast } from "../../components/common/toastContext";
import { listProducts } from "../products/productsService";
import { listSuppliers } from "../suppliers/suppliersService";
import {
  createOrderItem,
  createPurchaseOrder,
  updatePurchaseOrder,
} from "./purchasesService";
import OrderItemsEditor from "./OrderItemsEditor";
import { createDraftItem, type DraftOrderItem } from "./orderItem.types";
import {
  errorMessageFrom,
  type Product,
  type PurchaseOrder,
  type PurchaseOrderStatus,
  type Supplier,
} from "../../types/api";
import {
  formatZodError,
  orderItemSchema,
  purchaseOrderSchema,
} from "../../validation/schemas";

interface Props {
  order: PurchaseOrder | null;
  onSaved: () => void;
  onClose: () => void;
}

function formatError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "data" in err) {
    return errorMessageFrom(
      (err as { data: unknown }).data,
      err instanceof Error ? err.message : fallback,
    );
  }
  return err instanceof Error ? err.message : fallback;
}

function PurchaseOrderForm({ order, onSaved, onClose }: Props) {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState(order ? String(order.supplier) : "");
  const [expectedDate, setExpectedDate] = useState(
    order?.expected_delivery_date ?? "",
  );
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [status, setStatus] = useState<PurchaseOrderStatus>(
    order?.status ?? "DRAFT",
  );
  const [items, setItems] = useState<DraftOrderItem[]>([
    createDraftItem(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const [productList, supplierList] = await Promise.all([
        listProducts(),
        listSuppliers(),
      ]);
      setProducts(productList);
      setSuppliers(supplierList);
    } catch (err) {
      const message = formatError(err, "Unable to load form options.");
      setError(message);
      toast.error(message);
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadOptions();
    });
    return () => {
      cancelled = true;
    };
  }, [loadOptions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const header = purchaseOrderSchema.safeParse({
      supplier,
      expected_delivery_date: expectedDate,
      notes,
      status,
    });
    if (!header.success) {
      setError(formatZodError(header.error));
      return;
    }

    if (!order) {
      if (items.length === 0) {
        setError("Add at least one product to the order.");
        return;
      }

      const selectedProducts = new Set<number>();
      for (const item of items) {
        const parsed = orderItemSchema.safeParse({
          product: String(item.product),
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        });
        if (!parsed.success) {
          setError(formatZodError(parsed.error));
          return;
        }
        if (selectedProducts.has(Number(item.product))) {
          setError("The same product cannot be added twice to an order.");
          return;
        }
        selectedProducts.add(Number(item.product));
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        supplier: Number(header.data.supplier),
        expected_delivery_date: header.data.expected_delivery_date || null,
        notes: header.data.notes,
      };

      if (order) {
        await updatePurchaseOrder(order.id, { ...payload, status });
      } else {
        const orderNumber = `PO-${new Date().getFullYear()}-${Date.now()
          .toString()
          .slice(-6)}`;
        const created = await createPurchaseOrder({
          ...payload,
          order_number: orderNumber,
          status: "DRAFT",
        });

        for (const item of items) {
          await createOrderItem(created.id, {
            product: Number(item.product),
            quantity: Number(item.quantity),
            unit_cost: Number(item.unit_cost).toFixed(2),
          });
        }
      }

      toast.success(
        order ? "Purchase order updated." : "Purchase order created.",
      );
      onSaved();
      onClose();
    } catch (err) {
      const message = formatError(err, "Unable to save purchase order.");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <Modal
      title={order ? "Edit Purchase Order" : "New Purchase Order"}
      subtitle={
        order
          ? `Update ${order.order_number}.`
          : "Select a supplier and add multiple products."
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Supplier
            </label>
            <select
              value={supplier}
              onChange={(event) => setSupplier(event.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select supplier…</option>
              {suppliers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(event) => setExpectedDate(event.target.value)}
              className={inputClass}
            />
          </div>

          {order && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as PurchaseOrderStatus)
                }
                className={inputClass}
              >
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
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

        {order ? (
          <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            Items can be added or removed from the order details screen while
            the order is in DRAFT status.
          </p>
        ) : (
          <OrderItemsEditor
            products={products}
            items={items}
            onChange={setItems}
          />
        )}

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
            {submitting ? "Saving…" : order ? "Save Changes" : "Create Order"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default PurchaseOrderForm;
