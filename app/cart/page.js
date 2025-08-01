"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import Footer from "@/components/Footer";

export default function Cart() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    loading,
    paymentProcessing,
    recentlyOrderedItems,
  } = useCart();

  const [removingItems, setRemovingItems] = useState(new Set());
  const [updatingQuantities, setUpdatingQuantities] = useState(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [viewMode, setViewMode] = useState("detailed"); // detailed or compact

  // Enhanced cart statistics
  const cartStats = useMemo(() => {
    const stats = {
      totalItems: getCartItemsCount(),
      totalAmount: getCartTotal(),
      uniqueItems: items.length,
      averagePrice: items.length > 0 ? getCartTotal() / getCartItemsCount() : 0,
      farmers: new Set(
        items.map((item) =>
          typeof item.farmer === "object" ? item.farmer?.name : item.farmer,
        ),
      ).size,
      categories: new Set(items.map((item) => item.category)).size,
    };
    return stats;
  }, [items, getCartTotal, getCartItemsCount]);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setUpdatingQuantities((prev) => new Set(prev).add(productId));

    try {
      await updateQuantity(productId, newQuantity);
    } finally {
      setUpdatingQuantities((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (productId) => {
    setRemovingItems((prev) => new Set(prev).add(productId));

    try {
      await removeFromCart(productId);
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    setShowClearConfirm(false);
    await clearCart();
  };

  const formatPrice = (price) => {
    const numericPrice =
      typeof price === "number" ? price : parseFloat(price) || 0;
    return `৳${numericPrice.toFixed(0)}`;
  };

  const getDeliveryEstimate = () => {
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    return deliveryDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent border-t-green-600 border-r-blue-600 mx-auto mb-4"></div>
            <div
              className="absolute inset-0 rounded-full h-32 w-32 border-4 border-transparent border-b-purple-600 border-l-orange-600 animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading Your Cart
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we fetch your items...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 dark:from-green-400/10 dark:to-blue-400/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <nav className="flex mb-8" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-gray-500 hover:text-green-600 transition-colors duration-200 flex items-center"
                  >
                    <i className="fas fa-home mr-1"></i>
                    Home
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                </li>
                <li>
                  <Link
                    href="/products"
                    className="text-gray-500 hover:text-green-600 transition-colors duration-200"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                </li>
                <li className="text-gray-900 dark:text-white font-medium">
                  Shopping Cart
                </li>
              </ol>
            </nav>

            {/* Page Header with Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                  Shopping Cart
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Review and manage your selected items • {cartStats.totalItems}{" "}
                  items
                </p>
              </div>

              {/* Quick Stats Cards */}
              {items.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {cartStats.totalItems}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total Items
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {cartStats.farmers}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Farmers
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {cartStats.categories}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Categories
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {formatPrice(cartStats.totalAmount)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total Value
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {paymentProcessing ? (
            /* Payment Processing State */
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-full flex items-center justify-center">
                  <i className="fas fa-credit-card text-5xl text-green-600 dark:text-green-400 animate-pulse"></i>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-spin">
                  <i className="fas fa-spinner text-white text-sm"></i>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Payment Processing
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                Your order has been placed successfully! We're clearing your
                cart and preparing your fresh products for delivery.
              </p>

              {recentlyOrderedItems.length > 0 && (
                <div className="max-w-2xl mx-auto">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Items in your order:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {recentlyOrderedItems.slice(0, 4).map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                      >
                        <img
                          src={
                            item.image ||
                            "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=50&h=50&fit=crop"
                          }
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Qty: {item.quantity} •{" "}
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {recentlyOrderedItems.length > 4 && (
                      <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400">
                        +{recentlyOrderedItems.length - 4} more items
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <i className="fas fa-seedling mr-2"></i>
                  Continue Shopping
                </Link>
                <Link
                  href="/orders"
                  className="inline-flex items-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-all duration-200"
                >
                  <i className="fas fa-receipt mr-2"></i>
                  View Orders
                </Link>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* Enhanced Empty Cart State */
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-full flex items-center justify-center">
                  <i className="fas fa-shopping-cart text-5xl text-green-600 dark:text-green-400"></i>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation text-white text-sm"></i>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Your cart is empty
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                Discover fresh, organic products from local farmers and add them
                to your cart to get started!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <i className="fas fa-seedling mr-2"></i>
                  Browse Fresh Products
                </Link>
                <Link
                  href="/farmers"
                  className="inline-flex items-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-all duration-200"
                >
                  <i className="fas fa-users mr-2"></i>
                  Meet Our Farmers
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Enhanced Cart Items Section - Full Width */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Cart Header */}
                <div className="bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-700 dark:to-gray-600 p-6 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                        <i className="fas fa-shopping-basket mr-3 text-green-600"></i>
                        Your Shopping Cart
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {cartStats.totalItems} items from {cartStats.farmers}{" "}
                        farmers • {cartStats.categories} categories
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* View Mode Toggle */}
                      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode("detailed")}
                          className={`px-3 py-2 rounded-md transition-all duration-200 ${
                            viewMode === "detailed"
                              ? "bg-white dark:bg-gray-600 text-green-600 shadow-sm"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <i className="fas fa-list"></i>
                        </button>
                        <button
                          onClick={() => setViewMode("compact")}
                          className={`px-3 py-2 rounded-md transition-all duration-200 ${
                            viewMode === "compact"
                              ? "bg-white dark:bg-gray-600 text-green-600 shadow-sm"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <i className="fas fa-th-large"></i>
                        </button>
                      </div>

                      {/* Quick Actions */}
                      <Link
                        href="/products"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Add Items
                      </Link>

                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        <i className="fas fa-trash mr-2"></i>
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="p-6">
                  <div
                    className={`${viewMode === "compact" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-6"}`}
                  >
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`group relative bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl ${
                          removingItems.has(item.id)
                            ? "opacity-50 scale-95"
                            : ""
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="p-6">
                          {/* Product Image & Quantity Badge */}
                          <div className="relative mb-4">
                            <img
                              src={
                                item.image ||
                                "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&h=100&fit=crop"
                              }
                              alt={item.name}
                              className={`${viewMode === "detailed" ? "w-32 h-32 mx-auto" : "w-full h-48"} object-cover rounded-xl border-2 border-white dark:border-gray-600 shadow-lg`}
                            />
                            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-600 to-blue-600 text-white text-sm rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                              {item.quantity}
                            </div>
                            <div className="absolute top-3 left-3 bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                              <span className="text-green-600">
                                {item.category}
                              </span>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2 line-clamp-2">
                                {item.name}
                              </h3>
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <i className="fas fa-user-tie mr-2"></i>
                                <span>
                                  {typeof item.farmer === "object" &&
                                  item.farmer?.name
                                    ? item.farmer.name
                                    : typeof item.farmer === "string"
                                      ? item.farmer
                                      : "Local Farmer"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {formatPrice(item.price)}/{item.unit || "kg"}
                                </span>
                                <span className="font-bold text-lg text-gray-900 dark:text-white">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden shadow-sm">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity - 1,
                                    )
                                  }
                                  disabled={updatingQuantities.has(item.id)}
                                  className="px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900 text-red-600 transition-colors duration-200 disabled:opacity-50"
                                >
                                  <i className="fas fa-minus"></i>
                                </button>

                                <div className="px-4 py-2 border-x border-gray-300 dark:border-gray-600 min-w-[80px] text-center bg-gray-50 dark:bg-gray-700">
                                  {updatingQuantities.has(item.id) ? (
                                    <i className="fas fa-spinner fa-spin text-green-600"></i>
                                  ) : (
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {item.quantity}
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity + 1,
                                    )
                                  }
                                  disabled={updatingQuantities.has(item.id)}
                                  className="px-4 py-2 hover:bg-green-50 dark:hover:bg-green-900 text-green-600 transition-colors duration-200 disabled:opacity-50"
                                >
                                  <i className="fas fa-plus"></i>
                                </button>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={removingItems.has(item.id)}
                                className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-xl transition-colors duration-200 disabled:opacity-50 shadow-sm"
                              >
                                {removingItems.has(item.id) ? (
                                  <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                  <i className="fas fa-trash"></i>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cart Summary & Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cart Analytics */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-chart-pie mr-3 text-purple-600"></i>
                    Cart Analytics
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {cartStats.totalItems}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        Total Items
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {cartStats.farmers}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Farmers
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {cartStats.categories}
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        Categories
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200 dark:border-orange-700">
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-1">
                        {formatPrice(cartStats.averagePrice)}
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-300">
                        Avg/Item
                      </div>
                    </div>
                  </div>

                  {/* Savings & Benefits */}
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                    <div className="flex items-center text-yellow-600 dark:text-yellow-400 mb-2">
                      <i className="fas fa-piggy-bank mr-2"></i>
                      <span className="font-medium">Your Savings</span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Free delivery saves you ৳50!
                      {cartStats.totalAmount >= 500 && (
                        <span className="font-medium">
                          {" "}
                          Plus, you've unlocked free premium packaging!
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Checkout Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-calculator mr-3 text-green-600"></i>
                    Order Total
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Subtotal ({cartStats.totalItems} items):</span>
                      <span className="font-medium">
                        {formatPrice(cartStats.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Delivery Fee:</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Service Fee:</span>
                      <span className="font-medium">{formatPrice(25)}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white">
                        <span>Total:</span>
                        <span className="text-green-600">
                          {formatPrice(cartStats.totalAmount + 25)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center text-blue-600 dark:text-blue-400 mb-2">
                      <i className="fas fa-truck mr-2"></i>
                      <span className="font-medium">Delivery Information</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Expected delivery:{" "}
                      <strong>{getDeliveryEstimate()}</strong>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Free delivery • Fresh guarantee • Contact-free option
                      available
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link
                      href="/payment"
                      className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      <i className="fas fa-credit-card mr-3"></i>
                      Proceed to Secure Checkout
                      <i className="fas fa-arrow-right ml-3"></i>
                    </Link>

                    <Link
                      href="/products"
                      className="w-full flex items-center justify-center px-6 py-3 border-2 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl font-medium transition-all duration-200"
                    >
                      <i className="fas fa-leaf mr-2"></i>
                      Continue Shopping for Fresh Products
                    </Link>
                  </div>
                </div>
              </div>

              {/* Shopping Recommendations */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-lightbulb mr-3 text-yellow-500"></i>
                  Complete Your Shopping Experience
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-leaf text-green-600 text-2xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      100% Organic
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All products are certified organic and pesticide-free
                    </p>
                  </div>

                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-handshake text-blue-600 text-2xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Direct from Farmers
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Supporting local communities and fair trade
                    </p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-clock text-purple-600 text-2xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Fresh Daily
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Harvested fresh and delivered within 24 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6">
              <h3 className="text-xl font-bold mb-2">Clear Cart</h3>
              <p className="text-red-100">
                Are you sure you want to remove all items?
              </p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone. All {cartStats.totalItems} items
                will be removed from your cart.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCart}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
