import { NextResponse } from "next/server";
import { getMongooseConnection } from "@/lib/mongoose";
import Review from "@/models/Review";
import Product from "@/models/Product";

export async function PUT(request, { params }) {
  try {
    const { reviewId } = params;
    const body = await request.json();
    const {
      rating,
      comment,
      title,
      pros,
      cons,
      wouldRecommend,
      isAnonymous,
      tags,
      userId,
    } = body;

    if (!rating || !comment || !userId) {
      return NextResponse.json(
        { error: "Rating, comment, and user ID are required" },
        { status: 400 },
      );
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    await getMongooseConnection();
    const existing = await Review.findOne({ _id: reviewId, userId }).lean();
    if (!existing) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 },
      );
    }

    const updateDoc = {
      rating: Number(rating),
      comment,
      updatedAt: new Date(),
    };
    if (title !== undefined) updateDoc.title = title;
    if (pros !== undefined) updateDoc.pros = pros;
    if (cons !== undefined) updateDoc.cons = cons;
    if (wouldRecommend !== undefined) updateDoc.wouldRecommend = wouldRecommend;
    if (isAnonymous !== undefined) updateDoc.isAnonymous = isAnonymous;
    if (tags !== undefined) updateDoc.tags = tags;

    await Review.updateOne({ _id: reviewId }, { $set: updateDoc });

    const { averageRating, totalReviews } = await Review.recomputeProductRating(
      existing.productId,
    );
    await Product.updateOne(
      { _id: existing.productId },
      { $set: { averageRating, totalReviews, reviewCount: totalReviews } },
    );
    return NextResponse.json({
      success: true,
      averageRating,
      totalRatings: totalReviews,
    });
  } catch (error) {
    console.error("Error updating review (mongoose):", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { reviewId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId)
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );

    await getMongooseConnection();
    const existing = await Review.findOne({ _id: reviewId, userId }).lean();
    if (!existing) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 },
      );
    }

    await Review.deleteOne({ _id: reviewId, userId });

    const { averageRating, totalReviews } = await Review.recomputeProductRating(
      existing.productId,
    );
    return NextResponse.json({
      success: true,
      averageRating,
      totalRatings: totalReviews,
    });
  } catch (error) {
    console.error("Error deleting review (mongoose):", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}
