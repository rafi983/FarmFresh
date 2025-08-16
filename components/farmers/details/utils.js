// Utility functions for farmer details product display
export const formatPrice = (price) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(price || 0);
};

export const calculateAverageRating = (product) => {
  if (!product?.reviews?.length) return 0;
  const total = product.reviews.reduce((s, r) => s + (r.rating || 0), 0);
  return total / product.reviews.length;
};

export const getDisplayRating = (product) => {
  const calc = calculateAverageRating(product);
  return calc > 0 ? calc : product?.averageRating || 0;
};
