"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Footer from "@/components/Footer";
import FarmerOrdersLoadingSkeleton from "@/components/farmers/FarmerOrdersLoadingSkeleton";
import { debounce } from "@/utils/debounce";
import { useOrderStatusUpdate } from "@/hooks/useOrderStatusUpdate";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function FarmerOrders() {
  const { data: session, status } = useSession();
  const { updateOrderStatus, updating } = useOrderStatusUpdate();

  // Replace deprecated useFarmerOrders with dashboard data source
  const {
    orders,
    isLoading: loading,
    error,
    isRefetching: refreshing,
    refetch: refetchOrders,
    refreshDashboard,
    updateOrderInCache, // added
  } = useDashboardData();
  const refreshOrders = refreshDashboard; // maintain existing variable naming

  // Local UI state
  const [statusFilter, setStatusFilter] = useState("All Orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [viewMode, setViewMode] = useState("detailed");
  const [sortBy, setSortBy] = useState("newest");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showExportModal, setShowExportModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const ordersPerPage = viewMode === "compact" ? 20 : 10;

  // Enhanced notification system
  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, timestamp: new Date() };

    setNotifications((prev) => [notification, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  // Optimized debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((searchValue) => {
        setSearchTerm(searchValue);
      }, 300),
    [],
  );

  // Enhanced file download
  const downloadFile = useCallback(
    (content, filename, mimeType) => {
      try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download error:", error);
        addNotification("Failed to download file", "error");
      }
    },
    [addNotification],
  );

  // Enhanced CSV conversion
  const convertToCSV = useCallback((data) => {
    const headers = [
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Status",
      "Total Amount",
      "Order Date",
      "Items Count",
      "Payment Method",
      "Delivery Address",
    ];

    const csvData = data.map((order) => [
      order._id?.slice(-8)?.toUpperCase() || "N/A",
      (order.customerName || order.userName || "").replace(/,/g, ";"),
      order.customerEmail || order.userEmail || "",
      order.status || "pending",
      order.farmerSubtotal || order.total || 0,
      new Date(order.createdAt).toLocaleDateString(),
      order.items?.length || 0,
      (order.paymentMethod || "Cash on Delivery").replace(/,/g, ";"),
      typeof order.deliveryAddress === "object"
        ? `${order.deliveryAddress.address || ""}, ${order.deliveryAddress.city || ""} ${order.deliveryAddress.postalCode || ""}`.replace(
            /,/g,
            ";",
          )
        : (order.deliveryAddress || "Not provided").replace(/,/g, ";"),
    ]);

    return [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }, []);

  // Memoized filtered orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== "All Orders") {
      filtered = filtered.filter(
        (order) => order.status?.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchRegex = new RegExp(
        searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filtered = filtered.filter((order) => {
        const orderItemsMatch = order.items?.some(
          (item) =>
            searchRegex.test(item.name) ||
            searchRegex.test(item.productName) ||
            searchRegex.test(item.category),
        );
        const customerMatch =
          searchRegex.test(order.customerName) ||
          searchRegex.test(order.customerEmail) ||
          searchRegex.test(order.userEmail);
        const orderIdMatch = searchRegex.test(order._id);

        return orderItemsMatch || customerMatch || orderIdMatch;
      });
    }

    // Apply date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(
        (order) => new Date(order.createdAt) >= startDate,
      );
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (order) => new Date(order.createdAt) <= endDate,
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "highest-value":
          return (
            (b.farmerSubtotal || b.total || 0) -
            (a.farmerSubtotal || a.total || 0)
          );
        case "lowest-value":
          return (
            (a.farmerSubtotal || a.total || 0) -
            (b.farmerSubtotal || b.total || 0)
          );
        case "customer-name":
          return (a.customerName || a.userName || "").localeCompare(
            b.customerName || b.userName || "",
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, statusFilter, searchTerm, dateRange, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredOrders]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshOrders]);

  // Enhanced single order status update using the hook
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const statusMessages = {
      confirmed:
        "confirm this order? This will notify the customer that their order has been accepted.",
      shipped:
        "mark this order as shipped? This will notify the customer that their order is on the way.",
      delivered:
        "mark this order as delivered? This will complete the order and notify the customer.",
      cancelled:
        "cancel this order? This action cannot be undone and will notify the customer.",
    };

    const confirmMessage =
      statusMessages[newStatus] || `mark this order as ${newStatus}?`;

    if (!confirm(`Are you sure you want to ${confirmMessage}`)) {
      return;
    }

    try {
      const result = await updateOrderStatus(orderId, newStatus, {
        estimatedDeliveryDate:
          newStatus === "shipped"
            ? (() => {
                const date = new Date();
                date.setDate(date.getDate() + 3);
                return date.toISOString();
              })()
            : undefined,
      });

      // Explicit local cache update (defensive) to ensure immediate UI response
      if (result?.order) {
        updateOrderInCache(orderId, newStatus, result.order);
      }

      const successMessages = {
        confirmed: "Order confirmed! Dashboard updated automatically.",
        shipped: "Order marked as shipped! Dashboard updated automatically.",
        delivered: "Order completed! Dashboard updated automatically.",
        cancelled: "Order cancelled! Dashboard updated automatically.",
      };

      addNotification(
        successMessages[newStatus] ||
          `Order status updated to ${newStatus} successfully! Dashboard updated automatically.`,
        "success",
      );
    } catch (error) {
      console.error("Error updating order status:", error);
      addNotification(
        `Failed to update order status: ${error.message}`,
        "error",
      );
    }
  };

  // Enhanced refresh handler
  const handleRefresh = async () => {
    await refetchOrders();
    addNotification("Orders refreshed successfully!", "success");
  };

  // Search handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Export functionality
  const exportOrders = useCallback(
    (format) => {
      const dataToExport =
        selectedOrders.length > 0
          ? filteredOrders.filter((order) => selectedOrders.includes(order._id))
          : filteredOrders;

      try {
        if (format === "csv") {
          const csv = convertToCSV(dataToExport);
          downloadFile(
            csv,
            `farmer-orders-${new Date().toISOString().split("T")[0]}.csv`,
            "text/csv",
          );
        } else if (format === "json") {
          const json = JSON.stringify(dataToExport, null, 2);
          downloadFile(
            json,
            `farmer-orders-${new Date().toISOString().split("T")[0]}.json`,
            "application/json",
          );
        }

        addNotification(
          `${dataToExport.length} orders exported successfully!`,
          "success",
        );
      } catch (error) {
        console.error("Export error:", error);
        addNotification("Failed to export orders", "error");
      } finally {
        setShowExportModal(false);
      }
    },
    [
      filteredOrders,
      selectedOrders,
      convertToCSV,
      downloadFile,
      addNotification,
    ],
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        icon: "fas fa-clock",
      },
      confirmed: {
        bg: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: "fas fa-check",
      },
      shipped: {
        bg: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        icon: "fas fa-truck",
      },
      delivered: {
        bg: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: "fas fa-check-circle",
      },
      cancelled: {
        bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: "fas fa-times-circle",
      },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg}`}
      >
        <i className={`${config.icon} mr-1`}></i>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"}
      </span>
    );
  };

  const getOrderActions = (order) => {
    const actions = [];

    switch (order.status.toLowerCase()) {
      case "pending":
        actions.push(
          <button
            key="confirm"
            onClick={() => handleUpdateOrderStatus(order._id, "confirmed")}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
          >
            <i className="fas fa-check mr-1"></i>
            Confirm Order
          </button>,
        );
        actions.push(
          <button
            key="cancel"
            onClick={() => handleUpdateOrderStatus(order._id, "cancelled")}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
          >
            <i className="fas fa-times mr-1"></i>
            Cancel Order
          </button>,
        );
        break;
      case "confirmed":
        actions.push(
          <button
            key="ship"
            onClick={() => handleUpdateOrderStatus(order._id, "shipped")}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
          >
            <i className="fas fa-truck mr-1"></i>
            Mark as Shipped
          </button>,
        );
        break;
      case "shipped":
        actions.push(
          <button
            key="deliver"
            onClick={() => handleUpdateOrderStatus(order._id, "delivered")}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
          >
            <i className="fas fa-check-circle mr-1"></i>
            Mark as Delivered
          </button>,
        );
        break;
    }

    return actions;
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder,
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const getOrderSummary = () => {
    const summary = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
    return summary;
  };

  if (status === "loading" || loading) {
    return <FarmerOrdersLoadingSkeleton />;
  }

  const orderSummary = getOrderSummary();

  return (
    <>
      {/* Notification System */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-6 py-4 rounded-lg shadow-lg text-white transform transition-all duration-500 ${
              notification.type === "success"
                ? "bg-green-600"
                : notification.type === "error"
                  ? "bg-red-600"
                  : notification.type === "warning"
                    ? "bg-yellow-600"
                    : "bg-blue-600"
            }`}
          >
            <div className="flex items-center">
              <i
                className={`fas ${
                  notification.type === "success"
                    ? "fa-check-circle"
                    : notification.type === "error"
                      ? "fa-exclamation-circle"
                      : notification.type === "warning"
                        ? "fa-exclamation-triangle"
                        : "fa-info-circle"
                } mr-2`}
              ></i>
              {notification.message}
            </div>
          </div>
        ))}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Export Orders
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {selectedOrders.length > 0
                ? `Export ${selectedOrders.length} selected orders`
                : `Export all ${filteredOrders.length} filtered orders`}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => exportOrders("csv")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition"
              >
                <i className="fas fa-file-csv mr-2"></i>
                Export as CSV
              </button>
              <button
                onClick={() => exportOrders("json")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition"
              >
                <i className="fas fa-file-code mr-2"></i>
                Export as JSON
              </button>
            </div>
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        {/* Enhanced Breadcrumb with Real-time Indicators */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-gray-500 hover:text-green-600 transition"
                  >
                    <i className="fas fa-home mr-1"></i>Home
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                </li>
                <li>
                  <Link
                    href="/manage"
                    className="text-gray-500 hover:text-green-600 transition"
                  >
                    <i className="fas fa-cog mr-1"></i>Manage
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                </li>
                <li className="text-gray-900 dark:text-white font-medium">
                  <i className="fas fa-chart-line mr-1"></i>Advanced Order
                  Management
                </li>
              </ol>
            </nav>

            {/* Real-time Status Indicator */}
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
              ></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {autoRefresh ? "Live" : "Static"}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Page Header with Quick Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 rounded-2xl">
                <i className="fas fa-chart-line text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Advanced Order Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Comprehensive order tracking and analytics dashboard
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                  </span>
                  {autoRefresh && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Auto-refresh enabled
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`inline-flex items-center px-4 py-3 rounded-lg font-medium transition ${
                  autoRefresh
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                <i
                  className={`fas ${autoRefresh ? "fa-pause" : "fa-play"} mr-2`}
                ></i>
                {autoRefresh ? "Pause" : "Auto"} Refresh
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition"
              >
                <i className="fas fa-download mr-2"></i>
                Export
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
              >
                <i
                  className={`fas fa-sync-alt mr-2 ${refreshing ? "animate-spin" : ""}`}
                ></i>
                Refresh
              </button>

              <Link
                href="/manage"
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Manage
              </Link>
            </div>
          </div>

          {/* Enhanced Order Summary Cards with Animations */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            {Object.entries(orderSummary).map(([key, value], index) => {
              const config = {
                total: {
                  icon: "fa-shopping-cart",
                  color: "gray",
                  label: "Total",
                },
                pending: {
                  icon: "fa-clock",
                  color: "yellow",
                  label: "Pending",
                },
                confirmed: {
                  icon: "fa-check",
                  color: "blue",
                  label: "Confirmed",
                },
                shipped: {
                  icon: "fa-truck",
                  color: "purple",
                  label: "Shipped",
                },
                delivered: {
                  icon: "fa-check-circle",
                  color: "green",
                  label: "Delivered",
                },
                cancelled: {
                  icon: "fa-times-circle",
                  color: "red",
                  label: "Cancelled",
                },
              }[key];

              return (
                <div
                  key={key}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 transform hover:scale-105 transition-transform duration-200 cursor-pointer"
                  onClick={() =>
                    setStatusFilter(
                      key === "total"
                        ? "All Orders"
                        : config.label.toLowerCase(),
                    )
                  }
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center">
                    <div
                      className={`p-2 bg-${config.color}-100 dark:bg-${config.color}-900 rounded-lg`}
                    >
                      <i
                        className={`fas ${config.icon} text-${config.color}-600 dark:text-${config.color}-300`}
                      ></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {config.label}
                      </p>
                      <p
                        className={`text-2xl font-bold text-${config.color}-600 dark:text-${config.color}-400`}
                      >
                        {value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Filters and Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 lg:mb-0">
                <i className="fas fa-filter mr-2"></i>
                Advanced Filters & Controls
              </h3>

              {/* View Mode Toggle */}
              <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {["detailed", "compact"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      viewMode === mode
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <i
                      className={`fas ${
                        mode === "detailed"
                          ? "fa-list"
                          : mode === "compact"
                            ? "fa-th-list"
                            : ""
                      } mr-1`}
                    ></i>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Orders
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by customer, email, or ID..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="All Orders">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest-value">Highest Value</option>
                  <option value="lowest-value">Lowest Value</option>
                  <option value="customer-name">Customer Name</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All Orders");
                    setSortBy("newest");
                    setDateRange({ start: "", end: "" });
                    setSelectedOrders([]);
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition"
                >
                  <i className="fas fa-times mr-1"></i>
                  Clear All
                </button>
              </div>
            </div>

            {/* Bulk Operations */}
            {selectedOrders.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="mb-3 sm:mb-0">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {selectedOrders.length} order(s) selected
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Choose a bulk action to apply to selected orders
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleBulkStatusUpdate("confirmed")}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      <i className="fas fa-check mr-1"></i>
                      Confirm All
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate("shipped")}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      <i className="fas fa-truck mr-1"></i>
                      Ship All
                    </button>
                    <button
                      onClick={() => setSelectedOrders([])}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      <i className="fas fa-times mr-1"></i>
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Orders List - Enhanced with different view modes */}
          {currentOrders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <div className="max-w-md mx-auto">
                <i className="fas fa-search text-6xl text-gray-400 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No orders found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {statusFilter === "All Orders"
                    ? "You haven't received any orders yet, or no orders match your current filters."
                    : `No ${statusFilter.toLowerCase()} orders found matching your criteria.`}
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All Orders");
                    setSortBy("newest");
                    setDateRange({ start: "", end: "" });
                    setSelectedOrders([]);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-medium transition"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className={`space-y-${viewMode === "compact" ? "3" : "6"}`}>
              {/* Select All Checkbox */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === currentOrders.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(
                          currentOrders.map((order) => order._id),
                        );
                      } else {
                        setSelectedOrders([]);
                      }
                    }}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select all visible orders ({currentOrders.length})
                  </span>
                </label>
              </div>

              {/* Orders */}
              {currentOrders.map((order) => (
                <div
                  key={order._id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transform hover:scale-[1.01] transition-all duration-200 ${
                    selectedOrders.includes(order._id)
                      ? "ring-2 ring-green-500"
                      : ""
                  }`}
                >
                  <div className={`p-${viewMode === "compact" ? "4" : "6"}`}>
                    {/* Order Header with Checkbox */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders((prev) => [...prev, order._id]);
                            } else {
                              setSelectedOrders((prev) =>
                                prev.filter((id) => id !== order._id),
                              );
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <h3
                            className={`${viewMode === "compact" ? "text-base" : "text-lg"} font-semibold text-gray-900 dark:text-white`}
                          >
                            Order #
                            {order._id?.slice(-8)?.toUpperCase() || "N/A"}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Placed on {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(order.status)}
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatPrice(
                            order.farmerSubtotal || order.total || 0,
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Customer Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Name:</span>{" "}
                            {order.customerName || order.userName || "Customer"}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Email:</span>{" "}
                            {order.customerEmail ||
                              order.userEmail ||
                              "Not available"}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Phone:</span>{" "}
                            {order.customerPhone ||
                              order.userPhone ||
                              "Not available"}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Delivery Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Address:</span>{" "}
                            {typeof order.deliveryAddress === "object" &&
                            order.deliveryAddress
                              ? `${order.deliveryAddress.address || ""}, ${order.deliveryAddress.city || ""} ${order.deliveryAddress.postalCode || ""}`
                                  .replace(/^,\s*/, "")
                                  .replace(/,\s*$/, "") || "Not provided"
                              : order.deliveryAddress || "Not provided"}
                          </p>
                          {typeof order.deliveryAddress === "object" &&
                            order.deliveryAddress?.name && (
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Recipient:</span>{" "}
                                {order.deliveryAddress.name}
                              </p>
                            )}
                          {typeof order.deliveryAddress === "object" &&
                            order.deliveryAddress?.phone && (
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Contact:</span>{" "}
                                {order.deliveryAddress.phone}
                              </p>
                            )}
                          {typeof order.deliveryAddress === "object" &&
                            order.deliveryAddress?.instructions && (
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">
                                  Instructions:
                                </span>{" "}
                                {order.deliveryAddress.instructions}
                              </p>
                            )}
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Payment Method:</span>{" "}
                            {order.paymentMethod || "Cash on Delivery"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mb-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                        Order Items ({order.items?.length || 0})
                      </h4>
                      <div className="space-y-3">
                        {order.items?.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <img
                                src={
                                  item.image ||
                                  item.productImage ||
                                  (Array.isArray(item.images) &&
                                    item.images[0]) ||
                                  "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=80&h=80&fit=crop"
                                }
                                alt={item.name || item.productName}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  {item.name || item.productName}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Quantity: {item.quantity} {item.unit || "kg"}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Unit Price: {formatPrice(item.price)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <div className="flex flex-wrap gap-3">
                        {getOrderActions(order)}
                        <Link
                          href={`/farmer-orders/${order._id}`}
                          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
                        >
                          <i className="fas fa-eye mr-1"></i>
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <nav aria-label="Pagination">
                <ul className="inline-flex items-center -space-x-px text-gray-600 dark:text-gray-300">
                  <li>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => (
                    <li key={index}>
                      <button
                        onClick={() => setCurrentPage(index + 1)}
                        className={`px-3 py-2 leading-tight border ${
                          currentPage === index + 1
                            ? "text-white bg-green-600 border-green-600 hover:bg-green-700"
                            : "text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                        }`}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
