import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = params; // product ID
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log("🔍 Can-review API called:", { productId: id, userId });
    console.log("🔍 Full request details:", {
      url: request.url,
      searchParams: Array.from(searchParams.entries()),
      headers: Object.fromEntries(request.headers.entries()),
    });

    if (!userId) {
      console.log("❌ No userId provided");
      return NextResponse.json(
        { canReview: false, reason: "User not authenticated" },
        { status: 401 },
      );
    }

    if (!id) {
      console.log("❌ No product ID provided");
      return NextResponse.json(
        { canReview: false, reason: "Product ID required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");
    const ordersCollection = db.collection("orders");
    const reviewsCollection = db.collection("reviews");

    console.log("🏪 Database connection established");

    // Build query to check if user has purchased and received this product
    const userIdConditions = [{ userId: userId }]; // Direct string match

    // Only add ObjectId condition if userId is a valid ObjectId format
    if (ObjectId.isValid(userId)) {
      userIdConditions.push({ userId: new ObjectId(userId) });
    }

    // Build product ID conditions
    const productIdConditions = [id];
    if (ObjectId.isValid(id)) {
      productIdConditions.push(new ObjectId(id));
    }

    console.log("🔍 Checking purchase history:", {
      userIdConditions,
      productIdConditions,
      userId,
      productId: id,
    });

    // Check if user has a delivered order with this product
    const purchaseQuery = {
      $and: [
        {
          $or: userIdConditions,
        },
        {
          "items.productId": { $in: productIdConditions },
        },
        {
          status: "delivered", // Only delivered orders are eligible for reviews
        },
      ],
    };

    console.log("📋 Purchase query:", JSON.stringify(purchaseQuery, null, 2));

    const purchaseCheck = await ordersCollection.findOne(purchaseQuery);

    console.log(
      "💳 Purchase check result:",
      purchaseCheck ? "FOUND" : "NOT FOUND",
    );

    if (purchaseCheck) {
      console.log("📦 Found matching order:", {
        orderId: purchaseCheck._id,
        userId: purchaseCheck.userId,
        status: purchaseCheck.status,
        items: purchaseCheck.items?.map((item) => ({
          productId: item.productId,
          name: item.name,
        })),
        createdAt: purchaseCheck.createdAt,
        updatedAt: purchaseCheck.updatedAt,
      });
    }

    if (!purchaseCheck) {
      console.log(
        "❌ No delivered order found for this user-product combination",
      );
      return NextResponse.json({
        canReview: false,
        reason:
          "You must purchase and receive this product before writing a review",
        hasPurchased: false,
        debug: {
          query: purchaseQuery,
          userIdConditions,
          productIdConditions,
        },
      });
    }

    // Check if user has already reviewed this product
    const existingReviewQuery = {
      $and: [
        {
          $or: userIdConditions,
        },
        {
          productId: { $in: productIdConditions },
        },
      ],
    };

    console.log(
      "📝 Checking existing review query:",
      JSON.stringify(existingReviewQuery, null, 2),
    );

    const existingReview = await reviewsCollection.findOne(existingReviewQuery);

    console.log(
      "📝 Existing review check:",
      existingReview ? "FOUND" : "NOT FOUND",
    );

    if (existingReview) {
      return NextResponse.json({
        canReview: false,
        reason: "You have already reviewed this product",
        hasPurchased: true,
        hasReviewed: true,
        existingReview: {
          id: existingReview._id,
          rating: existingReview.rating,
          comment: existingReview.comment,
          createdAt: existingReview.createdAt,
        },
      });
    }

    // User has purchased and received the product, and hasn't reviewed it yet
    console.log("✅ User can review this product");

    return NextResponse.json({
      canReview: true,
      reason: "You can write a review for this product",
      hasPurchased: true,
      hasReviewed: false,
      orderDetails: {
        orderId: purchaseCheck._id,
        orderDate: purchaseCheck.createdAt,
        deliveredDate: purchaseCheck.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error in can-review API:", error);
    return NextResponse.json(
      {
        canReview: false,
        reason: "Server error while checking review eligibility",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
