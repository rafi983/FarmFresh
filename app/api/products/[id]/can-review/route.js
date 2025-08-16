import { NextResponse } from "next/server";
import { getMongooseConnection } from "@/lib/mongoose";
import Order from "@/models/Order";
import Review from "@/models/Review";
import User from "@/models/User";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { canReview: false, reason: "User not authenticated" },
        { status: 401 },
      );
    }
    if (!id) {
      return NextResponse.json(
        { canReview: false, reason: "Product ID required" },
        { status: 400 },
      );
    }

    await getMongooseConnection();

    const idVariants = [id];
    if (ObjectId.isValid(id)) idVariants.push(new ObjectId(id));

    // Delivered purchase check (supports string or ObjectId productId in items)
    const purchaseCheck = await Order.findOne({
      userId: userId,
      status: "delivered",
      "items.productId": { $in: idVariants },
    })
      .select("_id userId status items createdAt updatedAt")
      .lean();

    if (!purchaseCheck) {
      return NextResponse.json({
        canReview: false,
        reason:
          "You must purchase and receive this product before writing a review",
        hasPurchased: false,
        hasReviewed: false,
      });
    }

    // Get current user's email
    const currentUser = await User.findById(userId).select("email").lean();
    if (!currentUser?.email) {
      return NextResponse.json({
        canReview: false,
        reason: "User email not found",
        hasPurchased: true,
        hasReviewed: false,
      });
    }

    // Find all user accounts with same email
    const sameEmailUsers = await User.find({ email: currentUser.email })
      .select("_id")
      .lean();
    const sameEmailUserIds = sameEmailUsers.map((u) => u._id.toString());

    // Check if any user with same email has reviewed this product
    const existingReview = await Review.findOne({
      productId: { $in: idVariants },
      userId: { $in: sameEmailUserIds },
    })
      .select("_id rating comment createdAt userId productId")
      .lean();

    if (existingReview) {
      return NextResponse.json({
        canReview: false,
        reason: "You have already reviewed this product",
        hasPurchased: true,
        hasReviewed: true,
        existingReview: {
          _id: existingReview._id,
          id: existingReview._id,
          rating: existingReview.rating,
          comment: existingReview.comment,
          createdAt: existingReview.createdAt,
          userId: existingReview.userId,
          productId: existingReview.productId,
        },
      });
    }

    return NextResponse.json({
      canReview: true,
      reason: "You can write a review for this product",
      hasPurchased: true,
      hasReviewed: false,
      existingReview: null,
      orderDetails: {
        orderId: purchaseCheck._id,
        orderDate: purchaseCheck.createdAt,
        deliveredDate: purchaseCheck.updatedAt,
      },
    });
  } catch (error) {
    console.error("can-review error (mongoose):", error);
    return NextResponse.json(
      {
        canReview: false,
        reason: "Server error while checking review eligibility",
      },
      { status: 500 },
    );
  }
}
