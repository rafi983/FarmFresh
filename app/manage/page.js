"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { apiService } from "@/lib/api-service";

// Component imports
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import NavigationTabs from "@/components/dashboard/NavigationTabs";
import DashboardTab from "@/components/dashboard/tabs/DashboardTab";
import ProductsTab from "@/components/dashboard/tabs/ProductsTab";
import OrdersTab from "@/components/dashboard/tabs/OrdersTab";
import AnalyticsTab from "@/components/dashboard/tabs/AnalyticsTab";
import SettingsTab from "@/components/dashboard/tabs/SettingsTab";

// Constants
const TABS = {
  DASHBOARD: "dashboard",
  PRODUCTS: "products",
  ORDERS: "orders",
  ANALYTICS: "analytics",
  SETTINGS: "settings",
};

const PRODUCT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  OUT_OF_STOCK: "out-of-stock",
  LOW_STOCK: "low-stock",
};

const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned",
};

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 12,
};

export default function FarmerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Core state
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Filter and search state
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    sort: "",
  });

  // Pagination state
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [viewMode, setViewMode] = useState("grid");

  // User identification helper
  const getUserIdentifiers = useCallback(() => {
    if (!session?.user) return {};

    const user = session.user;
    return {
      userId: user.userId || user.id || user._id,
      userEmail: user.email,
    };
  }, [session?.user]);

  // Fetch products with caching
  const fetchProducts = useCallback(
    async (forceRefresh = false) => {
      if (!session?.user) return;

      try {
        const { userId, userEmail } = getUserIdentifiers();

        if (!userId && !userEmail) {
          throw new Error("No user identification found");
        }

        // Use cached API service
        const data = await apiService.getProducts(
          {
            limit: 1000,
            farmerId: userId,
            farmerEmail: userEmail,
          },
          { forceRefresh },
        );

        const products = data.products || [];

        // Filter farmer's products on client side as fallback
        const farmerProducts = products.filter((product) => {
          return (
            product.farmerId === userId ||
            product.farmerId === String(userId) ||
            product.farmerEmail === userEmail ||
            product.farmer?.email === userEmail ||
            product.farmer?.id === userId
          );
        });

        setProducts(farmerProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products. Please try again.");
      }
    },
    [session?.user, getUserIdentifiers],
  );

  // Fetch orders with caching
  const fetchOrders = useCallback(
    async (forceRefresh = false) => {
      if (!session?.user) return;

      try {
        const { userId, userEmail } = getUserIdentifiers();

        const params = {
          farmerId: userId,
          farmerEmail: userEmail,
          limit: 1000,
        };

        // Use cached API service for orders
        const data = await apiService.getOrders(params, { forceRefresh });
        setOrders(data.orders || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders. Please try again.");
      }
    },
    [session?.user, getUserIdentifiers],
  );

  // Initialize dashboard data with caching and progressive loading
  const initializeDashboard = useCallback(
    async (forceRefresh = false) => {
      if (!session?.user) return;

      const { userId, userEmail } = getUserIdentifiers();
      if (!userId && !userEmail) return;

      // Only show loading for initial load or force refresh
      if (forceRefresh || products.length === 0) {
        setLoading(true);
      }
      setError(null);

      try {
        // Use the optimized dashboard data method
        const dashboardData = await apiService.getDashboardData(
          userId,
          userEmail,
          { forceRefresh },
        );

        setProducts(dashboardData.products);
        setOrders(dashboardData.orders);

        console.log(
          `Dashboard loaded: ${dashboardData.meta.productsCount} products, ${dashboardData.meta.ordersCount} orders (cached: ${dashboardData.meta.fromCache})`,
        );
      } catch (err) {
        console.error("Dashboard initialization error:", err);
        setError(
          "Failed to load dashboard data. Please try refreshing the page.",
        );
      } finally {
        setLoading(false);
      }
    },
    [getUserIdentifiers, products.length, session?.user],
  );

  // Authentication and authorization
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const userType = session.user.userType || session.user.role || "user";
      if (userType !== "farmer") {
        router.push("/");
        return;
      }
      initializeDashboard();
    }
  }, [session, status, router, initializeDashboard]);

  // Handle tab changes without refetching data
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    // Data is already cached, no need to refetch
  }, []);

  // Refresh data manually
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeDashboard(true); // Force refresh
    setRefreshing(false);
  }, [initializeDashboard]);

  // Calculate analytics with memoization
  const calculatedAnalytics = useMemo(() => {
    try {
      // Filter valid orders (exclude cancelled/returned for revenue)
      const validOrders = orders.filter(
        (order) =>
          order.status !== ORDER_STATUS.CANCELLED &&
          order.status !== ORDER_STATUS.RETURNED,
      );

      const totalProducts = products.length;
      const activeProducts = products.filter(
        (p) => p.stock > 0 && p.status !== PRODUCT_STATUS.INACTIVE,
      ).length;

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(
        (o) => o.status === ORDER_STATUS.PENDING,
      ).length;

      // Calculate revenue from valid orders only
      const totalRevenue = validOrders.reduce(
        (sum, order) => sum + (order.farmerSubtotal || order.total || 0),
        0,
      );

      // This month's orders (valid only)
      const now = new Date();
      const thisMonthValidOrders = validOrders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      });

      const averageOrderValue =
        validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

      return {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        thisMonthOrders: thisMonthValidOrders.length,
        averageOrderValue,
        lowStockProducts: products.filter((p) => p.stock <= 10).length,
        recentOrders: orders.slice(0, 5),
      };
    } catch (error) {
      console.error("Error calculating analytics:", error);
      return {
        totalProducts: 0,
        activeProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        thisMonthOrders: 0,
        averageOrderValue: 0,
        lowStockProducts: 0,
        recentOrders: [],
      };
    }
  }, [products, orders]);

  // Update analytics when calculated values change
  useEffect(() => {
    setAnalytics(calculatedAnalytics);
  }, [calculatedAnalytics]);

  // Filter and sort products with better performance
  const filteredAndSortedProducts = useMemo(() => {
    try {
      let filtered = [...products];

      // Apply search filter
      if (filters.search) {
        const searchRegex = new RegExp(filters.search.trim(), "i");
        filtered = filtered.filter(
          (product) =>
            searchRegex.test(product.name) ||
            searchRegex.test(product.description || "") ||
            searchRegex.test(product.category || ""),
        );
      }

      // Apply category filter
      if (filters.category) {
        filtered = filtered.filter(
          (product) =>
            product.category?.toLowerCase() === filters.category.toLowerCase(),
        );
      }

      // Apply status filter
      if (filters.status) {
        switch (filters.status) {
          case PRODUCT_STATUS.ACTIVE:
            filtered = filtered.filter(
              (product) =>
                product.stock > 0 && product.status !== PRODUCT_STATUS.INACTIVE,
            );
            break;
          case PRODUCT_STATUS.INACTIVE:
            filtered = filtered.filter(
              (product) => product.status === PRODUCT_STATUS.INACTIVE,
            );
            break;
          case PRODUCT_STATUS.OUT_OF_STOCK:
            filtered = filtered.filter((product) => product.stock === 0);
            break;
          case PRODUCT_STATUS.LOW_STOCK:
            filtered = filtered.filter(
              (product) => product.stock > 0 && product.stock <= 5,
            );
            break;
        }
      }

      // Apply sorting
      if (filters.sort) {
        const [key, order] = filters.sort.split("-");
        filtered.sort((a, b) => {
          let valueA, valueB;

          switch (key) {
            case "price":
              valueA = a.price || 0;
              valueB = b.price || 0;
              break;
            case "name":
              valueA = a.name || "";
              valueB = b.name || "";
              return order === "asc"
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);
            case "stock":
              valueA = a.stock || 0;
              valueB = b.stock || 0;
              break;
            case "date":
              valueA = new Date(a.createdAt || 0);
              valueB = new Date(b.createdAt || 0);
              break;
            default:
              return 0;
          }

          return order === "asc" ? valueA - valueB : valueB - valueA;
        });
      }

      return filtered;
    } catch (error) {
      console.error("Error filtering products:", error);
      return products;
    }
  }, [products, filters]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [filters]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, pagination]);

  // Total pages calculation
  const totalPages = Math.ceil(
    filteredAndSortedProducts.length / pagination.limit,
  );

  // Product management functions
  const handleStatusToggle = useCallback(async (productId, currentStatus) => {
    const newStatus =
      currentStatus === PRODUCT_STATUS.ACTIVE
        ? PRODUCT_STATUS.INACTIVE
        : PRODUCT_STATUS.ACTIVE;
    const actionText =
      newStatus === PRODUCT_STATUS.ACTIVE ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${actionText} this product?`)) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [productId]: "status" }));

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${actionText} product`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || `Failed to ${actionText} product`);
      }

      // Update local state
      setProducts((prev) =>
        prev.map((product) =>
          product._id === productId
            ? { ...product, status: newStatus }
            : product,
        ),
      );

      // Show success message
      const successMsg =
        newStatus === PRODUCT_STATUS.ACTIVE
          ? "Product activated successfully!"
          : "Product deactivated successfully!";

      // Consider using a toast notification instead of alert
      alert(successMsg);
    } catch (error) {
      console.error("Error updating product status:", error);
      alert(`Failed to ${actionText} product: ${error.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [productId]: null }));
    }
  }, []);

  const handleDeleteProduct = useCallback(async (productId) => {
    const confirmMessage =
      "⚠️ Are you sure you want to delete this product?\n\n" +
      "This action cannot be undone and will remove:\n" +
      "• The product listing\n" +
      "• All associated data\n" +
      "• Product from any pending orders";

    if (!confirm(confirmMessage)) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [productId]: "delete" }));

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 409) {
          alert(
            "❌ Cannot Delete Product\n\n" +
              "This product has pending orders and cannot be deleted.\n" +
              "Please wait for all orders to be completed or cancelled before deleting this product.\n\n" +
              "You can temporarily deactivate the product instead by clicking the pause button.",
          );
          return;
        } else if (response.status === 404) {
          alert("❌ Product not found. It may have already been deleted.");
          return;
        } else {
          throw new Error(errorData.error || "Failed to delete product");
        }
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to delete product");
      }

      // Remove from local state
      setProducts((prev) =>
        prev.filter((product) => product._id !== productId),
      );

      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(`❌ Failed to delete product: ${error.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [productId]: null }));
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Update pagination
  const updatePagination = useCallback((newPagination) => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  }, []);

  // Utility functions
  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price || 0);
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const getProductStatusBadge = useCallback((product) => {
    if (product.status === PRODUCT_STATUS.INACTIVE) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <i className="fas fa-pause mr-1"></i>
          Inactive
        </span>
      );
    }
    if (product.stock === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <i className="fas fa-exclamation-triangle mr-1"></i>
          Out of Stock
        </span>
      );
    }
    if (product.stock <= 5) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          <i className="fas fa-exclamation-circle mr-1"></i>
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <i className="fas fa-check-circle mr-1"></i>
        Active
      </span>
    );
  }, []);

  // Component props
  const dashboardProps = {
    session,
    products,
    orders,
    analytics,
    handleRefresh,
    refreshing,
    formatPrice,
    formatDate,
    loading,
    error,
  };

  const productProps = {
    products: products,
    paginatedProducts: paginatedProducts,
    filteredProducts: filteredAndSortedProducts,
    totalProducts: products.length,
    filters,
    updateFilters,
    pagination: { ...pagination, totalPages },
    updatePagination,
    viewMode,
    setViewMode,
    handleStatusToggle,
    handleDeleteProduct,
    actionLoading,
    getProductStatusBadge,
    handleRefresh,
    refreshing,
    formatPrice,
    formatDate,
    loading,
    error,
  };

  const orderProps = {
    orders,
    handleRefresh,
    refreshing,
    formatPrice,
    formatDate,
    loading,
    error,
  };

  const analyticsProps = {
    analytics,
    products,
    orders,
    formatPrice,
    loading,
    error,
  };

  const settingsProps = {
    session,
    handleRefresh,
    refreshing,
    loading,
    error,
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !products.length && !orders.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            {refreshing ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Retrying...
              </>
            ) : (
              <>
                <i className="fas fa-redo mr-2"></i>
                Try Again
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Dashboard Header */}
        <DashboardHeader {...dashboardProps} />

        {/* Error Alert */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                <span className="text-red-700 dark:text-red-300">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === TABS.DASHBOARD && <DashboardTab {...dashboardProps} />}
          {activeTab === TABS.PRODUCTS && <ProductsTab {...productProps} />}
          {activeTab === TABS.ORDERS && <OrdersTab {...orderProps} />}
          {activeTab === TABS.ANALYTICS && <AnalyticsTab {...analyticsProps} />}
          {activeTab === TABS.SETTINGS && <SettingsTab {...settingsProps} />}
        </div>
      </div>
      <Footer />
    </>
  );
}
