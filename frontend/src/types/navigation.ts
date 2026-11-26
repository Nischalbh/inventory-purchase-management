export type PageKey =
  | "dashboard"
  | "products"
  | "suppliers"
  | "purchase-orders"
  | "inventory"
  | "notifications"
  | "audit"
  | "settings";

export const PAGE_TITLES: Record<PageKey, string> = {
  dashboard: "Dashboard",
  products: "Products",
  suppliers: "Suppliers",
  "purchase-orders": "Purchase Orders",
  inventory: "Inventory",
  notifications: "Notifications",
  audit: "Audit Logs",
  settings: "Settings",
};
