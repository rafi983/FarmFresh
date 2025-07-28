import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Find the product
    let targetProduct = await db.collection("products").findOne({ _id: id });

    if (!targetProduct && ObjectId.isValid(id)) {
      targetProduct = await db
        .collection("products")
        .findOne({ _id: new ObjectId(id) });
    }

    if (!targetProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // ONLY use the reviews array from the product
    const reviews = targetProduct.reviews || [];

    // Format the reviews for consistent structure
    const formattedReviews = reviews.map((review, index) => ({
      _id: index,
      userName: review.reviewer,
      rating: review.rating,
      comment: review.comment,
      createdAt: new Date(review.date),
      isCurrentUser: false,
    }));

    // Apply pagination
    const paginatedReviews = formattedReviews.slice(skip, skip + limit);
    const totalReviews = formattedReviews.length;

    return NextResponse.json({
      reviews: paginatedReviews,
      totalReviews,
      hasMore: page * limit < totalReviews,
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
    const { id } = params;
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }

    const { rating, comment } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Check if user has purchased this product
    const hasPurchased = await db.collection("orders").findOne({
      userEmail: session.user.email,
      "items.productId": new ObjectId(id),
      status: "completed",
    });

    if (!hasPurchased) {
      return NextResponse.json(
        { error: "You can only review products you have purchased" },
        { status: 403 },
      );
    }

    // Check if user already reviewed this product
    const existingReview = await db.collection("reviews").findOne({
      productId: new ObjectId(id),
      userEmail: session.user.email,
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 },
      );
    }

    // Create review
    const review = {
      productId: new ObjectId(id),
      userEmail: session.user.email,
      rating,
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(review);

    return NextResponse.json({
      message: "Review added successfully",
      reviewId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    return NextResponse.json(
      { error: "Failed to add review" },
      { status: 500 },
    );
  }
}
