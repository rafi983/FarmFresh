"use client";

import Image from "next/image";
import Link from "next/link";

export default function RecentOrdersSection({
  recentOrders,
  loadingOrders,
  product,
}) {
  return (
    <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/10 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-blue-800/30">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <i className="fas fa-shopping-cart text-white text-lg"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Orders
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Latest customer purchases
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
            Live Updates
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {loadingOrders ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-500 rounded-xl"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-500 rounded w-32"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-500 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-500 rounded w-20"></div>
                </div>
                <div className="h-16 bg-gray-300 dark:bg-gray-500 rounded-lg mb-3"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-300 dark:bg-gray-500 rounded w-20"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-500 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentOrders.length > 0 ? (
          recentOrders.map((order, orderIndex) => {
            // Calculate total amount with improved logic
            const orderItems = order.products || order.items || [];
            const calculatedTotal = orderItems.reduce((sum, item) => {
              const itemPrice = parseFloat(item.price || 0);
              const itemQuantity = parseInt(item.quantity || 1);
              return sum + itemPrice * itemQuantity;
            }, 0);

            const displayTotal =
              order.totalAmount || order.total || calculatedTotal;

            return (
              <div
                key={order._id}
                className="group relative bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/10 dark:to-purple-900/10 rounded-xl p-5 border border-blue-200/50 dark:border-blue-700/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Decorative elements */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60"></div>
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-40"></div>

                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl flex items-center justify-center shadow-sm">
                        <i className="fas fa-receipt text-blue-600 dark:text-blue-400 text-lg"></i>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {orderIndex + 1}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <i className="fas fa-user-circle text-gray-400 text-xs"></i>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                          {order.customerInfo?.name ||
                            order.customerName ||
                            order.userId ||
                            "Customer"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                        order.status === "completed"
                          ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900 dark:to-emerald-900 dark:text-green-300"
                          : order.status === "pending"
                            ? "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 dark:from-yellow-900 dark:to-orange-900 dark:text-orange-300"
                            : order.status === "processing"
                              ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900 dark:to-indigo-900 dark:text-blue-300"
                              : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 dark:from-gray-700 dark:to-slate-700 dark:text-gray-300"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          order.status === "completed"
                            ? "bg-green-400"
                            : order.status === "pending"
                              ? "bg-yellow-400"
                              : order.status === "processing"
                                ? "bg-blue-400"
                                : "bg-gray-400"
                        }`}
                      ></div>
                      {(order.status || "pending").charAt(0).toUpperCase() +
                        (order.status || "pending").slice(1)}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 mb-4 backdrop-blur-sm">
                  <div className="space-y-3">
                    {orderItems.slice(0, 2).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden shadow-sm">
                            <Image
                              src={
                                item.image ||
                                item.productImage ||
                                product.image ||
                                product.images?.[0] ||
                                "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=40&h=40&fit=crop"
                              }
                              alt={item.name || item.productName || "Product"}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=40&h=40&fit=crop";
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {item.name || item.productName || "Product"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">
                                {item.quantity || 1}
                              </span>{" "}
                              ×
                              <span className="font-bold text-green-600 ml-1">
                                ৳{parseFloat(item.price || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          ৳
                          {(
                            parseFloat(item.price || 0) *
                            parseInt(item.quantity || 1)
                          ).toFixed(2)}
                        </div>
                      </div>
                    ))}
                    {orderItems.length > 2 && (
                      <div className="text-xs text-center text-gray-500 dark:text-gray-400 py-2 border-t border-gray-200 dark:border-gray-600">
                        +{orderItems.length - 2} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Footer with Total */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex items-center space-x-4">
                    {order.paymentMethod && (
                      <div className="flex items-center space-x-1">
                        <i className="fas fa-credit-card text-gray-400 text-xs"></i>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {order.paymentMethod}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <i className="fas fa-clock text-gray-400 text-xs"></i>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Total Amount
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ৳{parseFloat(displayTotal || 0).toFixed(2)}
                      </span>
                      <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <i className="fas fa-shopping-cart text-4xl text-blue-500 dark:text-blue-400"></i>
              </div>
              <div className="absolute top-2 right-1/2 transform translate-x-8 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-bounce"></div>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              No Recent Orders Yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Once customers start purchasing this product, their orders will
              appear here with real-time updates.
            </p>
            <div className="flex items-center justify-center space-x-3 text-sm">
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                <i className="fas fa-lightbulb text-amber-500"></i>
                <span className="font-medium">
                  Pro Tip: Promote your product to increase visibility!
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View All Orders Link */}
      {recentOrders.length > 0 && (
        <div className="mt-8 pt-6 border-t border-blue-200/50 dark:border-blue-700/30">
          <Link
            href="/farmer-orders"
            className="group relative w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center space-x-3">
              <i className="fas fa-chart-line text-lg group-hover:animate-pulse"></i>
              <span>View All Orders & Analytics</span>
              <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform duration-300"></i>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
