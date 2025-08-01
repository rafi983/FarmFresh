// components/dashboard/tabs/OrdersTab.js
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

export default function OrdersTab({
  orders,
  handleRefresh,
  refreshing,
  formatPrice,
  formatDate,
}) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [hoveredOrder, setHoveredOrder] = useState(null);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(6);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Trigger animation on data change
  useEffect(() => {
    setAnimationTrigger((prev) => prev + 1);
  }, [orders]);

  // Calculate advanced order stats
  const orderStats = useMemo(() => {
    const pendingOrders = orders.filter((o) => o.status === "pending");
    const processingOrders = orders.filter((o) => o.status === "processing");
    const shippedOrders = orders.filter((o) => o.status === "shipped");
    const completedOrders = orders.filter((o) => o.status === "delivered");
    const cancelledOrders = orders.filter((o) => o.status === "cancelled");

    const totalRevenue = orders
      .filter((o) => o.status === "delivered")
      .reduce(
        (sum, order) => sum + (order.farmerSubtotal || order.total || 0),
        0,
      );

    const avgOrderValue =
      completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    const todayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt).toDateString();
      const today = new Date().toDateString();
      return orderDate === today;
    });

    return {
      total: orders.length,
      pending: pendingOrders.length,
      processing: processingOrders.length,
      shipped: shippedOrders.length,
      completed: completedOrders.length,
      cancelled: cancelledOrders.length,
      totalRevenue,
      avgOrderValue,
      todayOrders: todayOrders.length,
      completionRate:
        orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0,
    };
  }, [orders]);

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders;

    // Apply status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter((order) => order.status === selectedFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items?.some((item) =>
            item.product?.name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()),
          ),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "highest":
          return (
            (b.farmerSubtotal || b.total || 0) -
            (a.farmerSubtotal || a.total || 0)
          );
        case "lowest":
          return (
            (a.farmerSubtotal || a.total || 0) -
            (b.farmerSubtotal || b.total || 0)
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, selectedFilter, searchTerm, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedOrders.length / ordersPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchTerm, sortBy]);

  // Get current orders based on pagination
  const currentOrders = useMemo(() => {
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    return filteredAndSortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  }, [filteredAndSortedOrders, currentPage, ordersPerPage]);

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: "from-yellow-400 to-orange-500",
        bgGradient:
          "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20",
        icon: "fas fa-clock",
        pulse: true,
        text: "Pending",
        ring: "ring-yellow-200 dark:ring-yellow-800",
      },
      processing: {
        color: "from-blue-400 to-indigo-500",
        bgGradient:
          "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
        icon: "fas fa-cog fa-spin",
        pulse: false,
        text: "Processing",
        ring: "ring-blue-200 dark:ring-blue-800",
      },
      shipped: {
        color: "from-purple-400 to-pink-500",
        bgGradient:
          "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
        icon: "fas fa-shipping-fast",
        pulse: false,
        text: "Shipped",
        ring: "ring-purple-200 dark:ring-purple-800",
      },
      delivered: {
        color: "from-green-400 to-emerald-500",
        bgGradient:
          "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
        icon: "fas fa-check-circle",
        pulse: false,
        text: "Delivered",
        ring: "ring-green-200 dark:ring-green-800",
      },
      cancelled: {
        color: "from-red-400 to-pink-500",
        bgGradient:
          "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
        icon: "fas fa-times-circle",
        pulse: false,
        text: "Cancelled",
        ring: "ring-red-200 dark:ring-red-800",
      },
    };
    return configs[status] || configs.pending;
  };

  const OrderCard = ({ order, index }) => {
    const config = getStatusConfig(order.status);
    const isHovered = hoveredOrder === order._id;
    const isExpanded = expandedOrder === order._id;

    // Customer info extraction (assuming order has customer data)
    const customerName =
      order.customerName || order.userId?.split("@")[0] || "Customer";

    // Timeline data based on order status
    const timeline = useMemo(() => {
      const steps = [
        { status: "pending", date: order.createdAt, label: "Order Placed" },
        {
          status: "processing",
          date: order.processingDate,
          label: "Processing",
        },
        { status: "shipped", date: order.shippedDate, label: "Shipped" },
        { status: "delivered", date: order.deliveredDate, label: "Delivered" },
      ];

      // Filter steps based on current order status progression
      const statusOrder = ["pending", "processing", "shipped", "delivered"];
      const currentStatusIndex = statusOrder.indexOf(order.status);

      if (currentStatusIndex === -1 || order.status === "cancelled") {
        return [];
      }

      return steps.filter((step, i) => i <= currentStatusIndex && step.date);
    }, [order]);

    // Calculate delivery estimate
    const deliveryEstimate = order.estimatedDelivery
      ? formatDate(order.estimatedDelivery)
      : order.status === "shipped"
        ? "Expected in 2-3 days"
        : null;

    return (
      <div
        className={`group relative transform transition-all duration-500 ${
          isExpanded
            ? "col-span-full md:col-span-2 lg:col-span-2 scale-100"
            : "hover:scale-105"
        } ${isHovered || isExpanded ? "z-10" : ""}`}
        style={{
          animationDelay: `${index * 100}ms`,
        }}
        onMouseEnter={() => setHoveredOrder(order._id)}
        onMouseLeave={() => setHoveredOrder(null)}
      >
        {/* Glassmorphism background */}
        <div
          className={`
            relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl 
            rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20
            hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10
            transition-all duration-300 overflow-hidden
            ${isHovered || isExpanded ? "ring-2 " + config.ring : ""}
            ${isExpanded ? "min-height-64" : ""}
          `}
          onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
        >
          {/* Animated background gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-50 transition-opacity duration-300 ${isHovered || isExpanded ? "opacity-70" : ""}`}
          ></div>

          {/* Status indicator */}
          <div
            className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${config.color} rounded-bl-3xl flex items-center justify-center`}
          >
            <i
              className={`${config.icon} text-white text-lg ${config.pulse ? "animate-pulse" : ""}`}
            ></i>
          </div>

          {/* Content */}
          <div className={`relative p-6 space-y-4 ${isExpanded ? "pb-8" : ""}`}>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    Order #{order._id.slice(-8)}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedOrder(isExpanded ? null : order._id);
                    }}
                    className="p-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <i
                      className={`fas ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-xs text-gray-600 dark:text-gray-400`}
                    ></i>
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <i className="fas fa-calendar-alt mr-1 text-xs"></i>
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${config.color} text-white shadow-lg`}
              >
                {config.text}
              </div>
            </div>

            {/* Customer info - visible in both collapsed and expanded view */}
            <div className="flex items-center space-x-2 bg-white/40 dark:bg-gray-700/40 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {customerName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {order.shippingAddress ? (
                    <span className="flex items-center">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {order.shippingAddress.city || "Location unknown"}
                    </span>
                  ) : (
                    "No shipping information"
                  )}
                </p>
              </div>
            </div>

            {/* Order items preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Items ({order.items?.length || 0})
              </p>
              <div className="flex flex-wrap gap-2">
                {order.items?.slice(0, isExpanded ? 6 : 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 bg-white/60 dark:bg-gray-700/60 rounded-lg px-3 py-1 backdrop-blur-sm"
                  >
                    {item.product?.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-20">
                      {item.product?.name || "Product"}
                    </span>
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
                {!isExpanded && order.items?.length > 3 && (
                  <div
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedOrder(order._id);
                    }}
                  >
                    +{order.items.length - 3} more
                  </div>
                )}
              </div>
            </div>

            {/* Expanded view content */}
            {isExpanded && (
              <div className="space-y-6 animate-fadeIn">
                {/* Order Timeline */}
                {timeline.length > 0 && (
                  <div className="pt-4 border-t border-gray-200/50 dark:border-gray-600/50">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                      Order Timeline
                    </h4>
                    <div className="relative">
                      {/* Timeline Track */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                      {/* Timeline Events */}
                      {timeline.map((event, idx) => (
                        <div
                          key={event.status}
                          className="flex items-start mb-4 relative"
                        >
                          {/* Timeline Dot */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center z-10 bg-gradient-to-br ${
                              idx === timeline.length - 1
                                ? getStatusConfig(event.status).color
                                : "from-gray-400 to-gray-500"
                            } text-white`}
                          >
                            <i
                              className={`fas ${
                                event.status === "pending"
                                  ? "fa-clock"
                                  : event.status === "processing"
                                    ? "fa-cog"
                                    : event.status === "shipped"
                                      ? "fa-shipping-fast"
                                      : "fa-check"
                              } text-xs`}
                            ></i>
                          </div>

                          {/* Timeline Content */}
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {event.label}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {event.date
                                ? formatDate(event.date)
                                : "Date not available"}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Delivery Estimate */}
                      {deliveryEstimate && (
                        <div className="flex items-start relative">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center z-10 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 text-white border-2 border-white dark:border-gray-800">
                            <i className="fas fa-flag-checkered text-xs"></i>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Expected Delivery
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {deliveryEstimate}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Order Information */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Payment Method
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.paymentMethod || "Card Payment"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Transaction ID
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {order.transactionId || order._id.slice(-12)}
                    </p>
                  </div>
                  {order.notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Customer Notes
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200/50 dark:border-gray-600/50">
                  {order.status !== "delivered" &&
                    order.status !== "cancelled" && (
                      <>
                        <button className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-md transition-shadow flex items-center">
                          <i className="fas fa-arrow-right mr-1.5"></i>
                          Advance Status
                        </button>
                        <button className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:shadow-md transition-shadow flex items-center">
                          <i className="fas fa-edit mr-1.5"></i>
                          Edit Order
                        </button>
                      </>
                    )}
                  <button className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center">
                    <i className="fas fa-print mr-1.5"></i>
                    Print Details
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center">
                    <i className="fas fa-user mr-1.5"></i>
                    Contact Customer
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-600/50">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Amount
                </p>
                <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {formatPrice(order.farmerSubtotal || order.total || 0)}
                </p>
              </div>
              <div className="flex space-x-2">
                {!isExpanded && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedOrder(order._id);
                    }}
                    className="group/btn relative px-3 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-white rounded-xl font-medium overflow-hidden transition-all duration-300 hover:shadow-lg"
                  >
                    <span className="relative z-10 flex items-center text-sm">
                      <i className="fas fa-expand-alt mr-1.5"></i>
                      Details
                    </span>
                  </button>
                )}
                <Link
                  href={`/farmer-orders?orderId=${order._id}`}
                  className="group/btn relative px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="relative z-10 flex items-center">
                    <i className="fas fa-eye mr-2"></i>
                    View
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            </div>
          </div>

          {/* Hover effect overlay */}
          {isHovered && !isExpanded && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl pointer-events-none"></div>
          )}
        </div>
      </div>
    );
  };

  const statsData = [
    {
      title: "Total Orders",
      value: orderStats.total,
      icon: "fas fa-shopping-cart",
      gradient: "from-gray-500 to-gray-700",
      bgGradient:
        "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900",
    },
    {
      title: "Today's Orders",
      value: orderStats.todayOrders,
      icon: "fas fa-calendar-day",
      gradient: "from-blue-500 to-blue-700",
      bgGradient:
        "from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50",
    },
    {
      title: "Pending",
      value: orderStats.pending,
      icon: "fas fa-clock",
      gradient: "from-yellow-500 to-orange-600",
      bgGradient:
        "from-yellow-50 to-orange-100 dark:from-yellow-900/50 dark:to-orange-800/50",
      pulse: true,
    },
    {
      title: "Completed",
      value: orderStats.completed,
      icon: "fas fa-check-circle",
      gradient: "from-green-500 to-emerald-600",
      bgGradient:
        "from-green-50 to-emerald-100 dark:from-green-900/50 dark:to-emerald-800/50",
    },
    {
      title: "Success Rate",
      value: `${orderStats.completionRate.toFixed(1)}%`,
      icon: "fas fa-chart-line",
      gradient: "from-purple-500 to-indigo-600",
      bgGradient:
        "from-purple-50 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-800/50",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Header with Glassmorphism */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Order Management Hub
              </h1>
              <p className="text-blue-100 text-lg">
                Advanced order tracking and management system
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group relative px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl font-medium overflow-hidden transition-all duration-300 hover:bg-white/30 disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center">
                  <i
                    className={`fas fa-sync-alt mr-2 ${refreshing ? "fa-spin" : ""} group-hover:rotate-180 transition-transform duration-500`}
                  ></i>
                  Refresh Data
                </span>
              </button>
              <Link
                href="/farmer-orders"
                className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25"
              >
                <span className="relative z-10 flex items-center">
                  <i className="fas fa-external-link-alt mr-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                  Full Management
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {statsData.map((stat, index) => (
          <div
            key={stat.title}
            className={`group relative bg-gradient-to-br ${stat.bgGradient} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/20 dark:border-gray-700/20`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-4 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <i
                    className={`${stat.icon} text-white text-xl ${stat.pulse ? "animate-pulse" : ""}`}
                  ></i>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search orders, products, or customer IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-gray-700/60 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 dark:bg-gray-700/60 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 dark:bg-gray-700/60 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Value</option>
              <option value="lowest">Lowest Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="min-h-96">
        {filteredAndSortedOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                <i className="fas fa-shopping-bag text-6xl text-gray-400 animate-bounce"></i>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full animate-ping"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {orders.length === 0 ? "No orders yet" : "No matching orders"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {orders.length === 0
                ? "You haven't received any orders yet. Once customers place orders, they'll appear here in real-time."
                : "Try adjusting your filters or search terms to find the orders you're looking for."}
            </p>
            {orders.length === 0 && (
              <Link
                href="/create"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300"
              >
                <i className="fas fa-plus mr-3 group-hover:rotate-180 transition-transform duration-300"></i>
                Add More Products
              </Link>
            )}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slideUp"
            key={animationTrigger}
          >
            {currentOrders.map((order, index) => (
              <OrderCard key={order._id} order={order} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 mb-4">
          <div className="flex items-center gap-2 px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {/* Always show first page */}
              {currentPage > 2 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    1
                  </button>
                  {currentPage > 3 && (
                    <span className="text-gray-500 px-1">...</span>
                  )}
                </>
              )}

              {/* Current page and surrounding pages */}
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                // Calculate page numbers to show around current page
                let pageNum;
                if (totalPages <= 3) {
                  // If total pages <= 3, show all pages
                  pageNum = i + 1;
                } else if (currentPage === 1) {
                  // If on first page, show first 3 pages
                  pageNum = i + 1;
                } else if (currentPage === totalPages) {
                  // If on last page, show last 3 pages
                  pageNum = totalPages - 2 + i;
                } else {
                  // Otherwise show current page and surrounding pages
                  pageNum = currentPage - 1 + i;
                }

                // Only render if page number is valid
                if (pageNum > 0 && pageNum <= totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        currentPage === pageNum
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-md"
                          : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}

              {/* Always show last page */}
              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && (
                    <span className="text-gray-500 px-1">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Add these custom animations to your global CSS
const customStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(180deg); }
}

.animate-fadeIn {
  animation: fadeIn 0.8s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.6s ease-out;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}
`;
