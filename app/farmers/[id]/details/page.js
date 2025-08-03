"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

// Simple Minimalistic Product Card Component
const MinimalistProductCard = ({ product, index }) => {
  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-500"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-6 p-6">
        {/* Compact Product Image */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
          <img
            src={product.images?.[0] || "/placeholder-product.jpg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Stock Indicator */}
          <div className="absolute top-2 right-2">
            <div
              className={`w-3 h-3 rounded-full ${
                product.stock > 0 ? "bg-emerald-400" : "bg-red-400"
              }`}
            ></div>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {product.name}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {product.category}
              </p>

              {/* Rating */}
              <div className="flex items-center mt-2">
                <div className="flex text-yellow-400 mr-2">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star text-sm ${
                        i < Math.floor(product.averageRating || 0)
                          ? "text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    ></i>
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({product.reviews?.length || 0})
                </span>
              </div>
            </div>

            {/* Price and Actions */}
            <div className="flex flex-col items-end gap-3 ml-4">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ${product.price}
              </div>

              <div className="flex gap-2">
                <button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  disabled={product.stock === 0}
                >
                  <i className="fas fa-cart-plus mr-1"></i>
                  {product.stock > 0 ? "Add" : "Out"}
                </button>

                <button className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 p-2 rounded-lg transition-colors">
                  <i className="fas fa-heart text-sm"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Stock Info */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {product.stock > 0
                ? `${product.stock} available`
                : "Out of stock"}
            </span>

            <button className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Product Grid Layout
const SimpleProductLayout = ({ products }) => {
  return (
    <div className="simple-product-layout">
      <div className="text-center mb-12">
        <h3 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
          Farm Fresh Products
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Premium organic produce, carefully grown and harvested for exceptional
          quality
        </p>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {products.map((product, index) => (
          <MinimalistProductCard
            key={product._id}
            product={product}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

// Updated Layout Components
const CathedralVaultLayout = ({ products }) => {
  return (
    <div className="cathedral-vault relative">
      <SimpleProductLayout products={products} />
    </div>
  );
};

const MandalaGardenLayout = ({ products }) => {
  return (
    <div className="mandala-garden relative">
      <SimpleProductLayout products={products} />
    </div>
  );
};

const MetropolitanSkylineLayout = ({ products }) => {
  return (
    <div className="metropolitan-skyline relative">
      <SimpleProductLayout products={products} />
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
          </div>

          {/* Products Display */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-32">
              <div className="text-gray-400 text-9xl mb-8">
                <i className="fas fa-magic"></i>
              </div>
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                No Mystical Creations Found
              </h3>
              <p className="text-2xl text-gray-600 dark:text-gray-400">
                {selectedCategory !== "all"
                  ? "Try exploring a different mystical realm"
                  : `${farmer.name} is still conjuring their magical products`}
              </p>
            </div>
          ) : (
            <>
              {/* Render Based on View Mode */}
              {viewMode === "cathedral" && (
                <CathedralVaultLayout products={paginatedProducts} />
              )}

              {viewMode === "mandala" && (
                <MandalaGardenLayout products={paginatedProducts} />
              )}

              {viewMode === "metropolitan" && (
                <MetropolitanSkylineLayout products={paginatedProducts} />
              )}

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
