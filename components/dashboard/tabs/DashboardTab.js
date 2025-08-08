"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardTab({
  orders,
  products,
  formatPrice,
  formatDate,
  handleRefresh,
  updateBulkProductsInCache, // Add this prop to receive the bulk update function
}) {
  const router = useRouter();
  const [bulkUpdateModal, setBulkUpdateModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkValues, setBulkValues] = useState({
    price: "",
    stock: "",
    status: "",
    category: "",
  });
  const [bulkLoading, setBulkLoading] = useState(false);

  // Quick Farm Tools handlers
  const handleQuickTool = (toolType) => {
    switch (toolType) {
      case "bulk-update":
        setBulkUpdateModal(true);
        break;
      case "inventory-sync":
        router.push("/manage?tab=products&action=inventory");
        break;
      case "price-optimizer":
        router.push("/manage?tab=analytics&tool=pricing");
        break;
      case "harvest-planner":
        router.push("/manage?tab=dashboard&tool=planner");
        break;
      default:
        break;
    }
  };

  // Bulk update functionality
  const handleBulkUpdate = async () => {
    if (!selectedProducts.length || !bulkAction) {
      alert("Please select products and an action to perform.");
      return;
    }

    setBulkLoading(true);
    try {
      const updateData = {};

      switch (bulkAction) {
        case "price":
          if (!bulkValues.price) {
            alert("Please enter a price value.");
            return;
          }
          updateData.price = parseFloat(bulkValues.price);
          break;
        case "stock":
          if (!bulkValues.stock) {
            alert("Please enter a stock value.");
            return;
          }
          updateData.stock = parseInt(bulkValues.stock);
          break;
        case "status":
          if (!bulkValues.status) {
            alert("Please select a status.");
            return;
          }
          updateData.status = bulkValues.status;
          break;
        case "category":
          if (!bulkValues.category) {
            alert("Please enter a category.");
            return;
          }
          updateData.category = bulkValues.category;
          break;
      }

      // Use the new API service method for bulk update with automatic cache clearing
      const { apiService } = await import("@/lib/api-service");
      const result = await apiService.bulkUpdateProducts(
        selectedProducts,
        updateData,
      );

      if (result.success) {
        alert(
          `Successfully updated ${result.data.updatedCount || 1} products!`,
        );

        // Update the React Query cache immediately instead of hard refresh
        if (updateBulkProductsInCache) {
          updateBulkProductsInCache(selectedProducts, updateData);
        }

        // Dispatch custom event to notify products page of bulk update
        window.dispatchEvent(
          new CustomEvent("productsBulkUpdated", {
            detail: {
              productIds: selectedProducts,
              updateData: updateData,
              timestamp: Date.now(),
              cacheCleared: result.cacheCleared,
            },
          }),
        );

        // Also set localStorage flag for cross-tab communication
        localStorage.setItem(
          "productsBulkUpdated",
          JSON.stringify({
            productIds: selectedProducts,
            updateData: updateData,
            timestamp: Date.now(),
            cacheCleared: result.cacheCleared,
          }),
        );

        // Trigger page refresh to ensure latest data
        if (handleRefresh) {
          handleRefresh(true); // Force refresh
        }

        setBulkUpdateModal(false);
        setSelectedProducts([]);
        setBulkAction("");
        setBulkValues({ price: "", stock: "", status: "", category: "" });
      } else {
        throw new Error(result.error || "Update failed");
      }
    } catch (error) {
      console.error("Bulk update error:", error);
      alert(`Error updating products: ${error.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p._id));
    }
  };

  // Calculate urgent action items
  const actionItems = useMemo(() => {
    const items = [];

    // Low stock alerts
    const lowStockProducts = products.filter(
      (p) => p.stock <= 5 && p.stock > 0,
    );
    if (lowStockProducts.length > 0) {
      items.push({
        type: "low-stock",
        priority: "high",
        icon: "fas fa-exclamation-triangle",
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        title: `${lowStockProducts.length} products low on stock`,
        description: "Restock needed to avoid stockouts",
        action: "View Products",
        link: "#products",
      });
    }

    // Out of stock alerts
    const outOfStockProducts = products.filter((p) => p.stock === 0);
    if (outOfStockProducts.length > 0) {
      items.push({
        type: "out-of-stock",
        priority: "critical",
        icon: "fas fa-times-circle",
        color: "text-red-700",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        title: `${outOfStockProducts.length} products out of stock`,
        description: "Products unavailable for purchase",
        action: "Restock Now",
        link: "#products",
      });
    }

    // Pending orders
    const pendingOrders = orders.filter((o) => o.status === "pending");
    if (pendingOrders.length > 0) {
      items.push({
        type: "pending-orders",
        priority: "medium",
        icon: "fas fa-clock",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        title: `${pendingOrders.length} orders awaiting processing`,
        description: "New orders need your attention",
        action: "Process Orders",
        link: "#orders",
      });
    }

    // Products without images
    const productsWithoutImages = products.filter(
      (p) => !p.images || p.images.length === 0,
    );
    if (productsWithoutImages.length > 0) {
      items.push({
        type: "missing-images",
        priority: "low",
        icon: "fas fa-image",
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        title: `${productsWithoutImages.length} products missing images`,
        description: "Add photos to boost sales",
        action: "Add Images",
        link: "#products",
      });
    }

    return items.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [products, orders]);

  // Real-time activity feed
  const activityFeed = useMemo(() => {
    const activities = [];

    // Recent orders
    orders.slice(0, 5).forEach((order) => {
      // Extract customer name from various possible fields
      let customerName =
        order.customerName ||
        order.customerInfo?.name ||
        order.shippingAddress?.name ||
        order.billingAddress?.name;

      // If no name found but we have userId, format it better
      if (!customerName && order.userId) {
        // Check if userId looks like a MongoDB ObjectId (24 hex characters)
        if (order.userId.match(/^[0-9a-fA-F]{24}$/)) {
          customerName = `Customer ${order.userId.slice(-6).toUpperCase()}`;
        } else {
          customerName = order.userId;
        }
      }

      // Final fallback
      if (!customerName) {
        customerName = "Anonymous Customer";
      }

      activities.push({
        type: "order",
        icon: "fas fa-shopping-cart",
        color: "text-green-600",
        title: `New order from ${customerName}`,
        description: `${order.items?.length || 0} items • ${formatPrice(
          order.total || 0,
        )}`,
        time: order.createdAt,
        status: order.status,
      });
    });

    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 8);
  }, [orders, formatPrice]);

  // Today's summary
  const todaySummary = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
      return orderDate === today;
    });

    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + (order.farmerSubtotal || order.total || 0),
      0,
    );

    return {
      ordersCount: todayOrders.length,
      revenue: todayRevenue,
      newCustomers: new Set(todayOrders.map((o) => o.customerEmail)).size,
      topProduct: products.reduce((top, product) => {
        const productOrdersToday = todayOrders.filter((order) =>
          order.items?.some(
            (item) =>
              item.productId === product._id ||
              item.product?._id === product._id,
          ),
        );
        return productOrdersToday.length > (top?.count || 0)
          ? { ...product, count: productOrdersToday.length }
          : top;
      }, null),
    };
  }, [orders, products]);

  // Seasonal recommendations
  const seasonalRecommendations = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const recommendations = [];

    // Summer fruits and vegetables (June-August: months 5-7)
    if (currentMonth >= 5 && currentMonth <= 7) {
      recommendations.push({
        category: "Summer Produce",
        suggestion: "Promote tomatoes, cucumbers, berries, and leafy greens",
        icon: "fas fa-sun",
        color: "text-orange-600",
      });
    }
    // Fall harvest (September-November: months 8-10)
    else if (currentMonth >= 8 && currentMonth <= 10) {
      recommendations.push({
        category: "Fall Harvest",
        suggestion: "Feature apples, pumpkins, root vegetables, and grains",
        icon: "fas fa-leaf",
        color: "text-orange-700",
      });
    }
    // Winter storage crops (December-February: months 11, 0, 1)
    else if (currentMonth === 11 || currentMonth <= 1) {
      recommendations.push({
        category: "Winter Storage",
        suggestion:
          "Highlight preserved goods, winter squash, and dried products",
        icon: "fas fa-snowflake",
        color: "text-blue-600",
      });
    }
    // Spring planting (March-May: months 2-4)
    else {
      recommendations.push({
        category: "Spring Fresh",
        suggestion: "Promote fresh herbs, early greens, and spring vegetables",
        icon: "fas fa-seedling",
        color: "text-green-600",
      });
    }

    return recommendations;
  }, []);

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Good morning, Farmer!</h2>
            <p className="opacity-90">
              Here's what's happening on your farm today
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">
              {new Date().toLocaleDateString()}
            </p>
            <p className="text-lg font-semibold">
              {new Date().toLocaleDateString("en-US", { weekday: "long" })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <i className="fas fa-shopping-cart text-2xl mr-3"></i>
              <div>
                <p className="text-2xl font-bold">{todaySummary.ordersCount}</p>
                <p className="text-sm opacity-75">Orders Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <i className="fas fa-dollar-sign text-2xl mr-3"></i>
              <div>
                <p className="text-2xl font-bold">
                  {formatPrice(todaySummary.revenue)}
                </p>
                <p className="text-sm opacity-75">Revenue Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <i className="fas fa-users text-2xl mr-3"></i>
              <div>
                <p className="text-2xl font-bold">
                  {todaySummary.newCustomers}
                </p>
                <p className="text-sm opacity-75">New Customers</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <i className="fas fa-star text-2xl mr-3"></i>
              <div>
                <p className="text-lg font-bold">
                  {todaySummary.topProduct?.name || "None"}
                </p>
                <p className="text-sm opacity-75">Top Product</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items & Quick Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Action Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-bell text-orange-500 mr-2"></i>
              Action Items
            </h3>
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
              {
                actionItems.filter(
                  (item) =>
                    item.priority === "critical" || item.priority === "high",
                ).length
              }{" "}
              urgent
            </span>
          </div>

          {actionItems.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-check-circle text-4xl text-green-500 mb-3"></i>
              <p className="text-gray-600 dark:text-gray-400">All caught up!</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                No urgent action items at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {actionItems.slice(0, 4).map((item, index) => (
                <div
                  key={index}
                  className={`${item.bgColor} rounded-lg p-4 border-l-4 border-current`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <i
                        className={`${item.icon} ${item.color} text-lg mr-3 mt-1`}
                      ></i>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <button
                      className={`${item.color} hover:underline text-sm font-medium`}
                    >
                      {item.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Farm Tools */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <i className="fas fa-tools text-blue-500 mr-2"></i>
            Quick Farm Tools
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/create"
              className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition text-center"
            >
              <i className="fas fa-plus text-green-600 dark:text-green-400 text-2xl mb-2"></i>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Add Product
              </span>
            </Link>

            <button
              onClick={() => setBulkUpdateModal(true)}
              className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition text-center"
            >
              <i className="fas fa-layer-group text-blue-600 dark:text-blue-400 text-2xl mb-2"></i>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Bulk Update
              </span>
            </button>

            <Link
              href="/farmer-orders"
              className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition text-center"
            >
              <i className="fas fa-clipboard-list text-purple-600 dark:text-purple-400 text-2xl mb-2"></i>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Process Orders
              </span>
            </Link>

            <button
              onClick={handleRefresh}
              className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition text-center"
            >
              <i className="fas fa-sync-alt text-orange-600 dark:text-orange-400 text-2xl mb-2"></i>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Refresh Data
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Feed & Seasonal Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <i className="fas fa-activity text-green-500 mr-2"></i>
            Live Farm Activity
          </h3>

          {activityFeed.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-calendar-day text-4xl text-gray-400 mb-3"></i>
              <p className="text-gray-600 dark:text-gray-400">
                No recent activity
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {activityFeed.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className={`${activity.color} mt-1`}>
                    <i className={activity.icon}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatDate(activity.time)}
                    </p>
                  </div>
                  {activity.status && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : activity.status === "processing"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      }`}
                    >
                      {activity.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seasonal Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
            Farm Tips
          </h3>

          <div className="space-y-4">
            {seasonalRecommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg"
              >
                <div className="flex items-start">
                  <i
                    className={`${rec.icon} ${rec.color} text-xl mr-3 mt-1`}
                  ></i>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {rec.category}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {rec.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                <i className="fas fa-chart-line text-blue-600 mr-2"></i>
                Growth Tip
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Products with photos sell 3x better! Add high-quality images to
                boost your sales.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Bulk Update Modal */}
      {bulkUpdateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in duration-300">
            {/* Enhanced Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <i className="fas fa-layer-group text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Bulk Update Products</h3>
                    <p className="text-blue-100 mt-1">
                      Update multiple products at once to save time
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBulkUpdateModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-8 max-h-[calc(95vh-200px)] overflow-y-auto space-y-8">
              {/* Step Indicator */}
              <div className="flex items-center justify-center space-x-4 mb-8">
                <div
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                    selectedProducts.length > 0
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      selectedProducts.length > 0
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    1
                  </div>
                  <span className="text-sm font-medium">Select Products</span>
                </div>

                <div
                  className={`w-8 h-0.5 transition-all ${
                    selectedProducts.length > 0 && bulkAction
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                ></div>

                <div
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                    selectedProducts.length > 0 && bulkAction
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      selectedProducts.length > 0 && bulkAction
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-sm font-medium">Choose Action</span>
                </div>

                <div
                  className={`w-8 h-0.5 transition-all ${
                    selectedProducts.length > 0 &&
                    bulkAction &&
                    (bulkValues.price ||
                      bulkValues.stock ||
                      bulkValues.status ||
                      bulkValues.category)
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                ></div>

                <div
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                    selectedProducts.length > 0 &&
                    bulkAction &&
                    (bulkValues.price ||
                      bulkValues.stock ||
                      bulkValues.status ||
                      bulkValues.category)
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      selectedProducts.length > 0 &&
                      bulkAction &&
                      (bulkValues.price ||
                        bulkValues.stock ||
                        bulkValues.status ||
                        bulkValues.category)
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    3
                  </div>
                  <span className="text-sm font-medium">Set Values</span>
                </div>
              </div>

              {/* Enhanced Product Selection */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <i className="fas fa-boxes text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        Select Products
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedProducts.length} of {products.length} products
                        selected
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {selectedProducts.length > 0 && (
                      <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                        {selectedProducts.length} selected
                      </div>
                    )}
                    <button
                      onClick={selectAllProducts}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <i
                        className={`fas ${
                          selectedProducts.length === products.length
                            ? "fa-minus"
                            : "fa-check-double"
                        }`}
                      ></i>
                      <span>
                        {selectedProducts.length === products.length
                          ? "Deselect All"
                          : "Select All"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Products Grid Container with proper spacing and no horizontal scroll */}
                <div className="mt-8">
                  <div className="max-h-80 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                      {products.map((product) => (
                        <div
                          key={product._id}
                          className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                            selectedProducts.includes(product._id)
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md scale-[1.02]"
                              : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                          }`}
                          onClick={() => toggleProductSelection(product._id)}
                        >
                          {/* Selection indicator */}
                          <div
                            className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              selectedProducts.includes(product._id)
                                ? "bg-blue-500 text-white scale-110"
                                : "bg-gray-200 dark:bg-gray-600 text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900"
                            }`}
                          >
                            <i
                              className={`fas ${
                                selectedProducts.includes(product._id)
                                  ? "fa-check"
                                  : "fa-plus"
                              } text-xs`}
                            ></i>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                selectedProducts.includes(product._id)
                                  ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30"
                              }`}
                            >
                              <i className="fas fa-box text-lg"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                                {product.name}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    product.stock > 10
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                      : product.stock > 0
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                  }`}
                                >
                                  {product.stock} in stock
                                </span>
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                  {formatPrice(product.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Bulk Action Selection */}
              {selectedProducts.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <i className="fas fa-magic text-purple-600 dark:text-purple-400"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        Choose Action
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Select what you want to update
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        value: "price",
                        label: "Update Price",
                        icon: "fas fa-dollar-sign",
                        color: "green",
                        description: "Change product prices",
                      },
                      {
                        value: "stock",
                        label: "Update Stock",
                        icon: "fas fa-box",
                        color: "blue",
                        description: "Adjust inventory levels",
                      },
                      {
                        value: "status",
                        label: "Update Status",
                        icon: "fas fa-toggle-on",
                        color: "purple",
                        description: "Enable/disable products",
                      },
                      {
                        value: "category",
                        label: "Update Category",
                        icon: "fas fa-tags",
                        color: "orange",
                        description: "Change product categories",
                      },
                    ].map((action) => (
                      <button
                        key={action.value}
                        onClick={() => setBulkAction(action.value)}
                        className={`group relative p-6 border-2 rounded-2xl text-center transition-all duration-200 hover:shadow-lg ${
                          bulkAction === action.value
                            ? `border-${action.color}-500 bg-${action.color}-50 dark:bg-${action.color}-900/20 shadow-md scale-[1.02]`
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        {/* Selection indicator */}
                        <div
                          className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            bulkAction === action.value
                              ? `bg-${action.color}-500 text-white scale-110`
                              : "bg-gray-200 dark:bg-gray-600 text-gray-400 group-hover:scale-110"
                          }`}
                        >
                          <i
                            className={`fas ${
                              bulkAction === action.value
                                ? "fa-check"
                                : "fa-plus"
                            } text-xs`}
                          ></i>
                        </div>

                        <div
                          className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all ${
                            bulkAction === action.value
                              ? `bg-${action.color}-100 dark:bg-${action.color}-800 text-${action.color}-600 dark:text-${action.color}-300`
                              : "bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600"
                          }`}
                        >
                          <i className={`${action.icon} text-2xl`}></i>
                        </div>
                        <h5 className="font-bold text-gray-900 dark:text-white mb-2">
                          {action.label}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {action.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Input Fields */}
              {bulkAction && selectedProducts.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <i className="fas fa-edit text-indigo-600 dark:text-indigo-400"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        Set New Value
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This will be applied to all {selectedProducts.length}{" "}
                        selected products
                      </p>
                    </div>
                  </div>

                  <div className="max-w-md">
                    {bulkAction === "price" && (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <i className="fas fa-dollar-sign"></i>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={bulkValues.price}
                          onChange={(e) =>
                            setBulkValues((prev) => ({
                              ...prev,
                              price: e.target.value,
                            }))
                          }
                          className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-lg font-semibold transition-all"
                        />
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Enter the new price for all selected products
                        </div>
                      </div>
                    )}

                    {bulkAction === "stock" && (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <i className="fas fa-box"></i>
                        </div>
                        <input
                          type="number"
                          placeholder="0"
                          value={bulkValues.stock}
                          onChange={(e) =>
                            setBulkValues((prev) => ({
                              ...prev,
                              stock: e.target.value,
                            }))
                          }
                          className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-lg font-semibold transition-all"
                        />
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Enter the new stock quantity for all selected products
                        </div>
                      </div>
                    )}

                    {bulkAction === "status" && (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <i className="fas fa-toggle-on"></i>
                        </div>
                        <select
                          value={bulkValues.status}
                          onChange={(e) =>
                            setBulkValues((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-lg font-semibold transition-all"
                        >
                          <option value="">Select status</option>
                          <option value="active">🟢 Active</option>
                          <option value="inactive">🔴 Inactive</option>
                        </select>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Choose the new status for all selected products
                        </div>
                      </div>
                    )}

                    {bulkAction === "category" && (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <i className="fas fa-tags"></i>
                        </div>
                        <input
                          type="text"
                          placeholder="Category name"
                          value={bulkValues.category}
                          onChange={(e) =>
                            setBulkValues((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-lg font-semibold transition-all"
                        />
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Enter the new category for all selected products
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Footer */}
            <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProducts.length > 0 &&
                  bulkAction &&
                  (bulkValues.price ||
                    bulkValues.stock ||
                    bulkValues.status ||
                    bulkValues.category) ? (
                    <span className="flex items-center space-x-2">
                      <i className="fas fa-info-circle text-blue-500"></i>
                      <span>
                        Ready to update {selectedProducts.length} products
                      </span>
                    </span>
                  ) : (
                    <span>Complete all steps to proceed with bulk update</span>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setBulkUpdateModal(false)}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpdate}
                    disabled={
                      !selectedProducts.length ||
                      !bulkAction ||
                      bulkLoading ||
                      !(
                        bulkValues.price ||
                        bulkValues.stock ||
                        bulkValues.status ||
                        bulkValues.category
                      )
                    }
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl disabled:shadow-none flex items-center space-x-2"
                  >
                    {bulkLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Updating Products...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic"></i>
                        <span>Update {selectedProducts.length} Products</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
