import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

    const order = await db.collection("orders").findOne({
      _id: new ObjectId(orderId),
    });

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

    console.log("Updating order:", orderId, "with data:", updateData);

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(orderId)) {
      console.error("Invalid ObjectId format:", orderId);
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Check if order exists first
    const existingOrder = await db.collection("orders").findOne({
      _id: new ObjectId(orderId),
    });

    if (!existingOrder) {
      console.error("Order not found:", orderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("Existing order found, proceeding with update...");

    // Check the current statusHistory structure
    const currentStatusHistory = existingOrder.statusHistory;
    console.log("Current statusHistory type:", typeof currentStatusHistory);
    console.log(
      "Current statusHistory is array:",
      Array.isArray(currentStatusHistory),
    );

    // Prepare the update operation
    const updateOperation = {
      $set: {
        ...updateData,
        updatedAt: new Date().toISOString(),
      },
    };

    // Handle statusHistory properly based on current state
    if (updateData.statusHistory) {
      if (Array.isArray(currentStatusHistory)) {
        // statusHistory is already an array, use $push
        updateOperation.$push = {
          statusHistory: updateData.statusHistory,
        };
      } else {
        // statusHistory doesn't exist or is not an array, initialize/replace it
        updateOperation.$set.statusHistory =
          currentStatusHistory && Array.isArray(currentStatusHistory)
            ? [...currentStatusHistory, updateData.statusHistory]
            : [updateData.statusHistory];
      }

      // Remove statusHistory from $set if we're using $push
      if (updateOperation.$push) {
        delete updateOperation.$set.statusHistory;
      }
    }

    console.log("Update operation:", JSON.stringify(updateOperation, null, 2));

    // Perform the update
    const result = await db
      .collection("orders")
      .updateOne({ _id: new ObjectId(orderId) }, updateOperation);

    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Order not found during update" },
        { status: 404 },
      );
    }

    if (result.modifiedCount === 0) {
      console.warn("Order found but not modified - possibly same data");
    }

    // Fetch the updated order to return the complete data
    const updatedOrder = await db.collection("orders").findOne({
      _id: new ObjectId(orderId),
    });

    console.log("Order updated successfully:", orderId);

    return NextResponse.json({
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order error:", error);
    console.error("Error stack:", error.stack);
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

    // Check if order exists and can be deleted
    const order = await db.collection("orders").findOne({
      _id: new ObjectId(orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow deletion of cancelled orders or very recent pending orders
    const canDelete =
      order.status === "cancelled" ||
      (order.status === "pending" &&
        Date.now() - new Date(order.createdAt).getTime() < 300000); // 5 minutes

    if (!canDelete) {
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
