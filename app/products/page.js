"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { debounce } from "@/utils/debounce";
import { useUnifiedProductsData } from "@/hooks/useUnifiedProductsData";
import { useFarmersQuery, useFarmersCache } from "@/hooks/useFarmersQuery";

// Move constants outside component to prevent recreations
const CATEGORY_OPTIONS = [
  "All Categories",
  "Vegetables",
  "Fruits",
  "Grains",
  "Dairy",
  "Honey",
  "Herbs",
];

const PRICE_RANGE_OPTIONS = [
  { label: "Under ৳50", min: 0, max: 49 },
  { label: "৳50 - ৳100", min: 50, max: 100 },
  { label: "৳100 - ৳200", min: 101, max: 200 },
  { label: "৳200 - ���500", min: 201, max: 500 },
  { label: "Above ৳500", min: 501, max: 9999 },
];

const TAG_OPTIONS = [
  "Organic",
  "Fresh",
  "Local",
  "Premium",
  "Seasonal",
  "Limited Stock",
];

const ITEMS_PER_PAGE = 12;

export default function Products() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Use unified caching system instead of separate caching
  const farmersCache = useFarmersCache();

  // Auto-refresh data when page becomes visible (handles browser tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        farmersCache.invalidateFarmers();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [farmersCache]);

  // Filter states - Initialize from URL params
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

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Use unified products data hook with same caching mechanism as dashboard
  const {
    products: allProducts,
    isLoading: loading,
    error,
    refetch: refetchProducts,
    refreshProducts,
  } = useUnifiedProductsData(filters);

  // Use React Query for farmers data
  const { data: farmersData } = useFarmersQuery();

  // Extract products and farmers from React Query data
  const availableFarmers = useMemo(() => {
    // Get farmers from the dedicated farmers query instead of product data
    const farmers = farmersData?.farmers || [];

    // Get unique farmer names from the farmers collection (fresh data)
    const farmerNames = farmers
      .map((farmer) => farmer.name)
      .filter(Boolean)
      .sort();

    return farmerNames;
  }, [farmersData]);

  // Create a farmer lookup map for quick access
  const farmerLookup = useMemo(() => {
    const farmers = farmersData?.farmers || [];
    const lookup = new Map();

    // Create lookup by ID
    farmers.forEach((farmer) => {
      if (farmer._id) lookup.set(farmer._id, farmer);
    });

    // Also create lookup by email for additional matching
    farmers.forEach((farmer) => {
      if (farmer.email) lookup.set(farmer.email, farmer);
    });

    return lookup;
  }, [farmersData]);

  // Enhance products with fresh farmer data
  const enhancedProducts = useMemo(() => {
    return allProducts.map((product) => {
      // Get all possible farmer identifiers from product
      const productFarmerId =
        product.farmer?.id || product.farmer?._id || product.farmerId;
      const productFarmerEmail = product.farmer?.email || product.farmerEmail;
      const productFarmerName = product.farmer?.name || product.farmerName;

      // Look up fresh farmer data by ID first (most reliable)
      let freshFarmer = null;
      if (productFarmerId) {
        freshFarmer = farmerLookup.get(productFarmerId);
      }

      // If no match by ID, try email
      if (!freshFarmer && productFarmerEmail) {
        freshFarmer = farmerLookup.get(productFarmerEmail);
      }

      // If no match by ID or email, try finding by name (least reliable but necessary fallback)
      if (!freshFarmer && productFarmerName) {
        const farmers = farmersData?.farmers || [];
        freshFarmer = farmers.find(
          (farmer) => farmer.name === productFarmerName,
        );
      }

      // If we found fresh farmer data, enhance the product; otherwise keep original
      if (freshFarmer) {
        return {
          ...product,
          farmer: {
            ...product.farmer,
            name: freshFarmer.name,
            email: freshFarmer.email,
            phone: freshFarmer.phone,
            id: freshFarmer._id,
            _id: freshFarmer._id,
          },
          farmerName: freshFarmer.name,
          farmerEmail: freshFarmer.email,
          farmerId: freshFarmer._id, // Ensure farmerId is set
        };
      }

      // No fresh farmer data found, return product with normalized farmer info
      return {
        ...product,
        // Ensure farmerName is always available for display
        farmerName:
          productFarmerName ||
          (typeof product.farmer === "string"
            ? product.farmer
            : "Unknown Farmer"),
      };
    });
  }, [allProducts, farmerLookup, farmersData]);

  // Listen for order completion events to refresh data - IMPROVED TO PREVENT RACE CONDITIONS
  useEffect(() => {
    const handleOrderComplete = (event) => {
      const { orderId } = event.detail || {};
      if (orderId) {
        console.log("🎉 Order completed, refreshing product data");
        // Longer delay to ensure backend has processed the update completely
        setTimeout(() => {
          farmersCache.invalidateFarmers();
        }, 3000); // Increased to 3 seconds to prevent race conditions
      }
    };

    const handleCartCheckout = (event) => {
      console.log("🛒 Cart checkout completed, refreshing product data");
      // Longer delay to ensure backend has processed the update completely
      setTimeout(() => {
        farmersCache.invalidateFarmers();
      }, 3000); // Already correct at 3 seconds
    };

    // Listen for order completion events
    window.addEventListener("orderCompleted", handleOrderComplete);
    window.addEventListener("cartCheckoutCompleted", handleCartCheckout);

    return () => {
      window.removeEventListener("orderCompleted", handleOrderComplete);
      window.removeEventListener("cartCheckoutCompleted", handleCartCheckout);
    };
  }, [farmersCache]);

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = [...enhancedProducts];

    // Filter: Only show products that are available for purchase
    // More flexible filtering to handle different status values and stock levels
    filtered = filtered.filter((product) => {
      // Don't show deleted products
      if (product.status === "deleted") return false;

      // Don't show inactive products (if status is explicitly set to inactive)
      if (product.status === "inactive") return false;

      // Show ALL products including stock-out ones
      // Only exclude if stock is explicitly undefined/null AND status indicates unavailable
      return true; // Show all active products regardless of stock level
    });

    // Apply search term filter
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((product) => {
        return (
          product.name?.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.category?.toLowerCase().includes(searchTerm) ||
          product.farmerName?.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Apply category filter
    if (
      filters.selectedCategory &&
      filters.selectedCategory !== "All Categories"
    ) {
      filtered = filtered.filter((product) => {
        return (
          product.category?.toLowerCase() ===
          filters.selectedCategory.toLowerCase()
        );
      });
    }

    // Apply price range checkboxes
    if (filters.selectedPriceRanges.length > 0) {
      filtered = filtered.filter((product) => {
        return filters.selectedPriceRanges.some((range) => {
          const option = PRICE_RANGE_OPTIONS.find((opt) => opt.label === range);
          const price = parseFloat(product.price) || 0;
          return price >= option.min && price <= option.max;
        });
      });
    }

    // Apply price range slider
    filtered = filtered.filter((product) => {
      const price = parseFloat(product.price) || 0;
      return (
        price >= filters.priceRangeSlider[0] &&
        price <= filters.priceRangeSlider[1]
      );
    });

    // Apply rating filters
    if (filters.selectedRatings.length > 0) {
      filtered = filtered.filter((product) => {
        const productRating = parseFloat(product.averageRating) || 0;
        return filters.selectedRatings.some(
          (rating) => productRating >= rating,
        );
      });
    }

    // Apply farmer filters
    if (filters.selectedFarmers.length > 0) {
      filtered = filtered.filter((product) => {
        const farmerName = product.farmer?.name || product.farmerName || "";
        return filters.selectedFarmers.includes(farmerName);
      });
    }

    // Apply tag filters
    if (filters.selectedTags.length > 0) {
      filtered = filtered.filter((product) => {
        return filters.selectedTags.some((tag) => {
          switch (tag) {
            case "Organic":
              return (
                product.isOrganic === true ||
                (product.tags && product.tags.includes("organic"))
              );
            case "Fresh":
              return (
                product.isFresh === true ||
                (product.tags && product.tags.includes("fresh"))
              );
            case "Local":
              return true;
            case "Premium":
              return parseFloat(product.price) > 200;
            case "Seasonal":
              return parseInt(product.stock) < 100;
            case "Limited Stock":
              return parseInt(product.stock) < 50;
            default:
              return product.tags && product.tags.includes(tag.toLowerCase());
          }
        });
      });
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-high":
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "rating":
        filtered.sort(
          (a, b) =>
            (parseFloat(b.averageRating) || 0) -
            (parseFloat(a.averageRating) || 0),
        );
        break;
      case "popular":
        filtered.sort(
          (a, b) =>
            (parseInt(b.purchaseCount) || 0) - (parseInt(a.purchaseCount) || 0),
        );
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        break;
    }

    return filtered;
  }, [enhancedProducts, filters]);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      pagination: {
        currentPage,
        totalPages,
        totalProducts,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    };
  }, [filteredProducts, currentPage]);

  // Update URL when filters change (with debouncing)
  const updateURL = useCallback(
    debounce(() => {
      const params = new URLSearchParams();

      // Only add non-default parameters to keep URLs clean
      if (filters.searchTerm) params.set("search", filters.searchTerm);
      if (filters.selectedCategory !== "All Categories")
        params.set("category", filters.selectedCategory);
      if (filters.selectedPriceRanges.length > 0)
        params.set("priceRanges", filters.selectedPriceRanges.join(","));
      if (filters.selectedRatings.length > 0)
        params.set("ratings", filters.selectedRatings.join(","));
      if (filters.selectedFarmers.length > 0)
        params.set("farmers", filters.selectedFarmers.join(","));
      if (filters.selectedTags.length > 0)
        params.set("tags", filters.selectedTags.join(","));
      if (filters.priceRangeSlider[0] > 0)
        params.set("minPrice", filters.priceRangeSlider[0]);
      if (filters.priceRangeSlider[1] < 10000)
        params.set("maxPrice", filters.priceRangeSlider[1]);
      if (filters.sortBy !== "newest") params.set("sort", filters.sortBy);
      if (currentPage > 1) params.set("page", currentPage);

      const newURL = params.toString() ? `?${params.toString()}` : "";
      router.push(`/products${newURL}`, { scroll: false });
    }, 300),
    [filters, currentPage, router],
  );

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      switch (filterType) {
        case "searchTerm":
          newFilters.searchTerm = value;
          break;
        case "category":
          newFilters.selectedCategory = value;
          break;
        case "priceRange":
          if (newFilters.selectedPriceRanges.includes(value)) {
            newFilters.selectedPriceRanges =
              newFilters.selectedPriceRanges.filter((range) => range !== value);
          } else {
            newFilters.selectedPriceRanges = [
              ...newFilters.selectedPriceRanges,
              value,
            ];
          }
          break;
        case "rating":
          if (newFilters.selectedRatings.includes(value)) {
            newFilters.selectedRatings = newFilters.selectedRatings.filter(
              (rating) => rating !== value,
            );
          } else {
            newFilters.selectedRatings = [...newFilters.selectedRatings, value];
          }
          break;
        case "farmer":
          if (newFilters.selectedFarmers.includes(value)) {
            newFilters.selectedFarmers = newFilters.selectedFarmers.filter(
              (farmer) => farmer !== value,
            );
          } else {
            newFilters.selectedFarmers = [...newFilters.selectedFarmers, value];
          }
          break;
        case "tag":
          if (newFilters.selectedTags.includes(value)) {
            newFilters.selectedTags = newFilters.selectedTags.filter(
              (tag) => tag !== value,
            );
          } else {
            newFilters.selectedTags = [...newFilters.selectedTags, value];
          }
          break;
        case "priceSlider":
          newFilters.priceRangeSlider = value;
          break;
        case "sortBy":
          newFilters.sortBy = value;
          break;
      }

      return newFilters;
    });

    // Reset to first page when filters change
    if (filterType !== "sortBy") {
      setCurrentPage(1);
    }
  }, []);

  // Clear all filters
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

  // Handle page changes
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Refresh data
  const refreshData = useCallback(() => {
    refetchProducts();
  }, [refetchProducts]);

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.selectedCategory !== "All Categories") count++;
    if (filters.selectedPriceRanges.length > 0) count++;
    if (filters.selectedRatings.length > 0) count++;
    if (filters.selectedFarmers.length > 0) count++;
    if (filters.selectedTags.length > 0) count++;
    if (
      filters.priceRangeSlider[0] !== 0 ||
      filters.priceRangeSlider[1] !== 10000
    )
      count++;
    return count;
  };

  // Handle error display
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
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

  // Custom Loading Skeleton Components
  const ProductCardSkeleton = ({ index }) => (
    <div
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 relative"
      style={{
        animationDelay: `${index * 150}ms`,
        animation: "fadeInUp 0.6s ease-out forwards",
      }}
    >
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>

      {/* Product Image Skeleton */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-700 dark:to-gray-600 overflow-hidden">
        {/* Animated placeholder icons */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-bounce">
            <i className="fas fa-seedling text-4xl text-gray-400 dark:text-gray-500"></i>
          </div>
        </div>
        {/* Floating particles effect */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-60"></div>
        <div
          className="absolute top-4 right-3 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse opacity-70"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute bottom-3 left-4 w-1 h-1 bg-blue-400 rounded-full animate-bounce opacity-50"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 bg-gradient-to-r from-green-200 to-green-300 dark:from-green-700 dark:to-green-600 rounded-full animate-pulse"></div>
          <div
            className="h-5 w-12 bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-600 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>

        {/* Product Name */}
        <div className="space-y-2">
          <div className="h-5 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded-lg animate-pulse"></div>
          <div
            className="h-4 w-3/4 bg-gradient-to-r from-gray-250 via-gray-350 to-gray-250 dark:from-gray-650 dark:via-gray-550 dark:to-gray-650 rounded animate-pulse"
            style={{ animationDelay: "0.3s" }}
          ></div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                className="w-4 h-4 bg-yellow-200 dark:bg-yellow-700 rounded animate-pulse"
                style={{ animationDelay: `${star * 0.1}s` }}
              ></div>
            ))}
          </div>
          <div
            className="h-3 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
            style={{ animationDelay: "0.8s" }}
          ></div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-7 w-24 bg-gradient-to-r from-primary-200 to-primary-300 dark:from-primary-700 dark:to-primary-600 rounded-lg animate-pulse"></div>
            <div
              className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
          <div className="text-right space-y-1">
            <div
              className="h-4 w-20 bg-green-200 dark:bg-green-700 rounded animate-pulse"
              style={{ animationDelay: "0.6s" }}
            ></div>
            <div
              className="h-3 w-14 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
              style={{ animationDelay: "0.7s" }}
            ></div>
          </div>
        </div>

        {/* Action Button */}
        <div
          className="h-10 bg-gradient-to-r from-primary-300 via-primary-400 to-primary-300 dark:from-primary-600 dark:via-primary-700 dark:to-primary-600 rounded-lg animate-pulse"
          style={{ animationDelay: "0.9s" }}
        ></div>
      </div>
    </div>
  );

  const FilterSidebarSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        <div className="h-5 w-5 bg-primary-300 dark:bg-primary-600 rounded-full animate-pulse"></div>
      </div>

      {/* Filter Sections */}
      {[1, 2, 3, 4, 5].map((section) => (
        <div
          key={section}
          className="space-y-3"
          style={{ animationDelay: `${section * 0.1}s` }}
        >
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-4 w-4 bg-primary-300 dark:bg-primary-600 rounded"></div>
            <div className="h-5 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="space-y-2 ml-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 animate-pulse"
                style={{ animationDelay: `${item * 0.05}s` }}
              >
                <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 w-20 bg-gray-250 dark:bg-gray-650 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const HeaderSkeleton = () => (
    <div className="bg-gradient-to-r from-primary-600 to-emerald-600 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Animated farm background */}
        <div className="absolute inset-0 opacity-10">
          <div className="animate-float" style={{ animationDelay: "0s" }}>
            <i className="fas fa-tractor text-6xl absolute top-8 left-1/4"></i>
          </div>
          <div className="animate-float" style={{ animationDelay: "2s" }}>
            <i className="fas fa-leaf text-4xl absolute top-16 right-1/3"></i>
          </div>
          <div className="animate-float" style={{ animationDelay: "4s" }}>
            <i className="fas fa-seedling text-3xl absolute bottom-8 left-1/3"></i>
          </div>
        </div>

        <div className="relative z-10">
          <div className="h-10 w-64 bg-white/20 rounded-lg animate-pulse mb-4"></div>
          <div className="h-6 w-96 bg-white/15 rounded animate-pulse"></div>

          {/* Search results skeleton */}
          <div className="mt-6 p-4 bg-primary-700 rounded-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-white/20 rounded"></div>
                <div className="h-3 w-32 bg-white/15 rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-48 bg-white/20 rounded-lg"></div>
                <div className="h-10 w-12 bg-white/15 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && allProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Custom CSS animations */}
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

          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }

          .animate-shimmer {
            animation: shimmer 2s infinite;
          }

          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>

        {/* Header Skeleton */}
        <HeaderSkeleton />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Filter Toggle Skeleton */}
          <div className="lg:hidden mb-6">
            <div className="w-full h-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 animate-pulse"></div>
          </div>

          {/* Active Filters Skeleton */}
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-4 w-16 bg-primary-300 dark:bg-primary-600 rounded"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-6 w-20 bg-gradient-to-r from-primary-200 to-green-200 dark:from-primary-700 dark:to-green-700 rounded-full animate-pulse"
                  style={{ animationDelay: `${item * 0.1}s` }}
                ></div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <FilterSidebarSkeleton />
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {/* Sort and View Options Skeleton */}
              <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center gap-2 animate-pulse">
                    <div className="h-4 w-4 bg-primary-400 rounded animate-bounce"></div>
                    <div className="h-5 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                  <div className="flex items-center text-primary-600 animate-pulse">
                    <div className="h-4 w-4 bg-primary-400 rounded-full animate-spin mr-2"></div>
                    <div className="h-4 w-20 bg-primary-300 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-10 w-32 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                </div>
              </div>

              {/* Products Grid Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, index) => (
                  <ProductCardSkeleton key={index} index={index} />
                ))}
              </div>

              {/* Pagination Skeleton */}
              <div className="flex justify-center items-center space-x-2 mt-8">
                <div className="h-10 w-20 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((page) => (
                    <div
                      key={page}
                      className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"
                      style={{ animationDelay: `${page * 0.1}s` }}
                    ></div>
                  ))}
                </div>
                <div className="h-10 w-16 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Products Header */}
        <div className="bg-primary-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">Fresh Products</h1>
            <p className="text-xl text-primary-100">
              Discover fresh, locally-sourced produce from our trusted farmers
            </p>

            {/* Search Results Info */}
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

                  {/* Search Bar in Results */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="px-4 py-2 rounded-lg text-gray-900 focus:outline-none"
                      value={filters.searchTerm}
                      onChange={(e) =>
                        handleFilterChange("searchTerm", e.target.value)
                      }
                      onKeyPress={(e) => e.key === "Enter" && refetchProducts()}
                    />
                    <button
                      onClick={() => refetchProducts()}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-400 rounded-lg transition"
                    >
                      <i className="fas fa-search"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Products */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-between"
            >
              <span className="flex items-center">
                <i className="fas fa-filter mr-2"></i>
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                    {getActiveFilterCount()}
                  </span>
                )}
              </span>
              <i
                className={`fas fa-chevron-${showMobileFilters ? "up" : "down"}`}
              ></i>
            </button>
          </div>

          {/* Active Filters Summary */}
          {getActiveFilterCount() > 0 && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Active Filters ({getActiveFilterCount()})
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    Category: {filters.selectedCategory}
                    <button
                      onClick={() =>
                        handleFilterChange("category", "All Categories")
                      }
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.selectedPriceRanges.map((range) => (
                  <span
                    key={range}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    {range}
                    <button
                      onClick={() => handleFilterChange("priceRange", range)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filters.selectedRatings.map((rating) => (
                  <span
                    key={rating}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  >
                    {rating}+ Stars
                    <button
                      onClick={() => handleFilterChange("rating", rating)}
                      className="ml-2 text-yellow-600 hover:text-yellow-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filters.selectedFarmers.map((farmer) => (
                  <span
                    key={farmer}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {farmer}
                    <button
                      onClick={() => handleFilterChange("farmer", farmer)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filters.selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  >
                    {tag}
                    <button
                      onClick={() => handleFilterChange("tag", tag)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(filters.priceRangeSlider[0] !== 0 ||
                  filters.priceRangeSlider[1] !== 10000) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    ৳{filters.priceRangeSlider[0]} - ৳
                    {filters.priceRangeSlider[1]}
                    <button
                      onClick={() =>
                        handleFilterChange("priceSlider", [0, 10000])
                      }
                      className="ml-2 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div
              className={`lg:col-span-1 ${
                showMobileFilters ? "block" : "hidden lg:block"
              }`}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Filters
                  </h3>
                  {getActiveFilterCount() > 0 && (
                    <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <i className="fas fa-th-large mr-2 text-primary-600"></i>
                    Category
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {CATEGORY_OPTIONS.map((category) => (
                      <label
                        key={category}
                        className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="category"
                          checked={filters.selectedCategory === category}
                          onChange={() =>
                            handleFilterChange("category", category)
                          }
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <i className="fas fa-dollar-sign mr-2 text-primary-600"></i>
                    Price Range (৳)
                  </h4>

                  {/* Custom Price Range Slider */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="10"
                        value={filters.priceRangeSlider[0]}
                        onChange={(e) =>
                          handleFilterChange("priceSlider", [
                            +e.target.value,
                            filters.priceRangeSlider[1],
                          ])
                        }
                        className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="10"
                        value={filters.priceRangeSlider[1]}
                        onChange={(e) =>
                          handleFilterChange("priceSlider", [
                            filters.priceRangeSlider[0],
                            +e.target.value,
                          ])
                        }
                        className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="relative h-2 bg-gray-200 rounded-lg">
                        <div
                          className="absolute h-2 bg-primary-600 rounded-lg"
                          style={{
                            left: `${(filters.priceRangeSlider[0] / 10000) * 100}%`,
                            width: `${((filters.priceRangeSlider[1] - filters.priceRangeSlider[0]) / 10000) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <span>��{filters.priceRangeSlider[0]}</span>
                      <span>৳{filters.priceRangeSlider[1]}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {PRICE_RANGE_OPTIONS.map((option) => (
                      <label
                        key={option.label}
                        className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.selectedPriceRanges.includes(
                            option.label,
                          )}
                          onChange={() =>
                            handleFilterChange("priceRange", option.label)
                          }
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <i className="fas fa-star mr-2 text-primary-600"></i>
                    Rating
                  </h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <label
                        key={rating}
                        className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.selectedRatings.includes(rating)}
                          onChange={() => handleFilterChange("rating", rating)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                          {[...Array(rating)].map((_, i) => (
                            <i
                              key={i}
                              className="fas fa-star text-yellow-400 text-xs mr-1"
                            ></i>
                          ))}
                          {rating < 5 && <span className="ml-1">& Up</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Farmer Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <i className="fas fa-user mr-2 text-primary-600"></i>
                    Farmer
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableFarmers.length > 0 ? (
                      availableFarmers.map((farmer) => (
                        <label
                          key={farmer}
                          className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={filters.selectedFarmers.includes(farmer)}
                            onChange={() =>
                              handleFilterChange("farmer", farmer)
                            }
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 truncate">
                            {farmer}
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
                        Loading farmers...
                      </p>
                    )}
                  </div>
                </div>

                {/* Tag Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <i className="fas fa-tags mr-2 text-primary-600"></i>
                    Tags
                  </h4>
                  <div className="space-y-2">
                    {TAG_OPTIONS.map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.selectedTags.includes(tag)}
                          onChange={() => handleFilterChange("tag", tag)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {tag}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button
                    onClick={clearAllFilters}
                    disabled={getActiveFilterCount() === 0}
                    className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {/* Sort and View Options */}
              <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    <i className="fas fa-box mr-2 text-primary-600"></i>
                    {paginationData.pagination.totalProducts} products
                  </span>
                  {loading && (
                    <div className="flex items-center text-primary-600">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      <span className="text-sm">Loading...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Sort by:
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(9)].map((_, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden animate-pulse"
                    >
                      <div className="w-full h-48 bg-gray-300 dark:bg-gray-600"></div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-3 w-3/4"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-1/2"></div>
                        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginationData.products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginationData.products.map((product, index) => (
                      <ProductCard
                        key={`${product._id}-${product.farmerId || product.farmer?._id || "unknown"}-${index}`}
                        product={product}
                      />
                    ))}
                  </div>

                  {/* Pagination Component */}
                  {paginationData.pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={!paginationData.pagination.hasPrevPage}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>

                      {Array.from(
                        { length: paginationData.pagination.totalPages },
                        (_, i) => i + 1,
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg transition ${
                            page === paginationData.pagination.currentPage
                              ? "bg-primary-500 text-white"
                              : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(
                              prev + 1,
                              paginationData.pagination.totalPages,
                            ),
                          )
                        }
                        disabled={!paginationData.pagination.hasNextPage}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-search text-6xl text-gray-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Try adjusting your search criteria or browse all products
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition"
                  >
                    Browse All Products
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
