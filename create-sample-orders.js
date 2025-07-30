// Script to create sample orders for testing performance metrics
const { MongoClient } = require("mongodb");

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://shanikur05:LksrYKU8MdSpw4W8@cluster0.hqhbv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function createSampleOrders() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("farmfresh");

    // First, let's get some existing products to create orders for
    const products = await db
      .collection("products")
      .find({})
      .limit(5)
      .toArray();

    if (products.length === 0) {
      console.log("No products found. Please add some products first.");
      return;
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
        _id: new Date().getTime().toString() + i, // Simple ID generation
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
        status: ["completed", "delivered", "shipped", "pending"][
          Math.floor(Math.random() * 4)
        ],
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

    // Display summary
    console.log("\n📊 Sample Order Summary:");
    for (const order of sampleOrders) {
      console.log(
        `- Order ${order._id}: ${order.items[0].productName} (${order.items[0].quantity}x) - ${order.status} - ৳${order.totalAmount}`,
      );
    }

    console.log(
      "\n🎉 Sample orders created successfully! The performance metrics should now show real data.",
    );
  } catch (error) {
    console.error("Error creating sample orders:", error);
  } finally {
    await client.close();
  }
}

createSampleOrders();
