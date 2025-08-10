// Enhanced cache invalidation utilities
import { FARMERS_QUERY_KEY } from "@/hooks/useFarmersQuery";
import { PRODUCTS_QUERY_KEY } from "@/hooks/useProductsQuery";
import globalCache, { sessionCache } from "@/lib/cache";

export function invalidateAllFarmerRelatedData(queryClient, userEmail, userId) {
  // Step 1: Clear the global and session caches
  try {
    // Clear pattern-based caches
    globalCache.clearPattern("farmer");
    globalCache.clearPattern("product");
    globalCache.clearPattern("dashboard");

    // Add specific email-based cache invalidation if available
    if (userEmail) {
      globalCache.clearPattern(`farmer-${userEmail}`);
      globalCache.clearPattern(`dashboard-${userEmail}`);
    }

    // Clear session cache if running in browser
    if (typeof window !== "undefined") {
      sessionCache.clearPattern("farmer");
      sessionCache.clearPattern("product");
      sessionCache.clearPattern("dashboard");

      // Also clear any email-specific session cache
      if (userEmail) {
        sessionCache.clearPattern(`farmer-${userEmail}`);
        sessionCache.clearPattern(`dashboard-${userEmail}`);
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

  // CRITICAL: Comprehensive dashboard cache invalidation
  // Method 1: Invalidate all dashboard queries (broad approach)
  queryClient.invalidateQueries({
    queryKey: ["dashboard"],
    exact: false, // This will match any query key that STARTS with ["dashboard"]
  });

  // Method 2: If we have specific user identifiers, target those specific queries
  if (userId || userEmail) {
    // Try to invalidate with userId
    if (userId) {
      queryClient.invalidateQueries({
        queryKey: ["dashboard", userId],
        exact: false,
      });

      // Also try with both userId and userEmail
      if (userEmail) {
        queryClient.invalidateQueries({
          queryKey: ["dashboard", userId, userEmail],
          exact: true,
        });
      }
    }

    // Try to invalidate with userEmail only
    if (userEmail) {
      queryClient.invalidateQueries({
        queryKey: ["dashboard", undefined, userEmail],
        exact: true,
      });
    }
  }

  // Method 3: Use predicate function for more precise matching
  queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey;
      // Match any query that starts with "dashboard"
      return Array.isArray(queryKey) && queryKey[0] === "dashboard";
    },
  });

  // Remove farmers queries
  queryClient.removeQueries({
    queryKey: FARMERS_QUERY_KEY,
  });

  // Remove dashboard queries using multiple approaches
  queryClient.removeQueries({
    queryKey: ["dashboard"],
    exact: false,
  });

  // Use predicate for removal as well
  queryClient.removeQueries({
    predicate: (query) => {
      const queryKey = query.queryKey;
      return Array.isArray(queryKey) && queryKey[0] === "dashboard";
    },
  });
}

// New helper function specifically for bulk product updates
export function invalidateDashboardAfterBulkUpdate(
  queryClient,
  userEmail,
  userId,
) {
  // Clear API service cache first
  try {
    if (typeof window !== "undefined" && window.apiServiceCache) {
      window.apiServiceCache.clear();
    }
  } catch (error) {}

  // Comprehensive dashboard invalidation with multiple strategies
  const invalidationStrategies = [
    // Strategy 1: Broad dashboard invalidation
    () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
        exact: false,
      });
    },

    // Strategy 2: Specific user-based invalidation
    () => {
      if (userId || userEmail) {
        if (userId) {
          queryClient.invalidateQueries({
            queryKey: ["dashboard", userId],
            exact: false,
          });
        }
        if (userEmail) {
          queryClient.invalidateQueries({
            queryKey: ["dashboard", undefined, userEmail],
            exact: true,
          });
        }
        if (userId && userEmail) {
          queryClient.invalidateQueries({
            queryKey: ["dashboard", userId, userEmail],
            exact: true,
          });
        }
      }
    },

    // Strategy 3: Predicate-based approach
    () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === "dashboard";
        },
      });
    },

    // Strategy 4: Force removal and refetch
    () => {
      queryClient.removeQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === "dashboard";
        },
      });
    },
  ];

  // Execute all strategies
  invalidationStrategies.forEach((strategy, index) => {
    try {
      console.log(`🔄 [Bulk Update Cache] Executing strategy ${index + 1}...`);
      strategy();
    } catch (error) {
      console.warn(`Strategy ${index + 1} failed:`, error);
    }
  });
}
