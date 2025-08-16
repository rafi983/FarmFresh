"use client";
import { getDisplayRating, formatPrice } from "./utils";

export default function AlternativeProductLayout({ product, index }) {
  const layoutVariants = [
    "floating-panel",
    "magazine-spread",
    "ticket-stub",
    "polaroid-photo",
    "blueprint-sheet",
    "label-tag",
  ];
  const variant = layoutVariants[index % layoutVariants.length];

  const getLayoutClasses = () => {
    switch (variant) {
      case "floating-panel":
        return "bg-white dark:bg-gray-900 shadow-2xl border-l-8 border-emerald-500 transform skew-y-1";
      case "magazine-spread":
        return "bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600";
      case "ticket-stub":
        return "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-gray-400 dark:border-gray-500 relative";
      case "polaroid-photo":
        return "bg-white dark:bg-gray-100 shadow-xl transform rotate-2 border-8 border-white dark:border-gray-200";
      case "blueprint-sheet":
        return "bg-blue-900 text-white border-4 border-blue-300 relative overflow-hidden";
      case "label-tag":
        return "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-4 border-green-300 dark:border-green-600 relative";
      default:
        return "bg-white dark:bg-gray-800 shadow-lg";
    }
  };

  const getAccentPattern = () => {
    switch (variant) {
      case "floating-panel":
        return (
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full transform translate-x-10 -translate-y-10" />
        );
      case "magazine-spread":
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-2 h-2 bg-red-500 rounded-full" />
            <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
            <div className="absolute bottom-4 left-4 w-2 h-2 bg-green-500 rounded-full" />
            <div className="absolute bottom-4 right-4 w-2 h-2 bg-yellow-500 rounded-full" />
          </div>
        );
      case "ticket-stub":
        return (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-white dark:bg-gray-300 rounded-full -ml-2 mb-2 border-2 border-gray-400"
              />
            ))}
          </div>
        );
      case "polaroid-photo":
        return (
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-full shadow-lg transform rotate-45" />
        );
      case "blueprint-sheet":
        return (
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <pattern
                  id="grid"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 10 0 L 0 0 0 10"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
        );
      case "label-tag":
        return (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg" />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`group relative overflow-hidden ${getLayoutClasses()} hover:shadow-3xl transition-all duration-700 transform hover:scale-[1.03] ${variant === "polaroid-photo" ? "hover:rotate-0" : variant === "floating-panel" ? "hover:skew-y-0" : ""}`}
      style={{
        animationDelay: `${index * 150}ms`,
        minHeight: index % 4 === 0 ? "380px" : "320px",
        ...(variant === "ticket-stub" && {
          clipPath:
            "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
        }),
      }}
    >
      {getAccentPattern()}
      <div className="relative z-10">
        <div
          className={`relative overflow-hidden ${variant === "polaroid-photo" ? "h-48 mb-4" : variant === "magazine-spread" ? "h-40" : "h-44"}`}
        >
          <img
            src={product.images?.[0] || "/placeholder-product.jpg"}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${variant === "blueprint-sheet" ? "mix-blend-overlay" : ""}`}
          />
          {variant === "floating-panel" && (
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          )}
          {variant === "magazine-spread" && (
            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs font-bold transform -rotate-12">
              FRESH
            </div>
          )}
          {variant === "ticket-stub" && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
              #{index + 1}
            </div>
          )}
          {variant === "blueprint-sheet" && (
            <div className="absolute top-4 left-4 text-blue-300 text-xs font-mono">
              SPEC: {product.category?.toUpperCase()}
            </div>
          )}
          <div
            className={`absolute bottom-4 left-4 px-3 py-1 text-xs font-bold rounded-full ${variant === "blueprint-sheet" ? "bg-blue-300 text-blue-900" : variant === "polaroid-photo" ? "bg-gray-800 text-white" : "bg-white/90 text-gray-800"}`}
          >
            {product.category}
          </div>
          <div className="absolute bottom-4 right-4">
            <div
              className={`w-3 h-3 rounded-full ${product.stock > 0 ? "bg-green-400" : "bg-red-400"} shadow-lg`}
            />
          </div>
        </div>
        <div className={`p-6 ${variant === "polaroid-photo" ? "pb-8" : ""}`}>
          <h3
            className={`text-xl font-bold mb-3 ${variant === "blueprint-sheet" ? "text-blue-100 font-mono" : variant === "polaroid-photo" ? "text-gray-800 text-center" : "text-gray-900 dark:text-white"}`}
          >
            {product.name}
          </h3>
          {product.description && (
            <p
              className={`text-sm mb-4 line-clamp-2 ${variant === "blueprint-sheet" ? "text-blue-200 font-mono" : variant === "polaroid-photo" ? "text-gray-600 text-center" : "text-gray-600 dark:text-gray-300"}`}
            >
              {product.description}
            </p>
          )}
          <div
            className={`flex items-center justify-between mb-4 ${variant === "polaroid-photo" ? "justify-center gap-4" : ""}`}
          >
            <div className="flex items-center">
              {getDisplayRating(product) > 0 ? (
                <>
                  <div className="flex text-yellow-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`fas fa-star text-sm ${i < Math.floor(getDisplayRating(product)) ? "text-yellow-400" : variant === "blueprint-sheet" ? "text-blue-300/30" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-sm ${variant === "blueprint-sheet" ? "text-blue-200" : variant === "polaroid-photo" ? "text-gray-600" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    ({getDisplayRating(product).toFixed(1)}) •{" "}
                    {product.reviews?.length || product.reviewCount || 0} review
                    {(product.reviews?.length || product.reviewCount || 0) !== 1
                      ? "s"
                      : ""}
                  </span>
                </>
              ) : (
                <span
                  className={`text-sm ${variant === "blueprint-sheet" ? "text-blue-200/60" : variant === "polaroid-photo" ? "text-gray-400" : "text-gray-400 dark:text-gray-500"}`}
                >
                  No ratings yet
                </span>
              )}
            </div>
            {variant !== "polaroid-photo" && (
              <span
                className={`text-sm px-3 py-1 rounded-full ${product.stock > 0 ? (variant === "blueprint-sheet" ? "bg-blue-300/20 text-blue-200" : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300") : variant === "blueprint-sheet" ? "bg-red-300/20 text-red-200" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}
              >
                {product.stock > 0 ? `${product.stock} left` : "Sold out"}
              </span>
            )}
          </div>
          <div
            className={`flex items-center justify-between pt-4 ${variant === "magazine-spread" ? "border-t-2 border-dashed border-gray-300" : variant === "ticket-stub" ? "border-t-2 border-dotted border-gray-400" : variant === "blueprint-sheet" ? "border-t border-blue-300/30" : "border-t border-gray-200 dark:border-gray-600"} ${variant === "polaroid-photo" ? "justify-center gap-4" : ""}`}
          >
            <div
              className={`text-3xl font-bold ${variant === "blueprint-sheet" ? "text-blue-300 font-mono" : variant === "floating-panel" ? "text-emerald-600" : variant === "magazine-spread" ? "text-purple-600" : variant === "ticket-stub" ? "text-orange-600" : variant === "label-tag" ? "text-green-700 dark:text-green-400" : "text-gray-800"}`}
            >
              {formatPrice(product.price)}
            </div>
            <button
              className={`px-6 py-3 font-bold text-sm transition-all duration-300 transform hover:scale-105 ${product.stock > 0 ? (variant === "floating-panel" ? "bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-emerald-500/30" : variant === "magazine-spread" ? "bg-purple-500 hover:bg-purple-600 text-white rounded-none border-2 border-purple-600" : variant === "ticket-stub" ? "bg-orange-500 hover:bg-orange-600 text-white rounded-full" : variant === "polaroid-photo" ? "bg-gray-800 hover:bg-gray-900 text-white rounded-sm" : variant === "blueprint-sheet" ? "bg-blue-300 hover:bg-blue-400 text-blue-900 rounded-none border border-blue-300" : variant === "label-tag" ? "bg-green-600 hover:bg-green-700 text-white rounded-lg" : "bg-gray-600 hover:bg-gray-700 text-white rounded-lg") : "bg-gray-400 text-gray-200 cursor-not-allowed rounded-lg"} shadow-lg`}
              disabled={product.stock === 0}
            >
              {product.stock > 0 ? (
                <>
                  <i className="fas fa-shopping-bag mr-2" />
                  {variant === "ticket-stub"
                    ? "Get"
                    : variant === "blueprint-sheet"
                      ? "ORDER"
                      : "Buy Now"}
                </>
              ) : (
                <>
                  <i className="fas fa-times mr-2" />
                  Sold Out
                </>
              )}
            </button>
          </div>
          {variant === "polaroid-photo" && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-gray-400 text-xs">
              Farm Fresh #{index + 1}
            </div>
          )}
          {variant === "floating-panel" && (
            <div className="absolute -bottom-1 -right-1 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-emerald-500 transform rotate-45" />
          )}
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        {variant === "magazine-spread" && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full transform translate-x-8 -translate-y-8" />
        )}
        {variant === "label-tag" && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 animate-pulse" />
        )}
      </div>
    </div>
  );
}
