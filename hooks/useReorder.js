import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

export function useReorder() {
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const router = useRouter();
  const { addToCart } = useCart();

  // Create a simple toast function as fallback since ToastContext isn't integrated everywhere
  const showToast = useCallback((message, type = "info") => {
    // Use a simple approach for now - could be enhanced later

    // Try to show browser notification for important messages
    if (type === "success" || type === "error") {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`FarmFresh - ${type}`, { body: message });
      }
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
        let failedItems = [];

        for (const item of items) {
          try {
            const cartItem = {
              id: item.productId,
              productId: item.productId,
              name: item.productName,
              productName: item.productName,
              price: item.price,
              farmerName: item.farmerName || "Local Farmer",
              farmerEmail: item.farmerEmail || "",
              image: item.image,
              stock: item.stock,
              category: item.category,
              description: item.description,
              unit: item.unit || "unit",
            };

            await addToCart(cartItem, item.quantity);
            successCount++;
          } catch (error) {
            console.error(`Failed to add ${item.productName} to cart:`, error);
            failedItems.push({
              name: item.productName,
              error: error.message,
            });
          }
        }

        // Show appropriate notifications
        if (successCount > 0) {
          const message = `Successfully added ${successCount} item${
            successCount > 1 ? "s" : ""
          } to your cart!`;
          showToast(message, "success");
        }

        if (failedItems.length > 0) {
          const failedMessage = `Failed to add ${failedItems.length} item${
            failedItems.length > 1 ? "s" : ""
          }: ${failedItems.map((item) => item.name).join(", ")}`;
          showToast(failedMessage, "warning");
        }

        // Close modal and redirect only if at least one item was added
        if (successCount > 0) {
          setShowReorderModal(false);
          setValidationResult(null);
          router.push("/cart");
        }

        return {
          success: successCount > 0,
          itemsAdded: successCount,
          failedItems: failedItems,
        };
      } catch (error) {
        console.error("Failed to process reorder:", error);
        showToast(error.message || "Failed to process reorder", "error");
        throw error;
      }
    },
    [addToCart, router, showToast],
  );

  const validateReorder = useCallback(
    async (orderId, userId) => {
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
          const errorData = await response.json().catch(() => ({}));

          // Handle the case where no delivered items are available
          if (errorData.error === "No delivered items available for reorder") {
            showToast(
              errorData.message ||
                "This order contains no delivered items that can be reordered.",
              "warning",
            );
            return null;
          }

          throw new Error(errorData.error || "Failed to validate reorder");
        }

        const result = await response.json();

        setValidationResult(result);

        // Check for undelivered items and show appropriate messaging
        const hasUndeliveredItems =
          (result.validation.undeliveredItems?.length || 0) > 0;
        const hasOtherIssues =
          result.summary.unavailableCount > 0 ||
          result.summary.stockIssuesCount > 0 ||
          result.summary.farmerIssuesCount > 0;

        const hasSignificantPriceChanges = result.validation.priceChanges.some(
          (item) => Math.abs(item.priceDifference) > 10,
        );

        // Show info about undelivered items (but don't prevent auto-proceed)
        if (hasUndeliveredItems) {
          const undeliveredCount = result.validation.undeliveredItems.length;
          const undeliveredNames = result.validation.undeliveredItems
            .map((item) => item.productName || item.name)
            .join(", ");

          showToast(
            `Note: ${undeliveredCount} item(s) from this order haven't been delivered yet and won't be included in the reorder: ${undeliveredNames}`,
            "info",
          );
        }

        // Auto-proceed if we have available items and no issues with those items
        // Undelivered items don't prevent auto-proceed since they're just filtered out
        if (
          result.summary.availableCount > 0 &&
          !hasOtherIssues &&
          !hasSignificantPriceChanges
        ) {
          showToast("Adding delivered items to cart...", "info");
          return await proceedWithReorder(
            result.validation.availableItems,
            false,
          );
        }

        setShowReorderModal(true);
        return result;
      } catch (error) {
        console.error("🔍 [REORDER DEBUG] Validation failed:", error);
        showToast(error.message || "Failed to validate reorder", "error");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showToast, proceedWithReorder],
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
