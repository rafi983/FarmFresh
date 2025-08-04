import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Track if indexes have been initialized to avoid repeated calls
let farmerIndexesInitialized = false;
// Cache for database connection and collections
let cachedDb = null;
let cachedFarmersCollection = null;
let cachedProductsCollection = null;

// Response cache for identical requests (5 minutes)
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Initialize indexes optimized for MongoDB Atlas performance
async function initializeFarmerIndexes(db) {
  if (farmerIndexesInitialized) {
    return;
  }

  try {
    const farmersCollection = db.collection("farmers");
    const productsCollection = db.collection("products");

    // Check existing indexes
    const [farmerIndexes, productIndexes] = await Promise.all([
      farmersCollection.listIndexes().toArray(),
      productsCollection.listIndexes().toArray(),
    ]);

    const farmerIndexNames = farmerIndexes.map((idx) => idx.name);
    const productIndexNames = productIndexes.map((idx) => idx.name);

    // Farmers collection indexes
    const farmerIndexesToCreate = [
      {
        key: { _id: 1 },
        name: "farmer_id_idx",
        options: { background: true },
      },
      {
        key: { "farmers._id": 1 },
        name: "nested_farmers_id_idx",
        options: { background: true },
      },
      {
        key: { email: 1 },
        name: "farmer_email_idx",
        options: { background: true },
      },
      {
        key: { name: 1, farmName: 1 },
        name: "farmer_names_idx",
        options: { background: true },
      },
    ];

    // Products collection indexes for farmer queries
    const productIndexesToCreate = [
      {
        key: { farmerId: 1, status: 1 },
        name: "farmer_products_idx",
        options: { background: true },
      },
      {
        key: { "farmer._id": 1, status: 1 },
        name: "farmer_nested_id_idx",
        options: { background: true },
      },
      {
        key: { "farmer.name": 1, status: 1 },
        name: "farmer_name_idx",
        options: { background: true },
      },
      {
        key: { farmerEmail: 1, status: 1 },
        name: "farmer_email_products_idx",
        options: { background: true },
      },
      {
        key: { stock: 1, status: 1 },
        name: "stock_status_idx",
        options: { background: true },
      },
    ];

    // Create farmer indexes
    for (const indexSpec of farmerIndexesToCreate) {
      if (!farmerIndexNames.includes(indexSpec.name)) {
        await farmersCollection.createIndex(indexSpec.key, {
          name: indexSpec.name,
          ...indexSpec.options,
        });
      }
    }

    // Create product indexes
    for (const indexSpec of productIndexesToCreate) {
      if (!productIndexNames.includes(indexSpec.name)) {
        await productsCollection.createIndex(indexSpec.key, {
          name: indexSpec.name,
          ...indexSpec.options,
        });
      }
    }

    farmerIndexesInitialized = true;
    console.log("Atlas-optimized farmer indexes initialized successfully");
  } catch (error) {
    console.log("Farmer index initialization note:", error.message);
  }
}

