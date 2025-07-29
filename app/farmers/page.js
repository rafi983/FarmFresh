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
    const activeFarmers = farmers.length;

    // Extract unique districts/locations
    const districts = [
      ...new Set(
        farmers
          .map((farmer) => farmer.location?.split(",")[0]?.trim())
          .filter(Boolean),
      ),
    ];

    // Use actual products count from products API
    const totalProducts = products.length;

    // Calculate certified farmers percentage
    const certifiedFarmers = farmers.filter(
      (farmer) => farmer.isCertified,
    ).length;
    const organicPercentage =
      activeFarmers > 0
        ? Math.round((certifiedFarmers / activeFarmers) * 100)
        : 0;

    return {
      activeFarmers,
      districts: districts.length,
      totalProducts,
      organicPercentage,
    };
  };

  const stats = getStats();

  const handleLoadMore = async () => {
    setLoadingMore(true);
    // Show all farmers
    setTimeout(() => {
      setDisplayedFarmers(farmers);
      setShowAllFarmers(true);
      setLoadingMore(false);
    }, 500);
  };

  const FarmerCard = ({ farmer, isFirst6 = false }) => {
    // Use default values for display if not provided
    const farmSize = farmer.farmSize || (isFirst6 ? "5" : "0");
    const productCount = farmer.productCount || (isFirst6 ? "12" : "0");
    const rating = farmer.rating || "4.8";

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="relative">
          <img
            src={
              farmer.profileImage ||
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face"
            }
            alt={farmer.name}
            className="w-full h-64 object-cover"
          />
          <div className="absolute top-4 right-4">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              <i className="fas fa-certificate mr-1"></i>Certified
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {farmer.name}
            </h3>
            <div className="flex items-center text-yellow-400">
              <i className="fas fa-star"></i>
              <span className="text-gray-600 dark:text-gray-400 ml-1">
                {rating}
              </span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            <i className="fas fa-map-marker-alt mr-2"></i>
            {farmer.location}
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {farmer.description}
          </p>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Farm Size:</span> {farmSize} acres
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Products:</span> {productCount}
            </div>
          </div>
          <div className="flex space-x-2 mb-4">
            {farmer.specializations?.slice(0, 2).map((spec, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-full text-xs ${
                  index === 0
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                }`}
              >
                {spec}
              </span>
            ))}
          </div>
          <div className="flex space-x-3">
            <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
              View Products
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <i className="fas fa-phone"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Meet Our Farmers</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Discover the passionate farmers who grow fresh, organic produce with
            care and dedication
          </p>
        </div>
      </div>

      {/* Farmers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {stats.activeFarmers}+
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Active Farmers
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {stats.districts}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Districts Covered
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {stats.totalProducts}+
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Products Available
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {stats.organicPercentage}%
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Organic Certified
            </div>
          </div>
        </div>

        {/* Farmers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedFarmers.map((farmer, index) => (
            <FarmerCard key={farmer._id} farmer={farmer} isFirst6={index < 6} />
          ))}
        </div>

        {/* Load More */}
        {!showAllFarmers && farmers.length > 6 && (
          <div className="text-center mt-12">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-medium transition flex items-center justify-center mx-auto"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Loading More Farmers...
                </>
              ) : (
                "Load More Farmers"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Join as Farmer CTA */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Want to Join Our Farmer Community?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Share your fresh produce with thousands of customers and grow your
            business
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Join as Farmer
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary-500 p-2 rounded-lg">
                  <i className="fas fa-seedling text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold">FarmFresh</h3>
                  <p className="text-sm text-gray-400">Local Farmer Booking</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Connecting communities with fresh, local produce directly from
                farmers.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/" className="hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-white">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/farmers" className="hover:text-white">
                    Farmers
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Farmers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/register" className="hover:text-white">
                    Join as Farmer
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Add Products
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Manage Listings
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Farmer Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2025 FarmFresh - Local Farmer Booking. All rights reserved
              by LWS.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
