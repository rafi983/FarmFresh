// components/dashboard/ProductList.js
import Link from "next/link";

export default function ProductList({
  products,
  handleStatusToggle,
  handleDeleteProduct,
  actionLoading,
  getProductStatusBadge,
  formatPrice,
  formatDate,
}) {
  // Get farmer ID for the redirect
  const getFarmerId = (product) => {
    return product.farmerId || product.farmer?.id || product.farmer?._id;
  };

  // Get farmer name
  const getFarmerName = (product) => {
    return product.farmer?.name || product.farmerName || "Unknown Farmer";
  };

  // Calculate stock status
  const getStockStatus = (stock) => {
    if (stock === 0)
      return {
        status: "Out of Stock",
        colorClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      };
    if (stock <= 5)
      return {
        status: "Low Stock",
        colorClass:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      };
    return {
      status: "In Stock",
      colorClass:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-box text-blue-500"></i>
                  <span>Product Details</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-user-tie text-purple-500"></i>
                  <span>Farmer</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-dollar-sign text-green-500"></i>
                  <span>Price</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-warehouse text-orange-500"></i>
                  <span>Stock</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-toggle-on text-indigo-500"></i>
                  <span>Status</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-calendar text-gray-500"></i>
                  <span>Date Added</span>
                </div>
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <div className="flex items-center justify-end space-x-2">
                  <i className="fas fa-cogs text-gray-500"></i>
                  <span>Actions</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {products.map((product, index) => {
              const stockInfo = getStockStatus(product.stock);
              return (
                <tr
                  key={product._id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-25 dark:bg-gray-800/50"
                  }`}
                >
                  {/* Product Details */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-16 w-16 relative">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-16 w-16 rounded-xl object-cover shadow-md border-2 border-gray-100 dark:border-gray-600"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center border-2 border-gray-100 dark:border-gray-600">
                            <i className="fas fa-seedling text-xl text-gray-400 dark:text-gray-500"></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs">
                          {product.name}
                        </div>
                        <div className="flex items-center mt-1 space-x-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <i className="fas fa-tag mr-1"></i>
                            {product.category || "Uncategorized"}
                          </span>
                          {product.averageRating && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              <i className="fas fa-star mr-1"></i>
                              {product.averageRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Farmer Information */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <i className="fas fa-user text-purple-600 dark:text-purple-300 text-sm"></i>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getFarmerName(product)}
                        </div>
                        {getFarmerId(product) && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {getFarmerId(product).slice(-8)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatPrice(product.price)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      per unit
                    </div>
                  </td>

                  {/* Stock */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="space-y-1">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${stockInfo.colorClass}`}
                      >
                        {stockInfo.status}
                      </span>
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {product.stock} units
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {getProductStatusBadge(product)}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {product.status === "active" ? "Live" : "Paused"}
                      </div>
                    </div>
                  </td>

                  {/* Date Added */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(product.createdAt)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Status Toggle */}
                      <button
                        onClick={() =>
                          handleStatusToggle(product._id, product.status)
                        }
                        disabled={actionLoading[product._id] === "status"}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
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
                          <i
                            className={
                              product.status === "active"
                                ? "fas fa-pause"
                                : "fas fa-play"
                            }
                          ></i>
                        )}
                      </button>

                      {/* View Product Details */}
                      <Link
                        href={`/details?id=${product._id}`}
                        className="px-3 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 text-sm font-medium transition-all duration-200 flex items-center"
                        title="View Product Details"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/edit/${product._id}`}
                        className="px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 text-sm font-medium transition-all duration-200 flex items-center"
                        title="Edit Product"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        disabled={actionLoading[product._id] === "delete"}
                        className="px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 text-sm font-medium transition-all duration-200 flex items-center"
                        title="Delete Product"
                      >
                        {actionLoading[product._id] === "delete" ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-trash-alt"></i>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
