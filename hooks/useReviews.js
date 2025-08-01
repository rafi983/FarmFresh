import { useEffect, useState } from "react";

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
  };
};

export default useReviews;
