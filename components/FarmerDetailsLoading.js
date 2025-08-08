const FarmerDetailsLoading = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="animate-pulse">
        {/* Farmer Breadcrumb Skeleton */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
        </nav>

        {/* Customer View Notice Skeleton */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-4 bg-blue-300 dark:bg-blue-600 rounded w-6"></div>
              <div className="h-4 bg-blue-300 dark:bg-blue-600 rounded w-48"></div>
            </div>
            <div className="h-8 bg-blue-600 rounded-lg w-32"></div>
          </div>
        </div>

        {/* Farmer Product Management Header Skeleton */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-green-400/30 rounded w-64 mb-2"></div>
              <div className="h-4 bg-green-400/20 rounded w-48"></div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-green-400/20 rounded w-24 mb-2"></div>
              <div className="h-6 bg-green-100 rounded-full w-20"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Product Images & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Management Section Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                <div className="h-8 bg-blue-600 rounded-lg w-28"></div>
              </div>
              <div className="space-y-4">
                <div className="aspect-video max-w-md bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                <div className="grid grid-cols-5 gap-2 max-w-md">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-300 dark:bg-gray-600 rounded-lg"
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Information Section Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-40"></div>
                <div className="h-8 bg-blue-600 rounded-lg w-24"></div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-1"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-1"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  </div>
                </div>
                <div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-1"></div>
                  <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>

            {/* Quick Updates Section Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                      <div className="h-10 bg-green-600 rounded-lg w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders Section Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-28 mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Analytics & Actions */}
          <div className="space-y-6">
            {/* Performance Stats Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              </div>
              <div className="space-y-4">
                {/* Performance metric cards */}
                {[
                  { color: "blue", label: "Total Sales" },
                  { color: "green", label: "Total Revenue" },
                  { color: "yellow", label: "Average Rating" },
                  { color: "purple", label: "Total Reviews" },
                  { color: "orange", label: "Avg. Order Value" },
                  { color: "indigo", label: "Total Orders" },
                ].map((metric, i) => (
                  <div
                    key={i}
                    className={`text-center p-4 bg-${metric.color}-50 dark:bg-${metric.color}-900/20 rounded-lg`}
                  >
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mx-auto"></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48 mx-auto"></div>
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default FarmerDetailsLoading;
