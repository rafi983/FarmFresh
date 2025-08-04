import { useEffect, useState } from "react";
import reviewEvents, { REVIEW_EVENTS } from "@/lib/reviewEvents";

const useReviews = (productId, responseType, userId = null) => {
  const [reviews, setReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  const fetchReviews = async (page = 1, append = false) => {
    try {
      const url = `/api/products/${productId}/reviews?page=${page}${userId ? `&userId=${userId}` : ""}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();

        if (append) {
          setReviews((prev) => [...prev, ...data.reviews]);
        } else {
          setReviews(data.reviews);
        }
        setHasMoreReviews(data.pagination.hasMore);
        setReviewsPage(page);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  // Add method to submit a new review and emit event
  const submitReview = async (reviewData) => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        const newReview = await response.json();

        // Refresh reviews
        await fetchReviews();

        // Emit event to notify other components
        reviewEvents.emit(productId, REVIEW_EVENTS.ADDED, {
          review: newReview,
          productId,
        });

        return newReview;
      } else {
        throw new Error("Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      throw error;
    }
  };

  // Add method to update a review and emit event
  const updateReview = async (reviewId, reviewData) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        const updatedReview = await response.json();

        // Refresh reviews
        await fetchReviews();

        // Emit event to notify other components
        reviewEvents.emit(productId, REVIEW_EVENTS.UPDATED, {
          review: updatedReview,
          productId,
        });

        return updatedReview;
      } else {
        throw new Error("Failed to update review");
      }
    } catch (error) {
      console.error("Error updating review:", error);
      throw error;
    }
  };

  // Add method to delete a review and emit event
  const deleteReview = async (reviewId) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh reviews
        await fetchReviews();

        // Emit event to notify other components
        reviewEvents.emit(productId, REVIEW_EVENTS.DELETED, {
          reviewId,
          productId,
        });

        return true;
      } else {
        throw new Error("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (productId && responseType === "product") {
      fetchReviews();
    }
  }, [productId, responseType, userId]);

  return {
    reviews,
    hasMoreReviews,
    fetchReviews,
    reviewsPage,
    submitReview,
    updateReview,
    deleteReview,
  };
};

export default useReviews;
