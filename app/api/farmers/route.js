import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Track if indexes have been initialized to avoid repeated calls
let farmersIndexesInitialized = false;
// Cache for database connection and collections
let cachedDb = null;
let cachedFarmersCollection = null;
let cachedProductsCollection = null;

// Response cache for identical requests (5 minutes)
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Initialize indexes optimized for MongoDB Atlas performance
async function initializeFarmersIndexes(db) {
  if (farmersIndexesInitialized) {
    return;
  }

  try {
    const farmersCollection = db.collection("farmers");

    // Check existing indexes
    const existingIndexes = await farmersCollection.listIndexes().toArray();
    const indexNames = existingIndexes.map((index) => index.name);

    // Atlas-optimized compound indexes for farmers queries
    const indexesToCreate = [
      // Text search index with proper weights
      {
        key: {
          name: "text",
          description: "text",
          location: "text",
          farmName: "text",
          specializations: "text",
        },
        name: "farmers_text_search_idx",
        options: {
          background: true,
          weights: {
            name: 10,
            farmName: 8,
            location: 5,
            specializations: 3,
            description: 1,
          },
        },
      },
      // Location-based queries
      {
        key: { location: 1, verified: 1 },
        name: "location_verified_idx",
        options: { background: true },
      },
      // Specialization queries
      {
        key: { specializations: 1, verified: 1 },
        name: "specializations_verified_idx",
        options: { background: true },
      },
      // Nested farmers array index
      {
        key: { "farmers.name": 1, "farmers.location": 1 },
        name: "nested_farmers_search_idx",
        options: { background: true },
      },
      // Verified/certification status
      {
        key: { verified: 1, isCertified: 1, createdAt: -1 },
        name: "status_created_idx",
        options: { background: true },
      },
    ];

    for (const indexSpec of indexesToCreate) {
      if (!indexNames.includes(indexSpec.name)) {
        await farmersCollection.createIndex(indexSpec.key, {
          name: indexSpec.name,
          ...indexSpec.options,
        });
      }
    }

    farmersIndexesInitialized = true;
    console.log("Atlas-optimized farmers indexes initialized successfully");
  } catch (error) {
    console.log("Farmers index initialization note:", error.message);
  }
}

// Generate cache key for request
function generateCacheKey(searchParams) {
  const params = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return JSON.stringify(params);
}

// Get cached response if available and not expired
function getCachedResponse(cacheKey) {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  responseCache.delete(cacheKey);
  return null;
}

// Set response in cache
function setCachedResponse(cacheKey, data) {
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  // Clear cache if it gets too large
  if (responseCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
      if (now - value.timestamp >= CACHE_TTL) {
        responseCache.delete(key);
      }
    }
  }
}

// Enhanced farmer data with product statistics
async function enhanceFarmersWithStats(
  farmersCollection,
  productsCollection,
  farmers,
) {
  if (farmers.length === 0) return farmers;

  // Get all farmer IDs and names for batch processing
  const farmerIds = farmers.map((f) => f._id).filter(Boolean);
  const farmerNames = farmers.map((f) => f.name).filter(Boolean);
  const farmerEmails = farmers.map((f) => f.email).filter(Boolean);

  // Calculate statistics for all farmers in a single aggregation
  const statsAggregation = [
    {
      $match: {
        $or: [
          { farmerId: { $in: farmerIds } },
          { "farmer._id": { $in: farmerIds } },
          { "farmer.name": { $in: farmerNames } },
          { farmerEmail: { $in: farmerEmails } },
        ],
      },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $ne: ["$farmerId", null] },
            "$farmerId",
            {
              $cond: [
                { $ne: ["$farmer._id", null] },
                "$farmer._id",
                {
                  $cond: [
                    { $ne: ["$farmer.name", null] },
                    "$farmer.name",
                    "$farmerEmail",
                  ],
                },
              ],
            },
          ],
        },
        totalProducts: { $sum: 1 },
        activeProducts: {
          $sum: { $cond: [{ $gt: ["$stock", 0] }, 1, 0] },
        },
        averageRating: { $avg: "$averageRating" },
        totalSales: { $sum: "$purchaseCount" },
        featuredProducts: {
          $sum: { $cond: ["$featured", 1, 0] },
        },
      },
    },
  ];

  const statsResults = await productsCollection
    .aggregate(statsAggregation)
    .toArray();

  // Create a lookup map for quick stats access
  const statsMap = new Map();
  statsResults.forEach((stat) => {
    statsMap.set(stat._id, {
      totalProducts: stat.totalProducts || 0,
      activeProducts: stat.activeProducts || 0,
      averageRating: Math.round((stat.averageRating || 0) * 10) / 10,
      totalSales: stat.totalSales || 0,
      featuredProducts: stat.featuredProducts || 0,
    });
  });

  // Enhance farmers with their statistics
  return farmers.map((farmer) => {
    const stats = statsMap.get(farmer._id) ||
      statsMap.get(farmer.name) ||
      statsMap.get(farmer.email) || {
        totalProducts: 0,
        activeProducts: 0,
        averageRating: 0,
        totalSales: 0,
        featuredProducts: 0,
      };

    return {
      ...farmer,
      // Normalize field names
      profilePicture: farmer.profilePicture || farmer.profileImage,
      bio: farmer.bio || farmer.description,
      verified: farmer.verified || farmer.isCertified || false,
      stats,
    };
  });
}

