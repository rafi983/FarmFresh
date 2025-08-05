import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Cache to track if indexes have been initialized
let favoritesIndexesInitialized = false;

// Initialize indexes for better performance on favorites operations (only once)
async function initializeFavoritesIndexes(db) {
  // Skip if already initialized in this session
  if (favoritesIndexesInitialized) return;

  try {
    const favoritesCollection = db.collection("favorites");
    const productsCollection = db.collection("products");

    // Check existing indexes first to avoid conflicts
    const existingFavoritesIndexes = await favoritesCollection
      .listIndexes()
      .toArray();
    const favoritesIndexNames = existingFavoritesIndexes.map((idx) => idx.name);

    // Favorites collection indexes for efficient lookups - only create if they don't exist
    if (
      !favoritesIndexNames.some((name) => name.includes("userId_1_productId"))
    ) {
      await favoritesCollection.createIndex(
        { userId: 1, productId: 1 },
        { name: "favorites_user_product_idx", background: true, unique: true },
      );
    }

    if (
      !favoritesIndexNames.some((name) => name.includes("userId_1_createdAt"))
    ) {
      await favoritesCollection.createIndex(
        { userId: 1, createdAt: -1 },
        { name: "favorites_user_date_idx", background: true },
      );
    }

    if (
      !favoritesIndexNames.some(
        (name) => name.includes("productId_1") && !name.includes("userId"),
      )
    ) {
      await favoritesCollection.createIndex(
        { productId: 1 },
        { name: "favorites_product_idx", background: true },
      );
    }

    // Products collection indexes for population
    const existingProductIndexes = await productsCollection
      .listIndexes()
      .toArray();
    const productIndexNames = existingProductIndexes.map((idx) => idx.name);

    if (
      !productIndexNames.some(
        (name) => name.includes("status_1") && !name.includes("_id"),
      )
    ) {
      await productsCollection.createIndex(
        { status: 1 },
        { name: "products_status_idx", background: true },
      );
    }

    favoritesIndexesInitialized = true;
    console.log("Favorites indexes initialized successfully");
  } catch (error) {
    console.log("Index initialization note:", error.message);
    // Don't throw error, just log it - indexes might already exist
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const productId = searchParams.get("productId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes once per application lifecycle
    await initializeFavoritesIndexes(db);

    if (productId) {
      // Check if specific product is favorited using optimized query
      const favoritePipeline = [
        {
          $match: {
            userId: userId,
            productId: productId,
          },
        },
        { $limit: 1 },
        {
          $project: {
            _id: 1,
          },
        },
      ];

      const [favorite] = await db
        .collection("favorites")
        .aggregate(favoritePipeline)
        .toArray();

      return NextResponse.json({ isFavorite: !!favorite });
    } else {
      // Get all favorites for user with populated product details using aggregation
      const favoritesPipeline = [
        {
          $match: { userId: userId },
        },
        {
          $lookup: {
            from: "products",
            let: { productId: { $toObjectId: "$productId" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$productId"] },
                  status: { $ne: "deleted" }, // Only include active products
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  price: 1,
                  image: 1,
                  images: 1,
                  category: 1,
                  stock: 1,
                  farmer: 1,
                  averageRating: 1,
                  reviewCount: 1,
                  totalRatings: 1,
                  reviews: 1,
                  isOrganic: 1,
                  isFresh: 1,
                  unit: 1,
                },
              },
            ],
            as: "product",
          },
        },
        {
          $unwind: {
            path: "$product",
            preserveNullAndEmptyArrays: false, // Only keep favorites with valid products
          },
        },
        {
          $addFields: {
            "product.images": {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$product.images", null] },
                    { $isArray: "$product.images" },
                    { $gt: [{ $size: "$product.images" }, 0] },
                  ],
                },
                then: "$product.images",
                else: {
                  $cond: {
                    if: { $ne: ["$product.image", null] },
                    then: ["$product.image"],
                    else: ["/placeholder-image.jpg"],
                  },
                },
              },
            },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ];

      const favorites = await db
        .collection("favorites")
        .aggregate(favoritesPipeline)
        .toArray();

      return NextResponse.json({
        favorites,
        total: favorites.length,
      });
    }
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { productId, userId } = await request.json();

    if (!productId || !userId) {
      return NextResponse.json(
        { error: "Product ID and user ID are required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes for optimal performance
    await initializeFavoritesIndexes(db);

    // Use upsert operation to handle duplicates efficiently
    const result = await db.collection("favorites").updateOne(
      { userId, productId },
      {
        $setOnInsert: {
          userId,
          productId,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    if (result.upsertedCount === 0 && result.matchedCount > 0) {
      return NextResponse.json(
        { error: "Product already in favorites" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product added to favorites",
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { productId, userId } = await request.json();

    if (!productId || !userId) {
      return NextResponse.json(
        { error: "Product ID and user ID are required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes for optimal performance
    await initializeFavoritesIndexes(db);

    const result = await db.collection("favorites").deleteOne({
      userId,
      productId,
    });

    return NextResponse.json({
      success: true,
      removed: result.deletedCount > 0,
      message:
        result.deletedCount > 0
          ? "Product removed from favorites"
          : "Product was not in favorites",
    });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 },
    );
  }
}
