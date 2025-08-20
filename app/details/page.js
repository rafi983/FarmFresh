"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useToast } from "@/contexts/ToastContext";
import Footer from "@/components/Footer";
import FarmerProfileView from "@/components/farmers/FarmerProfileView";
import useProductData from "@/hooks/useProductData";
import useOwnership from "@/hooks/useOwnership";
import { useReviewsQuery } from "@/hooks/useReviewsQuery";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useProductsCache } from "@/hooks/useProductsQuery";
import NotFound from "@/components/NotFound";
import FarmerDetailsLoading from "@/components/farmers/FarmerDetailsLoading";
import CustomerDetailsLoading from "@/components/details/CustomerDetailsLoading";
import {
  TAB_OPTIONS,
  DEFAULT_REVIEW_FORM,
  formatPrice,
} from "@/components/details/constants";
import FarmerDashboardView from "@/components/details/FarmerDashboardView";
import CustomerProductView from "@/components/details/CustomerProductView";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

// Component that uses useSearchParams - must be wrapped in Suspense
function ProductDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");
  const viewMode = searchParams.get("view");
  const { data: session } = useSession();

  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isProductFavorited } =
    useFavorites();
  const { addToast } = useToast();

  // Custom hooks
  const {
    product,
    farmer,
    farmerProducts,
    responseType,
    relatedProducts,
    loading,
    fetchProductDetails,
  } = useProductData(productId);

  const currentUserId = session?.user?.id || session?.user?.userId || null;

  const {
    reviews,
    hasMoreReviews,
    isSubmitting,
    isUpdating,
    submitReview, // keep if used elsewhere
    updateReview,
    deleteReview,
    loadMoreReviews,
    submitReviewAsync,
    updateReviewAsync,
  } = useReviewsQuery(productId, currentUserId);
  const isOwner = useOwnership(product, session, viewMode);

  // Add dashboard data hook for optimistic caching
  const { updateProductInCache } = useDashboardData();
  const { updateProductInCache: updateProductsCache } = useProductsCache();

  // Core UI states
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // Loading states
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isManagingProduct, setIsManagingProduct] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  // Form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState(DEFAULT_REVIEW_FORM);
  const [editingReview, setEditingReview] = useState(null);
  const [stockUpdate, setStockUpdate] = useState("");
  const [priceUpdate, setPriceUpdate] = useState("");

  // Data states
  const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);
  const [hasReviewedProduct, setHasReviewedProduct] = useState(false);
  const [userExistingReview, setUserExistingReview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  // Memoized favorite status
  const isFavorite = useMemo(() => {
    return productId ? isProductFavorited(productId) : false;
  }, [productId, isProductFavorited]);

  // Memoized image data
  const imageData = useMemo(() => {
    if (!product) return { allImages: [], hasMultipleImages: false };

    const allImages = [];
    if (product.image) allImages.push(product.image);
    if (product.images && product.images.length > 0) {
      allImages.push(...product.images);
    }

    return {
      allImages: [...new Set(allImages)], // Remove duplicates
      hasMultipleImages: allImages.length > 1,
    };
  }, [product]);

  // Optimized API calls with caching
  const checkUserPurchase = useCallback(async () => {
    const userId = currentUserId;
    if (!userId || !productId) {
      return;
    }
    setCheckingPurchase(true);
    try {
      const apiUrl = `/api/products/${productId}/can-review?userId=${userId}`;
      const response = await fetch(apiUrl, {
        headers: { "Cache-Control": "no-cache" },
      });
      if (response.ok) {
        const data = await response.json();
        setHasPurchasedProduct(!!data.hasPurchased);
        setHasReviewedProduct(!!data.hasReviewed || !!data.existingReview);
        setUserExistingReview(data.existingReview || null);
      } else {
        const txt = await response.text();
        setHasPurchasedProduct(false);
      }
    } catch (error) {
      setHasPurchasedProduct(false);
    } finally {
      setCheckingPurchase(false);
    }
  }, [currentUserId, productId]);

  const fetchRecentOrders = useCallback(async () => {
    if (!productId) return;

    try {
      setLoadingOrders(true);
      const response = await fetch(
        `/api/orders?productId=${productId}&limit=5`,
        {
          headers: {
            "Cache-Control": "public, max-age=300",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setRecentOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching recent orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  }, [productId]);

  // Optimized event handlers
  const handleAddToCart = useCallback(async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (!product) return;

    // Check if user is a farmer and show appropriate message
    if (session?.user?.userType === "farmer") {
      addToast({
        message:
          "Farmers cannot purchase products. You can only sell your own products on this platform. Use the 'Manage' section to add your products.",
        type: "error",
      });
      return;
    }

    setIsAddingToCart(true);
    try {
      const item = {
        productId: productId,
        id: productId,
        name: product.name,
        price: product.price,
        quantity: quantity,
        stock: product.stock,
        image: imageData.allImages[0] || "/placeholder-image.jpg",
        unit: product.unit || "kg",
        farmerId: product.farmerId,
        farmerName:
          product.farmer?.name || product.farmer?.farmName || "Unknown Farmer",
      };

      await addToCart(item, quantity);
      addToast({ message: "Added to cart", type: "success" });
    } catch (error) {
      const errorMessage =
        error.message?.includes("Only") &&
        error.message?.includes("available in stock")
          ? error.message
          : error.message || "Failed to add product to cart";
      addToast({ message: errorMessage, type: "error" });
    } finally {
      setIsAddingToCart(false);
    }
  }, [
    session?.user,
    product,
    productId,
    quantity,
    imageData.allImages,
    addToCart,
    router,
  ]);

  const handleBuyNow = useCallback(async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (!product) return;

    // Check if user is a farmer and show appropriate message
    if (session?.user?.userType === "farmer") {
      addToast({
        message:
          "Farmers cannot purchase products. You can only sell your own products on this platform. Use the 'Manage' section to add your products.",
        type: "error",
      });
      return;
    }

    setIsAddingToCart(true);
    try {
      const productForCart = {
        id: productId,
        name: product.name,
        price: product.price,
        image: imageData.allImages[0] || "/placeholder-image.jpg",
        unit: product.unit || "kg",
        farmerId: product.farmerId,
        farmer: {
          id: product.farmerId,
          _id: product.farmerId,
          email: product.farmer?.email,
          name:
            product.farmer?.name ||
            product.farmer?.farmName ||
            "Unknown Farmer",
        },
        farmerName:
          product.farmer?.name || product.farmer?.farmName || "Unknown Farmer",
        stock: product.stock || 0,
      };

      await addToCart(productForCart, quantity);
      addToast({
        message: "Item added. Redirecting to payment...",
        type: "success",
      });
      router.push("/payment");
    } catch (error) {
      addToast({ message: error.message || "Buy now failed", type: "error" });
    } finally {
      setIsAddingToCart(false);
    }
  }, [
    session?.user,
    product,
    productId,
    quantity,
    imageData.allImages,
    addToCart,
    router,
  ]);

  const handleFavoriteToggle = useCallback(async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (!productId) return;

    try {
      const success = isFavorite
        ? await removeFromFavorites(productId)
        : await addToFavorites(productId);

      if (success) {
        addToast({
          message: isFavorite ? "Removed from favorites" : "Added to favorites",
          type: "success",
        });
      } else {
        addToast({ message: "Favorite update failed", type: "error" });
      }
    } catch (error) {
      addToast({ message: "Favorite update failed", type: "error" });
    }
  }, [
    session?.user,
    productId,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    router,
  ]);

  // Enhanced review submission handler using React Query mutations
  const handleEnhancedReviewSubmit = useCallback(
    async (reviewData) => {
      try {
        if (editingReview) {
          const resp = await updateReviewAsync({
            reviewId: editingReview._id,
            reviewData: {
              rating: reviewData.rating,
              comment: reviewData.comment,
              title: reviewData.title,
              pros: reviewData.pros,
              cons: reviewData.cons,
              wouldRecommend: reviewData.wouldRecommend,
              isAnonymous: reviewData.isAnonymous,
              tags: reviewData.tags,
            },
            userId: reviewData.userId,
          });
          setUserExistingReview({
            _id: editingReview._id,
            rating: reviewData.rating,
            comment: reviewData.comment,
            title: reviewData.title,
            pros: reviewData.pros,
            cons: reviewData.cons,
            wouldRecommend: reviewData.wouldRecommend,
            isAnonymous: reviewData.isAnonymous,
            tags: reviewData.tags,
          });
          addToast({ message: "Review updated", type: "success" });
        } else {
          const resp = await submitReviewAsync({
            productId,
            reviewData,
          });
          setHasReviewedProduct(true);
          setUserExistingReview({
            _id: resp?.reviewId,
            rating: reviewData.rating,
            comment: reviewData.comment,
            title: reviewData.title,
            pros: reviewData.pros,
            cons: reviewData.cons,
            wouldRecommend: reviewData.wouldRecommend,
            isAnonymous: reviewData.isAnonymous,
            tags: reviewData.tags,
          });
          addToast({ message: "Review submitted", type: "success" });
        }
        checkUserPurchase();
        setShowReviewForm(false);
        setEditingReview(null);
        setReviewForm(DEFAULT_REVIEW_FORM);
      } catch (error) {
        addToast({
          message: `Failed review ${editingReview ? "update" : "submit"}`,
          type: "error",
        });
      }
    },
    [
      productId,
      editingReview,
      submitReviewAsync,
      updateReviewAsync,
      checkUserPurchase,
      userExistingReview,
    ],
  );

  const handleDeleteReview = useCallback(
    async (reviewId) => {
      if (!reviewId) return;
      if (!confirm("Are you sure you want to delete this review?")) return;
      setIsDeletingReview(true);
      try {
        await deleteReview(reviewId);
        addToast({ message: "Review deleted", type: "success" });
        if (
          userExistingReview &&
          (userExistingReview._id === reviewId || !userExistingReview._id)
        ) {
          setHasReviewedProduct(false);
          setUserExistingReview(null);
        }
        checkUserPurchase();
      } catch (error) {
        addToast({ message: "Failed to delete review", type: "error" });
      } finally {
        setIsDeletingReview(false);
      }
    },
    [deleteReview, addToast, userExistingReview, checkUserPurchase],
  );

  // Farmer-specific handlers
  const handleUpdateProduct = useCallback(async () => {
    if (!isOwner || (!stockUpdate && !priceUpdate)) {
      if (!stockUpdate && !priceUpdate) {
        addToast({
          message: "Please enter a value to update",
          type: "warning",
        });
      }
      return;
    }

    setIsManagingProduct(true);
    try {
      const updateData = {};
      const originalData = { stock: product.stock, price: product.price };

      if (stockUpdate && stockUpdate.trim() !== "") {
        const stockValue = parseInt(stockUpdate);
        if (isNaN(stockValue) || stockValue < 0) {
          addToast({ message: "Invalid stock number", type: "error" });
          setIsManagingProduct(false);
          return;
        }
        updateData.stock = stockValue;
      }

      if (priceUpdate && priceUpdate.trim() !== "") {
        const priceValue = parseFloat(priceUpdate);
        if (isNaN(priceValue) || priceValue <= 0) {
          addToast({ message: "Invalid price", type: "error" });
          setIsManagingProduct(false);
          return;
        }
        updateData.price = priceValue;
      }

      // Optimistically update the product in dashboard cache
      if (updateProductInCache) {
        updateProductInCache(productId, {
          ...updateData,
          updatedAt: new Date().toISOString(),
        });
      }
      // Optimistically update the product in products cache
      if (updateProductsCache) {
        updateProductsCache(productId, {
          ...updateData,
          updatedAt: new Date().toISOString(),
        });
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedProduct = await response.json();

        // Update the dashboard cache with the server response
        if (updateProductInCache && updatedProduct.product) {
          updateProductInCache(productId, updatedProduct.product);
        }
        // Update the products cache with the server response
        if (updateProductsCache && updatedProduct.product) {
          updateProductsCache(productId, updatedProduct.product);
        }

        addToast({ message: "Product updated", type: "success" });
        // Refresh the product details to sync with server
        await fetchProductDetails();
        setStockUpdate("");
        setPriceUpdate("");
      } else {
        const error = await response.json();

        // Revert optimistic update on error
        if (updateProductInCache) {
          updateProductInCache(productId, originalData);
        }
        if (updateProductsCache) {
          updateProductsCache(productId, originalData);
        }

        addToast({ message: error.error || "Update failed", type: "error" });
      }
    } catch (error) {
      console.error("Error updating product:", error);

      // Revert optimistic update on error
      if (updateProductInCache) {
        const originalData = { stock: product.stock, price: product.price };
        updateProductInCache(productId, originalData);
      }
      if (updateProductsCache) {
        const originalData = { stock: product.stock, price: product.price };
        updateProductsCache(productId, originalData);
      }

      addToast({
        message: "Failed to update product. Please try again.",
        type: "error",
      });
    } finally {
      setIsManagingProduct(false);
    }
  }, [
    isOwner,
    stockUpdate,
    priceUpdate,
    productId,
    product,
    updateProductInCache,
    updateProductsCache,
    fetchProductDetails,
  ]);

  // Handle adding images to product
  const handleAddImages = useCallback(() => {
    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = async (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      // Validate file types and sizes
      const validFiles = Array.from(files).filter((file) => {
        const isValidType = file.type.startsWith("image/");
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

        if (!isValidType) {
          addToast({
            message: `${file.name} is not a valid image file.`,
            type: "error",
          });
          return false;
        }
        if (!isValidSize) {
          addToast({
            message: `${file.name} is too large. Maximum size is 5MB.`,
            type: "error",
          });
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      try {
        // Create FormData for file upload
        const formData = new FormData();
        validFiles.forEach((file) => {
          formData.append("images", file);
        });
        formData.append("productId", productId);

        // Show loading state
        addToast({ message: "Uploading images...", type: "info" });

        // Upload images to your API endpoint
        const response = await fetch(`/api/products/${productId}/images`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          addToast({
            message: `${validFiles.length} images uploaded`,
            type: "success",
          });

          // Refresh product details to show new images
          fetchProductDetails();
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload images");
        }
      } catch (error) {
        console.error("Error uploading images:", error);
        addToast({
          message: error.message || "Image upload failed",
          type: "error",
        });
      }
    };

    // Trigger file selection
    input.click();
  }, [productId, fetchProductDetails]);

  // Handle toggling product status (activate/deactivate)
  const handleToggleStatus = useCallback(async () => {
    if (!isOwner) return;

    const currentStatus = product?.status || "active";
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const actionText = newStatus === "active" ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${actionText} this product?`)) {
      return;
    }

    setIsManagingProduct(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        addToast({ message: `Product ${actionText}d`, type: "success" });
        fetchProductDetails();
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${actionText} product`);
      }
    } catch (error) {
      console.error(`Error ${actionText}ing product:`, error);
      addToast({ message: `Failed to ${actionText} product`, type: "error" });
    } finally {
      setIsManagingProduct(false);
    }
  }, [isOwner, product?.status, productId, fetchProductDetails]);

  // Handle deleting product
  const handleDeleteProduct = useCallback(async () => {
    if (!isOwner) return;

    const confirmMessage =
      "⚠️ Are you sure you want to delete this product?\n\n" +
      "This action cannot be undone and will remove:\n" +
      "• The product listing\n" +
      "• All associated data\n" +
      "• Product images\n" +
      "• Product from any pending orders";

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsManagingProduct(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        addToast({ message: "Product deleted", type: "success" });
        // Redirect to manage page
        router.push("/manage");
      } else {
        const error = await response.json();

        if (response.status === 409) {
          addToast({
            message: "Cannot delete: pending orders",
            type: "warning",
          });
        } else {
          throw new Error(error.error || "Failed to delete product");
        }
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      addToast({ message: error.message || "Delete failed", type: "error" });
    } finally {
      setIsManagingProduct(false);
    }
  }, [isOwner, productId, fetchProductDetails, router]);

  // Effects with proper dependencies
  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId, fetchProductDetails]);

  useEffect(() => {
    let interval;
    if (productId && isOwner && viewMode !== "customer") {
      interval = setInterval(fetchProductDetails, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [productId, isOwner, viewMode, fetchProductDetails]);

  useEffect(() => {
    if (productId && isOwner && viewMode !== "customer") {
      fetchRecentOrders();
    }
  }, [productId, isOwner, viewMode, fetchRecentOrders]);

  useEffect(() => {
    if (currentUserId && productId) {
      checkUserPurchase();
    }
  }, [
    session?.user?.id,
    session?.user?.userId,
    currentUserId,
    productId,
    checkUserPurchase,
  ]);

  useEffect(() => {
    if (currentUserId && productId) {
      checkUserPurchase();
    }
  }, [currentUserId, productId, checkUserPurchase]);

  useEffect(() => {
    if (!currentUserId || !reviews?.length) return;
    const own = reviews.find((r) => r.userId === currentUserId);
    if (own && (!hasReviewedProduct || !userExistingReview)) {
      if (!hasReviewedProduct) setHasReviewedProduct(true);
      if (!userExistingReview) setUserExistingReview(own);
    }
  }, [currentUserId, reviews, hasReviewedProduct, userExistingReview]);

  // Render components based on state
  if (loading) {
    // Use the same ownership logic as the actual content to determine loading skeleton
    // The content logic is: isOwner && viewMode !== "customer"
    // We need to replicate this logic during loading

    const checkPotentialOwnership = () => {
      // If explicit customer view, always show customer skeleton
      if (viewMode === "customer") {
        return false;
      }

      // If no session or not a farmer, show customer skeleton
      if (!session?.user || session?.user?.userType !== "farmer") {
        return false;
      }

      // For farmers, we need to make an educated guess about ownership
      // Since we don't have product data yet, we can:
      // 1. Check if they came from /manage page (referrer)
      // 2. Check if the productId might belong to them (requires API call)
      // 3. Use a heuristic based on navigation patterns

      // For now, let's show farmer skeleton for farmers by default
      // and let it switch to customer view if they're not the owner
      // This provides better UX for farmers viewing their own products
      if (productId && session?.user?.userType === "farmer") {
        return true; // Show farmer skeleton, will switch if not owner
      }

      return false;
    };

    const showFarmerSkeleton = checkPotentialOwnership();

    return showFarmerSkeleton ? (
      <FarmerDetailsLoading />
    ) : (
      <CustomerDetailsLoading />
    );
  }

  if (responseType === "farmer" && farmer) {
    return (
      <FarmerProfileView farmer={farmer} farmerProducts={farmerProducts} />
    );
  }

  if (!product && !farmer) {
    return <NotFound responseType={responseType} />;
  }

  // Main product details render
  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isOwner && viewMode !== "customer" ? (
            <FarmerDashboardView
              product={product}
              productId={productId}
              imageData={imageData}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              recentOrders={recentOrders}
              loadingOrders={loadingOrders}
              formatPrice={formatPrice}
              stockUpdate={stockUpdate}
              priceUpdate={priceUpdate}
              setStockUpdate={setStockUpdate}
              setPriceUpdate={setPriceUpdate}
              handleUpdateProduct={handleUpdateProduct}
              handleAddImages={handleAddImages}
              handleToggleStatus={handleToggleStatus}
              handleDeleteProduct={handleDeleteProduct}
              isManagingProduct={isManagingProduct}
            />
          ) : (
            <CustomerProductView
              product={product}
              productId={productId}
              imageData={imageData}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              quantity={quantity}
              setQuantity={setQuantity}
              handleBuyNow={handleBuyNow}
              handleAddToCart={handleAddToCart}
              handleFavoriteToggle={handleFavoriteToggle}
              isAddingToCart={isAddingToCart}
              isFavorite={isFavorite}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              session={session}
              reviews={reviews}
              hasPurchasedProduct={hasPurchasedProduct}
              hasReviewedProduct={hasReviewedProduct}
              userExistingReview={userExistingReview}
              checkingPurchase={checkingPurchase}
              showReviewForm={showReviewForm}
              setShowReviewForm={setShowReviewForm}
              editingReview={editingReview}
              setEditingReview={setEditingReview}
              reviewForm={reviewForm}
              setReviewForm={setReviewForm}
              handleEnhancedReviewSubmit={handleEnhancedReviewSubmit}
              isSubmitting={isSubmitting}
              isUpdating={isUpdating}
              hasMoreReviews={hasMoreReviews}
              loadMoreReviews={loadMoreReviews}
              handleDeleteReview={handleDeleteReview}
              relatedProducts={relatedProducts}
              formatPrice={formatPrice}
              TAB_OPTIONS={TAB_OPTIONS}
              DEFAULT_REVIEW_FORM={DEFAULT_REVIEW_FORM}
              isDeletingReview={isDeletingReview}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function ProductDetails() {
  return (
    <Suspense fallback={<div>Loading product details...</div>}>
      <ProductDetailsContent />
    </Suspense>
  );
}
