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

    // Return cached data if available and not skipping cache
    if (!skipCache) {
      // Try memory cache first (fastest)
      const memoryData = globalCache.get(cacheKey);
      if (memoryData) {
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

  // Farmers API
  async getFarmers() {
    return this.fetchWithCache(
      "/api/farmers",
      {},
      {
        ttl: 15 * 60 * 1000, // 15 minutes for farmers
        useSessionCache: true,
      },
    );
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

    // CRITICAL: Clear both orders and products cache after order creation
    // This ensures stock and purchase count updates are visible immediately
    this.clearOrdersCache();
    this.clearProductsCache();

    console.log(
      "🔄 Frontend cache cleared after order creation - stock and purchase count will update immediately",
    );

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
  }

  // Force clear all product-related cache
  clearProductsCache() {
    console.log("🧹 API Service: Clearing all products cache...");

    // Clear memory cache
    globalCache.clearPattern("products");
    globalCache.clearPattern("product");

    // Clear session cache
    sessionCache.clearPattern("products");
    sessionCache.clearPattern("product");

    console.log("✅ API Service: Products cache cleared");
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

  // Generic cache clearing method for specific endpoints
  clearCache(endpoint) {
    console.log(`🧹 API Service: Clearing cache for ${endpoint}...`);

    // Clear memory cache entries that match the endpoint
    const cacheKeys = globalCache.getStats?.()
      ? globalCache.getStats().keys
      : [];
    const matchingKeys = cacheKeys.filter((key) => key.includes(endpoint));

    matchingKeys.forEach((key) => {
      globalCache.delete(key);
    });

    // Clear session cache entries that match the endpoint
    if (typeof window !== "undefined") {
      const endpointPattern = endpoint.replace("/api/", "");
      sessionCache.clearPattern(endpointPattern);
    }

    console.log(`✅ API Service: Cache cleared for ${endpoint}`);
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

  // Bulk update products with cache invalidation
  async bulkUpdateProducts(productIds, updateData) {
    const response = await fetch("/api/products/bulk-update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      body: JSON.stringify({ productIds, updateData }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk update products: ${response.status}`);
    }

    const result = await response.json();

    // Clear all product-related caches after successful update
    this.clearProductsCache();

    // Also clear any ongoing requests for products
    for (const [key] of ongoingRequests.entries()) {
      if (key.includes("/api/products")) {
        ongoingRequests.delete(key);
      }
    }

    return result;
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
