import React from "react";
import Link from "next/link";

export default function EmptyState({ type = "empty", message, onRetry }) {
  if (type === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-600 text-6xl mb-4">
            <i className="fas fa-exclamation-triangle" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Failed to Load Orders
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message || "An error occurred while fetching your orders"}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200"
            >
              <i className="fas fa-sync-alt mr-2" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            My Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            You haven&apos;t placed any orders yet
          </p>
        </div>
        <div className="text-center py-16">
          <div className="text-gray-400 text-8xl mb-8">
            <i className="fas fa-shopping-bag" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Orders Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Start exploring our fresh products and place your first order to see
            it here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200"
          >
            <i className="fas fa-shopping-cart mr-2" />
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
