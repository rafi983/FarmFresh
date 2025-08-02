// MongoDB Atlas performance optimization configuration
export const ATLAS_CONFIG = {
  // Connection pooling settings for better performance
  connectionPool: {
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 2, // Minimum number of connections in the pool
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    waitQueueTimeoutMS: 5000, // Wait 5 seconds for a connection from the pool
    serverSelectionTimeoutMS: 5000, // Server selection timeout
  },

  // Query optimization settings
  queryOptimization: {
    maxTimeMS: 30000, // Maximum query execution time
    allowDiskUse: false, // Disable disk use for better performance on Atlas
    readConcern: { level: "local" }, // Use local read concern for better performance
    readPreference: "primaryPreferred", // Prefer primary for read operations
  },

  // Atlas-specific optimizations
  atlasOptimizations: {
    retryWrites: true, // Enable retryable writes
    retryReads: true, // Enable retryable reads
    compressors: ["snappy", "zlib"], // Enable compression
    zlibCompressionLevel: 6, // Compression level
  },

  // Aggregation pipeline optimizations
  aggregationOptimization: {
    allowDiskUse: false, // Keep in memory for better performance
    maxTimeMS: 15000, // Shorter timeout for aggregations
    cursor: { batchSize: 100 }, // Optimize batch size
  },

  // Index hints for common operations
  indexHints: {
    products: {
      search: "products_text_search_idx",
      category: "primary_query_idx",
      price: "price_rating_idx",
      farmer: "farmer_status_idx",
    },
    orders: {
      user: "userId_createdAt_idx",
      farmer: "items_farmerId_status_date_idx",
      status: "status_createdAt_idx",
    },
  },

  // Cache TTL settings
  cacheTTL: {
    products: 5 * 60 * 1000, // 5 minutes
    categories: 30 * 60 * 1000, // 30 minutes
    farmers: 15 * 60 * 1000, // 15 minutes
    orders: 2 * 60 * 1000, // 2 minutes
    reviews: 10 * 60 * 1000, // 10 minutes
  },
};

// Performance monitoring utilities
export class PerformanceMonitor {
  static logSlowQuery(operation, duration, params = {}) {
    if (duration > 1000) {
      // Log queries slower than 1 second
      console.warn(`Slow query detected: ${operation}`, {
        duration: `${duration}ms`,
        params,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async executeWithTiming(operation, operationName, params = {}) {
    const startTime = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      this.logSlowQuery(operationName, duration, params);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query failed: ${operationName}`, {
        duration: `${duration}ms`,
        error: error.message,
        params,
      });
      throw error;
    }
  }
}

// Connection health checker with improved timeout handling
export class ConnectionHealthChecker {
  static async checkConnection(client) {
    try {
      // Use a shorter timeout for health checks and target the actual database
      const result = await Promise.race([
        client.db("farmfresh").command({ ping: 1 }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Health check timeout")), 3000),
        ),
      ]);
      return true;
    } catch (error) {
      console.error("MongoDB connection health check failed:", error.message);

      // For Atlas, try a more lenient check
      if (
        error.message.includes("timeout") ||
        error.message.includes("network")
      ) {
        console.warn(
          "Network timeout detected, attempting basic connection test...",
        );
        try {
          // Just check if we can get database info (less strict)
          await client.db("farmfresh").stats({ timeout: 2000 });
          console.log("Basic connection test passed");
          return true;
        } catch (fallbackError) {
          console.error(
            "Fallback connection test also failed:",
            fallbackError.message,
          );
          return false;
        }
      }

      return false;
    }
  }

  static async getConnectionStats(client) {
    try {
      const stats = await client.db("farmfresh").stats();
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        avgObjSize: stats.avgObjSize,
      };
    } catch (error) {
      console.error("Failed to get connection stats:", error);
      return null;
    }
  }
}
