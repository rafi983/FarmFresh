import { useQuery } from "@tanstack/react-query";

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
        const response = await fetch("/api/home", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch home data");
        }

        return await response.json();
      } catch (error) {
        console.error("Error fetching home data:", error);

        return {
          featuredProducts: [],
          categories: [],
          categoryData: [],
          categoryOptions: ["All Categories"],
          highlights: [],
          farmerSpotlights: [],
          testimonials: [],
          trustMetrics: [],
          heroStats: [],
          seasonalBox: null,
          stats: {},
        };
      }
    },
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    ...options,
  });
}
