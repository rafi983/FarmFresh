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
    if (product.stock === 0)
      return {
        status: "Out of Stock",
        color: "red",
        icon: "fas fa-times-circle",
      };
    if (product.stock <= 5)
      return {
        status: "Low Stock",
        color: "yellow",
        icon: "fas fa-exclamation-triangle",
      };
    return { status: "In Stock", color: "green", icon: "fas fa-check-circle" };
  };

  const stockInfo = getStockStatus();

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full border border-gray-100 dark:border-gray-700 w-full transform hover:-translate-y-2 hover:scale-[1.02]">
      {/* Product Image Section */}
      <div className="relative h-56 bg-gradient-to-br from-primary-50 via-gray-50 to-primary-100 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center opacity-60 group-hover:opacity-80 transition-opacity duration-300">
              <div className="w-20 h-20 bg-primary-100 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-seedling text-3xl text-primary-600 dark:text-primary-400"></i>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                No Image Available
              </p>
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

        {/* Status Badge - Top Right */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            {getProductStatusBadge(product)}
          </div>
        </div>

        {/* Stock Status Badge - Top Left */}
        <div className="absolute top-4 left-4 z-10">
          <div
            className={`flex items-center px-3 py-2 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
              stockInfo.color === "red"
                ? "bg-red-500/90 text-white"
                : stockInfo.color === "yellow"
                  ? "bg-yellow-500/90 text-white"
                  : "bg-green-500/90 text-white"
            }`}
          >
            <i className={`${stockInfo.icon} mr-1.5`}></i>
            {stockInfo.status}
          </div>
        </div>

        {/* Category Badge - Bottom Left */}
        <div className="absolute bottom-4 left-4">
          <span className="px-4 py-2 bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-full backdrop-blur-sm shadow-lg border border-white/20">
            <i className="fas fa-tag mr-2 text-primary-600"></i>
            {product.category || "Uncategorized"}
          </span>
        </div>

        {/* Price Badge - Bottom Right */}
        <div className="absolute bottom-4 right-4">
          <div className="bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg">
            <span className="text-lg font-bold">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Product Information Section */}
      <div className="p-6 flex-grow flex flex-col">
        {/* Product Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
          {product.name}
        </h3>

        {/* Farmer Information */}
        <div className="flex items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3">
            <i className="fas fa-user text-primary-600 dark:text-primary-400"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {getFarmerName()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Product Owner
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-grow leading-relaxed">
          {product.description ||
            "Fresh and quality product from our trusted farmer. Perfect for your daily needs and healthy lifestyle."}
        </p>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Stock Info */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-3 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {product.stock}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              Units Available
            </div>
          </div>

          {/* Rating */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-3 rounded-xl text-center">
            {product.averageRating ? (
              <>
                <div className="flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                  <i className="fas fa-star mr-1"></i>
                  <span className="text-lg font-bold">
                    {product.averageRating.toFixed(1)}
                  </span>
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                  Rating
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-gray-500 dark:text-gray-400">
                  --
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  No Rating
                </div>
              </>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <span className="flex items-center">
            <i className="fas fa-calendar-plus mr-2 text-primary-500"></i>
            Added {new Date(product.createdAt).toLocaleDateString()}
          </span>
          <span className="flex items-center">
            <i className="fas fa-clock mr-2 text-primary-500"></i>
            {product.unit || "unit"}
          </span>
        </div>
      </div>

      {/* Enhanced Action Buttons Section */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
        <div className="flex flex-col space-y-3">
          {/* Top Row - View and Edit */}
          <div className="flex space-x-3">
            <Link
              href={`/details?id=${product._id}`}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              title="View Product Details"
            >
              <i className="fas fa-eye"></i>
              <span>View Details</span>
            </Link>

            <Link
              href={`/edit/${product._id}`}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              title="Edit Product"
            >
              <i className="fas fa-edit"></i>
              <span>Edit</span>
            </Link>
          </div>

          {/* Bottom Row - Status and Delete */}
          <div className="flex space-x-3">
            <button
              onClick={() => handleStatusToggle(product._id, product.status)}
              disabled={actionLoading[product._id] === "status"}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                product.status === "active"
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-900"
                  : "bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-green-900"
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
                    {product.status === "active" ? "Pause" : "Activate"}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDeleteProduct(product._id)}
              disabled={actionLoading[product._id] === "delete"}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
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
        </div>
      </div>
    </div>
  );
}
