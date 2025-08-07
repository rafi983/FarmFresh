import { useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys for orders
export const ORDERS_QUERY_KEY = ["orders"];

// Custom hook for orders with React Query
export function useOrdersQuery(userId, options = {}) {
  // Normalize userId to prevent cache misses due to undefined/null variations
  const normalizedUserId = userId || null;

  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, normalizedUserId], // Simplified key structure
    queryFn: async () => {
      if (!normalizedUserId) {
        return { orders: [] };
      }

      // Pass userId as a query parameter directly to match API expectations
      const response = await fetch(
        `/api/orders?userId=${encodeURIComponent(normalizedUserId)}&limit=1000`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch orders: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data;
    },
    enabled: !!normalizedUserId, // Only run query if userId exists
    staleTime: 10 * 60 * 1000, // Increase to 10 minutes for bookings page
    gcTime: 30 * 60 * 1000, // Increase to 30 minutes for better caching
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchOnReconnect: false, // Don't refetch on network reconnect
    retry: 2,
    ...options,
  });
}

// Utility functions for orders cache management
export function useOrdersCache() {
  const queryClient = useQueryClient();

  return {
    // Invalidate orders cache to trigger refetch
    invalidateOrders: (userId) => {
      queryClient.invalidateQueries({
        queryKey: [...ORDERS_QUERY_KEY, userId], // Fixed: use primitive structure
        exact: false,
      });
    },

    // Refresh orders data
    refetchOrders: (userId) => {
      queryClient.refetchQueries({
        queryKey: [...ORDERS_QUERY_KEY, userId], // Fixed: use primitive structure
      });
    },

    // Clear orders cache
    removeOrders: (userId) => {
      queryClient.removeQueries({
        queryKey: [...ORDERS_QUERY_KEY, userId], // Fixed: use primitive structure
      });
    },
  };
}
