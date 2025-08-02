import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { enhanceProductsWithRatings } from "@/lib/reviewUtils";

// Track if indexes have been initialized to avoid repeated calls
let productIndexesInitialized = false;
// Cache for database connection and collections
let cachedDb = null;
let cachedCollection = null;

// Response cache for identical requests (5 minutes)
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

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
    console.log("Atlas-optimized product indexes initialized successfully");
  } catch (error) {
    console.log("Product index initialization note:", error.message);
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

  // Clean up expired entries if cache gets too large
  if (responseCache.size > 100) {
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
      return NextResponse.json(cachedResponse);
    }

    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const sortBy = searchParams.get("sortBy");
    const farmerId = searchParams.get("farmerId");
    const farmerEmail = searchParams.get("farmerEmail");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit"))
      : 12; // Default to 12 for pagination
    const page = parseInt(searchParams.get("page")) || 1;

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

    // Build optimized query for Atlas
    const query = { status: { $ne: "deleted" } };

    // Add search filter using text index for better performance
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

    // Add farmer filters for dashboard
    if (farmerId || farmerEmail) {
      query.$or = [];
      if (farmerId) {
        query.$or.push(
          { farmerId: farmerId },
          { farmerId: { $eq: farmerId } },
          { "farmer.id": farmerId },
          { "farmer._id": farmerId },
        );
      }
      if (farmerEmail) {
        query.$or.push(
          { farmerEmail: farmerEmail },
          { "farmer.email": farmerEmail },
        );
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

    // Optimized projection - only select needed fields to reduce data transfer
    const projection = {
      _id: 1,
      name: 1,
      description: 1,
      price: 1,
      stock: 1,
      images: 1,
      category: 1,
      averageRating: 1,
      totalReviews: 1,
      featured: 1,
      status: 1,
      createdAt: 1,
      updatedAt: 1,
      farmer: 1,
      farmerId: 1,
      farmerEmail: 1,
      farmerName: 1,
      tags: 1,
      isOrganic: 1,
      isFresh: 1,
      purchaseCount: 1,
      // Exclude heavy fields like detailed descriptions, reviews array, etc.
    };

    // Build sort options for better Atlas performance
    let sortOptions = {};
    if (search) {
      // Text search score for relevance
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

    // Use aggregation pipeline for better Atlas performance
    const pipeline = [
      { $match: query },
      { $project: projection },
      { $sort: sortOptions },
    ];

    // Add pagination only if needed
    if (limit < 1000) {
      pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
    }

    // Execute optimized query
    const startTime = Date.now();
    const [products, totalCount] = await Promise.all([
      cachedCollection.aggregate(pipeline).toArray(),
      // Only count if we need pagination
      limit < 1000
        ? cachedCollection.countDocuments(query)
        : Promise.resolve(0), // We'll calculate this after products are resolved
    ]);

    // Calculate actual total count for large datasets
    const actualTotalCount = limit < 1000 ? totalCount : products.length;

    const queryTime = Date.now() - startTime;
    console.log(
      `Atlas query executed in ${queryTime}ms for ${products.length} products`,
    );

    // Enhance with ratings only if needed (for detailed views)
    const enhancedProducts =
      search || limit <= 50
        ? await enhanceProductsWithRatings(products, cachedDb)
        : products; // Skip rating enhancement for large datasets

    // Build response
    const response = {
      products: enhancedProducts,
      pagination: {
        page,
        limit,
        total: actualTotalCount,
        totalPages: Math.ceil(actualTotalCount / limit),
        hasNext: page * limit < actualTotalCount,
        hasPrev: page > 1,
      },
      meta: {
        queryTime,
        cached: false,
      },
    };

    // Cache the response
    setCachedResponse(cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Products API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error.message,
        products: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const productData = await request.json();

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Clear cache when new product is added
    responseCache.clear();

    const result = await db.collection("products").insertOne({
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { message: "Product created successfully", id: result.insertedId },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
