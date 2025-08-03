"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import { apiService } from "@/lib/api-service";

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
  const [viewMode, setViewMode] = useState("hexagon");
  const [currentPage, setCurrentPage] = useState(1);

  const PRODUCTS_PER_PAGE = 18;

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

      const [farmerResponse, productsResponse] = await Promise.all([
        fetch(`/api/farmers/${farmerId}`, {
          headers: { "Cache-Control": "no-cache" },
        }),
        apiService.getProducts({
          farmerId: farmerId,
          limit: 1000,
        }),
      ]);

      if (!farmerResponse.ok) {
        throw new Error("Farmer not found");
      }

      const farmerData = await farmerResponse.json();
      const farmerProducts = (productsResponse.products || []).filter(
        (product) => {
          return (
            product.farmerId === farmerId ||
            product.farmer?.id === farmerId ||
            product.farmer?._id === farmerId ||
            product.farmer?.email === farmerData.farmer?.email
          );
        },
      );

      setFarmer(farmerData.farmer);
      setProducts(farmerProducts);
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
              <div className="w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <i className="fas fa-user-tie text-3xl text-emerald-600"></i>
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Loading Farmer Details
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Preparing farmer information...
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
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-6">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Farmer Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {error || "The farmer you're looking for doesn't exist."}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Go Back
              </button>
              <Link
                href="/farmers"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                <i className="fas fa-users mr-2"></i>
                Browse Farmers
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section with Farmer Profile */}
        <div className="relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"></div>
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Floating Geometric Shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-400/20 transform rotate-45 animate-float"></div>
            <div className="absolute top-40 right-32 w-24 h-24 bg-emerald-400/30 rounded-full animate-bounce-slow"></div>
            <div className="absolute bottom-32 left-40 w-28 h-28 bg-cyan-400/25 transform rotate-12 animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-36 h-36 bg-teal-400/20 rounded-full animate-float-reverse"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            {/* Breadcrumb */}
            <nav className="flex mb-12" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-3 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-white/80 hover:text-white transition-colors flex items-center"
                  >
                    <i className="fas fa-home mr-2"></i>
                    Home
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-white/60"></i>
                </li>
                <li>
                  <Link
                    href="/farmers"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Farmers
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-white/60"></i>
                </li>
                <li className="text-white font-medium">{farmer.name}</li>
              </ol>
            </nav>

            {/* Farmer Profile Header */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Farmer Avatar & Info */}
              <div className="text-center lg:text-left">
                <div className="relative inline-block mb-8">
                  {/* Hexagonal Avatar Container */}
                  <div className="relative w-48 h-48 mx-auto lg:mx-0">
                    <div
                      className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-4 border-white/30 overflow-hidden shadow-2xl transform hover:scale-105 transition-all duration-500"
                      style={{
                        clipPath:
                          "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                      }}
                    >
                      {farmer.profilePicture ? (
                        <img
                          src={farmer.profilePicture}
                          alt={farmer.name}
                          className="w-full h-full object-cover"
                          style={{
                            clipPath:
                              "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fas fa-user-tie text-6xl text-white/80"></i>
                        </div>
                      )}
                    </div>

                    {/* Verified Badge */}
                    {farmer.verified && (
                      <div className="absolute -top-4 -right-4 bg-emerald-500 text-white rounded-full p-3 shadow-lg animate-pulse">
                        <i className="fas fa-check text-lg"></i>
                      </div>
                    )}

                    {/* Rotating Ring */}
                    <div className="absolute inset-0 border-4 border-dashed border-white/40 rounded-full animate-spin-slow"></div>
                  </div>
                </div>

                <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                  {farmer.name}
                </h1>
                <p className="text-2xl text-white/90 mb-6">
                  {farmer.farmName || `${farmer.name}'s Farm`}
                </p>

                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                    <i className="fas fa-map-marker-alt mr-3 text-yellow-400"></i>
                    <span className="font-medium">{farmer.location}</span>
                  </div>
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                    <i className="fas fa-star mr-3 text-yellow-400"></i>
                    <span className="font-medium">
                      {stats.averageRating} Rating
                    </span>
                  </div>
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                    <i className="fas fa-seedling mr-3 text-emerald-400"></i>
                    <span className="font-medium">
                      {stats.totalProducts} Products
                    </span>
                  </div>
                </div>

                {farmer.bio && (
                  <p className="text-white/90 text-lg leading-relaxed mb-8 max-w-2xl">
                    {farmer.bio}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Link
                    href={`/farmers/${farmerId}`}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 border border-white/30"
                  >
                    <i className="fas fa-shopping-cart mr-2"></i>
                    Shop Products
                  </Link>
                  <button className="bg-emerald-500/20 backdrop-blur-sm hover:bg-emerald-500/30 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 border border-emerald-400/30">
                    <i className="fas fa-heart mr-2"></i>
                    Follow Farmer
                  </button>
                </div>
              </div>

              {/* Stats Dashboard */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-3">
                      {stats.totalProducts}
                    </div>
                    <div className="text-white/80 text-lg">Total Products</div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-emerald-400 mb-3">
                      {stats.activeProducts}
                    </div>
                    <div className="text-white/80 text-lg">Available</div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 col-span-2">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-400 mb-3">
                      {stats.averageRating}★
                    </div>
                    <div className="text-white/80 text-lg">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specializations */}
            {farmer.specializations && farmer.specializations.length > 0 && (
              <div className="mt-16 text-center">
                <h3 className="text-2xl font-semibold text-white mb-6">
                  Specializations
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {farmer.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-lg font-medium border border-white/30 hover:bg-white/30 transition-all duration-300"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6">
              🌿 Farm Fresh Products 🌿
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Discover the finest organic produce directly from {farmer.name}'s
              farm
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-6 py-3 bg-transparent border-none focus:outline-none text-gray-700 dark:text-gray-300 font-medium"
              >
                <option value="all">All Categories</option>
                {categories.slice(1).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg">
              <button
                onClick={() => setViewMode("hexagon")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  viewMode === "hexagon"
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-emerald-500"
                }`}
              >
                <i className="fas fa-shapes mr-2"></i>
                Hexagon View
              </button>
              <button
                onClick={() => setViewMode("spiral")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  viewMode === "spiral"
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-emerald-500"
                }`}
              >
                <i className="fas fa-tornado mr-2"></i>
                Spiral Garden
              </button>
              <button
                onClick={() => setViewMode("constellation")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  viewMode === "constellation"
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-emerald-500"
                }`}
              >
                <i className="fas fa-star mr-2"></i>
                Constellation
              </button>
            </div>
          </div>

          {/* Products Display */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-8xl mb-6">
                <i className="fas fa-seedling"></i>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                No Products Found
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {selectedCategory !== "all"
                  ? "Try selecting a different category"
                  : `${farmer.name} hasn't added any products yet`}
              </p>
            </div>
          ) : (
            <>
              {/* Hexagon View */}
              {viewMode === "hexagon" && (
                <div className="relative">
                  {/* Honeycomb Background Pattern */}
                  <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 200 200"
                      className="w-full h-full"
                    >
                      <defs>
                        <pattern
                          id="hexPattern"
                          x="0"
                          y="0"
                          width="60"
                          height="52"
                          patternUnits="userSpaceOnUse"
                        >
                          <polygon
                            points="30,2 52,16 52,36 30,50 8,36 8,16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            opacity="0.3"
                          />
                        </pattern>
                      </defs>
                      <rect
                        width="100%"
                        height="100%"
                        fill="url(#hexPattern)"
                      />
                    </svg>
                  </div>

                  {/* Enhanced Hexagonal Product Layout */}
                  <div className="relative space-y-16">
                    {/* Central Hero Hexagon */}
                    {paginatedProducts.length > 0 && (
                      <div className="flex justify-center mb-20">
                        <div className="relative">
                          <HexagonProduct
                            product={paginatedProducts[0]}
                            index={0}
                            colorScheme="emerald"
                            size="hero"
                            isHero={true}
                          />
                          {/* Orbit Rings */}
                          <div
                            className="absolute inset-0 border-4 border-dashed border-emerald-300/30 rounded-full animate-spin-slow"
                            style={{
                              width: "300px",
                              height: "300px",
                              top: "-50px",
                              left: "-50px",
                            }}
                          ></div>
                          <div
                            className="absolute inset-0 border-2 border-dotted border-teal-300/20 rounded-full animate-reverse-spin"
                            style={{
                              width: "250px",
                              height: "250px",
                              top: "-25px",
                              left: "-25px",
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* First Ring - 6 products around center */}
                    {paginatedProducts.length > 1 && (
                      <div className="relative flex justify-center">
                        <div className="relative w-96 h-96">
                          {paginatedProducts
                            .slice(1, 7)
                            .map((product, index) => {
                              const angle = index * 60 + 30; // 60 degrees apart, offset by 30
                              const radius = 140;
                              const x =
                                Math.cos((angle * Math.PI) / 180) * radius;
                              const y =
                                Math.sin((angle * Math.PI) / 180) * radius;

                              return (
                                <div
                                  key={product._id}
                                  className="absolute"
                                  style={{
                                    left: `calc(50% + ${x}px)`,
                                    top: `calc(50% + ${y}px)`,
                                    transform: "translate(-50%, -50%)",
                                    animationDelay: `${(index + 1) * 200}ms`,
                                  }}
                                >
                                  <HexagonProduct
                                    product={product}
                                    index={index + 1}
                                    colorScheme={
                                      index % 2 === 0 ? "teal" : "cyan"
                                    }
                                    size="large"
                                  />
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Second Ring - 12 products */}
                    {paginatedProducts.length > 7 && (
                      <div className="relative flex justify-center">
                        <div className="relative w-[600px] h-[600px]">
                          {paginatedProducts
                            .slice(7, 19)
                            .map((product, index) => {
                              const angle = index * 30; // 30 degrees apart
                              const radius = 220;
                              const x =
                                Math.cos((angle * Math.PI) / 180) * radius;
                              const y =
                                Math.sin((angle * Math.PI) / 180) * radius;

                              return (
                                <div
                                  key={product._id}
                                  className="absolute"
                                  style={{
                                    left: `calc(50% + ${x}px)`,
                                    top: `calc(50% + ${y}px)`,
                                    transform: "translate(-50%, -50%)",
                                    animationDelay: `${(index + 7) * 150}ms`,
                                  }}
                                >
                                  <HexagonProduct
                                    product={product}
                                    index={index + 7}
                                    colorScheme={
                                      index % 3 === 0
                                        ? "indigo"
                                        : index % 3 === 1
                                          ? "purple"
                                          : "pink"
                                    }
                                    size="medium"
                                  />
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Spiral Garden View */}
              {viewMode === "spiral" && (
                <div className="relative overflow-hidden">
                  <div className="text-center mb-16">
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6">
                      🌿 Flowing River Garden 🌿
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      Products flowing like a meandering river through the
                      garden
                    </p>
                  </div>

                  {/* Flowing River Path */}
                  <div className="relative min-h-[1200px]">
                    {/* Background River Path */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 1200 1200"
                        className="w-full h-full"
                      >
                        <path
                          d="M100,100 Q400,200 300,400 Q200,600 500,700 Q800,800 700,1000 Q600,1200 900,1100"
                          stroke="url(#riverGradient)"
                          strokeWidth="80"
                          fill="none"
                          opacity="0.3"
                        />
                        <defs>
                          <linearGradient
                            id="riverGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* River Flow Layout */}
                    <div className="space-y-32">
                      {Array.from(
                        { length: Math.ceil(paginatedProducts.length / 4) },
                        (_, rowIndex) => {
                          const rowProducts = paginatedProducts.slice(
                            rowIndex * 4,
                            (rowIndex + 1) * 4,
                          );
                          const isEvenRow = rowIndex % 2 === 0;

                          return (
                            <div
                              key={rowIndex}
                              className={`flex ${isEvenRow ? "justify-start" : "justify-end"} relative`}
                            >
                              {/* River Bend Container */}
                              <div
                                className={`flex ${isEvenRow ? "flex-row" : "flex-row-reverse"} items-center space-x-16 max-w-6xl`}
                              >
                                {rowProducts.map((product, productIndex) => {
                                  const totalIndex =
                                    rowIndex * 4 + productIndex;

                                  return (
                                    <div
                                      key={product._id}
                                      className="animate-fade-in-up"
                                      style={{
                                        animationDelay: `${totalIndex * 200}ms`,
                                      }}
                                    >
                                      <RiverProduct
                                        product={product}
                                        index={totalIndex}
                                        position={productIndex}
                                        isReversed={!isEvenRow}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Constellation View */}
              {viewMode === "constellation" && (
                <div className="relative overflow-hidden">
                  <div className="text-center mb-16">
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                      ✨ Floating Islands Marketplace ✨
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      Discover products on magical floating islands
                    </p>
                  </div>

                  {/* Floating Clouds Background */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-32 h-16 bg-white/10 rounded-full animate-float"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 5}s`,
                          animationDuration: `${8 + Math.random() * 4}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Floating Islands Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-32 min-h-[1000px] items-center">
                    {Array.from(
                      { length: Math.ceil(paginatedProducts.length / 3) },
                      (_, islandIndex) => {
                        const islandProducts = paginatedProducts.slice(
                          islandIndex * 3,
                          (islandIndex + 1) * 3,
                        );

                        return (
                          <div key={islandIndex} className="relative">
                            <FloatingIsland
                              products={islandProducts}
                              islandIndex={islandIndex}
                            />
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-16 flex items-center justify-center space-x-3">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    const isCurrentPage = page === currentPage;

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                          isCurrentPage
                            ? "bg-emerald-500 text-white transform scale-110"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
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

// Hexagon Product Component
function HexagonProduct({
  product,
  index,
  colorScheme = "emerald",
  size = "large",
  isHero = false,
}) {
  const colorClasses = {
    emerald:
      "from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800",
    teal: "from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800",
    cyan: "from-cyan-100 to-cyan-200 dark:from-cyan-900 dark:to-cyan-800",
    indigo:
      "from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800",
  };

  const sizeClasses = {
    small: "w-20 h-20",
    medium: "w-28 h-28",
    large: "w-36 h-36",
    hero: "w-48 h-48",
  };

  const priceColors = {
    emerald: "from-emerald-500 to-emerald-600",
    teal: "from-teal-500 to-teal-600",
    cyan: "from-cyan-500 to-cyan-600",
    indigo: "from-indigo-500 to-indigo-600",
  };

  return (
    <div
      className={`group relative animate-fade-in-up ${isHero ? "scale-110" : ""}`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className={`relative ${sizeClasses[size]} mx-auto`}>
        <div
          className={`w-full h-full bg-gradient-to-br ${colorClasses[colorScheme]} relative overflow-hidden group-hover:scale-110 transition-all duration-500 shadow-xl group-hover:shadow-2xl`}
          style={{
            clipPath:
              "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          }}
        >
          <div className="absolute inset-2">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
                style={{
                  clipPath:
                    "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
                style={{
                  clipPath:
                    "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                }}
              >
                <i
                  className={`fas fa-seedling ${size === "small" ? "text-lg" : size === "medium" ? "text-2xl" : "text-3xl"} text-gray-400`}
                ></i>
              </div>
            )}
          </div>

          <div
            className={`absolute inset-0 bg-gradient-to-t from-${colorScheme}-600/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center`}
            style={{
              clipPath:
                "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
            }}
          >
            <Link
              href={`/products/${product._id}`}
              className="bg-white/95 text-gray-900 px-3 py-2 rounded-full text-sm font-bold hover:bg-white transition-all duration-300 transform scale-0 group-hover:scale-100"
            >
              View
            </Link>
          </div>
        </div>

        <div
          className={`absolute -top-2 -right-2 bg-gradient-to-r ${priceColors[colorScheme]} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-500`}
        >
          ${product.price}
        </div>

        <div className="absolute -bottom-2 -left-2">
          {product.stock === 0 ? (
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              Sold Out
            </div>
          ) : product.stock <= 5 ? (
            <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              {product.stock} left
            </div>
          ) : (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              ✓
            </div>
          )}
        </div>
      </div>

      {size !== "small" && (
        <div className="mt-4 text-center">
          <h3
            className={`font-bold text-gray-900 dark:text-white ${size === "medium" ? "text-sm" : "text-base"} group-hover:text-${colorScheme}-600 transition-colors duration-300 line-clamp-2`}
          >
            {product.name}
          </h3>
          <div
            className={`text-${colorScheme}-600 font-bold ${size === "medium" ? "text-sm" : "text-base"} mt-1`}
          >
            ${product.price}/{product.unit}
          </div>
        </div>
      )}
    </div>
  );
}

// Grid Product Component
function GridProduct({ product, index }) {
  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative aspect-square overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
            <i className="fas fa-seedling text-6xl text-gray-400"></i>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute bottom-4 left-4 right-4 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
            <Link
              href={`/products/${product._id}`}
              className="w-full bg-white/95 hover:bg-white text-gray-900 px-4 py-3 rounded-xl font-bold transition-all duration-300 text-center block backdrop-blur-sm"
            >
              🛒 View Product
            </Link>
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          ${product.price}
        </div>

        <div className="absolute top-4 left-4">
          {product.stock === 0 ? (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              Sold Out
            </div>
          ) : product.stock <= 5 ? (
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              {product.stock} left
            </div>
          ) : (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              ✓ Available
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2 group-hover:text-emerald-600 transition-colors duration-300 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-emerald-600">
            ${product.price}
            <span className="text-sm text-gray-500">/{product.unit}</span>
          </div>
          <div className="text-sm text-gray-500">{product.category}</div>
        </div>
      </div>
    </div>
  );
}

// Spiral Product Component
function SpiralProduct({
  product,
  index,
  colorScheme = "emerald",
  size = "medium",
  angle = 0,
}) {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32",
    hero: "w-40 h-40",
  };

  const colorClasses = {
    emerald: "from-emerald-400 to-emerald-600",
    teal: "from-teal-400 to-teal-600",
    cyan: "from-cyan-400 to-cyan-600",
    indigo: "from-indigo-400 to-indigo-600",
    purple: "from-purple-400 to-purple-600",
    pink: "from-pink-400 to-pink-600",
  };

  return (
    <div
      className={`group relative ${sizeClasses[size]} animate-fade-in-up hover:scale-110 transition-all duration-500`}
      style={{
        animationDelay: `${index * 100}ms`,
        transform: `rotate(${angle * 0.1}deg)`,
      }}
    >
      {/* Spiral Background Ring */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorClasses[colorScheme]} rounded-full opacity-20 animate-spin-slow`}
      ></div>

      {/* Product Container */}
      <div className="relative w-full h-full rounded-full overflow-hidden shadow-xl border-4 border-white/50 dark:border-gray-800/50">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
            <i
              className={`fas fa-seedling ${size === "small" ? "text-sm" : size === "medium" ? "text-xl" : "text-3xl"} text-gray-400`}
            ></i>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
          <Link
            href={`/products/${product._id}`}
            className="bg-white/95 text-gray-900 px-3 py-1 rounded-full text-xs font-bold hover:bg-white transition-all duration-300 transform scale-0 group-hover:scale-100"
          >
            🌟 View
          </Link>
        </div>

        {/* Price Tag */}
        <div
          className={`absolute -top-2 -right-2 bg-gradient-to-r ${colorClasses[colorScheme]} text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-500`}
        >
          ${product.price}
        </div>

        {/* Glow Effect */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${colorClasses[colorScheme]} opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-sm -z-10`}
        ></div>
      </div>

      {/* Product Name for larger sizes */}
      {size !== "small" && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <h4 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1 px-2 py-1 bg-white/80 dark:bg-gray-800/80 rounded-full backdrop-blur-sm">
            {product.name}
          </h4>
        </div>
      )}
    </div>
  );
}

// Constellation Star Component
function ConstellationStar({
  product,
  index,
  isCenter = false,
  constellation,
}) {
  const starSize = isCenter ? "w-20 h-20" : "w-12 h-12";
  const brightness = isCenter ? "brightness-125" : "brightness-100";

  const constellationColors = [
    "from-blue-400 to-indigo-500",
    "from-purple-400 to-pink-500",
    "from-cyan-400 to-blue-500",
    "from-indigo-400 to-purple-500",
    "from-pink-400 to-rose-500",
    "from-teal-400 to-cyan-500",
  ];

  const colorScheme =
    constellationColors[constellation % constellationColors.length];

  return (
    <div
      className={`group relative ${starSize} animate-fade-in-up ${brightness}`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Star Background */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {/* Pulsing Glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colorScheme} rounded-full animate-pulse opacity-60`}
        ></div>

        {/* Core Star */}
        <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-white/50 shadow-xl">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
              <i
                className={`fas fa-star ${isCenter ? "text-2xl" : "text-lg"} text-gray-400`}
              ></i>
            </div>
          )}
        </div>

        {/* Star Points Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={`absolute top-0 left-1/2 w-0.5 h-6 bg-gradient-to-t ${colorScheme} transform -translate-x-1/2 -translate-y-3 opacity-80`}
          ></div>
          <div
            className={`absolute bottom-0 left-1/2 w-0.5 h-6 bg-gradient-to-b ${colorScheme} transform -translate-x-1/2 translate-y-3 opacity-80`}
          ></div>
          <div
            className={`absolute left-0 top-1/2 h-0.5 w-6 bg-gradient-to-l ${colorScheme} transform -translate-y-1/2 -translate-x-3 opacity-80`}
          ></div>
          <div
            className={`absolute right-0 top-1/2 h-0.5 w-6 bg-gradient-to-r ${colorScheme} transform -translate-y-1/2 translate-x-3 opacity-80`}
          ></div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full flex items-center justify-center">
          <Link
            href={`/products/${product._id}`}
            className="bg-white/95 text-gray-900 px-2 py-1 rounded-full text-xs font-bold hover:bg-white transition-all duration-300 transform scale-0 group-hover:scale-100"
          >
            ✨ View
          </Link>
        </div>

        {/* Price Constellation */}
        <div
          className={`absolute -top-1 -right-1 bg-gradient-to-r ${colorScheme} text-white px-1 py-0.5 rounded-full text-xs font-bold shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-500`}
        >
          ${product.price}
        </div>
      </div>

      {/* Star Name */}
      {isCenter && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-center">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white px-3 py-1 bg-white/90 dark:bg-gray-800/90 rounded-full backdrop-blur-sm shadow-lg">
            {product.name}
          </h4>
        </div>
      )}
    </div>
  );
}

// River Product Component
function RiverProduct({ product, index, position, isReversed }) {
  const riverColors = [
    "from-emerald-400 to-emerald-600",
    "from-teal-400 to-teal-600",
    "from-cyan-400 to-cyan-600",
    "from-indigo-400 to-indigo-600",
  ];

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32",
    hero: "w-40 h-40",
  };

  const colorScheme = riverColors[index % riverColors.length];

  return (
    <div
      className={`group relative ${sizeClasses.large} animate-fade-in-up transition-all duration-500 ${
        isReversed ? "scale-x-[-1]" : ""
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* River Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorScheme} rounded-full opacity-30 animate-pulse`}
      ></div>

      {/* Product Container */}
      <div className="relative w-full h-full rounded-full overflow-hidden shadow-xl border-4 border-white/50 dark:border-gray-800/50">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
            <i
              className={`fas fa-seedling ${size === "small" ? "text-sm" : size === "medium" ? "text-xl" : "text-3xl"} text-gray-400`}
            ></i>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
          <Link
            href={`/products/${product._id}`}
            className="bg-white/95 text-gray-900 px-3 py-1 rounded-full text-xs font-bold hover:bg-white transition-all duration-300 transform scale-0 group-hover:scale-100"
          >
            🌊 View
          </Link>
        </div>

        {/* Price Tag */}
        <div
          className={`absolute -top-2 -right-2 bg-gradient-to-r ${colorScheme} text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-500`}
        >
          ${product.price}
        </div>

        {/* Stock Indicator */}
        <div className="absolute -bottom-2 -left-2">
          {product.stock === 0 ? (
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              Sold Out
            </div>
          ) : product.stock <= 5 ? (
            <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              {product.stock} left
            </div>
          ) : (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              ✓
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Floating Island Component
function FloatingIsland({ products, islandIndex }) {
  const islandColors = [
    "from-indigo-500 to-purple-600",
    "from-purple-500 to-pink-600",
    "from-pink-500 to-red-600",
    "from-red-500 to-orange-600",
  ];

  const colorScheme = islandColors[islandIndex % islandColors.length];

  return (
    <div className="relative w-full">
      {/* Island Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorScheme} rounded-3xl opacity-30 animate-float`}
      ></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((product, index) => (
          <div
            key={product._id}
            className="relative group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl transition-all duration-500 transform hover:-translate-y-2"
          >
            <div className="relative aspect-square overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                  <i className="fas fa-seedling text-6xl text-gray-400"></i>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute bottom-4 left-4 right-4 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                  <Link
                    href={`/products/${product._id}`}
                    className="w-full bg-white/95 hover:bg-white text-gray-900 px-4 py-3 rounded-xl font-bold transition-all duration-300 text-center block backdrop-blur-sm"
                  >
                    🛒 View Product
                  </Link>
                </div>
              </div>

              <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                ${product.price}
              </div>

              <div className="absolute top-4 left-4">
                {product.stock === 0 ? (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    Sold Out
                  </div>
                ) : product.stock <= 5 ? (
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    {product.stock} left
                  </div>
                ) : (
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    ✓ Available
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2 group-hover:text-emerald-600 transition-colors duration-300 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-emerald-600">
                  ${product.price}
                  <span className="text-sm text-gray-500">/{product.unit}</span>
                </div>
                <div className="text-sm text-gray-500">{product.category}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
