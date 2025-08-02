import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  enhanceProductWithRatings,
  enhanceProductsWithRatings,
} from "@/lib/reviewUtils";

// Calculate performance metrics for a product
async function calculateProductPerformanceOptimized(db, productId) {
  try {
    console.log(`Calculating performance metrics for product: ${productId}`);

    // Handle different productId formats (string, ObjectId)
    const productIdVariants = [
      productId,
      productId.toString(),
      ...(ObjectId.isValid(productId) ? [new ObjectId(productId)] : []),
    ];

    // First, let's get orders and reviews separately for better debugging
    const ordersQuery = {
      "items.productId": { $in: productIdVariants },
      status: {
        $in: ["completed", "delivered", "confirmed", "shipped", "pending"],
      },
    };

    console.log("Orders query:", JSON.stringify(ordersQuery));

    // Calculate sales metrics from orders
    const salesPipeline = [
      { $match: ordersQuery },
      { $unwind: "$items" },
      {
        $match: {
          "items.productId": { $in: productIdVariants },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: [
                { $toDouble: "$items.price" },
                { $toInt: "$items.quantity" },
              ],
            },
          },
          totalOrders: { $sum: 1 },
          orderValues: {
            $push: {
              $multiply: [
                { $toDouble: "$items.price" },
                { $toInt: "$items.quantity" },
              ],
            },
          },
        },
      },
    ];

    // Calculate review metrics
    const reviewsPipeline = [
      {
        $match: {
          productId: { $in: productIdVariants },
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ];

    const [salesResult, reviewsResult] = await Promise.all([
      db.collection("orders").aggregate(salesPipeline).toArray(),
      db.collection("reviews").aggregate(reviewsPipeline).toArray(),
    ]);

    const salesData = salesResult[0] || {};
    const reviewsData = reviewsResult[0] || {};

    const performanceMetrics = {
      totalSales: salesData.totalSales || 0,
      totalRevenue: salesData.totalRevenue || 0,
      totalOrders: salesData.totalOrders || 0,
      averageOrderValue:
        salesData.totalOrders > 0
          ? salesData.totalRevenue / salesData.totalOrders
          : 0,
      totalReviews: reviewsData.totalReviews || 0,
      averageRating: reviewsData.averageRating || 0,
    };

    console.log(`Performance metrics for ${productId}:`, performanceMetrics);
    return performanceMetrics;
  } catch (error) {
    console.error("Error calculating performance metrics:", error);
    return {
      totalSales: 0,
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalReviews: 0,
      averageRating: 0,
    };
  }
}

