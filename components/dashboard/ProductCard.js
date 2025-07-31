// components/dashboard/ProductCard.js
import Image from "next/image";
import Link from "next/link";

export default function ProductCard({
  product,
  handleStatusToggle,
  handleDeleteProduct,
  actionLoading,
  getProductStatusBadge,
  formatPrice,
}) {
  // Get farmer ID for the redirect
  const getFarmerId = () => {
    return product.farmerId || product.farmer?.id || product.farmer?._id;
  };

  // Get farmer name
  const getFarmerName = () => {
    return product.farmer?.name || product.farmerName || "Unknown Farmer";
  };

  // Calculate stock status
  const getStockStatus = () => {
    if (product.stock === 0) return { status: "Out of Stock", color: "red" };
    if (product.stock <= 5) return { status: "Low Stock", color: "yellow" };
    return { status: "In Stock", color: "green" };
  };

  const stockInfo = getStockStatus();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-100 dark:border-gray-700 w-full">
      {/* Product Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <i className="fas fa-seedling text-5xl text-gray-400 dark:text-gray-500 mb-2"></i>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No Image
              </p>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {getProductStatusBadge(product)}
        </div>

        {/* Stock Status Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              stockInfo.color === "red"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : stockInfo.color === "yellow"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            }`}
          >
            {stockInfo.status}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="px-3 py-1 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
            {product.category || "Uncategorized"}
          </span>
        </div>
      </div>

      {/* Product Information Section */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Product Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Farmer Information */}
        <div className="flex items-center mb-3 text-sm text-gray-600 dark:text-gray-400">
          <i className="fas fa-user-circle mr-2 text-blue-500"></i>
          <span className="font-medium">{getFarmerName()}</span>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-grow">
          {product.description ||
            "Fresh and quality product from our trusted farmer. Perfect for your daily needs."}
        </p>

        {/* Price and Stock Info */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(product.price)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                per unit
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {product.stock}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                units left
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <i className="fas fa-calendar-plus mr-1"></i>
              Added {new Date(product.createdAt).toLocaleDateString()}
            </span>
            {product.averageRating && (
              <span className="flex items-center">
                <i className="fas fa-star text-yellow-400 mr-1"></i>
                {product.averageRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Section - Optimized Layout */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-col space-y-2">
          {/* Top Row - Status and Delete */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusToggle(product._id, product.status)}
              disabled={actionLoading[product._id] === "status"}
              className={`flex-1 px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center space-x-1 ${
                product.status === "active"
                  ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
                  : "bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
              }`}
              title={
                product.status === "active"
                  ? "Deactivate Product"
                  : "Activate Product"
              }
            >
              {actionLoading[product._id] === "status" ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i
                    className={
                      product.status === "active"
                        ? "fas fa-pause"
                        : "fas fa-play"
                    }
                  ></i>
                  <span>
                    {product.status === "active" ? "Pause" : "Active"}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDeleteProduct(product._id)}
              disabled={actionLoading[product._id] === "delete"}
              className="flex-1 px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 font-medium text-xs transition-all duration-200 flex items-center justify-center space-x-1"
              title="Delete Product"
            >
              {actionLoading[product._id] === "delete" ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fas fa-trash-alt"></i>
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom Row - View and Edit */}
          <div className="flex space-x-2">
            <Link
              href={`/details?id=${product._id}`}
              className="flex-1 px-3 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 font-medium text-xs transition-all duration-200 flex items-center justify-center space-x-1"
              title="View Product Details"
            >
              <i className="fas fa-eye"></i>
              <span>View</span>
            </Link>

            <Link
              href={`/edit/${product._id}`}
              className="flex-1 px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 font-medium text-xs transition-all duration-200 flex items-center justify-center space-x-1"
              title="Edit Product"
            >
              <i className="fas fa-edit"></i>
              <span>Edit</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
