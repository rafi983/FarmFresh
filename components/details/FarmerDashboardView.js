// filepath: components/details/FarmerDashboardView.js
"use client";
import Link from "next/link";
import Image from "next/image";
import StarRating from "@/components/StarRating";
import RecentOrdersSection from "@/components/RecentOrdersSection";

// Farmer dashboard (owner) view extracted from original details/page.js
export default function FarmerDashboardView({
  product,
  productId,
  imageData,
  selectedImage,
  setSelectedImage,
  recentOrders,
  loadingOrders,
  formatPrice,
  // New management props
  stockUpdate,
  priceUpdate,
  setStockUpdate,
  setPriceUpdate,
  handleUpdateProduct,
  handleAddImages,
  handleToggleStatus,
  handleDeleteProduct,
  isManagingProduct,
}) {
  if (!product) return null;
  return (
    <>
      {/* Farmer Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <Link href="/manage" className="hover:text-primary-600">
              <i className="fas fa-tachometer-alt mr-1"></i>
              Dashboard
            </Link>
          </li>
          <li>
            <i className="fas fa-chevron-right text-xs"></i>
          </li>
          <li>
            <span className="text-gray-900 dark:text-white">
              {product.name} - Management
            </span>
          </li>
        </ol>
      </nav>

      {/* Customer View Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mr-2"></i>
            <span className="text-blue-800 dark:text-blue-200">
              You are viewing this as the product owner.
            </span>
          </div>
          <Link
            href={`/details?id=${productId}&view=customer`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <i className="fas fa-eye mr-1"></i>
            View as Customer
          </Link>
        </div>
      </div>

      {/* Product Management Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Product Management</h1>
            <p className="text-green-100">
              Manage your product listing and inventory
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-100 mb-1">Product Status</div>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${product.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              <i
                className={`fas ${product.status === "active" ? "fa-check-circle" : "fa-times-circle"} mr-1`}
              ></i>
              {product.status === "active" ? "Active" : "Inactive"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Images & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Management */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Product Images
              </h3>
            </div>
            {(() => {
              const allImages = imageData.allImages;
              return allImages.length > 0 ? (
                <div className="space-y-4">
                  <div className="aspect-video max-w-md bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Image
                      src={allImages[selectedImage]}
                      alt={product.name}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {allImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-2 max-w-md">
                      {allImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 ${selectedImage === index ? "border-primary-500" : "border-gray-300 dark:border-gray-600"}`}
                        >
                          <Image
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <i className="fas fa-image text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600 dark:text-gray-400">
                    No images uploaded
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Product Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Product Information
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {product.category}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Price
                  </span>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatPrice(product.price)} per {product.unit || "kg"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Stock
                  </span>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {product.stock} {product.unit || "kg"}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </span>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  {product.description || "No description provided."}
                </p>
              </div>
              {product.features && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Features
                  </span>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-1">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <RecentOrdersSection
            recentOrders={recentOrders}
            loadingOrders={loadingOrders}
            product={product}
          />
        </div>

        {/* Sidebar - Analytics & Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performance
              </h3>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Real-time data
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <i className="fas fa-chart-line text-blue-600"></i>
                  <span className="text-2xl font-bold text-blue-600">
                    {product.performanceMetrics?.totalSales || 0}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Sales
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(product.performanceMetrics?.totalRevenue || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Revenue
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {(product.averageRating || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average Rating
                </div>
                <div className="flex justify-center mt-1">
                  <StarRating rating={product.averageRating || 0} size="sm" />
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {product.reviewCount || product.totalReviews || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Reviews
                </div>
              </div>
              {product.performanceMetrics?.averageOrderValue > 0 && (
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatPrice(product.performanceMetrics.averageOrderValue)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avg. Order Value
                  </div>
                </div>
              )}
              {product.performanceMetrics?.totalOrders > 0 && (
                <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {product.performanceMetrics.totalOrders}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Orders
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {product.performanceMetrics?.totalSales > 0
                  ? "Your product is performing well!"
                  : "Start promoting your product to get your first sale!"}
              </div>
            </div>
          </div>
          {/* New Management Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Manage Listing
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Update Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockUpdate}
                    onChange={(e) => setStockUpdate(e.target.value)}
                    placeholder={String(product.stock)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Update Price (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceUpdate}
                    onChange={(e) => setPriceUpdate(e.target.value)}
                    placeholder={String(product.price)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleUpdateProduct}
                  disabled={isManagingProduct || (!stockUpdate && !priceUpdate)}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {isManagingProduct ? (
                    <i className="fas fa-spinner fa-spin mr-2" />
                  ) : (
                    <i className="fas fa-save mr-2" />
                  )}
                  Save Changes
                </button>
                <button
                  onClick={handleAddImages}
                  disabled={isManagingProduct}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  <i className="fas fa-images mr-2" />
                  Add Images
                </button>
                <button
                  onClick={handleToggleStatus}
                  disabled={isManagingProduct}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50"
                >
                  <i className="fas fa-sync mr-2" />
                  {product.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={isManagingProduct}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  <i className="fas fa-trash mr-2" />
                  Delete
                </button>
              </div>
              {isManagingProduct && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <i className="fas fa-circle-notch fa-spin mr-2" /> Processing
                  changes...
                </p>
              )}
            </div>
          </div>
          {/* Existing navigation actions card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/create"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Product
              </Link>
              <Link
                href="/manage"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <i className="fas fa-cog mr-2"></i>
                Manage Orders
              </Link>
              <Link
                href="/farmer-orders"
                className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition flex items-center justify-center"
              >
                <i className="fas fa-clipboard-list mr-2"></i>
                View My Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
