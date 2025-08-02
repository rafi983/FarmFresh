import { MongoClient } from "mongodb";
import {
  ATLAS_CONFIG,
  PerformanceMonitor,
  ConnectionHealthChecker,
} from "./atlas-config";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// Enhanced options for MongoDB Atlas performance
const options = {
  // Connection pooling for better performance
  maxPoolSize: ATLAS_CONFIG.connectionPool.maxPoolSize,
  minPoolSize: ATLAS_CONFIG.connectionPool.minPoolSize,
  maxIdleTimeMS: ATLAS_CONFIG.connectionPool.maxIdleTimeMS,
  waitQueueTimeoutMS: ATLAS_CONFIG.connectionPool.waitQueueTimeoutMS,
  serverSelectionTimeoutMS: 15000, // Increased from 5s to 15s for Atlas

  // Atlas optimizations
  retryWrites: ATLAS_CONFIG.atlasOptimizations.retryWrites,
  retryReads: ATLAS_CONFIG.atlasOptimizations.retryReads,
  compressors: ATLAS_CONFIG.atlasOptimizations.compressors,
  zlibCompressionLevel: ATLAS_CONFIG.atlasOptimizations.zlibCompressionLevel,

  // Read preferences
  readPreference: ATLAS_CONFIG.queryOptimization.readPreference,
  readConcern: ATLAS_CONFIG.queryOptimization.readConcern,

  // Additional optimizations for Atlas stability
  maxConnecting: 2, // Limit concurrent connection attempts
  heartbeatFrequencyMS: 30000, // Increased heartbeat frequency for Atlas
  socketTimeoutMS: 45000, // Increased socket timeout for Atlas
  connectTimeoutMS: 15000, // Increased connection timeout for Atlas

  // Atlas-specific network resilience
  directConnection: false, // Use SRV connection for Atlas
};

let client;
let clientPromise;

// Global connection promise to prevent multiple connections
if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the connection
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();

    // Add connection event listeners for monitoring
    client.on("connectionPoolCreated", () => {
      console.log("MongoDB connection pool created");
    });

    client.on("connectionCreated", () => {
      console.log("New MongoDB connection created");
    });

    client.on("connectionClosed", () => {
      console.log("MongoDB connection closed");
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Enhanced client promise with optional health checking
const enhancedClientPromise = clientPromise.then(async (client) => {
  // Try health check but don't fail completely if it times out
  try {
    const isHealthy = await ConnectionHealthChecker.checkConnection(client);
    if (!isHealthy) {
      console.warn(
        "MongoDB connection health check failed, but proceeding anyway",
      );
    }
  } catch (error) {
    console.warn("Health check error (proceeding anyway):", error.message);
  }

  // Log connection stats in development (non-blocking)
  if (process.env.NODE_ENV === "development") {
    try {
      const stats = await ConnectionHealthChecker.getConnectionStats(client);
      if (stats) {
        console.log("MongoDB Atlas connection established:", {
          collections: stats.collections,
          dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
          indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
        });
      }
    } catch (error) {
      console.warn("Could not fetch connection stats:", error.message);
    }
  }

  return client;
});

// Optimized database operations wrapper
export const dbOperations = {
  // Execute query with performance monitoring
  async executeQuery(operation, operationName, params = {}) {
    return PerformanceMonitor.executeWithTiming(
      operation,
      operationName,
      params,
    );
  },

  // Get optimized collection with proper indexes
  async getCollection(collectionName, hints = {}) {
    const client = await enhancedClientPromise;
    const db = client.db("farmfresh");
    const collection = db.collection(collectionName);

    // Add index hints if provided
    if (hints.index && ATLAS_CONFIG.indexHints[collectionName]?.[hints.index]) {
      collection.hint(ATLAS_CONFIG.indexHints[collectionName][hints.index]);
    }

    return collection;
  },

  // Optimized aggregation with Atlas settings
  async aggregate(collectionName, pipeline, options = {}) {
    const collection = await this.getCollection(collectionName);

    const optimizedOptions = {
      ...ATLAS_CONFIG.aggregationOptimization,
      ...options,
    };

    return this.executeQuery(
      () => collection.aggregate(pipeline, optimizedOptions).toArray(),
      `aggregate_${collectionName}`,
      { pipeline, options: optimizedOptions },
    );
  },

  // Optimized find with Atlas settings
  async find(collectionName, query, options = {}) {
    const collection = await this.getCollection(collectionName, options);

    const optimizedOptions = {
      maxTimeMS: ATLAS_CONFIG.queryOptimization.maxTimeMS,
      ...options,
    };

    return this.executeQuery(
      () => collection.find(query, optimizedOptions).toArray(),
      `find_${collectionName}`,
      { query, options: optimizedOptions },
    );
  },

  // Optimized findOne with Atlas settings
  async findOne(collectionName, query, options = {}) {
    const collection = await this.getCollection(collectionName, options);

    const optimizedOptions = {
      maxTimeMS: ATLAS_CONFIG.queryOptimization.maxTimeMS,
      ...options,
    };

    return this.executeQuery(
      () => collection.findOne(query, optimizedOptions),
      `findOne_${collectionName}`,
      { query, options: optimizedOptions },
    );
  },

  // Health check utility
  async healthCheck() {
    const client = await enhancedClientPromise;
    return ConnectionHealthChecker.checkConnection(client);
  },
};

export default enhancedClientPromise;
