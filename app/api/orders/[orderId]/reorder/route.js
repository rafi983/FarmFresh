import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongooseConnection } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Farmer from "@/models/Farmer";

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

    // Check delivery status for mixed orders
    const isDelivered = (item) => {
      // If it's not a mixed order, check the overall order status
      if (originalOrder.status !== "mixed") {
        return originalOrder.status === "delivered";
      }

      // For mixed orders, check individual farmer delivery status
      if (!item.farmerEmail || !originalOrder.farmerStatuses) {
        // If no farmer email or status tracking, assume not delivered for safety

        return false;
      }

      // Handle both encoded and non-encoded email formats
      const normalEmail = item.farmerEmail;
      const encodedEmail = item.farmerEmail.replace(/\./g, "(dot)");

      // Try both formats to find the farmer status
      const farmerStatus =
        originalOrder.farmerStatuses[normalEmail] ||
        originalOrder.farmerStatuses[encodedEmail];

      const isItemDelivered = farmerStatus === "delivered";

      return isItemDelivered;
    };

    // Filter items to only include those that have been delivered
    const deliveredItems = (originalOrder.items || []).filter(isDelivered);
    const undeliveredItems = (originalOrder.items || []).filter(
      (item) => !isDelivered(item),
    );

    if (deliveredItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No delivered items available for reorder",
          message:
            "This order contains no items that have been delivered yet. You can only reorder items that have been successfully delivered to you.",
          originalOrder: {
            id: originalOrder._id,
            itemCount: (originalOrder.items || []).length,
            status: originalOrder.status,
            orderDate: originalOrder.createdAt,
          },
          summary: {
            totalOriginalItems: (originalOrder.items || []).length,
            deliveredItems: 0,
            undeliveredItems: undeliveredItems.length,
            reorderSuccess: false,
            fullReorderPossible: false,
          },
        },
        { status: 400 },
      );
    }

    // Extract product ids from delivered items only
    const productIds = deliveredItems
      .map((i) => i.productId || i.id || i._id)
      .filter((id) => ObjectId.isValid(id));

    if (!productIds.length) {
      return NextResponse.json(
        {
          error: "No valid product IDs found in delivered items",
          debug: { deliveredItems: deliveredItems },
        },
        { status: 400 },
      );
    }

    // Fetch current products with farmer information
    const currentProducts = await Product.find({ _id: { $in: productIds } })
      .select(
        "name price stock status farmerEmail image images category description unit",
      )
      .lean();

    // Get farmer information for all products using email
    const farmerEmails = [
      ...new Set(currentProducts.map((p) => p.farmerEmail).filter(Boolean)),
    ];
    const farmers = await Farmer.find({ email: { $in: farmerEmails } })
      .select("name email")
      .lean();
    const farmerMap = new Map(farmers.map((f) => [f.email, f]));

    const productMap = new Map(
      currentProducts.map((p) => [p._id.toString(), p]),
    );

    const validationResults = {
      availableItems: [],
      unavailableItems: [],
      priceChanges: [],
      stockIssues: [],
      farmerIssues: [],
      undeliveredItems: [], // Add tracking for undelivered items
    };

    // Process only delivered items for validation
    for (const originalItem of deliveredItems) {
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

      // Get farmer information using email
      const farmer = farmerMap.get(p.farmerEmail);

      // Only treat as farmer issue if farmerEmail exists but farmer is not found
      // Allow products without farmerEmail to proceed (backwards compatibility)
      if (p.farmerEmail && !farmer) {
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
      const hasPriceChange = Math.abs(priceDiff) > 0.01;

      // Track price changes separately but still add to available items
      if (hasPriceChange) {
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
        farmerId: null, // Not using farmerId anymore
        farmerName: farmer?.name || originalItem.farmerName || "Local Farmer",
        farmerEmail:
          farmer?.email || p.farmerEmail || originalItem.farmerEmail || "",
        image: p.image || p.images?.[0],
        stock: p.stock,
        category: p.category,
        description: p.description,
        unit: p.unit || "unit",
        subtotal: p.price * originalItem.quantity,
        hasPriceChange: hasPriceChange,
        priceDifference: hasPriceChange ? priceDiff : 0,
      });
    }

    // Add undelivered items to the tracking (for user information)
    for (const undeliveredItem of undeliveredItems) {
      validationResults.undeliveredItems.push({
        ...undeliveredItem,
        reason: "Item not yet delivered",
        farmerStatus:
          originalOrder.farmerStatuses?.[undeliveredItem.farmerEmail] ||
          "unknown",
      });
    }

    const summary = {
      totalOriginalItems: (originalOrder.items || []).length,
      deliveredItems: deliveredItems.length,
      undeliveredItems: undeliveredItems.length,
      availableCount: validationResults.availableItems.length,
      unavailableCount: validationResults.unavailableItems.length,
      priceChangesCount: validationResults.priceChanges.length,
      stockIssuesCount: validationResults.stockIssues.length,
      farmerIssuesCount: validationResults.farmerIssues.length,
      reorderSuccess: validationResults.availableItems.length > 0,
      fullReorderPossible:
        validationResults.availableItems.length === deliveredItems.length &&
        undeliveredItems.length === 0,
      partialReorderReason:
        undeliveredItems.length > 0
          ? `${undeliveredItems.length} item(s) not yet delivered`
          : validationResults.availableItems.length < deliveredItems.length
            ? "Some delivered items are no longer available"
            : null,
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
    console.error("Reorder validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate reorder", details: error.message },
      { status: 500 },
    );
  }
}
