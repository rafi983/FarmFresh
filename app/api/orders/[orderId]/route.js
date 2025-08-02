import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Cache to track if indexes have been initialized
let orderDetailIndexesInitialized = false;

// Initialize indexes for better performance on single order operations (only once)
async function initializeOrderDetailIndexes(db) {
  // Skip if already initialized in this session
  if (orderDetailIndexesInitialized) return;

  try {
    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");

    // Check existing indexes first to avoid conflicts
    const existingOrderIndexes = await ordersCollection.listIndexes().toArray();
    const orderIndexNames = existingOrderIndexes.map((idx) => idx.name);

    // Orders collection indexes for efficient lookups - only create if they don't exist
    if (!orderIndexNames.some((name) => name.includes("status_1_createdAt"))) {
      await ordersCollection.createIndex(
        { status: 1, createdAt: -1 },
        { name: "orders_status_date_idx", background: true },
      );
    }

    if (!orderIndexNames.some((name) => name.includes("items.productId"))) {
      await ordersCollection.createIndex(
        { "items.productId": 1 },
        { name: "orders_items_product_idx", background: true },
      );
    }

    if (
      !orderIndexNames.some(
        (name) => name.includes("userId_1") && !name.includes("items"),
      )
    ) {
      await ordersCollection.createIndex(
        { userId: 1 },
        { name: "orders_user_idx", background: true },
      );
    }

    // Products collection indexes for stock operations
    const existingProductIndexes = await productsCollection
      .listIndexes()
      .toArray();
    const productIndexNames = existingProductIndexes.map((idx) => idx.name);

    if (
      !productIndexNames.some(
        (name) => name.includes("stock_1") && !name.includes("_id"),
      )
    ) {
      await productsCollection.createIndex(
        { stock: 1 },
        { name: "products_stock_idx", background: true },
      );
    }

    orderDetailIndexesInitialized = true;
    console.log("Order detail indexes initialized successfully");
  } catch (error) {
    console.log("Index initialization note:", error.message);
    // Don't throw error, just log it - indexes might already exist
  }
}

export async function GET(request, { params }) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes once per application lifecycle
    await initializeOrderDetailIndexes(db);

    // Use aggregation pipeline for optimized order retrieval
    const orderPipeline = [
      { $match: { _id: new ObjectId(orderId) } },
      {
        $addFields: {
          // Ensure statusHistory is always an array
          statusHistory: {
            $cond: {
              if: { $isArray: "$statusHistory" },
              then: "$statusHistory",
              else: [],
            },
          },
        },
      },
      { $limit: 1 },
    ];

    const [order] = await db
      .collection("orders")
      .aggregate(orderPipeline)
      .toArray();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Failed to get order", details: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { orderId } = params;
    const updateData = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes once per application lifecycle
    await initializeOrderDetailIndexes(db);

    // Use aggregation pipeline to get order info and check cancellation status
    const orderInfoPipeline = [
      { $match: { _id: new ObjectId(orderId) } },
      {
        $project: {
          _id: 1,
          status: 1,
          items: 1,
          statusHistory: 1,
        },
      },
      { $limit: 1 },
    ];

    const [existingOrder] = await db
      .collection("orders")
      .aggregate(orderInfoPipeline)
      .toArray();

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order status is being changed to cancelled/returned
    const isBeingCancelled =
      updateData.status &&
      (updateData.status === "cancelled" || updateData.status === "returned") &&
      existingOrder.status !== "cancelled" &&
      existingOrder.status !== "returned";

    // If order is being cancelled, restore stock using bulk operations
    if (isBeingCancelled && existingOrder.items) {
      const stockRestoreOperations = existingOrder.items.map((item) => ({
        updateOne: {
          filter: { _id: new ObjectId(item.productId) },
          update: {
            $inc: { stock: item.quantity },
            $set: { updatedAt: new Date() },
          },
        },
      }));

      if (stockRestoreOperations.length > 0) {
        await db.collection("products").bulkWrite(stockRestoreOperations);
      }
    }

    // Prepare the update operation with optimized status history handling
    const updateOperation = {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
    };

    // Handle statusHistory efficiently
    if (updateData.statusHistory) {
      // Use $push to add to statusHistory array, initializing if needed
      updateOperation.$push = {
        statusHistory: updateData.statusHistory,
      };

      // Remove statusHistory from $set to avoid conflicts
      delete updateOperation.$set.statusHistory;

      // If statusHistory doesn't exist or isn't an array, initialize it first
      if (!Array.isArray(existingOrder.statusHistory)) {
        await db
          .collection("orders")
          .updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { statusHistory: [] } },
          );
      }
    }

    // Perform the optimized update
    const result = await db
      .collection("orders")
      .updateOne({ _id: new ObjectId(orderId) }, updateOperation);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Order not found during update" },
        { status: 404 },
      );
    }

    // Clear cache in main orders route to ensure fresh data
    try {
      // Import the cache clearing function from main orders route
      const ordersModule = await import("../route.js");
      if (ordersModule.clearOrdersCache) {
        ordersModule.clearOrdersCache();
      }
    } catch (error) {
      console.log("Could not clear orders cache:", error.message);
    }

    // Use aggregation to get the updated order with proper field formatting
    const updatedOrderPipeline = [
      { $match: { _id: new ObjectId(orderId) } },
      {
        $addFields: {
          statusHistory: {
            $cond: {
              if: { $isArray: "$statusHistory" },
              then: "$statusHistory",
              else: [],
            },
          },
        },
      },
      { $limit: 1 },
    ];

    const [updatedOrder] = await db
      .collection("orders")
      .aggregate(updatedOrderPipeline)
      .toArray();

    return NextResponse.json({
      message: "Order updated successfully",
      order: updatedOrder,
      stockRestored: isBeingCancelled,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Failed to update order", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes once per application lifecycle
    await initializeOrderDetailIndexes(db);

    // Use aggregation pipeline to check deletion eligibility
    const deletionCheckPipeline = [
      { $match: { _id: new ObjectId(orderId) } },
      {
        $addFields: {
          canDelete: {
            $or: [
              { $eq: ["$status", "cancelled"] },
              {
                $and: [
                  { $eq: ["$status", "pending"] },
                  {
                    $lt: [
                      { $subtract: [new Date(), "$createdAt"] },
                      300000, // 5 minutes in milliseconds
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          status: 1,
          canDelete: 1,
          createdAt: 1,
        },
      },
      { $limit: 1 },
    ];

    const [orderCheck] = await db
      .collection("orders")
      .aggregate(deletionCheckPipeline)
      .toArray();

    if (!orderCheck) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!orderCheck.canDelete) {
      return NextResponse.json(
        {
          error:
            "Order cannot be deleted. Only cancelled orders or recent pending orders can be deleted.",
        },
        { status: 400 },
      );
    }

    const result = await db.collection("orders").deleteOne({
      _id: new ObjectId(orderId),
    });

    return NextResponse.json({
      message: "Order deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json(
      { error: "Failed to delete order", details: error.message },
      { status: 500 },
    );
  }
}
