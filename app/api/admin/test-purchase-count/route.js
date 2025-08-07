import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const quantity = parseInt(searchParams.get("quantity")) || 1;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    console.log(
      `🔬 GET Testing purchase count update for product: ${productId}, quantity: ${quantity}`,
    );

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Step 1: Get the current product
    const currentProduct = await db
      .collection("products")
      .findOne({ _id: new ObjectId(productId) });

    if (!currentProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log(`📊 Current product data:`, {
      name: currentProduct.name,
      currentPurchaseCount: currentProduct.purchaseCount || 0,
      stock: currentProduct.stock || 0,
    });

    // Step 2: Update purchase count
    const updateResult = await db.collection("products").updateOne(
      { _id: new ObjectId(productId) },
      {
        $inc: { purchaseCount: quantity },
        $set: { updatedAt: new Date() },
      },
    );

    console.log(`🔄 Update result:`, updateResult);

    // Step 3: Get updated product
    const updatedProduct = await db
      .collection("products")
      .findOne({ _id: new ObjectId(productId) });

    console.log(`✅ Updated product data:`, {
      name: updatedProduct.name,
      newPurchaseCount: updatedProduct.purchaseCount || 0,
      stock: updatedProduct.stock || 0,
    });

    // Step 4: Clear products cache using enhanced clearing
    try {
      const { clearAllProductsCaches } = await import(
        "@/app/api/products/route"
      );
      clearAllProductsCaches();
      console.log("🧹 Enhanced products cache clearing completed");
    } catch (error) {
      console.log("⚠️ Could not clear products cache:", error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Purchase count test completed via GET",
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
      instructions: "Now refresh the products page to see if the count updated",
    });
  } catch (error) {
    console.error("❌ Test purchase count error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

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
      `🔬 Testing purchase count update for product: ${productId}, quantity: ${quantity}`,
    );

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Step 1: Get the current product
    const currentProduct = await db
      .collection("products")
      .findOne({ _id: new ObjectId(productId) });

    if (!currentProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log(`📊 Current product data:`, {
      name: currentProduct.name,
      currentPurchaseCount: currentProduct.purchaseCount || 0,
      stock: currentProduct.stock || 0,
    });

    // Step 2: Update purchase count
    const updateResult = await db.collection("products").updateOne(
      { _id: new ObjectId(productId) },
      {
        $inc: { purchaseCount: quantity },
        $set: { updatedAt: new Date() },
      },
    );

    console.log(`🔄 Update result:`, updateResult);

    // Step 3: Get updated product
    const updatedProduct = await db
      .collection("products")
      .findOne({ _id: new ObjectId(productId) });

    console.log(`✅ Updated product data:`, {
      name: updatedProduct.name,
      newPurchaseCount: updatedProduct.purchaseCount || 0,
      stock: updatedProduct.stock || 0,
    });

    // Step 4: Clear products cache using enhanced clearing
    try {
      const { clearAllProductsCaches } = await import(
        "@/app/api/products/route"
      );
      clearAllProductsCaches();
      console.log("🧹 Enhanced products cache clearing completed");
    } catch (error) {
      console.log("⚠️ Could not clear products cache:", error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Purchase count test completed",
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
    });
  } catch (error) {
    console.error("❌ Test purchase count error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
