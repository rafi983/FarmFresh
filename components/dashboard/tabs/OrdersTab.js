// components/dashboard/tabs/OrdersTab.js
import Link from "next/link";
import StatCard from "../StatCard";
import OrderCard from "../OrderCard";

export default function OrdersTab({ orders, handleRefresh, refreshing, formatPrice, formatDate }) {
    // Calculate order stats
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const processingOrders = orders.filter(o => o.status === "processing").length;
    const shippedOrders = orders.filter(o => o.status === "shipped").length;
    const completedOrders = orders.filter(o => o.status === "delivered").length;

    return (
        <div className="space-y-6">
            {/* Orders Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Order Management
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            View and manage all orders for your products
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
                        >
                            <i className={`fas fa-sync-alt mr-2 ${refreshing ? "fa-spin" : ""}`}></i>
                            Refresh
                        </button>
                        <Link
                            href="/farmer-orders"
                            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                        >
                            <i className="fas fa-external-link-alt mr-2"></i>
                            Full Order Management
                        </Link>
                    </div>
                </div>
            </div>

            {/* Order Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard
                    icon="fas fa-shopping-cart"
                    bgColor="bg-gray-100 dark:bg-gray-700"
                    textColor="text-gray-600 dark:text-gray-300"
                    title="Total Orders"
                    value={orders.length}
                />

                <StatCard
                    icon="fas fa-clock"
                    bgColor="bg-yellow-100 dark:bg-yellow-900"
                    textColor="text-yellow-600 dark:text-yellow-300"
                    title="Pending"
                    value={pendingOrders}
                    iconClass="text-yellow-600 dark:text-yellow-400"
                />

                <StatCard
                    icon="fas fa-check"
                    bgColor="bg-blue-100 dark:bg-blue-900"
                    textColor="text-blue-600 dark:text-blue-300"
                    title="Processing/Shipped"
                    value={processingOrders + shippedOrders}
                    iconClass="text-blue-600 dark:text-blue-400"
                />

                <StatCard
                    icon="fas fa-check-circle"
                    bgColor="bg-green-100 dark:bg-green-900"
                    textColor="text-green-600 dark:text-green-300"
                    title="Completed"
                    value={completedOrders}
                    iconClass="text-green-600 dark:text-green-400"
                />
            </div>

            {/* Recent Orders List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Orders
                    </h3>
                    <Link
                        href="/farmer-orders"
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium"
                    >
                        View All Orders
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <i className="fas fa-shopping-bag text-6xl text-gray-400 mb-4"></i>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No orders yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            You haven't received any orders yet. Once customers place orders, they'll appear here.
                        </p>
                        <Link
                            href="/create"
                            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Add More Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {orders.map((order) => (
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