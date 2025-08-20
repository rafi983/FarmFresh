import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

export function useReorder() {
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const router = useRouter();
  const { addToCart } = useCart(); // Use addToCart instead of addMultipleToCart

  const validateReorder = useCallback(async (orderId, userId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to validate reorder");
      }

      const result = await response.json();
      setValidationResult(result);

      // Auto-proceed if everything is available and no price changes
      if (
        result.summary.fullReorderPossible &&
        result.summary.priceChangesCount === 0
      ) {
        return await proceedWithReorder(
          result.validation.availableItems,
          false,
        );
      }

      // Show modal for cases that need user attention
      setShowReorderModal(true);
      return result;
    } catch (error) {
      console.error("Reorder validation failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const proceedWithReorder = useCallback(
    async (items, showConfirmation = true) => {
      try {
        if (!items || items.length === 0) {
          throw new Error("No items available for reorder");
        }

        // Add items to cart one by one using the existing addToCart function
        let successCount = 0;
        for (const item of items) {
          const cartItem = {
            id: item.productId,
            productId: item.productId,
            name: item.productName,
            productName: item.productName,
            price: item.price,
            // farmerEmail retained only if downstream UI needs attribution
            farmerEmail: item.farmerEmail,
            image: item.image,
            stock: item.stock,
            category: item.category,
          };

          const success = await addToCart(cartItem, item.quantity);
          if (success) {
            successCount++;
          }
        }

        if (showConfirmation) {
          // Show success notification
          const message = `Successfully added ${successCount} item${
            successCount > 1 ? "s" : ""
          } to your cart!`;
          alert(message); // Replace with your notification system
        }

        // Close modal and redirect
        setShowReorderModal(false);
        setValidationResult(null);
        router.push("/cart");

        return { success: true, itemsAdded: successCount };
      } catch (error) {
        console.error("Failed to add reorder items to cart:", error);
        throw error;
      }
    },
    [addToCart, router],
  );

  const cancelReorder = useCallback(() => {
    setShowReorderModal(false);
    setValidationResult(null);
  }, []);

  // Helper function to handle partial reorder (only available items)
  const proceedWithAvailableItems = useCallback(() => {
    if (validationResult?.validation.availableItems) {
      return proceedWithReorder(validationResult.validation.availableItems);
    }
  }, [validationResult, proceedWithReorder]);

  // Helper function to get reorder status summary
  const getReorderSummary = useCallback((result) => {
    if (!result) return null;

    const { summary, validation } = result;

    return {
      canReorder: summary.reorderSuccess,
      isFullReorder: summary.fullReorderPossible,
      availableItems: summary.availableCount,
      totalItems: summary.totalOriginalItems,
      issues: {
        unavailable: summary.unavailableCount,
        priceChanges: summary.priceChangesCount,
        stockIssues: summary.stockIssuesCount,
        farmerIssues: summary.farmerIssuesCount,
      },
      pricing: result.pricing,
      items: validation,
    };
  }, []);

  return {
    loading,
    validationResult,
    showReorderModal,
    validateReorder,
    proceedWithReorder,
    proceedWithAvailableItems,
    cancelReorder,
    getReorderSummary,
    setShowReorderModal,
  };
}
