import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api-service";

// Query keys for React Query
export const PRODUCTS_QUERY_KEY = ["products"];

// Custom hook for products data
export function useProductsQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, filters],
    queryFn: async () => {
      const data = await apiService.getProducts(filters);
      return data;
    },
    staleTime: 1 * 60 * 1000, // Reduced to 1 minute for faster updates
    gcTime: 5 * 60 * 1000, // Reduced to 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    ...options,
  });
}

// Enhanced utility functions for products cache management
export function useProductsCache() {
  const queryClient = useQueryClient();

  return {
    // Invalidate products cache to trigger refetch
    invalidateProducts: () => {
      console.log("🔄 Invalidating products query");

      // Clear API service cache first
      apiService.clearProductsCache();
      apiService.clearFarmersCache(); // Also clear farmers since products contain farmer info

      // Then invalidate React Query cache
      queryClient.invalidateQueries({
        queryKey: PRODUCTS_QUERY_KEY,
        exact: false,
      });
    },

    // Enhanced refresh with comprehensive cache clearing
    refetchProducts: () => {
      console.log("🔄 Refetching products with cache clearing");

      // Clear all related caches
      apiService.clearProductsCache();
      apiService.clearFarmersCache();

      // Force refetch
      queryClient.refetchQueries({
        queryKey: PRODUCTS_QUERY_KEY,
        exact: false,
      });
    },

    // Clear products cache completely
    removeProducts: () => {
      apiService.clearProductsCache();
      queryClient.removeQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },

    // Update product data in cache with farmer name sync
    updateProductInCache: (productId, updatedData) => {
      // Update in React Query cache
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

      // Also clear API service cache to ensure consistency
      apiService.clearProductsCache();
    },

    // Force complete cache refresh - use this after farmer updates
    forceRefreshProducts: async (filters = {}) => {
      console.log("🔄 Force refreshing products after farmer update");

      // Step 1: Clear all caches
      apiService.clearCache(); // Use the new clearCache method

      // Step 2: Remove React Query data
      queryClient.removeQueries({ queryKey: PRODUCTS_QUERY_KEY });

      // Step 3: Force fresh fetch
      return queryClient.fetchQuery({
        queryKey: [...PRODUCTS_QUERY_KEY, filters],
        queryFn: async () => {
          const data = await apiService.getProducts(filters);
          return data;
        },
        staleTime: 0, // Force fresh data
      });
    },

    // Handle bulk product updates with comprehensive cache clearing
    handleBulkUpdate: async (productIds, updateData) => {
      console.log("🔄 Handling bulk product update from products page");

      try {
        // Use API service bulk update (already has comprehensive cache clearing)
        const result = await apiService.bulkUpdateProducts(
          productIds,
          updateData,
        );

        // Additional React Query cache management
        queryClient.clear();

        // Force fresh data fetch for products
        queryClient.invalidateQueries({
          queryKey: PRODUCTS_QUERY_KEY,
          refetchType: "all",
        });

        // Also invalidate dashboard data
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
          refetchType: "all",
        });

        return result;
      } catch (error) {
        console.error("❌ Bulk update failed:", error);
        throw error;
      }
    },
  };
}
