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
    // Get all reviews from the separate reviews collection
    const separateReviews = await db.collection("reviews").find({}).toArray();

    // Group separate reviews by product ID
    const reviewsByProduct = {};
    separateReviews.forEach((review) => {
      const productId = review.productId;
      if (!reviewsByProduct[productId]) {
        reviewsByProduct[productId] = [];
      }
      reviewsByProduct[productId].push(review);
    });

    // Enhance each product with its review data
    const enhancedProducts = products.map((product) => {
      const productId = product._id.toString();

      // Check for reviews in two places:
      // 1. Reviews stored inside the product document (old products)
      // 2. Reviews in the separate reviews collection (new products)
      let productReviews = [];

      // First, check if reviews are stored in the product document itself
      if (product.reviews && Array.isArray(product.reviews)) {
        productReviews = product.reviews;
      }
      // Second, check the separate reviews collection
      else if (reviewsByProduct[productId]) {
        productReviews = reviewsByProduct[productId];
      }

      const { averageRating, reviewCount } =
        calculateRatingStats(productReviews);

      return {
        ...product,
        averageRating,
        reviewCount,
        totalRatings: reviewCount, // Add totalRatings for compatibility with existing code
        reviews: productReviews, // Include reviews if needed
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
    }));
  }
}
