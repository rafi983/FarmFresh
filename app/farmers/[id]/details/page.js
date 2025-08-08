"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

// Compact List Row (Table-like)
const CompactListRow = ({ product, index, formatPrice }) => {
  return (
    <div
      className="group flex items-center py-4 px-6 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Product Image */}
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

      {/* Product Name & Category */}
      <div className="flex-1 min-w-0 mr-4">
        <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {product.category}
        </p>
      </div>

      {/* Rating */}
      <div className="hidden sm:flex items-center mr-4">
        <div className="flex text-yellow-400 mr-1">
          {[...Array(5)].map((_, i) => (
            <i
              key={i}
              className={`fas fa-star text-xs ${i < Math.floor(product.averageRating || 0) ? "text-yellow-400" : "text-gray-300"}`}
            ></i>
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-1">
          ({product.reviews?.length || 0})
        </span>
      </div>

      {/* Stock Status */}
      <div className="hidden md:block mr-4">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            product.stock > 0
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {product.stock > 0 ? `${product.stock} left` : "Out of stock"}
        </span>
      </div>

      {/* Price */}
      <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400 mr-4">
        {formatPrice(product.price)}
      </div>

      {/* Action Button */}
      <button
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          product.stock > 0
            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        disabled={product.stock === 0}
      >
        {product.stock > 0 ? "Add" : "Out"}
      </button>
    </div>
  );
};

// Grid Tile (Instagram-like squares)
const GridTile = ({ product, index, formatPrice }) => {
  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 hover:shadow-lg transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Background Image */}
      <img
        src={product.images?.[0] || "/placeholder-product.jpg"}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Top Corner Badges */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
        <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-2 py-1 rounded text-xs font-medium">
          {product.category}
        </span>
        <div
          className={`w-3 h-3 rounded-full ${product.stock > 0 ? "bg-green-400" : "bg-red-400"}`}
        ></div>
      </div>

      {/* Bottom Content (Shows on Hover) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-bold text-lg mb-1 truncate">{product.name}</h3>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="flex text-yellow-400 mr-1">
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={`fas fa-star text-xs ${i < Math.floor(product.averageRating || 0) ? "text-yellow-400" : "text-white/50"}`}
                ></i>
              ))}
            </div>
            <span className="text-xs text-white/80">
              ({product.reviews?.length || 0})
            </span>
          </div>
          <span className="font-bold text-xl">
            {formatPrice(product.price)}
          </span>
        </div>

        <button
          className={`w-full py-2 rounded font-medium transition-all ${
            product.stock > 0
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-gray-600 text-gray-300 cursor-not-allowed"
          }`}
          disabled={product.stock === 0}
        >
          {product.stock > 0 ? "Add to Cart" : "Sold Out"}
        </button>
      </div>

      {/* Quick Action Buttons (Shows on Hover) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex gap-2">
          <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110">
            <i className="fas fa-eye text-sm"></i>
          </button>
          <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110">
            <i className="fas fa-heart text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

// Non-Card Alternative Layout (Replacing Complex Card Layout)
const AlternativeProductLayout = ({ product, index, formatPrice }) => {
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
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full transform translate-x-10 -translate-y-10"></div>
        );
      case "magazine-spread":
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="absolute bottom-4 right-4 w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
        );
      case "ticket-stub":
        return (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-white dark:bg-gray-300 rounded-full -ml-2 mb-2 border-2 border-gray-400"
              ></div>
            ))}
          </div>
        );
      case "polaroid-photo":
        return (
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-full shadow-lg transform rotate-45"></div>
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
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
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
      {/* Accent Patterns */}
      {getAccentPattern()}

      {/* Main Content Area */}
      <div className="relative z-10">
        {/* Image Section */}
        <div
          className={`relative overflow-hidden ${variant === "polaroid-photo" ? "h-48 mb-4" : variant === "magazine-spread" ? "h-40" : "h-44"}`}
        >
          <img
            src={product.images?.[0] || "/placeholder-product.jpg"}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${variant === "blueprint-sheet" ? "mix-blend-overlay" : ""}`}
          />

          {/* Overlay Elements Based on Variant */}
          {variant === "floating-panel" && (
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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

          {/* Category Badge */}
          <div
            className={`absolute bottom-4 left-4 px-3 py-1 text-xs font-bold rounded-full ${
              variant === "blueprint-sheet"
                ? "bg-blue-300 text-blue-900"
                : variant === "polaroid-photo"
                  ? "bg-gray-800 text-white"
                  : "bg-white/90 text-gray-800"
            }`}
          >
            {product.category}
          </div>

          {/* Stock Indicator */}
          <div className="absolute bottom-4 right-4">
            <div
              className={`w-3 h-3 rounded-full ${product.stock > 0 ? "bg-green-400" : "bg-red-400"} shadow-lg`}
            ></div>
          </div>
        </div>

        {/* Content Section */}
        <div className={`p-6 ${variant === "polaroid-photo" ? "pb-8" : ""}`}>
          {/* Product Name */}
          <h3
            className={`text-xl font-bold mb-3 ${
              variant === "blueprint-sheet"
                ? "text-blue-100 font-mono"
                : variant === "polaroid-photo"
                  ? "text-gray-800 text-center"
                  : "text-gray-900 dark:text-white"
            }`}
          >
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p
              className={`text-sm mb-4 line-clamp-2 ${
                variant === "blueprint-sheet"
                  ? "text-blue-200 font-mono"
                  : variant === "polaroid-photo"
                    ? "text-gray-600 text-center"
                    : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {product.description}
            </p>
          )}

          {/* Rating & Stock Info */}
          <div
            className={`flex items-center justify-between mb-4 ${variant === "polaroid-photo" ? "justify-center gap-4" : ""}`}
          >
            <div className="flex items-center">
              <div className="flex text-yellow-400 mr-2">
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`fas fa-star text-sm ${i < Math.floor(product.averageRating || 0) ? "text-yellow-400" : variant === "blueprint-sheet" ? "text-blue-300/30" : "text-gray-300"}`}
                  ></i>
                ))}
              </div>
              <span
                className={`text-sm ${
                  variant === "blueprint-sheet"
                    ? "text-blue-200"
                    : variant === "polaroid-photo"
                      ? "text-gray-600"
                      : "text-gray-500 dark:text-gray-400"
                }`}
              >
                ({product.reviews?.length || 0})
              </span>
            </div>
            {!variant === "polaroid-photo" && (
              <span
                className={`text-sm px-3 py-1 rounded-full ${
                  product.stock > 0
                    ? variant === "blueprint-sheet"
                      ? "bg-blue-300/20 text-blue-200"
                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : variant === "blueprint-sheet"
                      ? "bg-red-300/20 text-red-200"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                }`}
              >
                {product.stock > 0 ? `${product.stock} left` : "Sold out"}
              </span>
            )}
          </div>

          {/* Price & Action Section */}
          <div
            className={`flex items-center justify-between pt-4 ${
              variant === "magazine-spread"
                ? "border-t-2 border-dashed border-gray-300"
                : variant === "ticket-stub"
                  ? "border-t-2 border-dotted border-gray-400"
                  : variant === "blueprint-sheet"
                    ? "border-t border-blue-300/30"
                    : "border-t border-gray-200 dark:border-gray-600"
            } ${variant === "polaroid-photo" ? "justify-center gap-4" : ""}`}
          >
            <div
              className={`text-3xl font-bold ${
                variant === "blueprint-sheet"
                  ? "text-blue-300 font-mono"
                  : variant === "floating-panel"
                    ? "text-emerald-600"
                    : variant === "magazine-spread"
                      ? "text-purple-600"
                      : variant === "ticket-stub"
                        ? "text-orange-600"
                        : variant === "label-tag"
                          ? "text-green-700 dark:text-green-400"
                          : "text-gray-800"
              }`}
            >
              {formatPrice(product.price)}
            </div>
            <button
              className={`px-6 py-3 font-bold text-sm transition-all duration-300 transform hover:scale-105 ${
                product.stock > 0
                  ? variant === "floating-panel"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-emerald-500/30"
                    : variant === "magazine-spread"
                      ? "bg-purple-500 hover:bg-purple-600 text-white rounded-none border-2 border-purple-600"
                      : variant === "ticket-stub"
                        ? "bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                        : variant === "polaroid-photo"
                          ? "bg-gray-800 hover:bg-gray-900 text-white rounded-sm"
                          : variant === "blueprint-sheet"
                            ? "bg-blue-300 hover:bg-blue-400 text-blue-900 rounded-none border border-blue-300"
                            : variant === "label-tag"
                              ? "bg-green-600 hover:bg-green-700 text-white rounded-lg"
                              : "bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed rounded-lg"
              } shadow-lg`}
              disabled={product.stock === 0}
            >
              {product.stock > 0 ? (
                <>
                  <i className="fas fa-shopping-bag mr-2"></i>
                  {variant === "ticket-stub"
                    ? "Get"
                    : variant === "blueprint-sheet"
                      ? "ORDER"
                      : "Buy Now"}
                </>
              ) : (
                <>
                  <i className="fas fa-times mr-2"></i>
                  Sold Out
                </>
              )}
            </button>
          </div>

          {/* Special Variant Elements */}
          {variant === "polaroid-photo" && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-gray-400 text-xs">
              Farm Fresh #{index + 1}
            </div>
          )}

          {variant === "floating-panel" && (
            <div className="absolute -bottom-1 -right-1 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-emerald-500 transform rotate-45"></div>
          )}
        </div>
      </div>

      {/* Hover Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        {variant === "magazine-spread" && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full transform translate-x-8 -translate-y-8"></div>
        )}
        {variant === "label-tag" && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 animate-pulse"></div>
        )}
      </div>
    </div>
  );
};

// Unified Product Layout Component
const ProductDisplayLayout = ({ products, viewType, sortBy }) => {
  const sortedProducts = useMemo(() => {
    let sorted = [...products];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-high":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "rating":
        return sorted.sort(
          (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
        );
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "stock":
        return sorted.sort((a, b) => (b.stock || 0) - (a.stock || 0));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  return (
    <div className="product-display-layout">
      <div className="text-center mb-12">
        <h3 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
          Farm Fresh Products
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Premium organic produce, carefully grown and harvested for exceptional
          quality
        </p>
      </div>

      {/* Different layouts based on view type */}
      {viewType === "list" ? (
        <div className="max-w-4xl mx-auto space-y-3">
          {sortedProducts.map((product, index) => (
            <CompactListRow key={product._id} product={product} index={index} />
          ))}
        </div>
      ) : viewType === "masonry" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {sortedProducts.map((product, index) => (
            <AlternativeProductLayout
              key={product._id}
              product={product}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map((product, index) => (
            <GridTile key={product._id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

// Enhanced Product Layout with Multiple Views
const EnhancedProductLayout = ({ products, viewType, sortBy }) => {
  const sortedProducts = useMemo(() => {
    let sorted = [...products];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-high":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "rating":
        return sorted.sort(
          (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
        );
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "stock":
        return sorted.sort((a, b) => (b.stock || 0) - (a.stock || 0));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  return (
    <div className="enhanced-product-layout">
      <div className="text-center mb-12">
        <h3 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
          Farm Fresh Products
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Premium organic produce, carefully grown and harvested for exceptional
          quality
        </p>
      </div>

      {/* Products Grid/List */}
      {viewType === "list" ? (
        <div className="space-y-4">
          {sortedProducts.map((product, index) => (
            <ModernProductCard
              key={product._id}
              product={product}
              index={index}
              viewType="list"
            />
          ))}
        </div>
      ) : viewType === "masonry" ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {sortedProducts.map((product, index) => (
            <div key={product._id} className="break-inside-avoid mb-6">
              <ModernProductCard
                product={product}
                index={index}
                viewType="grid"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {sortedProducts.map((product, index) => (
            <ModernProductCard
              key={product._id}
              product={product}
              index={index}
              viewType="grid"
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Updated Layout Components
const CathedralVaultLayout = ({ products, viewType, sortBy }) => {
  return (
    <div className="cathedral-vault relative">
      <EnhancedProductLayout
        products={products}
        viewType={viewType}
        sortBy={sortBy}
      />
    </div>
  );
};

const MandalaGardenLayout = ({ products, viewType, sortBy }) => {
  return (
    <div className="mandala-garden relative">
      <EnhancedProductLayout
        products={products}
        viewType={viewType}
        sortBy={sortBy}
      />
    </div>
  );
};

const MetropolitanSkylineLayout = ({ products, viewType, sortBy }) => {
  return (
    <div className="metropolitan-skyline relative">
      <EnhancedProductLayout
        products={products}
        viewType={viewType}
        sortBy={sortBy}
      />
    </div>
  );
};

export default function FarmerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const farmerId = params.id;

  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("cathedral");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("default");
  const [viewType, setViewType] = useState("grid"); // Add view type state

  const PRODUCTS_PER_PAGE = 20;

  useEffect(() => {
    fetchFarmerData();
  }, [farmerId]);

  useEffect(() => {
    applyFilters();
  }, [products, selectedCategory]);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching farmer data for ID:", farmerId);

      // Only fetch farmer data since it already includes products
      const farmerResponse = await fetch(`/api/farmers/${farmerId}`, {
        headers: { "Cache-Control": "no-cache" },
      });

      console.log("Farmer response status:", farmerResponse.status);

      if (!farmerResponse.ok) {
        throw new Error("Farmer not found");
      }

      const farmerData = await farmerResponse.json();
      console.log("Farmer data:", farmerData);

      setFarmer(farmerData.farmer);
      // Use products from farmer data instead of separate API call
      const farmerProducts = farmerData.farmer.products || [];
      setProducts(farmerProducts);

      console.log("Set farmer:", farmerData.farmer);
      console.log("Set products from farmer data:", farmerProducts);
    } catch (error) {
      console.error("Error fetching farmer data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) =>
          product.category?.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ["all", ...cats];
  }, [products]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + PRODUCTS_PER_PAGE,
  );

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter(
      (p) => p.status === "active" && p.stock > 0,
    ).length;
    const averageRating =
      products.length > 0
        ? (
            products.reduce((sum, p) => sum + (p.averageRating || 0), 0) /
            products.length
          ).toFixed(1)
        : 0;

    return { totalProducts, activeProducts, averageRating };
  }, [products]);

  // Format price function for Bangladeshi Taka
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-conic from-emerald-400 via-teal-500 to-cyan-600 rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <i className="fas fa-user-tie text-4xl text-emerald-600 animate-pulse"></i>
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loading Architectural Marvel
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Constructing the farmer&apos;s magnificent showcase...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !farmer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-red-500 text-8xl mb-8">
              <i className="fas fa-exclamation-triangle animate-bounce"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Architect Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              {error || "The farmer's architectural showcase doesn't exist."}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-medium transition-all transform hover:scale-105"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Return
              </button>
              <Link
                href="/farmers"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-medium transition-all transform hover:scale-105"
              >
                <i className="fas fa-users mr-2"></i>
                Explore Architects
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
        {/* Monumental Hero Section */}
        <div className="relative overflow-hidden">
          {/* Architectural Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-stone-900"></div>
          <div className="absolute inset-0 bg-black/30"></div>

          {/* Geometric Architectural Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Art Deco Patterns */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-20 left-10 w-64 h-64 border-4 border-amber-400 transform rotate-45 animate-spin-slow"></div>
              <div className="absolute top-40 right-20 w-48 h-48 border-4 border-emerald-400 transform rotate-12 animate-reverse-spin"></div>
              <div className="absolute bottom-32 left-32 w-56 h-56 border-4 border-purple-400 transform -rotate-45 animate-float"></div>
              <div className="absolute bottom-20 right-40 w-72 h-72 border-4 border-cyan-400 transform rotate-30 animate-pulse"></div>
            </div>

            {/* Classical Columns */}
            <div className="absolute inset-0 opacity-5">
              <div className="flex justify-between h-full px-20">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 bg-gradient-to-t from-stone-600 to-stone-400 animate-fadeIn"
                    style={{ animationDelay: `${i * 200}ms` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            {/* Ornate Breadcrumb */}
            <nav className="flex mb-16" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4 text-lg">
                <li>
                  <Link
                    href="/"
                    className="text-white/80 hover:text-amber-400 transition-colors flex items-center font-medium"
                  >
                    <i className="fas fa-home mr-3 text-xl"></i>
                    Sanctuary
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-amber-400/60 text-lg"></i>
                </li>
                <li>
                  <Link
                    href="/farmers"
                    className="text-white/80 hover:text-amber-400 transition-colors font-medium"
                  >
                    Master Architects
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-amber-400/60 text-lg"></i>
                </li>
                <li className="text-amber-400 font-bold">{farmer.name}</li>
              </ol>
            </nav>

            {/* Monumental Farmer Profile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Majestic Avatar & Info */}
              <div className="text-center lg:text-left">
                <div className="relative inline-block mb-12">
                  {/* Ornate Avatar Frame */}
                  <div className="relative w-64 h-64 mx-auto lg:mx-0">
                    {/* Outer Decorative Ring */}
                    <div className="absolute inset-0 bg-gradient-conic from-amber-400 via-orange-500 to-red-500 rounded-full animate-spin-slow"></div>

                    {/* Middle Frame */}
                    <div className="absolute inset-4 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-full border-4 border-white/30 overflow-hidden shadow-2xl">
                      {farmer.profilePicture ? (
                        <img
                          src={farmer.profilePicture}
                          alt={farmer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
                          <i className="fas fa-user-crown text-8xl text-white/90"></i>
                        </div>
                      )}
                    </div>

                    {/* Ornate Decorations */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-xl">
                        <i className="fas fa-crown text-2xl text-white"></i>
                      </div>
                    </div>

                    {/* Verification Seal */}
                    {farmer.verified && (
                      <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white rounded-full p-4 shadow-xl animate-pulse border-4 border-white">
                        <i className="fas fa-certificate text-2xl"></i>
                      </div>
                    )}

                    {/* Floating Orbs */}
                    <div className="absolute inset-0">
                      <div className="absolute top-16 -left-8 w-6 h-6 bg-purple-400 rounded-full animate-float opacity-60"></div>
                      <div className="absolute top-32 -right-6 w-8 h-8 bg-cyan-400 rounded-full animate-float-reverse opacity-60"></div>
                      <div className="absolute bottom-20 -left-6 w-4 h-4 bg-pink-400 rounded-full animate-bounce opacity-60"></div>
                    </div>
                  </div>
                </div>

                <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 tracking-wider">
                  {farmer.name}
                </h1>
                <p className="text-3xl text-amber-300 mb-8 font-light">
                  {farmer.farmName || `${farmer.name}'s Agricultural Empire`}
                </p>

                <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-12">
                  <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 text-white border border-white/20">
                    <i className="fas fa-map-marker-alt mr-4 text-2xl text-amber-400"></i>
                    <span className="font-semibold text-lg">
                      {farmer.location}
                    </span>
                  </div>
                  <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 text-white border border-white/20">
                    <i className="fas fa-star mr-4 text-2xl text-yellow-400"></i>
                    <span className="font-semibold text-lg">
                      {stats.averageRating} Mastery
                    </span>
                  </div>
                  <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 text-white border border-white/20">
                    <i className="fas fa-seedling mr-4 text-2xl text-emerald-400"></i>
                    <span className="font-semibold text-lg">
                      {stats.totalProducts} Creations
                    </span>
                  </div>
                </div>

                {farmer.bio && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-12">
                    <p className="text-white/90 text-xl leading-relaxed italic">
                      &quot;{farmer.bio}&quot;
                    </p>
                  </div>
                )}

                {/* Monumental Action Buttons */}
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                  <Link
                    href={`/farmers/${farmerId}`}
                    className="group bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-500 border border-emerald-400/30 shadow-2xl transform hover:scale-105"
                  >
                    <i className="fas fa-shopping-cart mr-3 group-hover:rotate-12 transition-transform"></i>
                    Enter Marketplace
                  </Link>
                  <button className="group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-500 border border-purple-400/30 shadow-2xl transform hover:scale-105">
                    <i className="fas fa-heart mr-3 group-hover:pulse transition-all"></i>
                    Follow Master
                  </button>
                </div>
              </div>

              {/* Architectural Stats Monument */}
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/20 hover:bg-white/20 transition-all duration-700 transform hover:scale-105 shadow-2xl">
                  <div className="text-center">
                    <div className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-4">
                      {stats.totalProducts}
                    </div>
                    <div className="text-white/80 text-xl font-medium">
                      Masterpieces
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/20 hover:bg-white/20 transition-all duration-700 transform hover:scale-105 shadow-2xl">
                  <div className="text-center">
                    <div className="text-6xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-4">
                      {stats.activeProducts}
                    </div>
                    <div className="text-white/80 text-xl font-medium">
                      Available
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/20 hover:bg-white/20 transition-all duration-700 transform hover:scale-105 shadow-2xl col-span-2">
                  <div className="text-center">
                    <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-4">
                      {stats.averageRating}★
                    </div>
                    <div className="text-white/80 text-xl font-medium">
                      Divine Rating
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specializations Showcase */}
            {farmer.specializations && farmer.specializations.length > 0 && (
              <div className="mt-20 text-center">
                <h3 className="text-4xl font-bold text-white mb-10">
                  Sacred Specializations
                </h3>
                <div className="flex flex-wrap justify-center gap-6">
                  {farmer.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg text-white px-8 py-4 rounded-2xl text-xl font-semibold border border-purple-400/30 hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-500 transform hover:scale-105 shadow-xl"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Architectural Products Showcase */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Monumental Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-6xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-8">
              🌟 Mystical Product Dimensions 🌟
            </h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
              Experience {farmer.name}&apos;s products in breathtaking geometric
              formations and mystical arrangements
            </p>
          </div>

          {/* Advanced Control Panel */}
          <div className="flex flex-wrap justify-center gap-8 mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-3 shadow-2xl border border-gray-200 dark:border-gray-600">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-8 py-4 bg-transparent border-none focus:outline-none text-gray-700 dark:text-gray-300 font-semibold text-lg"
              >
                <option value="all">All Products</option>
                {categories.slice(1).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-3 shadow-2xl border border-gray-200 dark:border-gray-600">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-8 py-4 bg-transparent border-none focus:outline-none text-gray-700 dark:text-gray-300 font-semibold text-lg"
              >
                <option value="default">Sort By</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
                <option value="name">Name</option>
                <option value="stock">Stock</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setViewType("grid")}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  viewType === "grid"
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <i className="fas fa-th"></i>
                Grid View
              </button>
              <button
                onClick={() => setViewType("list")}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  viewType === "list"
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <i className="fas fa-list"></i>
                List View
              </button>
              <button
                onClick={() => setViewType("masonry")}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  viewType === "masonry"
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <i className="fas fa-columns"></i>
                Masonry View
              </button>
            </div>
          </div>

          {/* Products Display */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-32">
              <div className="text-gray-400 text-9xl mb-8">
                <i className="fas fa-seedling"></i>
              </div>
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                No Products Found
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {selectedCategory !== "all"
                  ? "Try selecting a different category"
                  : `${farmer.name} is working on adding new products`}
              </p>
            </div>
          ) : (
            <>
              {/* Single Unified Product Display */}
              <ProductDisplayLayout
                products={paginatedProducts}
                viewType={viewType}
                sortBy={sortBy}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-20">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:scale-105"
                      >
                        <i className="fas fa-chevron-left mr-2"></i>
                        Previous
                      </button>

                      <span className="text-xl font-bold text-gray-700 dark:text-gray-300 px-6">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:scale-105"
                      >
                        Next
                        <i className="fas fa-chevron-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
