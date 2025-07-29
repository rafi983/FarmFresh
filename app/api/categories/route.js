import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Get all products to calculate category counts
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

    // Count products by category
    const categoryMap = {};
    allProducts.forEach((product) => {
      const category = product.category || "Other";
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    // Define category icons and colors for consistent UI
    const categoryDetails = {
      Vegetables: {
        icon: "fas fa-carrot",
        bgColor: "green",
        count: categoryMap["Vegetables"] || 0,
      },
      Fruits: {
        icon: "fas fa-apple-alt",
        bgColor: "red",
        count: categoryMap["Fruits"] || 0,
      },
      Grains: {
        icon: "fas fa-seedling",
        bgColor: "yellow",
        count: categoryMap["Grains"] || 0,
      },
      Dairy: {
        icon: "fas fa-cheese",
        bgColor: "blue",
        count: categoryMap["Dairy"] || 0,
      },
      Honey: {
        icon: "fas fa-jar",
        bgColor: "purple",
        count: categoryMap["Honey"] || 0,
      },
      Herbs: {
        icon: "fas fa-leaf",
        bgColor: "orange",
        count: categoryMap["Herbs"] || 0,
      },
    };

    // Add any additional categories found in products
    Object.keys(categoryMap).forEach((category) => {
      if (!categoryDetails[category]) {
        categoryDetails[category] = {
          icon: "fas fa-shopping-basket",
          bgColor: "gray",
          count: categoryMap[category],
        };
      }
    });

    // Filter out categories with 0 products
    const categoriesWithProducts = Object.entries(categoryDetails)
      .filter(([_, details]) => details.count > 0)
      .map(([name, details]) => ({
        name,
        ...details,
      }));

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
