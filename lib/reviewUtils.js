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
 * Enhance multiple products with calculated rating statistics
 * @param {Array} products - Array of product objects
 * @returns {Array} - Array of enhanced product objects
 */
export function enhanceProductsWithRatings(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map((product) => enhanceProductWithRatings(product));
}
