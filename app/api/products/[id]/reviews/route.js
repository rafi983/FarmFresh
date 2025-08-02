import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Cache to track if indexes have been initialized
let indexesInitialized = false;

// Initialize indexes for better performance on reviews queries (only once)
async function initializeReviewIndexes(db) {
  // Skip if already initialized in this session
  if (indexesInitialized) return;

  try {
    const reviewsCollection = db.collection("reviews");
    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");
    const usersCollection = db.collection("users");

    // Check existing indexes first to avoid conflicts
    const existingReviewIndexes = await reviewsCollection
      .listIndexes()
      .toArray();
    const indexNames = existingReviewIndexes.map((idx) => idx.name);

    // Reviews collection indexes - only create if they don't exist
    if (!indexNames.some((name) => name.includes("productId_1_createdAt"))) {
      await reviewsCollection.createIndex(
        { productId: 1, createdAt: -1 },
        { name: "reviews_product_date_idx", background: true },
      );
    }

    if (!indexNames.some((name) => name.includes("productId_1_userId"))) {
      await reviewsCollection.createIndex(
        { productId: 1, userId: 1 },
        { name: "reviews_product_user_idx", background: true },
      );
    }

    if (
      !indexNames.some(
        (name) => name.includes("userId_1") && !name.includes("productId"),
      )
    ) {
      await reviewsCollection.createIndex(
        { userId: 1 },
        { name: "reviews_user_idx", background: true },
      );
    }

    if (
      !indexNames.some(
        (name) => name.includes("createdAt_-1") && !name.includes("productId"),
      )
    ) {
      await reviewsCollection.createIndex(
        { createdAt: -1 },
        { name: "reviews_date_idx", background: true },
      );
    }

    // Products collection indexes for reviews
    const existingProductIndexes = await productsCollection
      .listIndexes()
      .toArray();
    const productIndexNames = existingProductIndexes.map((idx) => idx.name);

    if (!productIndexNames.some((name) => name.includes("reviews.userId"))) {
      await productsCollection.createIndex(
        { "reviews.userId": 1 },
        { name: "products_reviews_user_idx", background: true },
      );
    }

    // Orders collection indexes for purchase verification
    const existingOrderIndexes = await ordersCollection.listIndexes().toArray();
    const orderIndexNames = existingOrderIndexes.map((idx) => idx.name);

    if (
      !orderIndexNames.some((name) => name.includes("userId_1_items.productId"))
    ) {
      await ordersCollection.createIndex(
        { userId: 1, "items.productId": 1, status: 1 },
        { name: "orders_user_product_status_idx", background: true },
      );
    }

    // Users collection indexes
    const existingUserIndexes = await usersCollection.listIndexes().toArray();
    const userIndexNames = existingUserIndexes.map((idx) => idx.name);

    if (
      !userIndexNames.some(
        (name) => name.includes("email_1") && !name.includes("_id"),
      )
    ) {
      await usersCollection.createIndex(
        { email: 1 },
        { name: "users_email_idx", background: true, unique: true },
      );
    }

    indexesInitialized = true;
    console.log("Review indexes initialized successfully");
  } catch (error) {
    console.log("Index initialization note:", error.message);
    // Don't throw error, just log it - indexes might already exist
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params; // product ID
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;
    const userId = searchParams.get("userId");

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes once per application lifecycle
    await initializeReviewIndexes(db);

    let reviews = [];
    let totalReviews = 0;

    // First try to get reviews from separate reviews collection using aggregation pipeline
    const reviewsPipeline = [
      {
        $match: {
          $or: [
            { productId: id },
            { productId: new ObjectId(id) },
            { product_id: id },
            { "product._id": new ObjectId(id) },
          ],
        },
      },
      {
        $addFields: {
          // Normalize reviewer field
          normalizedReviewer: {
            $ifNull: ["$reviewer", "Anonymous"],
          },
          // Normalize comment field
          normalizedComment: {
            $ifNull: [
              "$comment",
              { $ifNull: ["$text", { $ifNull: ["$content", ""] }] },
            ],
          },
          // Normalize createdAt field
          normalizedCreatedAt: {
            $ifNull: [
              "$createdAt",
              { $ifNull: ["$date", { $ifNull: ["$timestamp", new Date()] }] },
            ],
          },
        },
      },
      {
        $project: {
          _id: {
            $ifNull: ["$_id", { $ifNull: ["$reviewId", new ObjectId()] }],
          },
          rating: { $ifNull: ["$rating", 5] },
          comment: "$normalizedComment",
          createdAt: "$normalizedCreatedAt",
          reviewer: "$normalizedReviewer",
          userId: 1,
        },
      },
      {
        $sort: {
          // Prioritize user's own review if userId is provided
          ...(userId
            ? {
                userPriority: {
                  $cond: [{ $eq: ["$userId", userId] }, 0, 1],
                },
              }
            : {}),
          createdAt: -1,
        },
      },
      {
        $facet: {
          reviews: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const [reviewsResult] = await db
      .collection("reviews")
      .aggregate(reviewsPipeline)
      .toArray();

    if (reviewsResult && reviewsResult.reviews.length > 0) {
      reviews = reviewsResult.reviews;
      totalReviews = reviewsResult.totalCount[0]?.count || 0;
    } else {
      // Fallback: Check if reviews are stored in the product document
      const productReviewsPipeline = [
        { $match: { _id: new ObjectId(id) } },
        { $project: { reviews: 1 } },
        {
          $addFields: {
            reviewsArray: { $ifNull: ["$reviews", []] },
          },
        },
        {
          $addFields: {
            totalReviews: { $size: "$reviewsArray" },
            normalizedReviews: {
              $map: {
                input: "$reviewsArray",
                as: "review",
                in: {
                  _id: {
                    $ifNull: [
                      "$$review._id",
                      { $ifNull: ["$$review.reviewId", new ObjectId()] },
                    ],
                  },
                  rating: { $ifNull: ["$$review.rating", 5] },
                  comment: {
                    $ifNull: [
                      "$$review.comment",
                      {
                        $ifNull: [
                          "$$review.text",
                          { $ifNull: ["$$review.content", ""] },
                        ],
                      },
                    ],
                  },
                  createdAt: {
                    $ifNull: [
                      "$$review.createdAt",
                      {
                        $ifNull: [
                          "$$review.date",
                          { $ifNull: ["$$review.timestamp", new Date()] },
                        ],
                      },
                    ],
                  },
                  reviewer: { $ifNull: ["$$review.reviewer", "Anonymous"] },
                  userId: "$$review.userId",
                },
              },
            },
          },
        },
        {
          $addFields: {
            sortedReviews: {
              $slice: [
                {
                  $sortArray: {
                    input: "$normalizedReviews",
                    sortBy: {
                      ...(userId
                        ? {
                            userPriority: {
                              $cond: [{ $eq: ["$userId", userId] }, 0, 1],
                            },
                          }
                        : {}),
                      createdAt: -1,
                    },
                  },
                },
                (page - 1) * limit,
                limit,
              ],
            },
          },
        },
      ];

      const [productResult] = await db
        .collection("products")
        .aggregate(productReviewsPipeline)
        .toArray();

      if (productResult && productResult.sortedReviews) {
        reviews = productResult.sortedReviews;
        totalReviews = productResult.totalReviews || 0;
      }
    }

    const hasMore = totalReviews > page * limit;

    return NextResponse.json({
      reviews,
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

    // Initialize indexes for optimal performance
    await initializeReviewIndexes(db);

    // Use aggregation pipeline to check purchase and existing review in parallel
    const verificationPipeline = [
      {
        $facet: {
          hasPurchased: [
            {
              $match: {
                userId,
                "items.productId": id,
                status: { $in: ["delivered", "confirmed", "pending"] },
              },
            },
            { $limit: 1 },
            { $count: "count" },
          ],
          existingReview: [
            {
              $match: {
                productId: id,
                userId,
              },
            },
            { $limit: 1 },
            { $count: "count" },
          ],
        },
      },
    ];

    const [verification] = await db
      .collection("orders")
      .aggregate([{ $match: { userId } }, ...verificationPipeline])
      .toArray();

    // Also check reviews collection for existing review
    const existingReviewCheck = await db.collection("reviews").findOne({
      productId: id,
      userId,
    });

    const hasPurchased = verification?.hasPurchased?.[0]?.count > 0;
    const hasExistingReview =
      verification?.existingReview?.[0]?.count > 0 || !!existingReviewCheck;

    if (!hasPurchased) {
      return NextResponse.json(
        { error: "You can only review products you have purchased" },
        { status: 403 },
      );
    }

    if (hasExistingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 },
      );
    }

    // Get user information efficiently
    const userPipeline = [
      {
        $match: {
          $or: [{ _id: new ObjectId(userId) }, { email: userId }],
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
        },
      },
      { $limit: 1 },
    ];

    const [user] = await db
      .collection("users")
      .aggregate(userPipeline)
      .toArray();
    const reviewerName =
      user?.name || user?.email?.split("@")[0] || "Anonymous";

    // Create review
    const review = {
      productId: id,
      userId,
      reviewer: reviewerName,
      rating: parseInt(rating),
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(review);

    // Update product average rating using aggregation pipeline
    const ratingUpdatePipeline = [
      { $match: { productId: id } },
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
        { _id: new ObjectId(id) },
        {
          $set: {
            averageRating: Math.round(ratingStats.averageRating * 10) / 10,
            totalRatings: ratingStats.totalRatings,
          },
        },
      );

      return NextResponse.json({
        success: true,
        reviewId: result.insertedId,
        averageRating: Math.round(ratingStats.averageRating * 10) / 10,
        totalRatings: ratingStats.totalRatings,
      });
    }

    return NextResponse.json({
      success: true,
      reviewId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}
