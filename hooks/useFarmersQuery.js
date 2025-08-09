import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api-service";

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
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
}

// Utility functions for farmers cache management
export function useFarmersCache() {
  const queryClient = useQueryClient();

  return {
    // Invalidate farmers cache to trigger refetch
    invalidateFarmers: () => {
      console.log("🔄 Invalidating farmers query");
      queryClient.invalidateQueries({
        queryKey: FARMERS_QUERY_KEY,
        exact: false,
      });
    },

    // Refresh farmers data
    refetchFarmers: () => {
      queryClient.refetchQueries({ queryKey: FARMERS_QUERY_KEY });
    },

    // Clear farmers cache
    removeFarmers: () => {
      queryClient.removeQueries({ queryKey: FARMERS_QUERY_KEY });
    },

    // Update farmer data in cache
    updateFarmerInCache: (farmerId, updatedData) => {
      queryClient.setQueryData(FARMERS_QUERY_KEY, (oldData) => {
        if (!oldData?.farmers) return oldData;

        return {
          ...oldData,
          farmers: oldData.farmers.map((farmer) =>
            farmer._id === farmerId ? { ...farmer, ...updatedData } : farmer,
          ),
        };
      });
    },
  };
}
