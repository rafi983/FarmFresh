import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Track if indexes have been initialized to avoid repeated calls
let indexesInitialized = false;

// Initialize indexes optimized for MongoDB Atlas performance
async function initializeOrderIndexes(db) {
  // Only initialize once per application lifecycle
  if (indexesInitialized) {
    return;
  }

  try {
    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");

    // Check if indexes already exist before creating them
    const existingIndexes = await ordersCollection.listIndexes().toArray();
    const indexNames = existingIndexes.map((index) => index.name);

    // Atlas-optimized compound indexes for better performance
    const indexesToCreate = [
      // Core user queries
      {
        key: { userId: 1, createdAt: -1 },
        name: "userId_createdAt_idx",
        options: { background: true },
      },
      // Farmer queries - optimized for Atlas
      {
        key: { "items.farmerId": 1, status: 1, createdAt: -1 },
        name: "items_farmerId_status_date_idx",
        options: { background: true },
      },
      {
        key: { "items.farmerEmail": 1, status: 1, createdAt: -1 },
        name: "items_farmerEmail_status_date_idx",
        options: { background: true },
      },
      // Alternative farmer fields
      {
        key: { farmerIds: 1, createdAt: -1 },
        name: "farmerIds_createdAt_idx",
        options: { background: true },
      },
      {
        key: { farmerEmails: 1, createdAt: -1 },
        name: "farmerEmails_createdAt_idx",
        options: { background: true },
      },
      // Product queries
      {
        key: { "items.productId": 1, createdAt: -1 },
        name: "items_productId_createdAt_idx",
        options: { background: true },
      },
      // Status and date queries
      {
        key: { status: 1, createdAt: -1 },
        name: "status_createdAt_idx",
        options: { background: true },
      },
      // General date sorting
      {
        key: { createdAt: -1 },
        name: "createdAt_idx",
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

    // Products collection indexes for order operations
    const productIndexes = await productsCollection.listIndexes().toArray();
    const productIndexNames = productIndexes.map((index) => index.name);

    if (!productIndexNames.includes("stock_status_idx")) {
      await productsCollection.createIndex(
        { stock: 1, status: 1 },
        { name: "stock_status_idx", background: true },
      );
    }

    indexesInitialized = true;
    console.log("Atlas-optimized order indexes initialized successfully");
  } catch (error) {
    console.log("Order index initialization note:", error.message);
  }
}

// Cache for database connection and collections
let cachedDb = null;
let cachedOrdersCollection = null;

// Response cache for identical requests (3 minutes for orders - shorter than products)
const responseCache = new Map();
const CACHE_TTL = 3 * 60 * 1000;

// Export cache clearing function for use by individual order updates
export function clearOrdersCache() {
  responseCache.clear();
  console.log("Orders cache cleared");
}

// Generate cache key for request
function generateCacheKey(searchParams) {
  const params = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return JSON.stringify(params);
}

// Get cached response if available and not expired
function getCachedResponse(cacheKey) {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  responseCache.delete(cacheKey);
  return null;
}

// Set response in cache
function setCachedResponse(cacheKey, data) {
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  // Clean up expired entries
  if (responseCache.size > 50) {
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
      if (now - value.timestamp >= CACHE_TTL) {
        responseCache.delete(key);
      }
    }
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Check cache first
    const cacheKey = generateCacheKey(searchParams);
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const userId = searchParams.get("userId");
    const farmerId = searchParams.get("farmerId");
    const farmerEmail = searchParams.get("farmerEmail");
    const productId = searchParams.get("productId"); // Add productId parameter
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const page = parseInt(searchParams.get("page")) || 1;

    // Reuse database connection
    if (!cachedDb) {
      const client = await clientPromise;
      cachedDb = client.db("farmfresh");
      cachedOrdersCollection = cachedDb.collection("orders");
    }

    // Initialize indexes
    await initializeOrderIndexes(cachedDb);

    // Build optimized query
    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    // Add productId filtering - only show orders containing this specific product
    if (productId) {
      query["items.productId"] = productId;
    }

    // Optimized farmer filtering for better Atlas performance
    if (farmerId || farmerEmail) {
      const farmerConditions = [];

      if (farmerId) {
        farmerConditions.push(
          { "items.farmerId": farmerId },
          { "items.farmer.id": farmerId },
          { "items.farmer._id": farmerId },
          { farmerIds: farmerId },
        );
      }

      if (farmerEmail) {
        farmerConditions.push(
          { "items.farmerEmail": farmerEmail },
          { "items.farmer.email": farmerEmail },
          { farmerEmails: farmerEmail },
        );
      }

      query.$or = farmerConditions;
    }

    // Optimized projection - reduce data transfer
    const projection = {
      _id: 1,
      userId: 1,
      customerName: 1,
      customerEmail: 1,
      customerPhone: 1,
      customerInfo: 1,
      status: 1,
      total: 1,
      subtotal: 1,
      deliveryFee: 1,
      serviceFee: 1,
      farmerSubtotal: 1,
      shippingAddress: 1,
      deliveryAddress: 1, // Add delivery address
      paymentMethod: 1,
      createdAt: 1,
      updatedAt: 1,
      // Include essential item fields including images
      "items._id": 1,
      "items.productId": 1,
      "items.name": 1,
      "items.productName": 1,
      "items.price": 1,
      "items.quantity": 1,
      "items.subtotal": 1,
      "items.farmerId": 1,
      "items.farmerEmail": 1,
      "items.farmerName": 1,
      "items.farmer": 1,
      "items.image": 1, // Include item image
      "items.productImage": 1, // Include product image
      "items.images": 1, // Include images array
    };

    // Use aggregation pipeline for better Atlas performance
    const pipeline = [
      { $match: query },
      { $project: projection },
      { $sort: { createdAt: -1 } },
    ];

    // Add pagination
    if (limit < 1000) {
      pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
    }

    // Execute optimized query
    const startTime = Date.now();

    // First get the orders
    let orders = await cachedOrdersCollection.aggregate(pipeline).toArray();

    // Then get the total count BEFORE filtering for accurate pagination
    const totalCount =
      limit < 1000
        ? await cachedOrdersCollection.countDocuments(query)
        : orders.length;

    // IMPORTANT: Filter order items for farmers to show only their products
    if (farmerId || farmerEmail) {
      console.log(
        `Filtering order items for farmer: ${farmerId || farmerEmail}`,
      );

      orders = orders.map((order) => {
        // Filter items to only include those belonging to the current farmer
        const filteredItems =
          order.items?.filter((item) => {
            // Check multiple ways the farmer might be identified in the item
            const itemFarmerId =
              item.farmerId || item.farmer?.id || item.farmer?._id;
            const itemFarmerEmail = item.farmerEmail || item.farmer?.email;
            const itemFarmerName = item.farmerName || item.farmer?.name;

            // Match by farmer ID
            if (
              farmerId &&
              (itemFarmerId === farmerId || itemFarmerId === farmerId)
            ) {
              return true;
            }

            // Match by farmer email
            if (farmerEmail && itemFarmerEmail === farmerEmail) {
              return true;
            }

            // For hardcoded farmers, also try matching by name if we have it
            // This is a fallback for older orders that might not have proper farmer IDs
            if (farmerEmail && itemFarmerName) {
              // We need to get the farmer name from the farmer collection
              // For now, we'll rely on the ID and email matching
              return false;
            }

            return false;
          }) || [];

        // Calculate the farmer-specific subtotal from filtered items
        const farmerSubtotal = filteredItems.reduce((sum, item) => {
          return sum + (item.subtotal || item.price * item.quantity || 0);
        }, 0);

        // Return order with filtered items and updated subtotal
        return {
          ...order,
          items: filteredItems,
          farmerSubtotal: farmerSubtotal,
          originalItemCount: order.items?.length || 0, // For debugging
          filteredItemCount: filteredItems.length, // For debugging
        };
      });

      // Remove orders that have no items after filtering (shouldn't happen with proper query, but safety check)
      orders = orders.filter((order) => order.items && order.items.length > 0);

      console.log(
        `Filtered orders: ${orders.length} orders with farmer-specific items`,
      );
    }

    const queryTime = Date.now() - startTime;
    console.log(
      `Atlas orders query executed in ${queryTime}ms for ${orders.length} orders`,
    );

    // Build response
    const response = {
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      meta: {
        queryTime,
        cached: false,
      },
    };

    // Cache the response
    setCachedResponse(cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Orders API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch orders",
        details: error.message,
        orders: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const orderData = await request.json();

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes for optimal performance
    await initializeOrderIndexes(db);

    // Optimize stock validation using aggregation pipeline
    const productIds = orderData.items.map(
      (item) => new ObjectId(item.productId),
    );

    const stockValidationPipeline = [
      { $match: { _id: { $in: productIds } } },
      {
        $project: {
          _id: 1,
          stock: 1,
          name: 1,
          image: 1, // Include main product image
          images: 1, // Include product images array
          price: 1, // Include current price
          farmer: 1, // Include farmer info
        },
      },
    ];

    const products = await db
      .collection("products")
      .aggregate(stockValidationPipeline)
      .toArray();

    // Create lookup map for faster validation
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Validate stock availability
    const stockUpdates = [];
    for (const item of orderData.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error(`Product ${item.name} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }

      stockUpdates.push({
        updateOne: {
          filter: { _id: new ObjectId(item.productId) },
          update: {
            $inc: { stock: -item.quantity },
            $set: { updatedAt: new Date() },
          },
        },
      });
    }

    // Perform bulk stock updates for better performance
    if (stockUpdates.length > 0) {
      await db.collection("products").bulkWrite(stockUpdates);
    }

    // Enrich order items with product data including images
    const enrichedItems = orderData.items.map((item) => {
      const product = productMap.get(item.productId);
      return {
        ...item,
        // Add product images to order item
        image: product?.image || item.image,
        productImage: product?.image || product?.images?.[0],
        images: product?.images || [],
        // Store current product name in case it changes later
        productName: item.productName || item.name || product?.name,
        // Store farmer info
        farmerName: item.farmerName || product?.farmer?.name || "Local Farmer",
        farmerEmail: item.farmerEmail || product?.farmer?.email,
        farmerId: item.farmerId || product?.farmer?.id || product?.farmerId,
      };
    });

    // Enrich order data with customer information
    let customerInfo = {};
    if (orderData.userId) {
      try {
        const user = await db.collection("users").findOne({
          $or: [
            { _id: new ObjectId(orderData.userId) },
            { _id: orderData.userId },
            { email: orderData.userId },
          ],
        });

        if (user) {
          customerInfo = {
            customerName:
              user.name || user.username || user.email || "Customer",
            customerEmail: user.email,
            customerPhone: user.phone,
            customerInfo: {
              name: user.name || user.username || "Customer",
              email: user.email,
              phone: user.phone,
            },
          };
        }
      } catch (error) {
        console.log("Could not fetch user details:", error.message);
      }
    }

    // Add timestamps and customer info to order
    const newOrder = {
      ...orderData,
      ...customerInfo,
      items: enrichedItems, // Use enriched items
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create the order
    const result = await db.collection("orders").insertOne(newOrder);

    // Clear ALL caches after creating new order to ensure fresh data
    responseCache.clear();

    // Clear products cache immediately after purchase count update
    try {
      // Import and clear products cache
      const { responseCache: productsCache } = await import(
        "@/app/api/products/route"
      );
      if (productsCache && productsCache.clear) {
        productsCache.clear();
        console.log(
          "🧹 Products cache cleared after purchase count update on order creation",
        );
      }
    } catch (error) {
      console.log("Note: Could not clear products cache:", error.message);
    }

    return NextResponse.json({
      message: "Order created successfully",
      orderId: result.insertedId,
      order: { ...newOrder, _id: result.insertedId },
      testMode: "Purchase counts updated immediately for testing",
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order", details: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const { orderId, ...updateData } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Get the current order to check status changes (without transactions)
    const currentOrder = await db
      .collection("orders")
      .findOne({ _id: new ObjectId(orderId) });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order status is being changed to cancelled/returned
    const isBeingCancelled =
      updateData.status &&
      (updateData.status === "cancelled" || updateData.status === "returned") &&
      currentOrder.status !== "cancelled" &&
      currentOrder.status !== "returned";

    // Check if order status is being changed to delivered (purchase completed)
    const isBeingDelivered =
      updateData.status &&
      updateData.status === "delivered" &&
      currentOrder.status !== "delivered";

    // If order is being delivered, increment purchase count for each product
    if (isBeingDelivered && currentOrder.items) {
      console.log(
        `Order ${orderId} is being delivered, updating purchase counts...`,
      );

      const purchaseCountUpdates = [];
      for (const item of currentOrder.items) {
        const productId = item.productId;
        const orderQuantity = item.quantity;

        purchaseCountUpdates.push({
          updateOne: {
            filter: { _id: new ObjectId(productId) },
            update: {
              $inc: {
                purchaseCount: orderQuantity, // Increment by the quantity purchased
              },
              $set: {
                updatedAt: new Date(),
              },
            },
          },
        });
      }

      // Perform bulk purchase count updates for better performance
      if (purchaseCountUpdates.length > 0) {
        try {
          await db.collection("products").bulkWrite(purchaseCountUpdates);
          console.log(
            `Updated purchase counts for ${purchaseCountUpdates.length} products`,
          );
        } catch (error) {
          console.error("Error updating purchase counts:", error);
        }
      }
    }

    // If order is being cancelled, restore stock
    if (isBeingCancelled && currentOrder.items) {
      console.log(
        `Order ${orderId} is being cancelled/returned, restoring stock...`,
      );

      const stockRestoreUpdates = [];
      for (const item of currentOrder.items) {
        const productId = item.productId;
        const orderQuantity = item.quantity;

        stockRestoreUpdates.push({
          updateOne: {
            filter: { _id: new ObjectId(productId) },
            update: {
              $inc: {
                stock: orderQuantity, // Restore the stock
              },
              $set: {
                updatedAt: new Date(),
              },
            },
          },
        });
      }

      // Perform bulk stock restore updates for better performance
      if (stockRestoreUpdates.length > 0) {
        try {
          await db.collection("products").bulkWrite(stockRestoreUpdates);
          console.log(
            `Restored stock for ${stockRestoreUpdates.length} products`,
          );
        } catch (error) {
          console.error("Error restoring stock:", error);
        }
      }
    }

    // Update the order
    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Clear caches after updating order to ensure fresh data
    responseCache.clear();

    // Also clear products cache if purchase count was updated
    if (isBeingDelivered) {
      try {
        // Import and clear products cache
        const { responseCache: productsCache } = await import(
          "@/app/api/products/route"
        );
        if (productsCache) {
          productsCache.clear();
          console.log("🧹 Products cache cleared after purchase count update");
        }
      } catch (error) {
        console.log("Note: Could not clear products cache:", error.message);
      }
    }

    // Get the updated order
    const updatedOrder = await db
      .collection("orders")
      .findOne({ _id: new ObjectId(orderId) });

    return NextResponse.json({
      message: "Order updated successfully",
      order: updatedOrder,
      purchaseCountUpdated: isBeingDelivered
        ? "Purchase counts have been updated for delivered products"
        : undefined,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Failed to update order", details: error.message },
      { status: 500 },
    );
  }
}
