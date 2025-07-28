import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit")) || 20;
    const page = parseInt(searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Try to get products directly from the collection first
    let allProducts = await db.collection("products").find({}).toArray();

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

    let products;
    let totalProducts = allProducts.length;

    if (featured === "true") {
      // For featured products, just take the first 8 (since we don't have purchase data yet)
      products = allProducts.slice(0, 8);
      totalProducts = products.length;
    } else {
      // Apply pagination
      products = allProducts.slice(skip, skip + limit);
    }

    // Add missing fields with defaults
    products = products.map((product) => ({
      ...product,
      images: product.images || [
        `https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop`,
      ],
      farmer: product.farmer || {
        name: "Local Farmer",
        location: "Bangladesh",
      },
      stock: product.stock || 50,
      averageRating: product.averageRating || 4.5,
      totalReviews: product.totalReviews || 0,
      isOrganic: product.isOrganic || false,
      isFresh: product.isFresh || true,
    }));

    return NextResponse.json({
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      hasNextPage: page < Math.ceil(totalProducts / limit),
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", details: error.message },
      { status: 500 },
    );
  }
}
