import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getToken } from "next-auth/jwt";

// Cache to track if indexes have been initialized
let cartIndexesInitialized = false;

// Initialize indexes for better performance on cart operations (only once)
async function initializeCartIndexes(db) {
  // Skip if already initialized in this session
  if (cartIndexesInitialized) return;

  try {
    const cartsCollection = db.collection("carts");
    const productsCollection = db.collection("products");

    // Check existing indexes first to avoid conflicts
    const existingCartIndexes = await cartsCollection.listIndexes().toArray();
    const cartIndexNames = existingCartIndexes.map((idx) => idx.name);

    // Carts collection indexes for efficient lookups - only create if they don't exist
    if (
      !cartIndexNames.some(
        (name) => name.includes("userId_1") && !name.includes("updatedAt"),
      )
    ) {
      await cartsCollection.createIndex(
        { userId: 1 },
        { name: "carts_user_idx", background: true, unique: true },
      );
    }

    if (!cartIndexNames.some((name) => name.includes("userId_1_updatedAt"))) {
      await cartsCollection.createIndex(
        { userId: 1, updatedAt: -1 },
        { name: "carts_user_updated_idx", background: true },
      );
    }

    if (!cartIndexNames.some((name) => name.includes("items.productId"))) {
      await cartsCollection.createIndex(
        { "items.productId": 1 },
        { name: "carts_items_product_idx", background: true },
      );
    }

    // Products collection indexes for cart item validation
    const existingProductIndexes = await productsCollection
      .listIndexes()
      .toArray();
    const productIndexNames = existingProductIndexes.map((idx) => idx.name);

    if (!productIndexNames.some((name) => name.includes("stock_1_status"))) {
      await productsCollection.createIndex(
        { stock: 1, status: 1 },
        { name: "products_stock_status_idx", background: true },
      );
    }

    cartIndexesInitialized = true;
    console.log("Cart indexes initialized successfully");
  } catch (error) {
    console.log("Index initialization note:", error.message);
    // Don't throw error, just log it - indexes might already exist
  }
}

export async function GET(request) {
  try {
    // Use NextAuth's getToken to properly decode the session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes once per application lifecycle
    await initializeCartIndexes(db);

    // Use aggregation pipeline to get cart with enhanced data
    const cartPipeline = [
      { $match: { userId: token.sub } },
      {
        $addFields: {
          itemCount: { $size: { $ifNull: ["$items", []] } },
          totalItems: {
            $sum: {
              $map: {
                input: { $ifNull: ["$items", []] },
                as: "item",
                in: { $toInt: { $ifNull: ["$$item.quantity", 0] } },
              },
            },
          },
        },
      },
      { $limit: 1 },
    ];

    const [cart] = await db
      .collection("carts")
      .aggregate(cartPipeline)
      .toArray();

    return NextResponse.json({
      items: cart?.items || [],
      total: cart?.total || 0,
      itemCount: cart?.itemCount || 0,
      totalItems: cart?.totalItems || 0,
    });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    // Use NextAuth's getToken to properly decode the session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes once per application lifecycle
    await initializeCartIndexes(db);

    // Validate items and calculate total using aggregation
    const productIds = items
      .map((item) => {
        try {
          return new ObjectId(item.productId);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Get product information for validation
    const productValidationPipeline = [
      { $match: { _id: { $in: productIds }, status: { $ne: "deleted" } } },
      {
        $project: {
          _id: 1,
          stock: 1,
          price: 1,
          name: 1,
        },
      },
    ];

    const validProducts = await db
      .collection("products")
      .aggregate(productValidationPipeline)
      .toArray();
    const productMap = new Map(validProducts.map((p) => [p._id.toString(), p]));

    // Validate items and calculate total with proper error handling
    const validatedItems = [];
    let total = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        continue; // Skip invalid products
      }

      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const price = parseFloat(item.price) || product.price || 0;

      // Check stock availability
      if (quantity > product.stock) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`,
          },
          { status: 400 },
        );
      }

      validatedItems.push({
        ...item,
        quantity,
        price,
      });

      total += price * quantity;
    }

    // Use optimized upsert operation
    const result = await db.collection("carts").updateOne(
      { userId: token.sub },
      {
        $set: {
          items: validatedItems,
          total: Math.round(total * 100) / 100, // Round to 2 decimal places
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({
      message: "Cart updated successfully",
      items: validatedItems,
      total: Math.round(total * 100) / 100,
      itemCount: validatedItems.length,
    });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    // Use NextAuth's getToken to properly decode the session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes once per application lifecycle
    await initializeCartIndexes(db);

    // Use optimized delete operation with verification
    const result = await db.collection("carts").deleteOne({
      userId: token.sub,
    });

    return NextResponse.json({
      message: "Cart cleared successfully",
      deletedCount: result.deletedCount,
      wasCleared: result.deletedCount > 0,
    });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
