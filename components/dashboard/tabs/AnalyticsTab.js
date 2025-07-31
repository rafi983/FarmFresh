// components/dashboard/tabs/AnalyticsTab.js
import { useMemo } from 'react';

export default function AnalyticsTab({ analytics, products, orders, formatPrice }) {
    // Calculate category stats
    const categoryStats = useMemo(() => {
        return products.reduce((acc, product) => {
            const category = product.category || "Other";
            if (!acc[category]) {
                acc[category] = {
                    count: 0,
                    active: 0,
                    revenue: 0,
                };
            }
            acc[category].count++;
            if (product.status !== "inactive" && product.stock > 0) {
                acc[category].active++;
            }

            // Calculate revenue for this category
            const categoryRevenue = orders.reduce((sum, order) => {
                const categoryOrderItems = order.items?.filter(
                    (item) =>
                        (item.product?._id === product._id || item.productId === product._id) &&
                        (item.product?.category === category || product.category === category)
                ) || [];

                return sum + categoryOrderItems.reduce((itemSum, item) =>
                    itemSum + (item.price * item.quantity), 0);
            }, 0);

            acc[category].revenue = categoryRevenue;
            return acc;
        }, {});
    }, [products, orders]);

    // Calculate last 7 days performance
    const last7Days = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
                date: date.toISOString().split("T")[0],
                day: date.toLocaleDateString("en-US", {
                    weekday: "short",
                }),
                orders: orders.filter((order) => {
                    const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
                    return orderDate === date.toISOString().split("T")[0];
                }).length,
                revenue: orders
                    .filter((order) => {
                        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
                        return orderDate === date.toISOString().split("T")[0];
                    })
                    .reduce((sum, order) => sum + (order.farmerSubtotal || order.total || 0), 0),
            };
        });
    }, [orders]);

    // Calculate top performing products
    const topPerformingProducts = useMemo(() => {
        return products
            .map((product) => {
                const productOrders = orders.filter((order) =>
                    order.items?.some(
                        (item) => item.product?._id === product._id || item.productId === product._id
                    )
                );

                const totalQuantitySold = productOrders.reduce(
                    (sum, order) => {
                        const matchingItems = order.items?.filter(
                            (item) => item.product?._id === product._id || item.productId === product._id
                        ) || [];
                        return sum + matchingItems.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
                    },
                    0
                );

                const totalRevenue = productOrders.reduce(
                    (sum, order) => {
                        const matchingItems = order.items?.filter(
                            (item) => item.product?._id === product._id || item.productId === product._id
                        ) || [];
                        return sum + matchingItems.reduce((itemSum, item) =>
                            itemSum + ((item.price || 0) * (item.quantity || 0)), 0);
                    },
                    0
                );

                return {
                    ...product,
                    orderCount: productOrders.length,
                    quantitySold: totalQuantitySold,
                    revenue: totalRevenue,
                    performance: totalRevenue + totalQuantitySold * 10, // Simple performance score
                };
            })
            .sort((a, b) => b.performance - a.performance)
            .slice(0, 5);
    }, [products, orders]);

    // Get max values for charts
    const maxOrders = Math.max(...last7Days.map((d) => d.orders), 1);
    const maxRevenue = Math.max(...last7Days.map((d) => d.revenue), 1);
    const sortedCategories = Object.entries(categoryStats).sort(
        ([, a], [, b]) => b.count - a.count
    );

    return (
        <div className="space-y-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Revenue Overview
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total Revenue
                            </p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatPrice(analytics.totalRevenue || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Average Order Value
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatPrice(analytics.averageOrderValue || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                This Month's Orders
                            </p>
                            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                {analytics.thisMonthOrders || 0} orders
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Product Performance
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total Products
                            </p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {analytics.totalProducts || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Active Products
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {analytics.activeProducts || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Inventory Health
                            </p>
                            <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                {products.filter(p => p.stock <= 5 && p.stock > 0).length} products low on stock
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Order Metrics
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total Orders
                            </p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {analytics.totalOrders || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Pending Orders
                            </p>
                            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                                {analytics.pendingOrders || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Completed Orders
                            </p>
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                {orders.filter(o => o.status === "completed").length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Categories Analytics & Recent Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        Products by Category
                    </h3>
                    {sortedCategories.length > 0 ? (
                        <div className="space-y-4">
                            {sortedCategories.map(([category, stats]) => (
                                <div key={category} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {category}
                      </span>
                                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({stats.count} products)
                      </span>
                                        </div>
                                        <span className="text-gray-900 dark:text-white font-medium">
                      {formatPrice(stats.revenue)}
                    </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className="bg-green-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${(stats.count / products.length) * 100}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>{stats.active} active</span>
                                        <span>
                      {((stats.count / products.length) * 100).toFixed(1)}% of products
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <i className="fas fa-box text-4xl text-gray-400 mb-4"></i>
                            <p className="text-gray-600 dark:text-gray-400">
                                No product categories available
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        Recent Performance Trends
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Orders (Last 7 Days)
                                </p>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {last7Days.reduce((sum, day) => sum + day.orders, 0)} total
                                </p>
                            </div>
                            <div className="h-20 flex items-end justify-between">
                                {last7Days.map((day, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <div
                                            className="w-8 bg-blue-500 dark:bg-blue-600 rounded-t"
                                            style={{
                                                height: `${(day.orders / maxOrders) * 100}%`,
                                                minHeight: day.orders ? "4px" : "0",
                                            }}
                                        ></div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {day.day}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Revenue (Last 7 Days)
                                </p>
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                    {formatPrice(
                                        last7Days.reduce((sum, day) => sum + day.revenue, 0)
                                    )}
                                </p>
                            </div>
                            <div className="h-20 flex items-end justify-between">
                                {last7Days.map((day, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <div
                                            className="w-8 bg-green-500 dark:bg-green-600 rounded-t"
                                            style={{
                                                height: `${(day.revenue / maxRevenue) * 100}%`,
                                                minHeight: day.revenue ? "4px" : "0",
                                            }}
                                        ></div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {day.day}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Performing Products */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Top Performing Products
                </h3>
                {topPerformingProducts.length > 0 ? (
                    <div className="space-y-4">
                        {topPerformingProducts.map((product, index) => (
                            <div
                                key={product._id}
                                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                            >
                                <div className="relative w-12 h-12 overflow-hidden rounded-lg mr-4">
                                    {product.images?.[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <i className="fas fa-image text-gray-400 dark:text-gray-500"></i>
                                        </div>
                                    )}
                                    <div className="absolute top-0 left-0 bg-green-600 text-white text-xs font-bold px-1.5 rounded-br">
                                        #{index + 1}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {product.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {product.category} • {product.quantitySold} sold • {product.orderCount} orders
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatPrice(product.revenue)}
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        {formatPrice(product.price)} per unit
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <i className="fas fa-chart-line text-4xl text-gray-400 mb-4"></i>
                        <p className="text-gray-600 dark:text-gray-400">
                            No product sales data available
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}