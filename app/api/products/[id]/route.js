import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  enhanceProductWithRatings,
  enhanceProductsWithRatings,
} from "@/lib/reviewUtils";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // First try to find product by string ID (most products use string IDs)
    let targetProduct = await db.collection("products").findOne({ _id: id });

    // If not found, try with ObjectId (for MongoDB generated IDs)
    if (!targetProduct && ObjectId.isValid(id)) {
      targetProduct = await db
        .collection("products")
        .findOne({ _id: new ObjectId(id) });
    }

    // If still not found, try searching in nested structures (legacy support)
    if (!targetProduct) {
      const productDocuments = await db
        .collection("products")
        .find({})
        .toArray();

      productDocuments.forEach((doc) => {
        if (doc.products && Array.isArray(doc.products)) {
          const found = doc.products.find(
            (product) => product._id === id || product._id.toString() === id,
          );
          if (found) {
            targetProduct = found;
          }
        }
      });
    }

    if (!targetProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get all products for finding related products
    let allProducts = await db.collection("products").find({}).toArray();

    // If products are in nested structure, extract them
    if (allProducts.length > 0 && allProducts[0].products) {
      let extractedProducts = [];
      allProducts.forEach((doc) => {
        if (doc.products && Array.isArray(doc.products)) {
          extractedProducts = extractedProducts.concat(doc.products);
        }
      });
      allProducts = extractedProducts;
    }

    // Add default values for missing fields
    const product = {
      ...targetProduct,
      // Combine both image sources - single image field and images array
      images: (() => {
        const imageArray = [];

        // Add single image if it exists
        if (targetProduct.image) {
          imageArray.push(targetProduct.image);
        }

        // Add images array if it exists
        if (targetProduct.images && Array.isArray(targetProduct.images)) {
          imageArray.push(...targetProduct.images);
        }

        // Remove duplicates and empty values
        return [...new Set(imageArray.filter((img) => img && img.trim()))];
      })(),
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

    // Fetch real performance metrics from orders collection
    const performanceMetrics = await calculateProductPerformance(db, id);

    // Add performance metrics to the product
    enhancedProduct.performanceMetrics = performanceMetrics;

    // Get related products (same category, exclude current product)
    let relatedProducts = allProducts
      .filter(
        (p) =>
          p.category === enhancedProduct.category &&
          p._id !== enhancedProduct._id,
      )
      .slice(0, 4)
      .map((p) => ({
        ...p,
        // Fix related products images too - combine both sources
        images: (() => {
          const imageArray = [];

          // Add single image if it exists
          if (p.image) {
            imageArray.push(p.image);
          }

          // Add images array if it exists
          if (p.images && Array.isArray(p.images)) {
            imageArray.push(...p.images);
          }

          // Remove duplicates and empty values
          return [...new Set(imageArray.filter((img) => img && img.trim()))];
        })(),
        farmer: p.farmer || { name: "Local Farmer", location: "Bangladesh" },
        stock: p.stock || 50,
        isOrganic: p.isOrganic || false,
        isFresh: p.isFresh || true,
      }));

    // Calculate real ratings for related products too
    relatedProducts = enhanceProductsWithRatings(relatedProducts);

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

// PUT - Update a product
export async function PUT(request, { params }) {
  try {
    const client = await clientPromise;
    const db = client.db("farmfresh");
    const { id } = params;
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
    const { id } = params;

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
            status: "completed",
          },
        },
        { $unwind: "$items" },
        {
          $match: {
            $or: [
              { "items.productId": productId },
              { "items.productId": productIdQuery },
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
            $or: [{ productId: productId }, { productId: productIdQuery }],
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
            createdAt: { $gte: thirtyDaysAgo.toISOString() },
            status: { $in: ["completed", "shipped", "delivered"] },
          },
        },
        { $unwind: "$items" },
        {
          $match: {
            $or: [
              { "items.productId": productId },
              { "items.productId": productIdQuery },
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