// Initialize indexes for better performance on product details queries
async function initializeProductDetailIndexes(db) {
  try {
    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");
    const reviewsCollection = db.collection("reviews");
    const usersCollection = db.collection("users");

    // Product collection indexes
    await productsCollection.createIndex({ _id: 1 });
    await productsCollection.createIndex({ farmerId: 1 });
    await productsCollection.createIndex({ "farmer.id": 1 });
    await productsCollection.createIndex({ "farmer._id": 1 });
    await productsCollection.createIndex({ category: 1, status: 1 });
    await productsCollection.createIndex({ status: 1 });

    // Orders collection indexes for performance metrics
    await ordersCollection.createIndex({ "items.productId": 1, status: 1 });
    await ordersCollection.createIndex({ status: 1 });

    // Reviews collection indexes
    await reviewsCollection.createIndex({ productId: 1 });

    // Users collection indexes for favorites
    await usersCollection.createIndex({ favorites: 1 });
  } catch (error) {
    console.log("Index creation note:", error.message);
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes for optimal performance
    await initializeProductDetailIndexes(db);

    // Build efficient aggregation pipeline to find the product
    const productPipeline = [
      {
        $match: {
          $or: [
            { _id: id },
            ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : []),
            { farmerId: id },
            { "farmer.id": id },
            { "farmer._id": id },
          ],
        },
      },
      {
        $limit: 1,
      },
    ];

    const [targetProduct] = await db
      .collection("products")
      .aggregate(productPipeline)
      .toArray();

    // If it's a farmer ID, return farmer details with optimized query
    if (targetProduct && targetProduct.farmerId === id) {
      const farmerProductsPipeline = [
        { $match: { farmerId: id } },
        {
          $project: {
            _id: 1,
            name: 1,
            price: 1,
            image: 1,
            images: 1,
            category: 1,
            stock: 1,
            farmer: 1,
            isOrganic: 1,
            isFresh: 1,
          },
        },
      ];

      const farmerProducts = await db
        .collection("products")
        .aggregate(farmerProductsPipeline)
        .toArray();

      const farmerInfo = targetProduct.farmer || {
        name: "Local Farmer",
        location: "Bangladesh",
        bio: "Dedicated to providing fresh, high-quality produce using sustainable farming practices.",
        experience: 5,
        id: id,
      };

      return NextResponse.json({
        isFarmerDetails: true,
        farmer: farmerInfo,
        farmerProducts: farmerProducts.map((p) => ({
          ...p,
          images: combineProductImages(p),
        })),
        totalProducts: farmerProducts.length,
        farmerId: id,
      });
    }

    // Fallback: Search in nested structures if no direct product found
    if (!targetProduct) {
      const nestedProductPipeline = [
        { $match: { products: { $exists: true, $ne: [] } } },
        { $unwind: "$products" },
        {
          $match: {
            $or: [
              { "products._id": id },
              { "products.farmerId": id },
              ...(ObjectId.isValid(id)
                ? [{ "products._id": new ObjectId(id) }]
                : []),
            ],
          },
        },
        { $replaceRoot: { newRoot: "$products" } },
        { $limit: 1 },
      ];

      const [nestedProduct] = await db
        .collection("products")
        .aggregate(nestedProductPipeline)
        .toArray();

      if (!nestedProduct) {
        return NextResponse.json(
          { error: "Product not found", searchedId: id },
          { status: 404 },
        );
      }

      targetProduct = nestedProduct;
    }

    if (!targetProduct) {
      return NextResponse.json(
        { error: "Product not found", searchedId: id },
        { status: 404 },
      );
    }

    // Enhanced product with default values
    const product = {
      ...targetProduct,
      images: combineProductImages(targetProduct),
      farmer: targetProduct.farmer || {
        name: "Local Farmer",
        location: "Bangladesh",
        bio: "Dedicated to providing fresh, high-quality produce using sustainable farming practices.",
        experience: 5,
      },
      stock: targetProduct.stock || 50,
      isOrganic: targetProduct.isOrganic || false,
      isFresh: targetProduct.isFresh || true,
      features: targetProduct.features || [
        "Fresh",
        "Locally sourced",
        "High quality",
      ],
    };

    // Calculate real ratings and review counts from reviews data
    const enhancedProduct = enhanceProductWithRatings(product);

    // Fetch performance metrics using optimized aggregation
    const performanceMetrics = await calculateProductPerformanceOptimized(
      db,
      id,
    );
    enhancedProduct.performanceMetrics = performanceMetrics;

    // Get related products using efficient aggregation
    const relatedProductsPipeline = [
      {
        $match: {
          category: enhancedProduct.category,
          _id: { $ne: enhancedProduct._id },
          status: { $ne: "deleted" },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          image: 1,
          images: 1,
          category: 1,
          stock: 1,
          farmer: 1,
          isOrganic: 1,
          isFresh: 1,
          averageRating: 1,
        },
      },
      { $limit: 4 },
    ];

    const relatedProductsResult = await db
      .collection("products")
      .aggregate(relatedProductsPipeline)
      .toArray();

    let relatedProducts = relatedProductsResult.map((p) => ({
      ...p,
      images: combineProductImages(p),
      farmer: p.farmer || { name: "Local Farmer", location: "Bangladesh" },
      stock: p.stock || 50,
      isOrganic: p.isOrganic || false,
      isFresh: p.isFresh || true,
    }));

    // Calculate real ratings for related products
    relatedProducts = await enhanceProductsWithRatings(relatedProducts, db);

    return NextResponse.json({
      product: enhancedProduct,
      relatedProducts,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details" },
      { status: 500 },
    );
  }
}

// Helper function to combine product images efficiently
function combineProductImages(product) {
  const imageArray = [];

  if (product.image) {
    imageArray.push(product.image);
  }

  if (product.images && Array.isArray(product.images)) {
    imageArray.push(...product.images);
  }

  return [...new Set(imageArray.filter((img) => img && img.trim()))];
}

