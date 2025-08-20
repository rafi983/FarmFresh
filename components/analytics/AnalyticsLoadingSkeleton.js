"use client";

export default function AnalyticsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Custom CSS animations for analytics */}
      <style jsx>{`
        @keyframes analyticsShimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes chartPulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes cardFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-analytics-shimmer {
          animation: analyticsShimmer 2s infinite;
        }

        .animate-chart-pulse {
          animation: chartPulse 2s ease-in-out infinite;
        }

        .animate-card-float {
          animation: cardFloat 3s ease-in-out infinite;
        }
      `}</style>

      {/* Enhanced Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 shadow-2xl border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="h-12 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded-xl w-96 animate-chart-pulse mb-2"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-80 animate-pulse"></div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Chart Type Selector Skeleton */}
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-20 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  ></div>
                ))}
              </div>

              {/* Time Range Selector Skeleton */}
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-16 animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              color: "from-green-50 to-green-100",
              darkColor: "dark:from-green-900/20 dark:to-green-800/20",
              borderColor: "border-green-200 dark:border-green-700",
            },
            {
              color: "from-blue-50 to-blue-100",
              darkColor: "dark:from-blue-900/20 dark:to-blue-800/20",
              borderColor: "border-blue-200 dark:border-blue-700",
            },
            {
              color: "from-purple-50 to-purple-100",
              darkColor: "dark:from-purple-900/20 dark:to-purple-800/20",
              borderColor: "border-purple-200 dark:border-purple-700",
            },
            {
              color: "from-orange-50 to-orange-100",
              darkColor: "dark:from-orange-900/20 dark:to-orange-800/20",
              borderColor: "border-orange-200 dark:border-orange-700",
            },
            {
              color: "from-pink-50 to-pink-100",
              darkColor: "dark:from-pink-900/20 dark:to-pink-800/20",
              borderColor: "border-pink-200 dark:border-pink-700",
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${card.color} ${card.darkColor} rounded-3xl p-6 shadow-xl border ${card.borderColor} animate-card-float`}
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-3 animate-pulse"></div>
                  <div className="h-8 bg-gray-400 dark:bg-gray-500 rounded w-16 mb-2 animate-chart-pulse"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                </div>
                <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-2xl">
                  <div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-card-float"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex items-center mb-6">
                <div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded mr-3 animate-pulse"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 animate-pulse"></div>
              </div>
              <div className="relative h-96 bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden">
                {/* Chart skeleton with animated elements */}
                <div className="absolute inset-0 flex items-end justify-around p-4">
                  {[...Array(8)].map((_, j) => (
                    <div
                      key={j}
                      className="bg-gray-300 dark:bg-gray-600 rounded-t animate-chart-pulse"
                      style={{
                        height: `${Math.random() * 60 + 20}%`,
                        width: "8%",
                        animationDelay: `${j * 100}ms`,
                      }}
                    ></div>
                  ))}
                </div>
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-analytics-shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
