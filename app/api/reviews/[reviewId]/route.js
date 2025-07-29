import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request, { params }) {
  try {
    const { reviewId } = params;
    const { rating, comment, userId } = await request.json();

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

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Check if review exists and belongs to user
    const existingReview = await db.collection("reviews").findOne({
      _id: new ObjectId(reviewId),
      userId,
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 },
      );
    }

    // Update review
    await db.collection("reviews").updateOne(
      { _id: new ObjectId(reviewId) },
      {
        $set: {
          rating: parseInt(rating),
          comment,
          updatedAt: new Date(),
        },
      },
    );

    // Recalculate product average rating
    const allReviews = await db
      .collection("reviews")
      .find({
        productId: existingReview.productId,
      })
      .toArray();

    const averageRating =
      allReviews.reduce(
        (sum, review) =>
          sum +
          (review._id.toString() === reviewId
            ? parseInt(rating)
            : review.rating),
        0,
      ) / allReviews.length;

    await db.collection("products").updateOne(
      { _id: new ObjectId(existingReview.productId) },
      {
        $set: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: allReviews.length,
        },
      },
    );

    return NextResponse.json({
      success: true,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: allReviews.length,
    });
  } catch (error) {
    console.error("Error updating review:", error);
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

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Check if review exists and belongs to user
    const existingReview = await db.collection("reviews").findOne({
      _id: new ObjectId(reviewId),
      userId,
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 },
      );
    }

    // Delete review
    await db.collection("reviews").deleteOne({ _id: new ObjectId(reviewId) });

    // Recalculate product average rating
    const allReviews = await db
      .collection("reviews")
      .find({
        productId: existingReview.productId,
      })
      .toArray();

    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, review) => sum + review.rating, 0) /
          allReviews.length
        : 0;

    await db.collection("products").updateOne(
      { _id: new ObjectId(existingReview.productId) },
      {
        $set: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: allReviews.length,
        },
      },
    );

    return NextResponse.json({
      success: true,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: allReviews.length,
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}
