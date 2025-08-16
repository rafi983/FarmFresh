"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
  useDeferredValue,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "../../components/ProductCard";
import Loading from "../../components/Loading";
import Footer from "../../components/Footer";
import { useUnifiedProductsData } from "@/hooks/useUnifiedProductsData";
import { useFarmersQuery } from "@/hooks/useFarmersQuery";
import { debounce } from "@/utils/debounce";
import {
  CATEGORY_OPTIONS,
  PRICE_RANGE_OPTIONS,
  TAG_OPTIONS,
  ITEMS_PER_PAGE,
} from "@/components/products/constants";
import {
  applyFiltersAndSorting,
  countActiveFilters,
} from "@/components/products/helpers";
import FiltersBar from "@/components/products/FiltersBar";
import FilterSidebar from "@/components/products/FilterSidebar";
import Pagination from "@/components/products/Pagination";
import {
  ProductCardSkeleton,
  FilterSidebarSkeleton,
  HeaderSkeleton,
  GlobalLoadingSkeleton,
} from "@/components/products/Skeletons";
import Chip from "@/components/products/Chips";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

function EmptyState({ clearAll }) {
  return (
    <div className="text-center py-12">
      <i className="fas fa-search text-6xl text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No products found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Try adjusting your search criteria or browse all products
      </p>
      <button
        onClick={clearAll}
        className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition"
      >
        Browse All Products
      </button>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filters, setFilters] = useState(() => ({
    searchTerm: searchParams.get("search") || "",
    selectedCategory: searchParams.get("category") || "All Categories",
    selectedPriceRanges: searchParams.get("priceRanges")?.split(",") || [],
    selectedRatings: searchParams.get("ratings")?.split(",").map(Number) || [],
    selectedFarmers: searchParams.get("farmers")?.split(",") || [],
    selectedTags: searchParams.get("tags")?.split(",") || [],
    priceRangeSlider: [
      Number(searchParams.get("minPrice")) || 0,
      Number(searchParams.get("maxPrice")) || 10000,
    ],
    sortBy: searchParams.get("sort") || "newest",
  }));
  const deferredSearchTerm = useDeferredValue(filters.searchTerm);
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const {
    products: allProducts,
    isLoading: loading,
    error,
    refetch: refetchProducts,
  } = useUnifiedProductsData({ ...filters, searchTerm: deferredSearchTerm });
  const { data: farmersData } = useFarmersQuery();

  const availableFarmers = useMemo(
    () =>
      (farmersData?.farmers || [])
        .map((f) => f.name)
        .filter(Boolean)
        .sort(),
    [farmersData],
  );
  const farmerLookup = useMemo(() => {
    const map = new Map();
    (farmersData?.farmers || []).forEach((f) => {
      if (f._id) map.set(f._id, f);
      if (f.email) map.set(f.email, f);
    });
    return map;
  }, [farmersData]);

  const enhancedProducts = useMemo(
    () =>
      allProducts.map((p) => {
        const farmerId = p.farmer?.id || p.farmer?._id || p.farmerId;
        const farmerEmail = p.farmer?.email || p.farmerEmail;
        const farmerName = p.farmer?.name || p.farmerName;
        let fresh = farmerId && farmerLookup.get(farmerId);
        if (!fresh && farmerEmail) fresh = farmerLookup.get(farmerEmail);
        if (!fresh && farmerName)
          fresh = (farmersData?.farmers || []).find(
            (f) => f.name === farmerName,
          );
        return fresh
          ? {
              ...p,
              farmer: {
                ...p.farmer,
                name: fresh.name,
                email: fresh.email,
                phone: fresh.phone,
                id: fresh._id,
                _id: fresh._id,
              },
              farmerName: fresh.name,
              farmerEmail: fresh.email,
              farmerId: fresh._id,
            }
          : {
              ...p,
              farmerName:
                farmerName ||
                (typeof p.farmer === "string" ? p.farmer : "Unknown Farmer"),
            };
      }),
    [allProducts, farmerLookup, farmersData],
  );

  const filteredProducts = useMemo(
    () =>
      applyFiltersAndSorting(enhancedProducts, {
        ...filters,
        searchTerm: deferredSearchTerm,
      }),
    [enhancedProducts, filters, deferredSearchTerm],
  );

  const paginationData = useMemo(() => {
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return {
      products: filteredProducts.slice(start, start + ITEMS_PER_PAGE),
      pagination: { currentPage, totalPages, totalProducts: total },
    };
  }, [filteredProducts, currentPage]);

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

  const updateURL = useCallback(
    debounce(() => {
      const params = new URLSearchParams();
      const f = filters;
      if (f.searchTerm) params.set("search", f.searchTerm);
      if (f.selectedCategory !== "All Categories")
        params.set("category", f.selectedCategory);
      if (f.selectedPriceRanges.length)
        params.set("priceRanges", f.selectedPriceRanges.join(","));
      if (f.selectedRatings.length)
        params.set("ratings", f.selectedRatings.join(","));
      if (f.selectedFarmers.length)
        params.set("farmers", f.selectedFarmers.join(","));
      if (f.selectedTags.length) params.set("tags", f.selectedTags.join(","));
      if (f.priceRangeSlider[0] > 0)
        params.set("minPrice", f.priceRangeSlider[0]);
      if (f.priceRangeSlider[1] < 10000)
        params.set("maxPrice", f.priceRangeSlider[1]);
      if (f.sortBy !== "newest") params.set("sort", f.sortBy);
      if (currentPage > 1) params.set("page", currentPage);
      router.push(
        `/products${params.toString() ? `?${params.toString()}` : ""}`,
        { scroll: false },
      );
    }, 300),
    [filters, currentPage, router],
  );

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  useEffect(() => {
    const refresh = () => setTimeout(() => refetchProducts(), 3000);
    window.addEventListener("orderCompleted", refresh);
    window.addEventListener("cartCheckoutCompleted", refresh);
    return () => {
      window.removeEventListener("orderCompleted", refresh);
      window.removeEventListener("cartCheckoutCompleted", refresh);
    };
  }, [refetchProducts]);

  const handleFilterChange = useCallback((type, value) => {
    setFilters((prev) => {
      const f = { ...prev };
      switch (type) {
        case "searchTerm":
          f.searchTerm = value;
          break;
        case "category":
          f.selectedCategory = value;
          break;
        case "priceRange":
          f.selectedPriceRanges = f.selectedPriceRanges.includes(value)
            ? f.selectedPriceRanges.filter((r) => r !== value)
            : [...f.selectedPriceRanges, value];
          break;
        case "rating":
          f.selectedRatings = f.selectedRatings.includes(value)
            ? f.selectedRatings.filter((r) => r !== value)
            : [...f.selectedRatings, value];
          break;
        case "farmer":
          f.selectedFarmers = f.selectedFarmers.includes(value)
            ? f.selectedFarmers.filter((r) => r !== value)
            : [...f.selectedFarmers, value];
          break;
        case "tag":
          f.selectedTags = f.selectedTags.includes(value)
            ? f.selectedTags.filter((r) => r !== value)
            : [...f.selectedTags, value];
          break;
        case "priceSlider":
          f.priceRangeSlider = value;
          break;
        case "sortBy":
          f.sortBy = value;
          break;
      }
      return f;
    });
    if (type !== "sortBy") setCurrentPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      selectedCategory: "All Categories",
      selectedPriceRanges: [],
      selectedRatings: [],
      selectedFarmers: [],
      selectedTags: [],
      priceRangeSlider: [0, 10000],
      sortBy: "newest",
    });
    setCurrentPage(1);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Products
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || "Something went wrong while loading products"}
          </p>
          <button
            onClick={() => refetchProducts()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading && allProducts.length === 0) return <GlobalLoadingSkeleton />;

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-primary-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">Fresh Products</h1>
            <p className="text-xl text-primary-100">
              Discover fresh, locally-sourced produce from our trusted farmers
            </p>
            {(filters.searchTerm ||
              filters.selectedCategory !== "All Categories") && (
              <div className="mt-6 p-4 bg-primary-700 rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    {filters.searchTerm && (
                      <p className="text-primary-100">
                        Search results for:{" "}
                        <span className="font-semibold text-white">
                          &quot;{filters.searchTerm}&quot;
                        </span>
                      </p>
                    )}
                    {filters.selectedCategory !== "All Categories" && (
                      <p className="text-primary-100">
                        Category:{" "}
                        <span className="font-semibold text-white">
                          {filters.selectedCategory}
                        </span>
                      </p>
                    )}
                    <p className="text-sm text-primary-200">
                      {paginationData.pagination.totalProducts} products found
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="px-4 py-2 rounded-lg text-gray-900 focus:outline-none"
                      value={filters.searchTerm}
                      onChange={(e) =>
                        handleFilterChange("searchTerm", e.target.value)
                      }
                      onKeyDown={(e) => e.key === "Enter" && refetchProducts()}
                    />
                    <button
                      onClick={() => refetchProducts()}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-400 rounded-lg transition"
                      aria-label="Search"
                    >
                      <i className="fas fa-search" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-between"
            >
              <span className="flex items-center">
                <i className="fas fa-filter mr-2" />
                Filters{" "}
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <i
                className={`fas fa-chevron-${showMobileFilters ? "up" : "down"}`}
              />
            </button>
          </div>
          {activeFilterCount > 0 && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Active Filters ({activeFilterCount})
                </h4>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.selectedCategory !== "All Categories" && (
                  <Chip
                    label={`Category: ${filters.selectedCategory}`}
                    onRemove={() =>
                      handleFilterChange("category", "All Categories")
                    }
                    color="primary"
                  />
                )}
                {filters.selectedPriceRanges.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    onRemove={() => handleFilterChange("priceRange", r)}
                    color="green"
                  />
                ))}
                {filters.selectedRatings.map((r) => (
                  <Chip
                    key={r}
                    label={`${r}+ Stars`}
                    onRemove={() => handleFilterChange("rating", r)}
                    color="yellow"
                  />
                ))}
                {filters.selectedFarmers.map((f) => (
                  <Chip
                    key={f}
                    label={f}
                    onRemove={() => handleFilterChange("farmer", f)}
                    color="blue"
                  />
                ))}
                {filters.selectedTags.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    onRemove={() => handleFilterChange("tag", t)}
                    color="purple"
                  />
                ))}
                {(filters.priceRangeSlider[0] !== 0 ||
                  filters.priceRangeSlider[1] !== 10000) && (
                  <Chip
                    label={`৳${filters.priceRangeSlider[0]} - ৳${filters.priceRangeSlider[1]}`}
                    onRemove={() =>
                      handleFilterChange("priceSlider", [0, 10000])
                    }
                    color="orange"
                  />
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div
              className={`lg:col-span-1 ${showMobileFilters ? "block" : "hidden lg:block"}`}
            >
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                availableFarmers={availableFarmers}
                activeFilterCount={activeFilterCount}
                clearAllFilters={clearAllFilters}
              />
            </div>
            <div className="lg:col-span-3">
              <FiltersBar
                filters={filters}
                onFilterChange={handleFilterChange}
                loading={loading}
                totalProducts={paginationData.pagination.totalProducts}
              />
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(9)].map((_, i) => (
                    <ProductCardSkeleton key={i} index={i} />
                  ))}
                </div>
              ) : paginationData.products.length ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginationData.products.map((p, i) => (
                      <ProductCard
                        key={`${p._id || p.id}-${p.farmerId || p.farmer?._id || "nf"}-${i}`}
                        product={p}
                      />
                    ))}
                  </div>
                  {paginationData.pagination.totalPages > 1 && (
                    <Pagination
                      current={paginationData.pagination.currentPage}
                      totalPages={paginationData.pagination.totalPages}
                      onChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <EmptyState clearAll={clearAllFilters} />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function Products() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductsContent />
    </Suspense>
  );
}
