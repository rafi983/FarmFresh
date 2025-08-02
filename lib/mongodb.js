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
  serverSelectionTimeoutMS:
    ATLAS_CONFIG.connectionPool.serverSelectionTimeoutMS,

  // Atlas optimizations
  retryWrites: ATLAS_CONFIG.atlasOptimizations.retryWrites,
  retryReads: ATLAS_CONFIG.atlasOptimizations.retryReads,
  compressors: ATLAS_CONFIG.atlasOptimizations.compressors,
  zlibCompressionLevel: ATLAS_CONFIG.atlasOptimizations.zlibCompressionLevel,

  // Read preferences
  readPreference: ATLAS_CONFIG.queryOptimization.readPreference,
  readConcern: ATLAS_CONFIG.queryOptimization.readConcern,

  // Additional optimizations
  maxConnecting: 2, // Limit concurrent connection attempts
  heartbeatFrequencyMS: 10000, // Heartbeat frequency
  socketTimeoutMS: 30000, // Socket timeout
  connectTimeoutMS: 10000, // Connection timeout
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

// Enhanced client promise with health checking
const enhancedClientPromise = clientPromise.then(async (client) => {
  // Perform initial health check
  const isHealthy = await ConnectionHealthChecker.checkConnection(client);
  if (!isHealthy) {
    throw new Error("MongoDB connection failed health check");
  }

  // Log connection stats in development
  if (process.env.NODE_ENV === "development") {
    const stats = await ConnectionHealthChecker.getConnectionStats(client);
    if (stats) {
      console.log("MongoDB Atlas connection established:", {
        collections: stats.collections,
        dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
        indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
      });
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