// Optimized farmers query using aggregation pipeline
async function getFarmersOptimized(
  farmersCollection,
  search,
  specialization,
  location,
  limit,
  page,
) {
  const pipeline = [];

  // Build match stage for filtering
  const matchStage = { $match: { $or: [] } };

  // Handle both direct farmers and nested farmers structure
  const directFarmerMatch = {};
  const nestedFarmerMatch = {};

  // Add search filters
  if (search) {
    directFarmerMatch.$text = { $search: search };
    nestedFarmerMatch["farmers"] = {
      $elemMatch: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
          { farmName: { $regex: search, $options: "i" } },
        ],
      },
    };
  }

  // Add specialization filter
  if (specialization) {
    directFarmerMatch.specializations = {
      $elemMatch: { $regex: specialization, $options: "i" },
    };
    if (nestedFarmerMatch["farmers"]) {
      nestedFarmerMatch["farmers"].$elemMatch.$or.push({
        specializations: {
          $elemMatch: { $regex: specialization, $options: "i" },
        },
      });
    } else {
      nestedFarmerMatch["farmers"] = {
        $elemMatch: {
          specializations: {
            $elemMatch: { $regex: specialization, $options: "i" },
          },
        },
      };
    }
  }

  // Add location filter
  if (location) {
    directFarmerMatch.location = { $regex: location, $options: "i" };
    if (nestedFarmerMatch["farmers"]) {
      nestedFarmerMatch["farmers"].$elemMatch.$or =
        nestedFarmerMatch["farmers"].$elemMatch.$or || [];
      nestedFarmerMatch["farmers"].$elemMatch.$or.push({
        location: { $regex: location, $options: "i" },
      });
    } else {
      nestedFarmerMatch["farmers"] = {
        $elemMatch: { location: { $regex: location, $options: "i" } },
      };
    }
  }

  // Add conditions for direct farmers
  if (Object.keys(directFarmerMatch).length > 0) {
    directFarmerMatch.name = { $exists: true };
    directFarmerMatch.location = { $exists: true };
    matchStage.$match.$or.push(directFarmerMatch);
  }

  // Add conditions for nested farmers
  if (Object.keys(nestedFarmerMatch).length > 0) {
    matchStage.$match.$or.push(nestedFarmerMatch);
  }

  // If no specific filters, match all documents
  if (matchStage.$match.$or.length === 0) {
    matchStage.$match = {};
  }

  pipeline.push(matchStage);

  // Add facet stage for both direct and nested farmers
  pipeline.push({
    $facet: {
      directFarmers: [
        { $match: { name: { $exists: true }, location: { $exists: true } } },
        { $project: { farmers: 0 } }, // Exclude nested farmers array
      ],
      nestedFarmers: [
        { $match: { farmers: { $exists: true, $type: "array" } } },
        { $unwind: "$farmers" },
        { $replaceRoot: { newRoot: "$farmers" } },
      ],
    },
  });

  // Combine results
  pipeline.push({
    $project: {
      allFarmers: { $concatArrays: ["$directFarmers", "$nestedFarmers"] },
    },
  });

  pipeline.push({ $unwind: "$allFarmers" });
  pipeline.push({ $replaceRoot: { newRoot: "$allFarmers" } });

  // Add sorting (by verification status, then name)
  pipeline.push({
    $sort: { verified: -1, isCertified: -1, name: 1 },
  });

  // Add pagination
  if (limit) {
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
  }

  return await farmersCollection.aggregate(pipeline).toArray();
}

