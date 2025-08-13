import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerEmail = searchParams.get("farmerEmail");

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Get all products to see the structure
    console.log("=== DEBUG: ALL PRODUCTS ===");
    const allProducts = await db.collection("products").find({}).toArray();

    console.log(`Total products in database: ${allProducts.length}`);

    // Log each product's farmer info
    allProducts.forEach((product, index) => {
      console.log(`Product ${index + 1}:`);
      console.log(`  _id: ${product._id}`);
      console.log(`  name: ${product.name}`);
      console.log(`  farmerId: ${product.farmerId}`);
      console.log(`  farmerEmail: ${product.farmerEmail}`);
      console.log(`  farmer object:`, product.farmer);
      console.log(`  status: ${product.status}`);
      console.log("---");
    });

    // If a specific farmer email is provided, show filtering results
    if (farmerEmail) {
      console.log(`\\n=== DEBUG: FILTERING FOR ${farmerEmail} ===`);

      // Test current filtering logic
      const filteredProducts = await db
        .collection("products")
        .find({
          $and: [
            {
              $or: [
                { farmerEmail: { $eq: farmerEmail } },
                { "farmer.email": { $eq: farmerEmail } },
              ],
            },
          ],
        })
        .toArray();

      console.log(
        `Filtered products for ${farmerEmail}: ${filteredProducts.length}`,
      );
      filteredProducts.forEach((product, index) => {
        console.log(
          `  Filtered ${index + 1}: ${product.name} (${product.farmerEmail || product.farmer?.email})`,
        );
      });

      return NextResponse.json({
        message: "Debug info logged to console",
        totalProducts: allProducts.length,
        filteredProducts: filteredProducts.length,
        farmerEmail,
        products: filteredProducts.map((p) => ({
          _id: p._id,
          name: p.name,
          farmerId: p.farmerId,
          farmerEmail: p.farmerEmail,
          farmerFromObject: p.farmer?.email,
          status: p.status,
        })),
      });
    }

    return NextResponse.json({
      message: "Debug info logged to console",
      totalProducts: allProducts.length,
      products: allProducts.map((p) => ({
        _id: p._id,
        name: p.name,
        farmerId: p.farmerId,
        farmerEmail: p.farmerEmail,
        farmerFromObject: p.farmer?.email,
        status: p.status,
      })),
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Debug failed", message: error.message },
      { status: 500 },
    );
  }
}
