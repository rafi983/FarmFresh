import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { enhanceProductsWithRatings } from "@/lib/reviewUtils";

// Track if indexes have been initialized to avoid repeated calls
let productIndexesInitialized = false;
// Cache for database connection and collections
let cachedDb = null;
let cachedCollection = null;

// Response cache for identical requests (5 minutes)
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Export the response cache for access by bulk-update route
export { responseCache };

// Function to clear cache when reviews are updated
export function clearProductsCache() {
  responseCache.clear();
}

// Enhanced cache clearing function for purchase count updates
export function clearAllProductsCaches() {
  responseCache.clear();
  // Also clear any session cache
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("products-cache");
      sessionStorage.removeItem("farmfresh-products");
    } catch (error) {}
  }
}

// Initialize indexes optimized for MongoDB Atlas performance
async function initializeProductIndexes(db) {
  // Only initialize once per application lifecycle
  if (productIndexesInitialized) {
    return;
  }

  try {
    const collection = db.collection("products");

    // Check if indexes already exist before creating them
    const existingIndexes = await collection.listIndexes().toArray();
    const indexNames = existingIndexes.map((index) => index.name);

    // Simplified Atlas-optimized compound indexes for better performance
    const indexesToCreate = [
      // Primary query index - most common pattern
      {
        key: { status: 1, category: 1, createdAt: -1 },
        name: "primary_query_idx",
        options: { background: true },
      },
      // Search index
      {
        key: { name: "text", description: "text", category: "text" },
        name: "products_text_search_idx",
        options: {
          background: true,
          weights: { name: 10, category: 5, description: 1 },
        },
      },
      // Price and rating filters
      {
        key: { status: 1, price: 1, averageRating: -1 },
        name: "price_rating_idx",
        options: { background: true },
      },
      // Farmer queries
      {
        key: { "farmer._id": 1, status: 1 },
        name: "farmer_status_idx",
        options: { background: true },
      },
    ];

    for (const indexSpec of indexesToCreate) {
      if (!indexNames.includes(indexSpec.name)) {
        await collection.createIndex(indexSpec.key, {
          name: indexSpec.name,
          ...indexSpec.options,
        });
      }
    }

    productIndexesInitialized = true;
  } catch (error) {}
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

  // Clear cache if it gets too large to prevent memory issues
  if (responseCache.size > 50) {
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
      if (now - value.timestamp >= CACHE_TTL) {
        responseCache.delete(key);
      }
    }
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Check cache first
    const cacheKey = generateCacheKey(searchParams);
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      const response = NextResponse.json(cachedResponse);
      // Add cache headers to indicate this is cached data
      response.headers.set("X-Cache", "HIT");
      response.headers.set("Cache-Control", "public, max-age=300"); // 5 minutes
      return response;
    }

    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const sortBy = searchParams.get("sortBy");
    const farmerId = searchParams.get("farmerId");
    const farmerEmail = searchParams.get("farmerEmail");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const page = parseInt(searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;

    // Simplified filtering parameters
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice"))
      : null;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice"))
      : null;
    const minRating = searchParams.get("minRating")
      ? parseFloat(searchParams.get("minRating"))
      : null;

    // Reuse database connection and collection
    if (!cachedDb) {
      const client = await clientPromise;
      cachedDb = client.db("farmfresh");
      cachedCollection = cachedDb.collection("products");
    }

    // Initialize indexes only once
    await initializeProductIndexes(cachedDb);

    // Build query - BACK TO ORIGINAL WORKING VERSION
    const query = { status: { $ne: "deleted" } };

    // Check if this is a dashboard context request
    const isDashboardContext = searchParams.get("dashboard") === "true";

    // For public access (non-farmer requests), exclude inactive products
    if (!farmerId && !farmerEmail && !isDashboardContext) {
      query.status = { $nin: ["deleted", "inactive"] };
    }

    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Add category filter
    if (category && category !== "All Categories") {
      query.category = { $regex: new RegExp(category, "i") };
    }

    // Add featured filter
    if (featured === "true") {
      query.featured = true;
    }

    // Add farmer filters for dashboard - FIXED LOGIC to prevent cross-contamination
    if (farmerId || farmerEmail) {
      // For hardcoded farmers (no ObjectId), filter strictly by email
      if (!farmerId || !farmerId.match(/^[0-9a-fA-F]{24}$/)) {
        // This is a hardcoded farmer - filter ONLY by exact email match
        if (farmerEmail) {
          query.$and = query.$and || [];
          query.$and.push({
            $or: [
              { farmerEmail: { $eq: farmerEmail } },
              { "farmer.email": { $eq: farmerEmail } },
            ],
          });
        }
      } else {
        // This is a real farmer with ObjectId - use comprehensive matching
        query.$or = [];

        let farmerName = null;
        let farmerFarmName = null;

        try {
          const farmersCollection = cachedDb.collection("farmers");
          const farmer = await farmersCollection.findOne({
            _id: new ObjectId(farmerId),
          });

          if (farmer) {
            farmerName = farmer.name;
            farmerFarmName = farmer.farmName;
          }
        } catch (error) {
          console.log("Could not fetch farmer for name-based matching:", error);
        }

        // Match by farmerId (various formats)
        query.$or.push(
          { farmerId: farmerId },
          { farmerId: { $eq: farmerId } },
          { "farmer.id": farmerId },
          { "farmer._id": farmerId },
        );

        // Match by farmer email (for real farmers)
        if (farmerEmail) {
          query.$or.push(
            { farmerEmail: farmerEmail },
            { "farmer.email": farmerEmail },
          );
        }

        // Match by farmer name (if available)
        if (farmerName) {
          query.$or.push(
            { "farmer.name": farmerName },
            { "farmer.name": { $regex: new RegExp(`^${farmerName}$`, "i") } },
          );
        }

        // Match by farm name (if available)
        if (farmerFarmName) {
          query.$or.push(
            { "farmer.farmName": farmerFarmName },
            {
              "farmer.farmName": {
                $regex: new RegExp(`^${farmerFarmName}$`, "i"),
              },
            },
          );
        }
      }
    }

    // Add price range filter
    if (minPrice !== null || maxPrice !== null) {
      query.price = {};
      if (minPrice !== null) query.price.$gte = minPrice;
      if (maxPrice !== null) query.price.$lte = maxPrice;
    }

    // Add rating filter
    if (minRating !== null) {
      query.averageRating = { $gte: minRating };
    }

    // BACK TO ORIGINAL WORKING SORT
    let sortOptions = {};
    if (search) {
      sortOptions = { score: { $meta: "textScore" }, createdAt: -1 };
    } else {
      switch (sortBy) {
        case "price-low":
          sortOptions = { price: 1 };
          break;
        case "price-high":
          sortOptions = { price: -1 };
          break;
        case "rating":
          sortOptions = { averageRating: -1, totalReviews: -1 };
          break;
        case "popular":
          sortOptions = { purchaseCount: -1, averageRating: -1 };
          break;
        case "oldest":
          sortOptions = { createdAt: 1 };
          break;
        case "newest":
        default:
          sortOptions = { createdAt: -1 };
          break;
      }
    }

    // BACK TO ORIGINAL WORKING QUERY EXECUTION
    const startTime = Date.now();

    // Execute query with original method
    const [products, totalCount] = await Promise.all([
      cachedCollection
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray(),
      cachedCollection.countDocuments(query),
    ]);

    const queryTime = Date.now() - startTime;
    console.log(
      `Query executed in ${queryTime}ms for ${products.length} products, total: ${totalCount}`,
    );

    // Enhance with ratings
    const enhancedProducts = await enhanceProductsWithRatings(
      products,
      cachedDb,
    );

    // Prepare response data
    const responseData = {
      products: enhancedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      meta: {
        query: {
          search,
          category,
          featured,
          sortBy,
          minPrice,
          maxPrice,
          minRating,
        },
        performance: {
          queryTime,
          cached: false,
        },
        timestamp: new Date().toISOString(),
      },
    };

    // Cache the response
    setCachedResponse(cacheKey, responseData);

    const response = NextResponse.json(responseData);
    // Add cache headers
    response.headers.set("X-Cache", "MISS");
    response.headers.set("Cache-Control", "public, max-age=300"); // 5 minutes
    response.headers.set("X-Generated-At", new Date().toISOString());

    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        message: error.message,
        products: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes for the first POST operation
    await initializeProductIndexes(db);

    const result = await db.collection("products").insertOne({
      ...body,
      // Don't overwrite createdAt if it's already provided, but ensure it's a Date object
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      updatedAt: new Date(),
      status: "active",
      averageRating: 0,
      totalReviews: 0,
      reviewCount: 0,
      purchaseCount: 0,
    });

    return NextResponse.json({
      success: true,
      productId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product", message: error.message },
      { status: 500 },
    );
  }
}
