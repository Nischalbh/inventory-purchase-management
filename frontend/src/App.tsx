
import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import DashboardStats from "./features/dashboard/DashboardStats";
import RecentOrders from "./features/dashboard/RecentOrders"

function App() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Navbar />

        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">
              Dashboard Overview
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor your inventory and purchase activities.
            </p>
          </div>

          <DashboardStats />
          <RecentOrders />
        </div>
      </main>
    </div>
  );
}

export default App;
