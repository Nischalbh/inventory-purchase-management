
import { useCallback, useEffect, useState } from "react";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import { useToast } from "./components/common/toastContext";
import { isUnauthorized, useAuth } from "./features/auth/authContext";
import DashboardStats from "./features/dashboard/DashboardStats";
import DashboardInsights from "./features/dashboard/DashboardInsights";
import RecentOrders from "./features/dashboard/RecentOrders";
import { getDashboardData } from "./features/dashboard/dashboardService";
import { getUnreadNotificationCount } from "./features/notifications/notificationsService";
import AuditLogsPage from "./pages/AuditLogsPage";
import InventoryPage from "./pages/InventoryPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProductsPage from "./pages/ProductsPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import SettingsPage from "./pages/SettingsPage";
import SuppliersPage from "./pages/SuppliersPage";
import type { DashboardData } from "./types/api";
import { PAGE_TITLES, type PageKey } from "./types/navigation";

const emptyData: DashboardData = {
  products: [],
  suppliers: [],
  orders: [],
  transactions: [],
  totals: { products: 0, suppliers: 0, orders: 0 },
  warnings: [],
};

function App() {
  const { user, signOut, handleUnauthorized } = useAuth();
  const toast = useToast();
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      setUnreadCount(await getUnreadNotificationCount());
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
      }
      // A missing count must never block the rest of the application.
    }
  }, [handleUnauthorized]);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await getDashboardData();
      setData(result);
      setError(null);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleUnauthorized();
        return;
      }
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard data.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, toast]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        void loadDashboard();
        void refreshUnreadCount();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadDashboard, refreshUnreadCount]);

  const navigate = useCallback((page: PageKey) => {
    setActivePage(page);
    setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  }, []);

  const handleSignOut = useCallback(() => {
    // AuthProvider owns the success/error toast for sign out.
    void signOut();
  }, [signOut]);

  const lowStockCount = data.products.filter(
    (product) => product.current_stock <= product.reorder_level,
  ).length;

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800">
                Dashboard Overview
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Monitor your inventory and purchase activities.
              </p>
            </div>

            {loading && (
              <p className="mb-6 text-sm text-slate-500">
                Loading dashboard data…
              </p>
            )}

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Could not load live data: {error}. The dashboard is showing
                empty sections for now.
                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  className="ml-2 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {data.warnings.length > 0 && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-medium">Some sections are unavailable:</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {data.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <DashboardStats
              totalProducts={data.totals.products}
              totalSuppliers={data.totals.suppliers}
              totalOrders={data.totals.orders}
              lowStockProducts={lowStockCount}
            />
            <RecentOrders
              orders={data.orders}
              onViewOrder={() => navigate("purchase-orders")}
            />
            <DashboardInsights
              products={data.products}
              transactions={data.transactions}
            />
          </>
        );
      case "products":
        return <ProductsPage />;
      case "suppliers":
        return <SuppliersPage />;
      case "purchase-orders":
        return <PurchaseOrdersPage />;
      case "inventory":
        return <InventoryPage />;
      case "notifications":
        return (
          <NotificationsPage
            onUnreadChange={() => void refreshUnreadCount()}
          />
        );
      case "audit":
        return <AuditLogsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return null;
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-w-0 flex-1 lg:ml-64">
        <Navbar
          title={PAGE_TITLES[activePage]}
          user={user!}
          onSignOut={() => void handleSignOut()}
          onMenuClick={() => setSidebarOpen(true)}
          unreadCount={unreadCount}
          onNotificationsClick={() => navigate("notifications")}
        />

        <div className="p-4 sm:p-8">{renderPage()}</div>
      </main>
    </div>
  );
}

export default App;
