"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function Bookings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Orders");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      fetchOrders();
    }
  }, [session, status, router]);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const userId =
        session.user.userId ||
        session.user.id ||
        session.user._id ||
        session.user.email;

      // Check for userType or role in session to determine farmer vs customer
      const userRole = session.user.userType || session.user.role || "customer";

      console.log("Debug - User session:", session.user);
      console.log("Debug - User role/userType:", userRole);
      console.log("Debug - User ID:", userId);

      let apiUrl;

      if (userRole === "farmer") {
        // For farmers, fetch orders placed by customers to this farmer
        const farmerId =
          session.user.userId || session.user.id || session.user._id;
        const farmerEmail = session.user.email;

        console.log("Debug - Farmer ID:", farmerId);
        console.log("Debug - Farmer Email:", farmerEmail);

        if (farmerId) {
          apiUrl = `/api/orders?farmerId=${encodeURIComponent(farmerId)}`;
        } else if (farmerEmail) {
          apiUrl = `/api/orders?farmerEmail=${encodeURIComponent(farmerEmail)}`;
        } else {
          console.error("No farmer ID or email found");
          setOrders([]);
          setLoading(false);
          return;
        }
      } else {
        // For customers, fetch their own orders
        apiUrl = `/api/orders?userId=${encodeURIComponent(userId)}`;
      }

      console.log("Debug - API URL:", apiUrl);

      const response = await fetch(apiUrl);

      console.log("Debug - Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Debug - Orders data:", data);
        setOrders(data.orders || []);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch orders:", response.status, errorText);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (statusFilter === "All Orders") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(
        orders.filter(
          (order) => order.status.toLowerCase() === statusFilter.toLowerCase(),
        ),
      );
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (response.ok) {
        alert("Order cancelled successfully");
        fetchOrders(); // Refresh orders
      } else {
        alert("Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Error cancelling order");
    }
  };

  const handleReorder = (order) => {
    // Redirect to products page with order items for reordering
    router.push("/products");
  };

  const formatPrice = (price) => {
    const numericPrice =
      typeof price === "number" ? price : parseFloat(price) || 0;
    return `৳${numericPrice.toFixed(0)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: {
        bg: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: "fas fa-check",
      },
      pending: {
        bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        icon: "fas fa-clock",
      },
      delivered: {
        bg: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: "fas fa-check-circle",
      },
      cancelled: {
        bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: "fas fa-times-circle",
      },
      shipped: {
        bg: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        icon: "fas fa-truck",
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

  const getStatusTimeline = (status, createdAt) => {
    const statuses = ["confirmed", "shipped", "delivered"];
    const currentIndex = statuses.indexOf(status?.toLowerCase());

    return (
      <div className="flex items-center space-x-4 text-sm">
        {statuses.map((statusItem, index) => {
          const isCompleted = index <= currentIndex;
          const isActive = index === currentIndex;

          return (
            <div key={statusItem} className="flex items-center">
              <div
                className={`flex items-center ${
                  isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400"
                }`}
              >
                <i
                  className={`${
                    isCompleted ? "fas fa-check-circle" : "fas fa-circle"
                  } mr-1`}
                ></i>
                <span className="capitalize">{statusItem}</span>
              </div>
              {index < statuses.length - 1 && (
                <div
                  className={`w-8 h-0.5 ml-4 ${
                    isCompleted
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                ></div>
              )}
            </div>
          );
        })}
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary-600 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Bookings Content */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="text-gray-500 hover:text-primary-600">
                  Home
                </Link>
              </li>
              <li>
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
              </li>
              <li className="text-gray-900 dark:text-white">My Orders</li>
            </ol>
          </nav>
        </div>

        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Orders
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track and manage your orders ({filteredOrders.length} orders)
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option>All Orders</option>
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Shipped</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>
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
                  ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                  : `No ${statusFilter.toLowerCase()} orders found.`}
              </p>
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
              >
                <i className="fas fa-shopping-cart mr-2"></i>
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {currentOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
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
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      {order.items?.slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4 mb-4"
                        >
                          <img
                            src={
                              item.image ||
                              "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=80&h=80&fit=crop"
                            }
                            alt={item.productName}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {item.productName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              By {item.farmerName || "Local Farmer"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Quantity: {item.quantity} •{" "}
                              {formatPrice(item.price)}/unit
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>

                    {/* Order Status Timeline */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Order Status
                      </h4>
                      {getStatusTimeline(order.status, order.createdAt)}
                      {order.status === "pending" && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Waiting for farmer confirmation
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 flex flex-wrap gap-3">
                      {order.status === "delivered" && (
                        <>
                          <button className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition">
                            <i className="fas fa-download mr-2"></i>
                            Download Receipt
                          </button>
                          <Link
                            href={`/review?orderId=${order._id}`}
                            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition"
                          >
                            <i className="fas fa-star mr-2"></i>
                            Write Review
                          </Link>
                          <button
                            onClick={() => handleReorder(order)}
                            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition"
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
                          className="flex items-center px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg font-medium transition"
                        >
                          <i className="fas fa-times mr-2"></i>
                          Cancel Order
                        </button>
                      )}
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
                            ? "text-white bg-primary-600 border-primary-600 hover:bg-primary-700"
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
