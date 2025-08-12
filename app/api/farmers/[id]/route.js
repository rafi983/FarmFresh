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
  // First, try to find farmer by string ID (for hardcoded farmers like "farmer_001")
  // This should find the individual farmer documents we created for hardcoded farmers
  let farmer = await farmersCollection.findOne({
    _id: id,
    farmers: { $exists: false }, // Ensure it's an individual document, not nested
  });

  if (farmer) {
    console.log(`Found individual farmer document for ID: ${id}`);
    return farmer;
  }

  // Second, try to find farmer by ObjectId (for new farmers) - uses primary index
  if (ObjectId.isValid(id)) {
    farmer = await farmersCollection.findOne({
      _id: new ObjectId(id),
      farmers: { $exists: false }, // Ensure it's an individual document, not nested
    });
    if (farmer) {
      console.log(`Found farmer by ObjectId: ${id}`);
      return farmer;
    }
  }

  // Fallback: Search in the farmers array (for legacy hardcoded farmers) - uses nested_farmers_id_idx
  console.log(`Falling back to nested structure for ID: ${id}`);
  const farmersDoc = await farmersCollection.findOne(
    { "farmers._id": id },
    { projection: { farmers: { $elemMatch: { _id: id } } } }, // Project only matching farmer
  );

  if (farmersDoc?.farmers?.[0]) {
    const farmer = farmersDoc.farmers[0];
    farmer._id = id; // Ensure consistent _id field
    console.log(`Found farmer in nested structure: ${farmer.name}`);
    return farmer;
  }

  console.log(`No farmer found for ID: ${id}`);
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
        // Get all products for the farmer (excluding large base64 images)
        products: [
          {
            $project: {
              _id: 1,
              name: 1,
              price: 1,
              stock: 1,
              category: 1,
              // Only include image count and first image thumbnail if needed
              imageCount: { $size: { $ifNull: ["$images", []] } },
              // Optionally include a small preview or just the first few characters
              hasImages: { $gt: [{ $size: { $ifNull: ["$images", []] } }, 0] },
              description: 1,
              farmer: 1,
              farmerId: 1,
              farmerEmail: 1,
              averageRating: 1,
              reviews: 1, // Add reviews field to include review data
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

  // If images are needed for the response, fetch them separately for a limited number of products
  // This prevents the aggregation from failing due to size limits
  if (products.length > 0) {
    // Optionally fetch images for the first few products or implement pagination
    const productIds = products.slice(0, 10).map((p) => p._id); // Limit to first 10 products

    const productsWithImages = await productsCollection
      .find(
        { _id: { $in: productIds } },
        {
          projection: {
            _id: 1,
            images: { $slice: ["$images", 1] }, // Only get the first image to reduce size
          },
        },
      )
      .toArray();

    // Merge the image data back into the products
    const imageMap = new Map(
      productsWithImages.map((p) => [p._id.toString(), p.images]),
    );
    products.forEach((product) => {
      const images = imageMap.get(product._id.toString());
      if (images && images.length > 0) {
        product.images = images;
      } else {
        product.images = [];
      }
    });
  }

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

// Add PUT handler to update a specific farmer by ID
export async function PUT(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Invalid farmer ID" }, { status: 400 });
    }

    console.log(`Updating farmer with ID: ${id}`);

    // Parse the updated farmer data from the request body
    const updatedFarmerData = await request.json();
    console.log(
      "Received farmer update data:",
      JSON.stringify(updatedFarmerData, null, 2),
    );

    // Reuse database connections
    if (!cachedDb) {
      const client = await clientPromise;
      cachedDb = client.db("farmfresh");
      cachedFarmersCollection = cachedDb.collection("farmers");
      cachedProductsCollection = cachedDb.collection("products");

      // Initialize optimized indexes
      await initializeFarmerIndexes(cachedDb);
    }

    // First, try to update the farmer by ObjectId (for MongoDB farmers)
    if (ObjectId.isValid(id)) {
      // Remove _id from the update data if present to avoid MongoDB errors
      const { _id, ...updateData } = updatedFarmerData;

      // Always update the updatedAt timestamp
      updateData.updatedAt = new Date();

      console.log("Original update data:", JSON.stringify(updateData, null, 2));

      // Create a clean update object for MongoDB
      // IMPORTANT: For MongoDB dot notation to work correctly, we need to start with a fresh object
      const updateObj = {};

      // Handle top-level fields
      if (updateData.name) updateObj.name = updateData.name;
      if (updateData.phone) updateObj.phone = updateData.phone;
      if (updateData.location) updateObj.location = updateData.location;
      if (updateData.email) updateObj.email = updateData.email;
      if (updateData.bio) updateObj.bio = updateData.bio;

      // IMPORTANT: For nested objects like address, we must update the entire object at once
      // Do NOT use dot notation for these objects, as it will overwrite only specific fields
      if (updateData.address) {
        console.log(
          "Updating entire address object:",
          JSON.stringify(updateData.address),
        );
        updateObj.address = updateData.address;
      }

      // For farmInfo, also update the entire object to ensure all fields are saved
      if (updateData.farmInfo) {
        console.log(
          "Updating entire farmInfo object:",
          JSON.stringify(updateData.farmInfo),
        );
        updateObj.farmInfo = updateData.farmInfo;
      }

      // For businessInfo and preferences, update entire objects
      if (updateData.businessInfo)
        updateObj.businessInfo = updateData.businessInfo;
      if (updateData.preferences)
        updateObj.preferences = updateData.preferences;

      // Handle top-level farmSize directly (some schemas have it at root level)
      if (updateData.farmSize !== undefined) {
        updateObj.farmSize = updateData.farmSize;
        console.log("Updating root farmSize to:", updateData.farmSize);
      }

      // Handle farmSizeUnit directly (some schemas have it at root level)
      if (updateData.farmSizeUnit !== undefined) {
        updateObj.farmSizeUnit = updateData.farmSizeUnit;
      }

      // Handle specializations array
      if (updateData.specializations) {
        updateObj.specializations = updateData.specializations;
      }

      // Always update timestamp
      updateObj.updatedAt = new Date();

      console.log("Final update object keys:", Object.keys(updateObj));
      console.log(
        "Final update object content:",
        JSON.stringify(updateObj, null, 2),
      );

      // Now perform the update with our carefully constructed object
      // IMPORTANT: For MongoDB to correctly update nested objects, use $set with the entire object
      // This ensures the update is atomic and replaces entire objects instead of patching fields
      const updateResult = await cachedFarmersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateObj },
        { returnDocument: "after" },
      );

      // If found and updated
      if (updateResult) {
        // Clear any caches
        responseCache.clear();

        console.log("Farmer updated successfully:", updateResult.name);

        // Return the updated farmer
        return NextResponse.json({
          success: true,
          farmer: updateResult,
          message: "Farmer updated successfully",
        });
      } else {
        console.log("No document found to update with ID:", id);
      }
    }

    // For hardcoded farmers in the farmers array (legacy support)
    // Use the arrayFilters to update a specific element in the farmers array
    const result = await cachedFarmersCollection.findOneAndUpdate(
      { "farmers._id": id },
      {
        $set: {
          "farmers.$[elem].name": updatedFarmerData.name,
          "farmers.$[elem].phone": updatedFarmerData.phone,
          "farmers.$[elem].location": updatedFarmerData.location,
          "farmers.$[elem].description": updatedFarmerData.description,
          "farmers.$[elem].farmSize": updatedFarmerData.farmSize,
          "farmers.$[elem].farmSizeUnit": updatedFarmerData.farmSizeUnit,
          "farmers.$[elem].specializations": updatedFarmerData.specializations,
          "farmers.$[elem].farmingMethods": updatedFarmerData.farmingMethods,
          "farmers.$[elem].address": updatedFarmerData.address,
          "farmers.$[elem].farmInfo": updatedFarmerData.farmInfo,
          "farmers.$[elem].lastUpdated": new Date(),
        },
      },
      {
        arrayFilters: [{ "elem._id": id }],
        returnDocument: "after",
      },
    );

    if (result) {
      // Get the updated farmer from the array
      const updatedFarmer = result.farmers?.find((f) => f._id === id);

      if (updatedFarmer) {
        // Clear any caches
        responseCache.clear();

        // Update related products with the new farmer name for consistency
        if (updatedFarmerData.name) {
          await cachedProductsCollection.updateMany(
            {
              $or: [
                { farmerId: id },
                { "farmer._id": id },
                { "farmer.id": id },
              ],
            },
            {
              $set: {
                "farmer.name": updatedFarmerData.name,
                lastUpdated: new Date(),
              },
            },
          );
        }

        return NextResponse.json({
          success: true,
          farmer: updatedFarmer,
          message: "Farmer updated successfully",
        });
      }
    }

    // If we reach here, no farmer was found with the given ID
    return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
  } catch (error) {
    console.error("Error updating farmer:", error);
    return NextResponse.json(
      { error: "Failed to update farmer", details: error.message },
      { status: 500 },
    );
  }
}
