import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Cache to track if indexes have been initialized
let reviewsIndexesInitialized = false;

// Initialize indexes for better performance on reviews queries (only once)
async function initializeReviewsIndexes(db) {
  // Skip if already initialized in this session
  if (reviewsIndexesInitialized) return;

  try {
    const reviewsCollection = db.collection("reviews");
    const productsCollection = db.collection("products");

    // Check existing indexes first to avoid conflicts
    const existingReviewIndexes = await reviewsCollection
      .listIndexes()
      .toArray();
    const indexNames = existingReviewIndexes.map((idx) => idx.name);

    // Reviews collection indexes - only create if they don't exist
    if (!indexNames.some((name) => name.includes("farmerId_1_createdAt"))) {
      await reviewsCollection.createIndex(
        { farmerId: 1, createdAt: -1 },
        { name: "reviews_farmer_date_idx", background: true },
      );
    }

    if (!indexNames.some((name) => name.includes("productId_1_farmerId"))) {
      await reviewsCollection.createIndex(
        { productId: 1, farmerId: 1 },
        { name: "reviews_product_farmer_idx", background: true },
      );
    }

    if (!indexNames.some((name) => name.includes("userId_1_farmerId"))) {
      await reviewsCollection.createIndex(
        { userId: 1, farmerId: 1 },
        { name: "reviews_user_farmer_idx", background: true },
      );
    }

    reviewsIndexesInitialized = true;
    console.log("Reviews indexes initialized successfully");
  } catch (error) {
    console.log("Index initialization note:", error.message);
    // Don't throw error, just log it - indexes might already exist
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get("farmerId");
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Initialize indexes once per application lifecycle
    await initializeReviewsIndexes(db);

    let reviews = [];
    let totalReviews = 0;

    // If no specific filter parameters are provided, fetch all reviews
    if (!farmerId && !productId && !userId) {
      // Fetch all reviews with basic aggregation
      const allReviewsPipeline = [
        {
          $addFields: {
            normalizedReviewer: {
              $ifNull: ["$reviewer", "Anonymous"],
            },
            normalizedComment: {
              $ifNull: [
                "$comment",
                { $ifNull: ["$text", { $ifNull: ["$content", ""] }] },
              ],
            },
            normalizedCreatedAt: {
              $ifNull: [
                "$createdAt",
                {
                  $ifNull: ["$date", { $ifNull: ["$timestamp", new Date()] }],
                },
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
            productId: 1,
            farmerId: 1,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
      ];

      reviews = await db
        .collection("reviews")
        .aggregate(allReviewsPipeline)
        .toArray();

      totalReviews = await db.collection("reviews").countDocuments();

      return NextResponse.json({
        reviews,
        pagination: {
          page,
          limit,
          total: totalReviews,
          pages: Math.ceil(totalReviews / limit),
        },
        summary: {
          totalReviews,
          averageRating:
            reviews.length > 0
              ? (
                  reviews.reduce((sum, review) => sum + review.rating, 0) /
                  reviews.length
                ).toFixed(1)
              : "0.0",
        },
      });
    }

    // If farmerId is provided, we need to get reviews for all products belonging to that farmer
    if (farmerId) {
      // First, get all products belonging to this farmer
      const farmerProductsPipeline = [
        {
          $match: {
            $or: [
              { "farmer.id": farmerId },
              { "farmer._id": farmerId },
              { farmerId: farmerId },
              { "farmer.email": farmerId }, // In case farmerId is actually farmer email
            ],
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            farmer: 1,
          },
        },
      ];

      const farmerProducts = await db
        .collection("products")
        .aggregate(farmerProductsPipeline)
        .toArray();

      const productIds = farmerProducts.map((p) => p._id.toString());
      console.log(
        `Found ${farmerProducts.length} products for farmer ${farmerId}`,
      );

      if (productIds.length > 0) {
        // Get reviews for all farmer's products from the reviews collection
        const reviewsPipeline = [
          {
            $match: {
              $or: [
                { productId: { $in: productIds } },
                {
                  productId: { $in: productIds.map((id) => new ObjectId(id)) },
                },
                { farmerId: farmerId }, // Direct farmerId match
                { "farmer.id": farmerId },
                { "farmer._id": farmerId },
              ],
            },
          },
          {
            $addFields: {
              // Normalize fields
              normalizedReviewer: {
                $ifNull: ["$reviewer", "Anonymous"],
              },
              normalizedComment: {
                $ifNull: [
                  "$comment",
                  { $ifNull: ["$text", { $ifNull: ["$content", ""] }] },
                ],
              },
              normalizedCreatedAt: {
                $ifNull: [
                  "$createdAt",
                  {
                    $ifNull: ["$date", { $ifNull: ["$timestamp", new Date()] }],
                  },
                ],
              },
              // Add product name from farmerProducts array
              productName: {
                $let: {
                  vars: {
                    matchedProduct: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: farmerProducts,
                            cond: {
                              $or: [
                                {
                                  $eq: [
                                    "$$this._id",
                                    { $toObjectId: "$productId" },
                                  ],
                                },
                                {
                                  $eq: [
                                    { $toString: "$$this._id" },
                                    "$productId",
                                  ],
                                },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: "$$matchedProduct.name",
                },
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
              productId: 1,
              productName: { $ifNull: ["$productName", "Unknown Product"] },
              farmerId: 1,
            },
          },
          {
            $sort: {
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
          console.log(
            `Found ${reviews.length} reviews from reviews collection for farmer ${farmerId}`,
          );
        }

        // Also check for embedded reviews in products
        if (reviews.length === 0) {
          const productReviewsPipeline = [
            {
              $match: {
                _id: { $in: farmerProducts.map((p) => p._id) },
              },
            },
            {
              $project: {
                name: 1,
                reviews: 1,
              },
            },
            {
              $unwind: {
                path: "$reviews",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $addFields: {
                "reviews.productName": "$name",
                "reviews.productId": { $toString: "$_id" },
                "reviews.normalizedCreatedAt": {
                  $ifNull: [
                    "$reviews.createdAt",
                    {
                      $ifNull: [
                        "$reviews.date",
                        { $ifNull: ["$reviews.timestamp", new Date()] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  _id: { $ifNull: ["$reviews._id", new ObjectId()] },
                  rating: { $ifNull: ["$reviews.rating", 5] },
                  comment: { $ifNull: ["$reviews.comment", ""] },
                  createdAt: "$reviews.normalizedCreatedAt",
                  reviewer: { $ifNull: ["$reviews.reviewer", "Anonymous"] },
                  userId: "$reviews.userId",
                  productId: "$reviews.productId",
                  productName: "$reviews.productName",
                  source: "product",
                },
              },
            },
            {
              $sort: {
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

          const [productReviewsResult] = await db
            .collection("products")
            .aggregate(productReviewsPipeline)
            .toArray();

          if (productReviewsResult && productReviewsResult.reviews.length > 0) {
            reviews = productReviewsResult.reviews;
            totalReviews = productReviewsResult.totalCount[0]?.count || 0;
            console.log(
              `Found ${reviews.length} embedded reviews for farmer ${farmerId}`,
            );
          }
        }
      }
    }
    // Handle productId query
    else if (productId) {
      const reviewsPipeline = [
        {
          $match: {
            $or: [
              { productId: productId },
              { productId: new ObjectId(productId) },
            ],
          },
        },
        {
          $addFields: {
            normalizedReviewer: {
              $ifNull: ["$reviewer", "Anonymous"],
            },
            normalizedComment: {
              $ifNull: [
                "$comment",
                { $ifNull: ["$text", { $ifNull: ["$content", ""] }] },
              ],
            },
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
            _id: 1,
            rating: { $ifNull: ["$rating", 5] },
            comment: "$normalizedComment",
            createdAt: "$normalizedCreatedAt",
            reviewer: "$normalizedReviewer",
            userId: 1,
            productId: 1,
            productName: 1,
          },
        },
        {
          $sort: {
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

      if (reviewsResult) {
        reviews = reviewsResult.reviews || [];
        totalReviews = reviewsResult.totalCount[0]?.count || 0;
      }
    }
    // Handle userId query
    else if (userId) {
      const reviewsPipeline = [
        {
          $match: {
            $or: [{ userId: userId }, { userId: new ObjectId(userId) }],
          },
        },
        {
          $addFields: {
            normalizedReviewer: {
              $ifNull: ["$reviewer", "Anonymous"],
            },
            normalizedComment: {
              $ifNull: [
                "$comment",
                { $ifNull: ["$text", { $ifNull: ["$content", ""] }] },
              ],
            },
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
            _id: 1,
            rating: { $ifNull: ["$rating", 5] },
            comment: "$normalizedComment",
            createdAt: "$normalizedCreatedAt",
            reviewer: "$normalizedReviewer",
            userId: 1,
            productId: 1,
            productName: 1,
          },
        },
        {
          $sort: {
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

      if (reviewsResult) {
        reviews = reviewsResult.reviews || [];
        totalReviews = reviewsResult.totalCount[0]?.count || 0;
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

export async function POST(request) {
  try {
    const { productId, reviewData } = await request.json();

    if (!productId || !reviewData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Get product details to get farmer information
    const product = await db.collection("products").findOne({
      _id: new ObjectId(productId),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create the review document
    const reviewDoc = {
      productId: productId,
      farmerId: product.farmer?.id || product.farmerId,
      userId: reviewData.userId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      title: reviewData.title || "",
      pros: reviewData.pros || [],
      cons: reviewData.cons || [],
      wouldRecommend: reviewData.wouldRecommend || false,
      isAnonymous: reviewData.isAnonymous || false,
      tags: reviewData.tags || [],
      reviewer: reviewData.isAnonymous
        ? "Anonymous"
        : reviewData.userName || reviewData.reviewerName || "Anonymous",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(reviewDoc);

    return NextResponse.json({
      success: true,
      reviewId: result.insertedId,
      message: "Review submitted successfully",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const { reviewId, reviewData } = await request.json();

    if (!reviewId || !reviewData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Update the review
    const updateDoc = {
      $set: {
        rating: reviewData.rating,
        comment: reviewData.comment,
        title: reviewData.title || "",
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        wouldRecommend: reviewData.wouldRecommend || false,
        isAnonymous: reviewData.isAnonymous || false,
        tags: reviewData.tags || [],
        updatedAt: new Date(),
      },
    };

    const result = await db
      .collection("reviews")
      .updateOne({ _id: new ObjectId(reviewId) }, updateDoc);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
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
