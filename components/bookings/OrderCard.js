import React from "react";
import { formatPrice, formatDate, getStatusBadge } from "./helpers";

const PROGRESS_STEPS = [
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

const colorClasses = {
  yellow: {
    base: "bg-yellow-100 border-yellow-500 text-yellow-600",
    active: "bg-yellow-50 border-yellow-300 text-yellow-500",
  },
  blue: {
    base: "bg-blue-100 border-blue-500 text-blue-600",
    active: "bg-blue-50 border-blue-300 text-blue-500",
  },
  purple: {
    base: "bg-purple-100 border-purple-500 text-purple-600",
    active: "bg-purple-50 border-purple-300 text-purple-500",
  },
  green: {
    base: "bg-green-100 border-green-500 text-green-600",
    active: "bg-green-50 border-green-300 text-green-500",
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
  const currentIndex = PROGRESS_STEPS.findIndex(
    (s) => s.status === order.status?.toLowerCase(),
  );
  const cancelled = order.status?.toLowerCase() === "cancelled";

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
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {`${currentIndex + 1}/${PROGRESS_STEPS.length}`}
                </span>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  {PROGRESS_STEPS.map((step, i) => {
                    const isCompleted = i <= currentIndex;
                    const isActive = i === currentIndex;
                    const palette = colorClasses[step.color];
                    return (
                      <div
                        key={step.status}
                        className="flex flex-col items-center relative z-10"
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${cancelled ? "bg-red-100 border-red-300 text-red-600" : isCompleted ? palette.base : isActive ? palette.active + " animate-pulse" : "bg-gray-100 border-gray-300 text-gray-400"}`}
                        >
                          <i
                            className={`${cancelled ? "fas fa-times" : step.icon} text-lg`}
                          />
                        </div>
                        <span
                          className={`mt-2 text-xs font-medium text-center ${cancelled ? "text-red-600" : isCompleted ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
                        >
                          {cancelled && i === currentIndex
                            ? "Cancelled"
                            : step.label}
                        </span>
                        {isCompleted && !cancelled && (
                          <span className="text-xs text-gray-400 mt-1">
                            {i === 0
                              ? new Date(order.createdAt).toLocaleDateString()
                              : "TBD"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-600 -z-0">
                  <div
                    className={`h-full transition-all duration-700 ease-out ${cancelled ? "bg-red-400" : "bg-gradient-to-r from-yellow-400 via-blue-400 via-purple-400 to-green-400"}`}
                    style={{
                      width: cancelled
                        ? "25%"
                        : `${((currentIndex + 1) / PROGRESS_STEPS.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
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
