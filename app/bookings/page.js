"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

// Constants for better maintainability
const ORDER_STATUSES = {
  ALL: "All Orders",
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const DATE_FILTERS = {
  ALL: "all",
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
};

const SORT_OPTIONS = {
  NEWEST: "newest",
  OLDEST: "oldest",
  HIGHEST: "highest",
  LOWEST: "lowest",
};

const VIEW_MODES = {
  CARDS: "cards",
  LIST: "list",
};

// Custom hooks for better code organization
const useOrdersData = (session, status) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchOrders = useCallback(
    async (showLoading = true) => {
      if (status !== "authenticated" || !session?.user) return;

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        if (showLoading) setLoading(true);
        setError(null);

        const userId =
          session.user.userId ||
          session.user.id ||
          session.user._id ||
          session.user.email;
        const userRole =
          session.user.userType || session.user.role || "customer";

        let apiUrl;
        if (userRole === "farmer") {
          const farmerId =
            session.user.userId || session.user.id || session.user._id;
          const farmerEmail = session.user.email;

          if (farmerId) {
            apiUrl = `/api/orders?farmerId=${encodeURIComponent(farmerId)}`;
          } else if (farmerEmail) {
            apiUrl = `/api/orders?farmerEmail=${encodeURIComponent(farmerEmail)}`;
          } else {
            throw new Error("No farmer identifier found");
          }
        } else {
          apiUrl = `/api/orders?userId=${encodeURIComponent(userId)}`;
        }

        const response = await fetch(apiUrl, {
          signal: abortControllerRef.current.signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Validate response structure
        if (!data || !Array.isArray(data.orders)) {
          throw new Error("Invalid API response format");
        }

        setOrders(data.orders);
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Request was cancelled");
          return;
        }

        console.error("Error fetching orders:", error);
        setError(error.message || "Failed to fetch orders");
        setOrders([]);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [session, status],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { orders, loading, error, fetchOrders };
};

const useOrderFilters = (orders) => {
  const [statusFilter, setStatusFilter] = useState(ORDER_STATUSES.ALL);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.ALL);
  const [sortOrder, setSortOrder] = useState(SORT_OPTIONS.NEWEST);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== ORDER_STATUSES.ALL) {
      filtered = filtered.filter(
        (order) => order.status?.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Search filter
    if (searchTerm.trim()) {
      const searchText = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        return (
          order._id?.toLowerCase().includes(searchText) ||
          order.customerName?.toLowerCase().includes(searchText) ||
          order.items?.some(
            (item) =>
              item.productName?.toLowerCase().includes(searchText) ||
              item.farmerName?.toLowerCase().includes(searchText),
          )
        );
      });
    }

    // Date filter
    if (dateFilter !== DATE_FILTERS.ALL) {
      const now = new Date();
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        switch (dateFilter) {
          case DATE_FILTERS.TODAY:
            return orderDate.toDateString() === now.toDateString();
          case DATE_FILTERS.WEEK:
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case DATE_FILTERS.MONTH:
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case SORT_OPTIONS.NEWEST:
          return new Date(b.createdAt) - new Date(a.createdAt);
        case SORT_OPTIONS.OLDEST:
          return new Date(a.createdAt) - new Date(b.createdAt);
        case SORT_OPTIONS.HIGHEST:
          return (b.total || 0) - (a.total || 0);
        case SORT_OPTIONS.LOWEST:
          return (a.total || 0) - (b.total || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, statusFilter, searchTerm, dateFilter, sortOrder]);

  return {
    filteredOrders,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    sortOrder,
    setSortOrder,
  };
};

const useOrderStats = (orders) => {
  return useMemo(() => {
    if (!orders.length) {
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalSpent: 0,
        averageOrderValue: 0,
      };
    }

    const stats = orders.reduce(
      (acc, order) => {
        const status = order.status?.toLowerCase();
        const total = order.total || 0;

        acc.total++;
        acc.totalSpent += total;

        if (status in acc) {
          acc[status]++;
        }

        return acc;
      },
      {
        total: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalSpent: 0,
      },
    );

    stats.averageOrderValue =
      stats.total > 0 ? stats.totalSpent / stats.total : 0;

    return stats;
  }, [orders]);
};

// Enhanced loading component
const OrdersLoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Stats Cards Loading */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-lg w-20"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded-lg w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Filters Loading */}
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>

    {/* Orders Loading */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-20"></div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Enhanced initial loading screen
const InitialLoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-6 animate-bounce">
          <i className="fas fa-shopping-bag text-3xl text-white"></i>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Loading Your Orders
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Please wait while we fetch your order history...
        </p>

        {/* Loading progress bar */}
        <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-blue-600 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Loading content */}
      <OrdersLoadingSkeleton />
    </div>
  </div>
);

