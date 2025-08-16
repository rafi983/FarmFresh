"use client";
export default function ReviewsTab({ reviews, stats }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-6">
          💬 Customer Testimonials 💬
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
          Discover what our valued customers are saying about their experience
          with our fresh, quality produce and exceptional service.
        </p>
      </div>
      {reviews.length > 0 ? (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-3xl p-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white text-center">
              <ReviewStat value={reviews.length} label="Total Reviews" />
              <ReviewStat
                value={`${stats.averageRating}★`}
                label="Average Rating"
                stars={true}
                rating={stats.averageRating}
              />
              <ReviewStat value="98%" label="Satisfaction Rate" />
            </div>
          </div>
          <div className="space-y-8">
            {reviews.map((review, index) => {
              const variants = [
                "premium-testimonial",
                "modern-review",
                "elegant-feedback",
                "vibrant-comment",
                "classic-review",
              ];
              const variant = variants[index % variants.length];
              return (
                <ReviewCard key={index} review={review} variant={variant} />
              );
            })}
          </div>
          <SatisfactionFooter />
        </div>
      ) : (
        <NoReviews />
      )}
    </div>
  );
}

function ReviewStat({ value, label, stars = false, rating = 0 }) {
  return (
    <div className="group">
      <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
        {value}
      </div>
      <div className="text-white/90 text-lg">{label}</div>
      {stars && (
        <div className="flex justify-center mt-2">
          {[...Array(5)].map((_, i) => (
            <i
              key={i}
              className={`fas fa-star text-lg ${i < Math.floor(rating || 0) ? "text-yellow-300" : "text-white/30"}`}
            ></i>
          ))}
        </div>
      )}
      <div className="w-16 h-1 bg-white/30 mx-auto mt-2 rounded-full"></div>
    </div>
  );
}

function ReviewCard({ review, variant }) {
  // Reuse original variant layouts (trimmed for brevity not altering structure)
  if (variant === "premium-testimonial") {
    return (
      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 p-8 hover:shadow-2xl transition-all duration-700 border-2 border-indigo-200 dark:border-indigo-800">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-4 right-4 w-20 h-20 bg-indigo-100 dark:bg-indigo-800/30 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative z-10">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:rotate-12 transition-transform duration-500">
                {(review.reviewer || "A").charAt(0).toUpperCase()}
              </div>
              <div className="text-center mt-3">
                <div className="flex justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star text-lg ${i < review.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                    ></i>
                  ))}
                </div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                  {review.rating}/5 Stars
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {review.reviewer || "Anonymous Customer"}
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <i className="fas fa-box mr-2 text-purple-500"></i>
                    {review.productName}
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-calendar mr-2 text-indigo-500"></i>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -top-2 -left-2 text-6xl text-indigo-200 dark:text-indigo-800 opacity-50">
                  <i className="fas fa-quote-left"></i>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed italic pl-8 pr-4">
                  {review.comment}
                </p>
                <div className="absolute -bottom-2 -right-2 text-6xl text-indigo-200 dark:text-indigo-800 opacity-50 transform rotate-180">
                  <i className="fas fa-quote-left"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (variant === "modern-review") {
    return (
      <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 border-l-8 border-emerald-500">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {(review.reviewer || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                  {review.reviewer || "Anonymous Customer"}
                </h4>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Verified Purchase
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 justify-end mb-2">
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`fas fa-star text-xl ${i < review.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                  ></i>
                ))}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <div className="inline-flex items-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-sm font-medium">
              <i className="fas fa-leaf mr-2"></i>
              {review.productName}
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            {review.comment}
          </p>
        </div>
      </div>
    );
  }
  if (variant === "elegant-feedback") {
    return (
      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 dark:from-rose-900/20 dark:via-pink-900/20 dark:to-red-900/20 p-8 hover:shadow-2xl transition-all duration-700 border border-rose-200 dark:border-rose-800">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-400/5 to-pink-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-4 right-4 w-20 h-20 bg-rose-100 dark:bg-rose-800/30 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative z-10 text-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:rotate-12 transition-transform duration-500">
            <i className="fas fa-heart text-white text-2xl"></i>
          </div>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {review.reviewer || "Happy Customer"}
          </h4>
          <div className="flex justify-center space-x-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <i
                key={i}
                className={`fas fa-star text-2xl ${i < review.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
              ></i>
            ))}
          </div>
          <div className="inline-flex items-center bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 px-4 py-2 rounded-full text-sm font-medium">
            <i className="fas fa-apple-alt mr-2"></i>
            {review.productName}
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-700 dark:text-gray-300 text-xl leading-relaxed italic font-light">
              &ldquo;{review.comment}&rdquo;
            </p>
            <div className="mt-6 text-gray-500 dark:text-gray-400 text-sm">
              <i className="fas fa-calendar-alt mr-2"></i>
              {new Date(review.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (variant === "vibrant-comment") {
    return (
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 p-8 hover:shadow-2xl transition-all duration-500 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full transform translate-x-20 -translate-y-20 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative z-10 flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="w-18 h-18 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
              {(review.reviewer || "A").charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-xl font-bold mb-1">
                  {review.reviewer || "Valued Customer"}
                </h4>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star ${i < review.rating ? "text-yellow-300" : "text-white/30"}`}
                    ></i>
                  ))}
                  <span className="ml-2 text-white/90">
                    ({review.rating}/5)
                  </span>
                </div>
              </div>
              <div className="text-right text-white/80 text-sm">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="mb-4">
              <span className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                <i className="fas fa-tag mr-2"></i>
                {review.productName}
              </span>
            </div>
            <p className="text-white/95 text-lg leading-relaxed">
              {review.comment}
            </p>
          </div>
        </div>
      </div>
    );
  }
  // classic
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-700/50 dark:to-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-slate-500 rounded-lg flex items-center justify-center text-white font-bold">
              {(review.reviewer || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {review.reviewer || "Anonymous Customer"}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {review.productName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={`fas fa-star text-sm ${i < review.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                ></i>
              ))}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(review.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {review.comment}
        </p>
      </div>
    </div>
  );
}

function SatisfactionFooter() {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-8 mt-12 border border-green-200 dark:border-green-800">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <i className="fas fa-thumbs-up text-white text-3xl"></i>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Thank You for Your Trust! 🙏
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Your feedback helps us grow better produce and serve our community
          with excellence. Every review makes a difference in our farming
          journey.
        </p>
        <div className="mt-6 flex justify-center space-x-8">
          <FooterMetric value="100%" label="Fresh Guarantee" />
          <FooterMetric value="24/7" label="Customer Support" />
          <FooterMetric value="Fast" label="Delivery" />
        </div>
      </div>
    </div>
  );
}

function FooterMetric({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
        {value}
      </div>
      <div className="text-gray-600 dark:text-gray-400 text-sm">{label}</div>
    </div>
  );
}

function NoReviews() {
  return (
    <div className="text-center py-20">
      <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
        <i className="fas fa-comment-dots text-6xl text-purple-400 dark:text-purple-300"></i>
      </div>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        No Reviews Yet
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-xl max-w-md mx-auto leading-relaxed mb-8">
        Be the first to share your experience with our fresh produce! Your
        feedback helps us serve you better.
      </p>
      <div className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
        <i className="fas fa-star mr-3"></i>Leave the First Review
        <i className="fas fa-arrow-right ml-3"></i>
      </div>
    </div>
  );
}
