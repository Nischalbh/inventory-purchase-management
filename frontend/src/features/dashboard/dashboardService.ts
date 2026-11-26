
import { getAllPages, ApiError } from "../../services/api";
import type {
  DashboardData,
  InventoryTransaction,
  Product,
  PurchaseOrder,
  Supplier,
} from "../../types/api";

async function fetchList<T>(
  endpoint: string,
  label: string,
): Promise<{
  items: T[];
  total: number;
  warning: string | null;
}> {
  try {
    const items = await getAllPages<T>(endpoint);
    return { items, total: items.length, warning: null };
  } catch (err) {
    // Let the auth layer handle expired / missing tokens.
    if (err instanceof ApiError && err.status === 401) {
      throw err;
    }

    const detail =
      err instanceof ApiError ? `API ${err.status}` : "unknown error";
    return {
      items: [],
      total: 0,
      warning: `${label} could not be loaded (${detail}).`,
    };
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const [products, suppliers, orders, transactions] = await Promise.all([
    fetchList<Product>("/api/products/", "Products"),
    fetchList<Supplier>("/api/suppliers/", "Suppliers"),
    fetchList<PurchaseOrder>("/api/purchase-orders/", "Purchase orders"),
    fetchList<InventoryTransaction>(
      "/api/inventory/transactions/",
      "Inventory transactions",
    ),
  ]);

  return {
    products: products.items,
    suppliers: suppliers.items,
    orders: orders.items,
    transactions: transactions.items,
    totals: {
      products: products.total,
      suppliers: suppliers.total,
      orders: orders.total,
    },
    warnings: [
      products.warning,
      suppliers.warning,
      orders.warning,
      transactions.warning,
    ].filter((warning): warning is string => warning !== null),
  };
}
