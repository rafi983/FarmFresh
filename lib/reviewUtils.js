import Review from "@/models/Review";
import Product from "@/models/Product";
import { getMongooseConnection } from "@/lib/mongoose";

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
export async function enhanceProductsWithRatings(products) {
  if (!Array.isArray(products) || !products.length) return [];
  await getMongooseConnection();
  const ids = products.map((p) => p._id?.toString()).filter(Boolean);
  const reviews = await Review.find({ productId: { $in: ids } })
    .select("productId rating")
    .lean();
  const map = new Map();
  for (const r of reviews) {
    const key = r.productId?.toString();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r.rating || 0);
  }
  return products.map((p) => {
    const key = p._id?.toString();
    const arr = map.get(key) || [];
    if (arr.length) {
      const total = arr.reduce((s, v) => s + v, 0);
      const avg = Math.round((total / arr.length) * 10) / 10;
      return {
        ...p,
        averageRating: avg,
        reviewCount: arr.length,
        totalReviews: arr.length,
        totalRatings: arr.length,
      };
    }
    if (p.reviews) return enhanceProductWithRatings(p);
    return {
      ...p,
      averageRating: 0,
      reviewCount: 0,
      totalReviews: 0,
      totalRatings: 0,
    };
  });
}
