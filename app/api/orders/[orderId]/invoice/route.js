import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Track if indexes have been initialized to avoid repeated calls
let indexesInitialized = false;

// Initialize indexes optimized for invoice queries
async function initializeInvoiceIndexes(db) {
  if (indexesInitialized) {
    return;
  }

  try {
    const ordersCollection = db.collection("orders");
    const existingIndexes = await ordersCollection.listIndexes().toArray();
    const indexNames = existingIndexes.map((index) => index.name);

    // Invoice-specific indexes for fast lookups
    const indexesToCreate = [
      {
        key: { _id: 1, status: 1 },
        name: "invoice_id_status_idx",
        options: { background: true },
      },
      {
        key: { orderNumber: 1 },
        name: "invoice_orderNumber_idx",
        options: { background: true, sparse: true },
      },
      {
        key: { userId: 1, _id: 1 },
        name: "invoice_userId_id_idx",
        options: { background: true },
      },
    ];

    for (const indexSpec of indexesToCreate) {
      if (!indexNames.includes(indexSpec.name)) {
        await ordersCollection.createIndex(indexSpec.key, {
          name: indexSpec.name,
          ...indexSpec.options,
        });
      }
    }

    indexesInitialized = true;
    console.log("Invoice indexes initialized successfully");
  } catch (error) {
    console.log("Invoice index initialization note:", error.message);
  }
}

// Cache for database connection and collections
let cachedDb = null;
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

    // Check cache first
    const cacheKey = generateCacheKey(orderId);
    const cachedResponse = getCachedInvoice(cacheKey);
    if (cachedResponse) {
      return NextResponse.json({
        ...cachedResponse,
        meta: {
          ...cachedResponse.meta,
          cached: true,
        },
      });
    }

    // Reuse database connection
    if (!cachedDb) {
      const client = await clientPromise;
      cachedDb = client.db("farmfresh");
      cachedOrdersCollection = cachedDb.collection("orders");
    }

    // Initialize indexes
    await initializeInvoiceIndexes(cachedDb);

    // Optimized aggregation pipeline for invoice data
    const pipeline = [
      // Match stage with optimized query conditions
      {
        $match: {
          $or: [
            // Try ObjectId match first (most common case)
            ...(ObjectId.isValid(orderId)
              ? [{ _id: new ObjectId(orderId) }]
              : []),
            // Fallback to orderNumber match
            { orderNumber: orderId },
          ],
        },
      },

      // Project only necessary fields for invoice
      {
        $project: {
          _id: 1,
          userId: 1,
          orderNumber: 1,
          customerName: 1,
          customerEmail: 1,
          customerPhone: 1,
          customerInfo: 1,
          status: 1,
          total: 1,
          subtotal: 1,
          deliveryFee: 1,
          serviceFee: 1,
          deliveryAddress: 1,
          shippingAddress: 1,
          paymentMethod: 1,
          createdAt: 1,
          updatedAt: 1,
          // Include essential item fields for invoice
          "items._id": 1,
          "items.productId": 1,
          "items.productName": 1,
          "items.name": 1,
          "items.price": 1,
          "items.quantity": 1,
          "items.subtotal": 1,
          "items.farmerId": 1,
          "items.farmerName": 1,
          "items.farmerEmail": 1,
          "items.farmer": 1,
          "items.image": 1,
          "items.productImage": 1,
          "items.images": 1,
        },
      },

      // Add computed fields for invoice
      {
        $addFields: {
          // Ensure orderNumber exists
          orderNumber: {
            $ifNull: [
              "$orderNumber",
              {
                $concat: ["ORDER-", { $toString: "$_id" }],
              },
            ],
          },
          // Calculate totals if missing
          calculatedSubtotal: {
            $ifNull: [
              "$subtotal",
              {
                $sum: {
                  $map: {
                    input: "$items",
                    as: "item",
                    in: {
                      $multiply: [
                        { $ifNull: ["$$item.price", 0] },
                        { $ifNull: ["$$item.quantity", 1] },
                      ],
                    },
                  },
                },
              },
            ],
          },
          // Ensure delivery address is properly structured
          invoiceDeliveryAddress: {
            $ifNull: ["$deliveryAddress", "$shippingAddress"],
          },
        },
      },

      // Limit to single result for performance
      { $limit: 1 },
    ];

    const startTime = Date.now();
    const results = await cachedOrdersCollection.aggregate(pipeline).toArray();
    const queryTime = Date.now() - startTime;

    if (!results || results.length === 0) {
      return NextResponse.json(
        {
          error: "Order not found",
          details: `No order found with ID: ${orderId}`,
        },
        { status: 404 },
      );
    }

    const order = results[0];

    // Ensure orderNumber exists with fallback
    const orderNumber = order.orderNumber || `ORDER-${Date.now()}`;

    // Prepare optimized invoice data
    const invoiceData = {
      order: {
        ...order,
        orderNumber,
        // Use calculated subtotal if original is missing
        subtotal: order.subtotal || order.calculatedSubtotal || 0,
        // Ensure delivery address is available
        deliveryAddress: order.invoiceDeliveryAddress || {
          name: order.customerName || "Valued Customer",
          address: "Address not provided",
          city: "N/A",
          phone: order.customerPhone || "N/A",
        },
        // Enrich items with fallback data
        items: (order.items || []).map((item) => ({
          ...item,
          productName: item.productName || item.name || "Product",
          farmerName: item.farmerName || item.farmer?.name || "Local Farmer",
          image: item.image || item.productImage || item.images?.[0],
          subtotal: item.subtotal || item.price * item.quantity || 0,
        })),
      },
      company: {
        name: "FarmFresh Ltd.",
        address: "123 Agriculture Street, Gulshan",
        city: "Dhaka-1212, Bangladesh",
        phone: "+880-1234-567890",
        email: "info@farmfresh.com",
        website: "www.farmfresh.com",
        logo: "/logo.png", // Add logo path for future use
      },
      meta: {
        generatedAt: new Date().toISOString(),
        queryTime,
        cached: false,
        version: "2.0",
      },
    };

    // Cache the response
    const response = {
      success: true,
      invoiceData,
      orderNumber,
      meta: invoiceData.meta,
    };

    setCachedInvoice(cacheKey, response);

    console.log(
      `Invoice data generated for order ${orderId} in ${queryTime}ms`,
    );

    return NextResponse.json(response, {
      headers: {
        "X-Order-Number": orderNumber,
        "X-Query-Time": queryTime.toString(),
        "Cache-Control": "private, max-age=600", // 10 minutes client cache
      },
    });
  } catch (error) {
    console.error("Error generating invoice data:", error);

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