export default function Bookings() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Custom hooks
  const { orders, loading, error, fetchOrders } = useOrdersData(
    session,
    status,
  );
  const orderStats = useOrderStats(orders);
  const {
    filteredOrders,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    sortOrder,
    setSortOrder,
  } = useOrderFilters(orders);

  // UI state
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState(VIEW_MODES.CARDS);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(new Set());
  const [navigationLoading, setNavigationLoading] = useState(true); // Add navigation loading state

  const ordersPerPage = viewMode === VIEW_MODES.LIST ? 10 : 6;

  // Authentication and role-based access check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user) {
      // Check user role - farmers should not access customer bookings page
      const userRole = session.user.userType || session.user.role || "customer";

      if (userRole === "farmer") {
        // Redirect farmers to their orders dashboard
        router.push("/farmer-orders");
        return;
      }
    }
  }, [status, session, router]);

  // Initial data fetch
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchOrders();
    }
  }, [session, status, fetchOrders]);

  // Handle navigation loading state
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Show loading for a brief moment to display skeleton when navigating
      const timer = setTimeout(() => {
        setNavigationLoading(false);
      }, 800); // Adjust timing as needed

      return () => clearTimeout(timer);
    } else if (status === "loading") {
      setNavigationLoading(true);
    }
  }, [status, session]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, dateFilter, sortOrder]);

  // Optimized handlers with error handling
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOrders(false);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders]);

  const handleCancelOrder = useCallback(
    async (orderId) => {
      if (!window.confirm("Are you sure you want to cancel this order?"))
        return;

      setActionLoading((prev) => new Set(prev).add(orderId));

      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({ status: ORDER_STATUSES.CANCELLED }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `HTTP ${response.status}: ${response.statusText}`,
          );
        }

        // Show success feedback
        alert("Order cancelled successfully");

        // Refresh orders
        await fetchOrders(false);
      } catch (error) {
        console.error("Error cancelling order:", error);
        alert(`Error cancelling order: ${error.message}`);
      } finally {
        setActionLoading((prev) => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }
    },
    [fetchOrders],
  );

  const handleReorder = useCallback(
    (order) => {
      // Store order items in session storage for reorder functionality
      try {
        sessionStorage.setItem("reorderItems", JSON.stringify(order.items));
        router.push("/products?reorder=true");
      } catch (error) {
        console.error("Failed to store reorder data:", error);
        router.push("/products");
      }
    },
    [router],
  );

  // Utility functions
  const formatPrice = useCallback((price) => {
    const numericPrice =
      typeof price === "number" ? price : parseFloat(price) || 0;
    return `৳${numericPrice.toFixed(0)}`;
  }, []);

  const formatDate = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: {
        bg: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200",
        icon: "fas fa-check",
        pulse: false,
      },
      pending: {
        bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200",
        icon: "fas fa-clock",
        pulse: true,
      },
      delivered: {
        bg: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200",
        icon: "fas fa-check-circle",
        pulse: false,
      },
      cancelled: {
        bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200",
        icon: "fas fa-times-circle",
        pulse: false,
      },
      shipped: {
        bg: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200",
        icon: "fas fa-truck",
        pulse: true,
      },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${config.bg} ${
          config.pulse ? "animate-pulse" : ""
        }`}
      >
        <i className={`${config.icon} mr-1.5 text-xs`}></i>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"}
      </span>
    );
  };

  const getStatusProgress = (status) => {
    const statuses = ["pending", "confirmed", "shipped", "delivered"];
    const currentIndex = statuses.indexOf(status?.toLowerCase());
    const progress =
      currentIndex >= 0 ? ((currentIndex + 1) / statuses.length) * 100 : 0;

    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div
          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder,
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Show loading screen if still loading authentication, data, or navigation
  if (status === "loading" || loading || navigationLoading) {
    return <InitialLoadingScreen />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/10 dark:to-purple-400/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <nav className="flex mb-8" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-gray-500 hover:text-blue-600 transition-colors duration-200 flex items-center"
                  >
                    <i className="fas fa-home mr-1"></i>
                    Home
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                </li>
                <li className="text-gray-900 dark:text-white font-medium">
                  My Orders
                </li>
              </ol>
            </nav>

            {/* Page Header with Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                  My Orders
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Track and manage your orders • {orderStats.total} total orders
                </p>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {orderStats.total}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Total Orders
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {orderStats.delivered}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Delivered
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {orderStats.pending}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Pending
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {formatPrice(orderStats.totalSpent)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Total Spent
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters and Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search orders, products, or farmers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                >
                  <option value={ORDER_STATUSES.ALL}>
                    {ORDER_STATUSES.ALL}
                  </option>
                  <option value={ORDER_STATUSES.PENDING}>Pending</option>
                  <option value={ORDER_STATUSES.CONFIRMED}>Confirmed</option>
                  <option value={ORDER_STATUSES.SHIPPED}>Shipped</option>
                  <option value={ORDER_STATUSES.DELIVERED}>Delivered</option>
                  <option value={ORDER_STATUSES.CANCELLED}>Cancelled</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                >
                  <option value={DATE_FILTERS.ALL}>All Time</option>
                  <option value={DATE_FILTERS.TODAY}>Today</option>
                  <option value={DATE_FILTERS.WEEK}>Last Week</option>
                  <option value={DATE_FILTERS.MONTH}>Last Month</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                >
                  <option value={SORT_OPTIONS.NEWEST}>Newest First</option>
                  <option value={SORT_OPTIONS.OLDEST}>Oldest First</option>
                  <option value={SORT_OPTIONS.HIGHEST}>Highest Value</option>
                  <option value={SORT_OPTIONS.LOWEST}>Lowest Value</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode(VIEW_MODES.CARDS)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === VIEW_MODES.CARDS
                        ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <i className="fas fa-th-large"></i>
                  </button>
                  <button
                    onClick={() => setViewMode(VIEW_MODES.LIST)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === VIEW_MODES.LIST
                        ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <i className="fas fa-list"></i>
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center"
                >
                  <i
                    className={`fas fa-sync-alt mr-2 ${refreshing ? "animate-spin" : ""}`}
                  ></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Orders Display - Full Width Cards */}
          <div className="space-y-6">
            {currentOrders.map((order, index) => (
              <div
                key={order._id}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 p-6 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            Order #
                            {order._id?.slice(-8)?.toUpperCase() || "N/A"}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <i className="fas fa-calendar mr-2"></i>
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          {getStatusBadge(order.status)}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatPrice(order.total)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {order.items?.length} items
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Progress Timeline */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                            <i className="fas fa-route mr-2 text-blue-600"></i>
                            Order Progress
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(() => {
                              const statuses = [
                                "pending",
                                "confirmed",
                                "shipped",
                                "delivered",
                              ];
                              const currentIndex = statuses.indexOf(
                                order.status?.toLowerCase(),
                              );
                              return `${currentIndex + 1}/${statuses.length}`;
                            })()}
                          </span>
                        </div>

                        {/* Progress Steps */}
                        <div className="relative">
                          <div className="flex items-center justify-between">
                            {(() => {
                              const steps = [
                                {
                                  status: "pending",
                                  icon: "fas fa-clock",
                                  label: "Order Placed",
                                  color: "yellow",
                                },
                                {
                                  status: "confirmed",
                                  icon: "fas fa-check",
                                  label: "Confirmed",
                                  color: "blue",
                                },
                                {
                                  status: "shipped",
                                  icon: "fas fa-truck",
                                  label: "Shipped",
                                  color: "purple",
                                },
                                {
                                  status: "delivered",
                                  icon: "fas fa-check-circle",
                                  label: "Delivered",
                                  color: "green",
                                },
                              ];

                              const currentIndex = steps.findIndex(
                                (step) =>
                                  step.status === order.status?.toLowerCase(),
                              );

                              return steps.map((step, index) => {
                                const isCompleted = index <= currentIndex;
                                const isActive = index === currentIndex;
                                const isCancelled =
                                  order.status?.toLowerCase() === "cancelled";

                                return (
                                  <div
                                    key={step.status}
                                    className="flex flex-col items-center relative z-10"
                                  >
                                    {/* Step Icon */}
                                    <div
                                      className={`
                                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                      ${
                                        isCancelled
                                          ? "bg-red-100 border-red-300 text-red-600"
                                          : isCompleted
                                            ? `bg-${step.color}-100 border-${step.color}-500 text-${step.color}-600`
                                            : isActive
                                              ? `bg-${step.color}-50 border-${step.color}-300 text-${step.color}-500 animate-pulse`
                                              : "bg-gray-100 border-gray-300 text-gray-400"
                                      }
                                    `}
                                    >
                                      <i
                                        className={`${isCancelled ? "fas fa-times" : step.icon} text-lg`}
                                      ></i>
                                    </div>

                                    {/* Step Label */}
                                    <span
                                      className={`
                                      mt-2 text-xs font-medium text-center
                                      ${
                                        isCancelled
                                          ? "text-red-600"
                                          : isCompleted
                                            ? "text-gray-900 dark:text-white"
                                            : "text-gray-500 dark:text-gray-400"
                                      }
                                    `}
                                    >
                                      {isCancelled && index === currentIndex
                                        ? "Cancelled"
                                        : step.label}
                                    </span>

                                    {/* Date/Time for completed steps */}
                                    {isCompleted && !isCancelled && (
                                      <span className="text-xs text-gray-400 mt-1">
                                        {index === 0
                                          ? new Date(
                                              order.createdAt,
                                            ).toLocaleDateString()
                                          : "TBD"}
                                      </span>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          {/* Progress Line */}
                          <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-600 -z-0">
                            <div
                              className={`h-full transition-all duration-700 ease-out ${
                                order.status?.toLowerCase() === "cancelled"
                                  ? "bg-red-400"
                                  : "bg-gradient-to-r from-yellow-400 via-blue-400 via-purple-400 to-green-400"
                              }`}
                              style={{
                                width: (() => {
                                  const statuses = [
                                    "pending",
                                    "confirmed",
                                    "shipped",
                                    "delivered",
                                  ];
                                  const currentIndex = statuses.indexOf(
                                    order.status?.toLowerCase(),
                                  );
                                  if (
                                    order.status?.toLowerCase() === "cancelled"
                                  )
                                    return "25%";
                                  return `${((currentIndex + 1) / statuses.length) * 100}%`;
                                })(),
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Status Message */}
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.status === "pending" && (
                              <>
                                <i className="fas fa-hourglass-half mr-2 text-yellow-500"></i>
                                Waiting for farmer confirmation. We'll notify
                                you once your order is confirmed.
                              </>
                            )}
                            {order.status === "confirmed" && (
                              <>
                                <i className="fas fa-thumbs-up mr-2 text-blue-500"></i>
                                Your order has been confirmed! The farmer is
                                preparing your items.
                              </>
                            )}
                            {order.status === "shipped" && (
                              <>
                                <i className="fas fa-shipping-fast mr-2 text-purple-500"></i>
                                Your order is on the way! Track your delivery
                                for real-time updates.
                              </>
                            )}
                            {order.status === "delivered" && (
                              <>
                                <i className="fas fa-box-open mr-2 text-green-500"></i>
                                Order delivered successfully! Enjoy your fresh
                                products.
                              </>
                            )}
                            {order.status === "cancelled" && (
                              <>
                                <i className="fas fa-ban mr-2 text-red-500"></i>
                                This order has been cancelled. If you have
                                questions, please contact support.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6">
                  {/* Order Items Grid */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <i className="fas fa-box mr-2 text-blue-600"></i>
                      Order Items ({order.items?.length || 0})
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                      {order.items?.slice(0, 8).map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={
                                  item.image ||
                                  item.productImage ||
                                  item.product?.image ||
                                  item.product?.images?.[0] ||
                                  "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=60&h=60&fit=crop"
                                }
                                alt={item.productName || item.name || "Product"}
                                className="w-16 h-16 rounded-lg object-cover border-2 border-white dark:border-gray-600 shadow-sm"
                                onError={(e) => {
                                  e.target.src =
                                    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=60&h=60&fit=crop";
                                }}
                              />
                              <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                {item.quantity}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate">
                                {item.productName}
                              </h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                                <i className="fas fa-user-tie mr-1"></i>
                                {item.farmerName || "Local Farmer"}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatPrice(item.price)}/unit
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.items?.length > 8 && (
                      <div className="text-center">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors duration-200"
                        >
                          <i className="fas fa-plus mr-2"></i>
                          View {order.items.length - 8} more items
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Order Summary & Actions */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      {/* Order Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {order.items?.length || 0}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Items
                          </div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatPrice(order.subtotal || order.total || 0)}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Subtotal
                          </div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {formatPrice(order.deliveryFee || 50)}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            Delivery
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatPrice(order.total)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Total
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          <i className="fas fa-eye mr-2"></i>
                          View Details
                        </button>

                        {order.status === "delivered" && (
                          <>
                            <button className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg">
                              <i className="fas fa-download mr-2"></i>
                              Receipt
                            </button>
                            <Link
                              href={`/review?orderId=${order._id}`}
                              className="flex items-center px-4 py-2 border border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900 rounded-lg font-medium transition-all duration-200"
                            >
                              <i className="fas fa-star mr-2"></i>
                              Review
                            </Link>
                            <button
                              onClick={() => handleReorder(order)}
                              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-all duration-200"
                            >
                              <i className="fas fa-redo mr-2"></i>
                              Reorder
                            </button>
                          </>
                        )}

                        {(order.status === "pending" ||
                          order.status === "confirmed") && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            className="flex items-center px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg font-medium transition-all duration-200"
                          >
                            <i className="fas fa-times mr-2"></i>
                            Cancel Order
                          </button>
                        )}

                        {order.status === "shipped" && (
                          <button className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg">
                            <i className="fas fa-map-marker-alt mr-2"></i>
                            Track Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-12 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
                Showing {indexOfFirstOrder + 1} to{" "}
                {Math.min(indexOfLastOrder, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
              </div>

              <nav
                aria-label="Pagination"
                className="flex items-center space-x-2"
              >
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === currentPage ||
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          currentPage === page
                            ? "bg-blue-600 text-white shadow-lg transform scale-110"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    Order #{selectedOrder._id?.slice(-8)?.toUpperCase()}
                  </h3>
                  <p className="text-blue-100">
                    Placed on {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Summary */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <i className="fas fa-clipboard-list mr-2 text-blue-600"></i>
                      Order Summary
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Status:
                        </span>
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Total Amount:
                        </span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(selectedOrder.total)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Items:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.items?.length} items
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  {selectedOrder.deliveryAddress && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i className="fas fa-map-marker-alt mr-2 text-green-600"></i>
                        Delivery Information
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {selectedOrder.deliveryAddress.name}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedOrder.deliveryAddress.address}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedOrder.deliveryAddress.city}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <i className="fas fa-phone mr-2"></i>
                          {selectedOrder.deliveryAddress.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <i className="fas fa-box mr-2 text-purple-600"></i>
                    Items Ordered
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedOrder.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                      >
                        <img
                          src={
                            item.image ||
                            item.productImage ||
                            item.product?.image ||
                            item.product?.images?.[0] ||
                            "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=60&h=60&fit=crop"
                          }
                          alt={item.productName}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            By {item.farmerName || "Local Farmer"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Quantity: {item.quantity} •{" "}
                            {formatPrice(item.price)}/unit
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-600 p-6 bg-gray-50 dark:bg-gray-700">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl font-medium transition-all duration-200"
                >
                  Close
                </button>
                {selectedOrder.status === "delivered" && (
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200">
                    <i className="fas fa-download mr-2"></i>
                    Download Receipt
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
