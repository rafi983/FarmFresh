import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { productId, quantity = 1 } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    console.log(
      `🔬 AGGRESSIVE TEST: Updating purchase count for product: ${productId}, quantity: ${quantity}`,
    );

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Step 1: Get current product
    const currentProduct = await db
      .collection("products")
      .findOne({ _id: new ObjectId(productId) });

    if (!currentProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Step 2: Update purchase count
    const updateResult = await db.collection("products").updateOne(
      { _id: new ObjectId(productId) },
      {
        $inc: { purchaseCount: quantity },
        $set: { updatedAt: new Date() },
      },
    );

    // Step 3: Get updated product
    const updatedProduct = await db
      .collection("products")
      .findOne({ _id: new ObjectId(productId) });

    // Step 4: AGGRESSIVE CACHE CLEARING
    console.log("🧹 Starting aggressive cache clearing...");

    // Clear server-side caches
    try {
      // Clear products API cache
      const { responseCache } = await import("@/app/api/products/route");
      if (responseCache) {
        responseCache.clear();
        console.log("✅ Products API response cache cleared");
      }

      // Clear farmers API cache (if products are cached there)
      const { responseCache: farmersCache } = await import(
        "@/app/api/farmers/route"
      );
      if (farmersCache) {
        farmersCache.clear();
        console.log("✅ Farmers API response cache cleared");
      }
    } catch (error) {
      console.log("⚠️ Could not clear API caches:", error.message);
    }

    // Clear global cache
    try {
      const globalCache = (await import("@/lib/cache")).default;
      globalCache.clearPattern("products");
      globalCache.clearPattern("product");
      globalCache.clearPattern("farmers");
      console.log("✅ Global cache patterns cleared");
    } catch (error) {
      console.log("⚠️ Could not clear global cache:", error.message);
    }

    return NextResponse.json({
      success: true,
      message: "AGGRESSIVE purchase count test completed",
      productName: updatedProduct.name,
      before: {
        purchaseCount: currentProduct.purchaseCount || 0,
        stock: currentProduct.stock || 0,
      },
      after: {
        purchaseCount: updatedProduct.purchaseCount || 0,
        stock: updatedProduct.stock || 0,
      },
      updateResult: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
      },
      instructions:
        "IMMEDIATELY open a new browser tab/window and go to products page to see if count updated",
      cacheClearing: "Applied aggressive cache clearing - try new browser tab",
    });
  } catch (error) {
    console.error("❌ Aggressive test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Aggressive test failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
