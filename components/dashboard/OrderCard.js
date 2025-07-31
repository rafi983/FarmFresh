// components/dashboard/OrderCard.js
import Link from "next/link";

export default function OrderCard({ order, formatPrice, formatDate }) {
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <i className="fas fa-clock mr-1"></i> Pending
          </span>
                );
            case "processing":
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <i className="fas fa-cog mr-1"></i> Processing
          </span>
                );
            case "shipped":
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            <i className="fas fa-truck mr-1"></i> Shipped
          </span>
                );
            case "delivered":
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <i className="fas fa-check-circle mr-1"></i> Delivered
          </span>
                );
            case "cancelled":
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <i className="fas fa-times-circle mr-1"></i> Cancelled
          </span>
                );
            default:
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            <i className="fas fa-question-circle mr-1"></i> Unknown
          </span>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Order #{order._id?.substring(0, 8)}</span>
                    <div className="font-medium text-gray-900 dark:text-white mt-1">{formatDate(order.createdAt)}</div>
                </div>
                {getStatusBadge(order.status)}
            </div>

            <div className="mb-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Customer:</span> {order.customerName || "Customer"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">Items:</span> {order.items?.length || 0} items
                </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="font-semibold text-green-600 dark:text-green-400">
                    {formatPrice(order.farmerSubtotal || order.total || 0)}
                </div>
                <Link
                    href={`/order/${order._id}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                    View Details <i className="fas fa-chevron-right ml-1 text-xs"></i>
                </Link>
            </div>
        </div>
    );
}