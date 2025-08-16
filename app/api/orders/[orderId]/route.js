import { NextResponse } from "next/server";
import { getMongooseConnection } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { orderId } = params;
    if (!orderId)
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );

    await getMongooseConnection();
    const order = await Order.findById(orderId).lean();
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Ensure statusHistory array
    order.statusHistory = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : [];

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Get order error (mongoose):", error);
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

    if (!orderId)
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );

    // Validate ObjectId format
    if (!ObjectId.isValid(orderId))
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );

    await getMongooseConnection();
    const existingOrder = await Order.findById(orderId).lean();
    if (!existingOrder)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const isBeingCancelled =
      updateData.status &&
      ["cancelled", "returned"].includes(updateData.status) &&
      !["cancelled", "returned"].includes(existingOrder.status);

    const isBeingDelivered =
      updateData.status === "delivered" && existingOrder.status !== "delivered";

    const bulkOps = [];
    if (isBeingDelivered && existingOrder.items) {
      for (const item of existingOrder.items) {
        if (!item.productId) continue;
        bulkOps.push({
          updateOne: {
            filter: { _id: item.productId },
            update: {
              $inc: { purchaseCount: item.quantity },
              $set: { updatedAt: new Date() },
            },
          },
        });
      }
    }
    if (isBeingCancelled && existingOrder.items) {
      for (const item of existingOrder.items) {
        if (!item.productId) continue;
        bulkOps.push({
          updateOne: {
            filter: { _id: item.productId },
            update: {
              $inc: { stock: item.quantity },
              $set: { updatedAt: new Date() },
            },
          },
        });
      }
    }
    if (bulkOps.length) await Product.collection.bulkWrite(bulkOps);

    // Status history handling
    let pushHistory = null;
    if (updateData.statusHistory) {
      pushHistory = updateData.statusHistory;
      delete updateData.statusHistory;
    }

    const updateOps = { $set: { ...updateData, updatedAt: new Date() } };
    if (pushHistory) updateOps.$push = { statusHistory: pushHistory };

    await Order.updateOne({ _id: orderId }, updateOps);
    const updatedOrder = await Order.findById(orderId).lean();
    updatedOrder.statusHistory = Array.isArray(updatedOrder.statusHistory)
      ? updatedOrder.statusHistory
      : [];

    try {
      const ordersModule = await import("../route.js");
      ordersModule.clearOrdersCache?.();
    } catch {}

    return NextResponse.json({
      message: "Order updated successfully",
      order: updatedOrder,
      stockRestored: isBeingCancelled || undefined,
    });
  } catch (error) {
    console.error("Update order error (mongoose):", error);
    return NextResponse.json(
      { error: "Failed to update order", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { orderId } = params;
    if (!orderId)
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );

    // Validate ObjectId format
    if (!ObjectId.isValid(orderId))
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );

    await getMongooseConnection();
    const order = await Order.findById(orderId).lean();
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Deletion rules
    const ageMs = Date.now() - new Date(order.createdAt).getTime();
    const canDelete =
      order.status === "cancelled" ||
      (order.status === "pending" && ageMs < 300000);
    if (!canDelete) {
      return NextResponse.json(
        {
          error:
            "Order cannot be deleted. Only cancelled orders or recent pending orders can be deleted.",
        },
        { status: 400 },
      );
    }

    const result = await Order.deleteOne({ _id: orderId });
    return NextResponse.json({
      message: "Order deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete order error (mongoose):", error);
    return NextResponse.json(
      { error: "Failed to delete order", details: error.message },
      { status: 500 },
    );
  }
}
