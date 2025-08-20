import React from "react";

export default function LegacyProductsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-primary-600 to-emerald-600 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="animate-float">
            <i className="fas fa-tractor text-6xl absolute top-8 left-1/4"></i>
          </div>
          <div className="animate-float" style={{ animationDelay: "2s" }}>
            <i className="fas fa-leaf text-4xl absolute top-16 right-1/3"></i>
          </div>
          <div className="animate-float" style={{ animationDelay: "4s" }}>
            <i className="fas fa-seedling text-3xl absolute bottom-8 left-1/3"></i>
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-64 bg-white/20 rounded-lg animate-pulse mb-4" />
          <div className="h-6 w-96 max-w-full bg-white/15 rounded animate-pulse" />
          <div className="mt-6 p-4 bg-primary-700 rounded-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-white/20 rounded" />
                <div className="h-3 w-32 bg-white/15 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-48 bg-white/20 rounded-lg" />
                <div className="h-10 w-12 bg-white/15 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:hidden mb-6">
          <div className="w-full h-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 animate-pulse" />
        </div>
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="h-4 w-16 bg-primary-300 dark:bg-primary-600 rounded" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-6 w-20 bg-gradient-to-r from-primary-200 to-green-200 dark:from-primary-700 dark:to-green-700 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            {/* Filter Sidebar Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
              {[1, 2, 3, 4, 5].map((section) => (
                <div
                  key={section}
                  className="space-y-3"
                  style={{ animationDelay: `${section * 0.1}s` }}
                >
                  <div className="flex items-center gap-2 animate-pulse">
                    <div className="h-4 w-4 bg-primary-300 dark:bg-primary-600 rounded" />
                    <div className="h-5 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
                  </div>
                  <div className="space-y-2 ml-2">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 animate-pulse"
                        style={{ animationDelay: `${item * 0.05}s` }}
                      >
                        <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded" />
                        <div className="h-3 w-20 bg-gray-250 dark:bg-gray-650 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            {/* Sort / View Bar Skeleton */}
            <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center gap-2 animate-pulse">
                  <div className="h-4 w-4 bg-primary-400 rounded animate-bounce" />
                  <div className="h-5 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
                </div>
                <div className="flex items-center text-primary-600 animate-pulse">
                  <div className="h-4 w-4 bg-primary-400 rounded-full animate-spin mr-2" />
                  <div className="h-4 w-20 bg-primary-300 rounded" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                <div className="h-10 w-32 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse" />
              </div>
            </div>
            {/* Products Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, idx) => (
                <div
                  key={idx}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 relative"
                  style={{
                    animationDelay: `${idx * 150}ms`,
                    animation: "fadeInUp 0.6s ease-out forwards",
                  }}
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  <div className="relative aspect-square bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-700 dark:to-gray-600 overflow-hidden" />
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-20 bg-gradient-to-r from-green-200 to-green-300 dark:from-green-700 dark:to-green-600 rounded-full animate-pulse" />
                      <div
                        className="h-5 w-12 bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-600 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="h-5 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded-lg animate-pulse" />
                      <div
                        className="h-4 w-3/4 bg-gradient-to-r from-gray-250 via-gray-350 to-gray-250 dark:from-gray-650 dark:via-gray-550 dark:to-gray-650 rounded animate-pulse"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className="w-4 h-4 bg-yellow-200 dark:bg-yellow-700 rounded animate-pulse"
                            style={{ animationDelay: `${star * 0.1}s` }}
                          />
                        ))}
                      </div>
                      <div
                        className="h-3 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
                        style={{ animationDelay: "0.8s" }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-7 w-24 bg-gradient-to-r from-primary-200 to-primary-300 dark:from-primary-700 dark:to-primary-600 rounded-lg animate-pulse" />
                        <div
                          className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                      <div className="text-right space-y-1">
                        <div
                          className="h-4 w-20 bg-green-200 dark:bg-green-700 rounded animate-pulse"
                          style={{ animationDelay: "0.6s" }}
                        />
                        <div
                          className="h-3 w-14 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
                          style={{ animationDelay: "0.7s" }}
                        />
                      </div>
                    </div>
                    <div
                      className="h-10 bg-gradient-to-r from-primary-300 via-primary-400 to-primary-300 dark:from-primary-600 dark:via-primary-700 dark:to-primary-600 rounded-lg animate-pulse"
                      style={{ animationDelay: "0.9s" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination Skeleton */}
            <div className="flex justify-center items-center space-x-2 mt-8">
              <div className="h-10 w-20 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse" />
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((page) => (
                  <div
                    key={page}
                    className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"
                    style={{ animationDelay: `${page * 0.1}s` }}
                  />
                ))}
              </div>
              <div className="h-10 w-16 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
