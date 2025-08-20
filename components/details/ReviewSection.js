// filepath: components/details/ReviewSection.js
"use client";
import StarRating from "@/components/products/StarRating";
import EnhancedReviewModal from "@/components/reviews/EnhancedReviewModal";

export default function ReviewSection({
  product,
  reviews,
  session,
  hasPurchasedProduct,
  hasReviewedProduct,
  userExistingReview,
  checkingPurchase,
  showReviewForm,
  setShowReviewForm,
  editingReview,
  setEditingReview,
  setReviewForm,
  handleEnhancedReviewSubmit,
  isSubmitting,
  isUpdating,
  hasMoreReviews,
  loadMoreReviews,
  handleDeleteReview,
  isDeletingReview,
  DEFAULT_REVIEW_FORM,
}) {
  // Calculate average rating if needed
  const actualReviewCount = reviews?.length || 0;
  let displayRating = product.averageRating || 0;
  if (
    actualReviewCount > 0 &&
    (!product.averageRating || product.averageRating === 0)
  ) {
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    displayRating = totalRating / actualReviewCount;
  }
  // Distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (reviews && reviews.length > 0) {
    reviews.forEach((r) => {
      const rt = Math.floor(r.rating);
      if (rt >= 1 && rt <= 5) distribution[rt]++;
    });
  }
  const normalizedUserId = session?.user?.id || session?.user?.userId;
  const normalizedUserEmail = session?.user?.email;

  // Use email-based matching to align with API logic
  const alreadyReviewed =
    !!userExistingReview ||
    hasReviewedProduct ||
    (normalizedUserEmail &&
      reviews?.some((r) => r.reviewer === session?.user?.name)) ||
    reviews?.some((r) => r.userId === normalizedUserId);

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Customer Reviews ({product.reviewCount || product.totalReviews || 0})
        </h2>
        {session &&
          session?.user?.userType !== "farmer" &&
          hasPurchasedProduct &&
          !alreadyReviewed && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <i className="fas fa-plus mr-2"></i>
              Write Review
            </button>
          )}
        {session &&
          session?.user?.userType !== "farmer" &&
          hasPurchasedProduct &&
          alreadyReviewed &&
          userExistingReview && (
            <button
              onClick={() => {
                setEditingReview(userExistingReview);
                setReviewForm({
                  rating: userExistingReview.rating || 5,
                  comment: userExistingReview.comment || "",
                });
                setShowReviewForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <i className="fas fa-edit mr-2"></i>
              Edit Your Review
            </button>
          )}
        {session &&
          session?.user?.userType !== "farmer" &&
          !hasPurchasedProduct &&
          !checkingPurchase && (
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm italic mb-2">
                You need to purchase and receive this product to write a review
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 text-sm">
                <i className="fas fa-shopping-cart mr-2"></i>
                Purchase required for reviews
              </div>
            </div>
          )}
        {session &&
          session?.user?.userType !== "farmer" &&
          hasPurchasedProduct &&
          hasReviewedProduct &&
          !checkingPurchase && (
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm italic mb-2">
                You have already reviewed this product
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                <i className="fas fa-check-circle mr-2"></i>
                Review submitted
              </div>
            </div>
          )}
        {session &&
          session?.user?.userType !== "farmer" &&
          checkingPurchase && (
            <div className="text-center">
              <div className="inline-flex items-center text-gray-500 dark:text-gray-400 text-sm">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Checking purchase history...
              </div>
            </div>
          )}
        {session && session?.user?.userType === "farmer" && (
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 text-sm">
              <i className="fas fa-info-circle mr-2"></i>
              Farmers can view reviews but cannot write them
            </div>
          </div>
        )}
      </div>

      {/* Review Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Overall Rating Section */}
          <div className="text-center">
            <div className="mb-4">
              <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {displayRating.toFixed(1)}
              </div>
              <StarRating rating={displayRating} size="lg" />
              <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg font-medium">
                Based on{" "}
                <span className="text-primary-600 dark:text-primary-400 font-bold">
                  {actualReviewCount}
                </span>{" "}
                {actualReviewCount === 1 ? "review" : "reviews"}
              </p>
            </div>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <i className="fas fa-shield-alt text-green-600" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {actualReviewCount > 0
                    ? `${actualReviewCount} verified review${actualReviewCount === 1 ? "" : "s"}`
                    : "No reviews yet"}
                </span>
              </div>
            </div>
          </div>
          {/* Rating Distribution */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Rating Breakdown
            </h4>
            {[5, 4, 3, 2, 1].map((r) => {
              const count = distribution[r];
              const pct = actualReviewCount
                ? (count / actualReviewCount) * 100
                : 0;
              return (
                <div key={r} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                    {r} star{r === 1 ? "" : "s"}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                    {count}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Review Modal */}
      <EnhancedReviewModal
        isOpen={showReviewForm}
        onClose={() => {
          setShowReviewForm(false);
          setEditingReview(null);
          setReviewForm(DEFAULT_REVIEW_FORM);
        }}
        product={product}
        user={session?.user}
        existingReview={editingReview}
        onSubmit={handleEnhancedReviewSubmit}
        isSubmitting={isSubmitting || isUpdating}
      />

      {/* Individual Reviews */}
      <div className="space-y-8">
        {reviews && reviews.length > 0 ? (
          reviews.map((review, index) => (
            <div
              key={`${review._id}-${review.userId}-${index}`}
              className="group bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-500 dark:to-primary-700 flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {(review.reviewer || "Anonymous")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <i className="fas fa-check text-white text-xs"></i>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {review.reviewer || "Anonymous"}
                      </h4>
                      <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
                        Verified Buyer
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${star <= review.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        {review.rating}/5
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {new Date(
                          review.createdAt || review.date,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {session?.user?.name === review.reviewer ||
                  session?.user?.userId === review.userId ||
                  session?.user?.id === review.userId ? (
                    <>
                      <button
                        onClick={() => {
                          setEditingReview(review);
                          setReviewForm({
                            rating: review.rating,
                            comment: review.comment,
                          });
                          setShowReviewForm(true);
                        }}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"
                        title="Edit Review"
                      >
                        <i className="fas fa-edit text-blue-500 hover:text-blue-600"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        disabled={isDeletingReview}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                        title="Delete Review"
                      >
                        <i className="fas fa-trash text-red-500 hover:text-red-600"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <i className="fas fa-thumbs-up text-gray-400 hover:text-primary-500"></i>
                      </button>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <i className="fas fa-share text-gray-400 hover:text-primary-500"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary-400 to-primary-600 rounded-full opacity-20"></div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-6 text-base">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <i className="fas fa-heart text-red-400"></i>
                    <span>Helpful</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <i className="fas fa-comment text-blue-400"></i>
                    <span>Reply</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800"
                      ></div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    +2 found helpful
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <i className="fas fa-star text-3xl text-primary-500 dark:text-primary-400"></i>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <i className="fas fa-plus text-white text-sm"></i>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              No Reviews Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Be the first to share your experience with this amazing product!
              Your review helps other customers make informed decisions.
            </p>
            {session && hasPurchasedProduct && !alreadyReviewed && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <i className="fas fa-edit mr-2"></i>
                Write First Review
              </button>
            )}
            {session && hasPurchasedProduct && alreadyReviewed && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                <i className="fas fa-check-circle mr-2"></i>
                You have already reviewed this product
              </div>
            )}
          </div>
        )}
        {hasMoreReviews && (
          <div className="text-center pt-8">
            <button
              onClick={loadMoreReviews}
              className="group inline-flex items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              <i className="fas fa-chevron-down mr-3 group-hover:animate-bounce"></i>
              Load More Reviews
              <span className="ml-3 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm rounded-full">
                +{Math.min(5, reviews?.length || 0)}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
