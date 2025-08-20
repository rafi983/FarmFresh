// Enhanced cache invalidation utilities
import { FARMERS_QUERY_KEY } from "@/hooks/useFarmersQuery";
import { PRODUCTS_QUERY_KEY } from "@/hooks/useProductsQuery";
import globalCache, { sessionCache } from "@/lib/cache";

export function invalidateAllFarmerRelatedData(
  queryClient,
  userEmail,
  userId,
  options = {},
) {
  const { aggressive = false } = options;
  try {
    globalCache.clearPattern("farmer");
    globalCache.clearPattern("product");
    globalCache.clearPattern("dashboard");
    if (userEmail) {
      globalCache.clearPattern(`farmer-${userEmail}`);
      globalCache.clearPattern(`dashboard-${userEmail}`);
    }
    if (typeof window !== "undefined") {
      sessionCache.clearPattern("farmer");
      sessionCache.clearPattern("product");
      sessionCache.clearPattern("dashboard");
      if (userEmail) {
        sessionCache.clearPattern(`farmer-${userEmail}`);
        sessionCache.clearPattern(`dashboard-${userEmail}`);
      }
      window.caches?.delete("fetch-cache").catch(() => {});
    }
  } catch (e) {
    console.warn("Cache pattern clear failed", e);
  }

  // Invalidate core queries (farmers/products/dashboard)
  queryClient.invalidateQueries({ queryKey: FARMERS_QUERY_KEY, exact: false });
  queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY, exact: false });
  queryClient.invalidateQueries({ queryKey: ["dashboard"], exact: false });

  // Targeted invalidation (helps if keys include identifiers)
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

  // Optional aggressive removal
  if (aggressive) {
    queryClient.removeQueries({ queryKey: FARMERS_QUERY_KEY, exact: false });
    queryClient.removeQueries({ queryKey: PRODUCTS_QUERY_KEY, exact: false });
    queryClient.removeQueries({ queryKey: ["dashboard"], exact: false });
  }
}
