import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import reviewEvents, { REVIEW_EVENTS } from "@/lib/reviewEvents";

// API functions
const fetchReviews = async (productId, page = 1, userId = null) => {
  const url = `/api/products/${productId}/reviews?page=${page}${userId ? `&userId=${userId}` : ""}`;
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
  const response = await fetch(`/api/reviews/${reviewId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...reviewData,
      userId: userId,
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

  // Listen for review events from API and invalidate cache accordingly
  useEffect(() => {
    if (!productId) return;

    const handleReviewEvent = (event) => {
      console.log(
        `🔄 React Query: Received review event for product ${productId}:`,
        event,
      );

      // Invalidate all relevant queries when any review changes
      const invalidateQueries = async () => {
        // Invalidate reviews for this specific product
        await queryClient.invalidateQueries(["reviews", productId]);

        // Invalidate product-specific queries to update rating/count
        await queryClient.invalidateQueries(["products", productId]);
        await queryClient.invalidateQueries(["product", productId]);

        // Invalidate all products queries to refresh product listings
        await queryClient.invalidateQueries(["products"]);
        await queryClient.invalidateQueries(["allProducts"]);

        // Invalidate related products queries
        await queryClient.invalidateQueries(["relatedProducts"]);

        console.log(
          `✅ React Query: Cache invalidated for product ${productId}`,
        );
      };

      // Add a small delay to ensure API changes are complete
      setTimeout(invalidateQueries, 100);
    };

    // Subscribe to events for this specific product
    const unsubscribeProduct = reviewEvents.subscribe(
      productId,
      handleReviewEvent,
    );

    // Also subscribe to global events in case of cross-product updates
    const unsubscribeGlobal = reviewEvents.subscribeGlobal((event) => {
      if (event.productId === productId) {
        handleReviewEvent(event);
      }
    });

    return () => {
      unsubscribeProduct();
      unsubscribeGlobal();
    };
  }, [productId, queryClient]);

  // Mutation for submitting new reviews
  const submitReviewMutation = useMutation({
    mutationFn: submitReview,
    onSuccess: (data, variables) => {
      console.log("✅ React Query: Review submitted successfully:", data);
      console.log("📝 React Query: Mutation variables:", variables);

      // Immediately invalidate cache after successful submission
      console.log("🔄 React Query: Starting immediate cache invalidation...");

      // Invalidate reviews for this specific product
      queryClient.invalidateQueries(["reviews", productId]);

      // Invalidate product-specific queries to update rating/count
      queryClient.invalidateQueries(["products", productId]);
      queryClient.invalidateQueries(["product", productId]);

      // Invalidate all products queries to refresh product listings
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["allProducts"]);

      // Invalidate related products queries
      queryClient.invalidateQueries(["relatedProducts"]);

      // Force clear all product-related cache in React Query
      queryClient.removeQueries(["products"]);
      queryClient.removeQueries(["allProducts"]);
      queryClient.removeQueries(["product"]);

      // Emit a custom event for pages using custom API service
      console.log("🚀 React Query: Dispatching reviewUpdated event...");
      const customEvent = new CustomEvent("reviewUpdated", {
        detail: {
          productId: variables.productId,
          type: "submit",
          data: data,
        },
      });
      window.dispatchEvent(customEvent);
      console.log("✅ React Query: reviewUpdated event dispatched");

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

      // Also emit review event for event system
      console.log("🚀 React Query: Emitting review event...");
      reviewEvents.emit(variables.productId, {
        type: "REVIEW_SUBMITTED",
        productId: variables.productId,
        data: data,
      });
      console.log("✅ React Query: Review event emitted");

      // Force clear API service cache immediately
      console.log("🚀 React Query: Forcing API service cache clear...");
      if (typeof window !== "undefined" && window.apiService) {
        window.apiService.clearProductsCache();
      }
      console.log("✅ React Query: API service cache clear attempted");

      console.log("✅ React Query: Immediate cache invalidation completed");
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
      console.log("📝 React Query: Update variables:", variables);

      // Immediately invalidate cache after successful update
      console.log("🔄 React Query: Starting immediate cache invalidation...");

      queryClient.invalidateQueries(["reviews", productId]);
      queryClient.invalidateQueries(["products", productId]);
      queryClient.invalidateQueries(["product", productId]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["allProducts"]);
      queryClient.invalidateQueries(["relatedProducts"]);

      // Force clear all product-related cache in React Query
      queryClient.removeQueries(["products"]);
      queryClient.removeQueries(["allProducts"]);
      queryClient.removeQueries(["product"]);

      // Emit a custom event for pages using custom API service
      const customEvent = new CustomEvent("reviewUpdated", {
        detail: {
          productId: productId,
          type: "update",
          data: data,
        },
      });
      window.dispatchEvent(customEvent);

      // Also emit review event for event system
      reviewEvents.emit(productId, {
        type: "REVIEW_UPDATED",
        productId: productId,
        data: data,
      });

      console.log("✅ React Query: Immediate cache invalidation completed");
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
      console.log("📝 React Query: Delete variables:", variables);

      // Immediately invalidate cache after successful deletion
      console.log("🔄 React Query: Starting immediate cache invalidation...");

      queryClient.invalidateQueries(["reviews", productId]);
      queryClient.invalidateQueries(["products", productId]);
      queryClient.invalidateQueries(["product", productId]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["allProducts"]);
      queryClient.invalidateQueries(["relatedProducts"]);

      // Force clear all product-related cache in React Query
      queryClient.removeQueries(["products"]);
      queryClient.removeQueries(["allProducts"]);
      queryClient.removeQueries(["product"]);

      // Emit a custom event for pages using custom API service
      console.log("🚀 React Query: Dispatching reviewUpdated event...");
      const customEvent = new CustomEvent("reviewUpdated", {
        detail: {
          productId: productId,
          type: "delete",
          data: data,
        },
      });
      window.dispatchEvent(customEvent);
      console.log("✅ React Query: reviewUpdated event dispatched");

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

      // Also emit review event for event system
      console.log("🚀 React Query: Emitting review event...");
      reviewEvents.emit(productId, {
        type: "REVIEW_DELETED",
        productId: productId,
        data: data,
      });
      console.log("✅ React Query: Review event emitted");

      // Force clear API service cache immediately
      console.log("🚀 React Query: Forcing API service cache clear...");
      if (typeof window !== "undefined" && window.apiService) {
        window.apiService.clearProductsCache();
      }
      console.log("✅ React Query: API service cache clear attempted");

      console.log("✅ React Query: Immediate cache invalidation completed");
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
