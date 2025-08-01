import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = params; // product ID
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;
    const userId = searchParams.get("userId");

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Check if reviews are stored in the product document itself
    const product = await db
      .collection("products")
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { reviews: 1, ratings: 1, comments: 1 } },
      );

    let reviews = [];
    let totalReviews = 0;

    if (product && product.reviews && Array.isArray(product.reviews)) {
      // Reviews are stored in the product document
      reviews = product.reviews;
      totalReviews = reviews.length;
      console.log("DEBUG - Found reviews in product document:", totalReviews);
      console.log(
        "DEBUG - Raw reviews structure:",
        JSON.stringify(reviews, null, 2),
      );
    } else {
      // Try the separate reviews collection with different query formats
      const possibleQueries = [
        { productId: id },
        { productId: new ObjectId(id) },
        { product_id: id },
        { "product._id": new ObjectId(id) },
      ];

      for (const query of possibleQueries) {
        try {
          const foundReviews = await db
            .collection("reviews")
            .find(query)
            .toArray();
          if (foundReviews.length > 0) {
            reviews = foundReviews;
            totalReviews = foundReviews.length;
            break;
          }
        } catch (error) {
          console.log("Query failed:", error.message);
        }
      }
    }

    // If still no reviews found, check all documents in reviews collection
    if (reviews.length === 0) {
      const allReviews = await db.collection("reviews").find({}).toArray();
      if (allReviews.length > 0) {
        console.log(
          "DEBUG - Sample review structure:",
          JSON.stringify(allReviews[0], null, 2),
        );
      }
    }

    // Normalize the review format with better field checking
    const normalizedReviews = await Promise.all(
      reviews.map(async (review) => {
        // Only use reviewer field since that's the standard now
        let userName = review.reviewer || "Anonymous";

        return {
          _id: review._id || review.reviewId || new ObjectId(),
          rating: review.rating || 5,
          comment: review.comment || review.text || review.content || "",
          createdAt:
            review.createdAt || review.date || review.timestamp || new Date(),
          reviewer: userName, // Only keep reviewer field
          userId: review.userId, // Include userId for sorting
        };
      }),
    );

    // Sort reviews to show logged-in user's review first
    const sortedReviews = normalizedReviews.sort((a, b) => {
      // If userId is provided, prioritize that user's review
      if (userId) {
        if (a.userId === userId && b.userId !== userId) return -1;
        if (b.userId === userId && a.userId !== userId) return 1;
      }
      // Then sort by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedReviews = sortedReviews.slice(
      startIndex,
      startIndex + limit,
    );
    const hasMore = totalReviews > page * limit;

    return NextResponse.json({
      reviews: paginatedReviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params; // product ID
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

    // Check if user has purchased this product
    const hasPurchased = await db.collection("orders").findOne({
      userId,
      "items.productId": id,
      status: { $in: ["delivered", "confirmed", "pending"] }, // Allow reviews for any order status
    });

    if (!hasPurchased) {
      return NextResponse.json(
        { error: "You can only review products you have purchased" },
        { status: 403 },
      );
    }

    // Check if user has already reviewed this product
    const existingReview = await db.collection("reviews").findOne({
      productId: id,
      userId,
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 },
      );
    }

    // Get user information to include reviewer name
    const user = await db.collection("users").findOne({
      $or: [{ _id: new ObjectId(userId) }, { email: userId }],
    });

    const reviewerName =
      user?.name || user?.email?.split("@")[0] || "Anonymous";

    // Create review
    const review = {
      productId: id,
      userId,
      reviewer: reviewerName, // Add the reviewer name
      rating: parseInt(rating),
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(review);

    // Update product average rating
    const allReviews = await db
      .collection("reviews")
      .find({ productId: id })
      .toArray();
    const averageRating =
      allReviews.reduce((sum, review) => sum + review.rating, 0) /
      allReviews.length;

    await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: allReviews.length,
        },
      },
    );

    return NextResponse.json({
      success: true,
      reviewId: result.insertedId,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: allReviews.length,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}
