// components/dashboard/ProductCard.js
import Image from "next/image";
import Link from "next/link";

export default function ProductCard({
                                        product,
                                        handleStatusToggle,
                                        handleDeleteProduct,
                                        actionLoading,
                                        getProductStatusBadge,
                                        formatPrice
                                    }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                {product.images && product.images.length > 0 ? (
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700">
                        <i className="fas fa-seedling text-4xl text-gray-400 dark:text-gray-500"></i>
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    {getProductStatusBadge(product)}
                </div>
            </div>

            <div className="p-4 flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                    {product.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <i className="fas fa-tag mr-1"></i>
                    <span>{product.category || "Uncategorized"}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {product.description || "No description available"}
                </p>
                <div className="flex justify-between items-center mb-3">
          <span className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatPrice(product.price)}
          </span>
                    <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
            Stock: {product.stock}
          </span>
                </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleStatusToggle(product._id, product.status)}
                            disabled={actionLoading[product._id] === "status"}
                            className={`px-3 py-1.5 rounded ${
                                product.status === "active"
                                    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                                    : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            }`}
                        >
                            {actionLoading[product._id] === "status" ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : product.status === "active" ? (
                                <i className="fas fa-pause"></i>
                            ) : (
                                <i className="fas fa-play"></i>
                            )}
                        </button>
                        <button
                            onClick={() => handleDeleteProduct(product._id)}
                            disabled={actionLoading[product._id] === "delete"}
                            className="px-3 py-1.5 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                        >
                            {actionLoading[product._id] === "delete" ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fas fa-trash-alt"></i>
                            )}
                        </button>
                    </div>
                    <Link
                        href={`/edit/${product._id}`}
                        className="px-3 py-1.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                        <i className="fas fa-edit"></i>
                    </Link>
                </div>
            </div>
        </div>
    );
}