import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

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

    // Simplified indexes for direct farmers only
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
    console.log("Simplified farmers indexes initialized successfully");
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

// Simplified farmers query - only direct farmers
async function getFarmersOptimized(
  farmersCollection,
  search,
  specialization,
  location,
  limit,
  page,
) {
  // Build match filter for direct farmers only
  const matchFilter = {
    // Only get documents that are direct farmers (have name and location fields)
    name: { $exists: true, $ne: null },
    location: { $exists: true, $ne: null },
  };

  // Add search filter
  if (search) {
    matchFilter.$text = { $search: search };
  }

  // Add specialization filter
  if (specialization) {
    matchFilter.specializations = {
      $elemMatch: { $regex: specialization, $options: "i" },
    };
  }

  // Add location filter
  if (location) {
    matchFilter.location = { $regex: location, $options: "i" };
  }

  // Build aggregation pipeline
  const pipeline = [
    { $match: matchFilter },
    // Sort by verification status, then name
    { $sort: { verified: -1, isCertified: -1, name: 1 } },
  ];

  // Add pagination
  if (limit) {
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
  }

  return await farmersCollection.aggregate(pipeline).toArray();
}

// Get total count for pagination - simplified for direct farmers only
async function getFarmersCount(
  farmersCollection,
  search,
  specialization,
  location,
) {
  // Build match filter for direct farmers only
  const matchFilter = {
    name: { $exists: true, $ne: null },
    location: { $exists: true, $ne: null },
  };

  // Add search filter
  if (search) {
    matchFilter.$text = { $search: search };
  }

  // Add specialization filter
  if (specialization) {
    matchFilter.specializations = {
      $elemMatch: { $regex: specialization, $options: "i" },
    };
  }

  // Add location filter
  if (location) {
    matchFilter.location = { $regex: location, $options: "i" };
  }

  return await farmersCollection.countDocuments(matchFilter);
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
      : 50;
    const page = parseInt(searchParams.get("page")) || 1;
    const includeStats = searchParams.get("includeStats") !== "false";

    // Reuse database connections
    if (!cachedDb) {
      const client = await clientPromise;
      cachedDb = client.db("farmfresh");
      cachedFarmersCollection = cachedDb.collection("farmers");
      cachedProductsCollection = cachedDb.collection("products");
    }

    // Initialize indexes only once
    await initializeFarmersIndexes(cachedDb);

    // Get farmers using simplified query
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

    // Enhance with stats if requested
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
          stats: {
            totalProducts: 0,
            activeProducts: 0,
            averageRating: 0,
            totalSales: 0,
            featuredProducts: 0,
          },
        }));

    const responseData = {
      farmers: enhancedFarmers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
      filters: {
        search: search || "",
        specialization: specialization || "",
        location: location || "",
      },
    };

    // Cache the response
    setCachedResponse(cacheKey, responseData);

    const response = NextResponse.json(responseData);
    response.headers.set("X-Cache", "MISS");
    response.headers.set("Cache-Control", "public, max-age=300");
    return response;
  } catch (error) {
    console.error("Error in farmers API:", error);
    return NextResponse.json(
      { error: "Failed to fetch farmers" },
      { status: 500 },
    );
  }
}

// PUT method to update farmer profile
export async function PUT(request) {
  try {
    // Get the session to verify user authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a farmer
    if (session.user.userType !== "farmer") {
      return NextResponse.json(
        { error: "Access denied. Farmers only." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Find the farmer by email (session email)
    const farmer = await db
      .collection("farmers")
      .findOne({ email: session.user.email });

    if (!farmer) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }

    // Prepare update data - only include fields that can be updated
    const updateData = {
      updatedAt: new Date(),
    };

    // Update basic profile fields
    if (body.name) updateData.name = body.name;
    if (body.phone) updateData.phone = body.phone;

    // Update farm information
    if (body.farmInfo) {
      updateData.farmInfo = {
        ...farmer.farmInfo, // Keep existing farm info
        ...body.farmInfo, // Override with new data
      };
    }

    // Update address
    if (body.address) {
      updateData.address = {
        ...farmer.address, // Keep existing address
        ...body.address, // Override with new data
      };

      // IMPORTANT: Also update the location field for display compatibility
      // Combine address fields into a location string for farmer page display
      const addressParts = [];
      if (body.address.street) addressParts.push(body.address.street);
      if (body.address.city) addressParts.push(body.address.city);
      if (body.address.state) addressParts.push(body.address.state);
      if (body.address.country) addressParts.push(body.address.country);

      // Update location field with formatted address string
      if (addressParts.length > 0) {
        updateData.location = addressParts.join(", ");
      }
    }

    // Update business information
    if (body.businessInfo) {
      updateData.businessInfo = {
        ...farmer.businessInfo, // Keep existing business info
        ...body.businessInfo, // Override with new data
      };
    }

    // Update preferences
    if (body.preferences) {
      updateData.preferences = {
        ...farmer.preferences, // Keep existing preferences
        ...body.preferences, // Override with new data
      };
    }

    // Update farmer in database
    const result = await db
      .collection("farmers")
      .updateOne({ _id: farmer._id }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "No changes made to farmer profile" },
        { status: 400 },
      );
    }

    if (body.name) {
      try {
        await db.collection("products").updateMany(
          {
            $or: [
              { farmerId: farmer._id },
              { farmerEmail: farmer.email },
              { "farmer._id": farmer._id },
              { "farmer.email": farmer.email },
            ],
          },
          {
            $set: {
              "farmer.name": body.name,
              farmerName: body.name, // Update if this field exists
              updatedAt: new Date(),
            },
          },
        );
      } catch (error) {
        console.error("Error updating farmer name in products:", error);
        // Don't fail the whole request if product update fails
      }
    }

    // Fetch updated farmer data
    const updatedFarmer = await db.collection("farmers").findOne(
      { _id: farmer._id },
      { projection: { password: 0 } }, // Exclude password
    );

    // CRITICAL: Clear server-side response cache to prevent serving stale farmer data
    responseCache.clear();

    return NextResponse.json(
      {
        success: true,
        message: "Farmer profile updated successfully",
        farmer: updatedFarmer,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Error updating farmer profile:", error);
    return NextResponse.json(
      {
        error: "Failed to update farmer profile",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
