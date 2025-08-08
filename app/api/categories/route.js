import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Cache to track if indexes have been initialized
let categoryIndexesInitialized = false;

// Initialize indexes for better performance on category operations (only once)
async function initializeCategoryIndexes(db) {
  // Skip if already initialized in this session
  if (categoryIndexesInitialized) return;

  try {
    const productsCollection = db.collection("products");

    // Check existing indexes first to avoid conflicts
    const existingProductIndexes = await productsCollection
      .listIndexes()
      .toArray();
    const productIndexNames = existingProductIndexes.map((idx) => idx.name);

    // Products collection indexes for category aggregation - only create if they don't exist
    if (!productIndexNames.some((name) => name.includes("category_1_status"))) {
      await productsCollection.createIndex(
        { category: 1, status: 1 },
        { name: "products_category_status_idx", background: true },
      );
    }

    if (
      !productIndexNames.some(
        (name) => name.includes("category_1") && !name.includes("status"),
      )
    ) {
      await productsCollection.createIndex(
        { category: 1 },
        { name: "products_category_idx", background: true },
      );
    }

    if (
      !productIndexNames.some(
        (name) => name.includes("status_1") && !name.includes("category"),
      )
    ) {
      await productsCollection.createIndex(
        { status: 1 },
        { name: "products_status_only_idx", background: true },
      );
    }

    // For nested structure support
    if (!productIndexNames.some((name) => name.includes("products.category"))) {
      await productsCollection.createIndex(
        { "products.category": 1 },
        { name: "products_nested_category_idx", background: true },
      );
    }

    categoryIndexesInitialized = true;
    console.log("Category indexes initialized successfully");
  } catch (error) {
    console.log("Index initialization note:", error.message);
    // Don't throw error, just log it - indexes might already exist
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes once per application lifecycle
    await initializeCategoryIndexes(db);

    // Use aggregation pipeline to count categories efficiently
    const categoryPipeline = [
      {
        $match: {
          status: { $ne: "deleted" }, // Only count active products
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$category", "Other"] },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
    ];

    let categoryResults = await db
      .collection("products")
      .aggregate(categoryPipeline)
      .toArray();

    // Fallback: Handle nested structure if no direct results
    if (categoryResults.length === 0) {
      const nestedCategoryPipeline = [
        { $match: { products: { $exists: true, $ne: [] } } },
        { $unwind: "$products" },
        {
          $match: {
            "products.status": { $ne: "deleted" },
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$products.category", "Other"] },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            count: 1,
          },
        },
      ];

      categoryResults = await db
        .collection("products")
        .aggregate(nestedCategoryPipeline)
        .toArray();
    }

    // Define category icons and colors for consistent UI
    const categoryDetails = {
      Vegetables: {
        icon: "🥕",
        bgColor: "green",
        count: 0,
      },
      Fruits: {
        icon: "🍎",
        bgColor: "red",
        count: 0,
      },
      Grains: {
        icon: "🌾",
        bgColor: "yellow",
        count: 0,
      },
      Dairy: {
        icon: "🥛",
        bgColor: "blue",
        count: 0,
      },
      Honey: {
        icon: "🍯",
        bgColor: "orange",
        count: 0,
      },
      Herbs: {
        icon: "🌿",
        bgColor: "green",
        count: 0,
      },
    };

    // Map aggregation results to category details
    categoryResults.forEach((result) => {
      const categoryName = result.category;
      if (categoryDetails[categoryName]) {
        categoryDetails[categoryName].count = result.count;
      } else {
        // Add dynamic categories found in products
        categoryDetails[categoryName] = {
          icon: "fas fa-shopping-basket",
          bgColor: "gray",
          count: result.count,
        };
      }
    });

    // Filter out categories with 0 products and format response
    const categoriesWithProducts = Object.entries(categoryDetails)
      .filter(([_, details]) => details.count > 0)
      .map(([name, details]) => ({
        name,
        ...details,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    return NextResponse.json({
      success: true,
      categories: categoriesWithProducts,
      totalCategories: categoriesWithProducts.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
