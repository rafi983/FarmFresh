import { useEffect, useCallback, useRef } from "react";
import reviewEvents, { REVIEW_EVENTS } from "@/lib/reviewEvents";

// Custom hook to listen for review updates and trigger product data refresh
export const useReviewUpdates = (onReviewUpdate) => {
  const callbackRef = useRef(onReviewUpdate);

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = onReviewUpdate;
  }, [onReviewUpdate]);

  useEffect(() => {
    // Create a stable callback that uses the latest onReviewUpdate
    const handleReviewUpdate = (event) => {
      if (callbackRef.current) {
        callbackRef.current(event);
      }
    };

    // Subscribe to global review updates (for products list)
    const unsubscribe = reviewEvents.subscribeGlobal(handleReviewUpdate);

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);
};

// Hook specifically for product lists to refresh when reviews change
export const useProductListReviewUpdates = (refreshProducts) => {
  const refreshRef = useRef(refreshProducts);

  useEffect(() => {
    refreshRef.current = refreshProducts;
  }, [refreshProducts]);

  useReviewUpdates(
    useCallback((event) => {
      // Only refresh if the event affects review stats (rating/count changes)
      if (
        [
          REVIEW_EVENTS.ADDED,
          REVIEW_EVENTS.DELETED,
          REVIEW_EVENTS.UPDATED,
        ].includes(event.eventType)
      ) {
        // Debounce the refresh to avoid multiple rapid updates
        if (refreshRef.current) {
          refreshRef.current();
        }
      }
    }, []),
  );
};

// Hook for individual product pages to refresh when their reviews change
export const useProductReviewUpdates = (productId, refreshProduct) => {
  const refreshRef = useRef(refreshProduct);

  useEffect(() => {
    refreshRef.current = refreshProduct;
  }, [refreshProduct]);

  useEffect(() => {
    if (!productId) return;

    const handleReviewUpdate = (event) => {
      // Only refresh if this event is for our product
      if (event.productId === productId && refreshRef.current) {
        refreshRef.current();
      }
    };

    // Subscribe to updates for this specific product
    const unsubscribe = reviewEvents.subscribe(productId, handleReviewUpdate);

    return unsubscribe;
  }, [productId]);
};
