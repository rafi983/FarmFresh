import { useState, useEffect, useMemo } from "react";
import StarRating from "@/components/StarRating";

export default function EnhancedReviewModal({
  isOpen,
  onClose,
  product,
  user,
  existingReview = null,
  onSubmit,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    comment: "",
    pros: "",
    cons: "",
    wouldRecommend: true,
    isAnonymous: false,
    tags: [],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  // Predefined tags for different product categories
  const availableTags = useMemo(() => {
    const categoryTags = {
      vegetables: [
        "Fresh",
        "Organic",
        "Crispy",
        "Sweet",
        "Bitter",
        "Tender",
        "Juicy",
      ],
      fruits: [
        "Sweet",
        "Sour",
        "Juicy",
        "Fresh",
        "Ripe",
        "Organic",
        "Crispy",
        "Soft",
      ],
      dairy: ["Creamy", "Rich", "Fresh", "Smooth", "Thick", "Natural"],
      meat: ["Tender", "Fresh", "Lean", "Juicy", "Well-marbled", "Flavorful"],
      grains: ["Fresh", "Organic", "High-quality", "Clean", "Aromatic"],
    };

    const category = product?.category?.toLowerCase() || "general";
    return (
      categoryTags[category] || [
        "High Quality",
        "Fresh",
        "Good Value",
        "Fast Delivery",
        "Well Packaged",
        "As Described",
        "Organic",
        "Natural",
        "Healthy",
        "Delicious",
      ]
    );
  }, [product?.category]);

  // Animation effect
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Pre-fill form if editing existing review
  useEffect(() => {
    if (existingReview) {
      setFormData({
        rating: existingReview.rating || 5,
        title: existingReview.title || "",
        comment: existingReview.comment || "",
        pros: existingReview.pros || "",
        cons: existingReview.cons || "",
        wouldRecommend: existingReview.wouldRecommend ?? true,
        isAnonymous: existingReview.isAnonymous || false,
        tags: existingReview.tags || [],
      });
      setSelectedTags(existingReview.tags || []);
    } else {
      // Reset form for new review
      setFormData({
        rating: 5,
        title: "",
        comment: "",
        pros: "",
        cons: "",
        wouldRecommend: true,
        isAnonymous: false,
        tags: [],
      });
      setSelectedTags([]);
      setCurrentStep(1);
    }
  }, [existingReview, isOpen]);

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
          newErrors.rating = "Please select a rating between 1 and 5 stars";
        }
        if (!formData.title.trim()) {
          newErrors.title = "Please provide a title for your review";
        } else if (formData.title.length < 5) {
          newErrors.title = "Title must be at least 5 characters long";
        } else if (formData.title.length > 100) {
          newErrors.title = "Title must be less than 100 characters";
        }
        break;

      case 2:
        if (!formData.comment.trim()) {
          newErrors.comment = "Please write your detailed review";
        } else if (formData.comment.length < 20) {
          newErrors.comment = "Review must be at least 20 characters long";
        } else if (formData.comment.length > 1000) {
          newErrors.comment = "Review must be less than 1000 characters";
        }
        break;

      case 3:
        // Optional step - no validation required
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleTagToggle = (tag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);
    setFormData((prev) => ({ ...prev, tags: newTags }));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1);
      return;
    }

    const reviewData = {
      ...formData,
      tags: selectedTags,
      productId: product?.id || product?._id,
      userId: user?.id || user?._id || user?.userId,
      userName: formData.isAnonymous ? "Anonymous" : user?.name || user?.email,
      userEmail: user?.email,
    };

    await onSubmit(reviewData);
  };

  const getRatingText = (rating) => {
    const texts = {
      1: "Terrible",
      2: "Poor",
      3: "Average",
      4: "Good",
      5: "Excellent",
    };
    return texts[rating] || "Not rated";
  };

  const getRatingColor = (rating) => {
    if (rating <= 2) return "text-red-500";
    if (rating === 3) return "text-yellow-500";
    return "text-green-500";
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-300 ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}
      >
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white p-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <i className="fas fa-star text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight">
                      {existingReview ? "Edit Review" : "Write a Review"}
                    </h3>
                    <p className="text-blue-100 text-lg">
                      Share your experience with {product?.name}
                    </p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center space-x-4 mt-6">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          currentStep >= step
                            ? "bg-white text-blue-600 shadow-lg"
                            : "bg-white/20 text-white border-2 border-white/30"
                        }`}
                      >
                        {step}
                      </div>
                      {step < 3 && (
                        <div
                          className={`w-12 h-1 mx-2 rounded transition-all duration-300 ${
                            currentStep > step ? "bg-white" : "bg-white/30"
                          }`}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-sm text-blue-100 mt-2">
                  Step {currentStep} of 3:{" "}
                  {currentStep === 1
                    ? "Rating & Title"
                    : currentStep === 2
                      ? "Detailed Review"
                      : "Additional Details"}
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 group"
              >
                <i className="fas fa-times text-xl group-hover:rotate-90 transition-transform duration-200"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-280px)]">
          {/* Step 1: Rating & Title */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Rating Section */}
              <div className="text-center">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  How would you rate this product?
                </h4>

                <div className="flex justify-center items-center space-x-4 mb-4">
                  <StarRating
                    rating={formData.rating}
                    onRatingChange={(rating) => {
                      setFormData((prev) => ({ ...prev, rating }));
                      setErrors((prev) => ({ ...prev, rating: null }));
                    }}
                    size="large"
                    interactive={true}
                  />
                  <div className="text-left">
                    <div
                      className={`text-2xl font-bold ${getRatingColor(formData.rating)}`}
                    >
                      {getRatingText(formData.rating)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formData.rating}/5 stars
                    </div>
                  </div>
                </div>

                {errors.rating && (
                  <p className="text-red-500 text-sm mt-2">{errors.rating}</p>
                )}
              </div>

              {/* Title Section */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Give your review a title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, title: e.target.value }));
                    setErrors((prev) => ({ ...prev, title: null }));
                  }}
                  placeholder="e.g., Great quality vegetables, fresh and crispy!"
                  className={`w-full px-4 py-3 border-2 rounded-xl text-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.title && (
                    <p className="text-red-500 text-sm">{errors.title}</p>
                  )}
                  <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                    {formData.title.length}/100
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Would you recommend this product?
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, wouldRecommend: true }))
                    }
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      formData.wouldRecommend
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <i className="fas fa-thumbs-up mr-2"></i>
                    Yes, I recommend this
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        wouldRecommend: false,
                      }))
                    }
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      !formData.wouldRecommend
                        ? "bg-red-600 text-white shadow-lg"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <i className="fas fa-thumbs-down mr-2"></i>
                    No, I don't recommend
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Detailed Review */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Detailed Comment */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Tell us about your experience
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }));
                    setErrors((prev) => ({ ...prev, comment: null }));
                  }}
                  placeholder="Share your detailed experience with this product. What did you like? How was the quality, freshness, taste, etc.?"
                  rows={6}
                  className={`w-full px-4 py-3 border-2 rounded-xl resize-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                    errors.comment ? "border-red-500" : "border-gray-300"
                  }`}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.comment && (
                    <p className="text-red-500 text-sm">{errors.comment}</p>
                  )}
                  <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                    {formData.comment.length}/1000
                  </div>
                </div>
              </div>

              {/* Pros and Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    <i className="fas fa-plus-circle text-green-500 mr-2"></i>
                    What did you like? (Optional)
                  </label>
                  <textarea
                    value={formData.pros}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, pros: e.target.value }))
                    }
                    placeholder="e.g., Very fresh, great taste, good packaging..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
                    maxLength={300}
                  />
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {formData.pros.length}/300
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    <i className="fas fa-minus-circle text-red-500 mr-2"></i>
                    What could be improved? (Optional)
                  </label>
                  <textarea
                    value={formData.cons}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, cons: e.target.value }))
                    }
                    placeholder="e.g., Packaging could be better, slightly expensive..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
                    maxLength={300}
                  />
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {formData.cons.length}/300
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Additional Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Tags */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Add tags to help others (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? "bg-blue-600 text-white shadow-lg transform scale-105"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    Selected: {selectedTags.join(", ")}
                  </div>
                )}
              </div>

              {/* Privacy Settings */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Privacy Settings
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAnonymous}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isAnonymous: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Post anonymously
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Your name will be shown as "Anonymous" instead of your
                        actual name
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Review Preview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <i className="fas fa-eye mr-2 text-blue-600"></i>
                  Review Preview
                </h5>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <StarRating rating={formData.rating} size="small" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formData.title || "Review title"}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {formData.comment ||
                      "Your detailed review will appear here..."}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    By{" "}
                    {formData.isAnonymous
                      ? "Anonymous"
                      : user?.name || "Your Name"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl font-semibold transition-all duration-200 flex items-center"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl font-semibold transition-all duration-200"
              >
                Cancel
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
                >
                  Next
                  <i className="fas fa-arrow-right ml-2"></i>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center shadow-lg hover:shadow-xl"
                >
                  {isSubmitting && (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  )}
                  <i className="fas fa-paper-plane mr-2"></i>
                  {existingReview ? "Update Review" : "Submit Review"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
