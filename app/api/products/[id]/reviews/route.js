import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongooseConnection } from "@/lib/mongoose";
import Review from "@/models/Review";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { clearProductsCache } from "../../route";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;
    const userId = searchParams.get("userId");
    const skip = (page - 1) * limit;

    await getMongooseConnection();

    const variants = [id];
    if (ObjectId.isValid(id)) variants.push(new ObjectId(id));

    // Fetch all (bounded by reasonable expectations); for very large counts consider cursor-based pagination
    let allReviews = await Review.find({ productId: { $in: variants } })
      .select("rating comment createdAt reviewer userId productId")
      .sort({ createdAt: -1 })
      .lean();

    if (userId && allReviews.length) {
      const userReviews = allReviews.filter((r) => r.userId === userId);
      const other = allReviews.filter((r) => r.userId !== userId);
      allReviews = [...userReviews, ...other];
    }

    const totalReviews = allReviews.length;
    let pageSlice = allReviews.slice(skip, skip + limit);
    let hasMore = totalReviews > page * limit;

    // Fallback embedded reviews if none
    if (totalReviews === 0) {
      const product = await Product.findById(id).select("reviews").lean();
      if (product?.reviews?.length) {
        const embedded = [...product.reviews].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        allReviews = embedded.map((r) => ({
          _id: r._id || new ObjectId(),
          rating: r.rating || 5,
          comment: r.comment || r.text || r.content || "",
          // Preserve existing createdAt logic
          createdAt: r.createdAt || r.date || r.timestamp || new Date(),
          reviewer: r.reviewer || r.userName || "Anonymous",
          userId: r.userId || r.userID || r.user || null,
          productId: id,
        }));
        // Recompute pagination from fallback reviews
        const newTotal = allReviews.length;
        pageSlice = allReviews.slice(0, limit); // page is always 1 here since previous total was 0
        hasMore = newTotal > limit;
        return NextResponse.json({
          reviews: pageSlice,
          pagination: {
            currentPage: 1,
            totalPages: Math.ceil(newTotal / limit),
            totalReviews: newTotal,
            hasMore,
          },
        });
      }
    }

    return NextResponse.json({
      reviews: pageSlice,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasMore,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
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

    await getMongooseConnection();

    const product = await Product.findById(id).select("_id farmerId").lean();
    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const purchase = await Order.findOne({
      userId,
      status: "delivered",
      "items.productId": { $in: [id] },
    })
      .select("_id items status")
      .lean();

    if (!purchase) {
      return NextResponse.json(
        {
          error:
            "You must purchase and receive this product before writing a review",
        },
        { status: 403 },
      );
    }

    const existing = await Review.findOne({ productId: id, userId }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 },
      );
    }

    const reviewDoc = await Review.create({
      productId: id,
      userId,
      rating: Number(rating),
      comment,
      reviewer: "Anonymous",
    });

    const { averageRating, totalReviews } =
      await Review.recomputeProductRating(id);

    clearProductsCache();

    return NextResponse.json({
      success: true,
      reviewId: reviewDoc._id,
      averageRating,
      totalRatings: totalReviews,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}
