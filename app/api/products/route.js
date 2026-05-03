import { getMongooseConnection } from "@/lib/mongoose";
import { enhanceProductsWithRatings } from "@/lib/reviewUtils";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

// Track if indexes have been initialized to avoid repeated calls
let productIndexesInitialized = false; // no longer used but kept for backward compatibility

// Kept for backward compatibility with modules importing this symbol
const responseCache = new Map();

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
  return; // indexing disabled
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse params
    const qp = (k) => searchParams.get(k);
    const search = qp("search");
    const category = qp("category");
    const featured = qp("featured");
    const sortBy = qp("sortBy");
    const farmerEmail = qp("farmerEmail");
    const limit = parseInt(qp("limit")) || 50;
    const page = parseInt(qp("page")) || 1;
    const skip = (page - 1) * limit;
    const minPrice = qp("minPrice") ? parseFloat(qp("minPrice")) : null;
    const maxPrice = qp("maxPrice") ? parseFloat(qp("maxPrice")) : null;
    const minRating = qp("minRating") ? parseFloat(qp("minRating")) : null;
    const dashboard = qp("dashboard");

    // Ensure connection & indexes
    await getMongooseConnection();
    await initializeProductIndexes();

    // Build filter via schema helper for consistency
    const filter = Product.buildFilter({
      search,
      category,
      featured,
      farmerEmail,
      minPrice,
      maxPrice,
      minRating,
      dashboard,
    });

    // Sorting
    let sortOptions = {};
    if (sortBy === "price-low") sortOptions = { price: 1 };
    else if (sortBy === "price-high") sortOptions = { price: -1 };
    else if (sortBy === "rating")
      sortOptions = { averageRating: -1, totalReviews: -1 };
    else if (sortBy === "popular")
      sortOptions = { purchaseCount: -1, averageRating: -1 };
    else if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    else sortOptions = { createdAt: -1 };

    const projection = {}; // removed textScore projection

    const startTime = Date.now();
    const [products, totalCount] = await Promise.all([
      Product.find(filter, projection)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    const queryTime = Date.now() - startTime;

    // Use existing rating enhancement (still uses native driver under the hood)
    const enhancedProducts = await enhanceProductsWithRatings(products);

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
        performance: { queryTime, cached: false },
        timestamp: new Date().toISOString(),
      },
    };

    const response = NextResponse.json(responseData);
    response.headers.set("X-Cache", "BYPASS");
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Generated-At", new Date().toISOString());
    return response;
  } catch (error) {
    console.error("Error fetching products (mongoose):", error);
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
    await getMongooseConnection();
    await initializeProductIndexes();

    const body = await request.json();
    const doc = await Product.create({
      ...body,
      createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
      // status, rating fields default via schema
    });

    return NextResponse.json({ success: true, productId: doc._id });
  } catch (error) {
    console.error("Error creating product (mongoose):", error);
    return NextResponse.json(
      { error: "Failed to create product", message: error.message },
      { status: 500 },
    );
  }
}
