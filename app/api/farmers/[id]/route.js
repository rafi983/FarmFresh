import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid farmer ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");
    const farmersCollection = db.collection("farmers");

    // Find the farmer by ID
    const farmer = await farmersCollection.findOne({ _id: new ObjectId(id) });

    if (!farmer) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }

    // Calculate farmer's product count and average rating from products collection
    const productsCollection = db.collection("products");
    const farmerProducts = await productsCollection
      .find({
        $or: [
          { farmerId: id },
          { farmerId: farmer._id },
          { "farmer.id": id },
          { "farmer._id": new ObjectId(id) },
          { farmerEmail: farmer.email },
        ],
      })
      .toArray();

    // Calculate statistics
    const totalProducts = farmerProducts.length;
    const activeProducts = farmerProducts.filter(
      (p) => p.status === "active" && p.stock > 0,
    ).length;
    const averageRating =
      farmerProducts.length > 0
        ? farmerProducts.reduce((sum, p) => sum + (p.averageRating || 0), 0) /
          farmerProducts.length
        : 0;
    const totalSales = farmerProducts.reduce(
      (sum, p) => sum + (p.purchaseCount || 0),
      0,
    );

    // Enhance farmer data with calculated statistics
    const enhancedFarmer = {
      ...farmer,
      stats: {
        totalProducts,
        activeProducts,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalSales,
      },
      products: farmerProducts,
    };

    return NextResponse.json({
      success: true,
      farmer: enhancedFarmer,
    });
  } catch (error) {
    console.error("Error fetching farmer:", error);
    return NextResponse.json(
      { error: "Failed to fetch farmer data" },
      { status: 500 },
    );
  }
}