// Get total count for pagination
async function getFarmersCount(
  farmersCollection,
  search,
  specialization,
  location,
) {
  const pipeline = [];

  // Build match stage (same as main query)
  const matchStage = { $match: { $or: [] } };

  const directFarmerMatch = {};
  const nestedFarmerMatch = {};

  if (search) {
    directFarmerMatch.$text = { $search: search };
    nestedFarmerMatch["farmers"] = {
      $elemMatch: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
          { farmName: { $regex: search, $options: "i" } },
        ],
      },
    };
  }

  if (specialization) {
    directFarmerMatch.specializations = {
      $elemMatch: { $regex: specialization, $options: "i" },
    };
    if (nestedFarmerMatch["farmers"]) {
      nestedFarmerMatch["farmers"].$elemMatch.$or.push({
        specializations: {
          $elemMatch: { $regex: specialization, $options: "i" },
        },
      });
    } else {
      nestedFarmerMatch["farmers"] = {
        $elemMatch: {
          specializations: {
            $elemMatch: { $regex: specialization, $options: "i" },
          },
        },
      };
    }
  }

  if (location) {
    directFarmerMatch.location = { $regex: location, $options: "i" };
    if (nestedFarmerMatch["farmers"]) {
      nestedFarmerMatch["farmers"].$elemMatch.$or =
        nestedFarmerMatch["farmers"].$elemMatch.$or || [];
      nestedFarmerMatch["farmers"].$elemMatch.$or.push({
        location: { $regex: location, $options: "i" },
      });
    } else {
      nestedFarmerMatch["farmers"] = {
        $elemMatch: { location: { $regex: location, $options: "i" } },
      };
    }
  }

  if (Object.keys(directFarmerMatch).length > 0) {
    directFarmerMatch.name = { $exists: true };
    directFarmerMatch.location = { $exists: true };
    matchStage.$match.$or.push(directFarmerMatch);
  }

  if (Object.keys(nestedFarmerMatch).length > 0) {
    matchStage.$match.$or.push(nestedFarmerMatch);
  }

  if (matchStage.$match.$or.length === 0) {
    matchStage.$match = {};
  }

  pipeline.push(matchStage);

  pipeline.push({
    $facet: {
      directFarmers: [
        { $match: { name: { $exists: true }, location: { $exists: true } } },
        { $count: "count" },
      ],
      nestedFarmers: [
        { $match: { farmers: { $exists: true, $type: "array" } } },
        { $unwind: "$farmers" },
        { $count: "count" },
      ],
    },
  });

  const result = await farmersCollection.aggregate(pipeline).toArray();

  if (result.length === 0) return 0;

  const directCount = result[0].directFarmers[0]?.count || 0;
  const nestedCount = result[0].nestedFarmers[0]?.count || 0;

  return directCount + nestedCount;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Check cache first
    const cacheKey = generateCacheKey(searchParams);
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      const response = NextResponse.json(cachedResponse);
      response.headers.set("X-Cache", "HIT");
      response.headers.set("Cache-Control", "public, max-age=300");
      return response;
    }

    const search = searchParams.get("search");
    const specialization = searchParams.get("specialization");
    const location = searchParams.get("location");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit"))
      : 12; // Default pagination limit
    const page = parseInt(searchParams.get("page")) || 1;
    const includeStats = searchParams.get("includeStats") !== "false"; // Default to true

    // Reuse database connections
    if (!cachedDb) {
      const client = await clientPromise;
      cachedDb = client.db("farmfresh");
      cachedFarmersCollection = cachedDb.collection("farmers");
      cachedProductsCollection = cachedDb.collection("products");
    }

    // Initialize indexes only once
    await initializeFarmersIndexes(cachedDb);

    // Get farmers using optimized aggregation pipeline
    const [farmers, totalCount] = await Promise.all([
      getFarmersOptimized(
        cachedFarmersCollection,
        search,
        specialization,
        location,
        limit,
        page,
      ),
      getFarmersCount(
        cachedFarmersCollection,
        search,
        specialization,
        location,
      ),
    ]);

    // Enhance farmers with product statistics if requested
    const enhancedFarmers = includeStats
      ? await enhanceFarmersWithStats(
          cachedFarmersCollection,
          cachedProductsCollection,
          farmers,
        )
      : farmers.map((farmer) => ({
          ...farmer,
          profilePicture: farmer.profilePicture || farmer.profileImage,
          bio: farmer.bio || farmer.description,
          verified: farmer.verified || farmer.isCertified || false,
        }));

    const responseData = {
      farmers: enhancedFarmers,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    };

    // Cache the response
    setCachedResponse(cacheKey, responseData);

    const response = NextResponse.json(responseData);
    response.headers.set("X-Cache", "MISS");
    response.headers.set("Cache-Control", "public, max-age=300");

    return response;
  } catch (error) {
    console.error("Error fetching farmers:", error);
    return NextResponse.json(
      { error: "Failed to fetch farmers" },
      { status: 500 },
    );
  }
}
