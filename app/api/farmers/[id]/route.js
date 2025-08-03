import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Invalid farmer ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");
    const farmersCollection = db.collection("farmers");

    let farmer = null;

    // First, try to find farmer by ObjectId (for new farmers)
    if (ObjectId.isValid(id)) {
      farmer = await farmersCollection.findOne({ _id: new ObjectId(id) });
    }

    // If not found, search in the farmers array (for hardcoded farmers)
    if (!farmer) {
      const farmersDoc = await farmersCollection.findOne({
        "farmers._id": id,
      });

      if (farmersDoc && farmersDoc.farmers) {
        farmer = farmersDoc.farmers.find((f) => f._id === id);

        // Add a proper _id field for consistency
        if (farmer) {
          farmer._id = id;
        }
      }
    }

    if (!farmer) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }

    // Calculate farmer's product count and average rating from products collection
    const productsCollection = db.collection("products");

    // First, let's see all products to debug
    const allProducts = await productsCollection.find({}).limit(5).toArray();
    console.log(
      "Sample products from DB:",
      allProducts.map((p) => ({ name: p.name, farmer: p.farmer })),
    );

    const farmerProducts = await productsCollection
      .find({
        $or: [
          { farmerId: id },
          { farmerId: farmer._id },
          { "farmer.id": id },
          { "farmer._id": id },
          { farmerEmail: farmer.email },
          // Add case-insensitive name-based matching for hardcoded farmers
          { "farmer.name": { $regex: new RegExp(`^${farmer.name}$`, "i") } },
          {
            "farmer.farmName": {
              $regex: new RegExp(`^${farmer.farmName}$`, "i"),
            },
          },
        ],
      })
      .toArray();

    console.log(`Searching for farmer: ${farmer.name} (ID: ${id})`);
    console.log(`Farmer farmName: ${farmer.farmName}`);
    console.log(`Found ${farmerProducts.length} products for farmer`);
    console.log("Sample product farmer data:", farmerProducts[0]?.farmer);

    // Calculate statistics
    const totalProducts = farmerProducts.length;
    const activeProducts = farmerProducts.filter(
      (p) => p.stock > 0, // Remove status check since products don't have status field
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
      // Ensure consistent field names for both hardcoded and new farmers
      profilePicture: farmer.profilePicture || farmer.profileImage,
      bio: farmer.bio || farmer.description,
      isCertified: farmer.isCertified || false,
      verified: farmer.verified || farmer.isCertified || false,
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
