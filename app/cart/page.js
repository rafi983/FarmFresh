"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import Footer from "@/components/Footer";
import { debounce } from "@/utils/debounce";
import { useFarmersData } from "@/hooks/useFarmerData";

export default function Cart() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    loading,
    paymentProcessing,
    recentlyOrderedItems,
  } = useCart();

  const [removingItems, setRemovingItems] = useState(new Set());
  const [updatingQuantities, setUpdatingQuantities] = useState(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [viewMode, setViewMode] = useState("detailed"); // detailed or compact
  const [notifications, setNotifications] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localQuantities, setLocalQuantities] = useState({});

  const notificationTimeouts = useRef(new Map());

  // Debug: Log cart state changes
  useEffect(() => {
    console.log("Cart Debug - Items changed:", items);
    console.log("Cart Debug - Items count:", items.length);
    console.log("Cart Debug - Cart count from hook:", getCartItemsCount());

    // Debug: Check if any items are missing image data
    if (items.length > 0) {
      items.forEach((item) => {
        if (!item.image && !item.images) {
          console.warn(
            `Cart Debug - MISSING IMAGE DATA for ${item.name}:`,
            item,
          );
        } else {
          console.log(`Cart Debug - ${item.name} has image data:`, {
            hasImage: !!item.image,
            hasImages: !!item.images,
            imageType: typeof item.image,
            imagesType: typeof item.images,
          });
        }
      });
    }
  }, [items, getCartItemsCount]);

  // Get effective quantity (local or actual) - Move this up before it's used
  const getEffectiveQuantity = useCallback(
    (item) => {
      return localQuantities[item.id] !== undefined
        ? localQuantities[item.id]
        : item.quantity;
    },
    [localQuantities],
  );

  // Extract unique farmer IDs from cart items with debugging
  const farmerIds = useMemo(() => {
    const ids = items
      .map((item) => {
        console.log("Cart Debug - Processing item for farmer ID:", item);

        if (typeof item.farmer === "object" && item.farmer?._id) {
          console.log(
            "Cart Debug - Found farmer object with _id:",
            item.farmer._id,
          );
          return item.farmer._id;
        } else if (item.farmerId) {
          console.log("Cart Debug - Found farmerId:", item.farmerId);
          return item.farmerId;
        }

        console.log("Cart Debug - No farmer ID found for item:", item.name);
        return null;
      })
      .filter(Boolean);

    console.log("Cart Debug - Extracted farmer IDs:", ids);
    const uniqueIds = [...new Set(ids)];
    console.log("Cart Debug - Unique farmer IDs:", uniqueIds);
    return uniqueIds;
  }, [items]);

  // Fetch farmer data dynamically with debugging
  const {
    farmers: farmersData,
    loading: farmersLoading,
    getFarmer,
  } = useFarmersData(farmerIds);

  // Debug farmer data loading
  useEffect(() => {
    console.log("Cart Debug - Farmers loading:", farmersLoading);
    console.log("Cart Debug - Farmers data:", farmersData);
  }, [farmersLoading, farmersData]);

  // Enhanced cart items processing to properly extract and display farmer names and product images
  const enrichedCartItems = useMemo(() => {
    return items.map((item) => {
      // Extract farmer information with proper loading states
      let farmerName = "Loading...";
      let farmerId = null;

      // Priority 1: Direct farmer object with name
      if (typeof item.farmer === "object" && item.farmer?.name) {
        farmerName = item.farmer.name;
        farmerId = item.farmer._id || item.farmer.id;
      }
      // Priority 2: Direct farmer name string
      else if (typeof item.farmer === "string" && item.farmer.trim()) {
        farmerName = item.farmer;
      }
      // Priority 3: farmerName field (from localStorage simplified data)
      else if (item.farmerName && item.farmerName.trim()) {
        farmerName = item.farmerName;
        farmerId = item.farmerId;
      }
      // Priority 4: farmerId field - get from database
      else if (item.farmerId) {
        farmerId = item.farmerId;

        if (farmersLoading) {
          farmerName = "Loading...";
        } else {
          const farmerData = getFarmer(item.farmerId);
          if (farmerData && farmerData.name) {
            farmerName = farmerData.name;
          } else {
            farmerName = "Unknown Farmer";
          }
        }
      } else {
        farmerName = "Unknown Farmer";
      }

      // Enhanced image handling with better fallbacks and debugging
      let productImage = null;

      // Debug: Log the item's image data
      console.log(`Cart Debug - Image data for ${item.name}:`, {
        image: item.image,
        images: item.images,
        category: item.category,
      });

      // Helper function to extract URL from various image formats
      const extractImageUrl = (imageData) => {
        if (!imageData) return null;

        // Direct string URL
        if (typeof imageData === "string" && imageData.trim()) {
          return imageData.trim();
        }

        // Object with url property
        if (typeof imageData === "object" && imageData.url) {
          return imageData.url;
        }

        // Object with src property
        if (typeof imageData === "object" && imageData.src) {
          return imageData.src;
        }

        // Object with path property
        if (typeof imageData === "object" && imageData.path) {
          return imageData.path;
        }

        return null;
      };

      // Priority 1: Direct image field
      if (item.image) {
        if (Array.isArray(item.image) && item.image.length > 0) {
          productImage = extractImageUrl(item.image[0]);
          console.log(
            `Cart Debug - Using image array[0] for ${item.name}:`,
            productImage,
          );
        } else {
          productImage = extractImageUrl(item.image);
          console.log(
            `Cart Debug - Using direct image for ${item.name}:`,
            productImage,
          );
        }
      }

      // Priority 2: images array field
      if (
        !productImage &&
        item.images &&
        Array.isArray(item.images) &&
        item.images.length > 0
      ) {
        productImage = extractImageUrl(item.images[0]);
        console.log(
          `Cart Debug - Using images array[0] for ${item.name}:`,
          productImage,
        );
      }

      // Priority 3: Only use category fallback if NO image data exists at all
      if (!productImage && item.category) {
        console.log(
          `Cart Debug - No image found, using category fallback for ${item.name} (category: ${item.category})`,
        );

        const categoryImages = {
          Vegetables:
            "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=300&fit=crop",
          Fruits:
            "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&h=300&fit=crop",
          Dairy:
            "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop",
          Herbs:
            "https://images.unsplash.com/photo-1462536943532-57a629f6cc60?w=300&h=300&fit=crop",
          Honey:
            "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop",
          Grains:
            "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop",
          Spices:
            "https://images.unsplash.com/photo-1596040033229-a9821ebc227d?w=300&h=300&fit=crop",
          Meat: "https://images.unsplash.com/photo-1588347818505-d0e4dfe81f30?w=300&h=300&fit=crop",
          // Add more specific category mappings
          Leafy:
            "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=300&fit=crop",
          Root: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=300&fit=crop",
          Citrus:
            "https://images.unsplash.com/photo-1557800634-7bf3c7e2d5ae?w=300&h=300&fit=crop",
          Berries:
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop",
        };

        // Try exact category match first, then fallback to generic vegetable image
        productImage =
          categoryImages[item.category] || categoryImages["Vegetables"];
      }

      // Priority 4: Ultimate fallback if no category or image
      if (!productImage) {
        console.log(`Cart Debug - Using ultimate fallback for ${item.name}`);
        productImage =
          "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&h=300&fit=crop";
      }

      console.log(`Cart Debug - Final image for ${item.name}:`, productImage);

      return {
        ...item,
        enrichedFarmerName: farmerName,
        enrichedFarmerId: farmerId || item.farmerId,
        enrichedImage: productImage,
        effectiveQuantity: getEffectiveQuantity(item),
        isUpdating: updatingQuantities.has(item.id),
        isRemoving: removingItems.has(item.id),
      };
    });
  }, [
    items,
    getEffectiveQuantity,
    updatingQuantities,
    removingItems,
    getFarmer,
    farmersLoading,
  ]);

  // Enhanced cart statistics with proper farmer counting
  const cartStats = useMemo(() => {
    if (!enrichedCartItems.length) {
      return {
        totalItems: 0,
        totalAmount: 0,
        uniqueItems: 0,
        averagePrice: 0,
        farmers: 0,
        categories: 0,
        estimatedSavings: 50,
      };
    }

    const totalItems = getCartItemsCount();
    const totalAmount = getCartTotal();

    // Only count non-loading farmers
    const farmers = new Set(
      enrichedCartItems
        .map((item) => item.enrichedFarmerName)
        .filter((name) => name !== "Loading..." && name !== "Unknown Farmer"),
    ).size;

    const categories = new Set(enrichedCartItems.map((item) => item.category))
      .size;

    return {
      totalItems,
      totalAmount,
      uniqueItems: enrichedCartItems.length,
      averagePrice: totalItems > 0 ? totalAmount / totalItems : 0,
      farmers,
      categories,
      estimatedSavings: 50 + (totalAmount >= 500 ? 25 : 0),
    };
  }, [enrichedCartItems, getCartTotal, getCartItemsCount]);

  // Debounced quantity update to prevent excessive API calls
  const debouncedQuantityUpdate = useMemo(
    () =>
      debounce(async (productId, newQuantity) => {
        if (newQuantity <= 0) {
          handleRemoveItem(productId);
          return;
        }

        setUpdatingQuantities((prev) => new Set(prev).add(productId));

        try {
          await updateQuantity(productId, newQuantity);
          addNotification(`Quantity updated successfully`, "success");
        } catch (error) {
          console.error("Error updating quantity:", error);
          addNotification("Failed to update quantity", "error");
          // Revert local quantity on error
          setLocalQuantities((prev) => {
            const newQuantities = { ...prev };
            delete newQuantities[productId];
            return newQuantities;
          });
        } finally {
          setUpdatingQuantities((prev) => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        }
      }, 500),
    [updateQuantity],
  );

  // Enhanced notification system
  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, timestamp: new Date() };

    setNotifications((prev) => [notification, ...prev.slice(0, 2)]); // Limit to 3 notifications

    // Clear existing timeout for the same type if exists
    if (notificationTimeouts.current.has(type)) {
      clearTimeout(notificationTimeouts.current.get(type));
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      notificationTimeouts.current.delete(type);
    }, 4000);

    notificationTimeouts.current.set(type, timeoutId);
  }, []);

  // Calculate delivery estimate
  const getDeliveryEstimate = useCallback(() => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3); // Add 3 days for delivery

    return deliveryDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      notificationTimeouts.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  // Optimized quantity change handler with stock validation
  const handleQuantityChange = useCallback(
    (productId, newQuantity) => {
      // Find the product to check stock
      const cartItem = items.find((item) => item.id === productId);
      if (!cartItem) return;

      // Validate stock before making changes
      if (newQuantity > cartItem.stock) {
        addNotification(
          `Cannot set quantity to ${newQuantity}. Only ${cartItem.stock} ${cartItem.unit || "units"} available for ${cartItem.name}.`,
          "error",
        );
        return; // Don't proceed with the update
      }

      // Immediate UI update for better UX
      setLocalQuantities((prev) => ({
        ...prev,
        [productId]: newQuantity,
      }));

      // Debounced API call
      debouncedQuantityUpdate(productId, newQuantity);
    },
    [debouncedQuantityUpdate, items, addNotification],
  );

  // Enhanced remove item handler
  const handleRemoveItem = useCallback(
    async (productId) => {
      setRemovingItems((prev) => new Set(prev).add(productId));
      setIsProcessing(true);

      try {
        await removeFromCart(productId);
        addNotification("Item removed from cart", "success");
        // Clear local quantity if exists
        setLocalQuantities((prev) => {
          const newQuantities = { ...prev };
          delete newQuantities[productId];
          return newQuantities;
        });
      } catch (error) {
        console.error("Error removing item:", error);
        addNotification("Failed to remove item", "error");
      } finally {
        setRemovingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        setIsProcessing(false);
      }
    },
    [removeFromCart, addNotification],
  );

  // Enhanced clear cart handler
  const handleClearCart = useCallback(async () => {
    setShowClearConfirm(false);
    setIsProcessing(true);

    try {
      await clearCart();
      setLocalQuantities({});
      addNotification("Cart cleared successfully", "success");
    } catch (error) {
      console.error("Error clearing cart:", error);
      addNotification("Failed to clear cart", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [clearCart, addNotification]);

  // Optimized price formatter with memoization
  const formatPrice = useCallback((price) => {
    const numericPrice =
      typeof price === "number" ? price : parseFloat(price) || 0;
    return `৳${numericPrice.toFixed(0)}`;
  }, []);

  // Enhanced delivery estimate
  const deliveryEstimate = useMemo(() => {
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return {
      date: deliveryDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
      timeSlot: "9 AM - 6 PM",
      express: cartStats.totalAmount >= 1000,
    };
  }, [cartStats.totalAmount]);

  // Memoized cart items to prevent unnecessary re-renders
  const memoizedCartItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        effectiveQuantity: getEffectiveQuantity(item),
        isUpdating: updatingQuantities.has(item.id),
        isRemoving: removingItems.has(item.id),
      })),
    [items, getEffectiveQuantity, updatingQuantities, removingItems],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent border-t-green-600 border-r-blue-600 mx-auto mb-4"></div>
            <div
              className="absolute inset-0 rounded-full h-32 w-32 border-4 border-transparent border-b-purple-600 border-l-orange-600 animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading Your Cart
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we fetch your items...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Enhanced Notification System */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-6 py-4 rounded-lg shadow-lg text-white transform transition-all duration-500 slide-in-right ${
              notification.type === "success"
                ? "bg-green-600"
                : notification.type === "error"
                  ? "bg-red-600"
                  : notification.type === "warning"
                    ? "bg-yellow-600"
                    : "bg-blue-600"
            }`}
          >
            <div className="flex items-center">
              <i
                className={`fas ${
                  notification.type === "success"
                    ? "fa-check-circle"
                    : notification.type === "error"
                      ? "fa-exclamation-circle"
                      : notification.type === "warning"
                        ? "fa-exclamation-triangle"
                        : "fa-info-circle"
                } mr-2`}
              ></i>
              {notification.message}
            </div>
          </div>
        ))}
      </div>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 dark:from-green-400/10 dark:to-blue-400/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <nav className="flex mb-8" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-gray-500 hover:text-green-600 transition-colors duration-200 flex items-center"
                  >
                    <i className="fas fa-home mr-1"></i>
                    Home
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                </li>
                <li>
                  <Link
                    href="/products"
                    className="text-gray-500 hover:text-green-600 transition-colors duration-200"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                </li>
                <li className="text-gray-900 dark:text-white font-medium">
                  Shopping Cart
                </li>
              </ol>
            </nav>

            {/* Page Header with Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                  Shopping Cart
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Review and manage your selected items • {cartStats.totalItems}{" "}
                  items
                </p>
              </div>

              {/* Quick Stats Cards - Only show if items exist */}
              {items.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {cartStats.totalItems}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total Items
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {cartStats.farmers}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Farmers
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {cartStats.categories}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Categories
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {formatPrice(cartStats.totalAmount)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total Value
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {paymentProcessing ? (
            /* Payment Processing State */
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-full flex items-center justify-center">
                  <i className="fas fa-credit-card text-5xl text-green-600 dark:text-green-400 animate-pulse"></i>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-spin">
                  <i className="fas fa-spinner text-white text-sm"></i>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Payment Processing
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                Your order has been placed successfully! We&apos;re clearing
                your cart and preparing your fresh products for delivery.
              </p>

              {recentlyOrderedItems.length > 0 && (
                <div className="max-w-2xl mx-auto">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Items in your order:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {recentlyOrderedItems.slice(0, 4).map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                      >
                        <img
                          src={
                            item.image ||
                            "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=50&h=50&fit=crop"
                          }
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Qty: {item.quantity} •{" "}
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {recentlyOrderedItems.length > 4 && (
                      <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400">
                        +{recentlyOrderedItems.length - 4} more items
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <i className="fas fa-seedling mr-2"></i>
                  Continue Shopping
                </Link>
                <Link
                  href="/orders"
                  className="inline-flex items-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-all duration-200"
                >
                  <i className="fas fa-receipt mr-2"></i>
                  View Orders
                </Link>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* Enhanced Empty Cart State */
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-full flex items-center justify-center">
                  <i className="fas fa-shopping-cart text-5xl text-green-600 dark:text-green-400"></i>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation text-white text-sm"></i>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Your cart is empty
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                Discover fresh, organic products from local farmers and add them
                to your cart to get started!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <i className="fas fa-seedling mr-2"></i>
                  Browse Fresh Products
                </Link>
                <Link
                  href="/farmers"
                  className="inline-flex items-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-all duration-200"
                >
                  <i className="fas fa-users mr-2"></i>
                  Meet Our Farmers
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Enhanced Cart Items Section - Full Width */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Cart Header */}
                <div className="bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-700 dark:to-gray-600 p-6 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                        <i className="fas fa-shopping-basket mr-3 text-green-600"></i>
                        Your Shopping Cart
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {cartStats.totalItems} items from {cartStats.farmers}{" "}
                        farmers • {cartStats.categories} categories
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* View Mode Toggle */}
                      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode("detailed")}
                          className={`px-3 py-2 rounded-md transition-all duration-200 ${
                            viewMode === "detailed"
                              ? "bg-white dark:bg-gray-600 text-green-600 shadow-sm"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <i className="fas fa-list"></i>
                        </button>
                        <button
                          onClick={() => setViewMode("compact")}
                          className={`px-3 py-2 rounded-md transition-all duration-200 ${
                            viewMode === "compact"
                              ? "bg-white dark:bg-gray-600 text-green-600 shadow-sm"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <i className="fas fa-th-large"></i>
                        </button>
                      </div>

                      {/* Quick Actions */}
                      <Link
                        href="/products"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Add Items
                      </Link>

                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        <i className="fas fa-trash mr-2"></i>
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="p-6">
                  <div
                    className={`${
                      viewMode === "compact"
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                        : "space-y-6"
                    }`}
                  >
                    {enrichedCartItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`group relative overflow-hidden transition-all duration-300 transform ${
                          viewMode === "compact"
                            ? "bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 dark:from-gray-800 dark:via-gray-700/50 dark:to-gray-600/50 rounded-3xl border-2 border-green-200/50 dark:border-green-600/30 hover:border-green-400 dark:hover:border-green-500 hover:-translate-y-3 hover:rotate-1 shadow-2xl hover:shadow-green-500/25 dark:hover:shadow-green-400/30"
                            : "bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:-translate-y-1 shadow-lg hover:shadow-xl"
                        } ${item.isRemoving ? "opacity-50 scale-95" : ""}`}
                        style={{
                          animationDelay: `${index * 100}ms`,
                          boxShadow:
                            viewMode === "compact"
                              ? "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 0 0 1px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                              : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        }}
                      >
                        {/* Enhanced gradient overlay for compact cards */}
                        {viewMode === "compact" && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-green-100/40 via-transparent to-blue-100/40 dark:from-green-900/20 dark:to-blue-900/20 rounded-3xl"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20 dark:to-gray-700/20 rounded-3xl"></div>
                          </>
                        )}

                        <div
                          className={`relative z-10 ${viewMode === "compact" ? "p-8" : "p-6"}`}
                        >
                          {/* Product Image & Quantity Badge */}
                          <div className="relative mb-4">
                            <div
                              className={`relative overflow-hidden ${
                                viewMode === "compact"
                                  ? "rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border-4 border-white/50 dark:border-gray-600/50"
                                  : "rounded-xl shadow-sm"
                              }`}
                            >
                              <img
                                src={item.enrichedImage}
                                alt={item.name}
                                className={`${
                                  viewMode === "detailed"
                                    ? "w-32 h-32 mx-auto"
                                    : "w-full h-52"
                                } object-cover transition-transform duration-500 ${
                                  viewMode === "compact"
                                    ? "group-hover:scale-110 filter group-hover:brightness-110"
                                    : "group-hover:scale-105"
                                }`}
                              />
                              {/* Enhanced image overlay for compact view */}
                              {viewMode === "compact" && (
                                <>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10"></div>
                                </>
                              )}
                            </div>

                            {/* Enhanced Quantity Badge */}
                            <div
                              className={`absolute ${viewMode === "compact" ? "-top-4 -right-4 w-12 h-12 text-base" : "-top-3 -right-3 w-10 h-10 text-sm"} bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold shadow-xl border-3 border-white dark:border-gray-800 transform transition-all duration-300 ${
                                viewMode === "compact"
                                  ? "group-hover:scale-125 group-hover:rotate-12 shadow-green-500/50"
                                  : "group-hover:scale-110"
                              }`}
                            >
                              {item.quantity}
                            </div>

                            {/* Enhanced Category Badge */}
                            <div
                              className={`absolute top-3 left-3 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold shadow-lg border ${
                                viewMode === "compact"
                                  ? "bg-white/80 dark:bg-gray-800/80 border-green-200 dark:border-green-600 shadow-xl"
                                  : "bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-600 shadow-md"
                              }`}
                            >
                              <span className="text-green-600 dark:text-green-400">
                                {item.category}
                              </span>
                            </div>
                          </div>

                          {/* Enhanced Product Info */}
                          <div className="space-y-4">
                            <div>
                              <h3
                                className={`font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 transition-colors duration-300 ${
                                  viewMode === "compact"
                                    ? "text-2xl group-hover:text-green-600 dark:group-hover:text-green-400"
                                    : "text-xl group-hover:text-green-600 dark:group-hover:text-green-400"
                                }`}
                              >
                                {item.name}
                              </h3>
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                                <i className="fas fa-user-tie mr-2 text-green-500"></i>
                                <span className="font-medium">
                                  {item.enrichedFarmerName}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {formatPrice(item.price)}/{item.unit || "kg"}
                                </span>
                                <span
                                  className={`font-bold text-gray-900 dark:text-white rounded-lg ${
                                    viewMode === "compact"
                                      ? "text-xl bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 px-3 py-2 shadow-md"
                                      : "text-lg bg-green-50 dark:bg-green-900/20 px-2 py-1"
                                  }`}
                                >
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>

                            {/* Enhanced Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div
                                className={`flex items-center overflow-hidden transition-all duration-300 ${
                                  viewMode === "compact"
                                    ? "bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-lg hover:shadow-xl hover:border-green-300/70"
                                    : "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md"
                                }`}
                              >
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity - 1,
                                    )
                                  }
                                  disabled={item.isUpdating}
                                  className={`px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900 text-red-600 transition-all duration-200 disabled:opacity-50 ${
                                    viewMode === "compact"
                                      ? "hover:scale-125"
                                      : "hover:scale-110"
                                  }`}
                                >
                                  <i className="fas fa-minus"></i>
                                </button>

                                <div
                                  className={`px-4 py-2 border-x min-w-[80px] text-center ${
                                    viewMode === "compact"
                                      ? "border-gray-200/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-800/80"
                                      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                  }`}
                                >
                                  {item.isUpdating ? (
                                    <i className="fas fa-spinner fa-spin text-green-600"></i>
                                  ) : (
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {item.quantity}
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity + 1,
                                    )
                                  }
                                  disabled={item.isUpdating}
                                  className={`px-4 py-2 hover:bg-green-50 dark:hover:bg-green-900 text-green-600 transition-all duration-200 disabled:opacity-50 ${
                                    viewMode === "compact"
                                      ? "hover:scale-125"
                                      : "hover:scale-110"
                                  }`}
                                >
                                  <i className="fas fa-plus"></i>
                                </button>
                              </div>

                              {/* Enhanced Remove Button */}
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={item.isRemoving}
                                className={`p-3 text-red-500 rounded-xl transition-all duration-200 disabled:opacity-50 transform ${
                                  viewMode === "compact"
                                    ? "hover:bg-red-50/80 dark:hover:bg-red-900/80 shadow-lg hover:shadow-xl hover:scale-125 backdrop-blur-sm"
                                    : "hover:bg-red-50 dark:hover:bg-red-900 shadow-sm hover:shadow-md hover:scale-110"
                                }`}
                              >
                                {item.isRemoving ? (
                                  <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                  <i className="fas fa-trash"></i>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced shine effect for compact cards */}
                        {viewMode === "compact" && (
                          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent transform rotate-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cart Summary & Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cart Analytics */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-chart-pie mr-3 text-purple-600"></i>
                    Cart Analytics
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {cartStats.totalItems}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        Total Items
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {cartStats.farmers}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Farmers
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {cartStats.categories}
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        Categories
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200 dark:border-orange-700">
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-1">
                        {formatPrice(cartStats.averagePrice)}
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-300">
                        Avg/Item
                      </div>
                    </div>
                  </div>

                  {/* Savings & Benefits */}
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                    <div className="flex items-center text-yellow-600 dark:text-yellow-400 mb-2">
                      <i className="fas fa-piggy-bank mr-2"></i>
                      <span className="font-medium">Your Savings</span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Free delivery saves you ৳50!
                      {cartStats.totalAmount >= 500 && (
                        <span className="font-medium">
                          {" "}
                          Plus, you&apos;ve unlocked free premium packaging!
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Checkout Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-calculator mr-3 text-green-600"></i>
                    Order Total
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Subtotal ({cartStats.totalItems} items):</span>
                      <span className="font-medium">
                        {formatPrice(cartStats.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Delivery Fee:</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Service Fee:</span>
                      <span className="font-medium">{formatPrice(25)}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white">
                        <span>Total:</span>
                        <span className="text-green-600">
                          {formatPrice(cartStats.totalAmount + 25)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center text-blue-600 dark:text-blue-400 mb-2">
                      <i className="fas fa-truck mr-2"></i>
                      <span className="font-medium">Delivery Information</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Expected delivery:{" "}
                      <strong>{getDeliveryEstimate()}</strong>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Free delivery • Fresh guarantee • Contact-free option
                      available
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link
                      href="/payment"
                      className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      <i className="fas fa-credit-card mr-3"></i>
                      Proceed to Secure Checkout
                      <i className="fas fa-arrow-right ml-3"></i>
                    </Link>

                    <Link
                      href="/products"
                      className="w-full flex items-center justify-center px-6 py-3 border-2 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl font-medium transition-all duration-200"
                    >
                      <i className="fas fa-leaf mr-2"></i>
                      Continue Shopping for Fresh Products
                    </Link>
                  </div>
                </div>
              </div>

              {/* Shopping Recommendations */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-lightbulb mr-3 text-yellow-500"></i>
                  Complete Your Shopping Experience
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-leaf text-green-600 text-2xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      100% Organic
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All products are certified organic and pesticide-free
                    </p>
                  </div>

                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-handshake text-blue-600 text-2xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Direct from Farmers
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Supporting local communities and fair trade
                    </p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-clock text-purple-600 text-2xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Fresh Daily
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Harvested fresh and delivered within 24 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6">
              <h3 className="text-xl font-bold mb-2">Clear Cart</h3>
              <p className="text-red-100">
                Are you sure you want to remove all items?
              </p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone. All {cartStats.totalItems} items
                will be removed from your cart.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCart}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
