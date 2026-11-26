
import { Eye } from "lucide-react";

const orders = [
{
    id: "PO-1001",
    supplier: "Tech Solutions Pvt. Ltd.",
    date: "Nov 25, 2026",
    amount: "Rs. 45,000",
    status: "Completed",
},
{
    id: "PO-1002",
    supplier: "Global Traders",
    date: "Nov 24, 2026",
    amount: "Rs. 28,500",
    status: "Pending",
},
{
    id: "PO-1003",
    supplier: "ABC Suppliers",
    date: "Nov 23, 2026",
    amount: "Rs. 62,000",
    status: "Processing",
},
{
    id: "PO-1004",
    supplier: "Smart Electronics",
    date: "Nov 22, 2026",
    amount: "Rs. 18,000",
    status: "Completed",
},
];

function RecentOrders() {
return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-200 p-6">
        <div>
        <h2 className="text-lg font-semibold text-slate-800">
            Recent Purchase Orders
        </h2>
        <p className="mt-1 text-sm text-slate-500">
            Latest purchase activities
        </p>
        </div>

        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
        View All
        </button>
    </div>

    <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
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
            {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">
                {order.id}
                </td>

                <td className="px-6 py-4 text-slate-600">
                {order.supplier}
                </td>

                <td className="px-6 py-4 text-slate-500">
                {order.date}
                </td>

                <td className="px-6 py-4 font-medium text-slate-800">
                {order.amount}
                </td>

                <td className="px-6 py-4">
                <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                    order.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : order.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                >
                    {order.status}
                </span>
                </td>

                <td className="px-6 py-4">
                <button className="text-slate-500 hover:text-blue-600">
                    <Eye size={18} />
                </button>
                </td>
            </tr>
            ))}
        </tbody>
        </table>
    </div>
    </div>
);
}

export default RecentOrders;
