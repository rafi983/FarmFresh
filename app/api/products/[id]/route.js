import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { enhanceProductsWithRatings } from "@/lib/reviewUtils";
import { getMongooseConnection } from "@/lib/mongoose";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Review from "@/models/Review";
import User from "@/models/User";

// Replace calculateProductPerformanceOptimized to use Mongoose
async function calculateProductPerformanceOptimizedMongoose(productId) {
  try {
    await getMongooseConnection();
    const variants = [productId];
    if (ObjectId.isValid(productId)) variants.push(new ObjectId(productId));

    const statusSet = [
      "completed",
      "delivered",
      "confirmed",
      "shipped",
      "pending",
    ];
    const orders = await Order.find({
      status: { $in: statusSet },
      "items.productId": { $in: variants },
    })
      .select("items status")
      .lean();

    let totalSales = 0;
    let totalRevenue = 0;
    let totalOrders = 0;
    for (const o of orders) {
      for (const it of o.items || []) {
        if (variants.includes(it.productId)) {
          totalSales += it.quantity || 0;
          totalRevenue += (it.quantity || 0) * (it.price || 0);
          totalOrders += 1; // counting per item occurrence similar to original grouping
        }
      }
    }

    const reviews = await Review.find({ productId: { $in: variants } })
      .select("rating")
      .lean();
    const reviewCount = reviews.length;
    const avgRating = reviewCount
      ? Math.round(
          (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviewCount) * 10,
        ) / 10
      : 0;

    return {
      totalSales,
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
      totalReviews: reviewCount,
      averageRating: avgRating,
    };
  } catch {
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
    const url = new URL(request.url);
    const isDashboardContext = url.searchParams.get("dashboard") === "true";
    const farmerEmail = url.searchParams.get("farmerEmail");
    await getMongooseConnection();

    // Farmer details mode (by email)
    if (farmerEmail) {
      const farmerProducts = await Product.find({
        "farmer.email": farmerEmail,
        ...(isDashboardContext
          ? { status: { $ne: "deleted" } }
          : { status: { $nin: ["deleted", "inactive"] } }),
      })
        .select(
          "name price image images category stock status farmer isOrganic isFresh",
        )
        .lean();
      if (!farmerProducts.length) {
        return NextResponse.json(
          { error: "Farmer products not found", farmerEmail },
          { status: 404 },
        );
      }
      const farmerInfo = farmerProducts[0].farmer || {
        name: "Local Farmer",
        location: "Bangladesh",
        bio: "Dedicated to providing fresh, high-quality produce using sustainable farming practices.",
      };
      return NextResponse.json({
        isFarmerDetails: true,
        farmer: farmerInfo,
        farmerProducts: farmerProducts.map((p) => ({
          ...p,
          images: combineProductImages(p),
        })),
        totalProducts: farmerProducts.length,
        farmerEmail,
      });
    }

    // Product lookup strictly by _id (string or ObjectId)
    const matchConditions = {
      $or: [
        { _id: id },
        ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : []),
      ],
    };
    if (!isDashboardContext) {
      matchConditions.status = { $nin: ["deleted", "inactive"] };
    } else {
      matchConditions.status = { $ne: "deleted" };
    }
    let targetProduct = await Product.findOne(matchConditions).lean();

    if (!targetProduct) {
      // Legacy embedded product lookup fallback
      const container = await Product.findOne({ "products._id": id }).lean();
      if (container?.products) {
        targetProduct = container.products.find(
          (p) => p._id?.toString() === id,
        );
      }
      if (!targetProduct) {
        return NextResponse.json(
          { error: "Product not found", searchedId: id },
          { status: 404 },
        );
      }
    }

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

    const [enhancedProduct] = await enhanceProductsWithRatings([product]);
    const performanceMetrics =
      await calculateProductPerformanceOptimizedMongoose(id);
    enhancedProduct.performanceMetrics = performanceMetrics;

    let relatedProducts = await Product.find({
      category: enhancedProduct.category,
      _id: { $ne: enhancedProduct._id },
      status: { $ne: "deleted" },
    })
      .select(
        "name price image images category stock farmer isOrganic isFresh averageRating",
      )
      .limit(4)
      .lean();
    relatedProducts = relatedProducts.map((p) => ({
      ...p,
      images: combineProductImages(p),
      farmer: p.farmer || { name: "Local Farmer", location: "Bangladesh" },
      stock: p.stock || 50,
      isOrganic: p.isOrganic || false,
      isFresh: p.isFresh || true,
    }));
    relatedProducts = await enhanceProductsWithRatings(relatedProducts);

    return NextResponse.json({ product: enhancedProduct, relatedProducts });
  } catch (error) {
    console.error("Error fetching product details (mongoose):", error);
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
    await getMongooseConnection();
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }
    const updateData = await request.json();
    delete updateData._id;
    if (
      updateData.status &&
      !["active", "inactive", "deleted"].includes(updateData.status)
    ) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active', 'inactive', or 'deleted'" },
        { status: 400 },
      );
    }
    updateData.updatedAt = new Date();
    const updated = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updated)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error("Error updating product (mongoose):", error);
    return NextResponse.json(
      { error: "Failed to update product", message: error.message },
      { status: 500 },
    );
  }
}

// DELETE - Delete a product
export async function DELETE(request, { params }) {
  try {
    await getMongooseConnection();
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }
    const product = await Product.findById(id).lean();
    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const pending = await Order.findOne({
      "items.productId": id,
      status: { $in: ["pending", "confirmed", "shipped"] },
    }).lean();
    if (pending) {
      return NextResponse.json(
        {
          error:
            "Cannot delete product with pending orders. Please wait for all orders to be completed or cancelled.",
          hasPendingOrders: true,
        },
        { status: 409 },
      );
    }
    await Product.deleteOne({ _id: id });
    await User.updateMany({ favorites: id }, { $pull: { favorites: id } });
    return NextResponse.json({
      message: "Product deleted successfully",
      deletedProductId: id,
    });
  } catch (error) {
    console.error("Error deleting product (mongoose):", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
