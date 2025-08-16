import { NextResponse } from "next/server";
import { getMongooseConnection } from "@/lib/mongoose";
import Product from "@/models/Product";

export async function GET() {
  try {
    await getMongooseConnection();

    const products = await Product.find({ status: { $ne: "deleted" } })
      .select("category")
      .lean();
    const counts = new Map();
    for (const p of products) {
      const cat = p.category || "Other";
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }

    const categoryDetails = {
      Vegetables: { icon: "🥕", bgColor: "green", count: 0 },
      Fruits: { icon: "🍎", bgColor: "red", count: 0 },
      Grains: { icon: "🌾", bgColor: "yellow", count: 0 },
      Dairy: { icon: "🥛", bgColor: "blue", count: 0 },
      Honey: { icon: "🍯", bgColor: "orange", count: 0 },
      Herbs: { icon: "🌿", bgColor: "green", count: 0 },
    };

    counts.forEach((count, name) => {
      if (categoryDetails[name]) categoryDetails[name].count = count;
      else
        categoryDetails[name] = {
          icon: "fas fa-shopping-basket",
          bgColor: "gray",
          count,
        };
    });

    const categoriesWithProducts = Object.entries(categoryDetails)
      .filter(([, d]) => d.count > 0)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      categories: categoriesWithProducts,
      totalCategories: categoriesWithProducts.length,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
