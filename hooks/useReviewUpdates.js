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
      console.log("🔄 Product list detected review update:", event);

      // Only refresh if the event affects review stats (rating/count changes)
      if (
        [
          REVIEW_EVENTS.ADDED,
          REVIEW_EVENTS.DELETED,
          REVIEW_EVENTS.UPDATED,
        ].includes(event.eventType)
      ) {
        console.log("🔄 Refreshing products list due to review change");

        // Add a small delay to ensure backend has processed the change
        setTimeout(() => {
          if (refreshRef.current) {
            refreshRef.current();
          }
        }, 100);
      }
    }, []),
  );
};

// Hook for individual product pages to listen for their specific product updates
export const useProductReviewUpdates = (productId, onUpdate) => {
  const updateRef = useRef(onUpdate);

  useEffect(() => {
    updateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!productId) return;

    const handleProductReviewUpdate = (eventType, data) => {
      console.log(
        `🔄 Product ${productId} detected review update:`,
        eventType,
        data,
      );

      if (updateRef.current) {
        updateRef.current(eventType, data);
      }
    };

    // Subscribe to updates for this specific product
    const unsubscribe = reviewEvents.subscribe(
      productId,
      handleProductReviewUpdate,
    );

    return unsubscribe;
  }, [productId]);
};
