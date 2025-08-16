import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

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
  const [page, setPage] = useState(1);
  const [allReviews, setAllReviews] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Query for fetching reviews
  const {
    data: reviewsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["reviews", productId, userId, page],
    queryFn: () => fetchReviews(productId, 1, userId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (reviewsData) {
      setAllReviews(reviewsData.reviews || []);
      setHasMore(reviewsData?.pagination?.hasMore || false);
      setPage(1);
    }
  }, [reviewsData]);

  const loadMoreReviews = async () => {
    if (!hasMore || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const next = await fetchReviews(productId, nextPage, userId);
      setAllReviews((prev) => [...prev, ...(next.reviews || [])]);
      setHasMore(next?.pagination?.hasMore || false);
      setPage(nextPage);
    } catch (e) {
      // swallow
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Mutation for submitting new reviews
  const submitReviewMutation = useMutation({
    mutationFn: submitReview,
    onSuccess: (data, variables) => {
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
    reviews: allReviews,
    pagination: reviewsData?.pagination || {},
    hasMoreReviews: hasMore,
    isLoading,
    isSubmitting: submitReviewMutation.isLoading,
    isUpdating: updateReviewMutation.isLoading,
    isDeleting: deleteReviewMutation.isLoading,
    isLoadingMore,
    error,
    submitError: submitReviewMutation.error,
    updateError: updateReviewMutation.error,
    deleteError: deleteReviewMutation.error,
    refetch,
    submitReview: submitReviewMutation.mutate,
    updateReview: updateReviewMutation.mutate,
    deleteReview: deleteReviewMutation.mutate,
    submitReviewAsync: submitReviewMutation.mutateAsync,
    updateReviewAsync: updateReviewMutation.mutateAsync,
    deleteReviewAsync: deleteReviewMutation.mutateAsync,
    loadMoreReviews,
  };
};
