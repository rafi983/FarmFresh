"use client";
import { getDisplayRating, formatPrice } from "./utils";

export default function GridTile({ product, index }) {
  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 hover:shadow-lg transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <img
        src={product.images?.[0] || "/placeholder-product.jpg"}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
        <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-2 py-1 rounded text-xs font-medium">
          {product.category}
        </span>
        <div
          className={`w-3 h-3 rounded-full ${product.stock > 0 ? "bg-green-400" : "bg-red-400"}`}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-bold text-lg mb-1 truncate">{product.name}</h3>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {getDisplayRating(product) > 0 ? (
              <>
                <div className="flex text-yellow-400 mr-1">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star text-xs ${i < Math.floor(getDisplayRating(product)) ? "text-yellow-400" : "text-white/50"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-white/80">
                  ({getDisplayRating(product).toFixed(1)}) •{" "}
                  {product.reviews?.length || product.reviewCount || 0} review
                  {(product.reviews?.length || product.reviewCount || 0) !== 1
                    ? "s"
                    : ""}
                </span>
              </>
            ) : (
              <span className="text-xs text-white/60">No ratings yet</span>
            )}
          </div>
          <span className="font-bold text-xl">
            {formatPrice(product.price)}
          </span>
        </div>
        <button
          className={`w-full py-2 rounded font-medium transition-all ${product.stock > 0 ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-gray-600 text-gray-300 cursor-not-allowed"}`}
          disabled={product.stock === 0}
        >
          {product.stock > 0 ? "Add to Cart" : "Sold Out"}
        </button>
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex gap-2">
          <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110">
            <i className="fas fa-eye text-sm" />
          </button>
          <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110">
            <i className="fas fa-heart text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
