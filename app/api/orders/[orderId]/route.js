import { NextResponse } from "next/server";
import { getMongooseConnection } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { ObjectId } from "mongodb";

function encodeFarmerKey(email = "") {
  return email.replace(/\./g, "(dot)");
}

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

    if (!ObjectId.isValid(orderId))
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );

    await getMongooseConnection();
    const existingOrder = await Order.findById(orderId).lean();
    if (!existingOrder)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const { status: newStatus, farmerEmail } = updateData;

    // If farmerEmail missing but order has multiple distinct farmer emails, treat as per-farmer update for the first farmer's segment
    let inferredFarmerEmail = farmerEmail;
    if (!inferredFarmerEmail && newStatus) {
      const distinctFarmers = Array.from(
        new Set(
          (existingOrder.items || [])
            .map((it) => it.farmerEmail || it.farmer?.email)
            .filter(Boolean),
        ),
      );
      if (distinctFarmers.length > 1) {
        inferredFarmerEmail = distinctFarmers[0];
      }
    }

    const effectiveFarmerEmail = inferredFarmerEmail;

    // Build distinct farmer list once
    const allDistinctFarmers = Array.from(
      new Set(
        (existingOrder.items || [])
          .map((it) => it.farmerEmail || it.farmer?.email)
          .filter(Boolean),
      ),
    );

    let isPerFarmer = Boolean(effectiveFarmerEmail && newStatus);

    // Prefill baseline map so first per-farmer update produces a mixed status afterward
    if (isPerFarmer) {
      const baselineMap = { ...(existingOrder.farmerStatuses || {}) };
      const prevGlobal = existingOrder.status || "pending";
      let added = false;
      for (const fe of allDistinctFarmers) {
        const enc = encodeFarmerKey(fe);
        if (!baselineMap[enc]) {
          baselineMap[enc] = prevGlobal;
          added = true;
        }
      }
      if (added) {
        // persist baseline before we apply specific farmer change (so derivation sees both differing statuses after update)
        await Order.updateOne(
          { _id: orderId },
          { $set: { farmerStatuses: baselineMap, updatedAt: new Date() } },
        );
        // refresh existingOrder snapshot baseline (do not mutate statuses for chosen farmer yet)
        existingOrder.farmerStatuses = baselineMap;
      }
    }

    // If farmerEmail provided, treat as per-farmer status update and do NOT globally change all items
    isPerFarmer = Boolean(effectiveFarmerEmail && newStatus);

    // Determine items impacted
    const impactedItems = isPerFarmer
      ? (existingOrder.items || []).filter(
          (it) =>
            (it.farmerEmail || it.farmer?.email) &&
            (it.farmerEmail || it.farmer?.email) === effectiveFarmerEmail,
        )
      : existingOrder.items || [];

    const prevFarmerStatus = isPerFarmer
      ? existingOrder.farmerStatuses?.[encodeFarmerKey(effectiveFarmerEmail)] ||
        existingOrder.farmerStatuses?.[effectiveFarmerEmail]
      : existingOrder.status;

    const isBeingCancelled =
      newStatus &&
      ["cancelled", "returned"].includes(newStatus) &&
      !["cancelled", "returned"].includes(prevFarmerStatus);

    const isBeingDelivered =
      newStatus === "delivered" && prevFarmerStatus !== "delivered";

    const bulkOps = [];
    if (impactedItems && impactedItems.length) {
      if (isBeingDelivered) {
        for (const item of impactedItems) {
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
      } else if (isBeingCancelled) {
        for (const item of impactedItems) {
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
    }
    if (bulkOps.length) await Product.collection.bulkWrite(bulkOps);

    // Prepare update operations
    const updateOps = { $set: { updatedAt: new Date() } };
    let historyEntry = null;

    if (isPerFarmer) {
      const encKey = encodeFarmerKey(effectiveFarmerEmail);
      updateOps.$set[`farmerStatuses.${encKey}`] = newStatus;
      // Also maintain array form
      if (!updateOps.$set.farmerStatusesArr) {
        // rebuild later
      }
      historyEntry = {
        status: newStatus,
        at: new Date(),
        note: `Farmer ${effectiveFarmerEmail} set status to ${newStatus}${effectiveFarmerEmail !== farmerEmail && farmerEmail ? " (inferred)" : ""}`,
      };
    } else if (newStatus) {
      updateOps.$set.status = newStatus;
      historyEntry = {
        status: newStatus,
        at: new Date(),
        note: updateData.statusHistory?.note || "Global update",
      };
    }

    if (historyEntry) {
      updateOps.$push = { statusHistory: historyEntry };
    }

    // Remove processed keys
    delete updateData.statusHistory;

    // Apply any remaining direct field sets besides status / farmerEmail
    Object.entries(updateData).forEach(([k, v]) => {
      if (["status", "farmerEmail"].includes(k)) return;
      if (!updateOps.$set[k]) updateOps.$set[k] = v;
    });

    await Order.updateOne({ _id: orderId }, updateOps);
    let updatedOrder = await Order.findById(orderId).lean();

    // Handle per-farmer updates and global status derivation in a single operation
    if (isPerFarmer) {
      const encKey = encodeFarmerKey(effectiveFarmerEmail);
      const map = updatedOrder.farmerStatuses || {};
      if (!map[encKey]) map[encKey] = newStatus;

      let arr = updatedOrder.farmerStatusesArr || [];
      const idx = arr.findIndex((e) => e.farmerEmail === effectiveFarmerEmail);
      if (idx >= 0) arr[idx].status = newStatus;
      else arr.push({ farmerEmail: effectiveFarmerEmail, status: newStatus });

      // Update the map with the new status for this farmer
      map[encKey] = newStatus;

      // Derive global status from per-farmer statuses
      const allStatuses = Object.values(map);
      let derivedStatus;
      if (allStatuses.length) {
        const unique = [...new Set(allStatuses)];
        console.log("🔍 [API DEBUG] Status derivation:", {
          allStatuses,
          unique,
          uniqueLength: unique.length,
        });

        if (unique.length === 1) {
          derivedStatus = unique[0];
        } else if (unique.every((s) => s === "delivered")) {
          derivedStatus = "delivered";
        } else {
          derivedStatus = "mixed";
        }
      }

      // Single atomic update for farmer status + global status + array sync
      const atomicUpdate = {
        $set: {
          farmerStatusesArr: arr,
          [`farmerStatuses.${encKey}`]: newStatus, // Ensure farmer status is properly set
          updatedAt: new Date(),
        },
      };

      // Always update global status for mixed orders to ensure consistency
      if (derivedStatus) {
        atomicUpdate.$set.status = derivedStatus;
        console.log("🔍 [API DEBUG] Setting global status to:", derivedStatus);
      }

      await Order.updateOne({ _id: orderId }, atomicUpdate);

      // Update local object to reflect changes
      updatedOrder.farmerStatusesArr = arr;
      updatedOrder.farmerStatuses = map;
      if (derivedStatus) {
        updatedOrder.status = derivedStatus;
      }
    }

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
      perFarmer: isPerFarmer || undefined,
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
