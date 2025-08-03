"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function FarmerPage() {
  const router = useRouter();
  const params = useParams();
  const farmerId = params.id;

  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFarmerData();
  }, [farmerId]);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const farmerResponse = await fetch(`/api/farmers/${farmerId}`, {
        headers: { "Cache-Control": "no-cache" },
      });

      if (!farmerResponse.ok) {
        throw new Error("Farmer not found");
      }

      const farmerData = await farmerResponse.json();
      setFarmer(farmerData.farmer);
    } catch (error) {
      console.error("Error fetching farmer data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 dark:border-gray-600 border-t-green-600 dark:border-t-green-400 mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-user-tie text-green-600 dark:text-green-400 text-2xl"></i>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Loading Farmer
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching farmer information...
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
              {error ||
                "The farmer you're looking for doesn't exist or has been removed."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Go Back
              </button>
              <Link
                href="/farmers"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition"
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-blue-600 to-purple-600"></div>
          <div className="absolute inset-0 bg-black/20"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            {/* Breadcrumb */}
            <nav className="flex mb-8" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-white/80 hover:text-white transition-colors flex items-center"
                  >
                    <i className="fas fa-home mr-1"></i>
                    Home
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-white/60 text-xs"></i>
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
                  <i className="fas fa-chevron-right text-white/60 text-xs"></i>
                </li>
                <li className="text-white font-medium">{farmer.name}</li>
              </ol>
            </nav>

            {/* Farmer Profile */}
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-4 border-white/30 overflow-hidden shadow-2xl">
                  {farmer.profilePicture ? (
                    <img
                      src={farmer.profilePicture}
                      alt={farmer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-user-tie text-5xl text-white/80"></i>
                    </div>
                  )}
                </div>
                {farmer.verified && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2 shadow-lg">
                    <i className="fas fa-check text-sm"></i>
                  </div>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                {farmer.name}
              </h1>
              <p className="text-xl text-white/90 mb-6">
                {farmer.farmName || `${farmer.name}'s Farm`}
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <div className="flex items-center text-white/90">
                  <i className="fas fa-map-marker-alt mr-2 text-yellow-400"></i>
                  <span>{farmer.location}</span>
                </div>
                <div className="flex items-center text-white/90">
                  <i className="fas fa-calendar mr-2 text-green-400"></i>
                  <span>
                    Since{" "}
                    {new Date(
                      farmer.joinedDate || farmer.createdAt,
                    ).getFullYear()}
                  </span>
                </div>
              </div>

              {farmer.bio && (
                <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
                  {farmer.bio}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href={`/farmers/${farmerId}/details`}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 border border-white/30"
                >
                  <i className="fas fa-store mr-2"></i>
                  View Products & Store
                </Link>
                <Link
                  href={`/farmers/${farmerId}/contact`}
                  className="bg-green-500/20 backdrop-blur-sm hover:bg-green-500/30 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 border border-green-400/30"
                >
                  <i className="fas fa-envelope mr-2"></i>
                  Contact Farmer
                </Link>
              </div>
            </div>

            {/* Specializations */}
            {farmer.specializations && farmer.specializations.length > 0 && (
              <div className="mt-16 text-center">
                <h3 className="text-2xl font-semibold text-white mb-6">
                  Specializations
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {farmer.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link
              href={`/farmers/${farmerId}/details`}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-store text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Browse Products
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Explore all products from this farmer with our hexagonal
                  showcase
                </p>
              </div>
            </Link>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-star text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Reviews & Ratings
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  See what other customers say about this farmer's products
                </p>
              </div>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-envelope text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Contact & Support
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get in touch directly with the farmer for custom orders
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
