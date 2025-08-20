import { NextResponse } from "next/server";
import { getMongooseConnection } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

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
    const cacheKey = generateCacheKey(searchParams);
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) return NextResponse.json(cachedResponse);

    await getMongooseConnection();

    const params = {
      userId: searchParams.get("userId"),
      farmerEmail: searchParams.get("farmerEmail"),
      productId: searchParams.get("productId"),
      status: searchParams.get("status"),
    };
    const limit = parseInt(searchParams.get("limit")) || 50;
    const page = parseInt(searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;

    const query = Order.buildFilter(params);

    const projection = {
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
      deliveryAddress: 1,
      paymentMethod: 1,
      createdAt: 1,
      updatedAt: 1,
      items: 1,
    };

    const startTime = Date.now();
    let [orders, totalCount] = await Promise.all([
      Order.find(query)
        .select(projection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    const { farmerEmail } = params;
    if (farmerEmail) {
      orders = orders
        .map((order) => {
          const filteredItems = (order.items || []).filter((item) => {
            const itemFarmerEmail = item.farmerEmail || item.farmer?.email;
            return itemFarmerEmail === farmerEmail;
          });
          if (!filteredItems.length) return null;
          const farmerSubtotal = filteredItems.reduce(
            (sum, item) =>
              sum + (item.subtotal || item.price * item.quantity || 0),
            0,
          );
          return { ...order, items: filteredItems, farmerSubtotal };
        })
        .filter(Boolean);
    }

    const queryTime = Date.now() - startTime;
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
      meta: { queryTime, cached: false },
    };

    setCachedResponse(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Orders API Error (mongoose):", error);
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
    await getMongooseConnection();
    const orderData = await request.json();

    if (
      !orderData.items ||
      !Array.isArray(orderData.items) ||
      !orderData.items.length
    ) {
      return NextResponse.json(
        { error: "Order items required" },
        { status: 400 },
      );
    }

    // Gather product docs
    const itemIds = orderData.items.map((i) => i.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: itemIds } })
      .select("stock price image images farmer name farmerId")
      .lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Validate stock & prepare bulk updates
    const bulkOps = [];
    for (const item of orderData.items) {
      const p = productMap.get(item.productId);
      if (!p) throw new Error(`Product ${item.productId} not found`);
      if (p.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${p.name}`);
      }
      bulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: {
            $inc: { stock: -item.quantity },
            $set: { updatedAt: new Date() },
          },
        },
      });
      // Enrich item
      item.price = p.price;
      item.image = p.image;
      item.productImage = p.image || p.images?.[0];
      item.images = p.images || [];
      item.productName = item.productName || item.name || p.name;
      item.farmerName = item.farmerName || p.farmer?.name || "Local Farmer";
      item.farmerEmail = item.farmerEmail || p.farmer?.email;
      item.farmerId = item.farmerId || p.farmerId || p.farmer?._id?.toString();
      item.subtotal = item.subtotal || p.price * item.quantity;
    }
    if (bulkOps.length) await Product.collection.bulkWrite(bulkOps);

    // Attach user info
    let userInfo = {};
    if (orderData.userId) {
      const user = await User.findOne({
        $or: [{ _id: orderData.userId }, { email: orderData.userId }],
      })
        .select("name email phone")
        .lean();
      if (user) {
        userInfo = {
          customerName: user.name || user.username || user.email || "Customer",
          customerEmail: user.email,
          customerPhone: user.phone,
          customerInfo: {
            name: user.name || user.username || "Customer",
            email: user.email,
            phone: user.phone,
          },
        };
      }
    }

    const doc = await Order.create({
      ...orderData,
      ...userInfo,
      items: orderData.items,
    });

    responseCache.clear();
    try {
      const { responseCache: productsCache } = await import(
        "@/app/api/products/route"
      );
      productsCache?.clear?.();
    } catch {}

    return NextResponse.json({
      message: "Order created successfully",
      orderId: doc._id,
      order: doc,
    });
  } catch (error) {
    console.error("Create order error (mongoose):", error);
    return NextResponse.json(
      { error: "Failed to create order", details: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    await getMongooseConnection();
    const { orderId, ...updateData } = await request.json();
    if (!orderId)
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );

    const current = await Order.findById(orderId).lean();
    if (!current)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const isBeingCancelled =
      updateData.status &&
      ["cancelled", "returned"].includes(updateData.status) &&
      !["cancelled", "returned"].includes(current.status);
    const isBeingDelivered =
      updateData.status === "delivered" && current.status !== "delivered";

    const bulkOps = [];
    if (isBeingDelivered) {
      for (const item of current.items || []) {
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
      for (const item of current.items || []) {
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

    const updated = await Order.findByIdAndUpdate(
      orderId,
      { ...updateData, updatedAt: new Date() },
      { new: true },
    ).lean();

    responseCache.clear();
    if (isBeingDelivered) {
      try {
        const { responseCache: productsCache } = await import(
          "@/app/api/products/route"
        );
        productsCache?.clear?.();
      } catch {}
    }

    return NextResponse.json({
      message: "Order updated successfully",
      order: updated,
      purchaseCountUpdated: isBeingDelivered || undefined,
    });
  } catch (error) {
    console.error("Update order error (mongoose):", error);
    return NextResponse.json(
      { error: "Failed to update order", details: error.message },
      { status: 500 },
    );
  }
}
