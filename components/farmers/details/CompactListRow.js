"use client";
import { getDisplayRating, formatPrice } from "./utils";

export default function CompactListRow({ product, index }) {
  return (
    <div
      className="group flex items-center py-4 px-6 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden mr-4">
        <img
          src={product.images?.[0] || "/placeholder-product.jpg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute -top-1 -right-1">
          <div
            className={`w-3 h-3 rounded-full border-2 border-white ${product.stock > 0 ? "bg-green-500" : "bg-red-500"}`}
          ></div>
        </div>
      </div>
      <div className="flex-1 min-w-0 mr-4">
        <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {product.category}
        </p>
      </div>
      <div className="hidden sm:flex items-center mr-4">
        {getDisplayRating(product) > 0 ? (
          <>
            <div className="flex text-yellow-400 mr-1">
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={`fas fa-star text-xs ${i < Math.floor(getDisplayRating(product)) ? "text-yellow-400" : "text-gray-300"}`}
                ></i>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">
              ({getDisplayRating(product).toFixed(1)}) •{" "}
              {product.reviews?.length || product.reviewCount || 0} review
              {(product.reviews?.length || product.reviewCount || 0) !== 1
                ? "s"
                : ""}
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-400">No ratings yet</span>
        )}
      </div>
      <div className="hidden md:block mr-4">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${product.stock > 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}
        >
          {product.stock > 0 ? `${product.stock} left` : "Out of stock"}
        </span>
      </div>
      <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400 mr-4">
        {formatPrice(product.price)}
      </div>
      <button
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${product.stock > 0 ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
        disabled={product.stock === 0}
      >
        {product.stock > 0 ? "Add" : "Out"}
      </button>
    </div>
  );
}
