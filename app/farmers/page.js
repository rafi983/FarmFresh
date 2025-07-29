"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function FarmersPage() {
  const [farmers, setFarmers] = useState([]);
  const [displayedFarmers, setDisplayedFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showAllFarmers, setShowAllFarmers] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch both farmers and products data
      const [farmersResponse, productsResponse] = await Promise.all([
        fetch("/api/farmers"),
        fetch("/api/products"),
      ]);

      if (!farmersResponse.ok || !productsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const farmersData = await farmersResponse.json();
      const productsData = await productsResponse.json();
      const allFarmers = farmersData.farmers || [];
      const allProducts = productsData.products || [];

      setFarmers(allFarmers);
      setProducts(allProducts);
      // Initially show only first 6 farmers
      setDisplayedFarmers(allFarmers.slice(0, 6));
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic stats
  const getStats = () => {
    const totalFarmers = farmers.length;
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.stock > 0).length;
    const categoriesCount = [...new Set(products.map((p) => p.category))]
      .length;

    return {
      totalFarmers,
      totalProducts,
      activeProducts,
      categoriesCount,
    };
  };

  const loadMoreFarmers = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayedFarmers(farmers);
      setShowAllFarmers(true);
      setLoadingMore(false);
    }, 500);
  };

  const getFarmerProductCount = (farmerId) => {
    return products.filter(
      (p) => p.farmer?.id === farmerId || p.farmerId === farmerId,
    ).length;
  };

  const getFarmerRating = (farmerId) => {
    const farmerProducts = products.filter(
      (p) => p.farmer?.id === farmerId || p.farmerId === farmerId,
    );
    if (farmerProducts.length === 0) return 0;

    const totalRating = farmerProducts.reduce(
      (sum, product) => sum + (product.averageRating || 0),
      0,
    );
    return (totalRating / farmerProducts.length).toFixed(1);
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary-600 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading farmers...</p>
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
                          {farmer.location ||
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
                        href={`/products?farmer=${encodeURIComponent(farmer.name)}`}
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
      <div className="bg-primary-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
    </div>
  );
}
