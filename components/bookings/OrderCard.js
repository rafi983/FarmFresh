import React, { useCallback, useMemo } from "react";
import { formatPrice, formatDate, getStatusBadge } from "./helpers";

const PROGRESS_STEPS = [
  {
    status: "pending",
    icon: "fas fa-clock",
    label: "Order Placed",
    color: "yellow",
    description: "Your order has been received",
  },
  {
    status: "confirmed",
    icon: "fas fa-check",
    label: "Confirmed",
    color: "blue",
    description: "Farmer has confirmed your order",
  },
  {
    status: "shipped",
    icon: "fas fa-truck",
    label: "Shipped",
    color: "purple",
    description: "Your order is on the way",
  },
  {
    status: "delivered",
    icon: "fas fa-check-circle",
    label: "Delivered",
    color: "green",
    description: "Order successfully delivered",
  },
];

const STATUS_RANK = { pending: 0, confirmed: 1, shipped: 2, delivered: 3 };

const colorClasses = {
  yellow: {
    base: "bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-400 text-yellow-700 shadow-yellow-200/50",
    active:
      "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 text-yellow-600 shadow-yellow-100/50",
    glow: "shadow-yellow-400/30",
    progress: "from-yellow-300 to-yellow-500",
  },
  blue: {
    base: "bg-gradient-to-br from-blue-100 to-blue-200 border-blue-400 text-blue-700 shadow-blue-200/50",
    active:
      "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 text-blue-600 shadow-blue-100/50",
    glow: "shadow-blue-400/30",
    progress: "from-blue-300 to-blue-500",
  },
  purple: {
    base: "bg-gradient-to-br from-purple-100 to-purple-200 border-purple-400 text-purple-700 shadow-purple-200/50",
    active:
      "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 text-purple-600 shadow-purple-100/50",
    glow: "shadow-purple-400/30",
    progress: "from-purple-300 to-purple-500",
  },
  green: {
    base: "bg-gradient-to-br from-green-100 to-green-200 border-green-400 text-green-700 shadow-green-200/50",
    active:
      "bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-600 shadow-green-100/50",
    glow: "shadow-green-400/30",
    progress: "from-green-300 to-green-500",
  },
};

