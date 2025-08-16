import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongooseConnection } from "@/lib/mongoose";
import Order from "@/models/Order";

// Cache for database connection and collections
let cachedOrdersCollection = null;

// Response cache for invoice data (10 minutes TTL)
const invoiceCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

// Generate cache key for invoice request
function generateCacheKey(orderId) {
  return `invoice:${orderId}`;
}

// Get cached invoice response if available and not expired
function getCachedInvoice(cacheKey) {
  const cached = invoiceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  invoiceCache.delete(cacheKey);
  return null;
}

// Set invoice response in cache
function setCachedInvoice(cacheKey, data) {
  invoiceCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  // Clean up expired entries
  if (invoiceCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of invoiceCache.entries()) {
      if (now - value.timestamp >= CACHE_TTL) {
        invoiceCache.delete(key);
      }
    }
  }
}

// Export cache clearing function for order updates
export function clearInvoiceCache(orderId) {
  if (orderId) {
    invoiceCache.delete(generateCacheKey(orderId));
  } else {
    invoiceCache.clear();
  }
  console.log(`Invoice cache cleared${orderId ? ` for order ${orderId}` : ""}`);
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

    const cacheKey = generateCacheKey(orderId);
    const cachedResponse = getCachedInvoice(cacheKey);
    if (cachedResponse) {
      return NextResponse.json({
        ...cachedResponse,
        meta: { ...cachedResponse.meta, cached: true },
      });
    }

    await getMongooseConnection();

    // Support lookup by _id or orderNumber
    let orderDoc = null;
    if (ObjectId.isValid(orderId)) {
      orderDoc = await Order.findById(orderId).lean();
    }
    if (!orderDoc) {
      orderDoc = await Order.findOne({ orderNumber: orderId }).lean();
    }
    if (!orderDoc) {
      return NextResponse.json(
        {
          error: "Order not found",
          details: `No order found with ID: ${orderId}`,
        },
        { status: 404 },
      );
    }

    const startTime = Date.now();
    const orderNumber = orderDoc.orderNumber || `ORDER-${orderDoc._id}`;
    const subtotal =
      orderDoc.subtotal != null
        ? orderDoc.subtotal
        : (orderDoc.items || []).reduce(
            (s, i) => s + (i.price || 0) * (i.quantity || 0),
            0,
          );

    const invoiceData = {
      order: {
        ...orderDoc,
        orderNumber,
        subtotal,
        deliveryAddress: orderDoc.deliveryAddress ||
          orderDoc.shippingAddress || {
            name: orderDoc.customerName || "Valued Customer",
            address: "Address not provided",
            city: "N/A",
            phone: orderDoc.customerPhone || "N/A",
          },
        items: (orderDoc.items || []).map((i) => ({
          ...i,
          productName: i.productName || i.name || "Product",
          farmerName: i.farmerName || i.farmer?.name || "Local Farmer",
          image: i.image || i.productImage || i.images?.[0],
          subtotal: i.subtotal || (i.price || 0) * (i.quantity || 0),
        })),
      },
      company: {
        name: "FarmFresh Ltd.",
        address: "123 Agriculture Street, Gulshan",
        city: "Dhaka-1212, Bangladesh",
        phone: "+880-1234-567890",
        email: "info@farmfresh.com",
        website: "www.farmfresh.com",
        logo: "/logo.png",
      },
      meta: {
        generatedAt: new Date().toISOString(),
        queryTime: Date.now() - startTime,
        cached: false,
        version: "2.0",
      },
    };

    const responsePayload = {
      success: true,
      invoiceData,
      orderNumber,
      meta: invoiceData.meta,
    };
    setCachedInvoice(cacheKey, responsePayload);

    return NextResponse.json(responsePayload, {
      headers: {
        "X-Order-Number": orderNumber,
        "X-Query-Time": String(invoiceData.meta.queryTime),
        "Cache-Control": "private, max-age=600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate invoice data",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
