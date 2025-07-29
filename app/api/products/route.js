import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { enhanceProductsWithRatings } from "@/lib/reviewUtils";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const sortBy = searchParams.get("sortBy");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit"))
      : null;
    const page = parseInt(searchParams.get("page")) || 1;

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Try to get products directly from the collection first
    let allProducts = await db.collection("products").find({}).toArray();

    console.log(
      `API: Found ${allProducts.length} products directly from collection`,
    );
    console.log(
      "API: Recent products (last 3):",
      allProducts.slice(-3).map((p) => ({
        name: p.name,
        _id: p._id,
        farmerId: p.farmerId,
        createdAt: p.createdAt,
      })),
    );

    // If no direct products found, try the nested structure
    if (allProducts.length === 0) {
      const productDocuments = await db
        .collection("products")
        .find({})
        .toArray();
      productDocuments.forEach((doc) => {
        if (doc.products && Array.isArray(doc.products)) {
          allProducts = allProducts.concat(doc.products);
        }
      });
      console.log(
        `API: After checking nested structure, found ${allProducts.length} products`,
      );
    }

    console.log(`Found ${allProducts.length} products in database`);

    // Apply search filter
    if (search) {
      const searchRegex = new RegExp(search, "i");
      allProducts = allProducts.filter(
        (product) =>
          searchRegex.test(product.name) ||
          searchRegex.test(product.description) ||
          searchRegex.test(product.category),
      );
    }

    // Apply category filter
    if (category && category !== "All Categories") {
      allProducts = allProducts.filter(
        (product) => product.category === category,
      );
    }

    // Apply featured filter
    if (featured === "true") {
      allProducts = allProducts.filter((product) => product.featured);
    }

    // Sort products based on sortBy parameter
    if (sortBy) {
      switch (sortBy) {
        case "purchases":
          allProducts.sort(
            (a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0),
          );
          break;
        case "newest":
          allProducts.sort(
            (a, b) =>
              new Date(b.createdAt || b.dateAdded) -
              new Date(a.createdAt || a.dateAdded),
          );
          break;
        case "price-low":
          allProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case "price-high":
          allProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        case "rating":
          allProducts.sort(
            (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
          );
          break;
        default:
          // Default to newest
          allProducts.sort(
            (a, b) =>
              new Date(b.createdAt || b.dateAdded) -
              new Date(a.createdAt || a.dateAdded),
          );
      }
    }

    // Enhance products with ratings
    allProducts = await enhanceProductsWithRatings(allProducts, db);

    // Apply pagination
    const itemsPerPage = 12;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = limit
      ? Math.min(startIndex + (limit || itemsPerPage), allProducts.length)
      : startIndex + itemsPerPage;

    const paginatedProducts = limit
      ? allProducts.slice(0, limit)
      : allProducts.slice(startIndex, endIndex);

    const totalPages = Math.ceil(allProducts.length / itemsPerPage);

    return NextResponse.json({
      products: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: allProducts.length,
        hasNext: endIndex < allProducts.length,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const productData = await request.json();

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Add timestamps and default values
    const newProduct = {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
      purchaseCount: 0,
      featured: false,
      status: "active",
      stock: productData.stock || 0,
      averageRating: 0,
      totalRatings: 0,
    };

    const result = await db.collection("products").insertOne(newProduct);

    return NextResponse.json({
      success: true,
      productId: result.insertedId,
      product: newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
