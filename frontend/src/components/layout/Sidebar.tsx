
import {
LayoutDashboard,
Package,
Truck,
ShoppingCart,
Warehouse,
Bell,
ClipboardList,
Settings,
} from "lucide-react";

const menuItems = [
{ name: "Dashboard", icon: LayoutDashboard },
{ name: "Products", icon: Package },
{ name: "Suppliers", icon: Truck },
{ name: "Purchase Orders", icon: ShoppingCart },
{ name: "Inventory", icon: Warehouse },
{ name: "Notifications", icon: Bell },
{ name: "Audit Logs", icon: ClipboardList },
];

function Sidebar() {
return (
    <aside className="flex h-screen w-64 flex-col bg-slate-950 text-white">
    <div className="border-b border-slate-800 px-6 py-6">
        <h1 className="text-xl font-bold">
        Stock<span className="text-blue-500">Flow</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
        Inventory Management
        </p>
    </div>

    <nav className="flex-1 space-y-2 px-4 py-6">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>

        {menuItems.map((item, index) => {
        const Icon = item.icon;

        return (
            <button
            key={item.name}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                index === 0
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            >
            <Icon size={19} />
            {item.name}
            </button>
        );
        })}
    </nav>

    <div className="border-t border-slate-800 p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
        <Settings size={19} />
        Settings
        </button>
    </div>
    </aside>
);
}

export default Sidebar;
