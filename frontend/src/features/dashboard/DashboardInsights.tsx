import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import type { Product, InventoryTransaction } from "./dashboard.types";

interface Props {
  products: Product[];
  transactions: InventoryTransaction[];
}

function DashboardInsights({ products, transactions }: Props) {
  const lowStockProducts = products
    .filter((product) => product.current_stock <= product.reorder_level)
    .sort((a, b) => a.current_stock - b.current_stock)
    .slice(0, 5);

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dailyTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.created_at);
      return transactionDate >= date && transactionDate < nextDate;
    });

    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      stockIn: dailyTransactions
        .filter((item) => item.transaction_type === "STOCK_IN")
        .reduce((sum, item) => sum + item.quantity, 0),
      stockOut: dailyTransactions
        .filter((item) => item.transaction_type === "STOCK_OUT")
        .reduce((sum, item) => sum + item.quantity, 0),
    };
  });

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
        <h2 className="text-lg font-bold text-slate-800">
          Weekly Stock Movement
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Stock in and stock out for the last 7 days
        </p>

        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="stockIn"
                name="Stock In"
                stroke="#2563eb"
                fill="#93c5fd"
                fillOpacity={0.35}
              />
              <Area
                type="monotone"
                dataKey="stockOut"
                name="Stock Out"
                stroke="#f97316"
                fill="#fdba74"
                fillOpacity={0.35}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">Low Stock Products</h2>
        <p className="mt-1 text-sm text-slate-500">
          Products that need restocking
        </p>

        <div className="mt-6 space-y-5">
          {lowStockProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              All products have sufficient stock.
            </p>
          ) : (
            lowStockProducts.map((product) => {
              const percentage =
                product.reorder_level > 0
                  ? Math.min(
                      (product.current_stock / product.reorder_level) * 100,
                      100,
                    )
                  : 0;

              return (
                <div key={product.id}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500">{product.sku}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-orange-600">
                      {product.current_stock} left
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Reorder level: {product.reorder_level}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {lowStockProducts.length > 0 && (
          <div className="mt-5 flex items-center gap-2 rounded-lg bg-orange-50 p-3 text-xs text-orange-700">
            <AlertTriangle size={16} />
            <span>Some products need attention.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardInsights;
