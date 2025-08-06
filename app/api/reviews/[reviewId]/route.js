import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import reviewEvents, { REVIEW_EVENTS } from "@/lib/reviewEvents";

// Cache to track if indexes have been initialized
let reviewOperationIndexesInitialized = false;

// Initialize indexes for better performance on review operations (only once)
async function initializeReviewOperationIndexes(db) {
  // Skip if already initialized in this session
  if (reviewOperationIndexesInitialized) return;

  try {
    const reviewsCollection = db.collection("reviews");
    const productsCollection = db.collection("products");

    // Check existing indexes first to avoid conflicts
    const existingReviewIndexes = await reviewsCollection
      .listIndexes()
      .toArray();
    const reviewIndexNames = existingReviewIndexes.map((idx) => idx.name);

    // Reviews collection indexes for efficient operations - only create if they don't exist
    if (!reviewIndexNames.some((name) => name.includes("_id_1_userId"))) {
      await reviewsCollection.createIndex(
        { _id: 1, userId: 1 },
        { name: "reviews_id_user_idx", background: true },
      );
    }

    if (
      !reviewIndexNames.some(
        (name) =>
          name.includes("productId_1") &&
          !name.includes("rating") &&
          !name.includes("userId"),
      )
    ) {
      await reviewsCollection.createIndex(
        { productId: 1 },
        { name: "reviews_product_idx", background: true },
      );
    }

    if (
      !reviewIndexNames.some(
        (name) =>
          name.includes("userId_1") &&
          !name.includes("_id") &&
          !name.includes("productId"),
      )
    ) {
      await reviewsCollection.createIndex(
        { userId: 1 },
        { name: "reviews_user_only_idx", background: true },
      );
    }

    if (!reviewIndexNames.some((name) => name.includes("productId_1_rating"))) {
      await reviewsCollection.createIndex(
        { productId: 1, rating: 1 },
        { name: "reviews_product_rating_idx", background: true },
      );
    }

    // Products collection indexes for rating updates
    const existingProductIndexes = await productsCollection
      .listIndexes()
      .toArray();
    const productIndexNames = existingProductIndexes.map((idx) => idx.name);

    // _id index already exists by default, no need to create

    reviewOperationIndexesInitialized = true;
    console.log("Review operation indexes initialized successfully");
  } catch (error) {
    console.log("Index initialization note:", error.message);
    // Don't throw error, just log it - indexes might already exist
  }
}

export async function PUT(request, { params }) {
  try {
    const { reviewId } = params;
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
    } = await request.json();

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

    // Initialize indexes once per application lifecycle
    await initializeReviewOperationIndexes(db);

    // Use aggregation pipeline to verify review ownership and get product info
    const reviewVerificationPipeline = [
      {
        $match: {
          _id: new ObjectId(reviewId),
          userId: userId,
        },
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          userId: 1,
          rating: 1,
        },
      },
      { $limit: 1 },
    ];

    const [existingReview] = await db
      .collection("reviews")
      .aggregate(reviewVerificationPipeline)
      .toArray();

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 },
      );
    }

    // Prepare update data - only include fields that are provided
    const updateData = {
      rating: parseInt(rating),
      comment,
      updatedAt: new Date(),
    };

    // Add optional fields if they exist
    if (title !== undefined) updateData.title = title;
    if (pros !== undefined) updateData.pros = pros;
    if (cons !== undefined) updateData.cons = cons;
    if (wouldRecommend !== undefined)
      updateData.wouldRecommend = wouldRecommend;
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;
    if (tags !== undefined) updateData.tags = tags;

    // Update review with optimized operation
    const updateResult = await db
      .collection("reviews")
      .updateOne({ _id: new ObjectId(reviewId) }, { $set: updateData });

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update review" },
        { status: 500 },
      );
    }

    // Recalculate product rating using optimized aggregation pipeline
    const ratingUpdatePipeline = [
      { $match: { productId: existingReview.productId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ];

    const [ratingStats] = await db
      .collection("reviews")
      .aggregate(ratingUpdatePipeline)
      .toArray();

    if (ratingStats) {
      await db.collection("products").updateOne(
        { _id: new ObjectId(existingReview.productId) },
        {
          $set: {
            averageRating: Math.round(ratingStats.averageRating * 10) / 10,
            totalRatings: ratingStats.totalRatings,
          },
        },
      );

      return NextResponse.json({
        success: true,
        averageRating: Math.round(ratingStats.averageRating * 10) / 10,
        totalRatings: ratingStats.totalRatings,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
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

    // Initialize indexes once per application lifecycle
    await initializeReviewOperationIndexes(db);

    // Use aggregation pipeline to verify review ownership and get product info
    const reviewVerificationPipeline = [
      {
        $match: {
          _id: new ObjectId(reviewId),
          userId: userId,
        },
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          userId: 1,
        },
      },
      { $limit: 1 },
    ];

    const [existingReview] = await db
      .collection("reviews")
      .aggregate(reviewVerificationPipeline)
      .toArray();

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 },
      );
    }

    // Delete review with optimized operation
    const deleteResult = await db.collection("reviews").deleteOne({
      _id: new ObjectId(reviewId),
      userId: userId, // Additional security check
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete review" },
        { status: 500 },
      );
    }

    // Recalculate product rating using optimized aggregation pipeline
    const ratingUpdatePipeline = [
      { $match: { productId: existingReview.productId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ];

    const [ratingStats] = await db
      .collection("reviews")
      .aggregate(ratingUpdatePipeline)
      .toArray();

    // Handle case where no reviews remain
    const finalAverageRating = ratingStats ? ratingStats.averageRating : 0;
    const finalTotalRatings = ratingStats ? ratingStats.totalRatings : 0;

    await db.collection("products").updateOne(
      { _id: new ObjectId(existingReview.productId) },
      {
        $set: {
          averageRating: Math.round(finalAverageRating * 10) / 10,
          totalRatings: finalTotalRatings,
        },
      },
    );

    // Emit review deletion event to notify other pages
    try {
      reviewEvents.emit(existingReview.productId, REVIEW_EVENTS.DELETED, {
        reviewId,
        userId,
        productId: existingReview.productId,
        newAverageRating: Math.round(finalAverageRating * 10) / 10,
        newTotalRatings: finalTotalRatings,
      });
      console.log(
        `✅ Review deletion event emitted for product ${existingReview.productId}`,
      );
    } catch (eventError) {
      console.error("❌ Error emitting review deletion event:", eventError);
      // Don't fail the operation if event emission fails
    }

    return NextResponse.json({
      success: true,
      averageRating: Math.round(finalAverageRating * 10) / 10,
      totalRatings: finalTotalRatings,
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}
