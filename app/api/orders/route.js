import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const orderId = searchParams.get("orderId");
    const farmerId = searchParams.get("farmerId");
    const farmerEmail = searchParams.get("farmerEmail");
    const productId = searchParams.get("productId");
    const limit = parseInt(searchParams.get("limit")) || null;

    console.log("Orders API - Params:", {
      userId,
      orderId,
      farmerId,
      farmerEmail,
      productId,
      limit,
    });

    if (!userId && !orderId && !farmerId && !farmerEmail && !productId) {
      return NextResponse.json(
        {
          error:
            "User ID, Order ID, Farmer ID, Farmer Email, or Product ID is required",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    if (orderId) {
      // Get specific order
      const order = await db
        .collection("orders")
        .findOne({ _id: new ObjectId(orderId) });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json({ order });
    } else if (productId) {
      // Get orders containing a specific product
      console.log("Fetching orders for productId:", productId);

      const productSearchCriteria = [
        { "products.productId": productId },
        { "products._id": productId },
        { "items.productId": productId },
        { "items._id": productId },
      ];

      // Also try ObjectId if the productId is a valid ObjectId
      if (ObjectId.isValid(productId)) {
        productSearchCriteria.push(
          { "products.productId": new ObjectId(productId) },
          { "products._id": new ObjectId(productId) },
          { "items.productId": new ObjectId(productId) },
          { "items._id": new ObjectId(productId) },
        );
      }

      let query = { $or: productSearchCriteria };
      let orders = await db
        .collection("orders")
        .find(query)
        .sort({ createdAt: -1 });

      if (limit) {
        orders = orders.limit(limit);
      }

      const ordersArray = await orders.toArray();

      console.log(
        `Found ${ordersArray.length} orders containing product ${productId}`,
      );

      // Filter and transform orders to show only items for this product
      const filteredOrders = ordersArray
        .map((order) => {
          // Find items/products that match the productId
          const matchingItems = [];

          // Check both 'products' and 'items' arrays (different orders might use different structures)
          if (order.products) {
            const products = order.products.filter(
              (item) =>
                item.productId === productId ||
                item._id === productId ||
                (ObjectId.isValid(productId) &&
                  (item.productId?.toString() === productId ||
                    item._id?.toString() === productId)),
            );
            matchingItems.push(...products);
          }

          if (order.items) {
            const items = order.items.filter(
              (item) =>
                item.productId === productId ||
                item._id === productId ||
                (ObjectId.isValid(productId) &&
                  (item.productId?.toString() === productId ||
                    item._id?.toString() === productId)),
            );
            matchingItems.push(...items);
          }

          return {
            ...order,
            products: matchingItems,
            items: matchingItems, // Ensure both fields are available
            matchingItemsCount: matchingItems.length,
          };
        })
        .filter((order) => order.matchingItemsCount > 0); // Only include orders with matching items

      console.log(
        `Filtered to ${filteredOrders.length} orders with matching product items`,
      );

      return NextResponse.json({
        orders: filteredOrders,
        total: filteredOrders.length,
      });
    } else if (farmerId || farmerEmail) {
      // Get orders for farmer - orders containing their products
      console.log(
        "Fetching orders for farmer - farmerId:",
        farmerId,
        "farmerEmail:",
        farmerEmail,
      );

      const farmerSearchCriteria = [];

      if (farmerId) {
        farmerSearchCriteria.push(
          { farmerIds: farmerId },
          { farmerIds: farmerId.toString() },
          { "items.farmerId": farmerId },
          { "items.farmerId": farmerId.toString() },
        );

        if (ObjectId.isValid(farmerId)) {
          farmerSearchCriteria.push(
            { farmerIds: new ObjectId(farmerId) },
            { "items.farmerId": new ObjectId(farmerId) },
          );
        }
      }

      if (farmerEmail) {
        farmerSearchCriteria.push(
          { farmerEmails: farmerEmail },
          { "items.farmerEmail": farmerEmail },
        );
      }

      const orders = await db
        .collection("orders")
        .find({ $or: farmerSearchCriteria })
        .sort({ createdAt: -1 })
        .toArray();

      console.log("Farmer orders found:", orders.length);

      // Filter items in each order to only show items from this farmer
      const filteredOrders = orders.map((order) => ({
        ...order,
        items: order.items.filter((item) => {
          // Helper function to check if item belongs to this farmer
          const itemBelongsToFarmer = () => {
            // If we have farmerId, check against it
            if (farmerId) {
              // Direct string comparison
              if (
                item.farmerId === farmerId ||
                item.farmerId === farmerId.toString()
              ) {
                return true;
              }

              // ObjectId comparison if farmerId is valid ObjectId
              if (
                ObjectId.isValid(farmerId) &&
                item.farmerId?.toString() === farmerId
              ) {
                return true;
              }

              // Check if farmerId is stored as email (legacy orders)
              if (farmerEmail && item.farmerId === farmerEmail) {
                return true;
              }
            }

            // If we have farmerEmail, check against farmerEmail field or farmerId field
            if (farmerEmail) {
              if (
                item.farmerEmail === farmerEmail ||
                item.farmerId === farmerEmail
              ) {
                return true;
              }
            }

            return false;
          };

          return itemBelongsToFarmer();
        }),
        // Recalculate totals for farmer's items only
        farmerSubtotal: order.items
          .filter((item) => {
            // Use the same logic for subtotal calculation
            if (farmerId) {
              // Direct string comparison
              if (
                item.farmerId === farmerId ||
                item.farmerId === farmerId.toString()
              ) {
                return true;
              }

              // ObjectId comparison if farmerId is valid ObjectId
              if (
                ObjectId.isValid(farmerId) &&
                item.farmerId?.toString() === farmerId
              ) {
                return true;
              }

              // Check if farmerId is stored as email (legacy orders)
              if (farmerEmail && item.farmerId === farmerEmail) {
                return true;
              }
            }

            // If we have farmerEmail, check against farmerEmail field or farmerId field
            if (farmerEmail) {
              if (
                item.farmerEmail === farmerEmail ||
                item.farmerId === farmerEmail
              ) {
                return true;
              }
            }

            return false;
          })
          .reduce((sum, item) => sum + item.price * item.quantity, 0),
      }));

      console.log(`Found ${orders.length} total orders for farmer`);

      // Log each order before filtering
      orders.forEach((order, index) => {
        console.log(`Order ${index + 1} (${order._id}):`, {
          totalItems: order.items?.length || 0,
          itemsFarmers:
            order.items?.map((item) => ({
              name: item.name || item.productName,
              farmerId: item.farmerId,
              farmerEmail: item.farmerEmail,
            })) || [],
          status: order.status,
        });
      });

      console.log(
        `Filtered orders (with farmer items):`,
        filteredOrders.filter((order) => order.items.length > 0).length,
      );

      // Log why orders are being filtered out
      filteredOrders.forEach((order, index) => {
        if (order.items.length === 0) {
          console.log(
            `Order ${order._id} filtered out - no matching items for farmer`,
          );
        } else {
          console.log(
            `Order ${order._id} kept - has ${order.items.length} matching items`,
          );
        }
      });

      console.log(
        `Sample filtered order:`,
        filteredOrders.find((order) => order.items.length > 0),
      );

      return NextResponse.json({
        orders: filteredOrders.filter((order) => order.items.length > 0),
        message: `Found ${filteredOrders.filter((order) => order.items.length > 0).length} orders for farmer`,
      });
    } else {
      // Get orders for customer
      console.log("Fetching orders for customer - userId:", userId);

      const customerSearchCriteria = { userId: userId };

      // Try different ID formats
      if (ObjectId.isValid(userId)) {
        customerSearchCriteria.$or = [
          { userId: userId },
          { userId: new ObjectId(userId) },
        ];
        delete customerSearchCriteria.userId;
      }

      const orders = await db
        .collection("orders")
        .find(customerSearchCriteria)
        .sort({ createdAt: -1 })
        .toArray();

      console.log("Customer orders found:", orders.length);

      return NextResponse.json({
        orders,
        message: `Found ${orders.length} orders for customer`,
      });
    }
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const orderData = await request.json();

    console.log("Creating new order:", orderData);

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Add timestamps
    const newOrder = {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("orders").insertOne(newOrder);

    console.log("Order created with ID:", result.insertedId);

    return NextResponse.json({
      message: "Order created successfully",
      orderId: result.insertedId,
      order: { ...newOrder, _id: result.insertedId },
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

    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Failed to update order", details: error.message },
      { status: 500 },
    );
  }
}