export default function OrderCard({
  order,
  index,
  setSelectedOrder,
  setShowOrderDetails,
  handleDownloadReceipt,
  handleReorder,
  handleCancelOrder,
}) {
  // Calculate progress index based on order status
  let currentIndex;
  let progressPercentage;

  const currentIndexRaw = PROGRESS_STEPS.findIndex(
    (s) => s.status === order.status?.toLowerCase(),
  );

  // For non-mixed orders, use the original logic
  currentIndex = currentIndexRaw >= 0 ? currentIndexRaw : 0;
  progressPercentage = ((currentIndex + 1) / PROGRESS_STEPS.length) * 100;

  const cancelled = order.status?.toLowerCase() === "cancelled";

  // Extract farmer data for mixed orders
  const farmerData = [];
  if (order.status === "mixed" && order.farmerStatuses && order.items) {
    // Helper function to encode farmer email keys (same as API)
    const encodeFarmerKey = (email = "") => {
      return email.replace(/\./g, "(dot)");
    };

    // Group items by farmer
    const farmerGroups = {};
    order.items.forEach((item) => {
      const farmerEmail = item.farmerEmail || item.farmer?.email;
      const farmerName = item.farmerName || item.farmer?.name || farmerEmail;
      if (farmerEmail) {
        if (!farmerGroups[farmerEmail]) {
          // Try both encoded and non-encoded keys to find the status
          const encodedKey = encodeFarmerKey(farmerEmail);
          const status =
            order.farmerStatuses[encodedKey] ||
            order.farmerStatuses[farmerEmail] ||
            "pending";

          farmerGroups[farmerEmail] = {
            email: farmerEmail,
            name: farmerName,
            items: [],
            status: status,
          };
        }
        farmerGroups[farmerEmail].items.push(item);
      }
    });

    // Convert to array for rendering
    Object.values(farmerGroups).forEach((farmer) => {
      const statusIndex = PROGRESS_STEPS.findIndex(
        (s) => s.status === farmer.status,
      );
      farmerData.push({
        ...farmer,
        statusIndex: statusIndex >= 0 ? statusIndex : 0,
        progressPercentage:
          ((statusIndex >= 0 ? statusIndex + 1 : 1) / PROGRESS_STEPS.length) *
          100,
      });
    });

    console.log("🎯 [ORDER CARD] Individual farmer progress:", {
      orderId: order._id?.slice(-8),
      farmerStatuses: order.farmerStatuses,
      farmerData,
    });
  }

  // Helper function to check if there are any delivered items (for customer reorder functionality)
  const hasDeliveredItems = useMemo(() => {
    if (order.status === "delivered") return true;
    if (order.status === "mixed" && farmerData.length > 0) {
      // For mixed orders, check if ANY farmer has delivered items
      return farmerData.some((farmer) => farmer.status === "delivered");
    }
    return false;
  }, [order.status, farmerData]);

  // Helper function to get delivered items for customer reorder
  const getDeliveredItems = useCallback(() => {
    if (order.status === "delivered") {
      return order.items || [];
    }
    if (order.status === "mixed" && farmerData.length > 0) {
      // For mixed orders, get items from farmers who have delivered
      const deliveredFarmers = farmerData.filter(
        (farmer) => farmer.status === "delivered",
      );
      return deliveredFarmers.flatMap((farmer) => farmer.items);
    }
    return [];
  }, [order.status, order.items, farmerData]);

  // Enhanced reorder handler for customer (delivered items only)
  const handleReorderDeliveredItems = useCallback(async () => {
    const deliveredItems = getDeliveredItems();
    if (deliveredItems.length === 0) {
      return;
    }

    // Create order data with only delivered items for reorder
    const reorderData = {
      ...order,
      items: deliveredItems,
      total: deliveredItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    };

    await handleReorder(reorderData);
  }, [order, getDeliveredItems, handleReorder]);

  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 p-6 border-b border-gray-200 dark:border-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Order #{order._id?.slice(-8)?.toUpperCase() || "N/A"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <i className="fas fa-calendar mr-2" />
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                  <i className="fas fa-route mr-2 text-blue-600" /> Order
                  Progress
                </h4>
                {order.status !== "mixed" && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {`${currentIndex + 1}/${PROGRESS_STEPS.length}`}
                  </span>
                )}
              </div>

              {/* Single progress bar for non-mixed orders */}
              {order.status !== "mixed" && (
                <div className="relative p-6">
                  {/* Enhanced Progress Track */}
                  <div className="relative">
                    {/* Background Track */}
                    <div className="absolute top-8 left-8 right-8 h-2 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200 dark:from-gray-600 dark:to-gray-600 rounded-full shadow-inner"></div>

                    {/* Animated Progress Bar */}
                    <div
                      className="absolute top-8 left-8 right-8 h-2 rounded-full overflow-hidden"
                      style={{ width: `calc(100% - 4rem)` }}
                    >
                      <div
                        className={`h-full transition-all duration-1000 ease-out rounded-full shadow-lg ${
                          cancelled
                            ? "bg-gradient-to-r from-red-400 to-red-600"
                            : "bg-gradient-to-r from-yellow-400 via-blue-500 via-purple-500 to-green-500"
                        }`}
                        style={{
                          width: cancelled ? "25%" : `${progressPercentage}%`,
                          boxShadow: cancelled
                            ? "0 0 20px rgba(239, 68, 68, 0.4)"
                            : "0 0 20px rgba(59, 130, 246, 0.4)",
                        }}
                      >
                        {/* Animated Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between relative">
                      {PROGRESS_STEPS.map((step, i) => {
                        const isCompleted = i <= currentIndex;
                        const isActive = i === currentIndex;
                        const isFuture = i > currentIndex;
                        const palette = colorClasses[step.color];

                        return (
                          <div
                            key={step.status}
                            className="flex flex-col items-center relative group cursor-pointer"
                            title={`${step.label}: ${step.description}`}
                          >
                            {/* Step Circle with Enhanced Design */}
                            <div
                              className={`relative w-16 h-16 rounded-full flex items-center justify-center border-3 transition-all duration-500 transform hover:scale-110 ${
                                cancelled && i === currentIndex
                                  ? "bg-gradient-to-br from-red-100 to-red-200 border-red-400 text-red-700 shadow-lg shadow-red-200/50"
                                  : isCompleted
                                    ? `${palette.base} shadow-lg ${palette.glow} border-3`
                                    : isActive
                                      ? `${palette.active} shadow-xl ${palette.glow} border-3 animate-pulse ring-4 ring-${step.color}-200/50`
                                      : "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 text-gray-400 shadow-md"
                              }`}
                              style={{
                                boxShadow:
                                  isActive && !cancelled
                                    ? `0 0 25px ${
                                        step.color === "yellow"
                                          ? "rgba(251, 191, 36, 0.5)"
                                          : step.color === "blue"
                                            ? "rgba(59, 130, 246, 0.5)"
                                            : step.color === "purple"
                                              ? "rgba(147, 51, 234, 0.5)"
                                              : "rgba(34, 197, 94, 0.5)"
                                      }`
                                    : undefined,
                              }}
                            >
                              {/* Icon */}
                              <i
                                className={`${
                                  cancelled && i === currentIndex
                                    ? "fas fa-times"
                                    : step.icon
                                } text-xl transition-transform duration-300 group-hover:scale-110`}
                              />

                              {/* Completion Checkmark Overlay */}
                              {isCompleted && !isActive && !cancelled && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                  <i className="fas fa-check text-white text-xs"></i>
                                </div>
                              )}

                              {/* Pulsing Ring for Active Step */}
                              {isActive && !cancelled && (
                                <div className="absolute inset-0 rounded-full border-2 border-current animate-ping opacity-30"></div>
                              )}
                            </div>

                            {/* Step Label */}
                            <div className="mt-3 text-center">
                              <span
                                className={`block text-sm font-semibold transition-colors duration-300 ${
                                  cancelled && i === currentIndex
                                    ? "text-red-600"
                                    : isCompleted
                                      ? "text-gray-900 dark:text-white"
                                      : isActive
                                        ? "text-gray-700 dark:text-gray-300"
                                        : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {cancelled && i === currentIndex
                                  ? "Cancelled"
                                  : step.label}
                              </span>

                              {/* Step Description */}
                              <span
                                className={`block text-xs mt-1 transition-colors duration-300 ${
                                  isCompleted || isActive
                                    ? "text-gray-600 dark:text-gray-400"
                                    : "text-gray-400 dark:text-gray-500"
                                }`}
                              >
                                {cancelled && i === currentIndex
                                  ? "Order was cancelled"
                                  : step.description}
                              </span>

                              {/* Timestamp */}
                              {isCompleted && !cancelled && (
                                <span className="block text-xs text-gray-400 mt-1">
                                  {i === 0
                                    ? new Date(
                                        order.createdAt,
                                      ).toLocaleDateString()
                                    : "TBD"}
                                </span>
                              )}
                            </div>

                            {/* Tooltip on Hover */}
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                              <div className="text-center">
                                <div className="font-semibold">
                                  {step.label}
                                </div>
                                <div className="text-gray-300">
                                  {step.description}
                                </div>
                              </div>
                              {/* Tooltip Arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Individual farmer progress bars for mixed orders */}
              {order.status === "mixed" && farmerData.length > 0 && (
                <div className="space-y-6">
                  {farmerData.map((farmer, farmerIndex) => (
                    <div
                      key={farmer.email}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {/* Farmer Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ring-4 ring-blue-100 dark:ring-blue-900">
                              {farmer.name?.charAt(0)?.toUpperCase() || "F"}
                            </div>
                            {/* Status indicator dot */}
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                                farmer.status === "pending"
                                  ? "bg-yellow-400"
                                  : farmer.status === "confirmed"
                                    ? "bg-blue-500"
                                    : farmer.status === "shipped"
                                      ? "bg-purple-500"
                                      : farmer.status === "delivered"
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                              }`}
                            ></div>
                          </div>
                          <div>
                            <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                              {farmer.name}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                              <i className="fas fa-box mr-1"></i>
                              {farmer.items.length} item
                              {farmer.items.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-bold shadow-lg ${
                              farmer.status === "pending"
                                ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300 shadow-yellow-200/50"
                                : farmer.status === "confirmed"
                                  ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-blue-200/50"
                                  : farmer.status === "shipped"
                                    ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300 shadow-purple-200/50"
                                    : farmer.status === "delivered"
                                      ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300 shadow-green-200/50"
                                      : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300"
                            }`}
                          >
                            <i
                              className={`${
                                farmer.status === "pending"
                                  ? "fas fa-clock"
                                  : farmer.status === "confirmed"
                                    ? "fas fa-check"
                                    : farmer.status === "shipped"
                                      ? "fas fa-truck"
                                      : farmer.status === "delivered"
                                        ? "fas fa-check-circle"
                                        : "fas fa-question"
                              } mr-2`}
                            ></i>
                            {farmer.status?.charAt(0).toUpperCase() +
                              farmer.status?.slice(1)}
                          </span>
                          <div className="text-right">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">
                              Progress
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {farmer.statusIndex + 1}/{PROGRESS_STEPS.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Farmer Progress Bar */}
                      <div className="relative p-4">
                        {/* Background Track */}
                        <div className="absolute top-6 left-6 right-6 h-1.5 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200 dark:from-gray-600 dark:to-gray-600 rounded-full shadow-inner"></div>

                        {/* Animated Progress Bar */}
                        <div
                          className="absolute top-6 left-6 right-6 h-1.5 rounded-full overflow-hidden"
                          style={{ width: `calc(100% - 3rem)` }}
                        >
                          <div
                            className="h-full transition-all duration-1000 ease-out rounded-full shadow-lg bg-gradient-to-r from-yellow-400 via-blue-500 via-purple-500 to-green-500"
                            style={{
                              width: `${farmer.progressPercentage}%`,
                              boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)",
                            }}
                          >
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                          </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex items-center justify-between relative">
                          {PROGRESS_STEPS.map((step, i) => {
                            const isCompleted = i <= farmer.statusIndex;
                            const isActive = i === farmer.statusIndex;
                            const palette = colorClasses[step.color];

                            return (
                              <div
                                key={`${farmer.email}-${step.status}`}
                                className="flex flex-col items-center relative group cursor-pointer"
                                title={`${step.label}: ${step.description}`}
                              >
                                {/* Enhanced Step Circle */}
                                <div
                                  className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 transform hover:scale-110 ${
                                    isCompleted
                                      ? `${palette.base} shadow-lg ${palette.glow}`
                                      : isActive
                                        ? `${palette.active} shadow-xl ${palette.glow} animate-pulse ring-4 ring-${step.color}-200/50`
                                        : "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 text-gray-400 shadow-md"
                                  }`}
                                  style={{
                                    boxShadow: isActive
                                      ? `0 0 20px ${
                                          step.color === "yellow"
                                            ? "rgba(251, 191, 36, 0.5)"
                                            : step.color === "blue"
                                              ? "rgba(59, 130, 246, 0.5)"
                                              : step.color === "purple"
                                                ? "rgba(147, 51, 234, 0.5)"
                                                : "rgba(34, 197, 94, 0.5)"
                                        }`
                                      : undefined,
                                  }}
                                >
                                  <i
                                    className={`${step.icon} text-lg transition-transform duration-300 group-hover:scale-110`}
                                  />

                                  {/* Completion Checkmark */}
                                  {isCompleted && !isActive && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                      <i className="fas fa-check text-white text-xs"></i>
                                    </div>
                                  )}

                                  {/* Pulsing Ring for Active */}
                                  {isActive && (
                                    <div className="absolute inset-0 rounded-full border-2 border-current animate-ping opacity-30"></div>
                                  )}
                                </div>

                                {/* Step Label */}
                                <div className="mt-2 text-center">
                                  <span
                                    className={`block text-xs font-semibold transition-colors duration-300 ${
                                      isCompleted
                                        ? "text-gray-900 dark:text-white"
                                        : isActive
                                          ? "text-gray-700 dark:text-gray-300"
                                          : "text-gray-500 dark:text-gray-400"
                                    }`}
                                  >
                                    {step.label}
                                  </span>

                                  {/* Step Description */}
                                  <span
                                    className={`block text-xs mt-1 transition-colors duration-300 max-w-[60px] truncate ${
                                      isCompleted || isActive
                                        ? "text-gray-600 dark:text-gray-400"
                                        : "text-gray-400 dark:text-gray-500"
                                    }`}
                                    title={step.description}
                                  >
                                    {step.description}
                                  </span>
                                </div>

                                {/* Enhanced Tooltip */}
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-20">
                                  <div className="text-center">
                                    <div className="font-semibold">
                                      {step.label}
                                    </div>
                                    <div className="text-gray-300">
                                      {step.description}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      Farmer: {farmer.name}
                                    </div>
                                  </div>
                                  {/* Tooltip Arrow */}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Farmer Items Preview */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Items from this farmer:
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(farmer.progressPercentage)}% complete
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {farmer.items.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                            >
                              {item.productName}
                            </span>
                          ))}
                          {farmer.items.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                              +{farmer.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {order.status === "pending" && (
                    <>
                      <i className="fas fa-hourglass-half mr-2 text-yellow-500" />
                      Waiting for farmer confirmation.
                    </>
                  )}
                  {order.status === "confirmed" && (
                    <>
                      <i className="fas fa-thumbs-up mr-2 text-blue-500" />
                      Order confirmed! Preparing items.
                    </>
                  )}
                  {order.status === "shipped" && (
                    <>
                      <i className="fas fa-shipping-fast mr-2 text-purple-500" />
                      Order is on the way!
                    </>
                  )}
                  {order.status === "delivered" && (
                    <>
                      <i className="fas fa-box-open mr-2 text-green-500" />
                      Delivered successfully.
                    </>
                  )}
                  {order.status === "cancelled" && (
                    <>
                      <i className="fas fa-ban mr-2 text-red-500" />
                      Order cancelled.
                    </>
                  )}
                  {order.status === "mixed" && (
                    <>
                      <i className="fas fa-layer-group mr-2 text-orange-500" />
                      Track each farmer's progress individually above.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i className="fas fa-box mr-2 text-blue-600" /> Order Items (
            {order.items?.length || 0})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {order.items?.slice(0, 8).map((item, i) => (
              <div
                key={i}
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
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {item.productName}
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                      <i className="fas fa-user-tie mr-1" />
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
                <i className="fas fa-plus mr-2" /> View {order.items.length - 8}{" "}
                more items
              </button>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <SummaryBox
                label="Items"
                value={order.items?.length || 0}
                color="blue"
              />
              <SummaryBox
                label="Subtotal"
                value={formatPrice(order.subtotal || order.total || 0)}
                color="green"
              />
              <SummaryBox
                label="Delivery"
                value={formatPrice(order.deliveryFee || 50)}
                color="purple"
              />
              <SummaryBox
                label="Total"
                value={formatPrice(order.total)}
                neutral
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setSelectedOrder(order);
                  setShowOrderDetails(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <i className="fas fa-eye mr-2" /> View Details
              </button>
              {order.status === "delivered" && (
                <>
                  <button
                    onClick={() => handleDownloadReceipt(order)}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg"
                  >
                    <i className="fas fa-download mr-2" /> Receipt
                  </button>
                  <a
                    href={`/review?orderId=${order._id}`}
                    className="flex items-center px-4 py-2 border border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900 rounded-lg font-medium transition-all duration-200"
                  >
                    <i className="fas fa-star mr-2" /> Review
                  </a>
                  <button
                    onClick={() => handleReorder(order)}
                    className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-all duration-200"
                  >
                    <i className="fas fa-redo mr-2" /> Reorder
                  </button>
                </>
              )}
              {(order.status === "pending" || order.status === "confirmed") && (
                <button
                  onClick={() => handleCancelOrder(order._id)}
                  className="flex items-center px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg font-medium transition-all duration-200"
                >
                  <i className="fas fa-times mr-2" /> Cancel Order
                </button>
              )}
              {order.status === "shipped" && (
                <button className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg">
                  <i className="fas fa-map-marker-alt mr-2" /> Track Order
                </button>
              )}
              {hasDeliveredItems && (
                <button
                  onClick={handleReorderDeliveredItems}
                  className="flex items-center px-4 py-2 border border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg font-medium transition-all duration-200"
                >
                  <i className="fas fa-redo mr-2" />
                  {order.status === "delivered"
                    ? "Reorder"
                    : "Reorder Delivered Items"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBox({ label, value, color, neutral }) {
  if (neutral) {
    return (
      <div className="text-center p-3 rounded-lg border bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
        <div className="text-lg font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
      </div>
    );
  }
  const colorStyles = {
    blue: {
      wrapper:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
      text: "text-blue-600 dark:text-blue-400",
    },
    green: {
      wrapper:
        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
      text: "text-green-600 dark:text-green-400",
    },
    purple: {
      wrapper:
        "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700",
      text: "text-purple-600 dark:text-purple-400",
    },
    yellow: {
      wrapper:
        "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
      text: "text-yellow-600 dark:text-yellow-400",
    },
  };
  const sty = colorStyles[color] || colorStyles.blue;
  return (
    <div className={`text-center p-3 rounded-lg border ${sty.wrapper}`}>
      <div className={`text-lg font-bold ${sty.text}`}>{value}</div>
      <div className={`text-xs ${sty.text}`}>{label}</div>
    </div>
  );
}
