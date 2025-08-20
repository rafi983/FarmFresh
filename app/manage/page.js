"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import ManagePageLoadingSkeleton from "@/components/dashboard/ManagePageLoadingSkeleton";
import { useDashboardData } from "@/hooks/useDashboardData";

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

  // Use React Query hook for dashboard data
  const {
    products,
    orders,
    isLoading,
    error,
    isRefetching,
    refetch: refetchDashboard,
    refreshDashboard,
    bulkUpdateProducts,
    deleteProduct, // Import deleteProduct function
  } = useDashboardData();

  // UI state
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [actionLoading, setActionLoading] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);

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

  // Authentication and authorization check
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const userType = session.user.userType || session.user.role || "user";
      const isFarmer =
        userType === "farmer" ||
        userType === "Farmer" ||
        session.user.type === "farmer" ||
        session.user.accountType === "farmer";

      if (!isFarmer) {
        router.push("/");
        return;
      }
    }
  }, [session?.user?.id, session?.user?.email, status, router]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    await refetchDashboard();
  }, [refetchDashboard]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshDashboard();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshDashboard]);

  // Calculate analytics with memoization
  const analytics = useMemo(() => {
    const validOrders = orders.filter(
      (order) =>
        order.status !== ORDER_STATUS.CANCELLED &&
        order.status !== ORDER_STATUS.RETURNED,
    );

    // Only count DELIVERED orders for revenue calculation
    const deliveredOrders = orders.filter(
      (order) => order.status === ORDER_STATUS.DELIVERED,
    );

    const totalProducts = products.length;
    const activeProducts = products.filter(
      (p) => p.stock > 0 && p.status !== PRODUCT_STATUS.INACTIVE,
    ).length;

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) => o.status === ORDER_STATUS.PENDING,
    ).length;

    // Use DELIVERED orders only for revenue calculation
    const totalRevenue = deliveredOrders.reduce((sum, order) => {
      const revenue = parseFloat(order.farmerSubtotal || order.total || 0);
      console.log(
        `Dashboard Analytics - Order ${order._id}: Status=${order.status}, FarmerSubtotal=${order.farmerSubtotal}, Total=${order.total}, Revenue=${revenue}`,
      );
      return sum + revenue;
    }, 0);

    console.log(
      `Dashboard Analytics Summary - Delivered Orders: ${deliveredOrders.length}, Total Revenue: ${totalRevenue}, Debug API Revenue: 26525.91`,
    );

    const now = new Date();
    const thisMonthValidOrders = validOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    });

    // Keep averageOrderValue based on validOrders (all orders) but use delivered revenue
    const averageOrderValue =
      deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

    const recentOrders = orders.slice(0, 5).map((order) => ({
      _id: order._id,
      id: order.id,
      customerName: order.customerName,
      total: order.total || order.farmerSubtotal,
      createdAt: order.createdAt,
      status: order.status,
      items: order.items?.length || 0,
    }));

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      thisMonthOrders: thisMonthValidOrders.length,
      averageOrderValue,
      lowStockProducts: products.filter((p) => p.stock <= 10).length,
      recentOrders,
    };
  }, [products.length, orders.length]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim(), "i");
      filtered = filtered.filter(
        (product) =>
          searchRegex.test(product.name) ||
          searchRegex.test(product.description || "") ||
          searchRegex.test(product.category || ""),
      );
    }

    if (filters.category) {
      filtered = filtered.filter(
        (product) =>
          product.category?.toLowerCase() === filters.category.toLowerCase(),
      );
    }

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
  const handleStatusToggle = useCallback(
    async (productId, currentStatus) => {
      console.log("handleStatusToggle called with:", {
        productId,
        currentStatus,
        type: typeof currentStatus,
      });

      // Normalize the current status to lowercase for comparison
      const normalizedCurrentStatus = currentStatus?.toLowerCase();
      const normalizedActiveStatus = PRODUCT_STATUS.ACTIVE.toLowerCase();

      const newStatus =
        normalizedCurrentStatus === normalizedActiveStatus
          ? PRODUCT_STATUS.INACTIVE
          : PRODUCT_STATUS.ACTIVE;

      console.log("Status toggle:", {
        currentStatus,
        normalizedCurrentStatus,
        newStatus,
        comparison: normalizedCurrentStatus === normalizedActiveStatus,
      });

      const actionText =
        newStatus === PRODUCT_STATUS.ACTIVE ? "activate" : "deactivate";

      if (!confirm(`Are you sure you want to ${actionText} this product?`)) {
        return;
      }

      setActionLoading((prev) => ({ ...prev, [productId]: "status" }));

      try {
        console.log("Sending status update:", { productId, status: newStatus });

        // Use the bulkUpdateProducts from hook (includes cache invalidation like farmer updates)
        const result = await bulkUpdateProducts(
          [productId], // Single product as array
          { status: newStatus },
        );

        if (!result.success) {
          throw new Error(result.error || `Failed to ${actionText} product`);
        }

        // Dispatch custom event to notify products page of status change
        window.dispatchEvent(
          new CustomEvent("productStatusUpdated", {
            detail: {
              productId: productId,
              newStatus: newStatus,
              timestamp: Date.now(),
            },
          }),
        );

        // Also set localStorage flag for cross-tab communication
        localStorage.setItem(
          "productStatusUpdated",
          JSON.stringify({
            productId: productId,
            newStatus: newStatus,
            timestamp: Date.now(),
          }),
        );

        const successMsg =
          newStatus === PRODUCT_STATUS.ACTIVE
            ? "Product activated successfully!"
            : "Product deactivated successfully!";

        alert(successMsg);
      } catch (error) {
        console.error("Error updating product status:", error);
        alert(`Failed to ${actionText} product: ${error.message}`);
      } finally {
        setActionLoading((prev) => ({ ...prev, [productId]: null }));
      }
    },
    [bulkUpdateProducts],
  );

  const handleDeleteProduct = useCallback(
    async (productId) => {
      const confirmMessage =
        "⚠️ Are you sure you want to delete this product?\n\n" +
        "This action cannot be undone and will remove:\n" +
        "• The product listing\n" +
        "• All associated data\n" +
        "• Product from any pending orders";

      if (!confirm(confirmMessage)) return;

      setActionLoading((prev) => ({ ...prev, [productId]: "delete" }));

      try {
        // Use the deleteProduct function from hook (includes optimistic cache updates)
        const result = await deleteProduct(productId);

        if (!result.success) {
          throw new Error("Failed to delete product");
        }

        alert("Product deleted successfully!");
      } catch (error) {
        console.error("Error deleting product:", error);

        // Handle specific error cases
        if (error.message.includes("pending orders")) {
          alert(
            "❌ Cannot Delete Product\n\n" +
              "This product has pending orders and cannot be deleted.\n" +
              "Please wait for all orders to be completed or cancelled before deleting this product.\n\n" +
              "You can temporarily deactivate the product instead by clicking the pause button.",
          );
        } else if (error.message.includes("not found")) {
          alert("❌ Product not found. It may have already been deleted.");
        } else {
          alert(`❌ Failed to delete product: ${error.message}`);
        }
      } finally {
        setActionLoading((prev) => ({ ...prev, [productId]: null }));
      }
    },
    [deleteProduct],
  );

  // Update functions
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const updatePagination = useCallback((newPagination) => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  }, []);

  // Utility functions
  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
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
  const commonProps = {
    session,
    products,
    orders,
    analytics,
    handleRefresh,
    refreshing: isRefetching,
    formatPrice,
    formatDate,
    loading: isLoading,
    error,
    bulkUpdateProducts, // Add this prop for DashboardTab
  };

  const productProps = {
    ...commonProps,
    paginatedProducts,
    filteredProducts: filteredAndSortedProducts,
    totalProducts: products.length,
    // Fix: Map filters object to individual props expected by ProductsTab
    searchTerm: filters.search,
    setSearchTerm: (value) =>
      setFilters((prev) => ({ ...prev, search: value })),
    selectedCategory: filters.category,
    setSelectedCategory: (value) =>
      setFilters((prev) => ({ ...prev, category: value })),
    selectedStatus: filters.status,
    setSelectedStatus: (value) =>
      setFilters((prev) => ({ ...prev, status: value })),
    selectedSort: filters.sort,
    setSelectedSort: (value) =>
      setFilters((prev) => ({ ...prev, sort: value })),
    // Keep existing props
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
    // Add missing bulk update functionality for ProductsTab
    bulkUpdateProducts,
  };

  // Loading state - Use dedicated manage page skeleton
  if (isLoading || status === "loading") {
    return <ManagePageLoadingSkeleton />;
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
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error.message}
          </p>
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            {isRefetching ? (
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
        <DashboardHeader {...commonProps} />

        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                <span className="text-red-700 dark:text-red-300">
                  {error.message}
                </span>
                <button
                  onClick={handleRefresh}
                  className="ml-auto text-primary-600 hover:text-primary-800"
                >
                  <i className="fas fa-redo"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === TABS.DASHBOARD && <DashboardTab {...commonProps} />}
          {activeTab === TABS.PRODUCTS && <ProductsTab {...productProps} />}
          {activeTab === TABS.ORDERS && <OrdersTab {...commonProps} />}
          {activeTab === TABS.ANALYTICS && <AnalyticsTab {...commonProps} />}
          {activeTab === TABS.SETTINGS && <SettingsTab {...commonProps} />}
        </div>
      </div>
      <Footer />
    </>
  );
}
