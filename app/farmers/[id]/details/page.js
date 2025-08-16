"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import FarmerDetailsHero from "@/components/farmers/details/FarmerDetailsHero";
import ControlPanel from "@/components/farmers/details/ControlPanel";
import ProductDisplayLayout from "@/components/farmers/details/ProductDisplayLayout";
import Pagination from "@/components/farmers/details/Pagination";
import { getDisplayRating } from "@/components/farmers/details/utils";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("default");
  const [viewType, setViewType] = useState("grid");

  const PRODUCTS_PER_PAGE = 20;

  useEffect(() => {
    fetchFarmerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerId]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, selectedCategory]);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      setError(null);
      const farmerResponse = await fetch(`/api/farmers/${farmerId}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      if (!farmerResponse.ok) throw new Error("Farmer not found");
      const farmerData = await farmerResponse.json();
      setFarmer(farmerData.farmer);
      setProducts(farmerData.farmer.products || []);
    } catch (err) {
      setError(err.message);
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

  const totalPages =
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE) || 1;
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
    const productsWithRatings = products.filter((p) => getDisplayRating(p) > 0);
    const averageRating = productsWithRatings.length
      ? (
          productsWithRatings.reduce((sum, p) => sum + getDisplayRating(p), 0) /
          productsWithRatings.length
        ).toFixed(1)
      : 0;
    return { totalProducts, activeProducts, averageRating };
  }, [products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-conic from-emerald-400 via-teal-500 to-cyan-600 rounded-full animate-spin" />
              <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                <i className="fas fa-user-tie text-4xl text-emerald-600 animate-pulse" />
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
    );
  }

  if (error || !farmer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 text-8xl mb-8">
            <i className="fas fa-exclamation-triangle animate-bounce" />
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
              <i className="fas fa-arrow-left mr-2" />
              Return
            </button>
            <Link
              href="/farmers"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-medium transition-all transform hover:scale-105"
            >
              <i className="fas fa-users mr-2" />
              Explore Architects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
        <FarmerDetailsHero farmer={farmer} stats={stats} farmerId={farmerId} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-8">
              🌟 Mystical Product Dimensions 🌟
            </h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
              Experience {farmer.name}&apos;s products in breathtaking geometric
              formations and mystical arrangements
            </p>
          </div>
          <ControlPanel
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewType={viewType}
            onViewTypeChange={setViewType}
          />
          {filteredProducts.length === 0 ? (
            <div className="text-center py-32">
              <div className="text-gray-400 text-9xl mb-8">
                <i className="fas fa-seedling" />
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
              <ProductDisplayLayout
                products={paginatedProducts}
                viewType={viewType}
                sortBy={sortBy}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
