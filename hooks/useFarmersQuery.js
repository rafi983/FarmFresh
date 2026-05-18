import { apiService } from "@/lib/api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys for React Query
export const FARMERS_QUERY_KEY = ["farmers"];

// Custom hook for farmers data
export function useFarmersQuery(options = {}) {
  return useQuery({
    queryKey: FARMERS_QUERY_KEY,
    queryFn: async () => {
      const data = await apiService.getFarmers();
      return data;
    },
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    retry: 2,
    ...options,
  });
}

// Enhanced utility functions for farmers cache management
export function useFarmersCache() {
  const queryClient = useQueryClient();

  return {
    // Invalidate farmers cache to trigger refetch
    invalidateFarmers: () => {
      console.log("🔄 Invalidating farmers query");

      // Clear API service cache first
      apiService.clearFarmersCache();
      apiService.clearProductsCache(); // Also clear products since they contain farmer info

      // Then invalidate React Query cache
      queryClient.invalidateQueries({
        queryKey: FARMERS_QUERY_KEY,
        exact: false,
      });
    },

    // Enhanced refresh with comprehensive cache clearing
    refetchFarmers: () => {
      console.log("🔄 Refetching farmers with cache clearing");

      // Clear all related caches
      apiService.clearFarmersCache();
      apiService.clearProductsCache();

      // Force refetch
      queryClient.refetchQueries({
        queryKey: FARMERS_QUERY_KEY,
        exact: false,
      });
    },

    // Clear farmers cache completely
    removeFarmers: () => {
      apiService.clearFarmersCache();
      queryClient.removeQueries({ queryKey: FARMERS_QUERY_KEY });
    },

    // Update farmer data in cache and sync with products
    updateFarmerInCache: (farmerId, updatedData) => {
      // Update in React Query cache
      queryClient.setQueryData(FARMERS_QUERY_KEY, (oldData) => {
        if (!oldData?.farmers) return oldData;

        return {
          ...oldData,
          farmers: oldData.farmers.map((farmer) =>
            farmer._id === farmerId ? { ...farmer, ...updatedData } : farmer,
          ),
        };
      });

      // CRITICAL: Also clear products cache since products display farmer names
      apiService.clearProductsCache();
      queryClient.invalidateQueries({
        queryKey: ["products"],
        exact: false,
      });
    },

    // Force complete cache refresh - use this after farmer updates
    forceRefreshFarmers: async () => {
      console.log("🔄 Force refreshing farmers and related data");

      // Step 1: Clear all caches
      apiService.clearCache(); // Use the new clearCache method

      // Step 2: Remove React Query data for both farmers and products
      queryClient.removeQueries({ queryKey: FARMERS_QUERY_KEY });
      queryClient.removeQueries({ queryKey: ["products"] });

      // Step 3: Force fresh fetch
      return queryClient.fetchQuery({
        queryKey: FARMERS_QUERY_KEY,
        queryFn: async () => {
          const data = await apiService.getFarmers();
          return data;
        },
        staleTime: 0, // Force fresh data
      });
    },
  };
}
