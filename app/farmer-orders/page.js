"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function FarmerOrders() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const ordersPerPage = 10;

  // Memoize the filterOrders function to prevent infinite re-renders
  const filterOrders = useCallback(() => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== "All Orders") {
      filtered = filtered.filter(
        (order) => order.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Apply search filter
    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, "i");
      filtered = filtered.filter((order) => {
        const orderItemsMatch = order.items?.some(
          (item) =>
            searchRegex.test(item.name) || searchRegex.test(item.productName),
        );
        const customerMatch =
          searchRegex.test(order.customerName) ||
          searchRegex.test(order.customerEmail);
        const orderIdMatch = searchRegex.test(order._id);

        return orderItemsMatch || customerMatch || orderIdMatch;
      });
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, statusFilter, searchTerm]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const fetchOrders = useCallback(async () => {
    if (!session?.user) return;

    try {
      const userId = session.user.userId || session.user.id || session.user._id;
      const userEmail = session.user.email;

      // Fetch orders for this farmer using farmerId and farmerEmail parameters
      const params = new URLSearchParams();
      if (userId) params.append("farmerId", userId);
      if (userEmail) params.append("farmerEmail", userEmail);

      console.log("Farmer orders page - fetching with params:", {
        farmerId: userId,
        farmerEmail: userEmail,
        url: `/api/orders?${params.toString()}`,
      });

      const response = await fetch(`/api/orders?${params.toString()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Farmer orders API response:", data);
        console.log("Farmer orders fetched:", data.orders?.length || 0);
        console.log("Sample orders:", data.orders?.slice(0, 2));

        // Log the structure of orders to see what data we have
        if (data.orders && data.orders.length > 0) {
          console.log("First order structure:", {
            _id: data.orders[0]._id,
            customerName: data.orders[0].customerName,
            customerEmail: data.orders[0].customerEmail,
            status: data.orders[0].status,
            items: data.orders[0].items?.length || 0,
            farmerIds: data.orders[0].farmerIds,
            farmerEmails: data.orders[0].farmerEmails,
            createdAt: data.orders[0].createdAt,
          });
        }

        setOrders(data.orders || []);
      } else {
        console.error("Failed to fetch orders");
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    // More descriptive confirmation messages based on status transition
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
      const updateData = {
        status: newStatus,
        statusHistory: {
          status: newStatus,
          timestamp: new Date().toISOString(),
          updatedBy: session.user.email || session.user.name,
        },
      };

      // Add estimated delivery date for shipped status
      if (newStatus === "shipped") {
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 3); // 3 days from ship date
        updateData.estimatedDeliveryDate = estimatedDelivery.toISOString();
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  status: newStatus,
                  estimatedDeliveryDate:
                    updateData.estimatedDeliveryDate ||
                    order.estimatedDeliveryDate,
                  statusHistory: [
                    ...(Array.isArray(order.statusHistory)
                      ? order.statusHistory
                      : []),
                    updateData.statusHistory,
                  ],
                }
              : order,
          ),
        );

        // More specific success messages
        const successMessages = {
          confirmed: "Order confirmed! Customer has been notified.",
          shipped:
            "Order marked as shipped! Customer has been notified with tracking information.",
          delivered:
            "Order completed! Customer has been notified of successful delivery.",
          cancelled: "Order cancelled. Customer has been notified.",
        };

        alert(
          successMessages[newStatus] ||
            `Order status updated to ${newStatus} successfully!`,
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert(`Failed to update order status: ${error.message}`);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

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
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-green-600 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your orders...
          </p>
        </div>
      </div>
    );
  }

  const orderSummary = getOrderSummary();

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="text-gray-500 hover:text-green-600">
                  Home
                </Link>
              </li>
              <li>
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
              </li>
              <li>
                <Link
                  href="/manage"
                  className="text-gray-500 hover:text-green-600"
                >
                  Manage
                </Link>
              </li>
              <li>
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
              </li>
              <li className="text-gray-900 dark:text-white">
                Order Management
              </li>
            </ol>
          </nav>
        </div>

        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Order Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage and track all orders for your products
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
              >
                <i
                  className={`fas fa-sync-alt mr-2 ${refreshing ? "fa-spin" : ""}`}
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

          {/* Order Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <i className="fas fa-shopping-cart text-gray-600 dark:text-gray-300"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {orderSummary.total}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <i className="fas fa-clock text-yellow-600 dark:text-yellow-300"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {orderSummary.pending}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <i className="fas fa-check text-blue-600 dark:text-blue-300"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Confirmed
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {orderSummary.confirmed}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <i className="fas fa-truck text-purple-600 dark:text-purple-300"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Shipped
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {orderSummary.shipped}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <i className="fas fa-check-circle text-green-600 dark:text-green-300"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Delivered
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {orderSummary.delivered}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <i className="fas fa-times-circle text-red-600 dark:text-red-300"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Cancelled
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {orderSummary.cancelled}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Search Orders
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by customer name, email, or order ID..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
              </div>
              <div>
                <label
                  htmlFor="status-filter"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={handleStatusChange}
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
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All Orders");
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {currentOrders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <i className="fas fa-shopping-bag text-6xl text-gray-400 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No orders found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {statusFilter === "All Orders"
                  ? "You haven't received any orders yet."
                  : `No ${statusFilter.toLowerCase()} orders found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                      <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
