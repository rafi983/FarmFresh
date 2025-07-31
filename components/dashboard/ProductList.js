// components/dashboard/ProductList.js
import Link from "next/link";

export default function ProductList({
                                        products,
                                        handleStatusToggle,
                                        handleDeleteProduct,
                                        actionLoading,
                                        getProductStatusBadge,
                                        formatPrice,
                                        formatDate
                                    }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date Added
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 mr-3">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <i className="fas fa-seedling text-gray-400"></i>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {product.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {product.category || "Uncategorized"}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                {formatPrice(product.price)}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.stock > 10
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : product.stock > 0
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}>
                  {product.stock} in stock
                </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {getProductStatusBadge(product)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(product.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => handleStatusToggle(product._id, product.status)}
                                    disabled={actionLoading[product._id] === "status"}
                                    className={`px-2 py-1 rounded ${
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
                                <Link
                                    href={`/edit/${product._id}`}
                                    className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                >
                                    <i className="fas fa-edit"></i>
                                </Link>
                                <button
                                    onClick={() => handleDeleteProduct(product._id)}
                                    disabled={actionLoading[product._id] === "delete"}
                                    className="px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
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
                ))}
                </tbody>
            </table>
        </div>
    );
}