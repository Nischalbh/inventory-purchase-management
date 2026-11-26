
import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import Modal from "../../components/common/Modal";
import { useToast } from "../../components/common/toastContext";
import { isUnauthorized, useAuth } from "../auth/authContext";
import { listProducts } from "../products/productsService";
import {
  deleteOrderItem,
  listOrderItems,
  createOrderItem,
  updatePurchaseOrder,
} from "./purchasesService";
import OrderItemsEditor from "./OrderItemsEditor";
import type { DraftOrderItem } from "./orderItem.types";
import {
  errorMessageFrom,
  type Product,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type PurchaseOrderStatus,
} from "../../types/api";
import { formatZodError, orderItemSchema } from "../../validation/schemas";

interface Props {
  order: PurchaseOrder;
  onClose: () => void;
  onEdit: () => void;
  onChanged: () => void;
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

const statusStyles: Record<PurchaseOrderStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  RECEIVED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function PurchaseOrderDetails({ order, onClose, onEdit, onChanged }: Props) {
  const { handleUnauthorized } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [draftItems, setDraftItems] = useState<DraftOrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [itemList, productList] = await Promise.all([
        listOrderItems(order.id),
        listProducts(),
      ]);
      setItems(itemList);
      setProducts(productList);
      setError(null);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
        return;
      }
      const message = formatError(err, "Unable to load order details.");
      setError(message);
      toast.error(message);
    }
  }, [order.id, handleUnauthorized, toast]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function handleStatusChange(status: PurchaseOrderStatus) {
    setBusy(true);
    try {
      await updatePurchaseOrder(order.id, { status });
      toast.success(`Order status updated to ${status}.`);
      onChanged();
    } catch (err) {
      const message = formatError(err, "Unable to update status.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddItems() {
    const existingProducts = new Set(items.map((item) => item.product));
    const newProducts = new Set<number>();

    for (const item of draftItems) {
      const parsed = orderItemSchema.safeParse({
        product: String(item.product),
        quantity: item.quantity,
        unit_cost: item.unit_cost,
      });
      if (!parsed.success) {
        setError(formatZodError(parsed.error));
        return;
      }
      const productId = Number(item.product);
      if (existingProducts.has(productId) || newProducts.has(productId)) {
        setError("That product is already in this order.");
        return;
      }
      newProducts.add(productId);
    }

    setBusy(true);
    try {
      for (const item of draftItems) {
        await createOrderItem(order.id, {
          product: Number(item.product),
          quantity: Number(item.quantity),
          unit_cost: Number(item.unit_cost).toFixed(2),
        });
      }
      setDraftItems([]);
      toast.success("Items added to the order.");
      await load();
      onChanged();
    } catch (err) {
      const message = formatError(err, "Unable to add items.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteItem(itemId: number) {
    setBusy(true);
    try {
      await deleteOrderItem(itemId);
      toast.success("Item removed from the order.");
      await load();
      onChanged();
    } catch (err) {
      const message = formatError(err, "Unable to remove item.");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const infoRows: { label: string; value: string }[] = [
    { label: "Order Number", value: order.order_number },
    { label: "Supplier", value: order.supplier_name },
    {
      label: "Order Date",
      value: new Date(order.order_date).toLocaleDateString(),
    },
    {
      label: "Expected Delivery",
      value: order.expected_delivery_date
        ? new Date(order.expected_delivery_date).toLocaleDateString()
        : "—",
    },
    { label: "Notes", value: order.notes || "—" },
  ];

  return (
    <Modal
      title={`Purchase Order ${order.order_number}`}
      subtitle="Items and order summary"
      onClose={onClose}
      wide
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[order.status]}`}
        >
          {order.status}
        </span>
        <select
          value={order.status}
          disabled={busy}
          onChange={(event) =>
            void handleStatusChange(event.target.value as PurchaseOrderStatus)
          }
          className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700"
        >
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <Pencil size={15} /> Edit header
        </button>
      </div>

      <dl className="mb-6 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
        {infoRows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3 py-1">
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className="text-right text-sm font-medium text-slate-800">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="mb-3 text-sm font-semibold text-slate-800">Items</h3>
      {items.length === 0 ? (
        <p className="mb-6 rounded-lg bg-slate-50 py-4 text-center text-sm text-slate-500">
          No items in this order yet.
        </p>
      ) : (
        <div className="mb-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Unit Cost</th>
                <th className="px-4 py-3">Line Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-slate-800">
                    {item.product_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {Number(item.unit_cost).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {Number(item.line_total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {order.status === "DRAFT" && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteItem(item.id)}
                        disabled={busy}
                        aria-label={`Remove ${item.product_name}`}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-6 flex justify-end border-t border-slate-200 pt-4">
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total amount
          </p>
          <p className="text-xl font-bold text-slate-800">
            {Number(order.total_amount).toFixed(2)}
          </p>
        </div>
      </div>

      {order.status === "DRAFT" && (
        <div className="mb-6 rounded-lg border border-slate-200 p-4">
          <OrderItemsEditor
            products={products}
            items={draftItems}
            onChange={setDraftItems}
          />
          <button
            type="button"
            onClick={() => void handleAddItems()}
            disabled={busy || draftItems.length === 0}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Add items to order"}
          </button>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

export default PurchaseOrderDetails;
