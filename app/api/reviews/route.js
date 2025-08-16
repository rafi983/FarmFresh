import { NextResponse } from "next/server";
import { getMongooseConnection } from "@/lib/mongoose";
import Review from "@/models/Review";
import Product from "@/models/Product";
import Order from "@/models/Order";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    await getMongooseConnection();
    const farmerId = searchParams.get("farmerId");
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    let filter = {};
    if (productId) filter.productId = productId;
    if (userId) filter.userId = userId;

    // Farmer reviews => gather product ids first
    if (farmerId) {
      const farmerProducts = await Product.find({
        $or: [
          { farmerId: farmerId },
          { "farmer.id": farmerId },
          { "farmer._id": farmerId },
          { "farmer.email": farmerId },
        ],
      })
        .select("_id")
        .lean();
      const productIds = farmerProducts.map((p) => p._id.toString());
      if (productIds.length) {
        filter.$or = [
          { productId: { $in: productIds } },
          { farmerId: farmerId },
        ];
      } else {
        return NextResponse.json({
          reviews: [],
          pagination: { page, limit, total: 0, pages: 0 },
          summary: { totalReviews: 0, averageRating: "0.0" },
        });
      }
    }

    // No filter => fetch all
    const query = Review.find(filter).sort({ createdAt: -1 });
    const totalReviews = await Review.countDocuments(filter);
    const reviews = await query.skip(skip).limit(limit).lean();

    const averageRating = reviews.length
      ? (
          reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : "0.0";

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: totalReviews,
        pages: Math.ceil(totalReviews / limit),
      },
      summary: { totalReviews, averageRating },
    });
  } catch (error) {
    console.error("Error fetching reviews (mongoose):", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await getMongooseConnection();
    const { productId, reviewData } = await request.json();
    if (!productId || !reviewData?.userId || !reviewData?.rating) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const product = await Product.findById(productId).lean();
    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Verify delivered order
    const purchased = await Order.findOne({
      userId: reviewData.userId,
      status: "delivered",
      "items.productId": productId,
    }).lean();
    if (!purchased) {
      return NextResponse.json(
        { error: "Only delivered purchases can be reviewed" },
        { status: 403 },
      );
    }

    // Prevent duplicate
    const existing = await Review.findOne({
      productId,
      userId: reviewData.userId,
    }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 },
      );
    }

    const doc = await Review.create({
      productId,
      userId: reviewData.userId,
      rating: reviewData.rating,
      comment: reviewData.comment || "",
      reviewer: reviewData.isAnonymous
        ? "Anonymous"
        : reviewData.userName || reviewData.reviewerName || "Anonymous",
    });

    const { averageRating, totalReviews } =
      await Review.recomputeProductRating(productId);

    return NextResponse.json({
      success: true,
      reviewId: doc._id,
      averageRating,
      totalRatings: totalReviews,
    });
  } catch (error) {
    console.error("Error creating review (mongoose):", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    await getMongooseConnection();
    const { reviewId, reviewData } = await request.json();
    if (!reviewId || !reviewData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    const review = await Review.findById(reviewId).lean();
    if (!review)
      return NextResponse.json({ error: "Review not found" }, { status: 404 });

    await Review.updateOne(
      { _id: reviewId },
      {
        $set: {
          rating: reviewData.rating,
          comment: reviewData.comment,
          updatedAt: new Date(),
        },
      },
    );

    const { averageRating, totalReviews } = await Review.recomputeProductRating(
      review.productId,
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