// PUT - Update a product
export async function PUT(request, { params }) {
  try {
    const client = await clientPromise;
    const db = client.db("farmfresh");
    const { id } = await params;
    const updateData = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }

    // Remove _id from updateData if it exists to avoid conflicts
    delete updateData._id;

    // Add updated timestamp
    updateData.updatedAt = new Date().toISOString();

    const result = await db
      .collection("products")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch the updated product to return
    const updatedProduct = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a product
export async function DELETE(request, { params }) {
  try {
    const client = await clientPromise;
    const db = client.db("farmfresh");
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }

    // First check if product exists
    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Optional: Check if there are any pending orders with this product
    const pendingOrders = await db.collection("orders").findOne({
      "items.productId": id,
      status: { $in: ["pending", "confirmed", "shipped"] },
    });

    if (pendingOrders) {
      return NextResponse.json(
        {
          error:
            "Cannot delete product with pending orders. Please wait for all orders to be completed or cancelled.",
          hasPendingOrders: true,
        },
        { status: 409 },
      );
    }

    // Delete the product
    const result = await db
      .collection("products")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 },
      );
    }

    // Optional: Remove product from any user favorites
    await db
      .collection("users")
      .updateMany({ favorites: id }, { $pull: { favorites: id } });

    return NextResponse.json({
      message: "Product deleted successfully",
      deletedProductId: id,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}

// Helper function to calculate real product performance metrics from orders and reviews
async function calculateProductPerformance(db, productId) {
  try {
    // Handle both string IDs and ObjectIds
    let productIdQuery = productId;
    if (ObjectId.isValid(productId)) {
      productIdQuery = new ObjectId(productId);
    }

    // Calculate sales metrics from completed orders
    const salesData = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            status: { $in: ["completed", "delivered", "shipped"] },
          },
        },
        { $unwind: "$items" },
        {
          $match: {
            $or: [
              { "items.productId": productId },
              { "items.productId": productIdQuery },
              { "items.productId": productId.toString() },
            ],
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$items.quantity" },
            totalRevenue: {
              $sum: { $multiply: ["$items.quantity", "$items.price"] },
            },
            totalOrders: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Calculate review metrics
    const reviewsData = await db
      .collection("reviews")
      .aggregate([
        {
          $match: {
            $or: [
              { productId: productId },
              { productId: productIdQuery },
              { productId: productId.toString() },
            ],
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Get recent orders count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrdersData = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            $or: [
              { createdAt: { $gte: thirtyDaysAgo.toISOString() } },
              { createdAt: { $gte: thirtyDaysAgo } },
            ],
            status: { $in: ["completed", "shipped", "delivered"] },
          },
        },
        { $unwind: "$items" },
        {
          $match: {
            $or: [
              { "items.productId": productId },
              { "items.productId": productIdQuery },
              { "items.productId": productId.toString() },
            ],
          },
        },
        {
          $group: {
            _id: null,
            recentSales: { $sum: "$items.quantity" },
            recentRevenue: {
              $sum: { $multiply: ["$items.quantity", "$items.price"] },
            },
          },
        },
      ])
      .toArray();

    const salesMetrics = salesData[0] || {};
    const reviewsMetrics = reviewsData[0] || {};
    const recentMetrics = recentOrdersData[0] || {};

    return {
      totalSales: salesMetrics.totalSales || 0,
      totalRevenue: salesMetrics.totalRevenue || 0,
      totalOrders: salesMetrics.totalOrders || 0,
      averageRating: reviewsMetrics.averageRating || 0,
      totalReviews: reviewsMetrics.totalReviews || 0,
      recentSales: recentMetrics.recentSales || 0,
      recentRevenue: recentMetrics.recentRevenue || 0,
      // Add some calculated metrics
      averageOrderValue:
        salesMetrics.totalOrders > 0
          ? salesMetrics.totalRevenue / salesMetrics.totalOrders
          : 0,
      salesTrend: recentMetrics.recentSales > 0 ? "up" : "stable",
    };
  } catch (error) {
    console.error("Error calculating product performance:", error);
    return {
      totalSales: 0,
      totalRevenue: 0,
      totalOrders: 0,
      averageRating: 0,
      totalReviews: 0,
      recentSales: 0,
      recentRevenue: 0,
      averageOrderValue: 0,
      salesTrend: "stable",
    };
  }
}
