import React from "react";
import { formatPrice } from "./helpers";
import { getStatusBadge } from "./helpers";

export default function OrderDetailsModal({
  order,
  onClose,
  onDownloadReceipt,
}) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <i className="fas fa-receipt text-2xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">Order Details</h3>
                <div className="flex items-center space-x-4 text-blue-100 text-sm">
                  <span className="flex items-center">
                    <i className="fas fa-hashtag mr-1" />
                    {order._id?.slice(-8)?.toUpperCase()}
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-calendar mr-1" />
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                {getStatusBadge(order.status)}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <i className="fas fa-times text-xl" />
              </button>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-190px)]">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Summary Column */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
                    <i className="fas fa-chart-pie text-blue-600 dark:text-blue-300" />
                  </div>
                  Order Summary
                </h4>
                <div className="space-y-4 text-sm">
                  <SummaryRow
                    icon="fa-box"
                    label="Items"
                    value={`${order.items?.length || 0} items`}
                  />
                  <SummaryRow
                    icon="fa-credit-card"
                    label="Payment"
                    value={order.paymentMethod || "Cash on Delivery"}
                  />
                  <div className="pt-4 border-t border-blue-200 dark:border-blue-800 flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
              {order.deliveryAddress && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg mr-3">
                      <i className="fas fa-map-marker-alt text-green-600 dark:text-green-300" />
                    </div>
                    Delivery Address
                  </h4>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3 text-sm">
                    <AddressRow
                      icon="fa-user"
                      title={order.deliveryAddress.name}
                      subtitle="Recipient"
                    />
                    <AddressRow
                      icon="fa-home"
                      title={order.deliveryAddress.address}
                      subtitle={order.deliveryAddress.city}
                    />
                    <AddressRow
                      icon="fa-phone"
                      title={order.deliveryAddress.phone}
                      subtitle="Contact"
                    />
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg mr-3">
                    <i className="fas fa-clock text-purple-600 dark:text-purple-300" />
                  </div>
                  Order Timeline
                </h4>
                <div className="space-y-4 text-sm">
                  {TIMELINE_STEPS.map((s, i) => {
                    const activeIdx = STEP_ORDER.indexOf(order.status);
                    const isActive = activeIdx >= i;
                    const isCurrent = STEP_ORDER[i] === order.status;
                    return (
                      <div
                        key={s.status}
                        className="flex items-center space-x-4"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? (isCurrent ? "bg-purple-500 text-white shadow-lg scale-110" : "bg-green-500 text-white") : "bg-gray-200 dark:bg-gray-700 text-gray-400"}`}
                        >
                          <i
                            className={`fas ${s.icon} ${isCurrent ? "animate-pulse" : ""}`}
                          />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-medium ${isActive ? "text-gray-900 dark:text-white" : "text-gray-400"}`}
                          >
                            {s.label}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              Current Status
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Items Column */}
            <div className="xl:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg mr-3">
                      <i className="fas fa-shopping-bag text-orange-600 dark:text-orange-300" />
                    </div>
                    Items Ordered ({order.items?.length})
                  </h4>
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {order.items?.map((item, i) => (
                    <div
                      key={i}
                      className="group bg-gray-50 dark:bg-gray-700 rounded-2xl p-5 hover:shadow-lg transition-all border border-gray-100 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={
                              item.image ||
                              item.productImage ||
                              item.product?.image ||
                              item.product?.images?.[0] ||
                              "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=80&h=80&fit=crop"
                            }
                            alt={item.productName}
                            className="w-20 h-20 rounded-xl object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                            {item.productName}
                          </h5>
                          <div className="flex items-center space-x-2 mb-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <i className="fas fa-user-circle text-green-500 mr-1" />
                              {item.farmerName || "Local Farmer"}
                            </span>
                            {item.category && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <i className="fas fa-tag mr-1 text-green-500" />
                              {formatPrice(item.price)}/unit
                            </span>
                            <span className="flex items-center">
                              <i className="fas fa-weight mr-1 text-blue-500" />
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Total
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2 text-sm">
                      <i className="fas fa-receipt text-blue-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Order Total
                      </span>
                    </div>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            <i className="fas fa-info-circle text-blue-500 mr-2" />
            Need help with your order? Contact support.
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium"
            >
              <i className="fas fa-times mr-2" />
              Close
            </button>
            {order.status === "delivered" && (
              <button
                onClick={() => onDownloadReceipt(order)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg"
              >
                <i className="fas fa-download mr-2" />
                Download Receipt
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium"
            >
              <i className="fas fa-print mr-2" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SummaryRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl">
    <span className="text-gray-600 dark:text-gray-400 flex items-center">
      <i className={`fas ${icon} text-blue-500 mr-2`} />
      {label}
    </span>
    <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
  </div>
);

const AddressRow = ({ icon, title, subtitle }) => (
  <div className="flex items-start space-x-3">
    <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
      <i className={`fas ${icon} text-green-600 dark:text-green-300`} />
    </div>
    <div>
      <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
    </div>
  </div>
);

const TIMELINE_STEPS = [
  { status: "pending", label: "Order Placed", icon: "fa-plus-circle" },
  { status: "confirmed", label: "Order Confirmed", icon: "fa-check-circle" },
  { status: "shipped", label: "Order Shipped", icon: "fa-truck" },
  { status: "delivered", label: "Order Delivered", icon: "fa-home" },
];
const STEP_ORDER = ["pending", "confirmed", "shipped", "delivered"];
