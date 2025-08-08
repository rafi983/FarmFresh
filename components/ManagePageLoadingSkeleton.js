"use client";

export default function ManagePageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Custom CSS animations for manage page */}
      <style jsx>{`
        @keyframes dashboardPulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes chartBounce {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
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

        @keyframes floatAnimation {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes tabSlide {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(2px);
          }
        }

        .animate-dashboard-pulse {
          animation: dashboardPulse 2s ease-in-out infinite;
        }

        .animate-chart-bounce {
          animation: chartBounce 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-float {
          animation: floatAnimation 3s ease-in-out infinite;
        }

        .animate-tab-slide {
          animation: tabSlide 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* DashboardHeader - matches the actual component */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="h-9 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-56 animate-dashboard-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-80 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded-lg w-24 animate-pulse flex items-center px-4">
                <div className="w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded mr-2"></div>
                <div className="h-4 bg-gray-400 dark:bg-gray-500 rounded flex-1"></div>
              </div>
              {/* Add Product Button */}
              <div className="h-10 bg-green-200 dark:bg-green-700 rounded-lg w-32 animate-pulse flex items-center px-4">
                <div className="w-4 h-4 bg-green-400 dark:bg-green-500 rounded mr-2"></div>
                <div className="h-4 bg-green-400 dark:bg-green-500 rounded flex-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NavigationTabs - matches the actual component */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { label: "Dashboard", icon: "fa-chart-line" },
              { label: "Products", icon: "fa-box", hasCount: true },
              { label: "Orders", icon: "fa-clipboard-list", hasCount: true },
              { label: "Analytics", icon: "fa-chart-bar" },
              { label: "Settings", icon: "fa-cog" },
            ].map((tab, i) => (
              <div
                key={i}
                className="flex items-center py-4 px-1 border-b-2 border-transparent animate-tab-slide"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded mr-2 animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                {tab.hasCount && (
                  <div className="ml-2 h-5 bg-gray-100 dark:bg-gray-700 rounded-full w-8 animate-pulse"></div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area - matches DashboardTab layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Today's Overview Banner */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="h-8 bg-white/20 rounded w-64 animate-dashboard-pulse mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-80 animate-pulse"></div>
              </div>
              <div className="text-right">
                <div className="h-3 bg-white/10 rounded w-20 animate-pulse mb-1"></div>
                <div className="h-5 bg-white/20 rounded w-24 animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Orders Today" },
                { label: "Revenue Today" },
                { label: "New Customers" },
                { label: "Top Product" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/10 rounded-lg p-4"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white/20 rounded mr-3 animate-pulse"></div>
                    <div>
                      <div className="h-6 bg-white/20 rounded w-8 animate-dashboard-pulse mb-1"></div>
                      <div className="h-3 bg-white/10 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items & Quick Farm Tools - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action Items */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-orange-200 dark:bg-orange-700 rounded mr-2 animate-pulse"></div>
                  <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-24 animate-dashboard-pulse"></div>
                </div>
                <div className="h-6 bg-red-100 dark:bg-red-900 rounded-full w-16 animate-pulse"></div>
              </div>

              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-l-4 border-red-400 animate-float"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="w-5 h-5 bg-red-400 rounded mr-3 mt-1 animate-pulse"></div>
                        <div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse mb-1"></div>
                          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-red-400 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Farm Tools - 2x2 Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-5 h-5 bg-blue-200 dark:bg-blue-700 rounded mr-2 animate-pulse"></div>
                <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-32 animate-dashboard-pulse"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { color: "green", label: "Add Product" },
                  { color: "blue", label: "Bulk Update" },
                  { color: "purple", label: "Process Orders" },
                  { color: "orange", label: "Refresh Data" },
                ].map((tool, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center p-4 bg-${tool.color}-50 dark:bg-${tool.color}-900/20 rounded-lg animate-chart-bounce`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div
                      className={`w-8 h-8 bg-${tool.color}-200 dark:bg-${tool.color}-700 rounded mb-2 animate-pulse`}
                    ></div>
                    <div
                      className={`h-3 bg-${tool.color}-300 dark:bg-${tool.color}-600 rounded w-16 animate-pulse`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Farm Activity & Farm Tips - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Farm Activity - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-5 h-5 bg-green-200 dark:bg-green-700 rounded mr-2 animate-pulse"></div>
                <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-36 animate-dashboard-pulse"></div>
              </div>

              <div className="space-y-4 max-h-80 overflow-y-auto">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-float"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-4 h-4 bg-green-400 rounded mt-1 animate-pulse"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48 animate-pulse mb-1"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-32 animate-pulse mb-1"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                    <div className="h-5 bg-yellow-100 dark:bg-yellow-900 rounded-full w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Farm Tips - Takes 1 column */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-5 h-5 bg-yellow-200 dark:bg-yellow-700 rounded mr-2 animate-pulse"></div>
                <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-20 animate-dashboard-pulse"></div>
              </div>

              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-float"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="flex items-start">
                      <div className="w-5 h-5 bg-yellow-400 rounded mr-3 mt-1 animate-pulse"></div>
                      <div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse mb-1"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-32 animate-pulse mb-1"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Growth Tip */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 animate-float">
                  <div className="flex items-center mb-2">
                    <div className="w-4 h-4 bg-blue-400 rounded mr-2 animate-pulse"></div>
                    <div className="h-4 bg-blue-300 dark:bg-blue-600 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-blue-200 dark:bg-blue-700 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-blue-200 dark:bg-blue-700 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
