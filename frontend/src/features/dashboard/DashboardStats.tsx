
import {
  Package,
  Truck,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface Props {
  totalProducts: number;
  totalSuppliers: number;
  totalOrders: number;
  lowStockProducts: number;
}

function DashboardStats({
  totalProducts,
  totalSuppliers,
  totalOrders,
  lowStockProducts,
}: Props) {
  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      description: "Products registered",
      icon: Package,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Suppliers",
      value: totalSuppliers,
      description: "Registered suppliers",
      icon: Truck,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Purchase Orders",
      value: totalOrders,
      description: "Total orders",
      icon: ShoppingCart,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Low Stock Products",
      value: lowStockProducts,
      description: "Needs attention",
      icon: AlertTriangle,
      color: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>

              <div className={`rounded-lg p-3 ${stat.color}`}>
                <Icon size={22} />
              </div>
            </div>

            <h2 className="mt-5 text-3xl font-bold text-slate-800">
              {stat.value}
            </h2>

            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <TrendingUp size={15} className="text-green-500" />
              {stat.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default DashboardStats;
