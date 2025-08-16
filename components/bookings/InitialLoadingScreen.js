import React from "react";

export function OrdersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300"
          style={{
            animationDelay: `${i * 100}ms`,
            animation: "fadeInUp 0.8s ease-out forwards",
          }}
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-gray-600/20 to-transparent animate-shimmer" />
          <div className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="h-6 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              {Array.from({ length: 4 }).map((_, k) => (
                <div
                  key={k}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 animate-pulse h-28"
                />
              ))}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 flex gap-3">
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InitialLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-6 animate-bounce">
          <i className="fas fa-shopping-bag text-3xl text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Loading Your Orders
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Please wait while we fetch your order history...
        </p>
        <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-blue-600 animate-pulse" />
        </div>
        <div className="mt-10">
          <OrdersLoadingSkeleton />
        </div>
      </div>
    </div>
  );
}
