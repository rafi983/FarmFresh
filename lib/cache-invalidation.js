// Enhanced cache invalidation utilities
import { FARMERS_QUERY_KEY } from "@/hooks/useFarmersQuery";
import { PRODUCTS_QUERY_KEY } from "@/hooks/useProductsQuery";
import globalCache, { sessionCache } from "@/lib/cache";

export function invalidateAllFarmerRelatedData(queryClient, userEmail) {
  // Step 1: Clear the global and session caches
  try {
    // Clear pattern-based caches
    globalCache.clearPattern("farmer");
    globalCache.clearPattern("product");

    // Add specific email-based cache invalidation if available
    if (userEmail) {
      globalCache.clearPattern(`farmer-${userEmail}`);
    }

    // Clear session cache if running in browser
    if (typeof window !== "undefined") {
      sessionCache.clearPattern("farmer");
      sessionCache.clearPattern("product");

      // Also clear any email-specific session cache
      if (userEmail) {
        sessionCache.clearPattern(`farmer-${userEmail}`);
      }

      // Force browser to refresh its cache by clearing the fetch cache
      window.caches?.delete("fetch-cache").catch(() => {});
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
  }

  // Step 2: Invalidate React Query caches
  // Invalidate and refetch farmers data
  queryClient.invalidateQueries({
    queryKey: FARMERS_QUERY_KEY,
    refetchType: "all",
  });

  // If we have a specific email, also invalidate that specific farmer's data
  if (userEmail) {
    queryClient.invalidateQueries({
      queryKey: [...FARMERS_QUERY_KEY, { email: userEmail }],
      refetchType: "all",
    });
  }

  // Invalidate and refetch products data
  queryClient.invalidateQueries({
    queryKey: PRODUCTS_QUERY_KEY,
    refetchType: "all",
  });

  // Force remove queries to guarantee fresh data on next request
  queryClient.removeQueries({
    queryKey: FARMERS_QUERY_KEY,
  });

  // Clear the entire cache when in doubt to ensure fresh data
  queryClient.clear();
}
