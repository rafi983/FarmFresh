import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api-service";

// Query keys for React Query
export const PRODUCTS_QUERY_KEY = ["products"];

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
    staleTime: 30 * 1000, // Reduced to 30 seconds for more responsive updates
    gcTime: 5 * 60 * 1000, // Reduced to 5 minutes
    refetchOnWindowFocus: true, // Enable refetch on window focus for consistency
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
    ...options,
  });
}

// Utility functions for products cache management
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

    // Update product data in cache
    updateProductInCache: (productId, updatedData) => {
      queryClient.setQueryData(PRODUCTS_QUERY_KEY, (oldData) => {
        if (!oldData?.products) return oldData;

        return {
          ...oldData,
          products: oldData.products.map((product) =>
            product._id === productId
              ? { ...product, ...updatedData }
              : product,
          ),
        };
      });
    },
  };
}
