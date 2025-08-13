import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Track if indexes have been initialized
let indexesInitialized = false;

// Initialize indexes for reorder operations
async function initializeReorderIndexes(db) {
  if (indexesInitialized) {
    return;
  }

  try {
    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");

    const existingProductIndexes = await productsCollection
      .listIndexes()
      .toArray();
    const existingOrderIndexes = await ordersCollection.listIndexes().toArray();

    const productIndexNames = existingProductIndexes.map((index) => index.name);
    const orderIndexNames = existingOrderIndexes.map((index) => index.name);

    // Reorder-specific indexes
    const indexesToCreate = [
      {
        collection: "products",
        index: { _id: 1, status: 1, stock: 1 },
        name: "reorder_product_validation_idx",
      },
      {
        collection: "products",
        index: { farmerId: 1, status: 1 },
        name: "reorder_farmer_products_idx",
      },
      {
        collection: "orders",
        index: { _id: 1, userId: 1, status: 1 },
        name: "reorder_order_lookup_idx",
      },
    ];

    for (const indexSpec of indexesToCreate) {
      const collection = db.collection(indexSpec.collection);
      const existingNames =
        indexSpec.collection === "products"
          ? productIndexNames
          : orderIndexNames;

      if (!existingNames.includes(indexSpec.name)) {
        await collection.createIndex(indexSpec.index, {
          name: indexSpec.name,
          background: true,
        });
      }
    }

    indexesInitialized = true;
    console.log("Reorder indexes initialized successfully");
  } catch (error) {
    console.log("Reorder index initialization note:", error.message);
  }
}

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

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes
    await initializeReorderIndexes(db);

    // Fetch original order with full item data for debugging
    const orderPipeline = [
      {
        $match: {
          _id: new ObjectId(orderId),
          userId: userId,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          status: 1,
          items: 1,
          createdAt: 1,
          total: 1,
          subtotal: 1,
          deliveryFee: 1,
          serviceFee: 1,
        },
      },
      { $limit: 1 },
    ];

    const orders = await db
      .collection("orders")
      .aggregate(orderPipeline)
      .toArray();

    if (!orders.length) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 },
      );
    }

    const originalOrder = orders[0];

    // Debug: Log the original order items to understand data structure
    console.log(
      "Original order items:",
      JSON.stringify(originalOrder.items, null, 2),
    );

    // Debug: Log the full original order for analysis
    console.log(
      "Full original order data:",
      JSON.stringify(originalOrder, null, 2),
    );

    // Extract product IDs - handle different field structures
    const productIds = originalOrder.items
      .map((item) => {
        // Try different possible field names for product ID
        const productId = item.productId || item.id || item._id;
        console.log(
          "Extracting productId:",
          productId,
          "from item:",
          item.productName || item.name,
        );

        // Ensure it's a valid ObjectId
        if (productId && ObjectId.isValid(productId)) {
          return new ObjectId(productId);
        }
        return null;
      })
      .filter(Boolean); // Remove null values

    console.log(
      "Product IDs to lookup:",
      productIds.map((id) => id.toString()),
    );

    if (productIds.length === 0) {
      return NextResponse.json(
        {
          error: "No valid product IDs found in order items",
          debug: {
            originalItems: originalOrder.items,
            extractedIds: productIds,
          },
        },
        { status: 400 },
      );
    }

    // Validate products with aggregation pipeline
    const productValidationPipeline = [
      {
        $match: {
          _id: { $in: productIds },
        },
      },
      {
        $addFields: {
          // Convert farmerId to ObjectId only if it's a valid 24-character ObjectId string
          farmerObjectId: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: "$farmerId" }, "string"] },
                  { $eq: [{ $strLenCP: "$farmerId" }, 24] },
                  {
                    $regexMatch: {
                      input: "$farmerId",
                      regex: /^[0-9a-fA-F]{24}$/,
                    },
                  },
                ],
              },
              then: { $toObjectId: "$farmerId" },
              else: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            farmerId: "$farmerId",
            farmerObjectId: "$farmerObjectId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$_id", "$$farmerId"] },
                    { $eq: ["$_id", "$$farmerObjectId"] },
                    { $eq: [{ $toString: "$_id" }, "$$farmerId"] },
                  ],
                },
              },
            },
          ],
          as: "farmerInfo",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          stock: 1,
          status: 1,
          farmerId: 1,
          image: 1,
          images: 1,
          category: 1,
          description: 1,
          farmerInfo: { $arrayElemAt: ["$farmerInfo", 0] },
        },
      },
    ];

    const currentProducts = await db
      .collection("products")
      .aggregate(productValidationPipeline)
      .toArray();

    // Debug: Log products with their farmer info
    currentProducts.forEach((product) => {
      console.log(
        `Product: ${product.name}, FarmerId: ${product.farmerId}, FarmerInfo found: ${!!product.farmerInfo}, FarmerInfo:`,
        product.farmerInfo,
      );
    });

    // Create product lookup map
    const productMap = new Map(
      currentProducts.map((p) => [p._id.toString(), p]),
    );

    // Validate each original item
    const validationResults = {
      availableItems: [],
      unavailableItems: [],
      priceChanges: [],
      stockIssues: [],
      farmerIssues: [],
    };

    for (const originalItem of originalOrder.items) {
      // Handle different product ID field structures
      const productId =
        originalItem.productId || originalItem.id || originalItem._id;
      const currentProduct = productMap.get(productId);

      console.log(
        `Processing item: ${originalItem.productName || originalItem.name}, ProductId: ${productId}, Found: ${!!currentProduct}`,
      );

      const itemResult = {
        ...originalItem,
        originalPrice: originalItem.price,
        productId: productId, // Ensure productId is set
      };

      if (!currentProduct) {
        console.log(`Product not found for ID: ${productId}`);
        validationResults.unavailableItems.push({
          ...itemResult,
          reason: "Product no longer available",
        });
        continue;
      }

      console.log(
        `Product found: ${currentProduct.name}, Status: ${currentProduct.status}, Stock: ${currentProduct.stock}, Price: ${currentProduct.price}`,
      );

      // Check product status
      if (currentProduct.status !== "active") {
        console.log(
          `Product ${currentProduct.name} is not active. Status: ${currentProduct.status}`,
        );
        validationResults.unavailableItems.push({
          ...itemResult,
          reason: "Product is currently inactive",
        });
        continue;
      }

      // Check farmer status
      if (
        !currentProduct.farmerInfo ||
        currentProduct.farmerInfo.userType !== "farmer"
      ) {
        console.log(
          `Farmer issue for ${currentProduct.name}. FarmerInfo:`,
          currentProduct.farmerInfo,
        );
        validationResults.farmerIssues.push({
          ...itemResult,
          reason: "Farmer account unavailable",
        });
        continue;
      }

      // Check stock availability
      if (currentProduct.stock < originalItem.quantity) {
        console.log(
          `Stock issue for ${currentProduct.name}. Available: ${currentProduct.stock}, Requested: ${originalItem.quantity}`,
        );
        validationResults.stockIssues.push({
          ...itemResult,
          availableStock: currentProduct.stock,
          requestedQuantity: originalItem.quantity,
          reason: `Only ${currentProduct.stock} items available`,
        });
        continue;
      }

      // Check for price changes
      const priceDifference = currentProduct.price - originalItem.price;
      if (Math.abs(priceDifference) > 0.01) {
        console.log(
          `Price change detected for ${currentProduct.name}. Original: ${originalItem.price}, Current: ${currentProduct.price}, Difference: ${priceDifference}`,
        );
        validationResults.priceChanges.push({
          ...itemResult,
          currentPrice: currentProduct.price,
          priceDifference: priceDifference,
          priceChangePercent: (
            (priceDifference / originalItem.price) *
            100
          ).toFixed(2),
        });
      }

      console.log(
        `Adding ${currentProduct.name} to available items with price: ${currentProduct.price}, quantity: ${originalItem.quantity}`,
      );

      // Item is available for reorder
      validationResults.availableItems.push({
        productId: currentProduct._id.toString(),
        productName: currentProduct.name,
        quantity: originalItem.quantity,
        price: currentProduct.price, // Use current product price
        originalPrice: originalItem.price,
        farmerId: currentProduct.farmerId,
        farmerName: currentProduct.farmerInfo?.name || "Local Farmer",
        image: currentProduct.image || currentProduct.images?.[0],
        stock: currentProduct.stock,
        category: currentProduct.category,
        description: currentProduct.description,
        subtotal: currentProduct.price * originalItem.quantity, // Calculate correct subtotal
      });

      console.log(
        `Available items count after adding: ${validationResults.availableItems.length}`,
      );
    }

    // Calculate summary statistics
    const summary = {
      totalOriginalItems: originalOrder.items.length,
      availableCount: validationResults.availableItems.length,
      unavailableCount: validationResults.unavailableItems.length,
      priceChangesCount: validationResults.priceChanges.length,
      stockIssuesCount: validationResults.stockIssues.length,
      farmerIssuesCount: validationResults.farmerIssues.length,
      reorderSuccess: validationResults.availableItems.length > 0,
      fullReorderPossible:
        validationResults.availableItems.length === originalOrder.items.length,
    };

    // Calculate estimated totals using current product prices
    const estimatedSubtotal = validationResults.availableItems.reduce(
      (sum, item) => {
        const itemTotal = item.price * item.quantity;
        console.log(
          `Item: ${item.productName}, Price: ${item.price}, Quantity: ${item.quantity}, Subtotal: ${itemTotal}`,
        );
        return sum + itemTotal;
      },
      0,
    );

    console.log(`Total estimatedSubtotal: ${estimatedSubtotal}`);

    const estimatedDeliveryFee = 50; // Default delivery fee
    const estimatedServiceFee = 0; // Default service fee
    const estimatedTotal =
      estimatedSubtotal + estimatedDeliveryFee + estimatedServiceFee;

    // Calculate original order subtotal for comparison
    const originalSubtotal =
      originalOrder.subtotal ||
      originalOrder.items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        console.log(
          `Original item: ${item.productName || item.name}, Price: ${item.price}, Quantity: ${item.quantity}, Subtotal: ${itemTotal}`,
        );
        return sum + itemTotal;
      }, 0);

    console.log(
      `Original subtotal: ${originalSubtotal}, Estimated subtotal: ${estimatedSubtotal}, Estimated total: ${estimatedTotal}`,
    );

    // Debug: Log the final pricing object
    const pricingData = {
      estimatedSubtotal,
      estimatedDeliveryFee,
      estimatedServiceFee,
      estimatedTotal,
      originalTotal: originalOrder.total,
      originalSubtotal: originalSubtotal,
      totalDifference: estimatedTotal - (originalOrder.total || 0),
      subtotalDifference: estimatedSubtotal - originalSubtotal,
    };

    console.log("Final pricing data:", JSON.stringify(pricingData, null, 2));

    return NextResponse.json({
      success: true,
      originalOrder: {
        id: originalOrder._id,
        itemCount: originalOrder.items.length,
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
        originalSubtotal: originalSubtotal,
        totalDifference: estimatedTotal - (originalOrder.total || 0),
        subtotalDifference: estimatedSubtotal - originalSubtotal,
      },
      meta: {
        validatedAt: new Date().toISOString(),
        orderId: orderId,
        userId: userId,
      },
    });
  } catch (error) {
    console.error("Reorder validation error:", error);
    return NextResponse.json(
      {
        error: "Failed to validate reorder",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
