"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import ProductCard from "@/components/ProductCard";
import StarRating from "@/components/StarRating";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

export default function Favorites() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToCart } = useCart();
  const { removeFromFavorites } = useFavorites();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid, list
  const [sortBy, setSortBy] = useState("dateAdded"); // dateAdded, name, price, rating
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch favorites function
  const fetchFavorites = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      const userId =
        session.user.userId ||
        session.user.id ||
        session.user._id ||
        session.user.email;

      if (!userId) {
        console.error("No user ID found in session");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/favorites?userId=${encodeURIComponent(userId)}`,
      );

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        console.error("Failed to fetch favorites:", response.status);
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [
      ...new Set(favorites.map((fav) => fav.product?.category).filter(Boolean)),
    ];
    return cats;
  }, [favorites]);

  // Filter and sort favorites
  const filteredAndSortedFavorites = useMemo(() => {
    let filtered = favorites;

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter(
        (fav) => fav.product?.category === filterCategory,
      );
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (fav) =>
          fav.product?.name?.toLowerCase().includes(search) ||
          fav.product?.category?.toLowerCase().includes(search) ||
          fav.product?.farmer?.name?.toLowerCase().includes(search),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.product?.name || "").localeCompare(b.product?.name || "");
        case "price":
          return (a.product?.price || 0) - (b.product?.price || 0);
        case "rating":
          return (
            (b.product?.averageRating || 0) - (a.product?.averageRating || 0)
          );
        case "dateAdded":
        default:
          return (
            new Date(b.createdAt || b.dateAdded) -
            new Date(a.createdAt || a.dateAdded)
          );
      }
    });

    return filtered;
  }, [favorites, filterCategory, searchTerm, sortBy]);

  // Handle bulk remove
  const handleBulkRemove = async () => {
    if (selectedItems.length === 0) return;

    if (!confirm(`Remove ${selectedItems.length} items from favorites?`))
      return;

    setIsRemoving(true);
    try {
      for (const productId of selectedItems) {
        await removeFromFavorites(productId);
      }

      // Update local state
      setFavorites((prev) =>
        prev.filter((fav) => !selectedItems.includes(fav.product?._id)),
      );
      setSelectedItems([]);
    } catch (error) {
      console.error("Error removing favorites:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  // Handle add to cart
  const handleAddToCart = async (product, quantity = 1) => {
    try {
      const item = {
        productId: product._id,
        id: product._id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        stock: product.stock,
        image: product.image || product.images?.[0] || "/placeholder-image.jpg",
        unit: product.unit || "kg",
        farmerId: product.farmerId,
        farmerName:
          product.farmer?.name || product.farmer?.farmName || "Unknown Farmer",
      };

      await addToCart(item, quantity);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(error.message || "Failed to add product to cart");
    }
  };

  // Effects
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      fetchFavorites();
    }
  }, [session, status, router, fetchFavorites]);

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <i className="fas fa-heart text-3xl text-white"></i>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Your Favorites
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Gathering all your loved products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-red-600 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white opacity-10 rounded-full animate-float"></div>
            <div className="absolute top-32 right-20 w-20 h-20 bg-white opacity-10 rounded-full animate-float-delayed"></div>
            <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-white opacity-10 rounded-full animate-float"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 backdrop-blur-sm">
                <i className="fas fa-heart text-3xl text-white"></i>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4">
                My Favorite Products
              </h1>
              <p className="text-xl text-red-100 mb-2">
                Your personally curated collection of amazing finds
              </p>
              <div className="inline-flex items-center bg-white bg-opacity-20 rounded-full px-6 py-2 backdrop-blur-sm">
                <i className="fas fa-heart text-red-200 mr-2"></i>
                <span className="text-white font-medium">
                  {favorites.length}{" "}
                  {favorites.length === 1 ? "Product" : "Products"} Saved
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {favorites.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="relative inline-block mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <i className="fas fa-heart-broken text-5xl text-red-400 dark:text-red-500"></i>
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                  <i className="fas fa-plus text-white text-lg"></i>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Your Heart is Empty!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Start building your collection of favorite products. Every great
                journey begins with a single heart!
              </p>

              <div className="space-y-4">
                <Link
                  href="/products"
                  className="inline-flex items-center bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <i className="fas fa-search mr-3"></i>
                  Discover Amazing Products
                  <i className="fas fa-arrow-right ml-3"></i>
                </Link>

                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Or explore by category
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {["Vegetables", "Fruits", "Grains", "Dairy", "Herbs"].map(
                      (category) => (
                        <Link
                          key={category}
                          href={`/products?category=${category.toLowerCase()}`}
                          className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          {category}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Controls Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      <input
                        type="text"
                        placeholder="Search your favorites..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {/* Category Filter */}
                    <div className="min-w-48">
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort */}
                    <div className="min-w-48">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="dateAdded">Recently Added</option>
                        <option value="name">Name A-Z</option>
                        <option value="price">Price Low-High</option>
                        <option value="rating">Highest Rated</option>
                      </select>
                    </div>

                    {/* View Mode */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          viewMode === "grid"
                            ? "bg-white dark:bg-gray-600 shadow-sm text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <i className="fas fa-th"></i>
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          viewMode === "list"
                            ? "bg-white dark:bg-gray-600 shadow-sm text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <i className="fas fa-list"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedItems.length} items selected
                      </span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedItems([])}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          Clear Selection
                        </button>
                        <button
                          onClick={handleBulkRemove}
                          disabled={isRemoving}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {isRemoving ? "Removing..." : "Remove Selected"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Showing {filteredAndSortedFavorites.length} of{" "}
                  {favorites.length} favorites
                  {searchTerm && ` for "${searchTerm}"`}
                  {filterCategory !== "all" && ` in ${filterCategory}`}
                </p>
              </div>

              {/* Products Display */}
              {filteredAndSortedFavorites.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                  <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No matches found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your search or filters
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterCategory("all");
                    }}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                /* Horizontal Card Layout - Image Left, Content Right */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredAndSortedFavorites.map((favorite, index) => (
                    <div
                      key={favorite._id}
                      className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-slate-100 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-400 transform hover:-translate-y-2 hover:scale-[1.02]"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        boxShadow:
                          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      {/* Selection Badge - Top Left */}
                      <div className="absolute top-3 left-3 z-20">
                        <label className="relative block cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(
                              favorite.product?._id,
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems((prev) => [
                                  ...prev,
                                  favorite.product?._id,
                                ]);
                              } else {
                                setSelectedItems((prev) =>
                                  prev.filter(
                                    (id) => id !== favorite.product?._id,
                                  ),
                                );
                              }
                            }}
                            className="sr-only"
                          />
                          <div
                            className={`w-6 h-6 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm shadow-lg ${
                              selectedItems.includes(favorite.product?._id)
                                ? "bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-400 scale-110 shadow-emerald-200"
                                : "bg-white/90 dark:bg-slate-700/90 border-slate-300 dark:border-slate-500 hover:border-emerald-400 shadow-slate-200"
                            }`}
                          >
                            {selectedItems.includes(favorite.product?._id) && (
                              <i className="fas fa-check text-white text-xs absolute top-1 left-1.5"></i>
                            )}
                          </div>
                        </label>
                      </div>

                      {/* Heart Badge - Top Right */}
                      <div className="absolute top-3 right-3 z-20">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-xl border-2 border-red-200 dark:border-red-400">
                          <i className="fas fa-heart text-white text-sm"></i>
                        </div>
                      </div>

                      <div className="flex h-full">
                        {/* Left Side - Image */}
                        <div className="relative w-1/3 min-h-[200px] overflow-hidden rounded-l-2xl border-r border-slate-100 dark:border-slate-600">
                          <Image
                            src={
                              favorite.product?.image ||
                              favorite.product?.images?.[0] ||
                              "/placeholder-image.jpg"
                            }
                            alt={favorite.product?.name || "Product"}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />

                          {/* Category Badge - On Image */}
                          <div className="absolute bottom-3 left-3 z-10">
                            <div className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl shadow-lg backdrop-blur-sm border border-indigo-300">
                              {favorite.product?.category || "Product"}
                            </div>
                          </div>

                          {/* Stock Status - On Image */}
                          <div className="absolute top-3 left-3 z-10">
                            <div
                              className={`px-3 py-1 rounded-xl text-xs font-semibold backdrop-blur-sm shadow-lg border ${
                                (favorite.product?.stock || 0) > 0
                                  ? "bg-emerald-500/90 text-white border-emerald-300"
                                  : "bg-red-500/90 text-white border-red-300"
                              }`}
                            >
                              {(favorite.product?.stock || 0) > 0
                                ? `${favorite.product?.stock} left`
                                : "Out of stock"}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Content */}
                        <div className="flex-1 p-6 flex flex-col justify-between bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-750">
                          {/* Top Section - Product Info */}
                          <div className="flex-1">
                            {/* Product Title */}
                            <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {favorite.product?.name}
                            </h3>

                            {/* Farmer Info */}
                            <div className="flex items-center gap-3 mb-4 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                              <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                                <i className="fas fa-leaf text-white text-sm"></i>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                  {favorite.product?.farmer?.farmName ||
                                    favorite.product?.farmer?.name ||
                                    "Premium Farm"}
                                </p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                  {favorite.product?.farmer?.location ||
                                    "Farm Location"}
                                </p>
                              </div>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-2 mb-4 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                              {(() => {
                                // Calculate review data for this product
                                const product = favorite.product;
                                let reviewCount = 0;
                                let finalRating = 0;

                                // Check for direct review count fields
                                if (product?.reviewCount) {
                                  reviewCount = product.reviewCount;
                                } else if (product?.totalRatings) {
                                  reviewCount = product.totalRatings;
                                } else if (product?.reviews?.length) {
                                  reviewCount = product.reviews.length;
                                }

                                // Calculate final rating
                                if (product?.averageRating) {
                                  finalRating = product.averageRating;
                                } else if (product?.reviews?.length > 0) {
                                  const totalRating = product.reviews.reduce(
                                    (sum, review) => sum + (review.rating || 0),
                                    0,
                                  );
                                  finalRating =
                                    totalRating / product.reviews.length;
                                }

                                return (
                                  <>
                                    <StarRating
                                      rating={finalRating}
                                      size="sm"
                                    />
                                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                                      {finalRating.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-amber-600 dark:text-amber-400">
                                      ({reviewCount})
                                    </span>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Price */}
                            <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                  ${(favorite.product?.price || 0).toFixed(2)}
                                </span>
                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                  per {favorite.product?.unit || "kg"}
                                </span>
                              </div>
                            </div>

                            {/* Date Added */}
                            <div className="mb-4 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                <i className="fas fa-calendar-plus mr-2 text-slate-500"></i>
                                Added on{" "}
                                {new Date(
                                  favorite.createdAt || favorite.dateAdded,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Bottom Section - Actions */}
                          <div className="space-y-3">
                            {/* Primary Actions */}
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() =>
                                  handleAddToCart(favorite.product)
                                }
                                disabled={(favorite.product?.stock || 0) === 0}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl border border-emerald-400 hover:border-emerald-300 flex items-center justify-center gap-2"
                              >
                                <i className="fas fa-cart-plus text-sm"></i>
                                Add to Cart
                              </button>
                              <Link
                                href={`/details?id=${favorite.product?._id}`}
                                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl border border-slate-400 hover:border-slate-300 flex items-center justify-center gap-2"
                              >
                                <i className="fas fa-eye text-sm"></i>
                                View Details
                              </Link>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() =>
                                removeFromFavorites(favorite.product?._id)
                              }
                              className="w-full text-sm text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 py-2 transition-colors flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-800"
                            >
                              <i className="fas fa-heart-broken text-xs"></i>
                              Remove from favorites
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-transparent group-hover:border-emerald-200 dark:group-hover:border-emerald-600 rounded-2xl"></div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Detailed Table-Style List - Information Dense */
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                  {/* Table Header */}
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 px-8 py-4">
                    <div className="grid grid-cols-12 gap-4 items-center text-white font-semibold">
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={
                            selectedItems.length ===
                              filteredAndSortedFavorites.length &&
                            filteredAndSortedFavorites.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(
                                filteredAndSortedFavorites.map(
                                  (fav) => fav.product?._id,
                                ),
                              );
                            } else {
                              setSelectedItems([]);
                            }
                          }}
                          className="w-5 h-5 text-red-500 rounded border-white focus:ring-red-500"
                        />
                      </div>
                      <div className="col-span-3">Product</div>
                      <div className="col-span-2">Farmer</div>
                      <div className="col-span-2 text-center">Rating</div>
                      <div className="col-span-2 text-center">Price</div>
                      <div className="col-span-1 text-center">Stock</div>
                      <div className="col-span-1 text-center">Actions</div>
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredAndSortedFavorites.map((favorite, index) => (
                      <div
                        key={favorite._id}
                        className="group hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/10 dark:hover:to-pink-900/10 transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center px-8 py-6">
                          {/* Selection Checkbox */}
                          <div className="col-span-1">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(
                                  favorite.product?._id,
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItems((prev) => [
                                      ...prev,
                                      favorite.product?._id,
                                    ]);
                                  } else {
                                    setSelectedItems((prev) =>
                                      prev.filter(
                                        (id) => id !== favorite.product?._id,
                                      ),
                                    );
                                  }
                                }}
                                className="w-5 h-5 text-red-500 rounded border-gray-300 focus:ring-red-500"
                              />
                            </label>
                          </div>

                          {/* Product Info with Image */}
                          <div className="col-span-3">
                            <div className="flex items-center gap-4">
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Image
                                  src={
                                    favorite.product?.image ||
                                    favorite.product?.images?.[0] ||
                                    "/placeholder-image.jpg"
                                  }
                                  alt={favorite.product?.name || "Product"}
                                  fill
                                  className="object-cover"
                                />
                                {/* Heart Overlay */}
                                <div className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <i className="fas fa-heart text-white text-xs"></i>
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                                  {favorite.product?.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                  Added{" "}
                                  {new Date(
                                    favorite.createdAt || favorite.dateAdded,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Farmer Info */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <i className="fas fa-leaf text-green-600 dark:text-green-400 text-sm"></i>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                  {favorite.product?.farmer?.farmName ||
                                    favorite.product?.farmer?.name ||
                                    "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {favorite.product?.farmer?.location || "Farm"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="col-span-2">
                            <div className="flex flex-col items-center justify-center space-y-1 px-3">
                              {(() => {
                                // Calculate review data for this product
                                const product = favorite.product;
                                let reviewCount = 0;
                                let finalRating = 0;

                                // Check for direct review count fields
                                if (product?.reviewCount) {
                                  reviewCount = product.reviewCount;
                                } else if (product?.totalRatings) {
                                  reviewCount = product.totalRatings;
                                } else if (product?.reviews?.length) {
                                  reviewCount = product.reviews.length;
                                }

                                // Calculate final rating
                                if (product?.averageRating) {
                                  finalRating = product.averageRating;
                                } else if (product?.reviews?.length > 0) {
                                  const totalRating = product.reviews.reduce(
                                    (sum, review) => sum + (review.rating || 0),
                                    0,
                                  );
                                  finalRating =
                                    totalRating / product.reviews.length;
                                }

                                return (
                                  <>
                                    <div className="flex items-center justify-center">
                                      <StarRating
                                        rating={finalRating}
                                        size="sm"
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                      {finalRating.toFixed(1)} ({reviewCount}{" "}
                                      reviews)
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Price */}
                          <div className="col-span-2">
                            <div className="flex flex-col items-center justify-center space-y-1 px-3">
                              <div className="text-xl font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                                ${(favorite.product?.price || 0).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                per {favorite.product?.unit || "kg"}
                              </div>
                            </div>
                          </div>

                          {/* Stock */}
                          <div className="col-span-1">
                            <div className="text-center">
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                  (favorite.product?.stock || 0) > 0
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                                }`}
                              >
                                {(favorite.product?.stock || 0) > 0
                                  ? `${favorite.product?.stock}`
                                  : "Out"}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1">
                            <div className="flex items-center justify-center">
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    handleAddToCart(favorite.product)
                                  }
                                  disabled={
                                    (favorite.product?.stock || 0) === 0
                                  }
                                  className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 transform hover:scale-110 disabled:hover:scale-100 shadow-lg"
                                  title="Add to Cart"
                                >
                                  <i className="fas fa-shopping-cart text-xs"></i>
                                </button>
                                <Link
                                  href={`/details?id=${favorite.product?._id}`}
                                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 transform hover:scale-110 shadow-lg"
                                  title="View Details"
                                >
                                  <i className="fas fa-eye text-xs"></i>
                                </Link>
                                <button
                                  onClick={() =>
                                    removeFromFavorites(favorite.product?._id)
                                  }
                                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 transform hover:scale-110 shadow-lg"
                                  title="Remove from Favorites"
                                >
                                  <i className="fas fa-trash text-xs"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Table Footer with Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 px-8 py-4 border-t border-gray-100 dark:border-gray-600">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-600 dark:text-gray-400">
                        Showing {filteredAndSortedFavorites.length} of{" "}
                        {favorites.length} favorite products
                      </div>
                      <div className="flex items-center gap-6 text-gray-600 dark:text-gray-400">
                        <span>
                          <i className="fas fa-heart text-red-500 mr-1"></i>
                          {favorites.length} Total Favorites
                        </span>
                        <span>
                          <i className="fas fa-check-circle text-green-500 mr-1"></i>
                          {selectedItems.length} Selected
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(-10deg);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </>
  );
}
