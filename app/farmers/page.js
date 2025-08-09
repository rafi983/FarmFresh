"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { useFarmersQuery } from "@/hooks/useFarmersQuery";
import { useProductsQuery } from "@/hooks/useProductsQuery";

export default function FarmersPage() {
  // UI state
  const [showAllFarmers, setShowAllFarmers] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // React Query data fetching (consistent with products page)
  const {
    data: farmersData,
    isLoading: farmersLoading,
    error: farmersError,
    refetch: refetchFarmers,
  } = useFarmersQuery();

  const { data: productsData, isLoading: productsLoading } = useProductsQuery(
    {},
    { enabled: true },
  );

  // Extract data from React Query responses
  const farmers = farmersData?.farmers || [];
  const products = productsData?.products || [];

  // Loading state - show loading if any essential data is loading
  const loading = farmersLoading || productsLoading;
  const error = farmersError;

  // Refresh function for error retry
  const fetchData = useCallback(() => {
    refetchFarmers();
  }, [refetchFarmers]);

  // Calculate dynamic stats based on farmers and products data
  const getStats = () => {
    const totalFarmers = farmers.length;
    const totalProducts = products.length;

    // Filter active/available products with more detailed logging
    const activeProducts = products.filter((product) => {
      // Don't count deleted or inactive products
      if (product.status === "deleted" || product.status === "inactive") {
        return false;
      }

      // Count products that have stock or don't have stock field defined
      // Be more permissive with stock checking
      const hasStock =
        product.stock === undefined ||
        product.stock === null ||
        parseInt(product.stock) > 0 ||
        product.stock === "";
      return hasStock;
    });

    // Get unique categories from products with better handling
    const categories = new Set();
    products.forEach((product) => {
      if (product.category && product.category.trim()) {
        // Normalize category names
        categories.add(product.category.toLowerCase().trim());
      }
    });
    const categoriesCount = categories.size;

    return {
      totalFarmers,
      totalProducts,
      activeProducts: activeProducts.length,
      categoriesCount,
    };
  };

  const loadMoreFarmers = () => {
    setShowAllFarmers(true);
  };

  const getFarmerProductCount = (farmerId) => {
    const matchingProducts = products.filter((product) => {
      // Handle different farmer ID formats
      const productFarmerId =
        product.farmer?.id || product.farmer?._id || product.farmerId;
      const productFarmerName = product.farmer?.name || product.farmerName;

      // For old farmers (farmer_001 format), try matching by ID
      const matchesById = productFarmerId === farmerId;

      // For new farmers, try matching by MongoDB ObjectId
      const matchesByObjectId = productFarmerId === farmerId;

      // Also try matching by farmer name for fallback
      const farmer = farmers.find((f) => f._id === farmerId);
      const farmerName = farmer?.name;
      const matchesByName = farmerName && productFarmerName === farmerName;

      const isMatch = matchesById || matchesByObjectId || matchesByName;

      return isMatch;
    });

    return matchingProducts.length;
  };

  const getFarmerRating = (farmerId) => {
    const farmer = farmers.find((f) => f._id === farmerId);
    const farmerEmail = farmer?.email;

    const farmerProducts = products.filter((product) => {
      const productFarmerId =
        product.farmer?.id || product.farmer?._id || product.farmerId;
      const productFarmerName = product.farmer?.name || product.farmerName;
      const productFarmerEmail = product.farmer?.email || product.farmerEmail;

      // Use the same matching logic as the farmer ID page
      const matchesById = productFarmerId === farmerId;
      const matchesByObjectId = productFarmerId === farmerId;
      const farmerName = farmer?.name;
      const matchesByName = farmerName && productFarmerName === farmerName;
      const matchesByEmail = farmerEmail && productFarmerEmail === farmerEmail;

      return (
        matchesById || matchesByObjectId || matchesByName || matchesByEmail
      );
    });

    if (farmerProducts.length === 0) return 0;

    // Calculate simple average of product ratings (only products with ratings)
    const productsWithRatings = farmerProducts.filter(
      (p) => parseFloat(p.averageRating) > 0,
    );

    if (productsWithRatings.length > 0) {
      const totalRating = productsWithRatings.reduce((sum, p) => {
        return sum + parseFloat(p.averageRating);
      }, 0);

      return (totalRating / productsWithRatings.length).toFixed(1);
    }

    return 0;
  };

  // Updated function to get total review count for a farmer from both sources
  const getFarmerReviewCount = (farmerId) => {
    const farmer = farmers.find((f) => f._id === farmerId);
    const farmerEmail = farmer?.email;

    const farmerProducts = products.filter((product) => {
      const productFarmerId =
        product.farmer?.id || product.farmer?._id || product.farmerId;
      const productFarmerName = product.farmer?.name || product.farmerName;
      const productFarmerEmail = product.farmer?.email || product.farmerEmail;

      // Use the same matching logic as the farmer ID page
      const matchesById = productFarmerId === farmerId;
      const matchesByObjectId = productFarmerId === farmerId;
      const farmerName = farmer?.name;
      const matchesByName = farmerName && productFarmerName === farmerName;
      const matchesByEmail = farmerEmail && productFarmerEmail === farmerEmail;

      return (
        matchesById || matchesByObjectId || matchesByName || matchesByEmail
      );
    });

    // Count embedded reviews in products
    const productReviewsCount = farmerProducts.reduce(
      (sum, product) => sum + (product.reviews?.length || 0),
      0,
    );

    // Count reviews from separate reviews collection
    const separateReviewsCount = reviews.filter((review) => {
      // Match reviews by farmerId directly
      if (review.farmerId === farmerId || review.farmer?._id === farmerId) {
        return true;
      }

      // Match reviews by farmer email
      if (
        farmerEmail &&
        (review.farmerEmail === farmerEmail ||
          review.farmer?.email === farmerEmail)
      ) {
        return true;
      }

      // Match reviews by product association (if the review is for a product that belongs to this farmer)
      const relatedProduct = farmerProducts.find(
        (product) =>
          product._id === review.productId ||
          product._id === review.product?._id,
      );

      return !!relatedProduct;
    }).length;

    return productReviewsCount + separateReviewsCount;
  };

  // Display logic for farmers
  const displayedFarmers = useMemo(() => {
    return showAllFarmers ? farmers : farmers.slice(0, 6);
  }, [farmers, showAllFarmers]);

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Custom CSS animations for farmers */}
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }

          @keyframes farmFloat {
            0%,
            100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-15px) rotate(3deg);
            }
          }

          @keyframes tractorMove {
            0% {
              transform: translateX(-20px);
            }
            100% {
              transform: translateX(20px);
            }
          }

          @keyframes leafSway {
            0%,
            100% {
              transform: rotate(-5deg);
            }
            50% {
              transform: rotate(5deg);
            }
          }

          .animate-shimmer {
            animation: shimmer 2s infinite;
          }

          .animate-farm-float {
            animation: farmFloat 4s ease-in-out infinite;
          }

          .animate-tractor-move {
            animation: tractorMove 3s ease-in-out infinite alternate;
          }

          .animate-leaf-sway {
            animation: leafSway 2s ease-in-out infinite;
          }
        `}</style>

        {/* Hero Section Skeleton */}
        <div className="bg-gradient-to-r from-primary-600 to-green-600 text-white py-16 relative overflow-hidden">
          {/* Animated farm background */}
          <div className="absolute inset-0 opacity-20">
            <div className="animate-farm-float absolute top-8 left-1/4">
              <i className="fas fa-tractor text-5xl text-white"></i>
            </div>
            <div
              className="animate-leaf-sway absolute top-12 right-1/3"
              style={{ animationDelay: "1s" }}
            >
              <i className="fas fa-leaf text-3xl text-white"></i>
            </div>
            <div
              className="animate-farm-float absolute bottom-8 left-1/3"
              style={{ animationDelay: "2s" }}
            >
              <i className="fas fa-seedling text-4xl text-white"></i>
            </div>
            <div
              className="animate-tractor-move absolute top-16 right-1/4"
              style={{ animationDelay: "0.5s" }}
            >
              <i className="fas fa-barn text-4xl text-white"></i>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <div className="h-12 w-96 bg-white/20 rounded-lg animate-pulse mb-4 mx-auto"></div>
              <div className="h-6 w-[600px] bg-white/15 rounded animate-pulse mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Stats Section Skeleton */}
        <div className="bg-white dark:bg-gray-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { color: "primary", icon: "user-tie", delay: "0s" },
                { color: "green", icon: "apple-alt", delay: "0.2s" },
                { color: "blue", icon: "check-circle", delay: "0.4s" },
                { color: "purple", icon: "tags", delay: "0.6s" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="text-center"
                  style={{ animationDelay: stat.delay }}
                >
                  <div className="relative mb-4">
                    <div
                      className={`h-12 w-20 bg-${stat.color}-200 dark:bg-${stat.color}-700 rounded-lg animate-pulse mx-auto`}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <i
                        className={`fas fa-${stat.icon} text-2xl text-${stat.color}-400 animate-bounce`}
                      ></i>
                    </div>
                  </div>
                  <div
                    className={`h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mx-auto`}
                    style={{ animationDelay: stat.delay }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Section Header Skeleton */}
          <div className="text-center mb-12">
            <div className="h-8 w-48 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse mb-4 mx-auto"></div>
            <div className="h-5 w-96 bg-gray-250 dark:bg-gray-650 rounded animate-pulse mx-auto"></div>
          </div>

          {/* Farmers Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden relative"
                style={{
                  animationDelay: `${index * 200}ms`,
                  animation: "fadeInUp 0.8s ease-out forwards",
                }}
              >
                {/* Shimmer effect overlay */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>

                {/* Farmer Image Skeleton */}
                <div className="relative h-48 bg-gradient-to-br from-green-200 via-green-300 to-green-200 dark:from-green-600 dark:via-green-700 dark:to-green-600 overflow-hidden">
                  {/* Animated farmer icons */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-bounce">
                      <i className="fas fa-user-tie text-5xl text-green-400 dark:text-green-300"></i>
                    </div>
                  </div>

                  {/* Floating farm elements */}
                  <div className="absolute top-3 left-3 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-60"></div>
                  <div
                    className="absolute top-6 right-4 w-2 h-2 bg-green-500 rounded-full animate-pulse opacity-70"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                  <div
                    className="absolute bottom-4 left-5 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce opacity-50"
                    style={{ animationDelay: "1s" }}
                  ></div>

                  {/* Product count badge skeleton */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-full">
                      <div className="h-3 w-16 bg-gray-400 dark:bg-gray-500 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Farmer Info Skeleton */}
                <div className="p-6 space-y-4">
                  {/* Name and Rating */}
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded-lg animate-pulse"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-700 rounded animate-pulse"></div>
                      <div className="h-3 w-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {[
                      { icon: "map-marker-alt", width: "w-24" },
                      { icon: "phone", width: "w-20" },
                      { icon: "envelope", width: "w-28" },
                    ].map((contact, contactIndex) => (
                      <div
                        key={contactIndex}
                        className="flex items-center gap-2"
                      >
                        <div className="w-4 h-4 bg-primary-300 dark:bg-primary-600 rounded animate-pulse"></div>
                        <div
                          className={`h-3 ${contact.width} bg-gray-300 dark:bg-gray-600 rounded animate-pulse`}
                          style={{ animationDelay: `${contactIndex * 0.1}s` }}
                        ></div>
                      </div>
                    ))}
                  </div>

                  {/* Specialties */}
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-400 dark:bg-gray-500 rounded animate-pulse"></div>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3].map((specialty) => (
                        <div
                          key={specialty}
                          className="h-5 w-16 bg-gradient-to-r from-primary-200 to-green-200 dark:from-primary-700 dark:to-green-700 rounded-full animate-pulse"
                          style={{ animationDelay: `${specialty * 0.15}s` }}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div
                    className="h-10 bg-gradient-to-r from-primary-300 via-primary-400 to-primary-300 dark:from-primary-600 dark:via-primary-700 dark:to-primary-600 rounded-lg animate-pulse"
                    style={{ animationDelay: "0.8s" }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button Skeleton */}
          <div className="text-center mt-12">
            <div className="h-12 w-32 bg-gradient-to-r from-primary-300 via-primary-400 to-primary-300 dark:from-primary-600 dark:via-primary-700 dark:to-primary-600 rounded-lg animate-pulse mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-gray-400 mb-6"></i>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Error Loading Farmers
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
          <button
            onClick={fetchData}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Meet Our Local Farmers
            </h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Connect with passionate farmers who grow fresh, quality produce
              using sustainable farming practices
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white dark:bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {stats.totalFarmers}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Registered Farmers
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {stats.totalProducts}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Total Products
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {stats.activeProducts}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Available Products
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {stats.categoriesCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Product Categories
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Farmers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Our Farmers
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Each farmer is committed to providing you with the freshest and
            highest quality produce
          </p>
        </div>

        {farmers.length === 0 ? (
          <div className="text-center py-16">
            <i className="fas fa-user-tie text-6xl text-gray-400 mb-6"></i>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No farmers registered yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Be the first to join our farming community
            </p>
            <Link
              href="/register"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition"
            >
              Join as Farmer
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedFarmers.map((farmer) => (
                <div
                  key={farmer._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Farmer Image */}
                  <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600">
                    {farmer.profileImage ? (
                      <img
                        src={farmer.profileImage}
                        alt={farmer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-user-tie text-6xl text-white opacity-80"></i>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 dark:bg-gray-800/90 px-3 py-1 rounded-full text-xs font-medium text-gray-900 dark:text-white">
                        {getFarmerProductCount(farmer._id)} Products
                      </span>
                    </div>
                  </div>

                  {/* Farmer Info */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {farmer.name}
                      </h3>
                      <div className="flex items-center">
                        <i className="fas fa-star text-yellow-400 text-sm mr-1"></i>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {getFarmerRating(farmer._id) || "New"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <i className="fas fa-map-marker-alt mr-2 text-primary-600"></i>
                        <span>
                          {farmer.address?.city && farmer.address?.state
                            ? `${farmer.address.city}, ${farmer.address.state}${farmer.address.country ? `, ${farmer.address.country}` : ""}`
                            : farmer.location ||
                              farmer.address ||
                              "Location not specified"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <i className="fas fa-phone mr-2 text-primary-600"></i>
                        <span>{farmer.phone || "Phone not available"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <i className="fas fa-envelope mr-2 text-primary-600"></i>
                        <span>{farmer.email}</span>
                      </div>
                    </div>

                    {farmer.specialties && farmer.specialties.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Specialties:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {farmer.specialties
                            .slice(0, 3)
                            .map((specialty, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs rounded-full"
                              >
                                {specialty}
                              </span>
                            ))}
                          {farmer.specialties.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                              +{farmer.specialties.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {farmer.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {farmer.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Link
                        href={`/farmers/${farmer._id}`}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition"
                      >
                        <i className="fas fa-shopping-bag mr-1"></i>
                        View Products
                      </Link>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <i className="fas fa-envelope"></i>
                      </button>
                    </div>

                    {/* Join Date */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                        Farmer since{" "}
                        {new Date(
                          farmer.createdAt || farmer.joinDate || Date.now(),
                        ).getFullYear()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {!showAllFarmers && farmers.length > 6 && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMoreFarmers}
                  disabled={loadingMore}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Show More Farmers ({farmers.length - 6} remaining)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Want to Join Our Farming Community?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Share your fresh produce with local customers and grow your farming
            business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white hover:bg-gray-100 text-primary-600 px-8 py-3 rounded-lg font-medium transition"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Register as Farmer
            </Link>
            <Link
              href="/products"
              className="border border-white hover:bg-white hover:text-primary-600 text-white px-8 py-3 rounded-lg font-medium transition"
            >
              <i className="fas fa-shopping-cart mr-2"></i>
              Shop Products
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
