import globalCache, { sessionCache } from "./cache";

// Request deduplication to prevent multiple identical API calls
const ongoingRequests = new Map();

// Optimized API service with caching and request deduplication
export class ApiService {
  constructor() {
    this.baseURL = "/api";
  }

  // Generic fetch with caching and deduplication
  async fetchWithCache(endpoint, params = {}, options = {}) {
    const {
      ttl = 5 * 60 * 1000, // 5 minutes default
      useSessionCache = true,
      skipCache = false,
      ...fetchOptions
    } = options;

    // Generate cache key
    const cacheKey = globalCache.generateKey(endpoint, params);
    const sessionKey = sessionCache.generateKey(endpoint, params);

    // ONLY return cached data if NOT skipping cache
    if (!skipCache) {
      // Try memory cache first (fastest)
      const memoryData = globalCache.get(cacheKey);
      if (memoryData) {
        console.log(`📁 [API Service] Returning cached data for ${endpoint}`);
        return memoryData;
      }

      // Try session cache (survives page reloads)
      if (useSessionCache) {
        const sessionData = sessionCache.get(sessionKey);
        if (sessionData) {
          // Also store in memory cache for faster subsequent access
          globalCache.set(cacheKey, sessionData, ttl);
          return sessionData;
        }
      }
    } else {
    }

    // Check if same request is already ongoing
    const requestKey = `${endpoint}_${JSON.stringify(params)}`;
    if (ongoingRequests.has(requestKey)) {
      return ongoingRequests.get(requestKey);
    }

    // Build URL with params
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.append(key, value);
      }
    });

    // Create the promise and store it to prevent duplicate requests
    const requestPromise = fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Cache the successful response
        if (!skipCache) {
          globalCache.set(cacheKey, data, ttl);
          if (useSessionCache) {
            sessionCache.set(sessionKey, data, ttl);
          }
        }
        return data;
      })
      .catch((error) => {
        console.error(`API Error for ${endpoint}:`, error);
        throw error;
      })
      .finally(() => {
        // Remove from ongoing requests
        ongoingRequests.delete(requestKey);
      });

    // Store the ongoing request
    ongoingRequests.set(requestKey, requestPromise);

    return requestPromise;
  }

  // Products API methods
  async getProducts(params = {}, options = {}) {
    return this.fetchWithCache("/api/products", params, {
      ttl: 3 * 60 * 1000, // 3 minutes for products
      useSessionCache: true,
      ...options,
    });
  }

  async getProduct(id) {
    return this.fetchWithCache(
      `/api/products/${id}`,
      {},
      {
        ttl: 10 * 60 * 1000, // 10 minutes for individual products
        useSessionCache: true,
      },
    );
  }

  // Categories API
  async getCategories() {
    return this.fetchWithCache(
      "/api/categories",
      {},
      {
        ttl: 30 * 60 * 1000, // 30 minutes for categories (rarely change)
        useSessionCache: true,
      },
    );
  }

  // Farmers API methods
  async getFarmers(options = {}) {
    return this.fetchWithCache(
      "/api/farmers",
      {},
      {
        ttl: 5 * 60 * 1000, // 5 minutes for farmers
        useSessionCache: true,
        ...options,
      },
    );
  }

  async updateFarmer(farmerId, farmerData) {
    // Step 1: Clear caches BEFORE the update to prevent race conditions
    this.clearCache(); // Use the new comprehensive cache clearing method

    // Step 2: Use PUT method with cache busting headers
    const response = await fetch("/api/farmers", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "x-cache-bust": Date.now().toString(),
        "x-farmer-update": "true", // Flag to identify farmer updates
      },
      body: JSON.stringify(farmerData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update farmer: ${response.status}`);
    }

    const result = await response.json();

    // Step 3: Comprehensive cache clearing after successful update
    this.clearCache(); // Clear all API service caches

    // Step 4: Force React Query cache invalidation if available
    if (typeof window !== "undefined" && window.__REACT_QUERY_CLIENT__) {
      const queryClient = window.__REACT_QUERY_CLIENT__;

      // Remove all cached data (most aggressive approach)
      queryClient.clear();

      // Then force fresh fetches for critical data
      queryClient.invalidateQueries({
        queryKey: ["farmers"],
        refetchType: "all",
      });

      queryClient.invalidateQueries({
        queryKey: ["products"],
        refetchType: "all",
      });
    }

    // Step 5: Clear browser caches completely
    if (typeof window !== "undefined") {
      // Clear all storage that might contain cached data
      try {
        // Clear session storage
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach((key) => {
          if (
            key.includes("farmer") ||
            key.includes("product") ||
            key.includes("cache")
          ) {
            sessionStorage.removeItem(key);
          }
        });

        // Clear local storage
        const localKeys = Object.keys(localStorage);
        localKeys.forEach((key) => {
          if (
            key.includes("farmer") ||
            key.includes("product") ||
            key.includes("cache")
          ) {
            localStorage.removeItem(key);
          }
        });

        // Clear browser cache
        if ("caches" in window) {
          window.caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              window.caches.delete(cacheName);
            });
          });
        }
      } catch (error) {
        console.warn("⚠️ Some cache clearing operations failed:", error);
      }
    }

    console.log(
      "✅ Super aggressive cache clearing completed - farmer names will update immediately across all pages",
    );

    return result;
  }

  // Orders API methods
  async getOrders(params = {}, options = {}) {
    return this.fetchWithCache("/api/orders", params, {
      ttl: 3 * 60 * 1000, // 3 minutes for orders (more dynamic data)
      ...options,
    });
  }

  async createOrder(orderData) {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.status}`);
    }

    const result = await response.json();
    this.clearOrdersCache();
    this.clearProductsCache();

    return result;
  }

  async getOrderById(orderId, options = {}) {
    return this.fetchWithCache(`/api/orders/${orderId}`, {}, options);
  }

  async updateOrder(orderId, updateData) {
    const response = await fetch(`/api/orders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, ...updateData }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update order: ${response.status}`);
    }

    // Clear orders cache when updating
    this.clearOrdersCache();
    return response.json();
  }

  // Cache management for orders
  clearOrdersCache() {
    // Clear all order-related cache entries
    const orderKeys = globalCache
      .getStats()
      .keys.filter((key) => key.includes("/api/orders"));
    orderKeys.forEach((key) => globalCache.delete(key));

    // Clear session cache
    if (typeof window !== "undefined") {
      sessionCache.cleanup();
    }

    // Clear React Query orders cache if available
    if (typeof window !== "undefined" && window.__REACT_QUERY_CLIENT__) {
      window.__REACT_QUERY_CLIENT__.invalidateQueries({
        queryKey: ["orders"],
        exact: false,
      });
    }
  }

  // Force clear all product-related cache
  clearProductsCache() {
    console.log("🧹 API Service: Clearing ALL products cache entries...");

    // Clear memory cache with more aggressive pattern matching
    globalCache.clearPattern("products");
    globalCache.clearPattern("product");
    globalCache.clearPattern("/api/products"); // Clear by endpoint pattern
    globalCache.clearPattern("dashboard"); // Also clear dashboard cache

    // Also clear any cache entries that might contain product data with parameters
    if (globalCache.getStats) {
      const stats = globalCache.getStats();
      const productKeys = stats.keys.filter(
        (key) =>
          key.includes("/api/products") ||
          key.includes("products") ||
          key.includes("product") ||
          key.includes("dashboard") || // Also clear dashboard-related cache
          key.includes("farmers"), // Clear farmers cache too as it may contain product data
      );
      console.log("🔍 Clearing specific product cache keys:", productKeys);
      productKeys.forEach((key) => globalCache.delete(key));
    }

    // Clear session cache with same aggressive approach
    sessionCache.clearPattern("products");
    sessionCache.clearPattern("product");
    sessionCache.clearPattern("/api/products");
    sessionCache.clearPattern("dashboard");

    // Force clear browser storage
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("products-cache");
        sessionStorage.removeItem("dashboard-cache");
        sessionStorage.removeItem("farmfresh-products");
        sessionStorage.removeItem("farmfresh-dashboard");
        localStorage.removeItem("products-cache");
        localStorage.removeItem("dashboard-cache");
      } catch (e) {
        console.warn("Storage clearing warning:", e);
      }
    }

    // Clear React Query cache if available
    if (typeof window !== "undefined" && window.__REACT_QUERY_CLIENT__) {
      window.__REACT_QUERY_CLIENT__.invalidateQueries({
        queryKey: ["products"],
        exact: false,
      });
      // Also clear dashboard cache since it contains product data
      window.__REACT_QUERY_CLIENT__.invalidateQueries({
        queryKey: ["dashboard"],
        exact: false,
      });
    }

    console.log("✅ API Service: ALL products cache cleared comprehensively");
  }

  // Clear farmers cache
  clearFarmersCache() {
    try {
      // Clear memory cache using explicit key deletion (more reliable than clearPattern)
      const stats = globalCache.getStats();
      // Clear all farmer-related keys
      const farmerKeys = stats.keys.filter(
        (key) =>
          key.includes("/api/farmers") ||
          key.includes("farmers") ||
          key.includes("farmer") ||
          key.includes("/api/products") || // Also clear products since they contain farmer info
          key.includes("products"),
      );
      farmerKeys.forEach((key) => globalCache.delete(key));

      // Also use clearPattern as backup to ensure all related data is cleared
      globalCache.clearPattern("farmers");
      globalCache.clearPattern("farmer");
      globalCache.clearPattern("products"); // Clear products cache too
      globalCache.clearPattern("product");
    } catch (error) {
      console.error("❌ Error clearing memory cache:", error);
      // Fallback to pattern clearing if stats approach fails
      globalCache.clearPattern("farmers");
      globalCache.clearPattern("farmer");
      globalCache.clearPattern("products");
      globalCache.clearPattern("product");
    }

    // Clear session cache
    if (typeof window !== "undefined") {
      sessionCache.cleanup(); // Use cleanup instead of clearPattern for more thorough clearing

      // Also clear products from session cache
      try {
        sessionCache.clearPattern("products");
        sessionCache.clearPattern("product");
      } catch (error) {}
    }
  }

  // Force refresh products with cache bypass
  async forceRefreshProducts(params = {}) {
    // Clear cache first
    this.clearProductsCache();

    // Add timestamp to force cache bypass
    const paramsWithTimestamp = {
      ...params,
      _t: Date.now(),
    };

    return this.fetchWithCache("/api/products", paramsWithTimestamp, {
      skipCache: true,
      useSessionCache: false,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
  }

  // Clear all cache
  clearAllCache() {
    globalCache.clear();
    if (typeof window !== "undefined") {
      sessionCache.clear();
    }
  }

  // Simple generic cache clearing method - the one you were looking for!
  clearCache() {
    console.log("🧹 API Service: Clearing all cache via clearCache()...");

    // Clear all memory cache
    globalCache.clear();

    // Clear all session cache
    if (typeof window !== "undefined") {
      sessionCache.clear();
    }

    // Clear React Query cache if available
    if (typeof window !== "undefined" && window.__REACT_QUERY_CLIENT__) {
      console.log("🔄 API Service: Invalidating all React Query cache...");
      window.__REACT_QUERY_CLIENT__.clear();
    }

    // Clear any ongoing requests
    ongoingRequests.clear();

    console.log("✅ API Service: All cache cleared via clearCache()");
  }

  // Optimized method for dashboard data - fetch both products and orders efficiently
  async getDashboardData(userId, userEmail, options = {}) {
    const { forceRefresh = false } = options;

    try {
      // Fetch products and orders in parallel with optimized parameters
      const [productsData, ordersData] = await Promise.all([
        this.getProducts(
          {
            limit: 200, // Reduced limit for dashboard
            farmerId: userId,
            farmerEmail: userEmail,
            dashboard: "true", // Add dashboard context to show inactive products
          },
          { skipCache: forceRefresh },
        ),

        this.getOrders(
          {
            limit: 100, // Reduced limit for dashboard
            farmerId: userId,
            farmerEmail: userEmail,
          },
          { skipCache: forceRefresh },
        ),
      ]);

      return {
        products: productsData.products || [],
        orders: ordersData.orders || [],
        analytics: this.calculateAnalytics(
          productsData.products || [],
          ordersData.orders || [],
        ),
        meta: {
          productsCount: productsData.products?.length || 0,
          ordersCount: ordersData.orders?.length || 0,
          fromCache: !forceRefresh,
        },
      };
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      throw error;
    }
  }

  // Bulk update products - SIMPLE like farmer updates (no extra cache clearing)
  async bulkUpdateProducts(productIds, updateData) {
    try {
      const response = await fetch("/api/products/bulk-update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "x-cache-bust": Date.now().toString(),
          "x-bulk-update": "true",
        },
        body: JSON.stringify({ productIds, updateData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Bulk update failed - Response:", errorText);
        throw new Error(
          `Failed to bulk update products: ${response.status} - ${errorText}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("❌ Bulk update error:", error);
      throw error;
    }
  }

  // Calculate basic analytics for dashboard
  calculateAnalytics(products, orders) {
    const validOrders = orders.filter(
      (order) => order.status !== "cancelled" && order.status !== "returned",
    );

    const totalProducts = products.length;
    const activeProducts = products.filter(
      (p) => p.stock > 0 && p.status !== "inactive",
    ).length;

    const totalOrders = orders.length;
    const totalRevenue = validOrders.reduce(
      (sum, order) => sum + (order.farmerSubtotal || order.total || 0),
      0,
    );

    const averageOrderValue =
      validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      totalRevenue,
      averageOrderValue,
    };
  }
}

// Global API service instance
export const apiService = new ApiService();

// Make apiService globally accessible for debugging and cross-component access
if (typeof window !== "undefined") {
  window.apiService = apiService;
}

// Hook for React components
export function useApiService() {
  return apiService;
}
