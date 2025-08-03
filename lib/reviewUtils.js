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
    // Get product IDs to fetch full product data with reviews
    const productIds = products.map((product) => product._id);

    // Fetch full product documents including reviews from the products collection
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

    // Enhance each product with its review data
    const enhancedProducts = products.map((product) => {
      const productId = product._id.toString();
      const fullProduct = fullProductMap[productId];

      // Check for reviews in the full product document (this is where reviews are stored)
      let productReviews = [];

      // First, check the full product document from database
      if (
        fullProduct &&
        fullProduct.reviews &&
        Array.isArray(fullProduct.reviews)
      ) {
        productReviews = fullProduct.reviews;
      }
      // Fallback: check if reviews are already in the current product object
      else if (product.reviews && Array.isArray(product.reviews)) {
        productReviews = product.reviews;
      }

      const { averageRating, reviewCount } =
        calculateRatingStats(productReviews);

      return {
        ...product,
        averageRating,
        reviewCount,
        totalRatings: reviewCount, // Add totalRatings for compatibility with existing code
        totalReviews: reviewCount, // Add totalReviews for compatibility
        // Don't include the full reviews array in product cards to keep response size manageable
        // reviews: productReviews, // Uncomment if you need the full reviews in the response
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
