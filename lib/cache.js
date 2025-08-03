// Cache utility for client-side data caching
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  // Generate cache key from parameters
  generateKey(baseKey, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    return `${baseKey}_${JSON.stringify(sortedParams)}`;
  }

  // Set cache entry with TTL
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + ttl);

    // Clean up expired entries periodically
    this.cleanup();
  }

  // Get cache entry if not expired
  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  // Check if cache has valid entry
  has(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  // Clear specific entry
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now > timestamp) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
const globalCache = new CacheManager();

export default globalCache;

// Session storage cache for persistence across page reloads
export class SessionCache {
  constructor(prefix = "farmfresh_") {
    this.prefix = prefix;
    this.memoryCache = new Map(); // In-memory cache for large items
  }

  generateKey(baseKey, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    return `${this.prefix}${baseKey}_${JSON.stringify(sortedParams)}`;
  }

  set(key, data, ttl = 5 * 60 * 1000) {
    if (typeof window === "undefined") return;

    const item = {
      data,
      timestamp: Date.now() + ttl,
    };

    // Check data size and use appropriate storage strategy
    const serializedItem = JSON.stringify(item);
    const sizeInMB = new Blob([serializedItem]).size / (1024 * 1024);

    try {
      // If data is too large (>2MB), use memory cache only
      if (sizeInMB > 2) {
        console.warn(
          `Data too large for sessionStorage (${sizeInMB.toFixed(2)}MB), using memory cache`,
        );
        this.memoryCache.set(key, item);
        return;
      }

      sessionStorage.setItem(key, serializedItem);
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        console.warn(
          "SessionStorage quota exceeded, using memory cache and clearing old entries",
        );
        // Clear old entries
        this.cleanup();

        // Store in memory cache instead
        this.memoryCache.set(key, item);

        // Try to store smaller items in sessionStorage after cleanup
        try {
          if (sizeInMB < 1) {
            sessionStorage.setItem(key, serializedItem);
          }
        } catch (e2) {
          console.warn("Still cannot store in sessionStorage after cleanup");
        }
      } else {
        console.error("Failed to store in sessionStorage:", e);
      }
    }
  }

  get(key) {
    if (typeof window === "undefined") return null;

    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const item = this.memoryCache.get(key);
      if (item.timestamp > Date.now()) {
        return item.data;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // Then check sessionStorage
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (parsed.timestamp > Date.now()) {
        return parsed.data;
      } else {
        sessionStorage.removeItem(key);
        return null;
      }
    } catch (e) {
      console.error("Failed to retrieve from sessionStorage:", e);
      sessionStorage.removeItem(key);
      return null;
    }
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(key);
  }

  cleanup() {
    if (typeof window === "undefined") return;

    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        try {
          const item = JSON.parse(sessionStorage.getItem(key));
          if (Date.now() > item.timestamp) {
            keysToRemove.push(key);
          }
        } catch (e) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  }

  // Clear all cache entries
  clear() {
    if (typeof window === "undefined") return;

    // Clear memory cache
    this.memoryCache.clear();

    // Clear sessionStorage entries with our prefix
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  }
}

export const sessionCache = new SessionCache();
