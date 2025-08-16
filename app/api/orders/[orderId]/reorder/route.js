import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongooseConnection } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";

export async function POST(request, { params }) {
  try {
    const { orderId } = params;
    const { userId } = await request.json();
    if (!orderId || !userId) {
      return NextResponse.json(
        { error: "Order ID and User ID are required" },
        { status: 400 },
      );
    }

    await getMongooseConnection();

    // Fetch original order
    const originalOrder = await Order.findOne({ _id: orderId, userId }).lean();
    if (!originalOrder) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 },
      );
    }

    // Extract product ids (keeping only valid ObjectIds)
    const productIds = (originalOrder.items || [])
      .map((i) => i.productId || i.id || i._id)
      .filter((id) => ObjectId.isValid(id));

    if (!productIds.length) {
      return NextResponse.json(
        {
          error: "No valid product IDs found in order items",
          debug: { originalItems: originalOrder.items },
        },
        { status: 400 },
      );
    }

    // Fetch current products
    const currentProducts = await Product.find({ _id: { $in: productIds } })
      .select(
        "name price stock status farmerId image images category description",
      )
      .lean();
    const productMap = new Map(
      currentProducts.map((p) => [p._id.toString(), p]),
    );

    const validationResults = {
      availableItems: [],
      unavailableItems: [],
      priceChanges: [],
      stockIssues: [],
      farmerIssues: [],
    };

    for (const originalItem of originalOrder.items || []) {
      const pid = originalItem.productId || originalItem.id || originalItem._id;
      const p = productMap.get(pid?.toString());
      const itemResult = {
        ...originalItem,
        originalPrice: originalItem.price,
        productId: pid,
      };

      if (!p) {
        validationResults.unavailableItems.push({
          ...itemResult,
          reason: "Product no longer available",
        });
        continue;
      }
      if (p.status !== "active") {
        validationResults.unavailableItems.push({
          ...itemResult,
          reason: "Product is currently inactive",
        });
        continue;
      }
      // Farmer validation (placeholder – no farmerInfo model yet)
      if (!p.farmerId) {
        validationResults.farmerIssues.push({
          ...itemResult,
          reason: "Farmer account unavailable",
        });
        continue;
      }
      if (p.stock < originalItem.quantity) {
        validationResults.stockIssues.push({
          ...itemResult,
          availableStock: p.stock,
          requestedQuantity: originalItem.quantity,
          reason: `Only ${p.stock} items available`,
        });
        continue;
      }
      const priceDiff = p.price - (originalItem.price || 0);
      if (Math.abs(priceDiff) > 0.01) {
        validationResults.priceChanges.push({
          ...itemResult,
          currentPrice: p.price,
          priceDifference: priceDiff,
          priceChangePercent: (
            (priceDiff / (originalItem.price || 1)) *
            100
          ).toFixed(2),
        });
      }
      validationResults.availableItems.push({
        productId: p._id.toString(),
        productName: p.name,
        quantity: originalItem.quantity,
        price: p.price,
        originalPrice: originalItem.price,
        farmerId: p.farmerId,
        farmerName: originalItem.farmerName || "Local Farmer",
        image: p.image || p.images?.[0],
        stock: p.stock,
        category: p.category,
        description: p.description,
        subtotal: p.price * originalItem.quantity,
      });
    }

    const summary = {
      totalOriginalItems: (originalOrder.items || []).length,
      availableCount: validationResults.availableItems.length,
      unavailableCount: validationResults.unavailableItems.length,
      priceChangesCount: validationResults.priceChanges.length,
      stockIssuesCount: validationResults.stockIssues.length,
      farmerIssuesCount: validationResults.farmerIssues.length,
      reorderSuccess: validationResults.availableItems.length > 0,
      fullReorderPossible:
        validationResults.availableItems.length ===
        (originalOrder.items || []).length,
    };

    const estimatedSubtotal = validationResults.availableItems.reduce(
      (s, i) => s + i.price * i.quantity,
      0,
    );
    const estimatedDeliveryFee = 50;
    const estimatedServiceFee = 0;
    const estimatedTotal =
      estimatedSubtotal + estimatedDeliveryFee + estimatedServiceFee;
    const originalSubtotal =
      originalOrder.subtotal ||
      (originalOrder.items || []).reduce(
        (s, i) => s + (i.price || 0) * i.quantity,
        0,
      );

    return NextResponse.json({
      success: true,
      originalOrder: {
        id: originalOrder._id,
        itemCount: (originalOrder.items || []).length,
        total: originalOrder.total,
        subtotal: originalSubtotal,
        orderDate: originalOrder.createdAt,
      },
      validation: validationResults,
      summary,
      pricing: {
        estimatedSubtotal,
        estimatedDeliveryFee,
        estimatedServiceFee,
        estimatedTotal,
        originalTotal: originalOrder.total,
        originalSubtotal,
        totalDifference: estimatedTotal - (originalOrder.total || 0),
        subtotalDifference: estimatedSubtotal - originalSubtotal,
      },
      meta: { validatedAt: new Date().toISOString(), orderId, userId },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to validate reorder", details: error.message },
      { status: 500 },
    );
  }
}
