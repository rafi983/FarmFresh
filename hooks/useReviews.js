import {useEffect, useState} from "react";

const useReviews = (productId, responseType) => {
    const [reviews, setReviews] = useState([]);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [hasMoreReviews, setHasMoreReviews] = useState(false);

    const fetchReviews = async (page = 1, append = false) => {
        try {
            const response = await fetch(`/api/products/${productId}/reviews?page=${page}`);
            if (response.ok) {
                const data = await response.json();

                if (append) {
                    setReviews(prev => [...prev, ...data.reviews]);
                } else {
                    setReviews(data.reviews);
                }
                setHasMoreReviews(data.hasMore);
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
    }, [productId, responseType]);

    return {
        reviews,
        hasMoreReviews,
        fetchReviews,
        reviewsPage
    };
};

export default useReviews;