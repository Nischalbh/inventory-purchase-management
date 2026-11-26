
import { Eye } from "lucide-react";
import type { PurchaseOrder } from "./dashboard.types";

interface Props {
orders: PurchaseOrder[];
onViewOrder?: (order: PurchaseOrder) => void;
}

function RecentOrders({ orders, onViewOrder }: Props) {
const recentOrders = [...orders]
    .sort(
    (a, b) =>
        new Date(b.order_date).getTime() -
        new Date(a.order_date).getTime()
    )
    .slice(0, 5);

const statusStyles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    SUBMITTED: "bg-blue-100 text-blue-700",
    RECEIVED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
};

return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800">
        Recent Purchase Orders
        </h2>
        <p className="mt-1 text-sm text-slate-500">
        Latest purchase activities
        </p>
    </div>

    <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
            <tr>
            <th className="px-6 py-4">Order ID</th>
            <th className="px-6 py-4">Supplier</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Action</th>
            </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
            {recentOrders.length === 0 ? (
            <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                No purchase orders found.
                </td>
            </tr>
            ) : (
            recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">
                    {order.order_number}
                </td>
                <td className="px-6 py-4 text-slate-600">
                    {order.supplier_name}
                </td>
                <td className="px-6 py-4 text-slate-600">
                    {new Date(order.order_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">
                    {Number(order.total_amount || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                    <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                        statusStyles[order.status] ||
                        "bg-slate-100 text-slate-600"
                    }`}
                    >
                    {order.status}
                    </span>
                </td>
                <td className="px-6 py-4">
                    <button
                    title="View order"
                    onClick={() => onViewOrder?.(order)}
                    className="text-slate-500 hover:text-blue-600"
                    >
                    <Eye size={18} />
                    </button>
                </td>
                </tr>
            ))
            )}
        </tbody>
        </table>
    </div>
    </div>
);
}

export default RecentOrders;
