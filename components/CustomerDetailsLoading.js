const CustomerDetailsLoading = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="animate-pulse">
        {/* Customer Breadcrumb Skeleton */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images Section */}
          <div className="space-y-4">
            {/* Main product image */}
            <div className="aspect-square bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>

            {/* Thumbnail images */}
            <div className="grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-300 dark:bg-gray-600 rounded-lg"
                ></div>
              ))}
            </div>
          </div>

          {/* Product Information Section */}
          <div className="space-y-6">
            {/* Category and Features badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-20"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-14"></div>
            </div>

            {/* Product Name and Farmer */}
            <div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded"
                  ></div>
                ))}
              </div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            </div>

            {/* Price and Stock Section */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-1"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-1"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>
              {/* Location */}
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded mr-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="space-y-4">
              <div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                  <div className="w-20 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
              <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
              <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Tabs Section Skeleton */}
        <div className="mt-16">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-4"
                ></div>
              ))}
            </nav>
          </div>

          <div className="py-8">
            <div className="space-y-4">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
            </div>
          </div>
        </div>

        {/* Related Products Section Skeleton */}
        <div className="mt-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-64 mx-auto mb-3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-96 mx-auto mb-4"></div>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
            </div>
          </div>

          {/* Related products grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="aspect-square bg-gray-300 dark:bg-gray-600"></div>
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, j) => (
                      <div
                        key={j}
                        className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded"
                      ></div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  </div>
                  <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default CustomerDetailsLoading;
