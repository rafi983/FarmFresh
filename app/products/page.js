"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";

export default function Products() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "All Categories",
  );
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [selectedFarmers, setSelectedFarmers] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [priceRangeSlider, setPriceRangeSlider] = useState([0, 10000]); // Increased default max to 10000
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [availableFarmers, setAvailableFarmers] = useState([]);

  const categoryOptions = [
    "All Categories",
    "Vegetables",
    "Fruits",
    "Grains",
    "Dairy",
    "Honey",
    "Herbs",
  ];

  const priceRangeOptions = [
    { label: "Under ৳50", min: 0, max: 49 },
    { label: "৳50 - ৳100", min: 50, max: 100 },
    { label: "৳100 - ৳200", min: 101, max: 200 },
    { label: "৳200 - ৳500", min: 201, max: 500 },
    { label: "Above ৳500", min: 501, max: 9999 },
  ];

  const tagOptions = [
    "Organic",
    "Fresh",
    "Local",
    "Premium",
    "Seasonal",
    "Limited Stock",
  ];

  useEffect(() => {
    console.log(" Products useEffect triggered:", {
      searchTerm,
      selectedCategory,
      selectedPriceRanges,
      selectedRatings,
      selectedFarmers,
      selectedTags,
      priceRangeSlider,
      sortBy,
      currentPage,
    });
    fetchProducts();
    // Remove fetchAvailableFarmers from here to prevent unnecessary calls
  }, [
    searchTerm,
    selectedCategory,
    selectedPriceRanges,
    selectedRatings,
    selectedFarmers,
    selectedTags,
    priceRangeSlider,
    sortBy,
    currentPage,
  ]);

  // Separate useEffect for fetching farmers (only once)
  useEffect(() => {
    fetchAvailableFarmers();
  }, []); // Empty dependency array - only run once

  // Update URL when category changes
  useEffect(() => {
    console.log(" Category changed, updating URL:", selectedCategory);
    updateURLWithFilters({
      selectedCategory: selectedCategory,
    });
  }, [selectedCategory]);

  useEffect(() => {
    console.log(" URL params changed, updating state:", {
      searchParams: Object.fromEntries(searchParams.entries()),
    });

    // Update states from URL params
    const newSearchTerm = searchParams.get("search") || "";
    const newCategory = searchParams.get("category") || "All Categories";

    console.log(" Setting search term:", newSearchTerm);
    console.log(" Setting category:", newCategory);

    setSearchTerm(newSearchTerm);
    setSelectedCategory(newCategory);

    // Restore price ranges from URL
    const priceRanges = searchParams.get("priceRanges");
    if (priceRanges) {
      const newPriceRanges = priceRanges.split(",");
      console.log(" Setting price ranges:", newPriceRanges);
      setSelectedPriceRanges(newPriceRanges);
    } else {
      console.log(" Clearing price ranges");
      setSelectedPriceRanges([]);
    }

    // Restore ratings from URL
    const ratings = searchParams.get("ratings");
    if (ratings) {
      const newRatings = ratings.split(",").map(Number);
      console.log("⭐ Setting ratings:", newRatings);
      setSelectedRatings(newRatings);
    } else {
      console.log("⭐ Clearing ratings");
      setSelectedRatings([]);
    }

    // Restore farmers from URL
    const farmers = searchParams.get("farmers");
    if (farmers) {
      const newFarmers = farmers.split(",");
      console.log("‍ Setting farmers:", newFarmers);
      setSelectedFarmers(newFarmers);
    } else {
      console.log("‍ Clearing farmers");
      setSelectedFarmers([]);
    }

    // Restore tags from URL
    const tags = searchParams.get("tags");
    if (tags) {
      const newTags = tags.split(",");
      console.log("️ Setting tags:", newTags);
      setSelectedTags(newTags);
    } else {
      console.log("️ Clearing tags");
      setSelectedTags([]);
    }

    // Restore price range slider from URL
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice && maxPrice) {
      const newPriceSlider = [Number(minPrice), Number(maxPrice)];
      console.log("️ Setting price slider:", newPriceSlider);
      setPriceRangeSlider(newPriceSlider);
    } else {
      console.log("️ Resetting price slider to default");
      setPriceRangeSlider([0, 10000]);
    }

    // Restore sort option from URL
    const newSort = searchParams.get("sort") || "newest";
    console.log(" Setting sort:", newSort);
    setSortBy(newSort);

    // Restore page from URL
    const newPage = Number(searchParams.get("page")) || 1;
    console.log(" Setting page:", newPage);
    setCurrentPage(newPage);
  }, [searchParams]);

  const fetchAvailableFarmers = async () => {
    try {
      console.log("📋 Starting comprehensive farmer fetch...");
      const farmers = [];

      // 1. Fetch from dedicated farmers API
      try {
        const response = await fetch("/api/farmers?limit=1000");
        if (response.ok) {
          const data = await response.json();
          console.log("📋 Fetched farmers from farmers API:", data);

          if (data.farmers && Array.isArray(data.farmers)) {
            data.farmers.forEach((farmer) => {
              if (farmer.name && !farmers.includes(farmer.name)) {
                farmers.push(farmer.name);
              }
            });
          }
        }
      } catch (error) {
        console.warn("⚠️ Farmers API failed:", error);
      }

      // 2. Fetch newly registered farmers from users collection
      try {
        const usersResponse = await fetch(
          "/api/auth/users?userType=farmer&limit=1000",
        );
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log("📋 Fetched farmers from users API:", usersData);

          if (usersData.users && Array.isArray(usersData.users)) {
            usersData.users.forEach((user) => {
              // Prioritize farmer's personal name over farm name
              const farmerName =
                user.name ||
                `${user.firstName} ${user.lastName}` ||
                user.farmDetails?.farmName;
              if (farmerName && !farmers.includes(farmerName)) {
                farmers.push(farmerName);
                console.log("📋 Added farmer from users:", farmerName);
              }
            });
          }
        } else {
          console.warn(
            "⚠️ Users API not available, trying alternative approach",
          );
        }
      } catch (error) {
        console.warn("⚠️ Users API failed:", error);
      }

      // 3. Backup: get farmers from products API
      try {
        const productsResponse = await fetch("/api/products?limit=1000");
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          console.log(
            "📋 Fetched farmers from products API:",
            productsData.products?.length || 0,
            "products",
          );

          const productFarmers = [
            ...new Set(
              productsData.products.map((p) => p.farmer?.name).filter(Boolean),
            ),
          ];

          // Merge farmers from products
          productFarmers.forEach((farmerName) => {
            if (!farmers.includes(farmerName)) {
              farmers.push(farmerName);
            }
          });
        }
      } catch (error) {
        console.warn("⚠️ Products API failed:", error);
      }

      // Sort farmers alphabetically and update state
      farmers.sort();

      console.log("📋 Final comprehensive farmers list:", farmers);
      console.log("📋 Total farmers found:", farmers.length);
      setAvailableFarmers(farmers);
    } catch (error) {
      console.error("❌ Error in comprehensive farmer fetch:", error);
      // Ultimate fallback - at least try products API
      try {
        const response = await fetch("/api/products?limit=1000");
        if (response.ok) {
          const data = await response.json();
          const farmers = [
            ...new Set(
              data.products.map((p) => p.farmer?.name).filter(Boolean),
            ),
          ];
          farmers.sort();
          setAvailableFarmers(farmers);
          console.log("📋 Fallback farmers loaded:", farmers.length);
        }
      } catch (fallbackError) {
        console.error("❌ Complete failure in farmer fetch:", fallbackError);
        setAvailableFarmers([]);
      }
    }
  };

  const fetchProducts = async () => {
    console.log(" fetchProducts called with current state:", {
      searchTerm,
      selectedCategory,
      sortBy,
      currentPage,
    });

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory !== "All Categories")
        params.append("category", selectedCategory);
      // Add high limit to fetch all products for client-side pagination
      params.append("limit", "1000");
      params.append("sortBy", sortBy);

      const apiUrl = `/api/products?${params}`;
      console.log(" API call URL:", apiUrl);

      const response = await fetch(apiUrl);
      if (response.ok) {
        let data = await response.json();
        let allProducts = data.products;

        console.log("🔍 Raw products from API:", allProducts.length);
        console.log(
          "🔍 Sample of all products:",
          allProducts.slice(0, 3).map((p) => ({
            name: p.name,
            _id: p._id,
            farmerId: p.farmerId,
            farmerEmail: p.farmerEmail,
            category: p.category,
            price: p.price,
          })),
        );

        // Apply client-side filters to all products
        let filteredProducts = applyFilters(allProducts);

        console.log(" Products after filtering:", filteredProducts.length);

        // Always apply pagination regardless of filters
        const itemsPerPage = 12;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        console.log(" Paginated products:", {
          startIndex,
          endIndex,
          paginatedCount: paginatedProducts.length,
          totalFiltered: filteredProducts.length,
        });

        setProducts(paginatedProducts);
        setPagination({
          currentPage: currentPage,
          totalPages: Math.ceil(filteredProducts.length / itemsPerPage),
          totalProducts: filteredProducts.length,
          hasNextPage:
            currentPage < Math.ceil(filteredProducts.length / itemsPerPage),
          hasPrevPage: currentPage > 1,
        });
      }
    } catch (error) {
      console.error(" Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (products) => {
    console.log(" applyFilters called with:", {
      totalProducts: products.length,
      selectedPriceRanges,
      selectedRatings,
      selectedFarmers,
      selectedTags,
      priceRangeSlider,
    });

    let filtered = [...products];
    const originalCount = filtered.length;

    // Price range filters
    if (selectedPriceRanges.length > 0) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter((product) => {
        return selectedPriceRanges.some((range) => {
          const option = priceRangeOptions.find((opt) => opt.label === range);
          return product.price >= option.min && product.price <= option.max;
        });
      });
      console.log(" Price range filter:", {
        before: beforeFilter,
        after: filtered.length,
        ranges: selectedPriceRanges,
      });
    }

    // Custom price range slider
    const beforeSlider = filtered.length;
    const filteredOutProducts = [];

    filtered = filtered.filter((product) => {
      const withinRange =
        product.price >= priceRangeSlider[0] &&
        product.price <= priceRangeSlider[1];

      if (!withinRange) {
        filteredOutProducts.push({
          name: product.name,
          price: product.price,
          priceType: typeof product.price,
        });
      }

      return withinRange;
    });

    console.log("💰 Price slider filter:", {
      before: beforeSlider,
      after: filtered.length,
      range: priceRangeSlider,
      filteredOut: filteredOutProducts,
    });

    // Rating filters
    if (selectedRatings.length > 0) {
      const beforeRating = filtered.length;
      filtered = filtered.filter((product) => {
        const productRating = product.averageRating || 0;
        return selectedRatings.some((rating) => productRating >= rating);
      });
      console.log(" Rating filter:", {
        before: beforeRating,
        after: filtered.length,
        ratings: selectedRatings,
      });
    }

    // Farmer filters
    if (selectedFarmers.length > 0) {
      const beforeFarmer = filtered.length;
      filtered = filtered.filter((product) =>
        selectedFarmers.includes(product.farmer?.name),
      );
      console.log(" Farmer filter:", {
        before: beforeFarmer,
        after: filtered.length,
        farmers: selectedFarmers,
      });
    }

    // Tag filters
    if (selectedTags.length > 0) {
      const beforeTags = filtered.length;
      filtered = filtered.filter((product) => {
        return selectedTags.every((tag) => {
          switch (tag) {
            case "Organic":
              return product.isOrganic;
            case "Fresh":
              return product.isFresh;
            case "Local":
              return true; // Assuming all products are local
            case "Premium":
              return product.price > 200;
            case "Seasonal":
              return product.stock < 100;
            case "Limited Stock":
              return product.stock < 50;
            default:
              return false;
          }
        });
      });
      console.log(" Tag filter:", {
        before: beforeTags,
        after: filtered.length,
        tags: selectedTags,
      });
    }

    // Apply sorting
    const beforeSort = filtered.length;
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort(
          (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
        );
        filtered.sort(
          (a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0),
        );
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
    }
    console.log(" Sorting applied:", { sortBy, count: filtered.length });

    console.log(" Final filtering result:", {
      original: originalCount,
      final: filtered.length,
      reduction: originalCount - filtered.length,
    });

    return filtered;
  };

  // Handle search functionality
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (selectedCategory !== "All Categories")
      params.append("category", selectedCategory);
    router.push(`/products?${params.toString()}`);
    setCurrentPage(1);
    fetchProducts();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCategoryChange = (category) => {
    console.log(" Category change clicked:", category);
    setSelectedCategory(category);
    setCurrentPage(1);
    // Don't call updateURL here - let the useEffect handle it
  };

  const handlePriceRangeChange = (range) => {
    console.log(" Price range clicked:", range);
    console.log(" Current selected price ranges:", selectedPriceRanges);

    const newPriceRanges = selectedPriceRanges.includes(range)
      ? selectedPriceRanges.filter((r) => r !== range)
      : [...selectedPriceRanges, range];

    console.log(" New price ranges:", newPriceRanges);

    setSelectedPriceRanges(newPriceRanges);
    setCurrentPage(1);

    // Immediate URL update
    console.log(" Updating URL with new price ranges:", newPriceRanges);
    updateURLWithFilters({
      selectedPriceRanges: newPriceRanges,
    });
  };

  const handleRatingChange = (rating) => {
    console.log("⭐ Rating clicked:", rating);
    console.log("⭐ Current selected ratings:", selectedRatings);

    const newRatings = selectedRatings.includes(rating)
      ? selectedRatings.filter((r) => r !== rating)
      : [...selectedRatings, rating];

    console.log("⭐ New ratings:", newRatings);

    setSelectedRatings(newRatings);
    setCurrentPage(1);

    // Immediate URL update
    console.log("⭐ Updating URL with new ratings:", newRatings);
    updateURLWithFilters({
      selectedRatings: newRatings,
    });
  };

  const handleFarmerChange = (farmer) => {
    console.log("‍ Farmer clicked:", farmer);
    console.log("‍ Current selected farmers:", selectedFarmers);

    const newFarmers = selectedFarmers.includes(farmer)
      ? selectedFarmers.filter((f) => f !== farmer)
      : [...selectedFarmers, farmer];

    console.log("‍ New farmers:", newFarmers);

    setSelectedFarmers(newFarmers);
    setCurrentPage(1);

    // Immediate URL update
    console.log("‍ Updating URL with new farmers:", newFarmers);
    updateURLWithFilters({
      selectedFarmers: newFarmers,
    });
  };

  const handleTagChange = (tag) => {
    console.log("️ Tag clicked:", tag);
    console.log("️ Current selected tags:", selectedTags);

    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    console.log("️ New tags:", newTags);

    setSelectedTags(newTags);
    setCurrentPage(1);

    // Immediate URL update
    console.log("️ Updating URL with new tags:", newTags);
    updateURLWithFilters({
      selectedTags: newTags,
    });
  };

  const handlePriceSliderChange = (newPriceRange) => {
    console.log("️ Price slider changed:", newPriceRange);
    console.log("️ Current price slider:", priceRangeSlider);

    setPriceRangeSlider(newPriceRange);
    setCurrentPage(1);

    // Immediate URL update
    console.log("️ Updating URL with new price slider:", newPriceRange);
    updateURLWithFilters({
      priceRangeSlider: newPriceRange,
    });
  };

  const handleSortChange = (newSort) => {
    console.log(" Sort changed:", newSort);
    console.log(" Current sort:", sortBy);

    setSortBy(newSort);
    setCurrentPage(1);

    // Immediate URL update
    console.log(" Updating URL with new sort:", newSort);
    updateURLWithFilters({
      sortBy: newSort,
    });
  };

  const clearAllFilters = () => {
    setSelectedCategory("All Categories");
    setSearchTerm("");
    setSelectedPriceRanges([]);
    setSelectedRatings([]);
    setSelectedFarmers([]);
    setSelectedTags([]);
    setPriceRangeSlider([0, 10000]);
    setCurrentPage(1);
    updateURL();
  };

  const updateURL = () => {
    console.log(" updateURL called with current state:", {
      searchTerm,
      selectedCategory,
      selectedPriceRanges,
      selectedRatings,
      selectedFarmers,
      selectedTags,
      priceRangeSlider,
      sortBy,
      currentPage,
    });

    const params = new URLSearchParams();

    // Add search term
    if (searchTerm) params.append("search", searchTerm);

    // Add category
    if (selectedCategory !== "All Categories")
      params.append("category", selectedCategory);

    // Add price ranges
    if (selectedPriceRanges.length > 0) {
      params.append("priceRanges", selectedPriceRanges.join(","));
    }

    // Add ratings
    if (selectedRatings.length > 0) {
      params.append("ratings", selectedRatings.join(","));
    }

    // Add farmers
    if (selectedFarmers.length > 0) {
      params.append("farmers", selectedFarmers.join(","));
    }

    // Add tags
    if (selectedTags.length > 0) {
      params.append("tags", selectedTags.join(","));
    }

    // Add price range slider
    if (priceRangeSlider[0] !== 0 || priceRangeSlider[1] !== 10000) {
      params.append("minPrice", priceRangeSlider[0]);
      params.append("maxPrice", priceRangeSlider[1]);
    }

    // Add sort option
    if (sortBy !== "newest") {
      params.append("sort", sortBy);
    }

    // Add current page if not first page
    if (currentPage > 1) {
      params.append("page", currentPage);
    }

    const newURL = `/products${params.toString() ? `?${params.toString()}` : ""}`;
    console.log(" Generated URL:", newURL);
    router.push(newURL, { shallow: true });
  };

  const updateURLWithFilters = (overrides = {}) => {
    console.log(" updateURLWithFilters called with overrides:", overrides);
    console.log(" Current state before overrides:", {
      searchTerm,
      selectedCategory,
      selectedPriceRanges,
      selectedRatings,
      selectedFarmers,
      selectedTags,
      priceRangeSlider,
      sortBy,
      currentPage,
    });

    const params = new URLSearchParams();

    // Use current state values or overrides
    const currentSearchTerm =
      overrides.searchTerm !== undefined ? overrides.searchTerm : searchTerm;
    const currentCategory =
      overrides.selectedCategory !== undefined
        ? overrides.selectedCategory
        : selectedCategory;
    const currentPriceRanges =
      overrides.selectedPriceRanges !== undefined
        ? overrides.selectedPriceRanges
        : selectedPriceRanges;
    const currentRatings =
      overrides.selectedRatings !== undefined
        ? overrides.selectedRatings
        : selectedRatings;
    const currentFarmers =
      overrides.selectedFarmers !== undefined
        ? overrides.selectedFarmers
        : selectedFarmers;
    const currentTags =
      overrides.selectedTags !== undefined
        ? overrides.selectedTags
        : selectedTags;
    const currentPriceSlider =
      overrides.priceRangeSlider !== undefined
        ? overrides.priceRangeSlider
        : priceRangeSlider;
    const currentSort =
      overrides.sortBy !== undefined ? overrides.sortBy : sortBy;
    const currentPageNumber =
      overrides.currentPage !== undefined ? overrides.currentPage : 1; // Reset to page 1 for filters

    console.log(" Final values to use:", {
      currentSearchTerm,
      currentCategory,
      currentPriceRanges,
      currentRatings,
      currentFarmers,
      currentTags,
      currentPriceSlider,
      currentSort,
      currentPageNumber,
    });

    // Add search term
    if (currentSearchTerm) params.append("search", currentSearchTerm);

    // Add category
    if (currentCategory !== "All Categories")
      params.append("category", currentCategory);

    // Add price ranges
    if (currentPriceRanges.length > 0) {
      params.append("priceRanges", currentPriceRanges.join(","));
    }

    // Add ratings
    if (currentRatings.length > 0) {
      params.append("ratings", currentRatings.join(","));
    }

    // Add farmers
    if (currentFarmers.length > 0) {
      params.append("farmers", currentFarmers.join(","));
    }

    // Add tags
    if (currentTags.length > 0) {
      params.append("tags", currentTags.join(","));
    }

    // Add price range slider
    if (currentPriceSlider[0] !== 0 || currentPriceSlider[1] !== 10000) {
      params.append("minPrice", currentPriceSlider[0]);
      params.append("maxPrice", currentPriceSlider[1]);
    }

    // Add sort option
    if (currentSort !== "newest") {
      params.append("sort", currentSort);
    }

    // Add current page if not first page
    if (currentPageNumber > 1) {
      params.append("page", currentPageNumber);
    }

    const newURL = `/products${params.toString() ? `?${params.toString()}` : ""}`;
    console.log(" Generated URL with filters:", newURL);
    router.push(newURL, { shallow: true });
  };

  const handlePageChange = (page) => {
    console.log(" Page change clicked:", page);
    setCurrentPage(page);
    // Update URL immediately for page changes
    updateURLWithFilters({
      currentPage: page,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCategory !== "All Categories") count++;
    if (selectedPriceRanges.length > 0) count++;
    if (selectedRatings.length > 0) count++;
    if (selectedFarmers.length > 0) count++;
    if (selectedTags.length > 0) count++;
    if (priceRangeSlider[0] !== 0 || priceRangeSlider[1] !== 10000) count++;
    return count;
  };

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
            {(searchTerm || selectedCategory !== "All Categories") && (
              <div className="mt-6 p-4 bg-primary-700 rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    {searchTerm && (
                      <p className="text-primary-100">
                        Search results for:{" "}
                        <span className="font-semibold text-white">
                          "{searchTerm}"
                        </span>
                      </p>
                    )}
                    {selectedCategory !== "All Categories" && (
                      <p className="text-primary-100">
                        Category:{" "}
                        <span className="font-semibold text-white">
                          {selectedCategory}
                        </span>
                      </p>
                    )}
                    <p className="text-sm text-primary-200">
                      {pagination.totalProducts} products found
                    </p>
                  </div>

                  {/* Search Bar in Results */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="px-4 py-2 rounded-lg text-gray-900 focus:outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <button
                      onClick={handleSearch}
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
                {selectedCategory !== "All Categories" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    Category: {selectedCategory}
                    <button
                      onClick={() => handleCategoryChange("All Categories")}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedPriceRanges.map((range) => (
                  <span
                    key={range}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    {range}
                    <button
                      onClick={() => handlePriceRangeChange(range)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedRatings.map((rating) => (
                  <span
                    key={rating}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  >
                    {rating}+ Stars
                    <button
                      onClick={() => handleRatingChange(rating)}
                      className="ml-2 text-yellow-600 hover:text-yellow-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedFarmers.map((farmer) => (
                  <span
                    key={farmer}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {farmer}
                    <button
                      onClick={() => handleFarmerChange(farmer)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  >
                    {tag}
                    <button
                      onClick={() => handleTagChange(tag)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(priceRangeSlider[0] !== 0 ||
                  priceRangeSlider[1] !== 10000) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    ৳{priceRangeSlider[0]} - ৳{priceRangeSlider[1]}
                    <button
                      onClick={() => setPriceRangeSlider([0, 10000])}
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
              className={`lg:col-span-1 ${showMobileFilters ? "block" : "hidden lg:block"}`}
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
                    {categoryOptions.map((category) => (
                      <label
                        key={category}
                        className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === category}
                          onChange={() => handleCategoryChange(category)}
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
                        value={priceRangeSlider[0]}
                        onChange={(e) =>
                          handlePriceSliderChange([
                            +e.target.value,
                            priceRangeSlider[1],
                          ])
                        }
                        className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="10"
                        value={priceRangeSlider[1]}
                        onChange={(e) =>
                          handlePriceSliderChange([
                            priceRangeSlider[0],
                            +e.target.value,
                          ])
                        }
                        className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="relative h-2 bg-gray-200 rounded-lg">
                        <div
                          className="absolute h-2 bg-primary-600 rounded-lg"
                          style={{
                            left: `${(priceRangeSlider[0] / 10000) * 100}%`,
                            width: `${((priceRangeSlider[1] - priceRangeSlider[0]) / 10000) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <span>৳{priceRangeSlider[0]}</span>
                      <span>৳{priceRangeSlider[1]}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {priceRangeOptions.map((option) => (
                      <label
                        key={option.label}
                        className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPriceRanges.includes(option.label)}
                          onChange={() => handlePriceRangeChange(option.label)}
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
                          checked={selectedRatings.includes(rating)}
                          onChange={() => handleRatingChange(rating)}
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
                            checked={selectedFarmers.includes(farmer)}
                            onChange={() => handleFarmerChange(farmer)}
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
                    {tagOptions.map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => handleTagChange(tag)}
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
                    {pagination.totalProducts} products
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
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
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
              ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!pagination.hasPrevPage}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Previous
                        </button>

                        {[...Array(Math.min(5, pagination.totalPages))].map(
                          (_, index) => {
                            const pageNum = index + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-2 border rounded-lg ${
                                  currentPage === pageNum
                                    ? "bg-primary-600 text-white border-primary-600"
                                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.hasNextPage}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Next
                        </button>
                      </div>
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
                  <Link
                    href="/products"
                    className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition"
                  >
                    Browse All Products
                  </Link>
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
