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

    // Build query
    const query = { productId: id };

    // Get total count
    const totalReviews = await db.collection("reviews").countDocuments(query);

    // Get reviews with pagination
    let reviews = await db
      .collection("reviews")
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // If user is logged in, prioritize their review
    if (userId && page === 1) {
      const userReview = await db
        .collection("reviews")
        .findOne({ productId: id, userId });

      if (userReview) {
        // Remove user review from regular results if it exists
        reviews = reviews.filter((review) => review.userId !== userId);
        // Add user review at the beginning
        reviews.unshift(userReview);
        // Limit to requested number
        reviews = reviews.slice(0, limit);
      }
    }

    // Populate user information
    const populatedReviews = [];
    for (const review of reviews) {
      const user = await db
        .collection("users")
        .findOne(
          { _id: new ObjectId(review.userId) },
          { projection: { name: 1, email: 1 } },
        );

      populatedReviews.push({
        ...review,
        user: user ? { name: user.name, email: user.email } : null,
      });
    }

    const hasMore = totalReviews > page * limit;

    return NextResponse.json({
      reviews: populatedReviews,
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
      status: "delivered",
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

    // Create review
    const review = {
      productId: id,
      userId,
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