// Generate cache key for request
function generateCacheKey(id) {
  return `farmer_${id}`;
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

// Optimized farmer lookup with proper indexing
async function findFarmerOptimized(farmersCollection, id) {
  // First, try to find farmer by ObjectId (for new farmers) - uses primary index
  if (ObjectId.isValid(id)) {
    const farmer = await farmersCollection.findOne({ _id: new ObjectId(id) });
    if (farmer) return farmer;
  }

  // Search in the farmers array (for hardcoded farmers) - uses nested_farmers_id_idx
  const farmersDoc = await farmersCollection.findOne(
    { "farmers._id": id },
    { projection: { farmers: { $elemMatch: { _id: id } } } }, // Project only matching farmer
  );

  if (farmersDoc?.farmers?.[0]) {
    const farmer = farmersDoc.farmers[0];
    farmer._id = id; // Ensure consistent _id field
    return farmer;
  }

  return null;
}

// Optimized product statistics calculation using aggregation pipeline
async function calculateFarmerStatsOptimized(productsCollection, farmer, id) {
  const pipeline = [
    {
      $match: {
        $or: [
          { farmerId: id },
          { farmerId: farmer._id },
          { "farmer.id": id },
          { "farmer._id": id },
          { farmerEmail: farmer.email },
          { "farmer.name": { $regex: new RegExp(`^${farmer.name}$`, "i") } },
          ...(farmer.farmName
            ? [
                {
                  "farmer.farmName": {
                    $regex: new RegExp(`^${farmer.farmName}$`, "i"),
                  },
                },
              ]
            : []),
        ],
      },
    },
    {
      $facet: {
        // Get all products for the farmer
        products: [
          {
            $project: {
              _id: 1,
              name: 1,
              price: 1,
              stock: 1,
              category: 1,
              images: 1,
              description: 1,
              farmer: 1,
              farmerId: 1,
              farmerEmail: 1,
              averageRating: 1,
              purchaseCount: 1,
              status: 1,
              featured: 1,
              createdAt: 1,
            },
          },
        ],
        // Calculate statistics
        stats: [
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              activeProducts: {
                $sum: {
                  $cond: [{ $gt: ["$stock", 0] }, 1, 0],
                },
              },
              averageRating: { $avg: "$averageRating" },
              totalSales: { $sum: "$purchaseCount" },
              totalStock: { $sum: "$stock" },
              featuredProducts: {
                $sum: {
                  $cond: ["$featured", 1, 0],
                },
              },
            },
          },
        ],
      },
    },
  ];

  const result = await productsCollection.aggregate(pipeline).toArray();

  if (result.length === 0) {
    return {
      products: [],
      stats: {
        totalProducts: 0,
        activeProducts: 0,
        averageRating: 0,
        totalSales: 0,
        totalStock: 0,
        featuredProducts: 0,
      },
    };
  }

  const { products, stats } = result[0];
  const statsData = stats[0] || {
    totalProducts: 0,
    activeProducts: 0,
    averageRating: 0,
    totalSales: 0,
    totalStock: 0,
    featuredProducts: 0,
  };

  return {
    products,
    stats: {
      ...statsData,
      averageRating: Math.round((statsData.averageRating || 0) * 10) / 10,
    },
  };
}

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Invalid farmer ID" }, { status: 400 });
    }

    // Check cache first
    const cacheKey = generateCacheKey(id);
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      const response = NextResponse.json(cachedResponse);
      response.headers.set("X-Cache", "HIT");
      response.headers.set("Cache-Control", "public, max-age=300");
      return response;
    }

    // Reuse database connections
    if (!cachedDb) {
      const client = await clientPromise;
      cachedDb = client.db("farmfresh");
      cachedFarmersCollection = cachedDb.collection("farmers");
      cachedProductsCollection = cachedDb.collection("products");
    }

    // Initialize indexes only once
    await initializeFarmerIndexes(cachedDb);

    // Find farmer using optimized lookup
    const farmer = await findFarmerOptimized(cachedFarmersCollection, id);

    if (!farmer) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }

    // Calculate farmer statistics using optimized aggregation
    const { products, stats } = await calculateFarmerStatsOptimized(
      cachedProductsCollection,
      farmer,
      id,
    );

    // Enhance farmer data with calculated statistics
    const enhancedFarmer = {
      ...farmer,
      // Ensure consistent field names for both hardcoded and new farmers
      profilePicture: farmer.profilePicture || farmer.profileImage,
      bio: farmer.bio || farmer.description,
      isCertified: farmer.isCertified || false,
      verified: farmer.verified || farmer.isCertified || false,
      stats,
      products,
    };

    const responseData = {
      success: true,
      farmer: enhancedFarmer,
    };

    // Cache the response
    setCachedResponse(cacheKey, responseData);

    const response = NextResponse.json(responseData);
    response.headers.set("X-Cache", "MISS");
    response.headers.set("Cache-Control", "public, max-age=300");

    return response;
  } catch (error) {
    console.error("Error fetching farmer:", error);
    return NextResponse.json(
      { error: "Failed to fetch farmer data" },
      { status: 500 },
    );
  }
}
