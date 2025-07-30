import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db("farmfresh");

    // First, let's get some existing products to create orders for
    const products = await db
      .collection("products")
      .find({})
      .limit(5)
      .toArray();

    if (products.length === 0) {
      return NextResponse.json(
        { error: "No products found. Please add some products first." },
        { status: 400 },
      );
    }

    console.log(`Found ${products.length} products. Creating sample orders...`);

    // Create sample orders
    const sampleOrders = [];

    // Create 10 sample orders with different statuses
    for (let i = 0; i < 10; i++) {
      const randomProduct =
        products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 quantity
      const price = parseFloat(randomProduct.price) || 100;

      // Create orders from different dates (last 60 days)
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 60));

      const order = {
        _id: new ObjectId(),
        userId: "sample-user-" + (i % 3), // 3 different users
        userEmail: `user${i % 3}@example.com`,
        items: [
          {
            productId: randomProduct._id,
            productName: randomProduct.name,
            quantity: quantity,
            price: price,
            farmerId: randomProduct.farmerId || "sample-farmer-1",
            farmerEmail: randomProduct.farmerEmail || "farmer@example.com",
          },
        ],
        totalAmount: quantity * price,
        status: ["completed", "delivered", "shipped"][
          Math.floor(Math.random() * 3)
        ], // Only successful statuses
        createdAt: orderDate.toISOString(),
        updatedAt: orderDate.toISOString(),
        shippingAddress: {
          street: "123 Sample Street",
          city: "Dhaka",
          country: "Bangladesh",
          postalCode: "1000",
        },
        paymentMethod: "cash_on_delivery",
      };

      sampleOrders.push(order);
    }

    // Insert the orders
    const result = await db.collection("orders").insertMany(sampleOrders);
    console.log(`✅ Created ${result.insertedCount} sample orders`);

    // Return summary
    const summary = sampleOrders.map((order) => ({
      orderId: order._id,
      productName: order.items[0].productName,
      quantity: order.items[0].quantity,
      status: order.status,
      totalAmount: order.totalAmount,
      date: order.createdAt.split("T")[0],
    }));

    return NextResponse.json({
      message: `✅ Created ${result.insertedCount} sample orders`,
      orders: summary,
    });
  } catch (error) {
    console.error("Error creating sample orders:", error);
    return NextResponse.json(
      { error: "Failed to create sample orders" },
      { status: 500 },
    );
  }
}
