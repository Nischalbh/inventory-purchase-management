
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  Warehouse,
  Bell,
  ClipboardList,
  Settings,
  X,
} from "lucide-react";
import type { PageKey } from "../../types/navigation";

interface Props {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems: { key: PageKey; name: string; icon: typeof Package }[] = [
  { key: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { key: "products", name: "Products", icon: Package },
  { key: "suppliers", name: "Suppliers", icon: Truck },
  { key: "purchase-orders", name: "Purchase Orders", icon: ShoppingCart },
  { key: "inventory", name: "Inventory", icon: Warehouse },
  { key: "notifications", name: "Notifications", icon: Bell },
  { key: "audit", name: "Audit Logs", icon: ClipboardList },
];

function Sidebar({ activePage, onNavigate, isOpen, onClose }: Props) {
  function navigate(page: PageKey) {
    onNavigate(page);
    onClose();
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-6">
          <div>
            <h1 className="text-xl font-bold">
              Stock<span className="text-blue-500">Flow</span>
            </h1>
            <p className="mt-1 text-xs text-slate-400">Inventory Management</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={19} className="shrink-0" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button
            type="button"
            onClick={() => navigate("settings")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
              activePage === "settings"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Settings size={19} className="shrink-0" />
            Settings
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
