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

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Prepare the update operation
    const updateOperation = {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
    };

    // If status history is provided, add it to the array
    if (updateData.statusHistory) {
      updateOperation.$push = {
        statusHistory: updateData.statusHistory,
      };
      // Remove statusHistory from $set since we're using $push for it
      delete updateOperation.$set.statusHistory;
    }

    // Perform the update
    const result = await db
      .collection("orders")
      .updateOne({ _id: new ObjectId(orderId) }, updateOperation);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
