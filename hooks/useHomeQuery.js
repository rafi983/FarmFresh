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
        const [featuredData, categoriesData] = await Promise.all([
          // Get featured products with smaller limit for home page
          apiService.getProducts({
            sortBy: "popular",
            limit: 8,
          }),
          // Get categories data
          apiService.getCategories(),
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

        // Process categories
        const categories = categoriesData.categories || [];

        // Create category data with proper structure
        const categoryData = [
          {
            name: "Vegetables",
            icon: "🥬",
            bgColor: "green",
            count: products.filter((p) => p.category === "Vegetables").length,
          },
          {
            name: "Fruits",
            icon: "🍎",
            bgColor: "red",
            count: products.filter((p) => p.category === "Fruits").length,
          },
          {
            name: "Grains",
            icon: "🌾",
            bgColor: "yellow",
            count: products.filter((p) => p.category === "Grains").length,
          },
          {
            name: "Dairy",
            icon: "🥛",
            bgColor: "blue",
            count: products.filter((p) => p.category === "Dairy").length,
          },
          {
            name: "Honey",
            icon: "🍯",
            bgColor: "orange",
            count: products.filter((p) => p.category === "Honey").length,
          },
          {
            name: "Herbs",
            icon: "🌿",
            bgColor: "green",
            count: products.filter((p) => p.category === "Herbs").length,
          },
        ];

        return {
          featuredProducts: products,
          categories: categories,
          categoryData: categoryData,
        };
      } catch (error) {
        console.error("Error fetching home page data:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - same as bookings page
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
}
