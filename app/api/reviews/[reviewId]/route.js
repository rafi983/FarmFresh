import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";

export async function PUT(request, { params }) {
  try {
    const { reviewId } = params;
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!ObjectId.isValid(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
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

    // Check if the review belongs to the current user
    const existingReview = await db.collection("reviews").findOne({
      _id: new ObjectId(reviewId),
      userEmail: session.user.email,
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found or you don't have permission to edit it" },
        { status: 404 },
      );
    }

    // Update the review
    const result = await db.collection("reviews").updateOne(
      { _id: new ObjectId(reviewId) },
      {
        $set: {
          rating,
          comment,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({
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
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!ObjectId.isValid(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Check if the review belongs to the current user
    const existingReview = await db.collection("reviews").findOne({
      _id: new ObjectId(reviewId),
      userEmail: session.user.email,
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found or you don't have permission to delete it" },
        { status: 404 },
      );
    }

    // Delete the review
    const result = await db.collection("reviews").deleteOne({
      _id: new ObjectId(reviewId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}
