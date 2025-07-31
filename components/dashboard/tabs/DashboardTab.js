// components/dashboard/tabs/DashboardTab.js
import Link from "next/link";
import StatCard from "../StatCard";
import OrderCard from "../OrderCard";

export default function DashboardTab({
                                         analytics,
                                         orders,
                                         formatPrice,
                                         formatDate
                                     }) {
    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon="fas fa-box"
                    bgColor="bg-blue-100 dark:bg-blue-900"
                    textColor="text-blue-600 dark:text-blue-300"
                    title="Total Products"
                    value={analytics.totalProducts}
                />

                <StatCard
                    icon="fas fa-check-circle"
                    bgColor="bg-green-100 dark:bg-green-900"
                    textColor="text-green-600 dark:text-green-300"
                    title="Active Products"
                    value={analytics.activeProducts}
                />

                <StatCard
                    icon="fas fa-shopping-cart"
                    bgColor="bg-yellow-100 dark:bg-yellow-900"
                    textColor="text-yellow-600 dark:text-yellow-300"
                    title="Total Orders"
                    value={analytics.totalOrders}
                />

                <StatCard
                    icon="fas fa-dollar-sign"
                    bgColor="bg-purple-100 dark:bg-purple-900"
                    textColor="text-purple-600 dark:text-purple-300"
                    title="Total Revenue"
                    value={formatPrice(analytics.totalRevenue)}
                    iconClass="text-purple-600 dark:text-purple-400"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href="/create"
                        className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                    >
                        <i className="fas fa-plus text-green-600 dark:text-green-400 text-xl mr-3"></i>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                Add New Product
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                List a new farm product
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/farmer-orders"
                        className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                    >
                        <i className="fas fa-clipboard-list text-blue-600 dark:text-blue-400 text-xl mr-3"></i>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                Manage Orders
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                View and process orders
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="#"
                        className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
                    >
                        <i className="fas fa-chart-bar text-purple-600 dark:text-purple-400 text-xl mr-3"></i>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                View Analytics
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Check your performance
                            </p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Orders
                    </h3>
                    <Link
                        href="/farmer-orders"
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium"
                    >
                        View All
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <i className="fas fa-shopping-bag text-6xl text-gray-400 mb-4"></i>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No orders yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            You haven't received any orders yet.
                        </p>
                        <Link
                            href="/create"
                            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Add Your First Product
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {orders.slice(0, 6).map((order) => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                formatPrice={formatPrice}
                                formatDate={formatDate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}