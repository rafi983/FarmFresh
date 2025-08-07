import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api-service";

// Query keys for React Query
export const PRODUCTS_QUERY_KEY = ["products"];
export const FARMERS_QUERY_KEY = ["farmers"];

// Custom hook for products with React Query
export function useProductsQuery(filters = {}, options = {}) {
  const { searchTerm, selectedCategory } = filters;

  // Create query key based on filters for proper caching
  const queryKey = [
    ...PRODUCTS_QUERY_KEY,
    {
      search: searchTerm || undefined,
      category:
        selectedCategory !== "All Categories" ? selectedCategory : undefined,
    },
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = {
        limit: 1000, // Fetch more products for client-side filtering
      };

      // Add search/category filters for server-side optimization
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== "All Categories") {
        params.category = selectedCategory;
      }

      const data = await apiService.getProducts(params, {
        skipCache: true, // Let React Query handle caching
        useSessionCache: false,
      });

      return data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime in newer versions)
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
}

// Custom hook for farmers data
export function useFarmersQuery(options = {}) {
  return useQuery({
    queryKey: FARMERS_QUERY_KEY,
    queryFn: async () => {
      const data = await apiService.getFarmers();
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
}

// Utility functions for cache management
export function useProductsCache() {
  const queryClient = useQueryClient();

  return {
    // Invalidate products cache to trigger refetch
    invalidateProducts: () => {
      console.log("🔄 Invalidating all product queries");
      queryClient.invalidateQueries({
        queryKey: PRODUCTS_QUERY_KEY,
        exact: false,
      });
    },

    // Refresh products data
    refetchProducts: () => {
      queryClient.refetchQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },

    // Clear products cache
    removeProducts: () => {
      queryClient.removeQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  };
}
