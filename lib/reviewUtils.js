/**
 * Calculate average rating and review count from reviews array
 * @param {Array} reviews - Array of review objects with rating property
 * @returns {Object} - Object containing averageRating and reviewCount
 */
export function calculateRatingStats(reviews) {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return {
      averageRating: 0,
      reviewCount: 0,
    };
  }

  const totalRating = reviews.reduce((sum, review) => {
    const rating = Number(review.rating);
    return sum + (isNaN(rating) ? 0 : rating);
  }, 0);

  const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

  return {
    averageRating: averageRating,
    reviewCount: reviews.length,
  };
}

/**
 * Enhance product data with calculated rating statistics
 * @param {Object} product - Product object
 * @returns {Object} - Enhanced product object with calculated ratings
 */
export function enhanceProductWithRatings(product) {
  const { averageRating, reviewCount } = calculateRatingStats(product.reviews);

  return {
    ...product,
    averageRating,
    reviewCount: reviewCount,
  };
}

/**
 * Enhance multiple products with calculated rating statistics from database
 * @param {Array} products - Array of product objects
 * @param {Object} db - MongoDB database instance
 * @returns {Array} - Array of enhanced product objects
 */
export async function enhanceProductsWithRatings(products, db) {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  try {
    // Get product IDs for fetching reviews from the reviews collection
    const productIds = products.map((product) => product._id);
    const productIdStrings = productIds.map((id) =>
      typeof id === "string" ? id : id.toString(),
    );
    const productIdObjects = productIds.map((id) =>
      typeof id === "string" ? new ObjectId(id) : id,
    );

    // Fetch reviews from the separate reviews collection
    const reviewsCollection = db.collection("reviews");

    // Aggregate review statistics for all products from the reviews collection
    // Use flexible matching to handle both string and ObjectId productId formats
    const reviewStats = await reviewsCollection
      .aggregate([
        {
          $match: {
            $or: [
              { productId: { $in: productIdStrings } }, // Match string IDs
              { productId: { $in: productIdObjects } }, // Match ObjectId IDs
            ],
          },
        },
        {
          $group: {
            _id: "$productId",
            averageRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
            totalReviews: { $sum: 1 },
            ratings: { $push: "$rating" },
          },
        },
      ])
      .toArray();

    // Create a map for quick lookup of reviews collection data
    const reviewsCollectionStatsMap = new Map();
    reviewStats.forEach((stat) => {
      // Convert both string and ObjectId to string for consistent lookup
      const productIdStr =
        typeof stat._id === "string" ? stat._id : stat._id.toString();
      reviewsCollectionStatsMap.set(productIdStr, {
        averageRating: Math.round(stat.averageRating * 10) / 10,
        reviewCount: stat.reviewCount,
        totalReviews: stat.totalReviews,
        totalRatings: stat.reviewCount,
      });
    });

    // Get full product documents to check for embedded reviews
    const fullProducts = await db
      .collection("products")
      .find({
        _id: { $in: productIds },
        status: { $ne: "deleted" },
      })
      .toArray();

    // Create a map of full product data for easy lookup
    const fullProductMap = {};
    fullProducts.forEach((product) => {
      fullProductMap[product._id.toString()] = product;
    });

    // Enhance each product with review data from BOTH sources
    const enhancedProducts = products.map((product) => {
      const productIdStr =
        typeof product._id === "string" ? product._id : product._id.toString();

      // First, check reviews collection stats
      const reviewsCollectionStats =
        reviewsCollectionStatsMap.get(productIdStr);

      // Then check for embedded reviews in product document
      const fullProduct = fullProductMap[productIdStr];
      let embeddedReviewsStats = null;

      if (
        fullProduct &&
        fullProduct.reviews &&
        Array.isArray(fullProduct.reviews) &&
        fullProduct.reviews.length > 0
      ) {
        const { averageRating, reviewCount } = calculateRatingStats(
          fullProduct.reviews,
        );
        embeddedReviewsStats = {
          averageRating,
          reviewCount,
          totalReviews: reviewCount,
          totalRatings: reviewCount,
        };
      }

      // Use reviews collection data if available, otherwise use embedded reviews, otherwise default to 0
      let finalStats;
      if (reviewsCollectionStats) {
        // Prefer reviews collection data (for new products)
        finalStats = reviewsCollectionStats;
      } else if (embeddedReviewsStats) {
        // Fall back to embedded reviews (for old hardcoded products)
        finalStats = embeddedReviewsStats;
      } else {
        // No reviews found in either location
        finalStats = {
          averageRating: 0,
          reviewCount: 0,
          totalRatings: 0,
          totalReviews: 0,
        };
      }

      return {
        ...product,
        ...finalStats,
      };
    });

    return enhancedProducts;
  } catch (error) {
    console.error("Error enhancing products with ratings:", error);
    // Return products with default rating values if enhancement fails
    return products.map((product) => ({
      ...product,
      averageRating: 0,
      reviewCount: 0,
      totalRatings: 0,
      totalReviews: 0,
    }));
  }
}
