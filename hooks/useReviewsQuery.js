import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// API functions
const fetchReviews = async (productId, page = 1, userId = null) => {
  // Ensure productId is a valid string
  const validProductId =
    productId && typeof productId === "object"
      ? productId._id || productId.id || String(productId)
      : String(productId || "");

  if (
    !validProductId ||
    validProductId === "undefined" ||
    validProductId === "null"
  ) {
    throw new Error("Invalid product ID");
  }

  const url = `/api/products/${validProductId}/reviews?page=${page}${userId ? `&userId=${userId}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch reviews");
  }
  return response.json();
};

const submitReview = async ({ productId, reviewData }) => {
  const response = await fetch(`/api/products/${productId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reviewData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit review");
  }

  return response.json();
};

const updateReview = async ({ reviewId, reviewData, userId }) => {
  const response = await fetch(`/api/reviews`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reviewId,
      reviewData: {
        ...reviewData,
        userId: userId,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update review");
  }

  return response.json();
};

const deleteReview = async ({ reviewId, userId }) => {
  const response = await fetch(`/api/reviews/${reviewId}?userId=${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete review");
  }

  return response.json();
};

export const useReviewsQuery = (productId, userId = null) => {
  const queryClient = useQueryClient();

  // Query for fetching reviews
  const {
    data: reviewsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["reviews", productId, userId],
    queryFn: () => fetchReviews(productId, 1, userId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for submitting new reviews
  const submitReviewMutation = useMutation({
    mutationFn: submitReview,
    onSuccess: (data, variables) => {
      console.log("✅ React Query: Review submitted successfully:", data);

      // Immediately invalidate cache after successful submission
      queryClient.invalidateQueries(["reviews", productId]);
      queryClient.invalidateQueries(["products", productId]);
      queryClient.invalidateQueries(["product", productId]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["allProducts"]);
      queryClient.invalidateQueries(["relatedProducts"]);

      // Emit a custom event for pages using custom API service
      const customEvent = new CustomEvent("reviewUpdated", {
        detail: {
          productId: variables.productId,
          type: "submit",
          data: data,
        },
      });
      window.dispatchEvent(customEvent);

      // Store in localStorage for cross-tab communication
      localStorage.setItem(
        "reviewUpdated",
        JSON.stringify({
          productId: variables.productId,
          type: "submit",
          data: data,
          timestamp: Date.now(),
        }),
      );

      // Force clear API service cache
      if (typeof window !== "undefined" && window.apiService) {
        window.apiService.clearProductsCache();
      }
    },
    onError: (error) => {
      console.error("❌ React Query: Error submitting review:", error);
    },
  });

  // Mutation for updating reviews
  const updateReviewMutation = useMutation({
    mutationFn: updateReview,
    onSuccess: (data, variables) => {
      console.log("✅ React Query: Review updated successfully:", data);

      // Immediately invalidate cache after successful update
      queryClient.invalidateQueries(["reviews", productId]);
      queryClient.invalidateQueries(["products", productId]);
      queryClient.invalidateQueries(["product", productId]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["allProducts"]);
      queryClient.invalidateQueries(["relatedProducts"]);

      // Emit a custom event for pages using custom API service
      const customEvent = new CustomEvent("reviewUpdated", {
        detail: {
          productId: productId,
          type: "update",
          data: data,
        },
      });
      window.dispatchEvent(customEvent);
    },
    onError: (error) => {
      console.error("❌ React Query: Error updating review:", error);
    },
  });

  // Mutation for deleting reviews
  const deleteReviewMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: (data, variables) => {
      console.log("✅ React Query: Review deleted successfully:", data);

      // Immediately invalidate cache after successful deletion
      queryClient.invalidateQueries(["reviews", productId]);
      queryClient.invalidateQueries(["products", productId]);
      queryClient.invalidateQueries(["product", productId]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["allProducts"]);
      queryClient.invalidateQueries(["relatedProducts"]);

      // Emit a custom event for pages using custom API service
      const customEvent = new CustomEvent("reviewUpdated", {
        detail: {
          productId: productId,
          type: "delete",
          data: data,
        },
      });
      window.dispatchEvent(customEvent);

      // Store in localStorage for cross-tab communication
      localStorage.setItem(
        "reviewUpdated",
        JSON.stringify({
          productId: productId,
          type: "delete",
          data: data,
          timestamp: Date.now(),
        }),
      );

      // Force clear API service cache
      if (typeof window !== "undefined" && window.apiService) {
        window.apiService.clearProductsCache();
      }
    },
    onError: (error) => {
      console.error("❌ React Query: Error deleting review:", error);
    },
  });

  return {
    // Data
    reviews: reviewsData?.reviews || [],
    pagination: reviewsData?.pagination || {},
    hasMoreReviews: reviewsData?.pagination?.hasMore || false,

    // Loading states
    isLoading,
    isSubmitting: submitReviewMutation.isLoading,
    isUpdating: updateReviewMutation.isLoading,
    isDeleting: deleteReviewMutation.isLoading,

    // Error states
    error,
    submitError: submitReviewMutation.error,
    updateError: updateReviewMutation.error,
    deleteError: deleteReviewMutation.error,

    // Actions
    refetch,
    submitReview: submitReviewMutation.mutate,
    updateReview: updateReviewMutation.mutate,
    deleteReview: deleteReviewMutation.mutate,

    // Async actions for when you need to await the result
    submitReviewAsync: submitReviewMutation.mutateAsync,
    updateReviewAsync: updateReviewMutation.mutateAsync,
    deleteReviewAsync: deleteReviewMutation.mutateAsync,
  };
};
