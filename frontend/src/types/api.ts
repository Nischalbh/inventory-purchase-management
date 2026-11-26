export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  category: string;
  cost_price: string;
  selling_price: string;
  current_stock: number;
  reorder_level: number;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
  created_at?: string;
  updated_at?: string;
}

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RECEIVED"
  | "CANCELLED";

export interface PurchaseOrderItem {
  id: number;
  purchase_order: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_cost: string;
  line_total: string;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier: number;
  supplier_name: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_delivery_date: string | null;
  notes: string;
  items: PurchaseOrderItem[];
  total_amount: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryTransaction {
  id: number;
  product: number;
  product_name: string;
  sku?: string;
  transaction_type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: "LOW_STOCK" | "GENERAL";
  product: number | null;
  product_name: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user: number | null;
  username: string | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  model_name: string;
  object_id: string;
  description: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  is_active: boolean;
  date_joined: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardData {
  products: Product[];
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  transactions: InventoryTransaction[];
  totals: {
    products: number;
    suppliers: number;
    orders: number;
  };
  warnings: string[];
}

export type ProductInput = Pick<
  Product,
  | "name"
  | "sku"
  | "description"
  | "category"
  | "cost_price"
  | "selling_price"
  | "current_stock"
  | "reorder_level"
>;

export type SupplierInput = Pick<
  Supplier,
  "name" | "email" | "phone" | "address" | "status"
>;

export type PurchaseOrderInput = {
  order_number: string;
  supplier: number;
  status?: PurchaseOrderStatus;
  expected_delivery_date: string | null;
  notes: string;
};

export type PurchaseOrderUpdate = Partial<PurchaseOrderInput>;

export type PurchaseOrderItemInput = {
  product: number;
  quantity: number;
  unit_cost: string;
};

export type InventoryTransactionInput = {
  product: number;
  transaction_type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
  quantity: number;
  notes: string;
};

export function errorMessageFrom(data: unknown, fallback: string): string {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (typeof record.detail === "string") {
      return record.detail;
    }

    const messages: string[] = [];
    for (const value of Object.values(record)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") messages.push(item);
        }
      } else if (typeof value === "string") {
        messages.push(value);
      }
    }

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return fallback;
}
