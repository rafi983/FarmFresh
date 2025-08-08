import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api-service";

// Query keys for home page data
export const HOME_QUERY_KEY = ["home"];
export const FEATURED_PRODUCTS_KEY = ["featured-products"];
export const HOME_CATEGORIES_KEY = ["home-categories"];

// Custom hook for home page data with React Query
export function useHomeQuery(options = {}) {
  return useQuery({
    queryKey: HOME_QUERY_KEY,
    queryFn: async () => {
      try {
        // Fetch all home page data in parallel using cached API service
        const [featuredData, categoriesResponse] = await Promise.all([
          // Get featured products with smaller limit for home page
          apiService.getProducts({
            sortBy: "popular",
            limit: 8,
          }),
          // Get real categories data with counts from API
          fetch("/api/categories", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }).then((res) => res.json()),
        ]);

        // Process featured products
        let products = featuredData.products || [];
        if (
          products.length === 0 ||
          !products.some((p) => p.purchaseCount > 0)
        ) {
          // Fallback to newest products if no popular ones
          const fallbackData = await apiService.getProducts({
            sortBy: "newest",
            limit: 8,
          });
          products = fallbackData.products || [];
        }

        // Process categories with real database counts
        const realCategories = categoriesResponse.categories || [];

        // Debug: Log the actual category data from API
        console.log("🔍 Categories from API:", realCategories);

        // Use the category data directly from API (which now includes emojis)
        const categoryData = realCategories.map((cat) => ({
          name: cat.name,
          icon: cat.icon, // Use emoji from API directly
          bgColor: cat.bgColor,
          count: cat.count,
          // Add emoji field for backward compatibility
          emoji: cat.icon, // Since API now returns emoji in icon field
        }));

        // Sort by count (highest first) and limit to top 6 for display
        const sortedCategories = categoryData
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        return {
          featuredProducts: products,
          categories: realCategories,
          categoryData: sortedCategories,
        };
      } catch (error) {
        console.error("Error fetching home data:", error);

        // Return fallback data structure in case of error
        return {
          featuredProducts: [],
          categories: [],
          categoryData: [],
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...options,
  });
}
