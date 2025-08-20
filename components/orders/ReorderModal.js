import { useState, useEffect } from "react";

export default function ReorderModal({
  isOpen,
  onClose,
  validationResult,
  onProceedWithAvailable,
  onProceedWithAll,
  loading,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen || !validationResult) return null;

  const { summary, validation, pricing, originalOrder } = validationResult;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPriceChangeColor = (change) => {
    if (change > 0) return "text-red-500";
    if (change < 0) return "text-emerald-500";
    return "text-gray-600";
  };

  const getPriceChangeIcon = (change) => {
    if (change > 0) return "fas fa-arrow-up";
    if (change < 0) return "fas fa-arrow-down";
    return "fas fa-minus";
  };

  // Calculate total value of available stock
  const calculateAvailableStockValue = () => {
    return validation.availableItems.reduce((total, item) => {
      return total + item.price * item.stock;
    }, 0);
  };

  const getStatusColor = (type) => {
    switch (type) {
      case "available":
        return "from-emerald-500 to-green-600";
      case "unavailable":
        return "from-red-500 to-rose-600";
      case "price-change":
        return "from-orange-500 to-amber-600";
      case "stock-issue":
        return "from-yellow-500 to-orange-500";
      default:
        return "from-blue-500 to-indigo-600";
    }
  };

  const tabs = [
    { id: "summary", label: "Summary", icon: "fas fa-chart-pie" },
    { id: "items", label: "Items", icon: "fas fa-boxes" },
    { id: "pricing", label: "Pricing", icon: "fas fa-calculator" },
  ];

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-300 flex flex-col ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}
      >
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white p-6 flex-shrink-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <i className="fas fa-sync-alt text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight">
                      Reorder Validation
                    </h3>
                    <p className="text-blue-100 text-lg">
                      Order from{" "}
                      {new Date(originalOrder.orderDate).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>

                {/* Quick Status Pills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {summary.reorderSuccess && (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-100 rounded-full text-sm font-medium border border-emerald-400/30">
                      <i className="fas fa-check mr-1"></i>
                      Reorder Available
                    </span>
                  )}
                  {summary.priceChangesCount > 0 && (
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-100 rounded-full text-sm font-medium border border-orange-400/30">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      Price Changes
                    </span>
                  )}
                  {summary.stockIssuesCount > 0 && (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-100 rounded-full text-sm font-medium border border-yellow-400/30">
                      <i className="fas fa-warehouse mr-1"></i>
                      Stock Issues
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 group"
              >
                <i className="fas fa-times text-xl group-hover:rotate-90 transition-transform duration-200"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex space-x-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md border border-blue-200 dark:border-blue-800"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"
                }`}
              >
                <i className={`${tab.icon} text-sm`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Summary Tab */}
          {activeTab === "summary" && (
            <div className="space-y-8">
              {/* Enhanced Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 group hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-emerald-500/20 rounded-xl">
                        <i className="fas fa-check-circle text-emerald-600 text-xl"></i>
                      </div>
                      <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {summary.availableCount}
                      </span>
                    </div>
                    <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">
                      Available Items
                    </h4>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                      Ready for reorder
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800 group hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-red-500/20 rounded-xl">
                        <i className="fas fa-times-circle text-red-600 text-xl"></i>
                      </div>
                      <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {summary.unavailableCount}
                      </span>
                    </div>
                    <h4 className="font-semibold text-red-800 dark:text-red-300">
                      Unavailable
                    </h4>
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      Currently out of stock
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 group hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-orange-500/20 rounded-xl">
                        <i className="fas fa-exchange-alt text-orange-600 text-xl"></i>
                      </div>
                      <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {summary.priceChangesCount}
                      </span>
                    </div>
                    <h4 className="font-semibold text-orange-800 dark:text-orange-300">
                      Price Changes
                    </h4>
                    <p className="text-orange-600 dark:text-orange-400 text-sm">
                      Updated pricing
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800 group hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-yellow-500/20 rounded-xl">
                        <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                      </div>
                      <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {summary.stockIssuesCount}
                      </span>
                    </div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">
                      Stock Issues
                    </h4>
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                      Limited availability
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Price Comparison */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <i className="fas fa-calculator text-blue-600 text-xl"></i>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Price Comparison
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Original Total
                      </span>
                      <i className="fas fa-receipt text-gray-400"></i>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(originalOrder.total)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Previous order
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        New Estimated
                      </span>
                      <i className="fas fa-shopping-cart text-gray-400"></i>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatPrice(pricing.estimatedTotal)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Current pricing
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Difference
                      </span>
                      <i
                        className={`${getPriceChangeIcon(pricing.totalDifference)} text-gray-400`}
                      ></i>
                    </div>
                    <div
                      className={`text-2xl font-bold ${getPriceChangeColor(pricing.totalDifference)}`}
                    >
                      {pricing.totalDifference > 0 ? "+" : ""}
                      {formatPrice(pricing.totalDifference)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {pricing.totalDifference < 0
                        ? "You save"
                        : "Additional cost"}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Stock Value
                      </span>
                      <i className="fas fa-warehouse text-gray-400"></i>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(calculateAvailableStockValue())}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Total inventory value
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Items Tab */}
          {activeTab === "items" && (
            <div className="space-y-6">
              {/* Available Items */}
              {validation.availableItems.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/10 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <i className="fas fa-check-circle text-emerald-600 text-xl"></i>
                    </div>
                    <h4 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
                      Available Items ({validation.availableItems.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {validation.availableItems.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={
                              item.image ||
                              "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=60&h=60&fit=crop"
                            }
                            alt={item.productName}
                            className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                          />
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 dark:text-white">
                              {item.productName}
                            </h5>
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Qty:{" "}
                                <span className="font-medium">
                                  {item.quantity}
                                </span>
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                Stock:{" "}
                                <span className="font-medium text-emerald-600">
                                  {item.stock}
                                </span>
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                Price:{" "}
                                <span className="font-medium">
                                  {formatPrice(item.price)}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issue Items */}
              {(validation.unavailableItems.length > 0 ||
                validation.priceChanges.length > 0 ||
                validation.stockIssues.length > 0) && (
                <div className="space-y-6">
                  {/* Unavailable Items */}
                  {validation.unavailableItems.length > 0 && (
                    <div className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/10 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-red-500/20 rounded-xl">
                          <i className="fas fa-times-circle text-red-600 text-xl"></i>
                        </div>
                        <h4 className="text-xl font-bold text-red-800 dark:text-red-300">
                          Unavailable Items (
                          {validation.unavailableItems.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {validation.unavailableItems.map((item, index) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-200 dark:border-red-800"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white">
                                  {item.productName}
                                </h5>
                                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                                  {item.reason}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Changes */}
                  {validation.priceChanges.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/10 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-orange-500/20 rounded-xl">
                          <i className="fas fa-exchange-alt text-orange-600 text-xl"></i>
                        </div>
                        <h4 className="text-xl font-bold text-orange-800 dark:text-orange-300">
                          Price Changes ({validation.priceChanges.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {validation.priceChanges.map((item, index) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-orange-200 dark:border-orange-800"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white">
                                  {item.productName}
                                </h5>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                  Was {formatPrice(item.originalPrice)} → Now{" "}
                                  {formatPrice(item.currentPrice)}
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`text-sm font-semibold ${getPriceChangeColor(item.priceDifference)}`}
                                >
                                  {item.priceDifference > 0 ? "+" : ""}
                                  {item.priceChangePercent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock Issues */}
                  {validation.stockIssues.length > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/10 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-yellow-500/20 rounded-xl">
                          <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                        </div>
                        <h4 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">
                          Stock Issues ({validation.stockIssues.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {validation.stockIssues.map((item, index) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white">
                                  {item.productName}
                                </h5>
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
                                  {item.reason}
                                </p>
                              </div>
                              <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                                <div>Wanted: {item.requestedQuantity}</div>
                                <div>Available: {item.availableStock}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === "pricing" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <i className="fas fa-calculator text-blue-600 text-2xl"></i>
                  </div>
                  <h4 className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                    Detailed Pricing Breakdown
                  </h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Original Order */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <i className="fas fa-history text-gray-500 mr-2"></i>
                      Original Order
                    </h5>
                    <div className="space-y-4">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          Subtotal:
                        </span>
                        <span className="font-semibold">
                          {formatPrice(pricing.originalSubtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          Delivery Fee:
                        </span>
                        <span className="font-semibold">{formatPrice(50)}</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                        <div className="flex justify-between py-2">
                          <span className="text-lg font-bold">Total:</span>
                          <span className="text-lg font-bold">
                            {formatPrice(originalOrder.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* New Estimated */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <i className="fas fa-shopping-cart text-blue-500 mr-2"></i>
                      New Estimated
                    </h5>
                    <div className="space-y-4">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          Subtotal:
                        </span>
                        <span className="font-semibold">
                          {formatPrice(pricing.estimatedSubtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          Delivery Fee:
                        </span>
                        <span className="font-semibold">
                          {formatPrice(pricing.estimatedDeliveryFee)}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                        <div className="flex justify-between py-2">
                          <span className="text-lg font-bold">Total:</span>
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(pricing.estimatedTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Summary */}
                <div className="mt-8 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="text-lg font-bold text-gray-900 dark:text-white">
                        Price Difference
                      </h6>
                      <p className="text-gray-600 dark:text-gray-400">
                        {pricing.totalDifference < 0
                          ? "You'll save"
                          : "Additional cost"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-3xl font-bold ${getPriceChangeColor(pricing.totalDifference)}`}
                      >
                        {pricing.totalDifference > 0 ? "+" : ""}
                        {formatPrice(pricing.totalDifference)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {pricing.totalDifference !== 0 &&
                          `${Math.abs((pricing.totalDifference / originalOrder.total) * 100).toFixed(1)}% ${pricing.totalDifference < 0 ? "less" : "more"}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Stock Value */}
                <div className="mt-6 bg-gradient-to-r from-emerald-100 to-green-200 dark:from-emerald-900/30 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                        Total Available Stock Value
                      </h6>
                      <p className="text-emerald-600 dark:text-emerald-400">
                        Combined value of all inventory
                      </p>
                    </div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(calculateAvailableStockValue())}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex items-center space-x-4">
              {summary.reorderSuccess && (
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                  <i className="fas fa-check-circle"></i>
                  <span className="font-medium">
                    Ready to reorder {summary.availableCount} items
                  </span>
                </div>
              )}
              {!summary.reorderSuccess && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <i className="fas fa-times-circle"></i>
                  <span className="font-medium">
                    No items available for reorder
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-2xl font-semibold transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>

              {summary.availableCount > 0 && (
                <button
                  onClick={onProceedWithAvailable}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {loading && <i className="fas fa-spinner fa-spin"></i>}
                  <i className="fas fa-cart-plus"></i>
                  <span>Add {summary.availableCount} Items</span>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                    {formatPrice(pricing.estimatedTotal)}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
