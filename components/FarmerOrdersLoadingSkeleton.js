"use client";

export default function FarmerOrdersLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {/* Custom CSS animations for farmer orders */}
      <style jsx>{`
        @keyframes orderPulse {
          0%,
          100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes orderBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
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

        @keyframes statusWave {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes customerFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(1deg);
          }
        }

        .animate-order-pulse {
          animation: orderPulse 2s ease-in-out infinite;
        }

        .animate-order-bounce {
          animation: orderBounce 2.5s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-status-wave {
          animation: statusWave 2s ease-in-out infinite;
        }

        .animate-customer-float {
          animation: customerFloat 3s ease-in-out infinite;
        }
      `}</style>

      {/* Breadcrumb Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
              </li>
              <li>
                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              </li>
              <li>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
              </li>
              <li>
                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              </li>
              <li>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
              </li>
            </ol>
          </nav>

          {/* Real-time Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-8 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Enhanced Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-green-200 to-blue-200 dark:from-green-700 dark:to-blue-700 p-4 rounded-2xl animate-order-bounce">
              <div className="w-8 h-8 bg-white/20 rounded"></div>
            </div>
            <div>
              <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-80 animate-order-pulse mb-2"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-96 animate-pulse mb-2"></div>
              <div className="flex items-center space-x-4">
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                <div className="h-5 bg-green-200 dark:bg-green-700 rounded-full w-24 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 dark:bg-gray-600 rounded-lg w-32 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Enhanced Order Summary Cards - 6 cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { color: "gray", delay: 0 },
            { color: "yellow", delay: 100 },
            { color: "blue", delay: 200 },
            { color: "purple", delay: 300 },
            { color: "green", delay: 400 },
            { color: "red", delay: 500 },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 transform hover:scale-105 transition-transform duration-200 animate-order-bounce overflow-hidden"
              style={{ animationDelay: `${stat.delay}ms` }}
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-gray-600/20 to-transparent animate-shimmer"></div>

              <div className="flex items-center">
                <div
                  className={`p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900 rounded-lg animate-status-wave`}
                >
                  <div
                    className={`w-4 h-4 bg-${stat.color}-600 dark:bg-${stat.color}-300 rounded`}
                  ></div>
                </div>
                <div className="ml-3">
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12 animate-pulse mb-1"></div>
                  <div
                    className={`h-6 bg-${stat.color}-200 dark:bg-${stat.color}-700 rounded w-8 animate-order-pulse`}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-64 animate-order-pulse mb-4 lg:mb-0"></div>

            {/* View Mode Toggle */}
            <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-200 dark:bg-gray-600 rounded-md w-20 animate-pulse"
                  style={{ animationDelay: `${i * 50}ms` }}
                ></div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse mb-2"></div>
              <div className="relative">
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="absolute left-3 top-3 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse mb-2"></div>
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>

            {/* Sort By */}
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse mb-2"></div>
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>

            {/* Date From */}
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse mb-2"></div>
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>

            {/* Date To */}
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse mb-2"></div>
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <div className="h-10 bg-gray-600 dark:bg-gray-500 rounded-lg w-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Select All Checkbox */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48 ml-2 animate-pulse"></div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transform hover:scale-[1.01] transition-all duration-200 animate-order-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-gray-600/20 to-transparent animate-shimmer"></div>

                <div className="p-6">
                  {/* Order Header with Checkbox */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                      <div>
                        <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-32 animate-order-pulse mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-40 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="h-8 bg-gradient-to-r from-green-200 to-blue-200 dark:from-green-700 dark:to-blue-700 rounded-full w-24 animate-status-wave"></div>
                      <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-16 animate-order-pulse"></div>
                    </div>
                  </div>

                  {/* Customer & Delivery Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-32 animate-pulse mb-3"></div>
                      <div className="space-y-2">
                        {[...Array(3)].map((_, idx) => (
                          <div key={idx} className="flex">
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12 animate-pulse mr-2"></div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-36 animate-pulse mb-3"></div>
                      <div className="space-y-2">
                        {[...Array(4)].map((_, idx) => (
                          <div key={idx} className="flex">
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse mr-2"></div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Order Items Section */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mb-6">
                    <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-28 animate-pulse mb-4"></div>

                    <div className="space-y-3">
                      {[...Array(2)].map((_, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-order-bounce"
                          style={{ animationDelay: `${itemIndex * 100}ms` }}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-green-200 dark:from-orange-700 dark:to-green-700 rounded-lg animate-order-bounce"></div>
                            <div>
                              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse mb-1"></div>
                              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-20 animate-pulse mb-1"></div>
                              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                            </div>
                          </div>
                          <div>
                            <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex flex-wrap gap-3">
                      {[...Array(3)].map((_, btnIndex) => (
                        <div
                          key={btnIndex}
                          className="h-10 bg-gradient-to-r from-blue-200 to-green-200 dark:from-blue-700 dark:to-green-700 rounded-lg w-24 animate-pulse"
                          style={{ animationDelay: `${btnIndex * 75}ms` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-12">
          <nav aria-label="Pagination">
            <ul className="inline-flex items-center -space-x-px">
              <li>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-l-lg animate-pulse"></div>
              </li>
              {[...Array(5)].map((_, i) => (
                <li key={i}>
                  <div
                    className="w-10 h-10 bg-gray-200 dark:bg-gray-600 animate-pulse"
                    style={{ animationDelay: `${i * 50}ms` }}
                  ></div>
                </li>
              ))}
              <li>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-r-lg animate-pulse"></div>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
