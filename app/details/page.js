"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import StarRating from "@/components/StarRating";
import Footer from "@/components/Footer";
import RecentOrdersSection from "@/components/RecentOrdersSection";
import FarmerProfileView from "@/components/FarmerProfileView";
import EnhancedReviewModal from "@/components/EnhancedReviewModal";
import useProductData from "@/hooks/useProductData";
import useOwnership from "@/hooks/useOwnership";
import useReviews from "@/hooks/useReviews";
import { useProductReviewUpdates } from "@/hooks/useReviewUpdates";

import Loading from "@/components/Loading";
import NotFound from "@/components/NotFound";

// Move constants outside component to prevent recreations
const TAB_OPTIONS = [
  "description",
  "nutrition",
  "storage",
  "reviews",
  "farmer",
];
const DEFAULT_REVIEW_FORM = { rating: 5, comment: "" };

export default function ProductDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");
  const viewMode = searchParams.get("view");
  const { data: session, status: sessionStatus } = useSession();

  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isProductFavorited } =
    useFavorites();

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

  const { reviews, hasMoreReviews, fetchReviews, reviewsPage } = useReviews(
    productId,
    responseType,
    session?.user?.id,
  );
  const isOwner = useOwnership(product, session, viewMode);

  // Core UI states
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // Loading states
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

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

  // Memoized rating distribution
  const ratingDistribution = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      const rating = Math.floor(review.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    return distribution;
  }, [reviews]);

  // Optimized API calls with caching
  const checkUserPurchase = useCallback(async () => {
    // Get userId from either property
    const userId = session?.user?.id || session?.user?.userId;

    if (!userId || !productId) {
      return;
    }

    setCheckingPurchase(true);
    try {
      // Use the new can-review endpoint to check if user can review this product
      const apiUrl = `/api/products/${productId}/can-review?userId=${userId}`;

      const response = await fetch(apiUrl, {
        headers: {
          "Cache-Control": "no-cache", // Disable cache for debugging
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Set states based on API response
        setHasPurchasedProduct(data.hasPurchased || false); // Whether user has purchased (regardless of review status)
        setHasReviewedProduct(data.hasReviewed || false); // Whether user has already reviewed
        setUserExistingReview(data.existingReview || null); // User's existing review if any
      } else {
        const errorData = await response.text();
        setHasPurchasedProduct(false);
      }
    } catch (error) {
      console.error("❌ Can-review API error:", error);
      setHasPurchasedProduct(false);
    } finally {
      setCheckingPurchase(false);
    }
  }, [
    session?.user?.id,
    session?.user?.userId,
    productId,
    hasPurchasedProduct,
  ]);

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
      alert(
        "Farmers cannot purchase products. You can only sell your own products on this platform. Use the 'Manage' section to add your products.",
      );
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
      // Consider using a toast notification instead of alert
      alert("Product added to cart successfully!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage =
        error.message.includes("Only") &&
        error.message.includes("available in stock")
          ? error.message
          : error.message || "Failed to add product to cart. Please try again.";
      alert(errorMessage);
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
      alert(
        "Farmers cannot purchase products. You can only sell your own products on this platform. Use the 'Manage' section to add your products.",
      );
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
      router.push("/payment");
    } catch (error) {
      console.error("Error processing buy now:", error);
      alert(error.message || "Failed to process order. Please try again.");
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
        const message = isFavorite
          ? "Product removed from favorites!"
          : "Product added to favorites!";
        alert(message);
      } else {
        alert("Failed to update favorites. Please try again.");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorites. Please try again.");
    }
  }, [
    session?.user,
    productId,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    router,
  ]);

  const handleSubmitReview = useCallback(
    async (e) => {
      e.preventDefault();
      if (!session) {
        alert("Please login to submit a review");
        return;
      }

      setIsSubmittingReview(true);
      try {
        const reviewData = {
          ...reviewForm,
          userId:
            session.user.id ||
            session.user._id ||
            session.user.userId ||
            session.user.email,
        };

        const response = await fetch(`/api/products/${productId}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reviewData),
        });

        if (response.ok) {
          setShowReviewForm(false);
          setReviewForm(DEFAULT_REVIEW_FORM);
          fetchReviews();
          fetchProductDetails();
          alert("Review submitted successfully!");
        } else {
          const error = await response.json();
          alert(error.error || "Failed to submit review");
        }
      } catch (error) {
        console.error("Error submitting review:", error);
        alert("Failed to submit review");
      } finally {
        setIsSubmittingReview(false);
      }
    },
    [session, reviewForm, productId, fetchReviews, fetchProductDetails],
  );

  // Enhanced review submission handler for the new modal
  const handleEnhancedReviewSubmit = useCallback(
    async (reviewData) => {
      setIsSubmittingReview(true);
      try {
        let response;

        if (editingReview) {
          // Update existing review
          response = await fetch(`/api/reviews/${editingReview._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rating: reviewData.rating,
              comment: reviewData.comment,
              title: reviewData.title,
              pros: reviewData.pros,
              cons: reviewData.cons,
              wouldRecommend: reviewData.wouldRecommend,
              isAnonymous: reviewData.isAnonymous,
              tags: reviewData.tags,
              userId: reviewData.userId,
            }),
          });
        } else {
          // Create new review
          response = await fetch(`/api/products/${productId}/reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reviewData),
          });
        }

        if (response.ok) {
          setShowReviewForm(false);
          setEditingReview(null);
          setReviewForm(DEFAULT_REVIEW_FORM);
          fetchReviews();
          fetchProductDetails();
          alert(
            editingReview
              ? "Review updated successfully!"
              : "Review submitted successfully!",
          );
        } else {
          const error = await response.json();
          alert(
            error.error ||
              `Failed to ${editingReview ? "update" : "submit"} review`,
          );
        }
      } catch (error) {
        console.error(
          `Error ${editingReview ? "updating" : "submitting"} review:`,
          error,
        );
        alert(`Failed to ${editingReview ? "update" : "submit"} review`);
      } finally {
        setIsSubmittingReview(false);
      }
    },
    [productId, fetchReviews, fetchProductDetails, editingReview],
  );

  const handleUpdateReview = useCallback(async () => {
    if (!editingReview) return;

    setIsUpdatingReview(true);
    try {
      const response = await fetch(`/api/reviews/${editingReview._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          userId:
            session.user.userId ||
            session.user.id ||
            session.user._id ||
            session.user.email,
        }),
      });

      if (response.ok) {
        setEditingReview(null);
        setReviewForm(DEFAULT_REVIEW_FORM);
        setShowReviewForm(false);
        fetchReviews();
        fetchProductDetails();
        alert("Review updated successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update review");
      }
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review");
    } finally {
      setIsUpdatingReview(false);
    }
  }, [editingReview, reviewForm, session, fetchReviews, fetchProductDetails]);

  const handleDeleteReview = useCallback(
    async (reviewId) => {
      if (!confirm("Are you sure you want to delete this review?")) {
        return;
      }

      setIsDeletingReview(true);
      try {
        const userId =
          session.user.userId ||
          session.user.id ||
          session.user._id ||
          session.user.email;
        const response = await fetch(
          `/api/reviews/${reviewId}?userId=${encodeURIComponent(userId)}`,
          { method: "DELETE" },
        );

        if (response.ok) {
          fetchReviews();
          fetchProductDetails();
          alert("Review deleted successfully!");
        } else {
          const error = await response.json();
          alert(error.error || "Failed to delete review");
        }
      } catch (error) {
        console.error("Error deleting review:", error);
        alert("Failed to delete review");
      } finally {
        setIsDeletingReview(false);
      }
    },
    [session, fetchReviews, fetchProductDetails],
  );

  const loadMoreReviews = useCallback(() => {
    fetchReviews(reviewsPage + 1, true);
  }, [fetchReviews, reviewsPage]);

  // Farmer-specific handlers
  const handleUpdateProduct = useCallback(async () => {
    if (!isOwner || (!stockUpdate && !priceUpdate)) {
      if (!stockUpdate && !priceUpdate) {
        alert("Please enter a value to update");
      }
      return;
    }

    setIsUpdating(true);
    try {
      const updateData = {};

      if (stockUpdate && stockUpdate.trim() !== "") {
        const stockValue = parseInt(stockUpdate);
        if (isNaN(stockValue) || stockValue < 0) {
          alert("Please enter a valid stock number");
          return;
        }
        updateData.stock = stockValue;
      }

      if (priceUpdate && priceUpdate.trim() !== "") {
        const priceValue = parseFloat(priceUpdate);
        if (isNaN(priceValue) || priceValue <= 0) {
          alert("Please enter a valid price");
          return;
        }
        updateData.price = priceValue;
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        alert("Product updated successfully!");
        fetchProductDetails();
        setStockUpdate("");
        setPriceUpdate("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }, [isOwner, stockUpdate, priceUpdate, productId, fetchProductDetails]);

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
          alert(`${file.name} is not a valid image file.`);
          return false;
        }
        if (!isValidSize) {
          alert(`${file.name} is too large. Maximum size is 5MB.`);
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
        alert("Uploading images...");

        // Upload images to your API endpoint
        const response = await fetch(`/api/products/${productId}/images`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Successfully uploaded ${validFiles.length} image(s)!`);

          // Refresh product details to show new images
          fetchProductDetails();
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload images");
        }
      } catch (error) {
        console.error("Error uploading images:", error);
        alert(`Failed to upload images: ${error.message}`);
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

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert(`Product ${actionText}d successfully!`);
        fetchProductDetails();
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${actionText} product`);
      }
    } catch (error) {
      console.error(`Error ${actionText}ing product:`, error);
      alert(`Failed to ${actionText} product: ${error.message}`);
    } finally {
      setIsUpdating(false);
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

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Product deleted successfully!");
        // Redirect to manage page
        router.push("/manage");
      } else {
        const error = await response.json();

        if (response.status === 409) {
          alert(
            "❌ Cannot Delete Product\n\n" +
              "This product has pending orders and cannot be deleted.\n" +
              "Please wait for all orders to be completed or cancelled before deleting this product.\n\n" +
              "You can temporarily deactivate the product instead.",
          );
        } else {
          throw new Error(error.error || "Failed to delete product");
        }
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(`Failed to delete product: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  }, [isOwner, productId, fetchProductDetails, router]);

  // Listen for review updates and refresh product data
  useProductReviewUpdates(
    productId,
    useCallback(() => {
      console.log("Details page: Review update detected via event system");
      // Refresh both reviews and product details to get updated stats
      fetchReviews();
      fetchProductDetails();
    }, [fetchReviews, fetchProductDetails]),
  );

  // Effects with proper dependencies
  useEffect(() => {
    console.log("🔍 PRODUCT DETAILS useEffect triggered!", {
      productId: productId,
      hasProductId: !!productId,
    });
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
    console.log("🔍 SESSION CHECK useEffect triggered!", {
      hasSession: !!session,
      hasUserId: !!session?.user?.id,
      hasUserIdProp: !!session?.user?.userId, // Check both properties
      sessionUserId: session?.user?.id,
      sessionUserIdProp: session?.user?.userId,
      productId: productId,
      hasProductId: !!productId,
      sessionData: session,
    });

    // Check both session.user.id and session.user.userId
    const userId = session?.user?.id || session?.user?.userId;

    if (userId && productId) {
      console.log("✅ Calling checkUserPurchase with userId:", userId);
      checkUserPurchase();
    } else {
      console.log("❌ NOT calling checkUserPurchase because:", {
        noSession: !userId,
        noProductId: !productId,
        availableUserId: userId,
      });
    }
  }, [session?.user?.id, session?.user?.userId, productId, checkUserPurchase]);

  // Check if user has purchased this product
  useEffect(() => {
    if (session?.user?.id && productId) {
      checkUserPurchase();
    }
  }, [session?.user?.id, productId]);

  // Render components based on state
  if (loading) {
    return <Loading />;
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
          {/* Farmer Dashboard View */}
          {isOwner && viewMode !== "customer" ? (
            <>
              {/* Farmer Breadcrumb */}
              <nav className="mb-8">
                <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Link href="/manage" className="hover:text-primary-600">
                      <i className="fas fa-tachometer-alt mr-1"></i>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <i className="fas fa-chevron-right text-xs"></i>
                  </li>
                  <li>
                    <span className="text-gray-900 dark:text-white">
                      {product.name} - Management
                    </span>
                  </li>
                </ol>
              </nav>

              {/* Customer View Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mr-2"></i>
                    <span className="text-blue-800 dark:text-blue-200">
                      You are viewing this as the product owner.
                    </span>
                  </div>
                  <Link
                    href={`/details?id=${productId}&view=customer`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    <i className="fas fa-eye mr-1"></i>
                    View as Customer
                  </Link>
                </div>
              </div>

              {/* Farmer Product Management Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      Product Management
                    </h1>
                    <p className="text-green-100">
                      Manage your product listing and inventory
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-100 mb-1">
                      Product Status
                    </div>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        product.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <i
                        className={`fas ${product.status === "active" ? "fa-check-circle" : "fa-times-circle"} mr-1`}
                      ></i>
                      {product.status === "active" ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product Images & Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Image Management */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Product Images
                      </h3>
                      <button
                        onClick={handleAddImages}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        <i className="fas fa-plus mr-1"></i>
                        Add Images
                      </button>
                    </div>

                    {/* Current Images Display */}
                    {(() => {
                      const allImages = imageData.allImages;

                      return allImages.length > 0 ? (
                        <div className="space-y-4">
                          <div className="aspect-video max-w-md bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <Image
                              src={allImages[selectedImage]}
                              alt={product.name}
                              width={400}
                              height={225}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {allImages.length > 1 && (
                            <div className="grid grid-cols-5 gap-2 max-w-md">
                              {allImages.map((image, index) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedImage(index)}
                                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                                    selectedImage === index
                                      ? "border-primary-500"
                                      : "border-gray-300 dark:border-gray-600"
                                  }`}
                                >
                                  <Image
                                    src={image}
                                    alt={`${product.name} ${index + 1}`}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <i className="fas fa-image text-4xl text-gray-400 mb-4"></i>
                          <p className="text-gray-600 dark:text-gray-400">
                            No images uploaded
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Product Information */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Product Information
                      </h3>
                      <Link
                        href={`/create?edit=${productId}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit Details
                      </Link>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {product.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {product.category}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Price
                          </span>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            ${product.price?.toFixed(2)} per{" "}
                            {product.unit || "kg"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Stock
                          </span>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {product.stock} {product.unit || "kg"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Description
                        </span>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">
                          {product.description || "No description provided."}
                        </p>
                      </div>

                      {product.features && (
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Features
                          </span>
                          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-1">
                            {product.features.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Quick Updates
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Stock Update */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Update Stock
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={stockUpdate}
                            onChange={(e) => setStockUpdate(e.target.value)}
                            placeholder="New stock amount"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={handleUpdateProduct}
                            disabled={isUpdating || !stockUpdate}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:bg-gray-400"
                          >
                            Update
                          </button>
                        </div>
                      </div>

                      {/* Price Update */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Update Price
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={priceUpdate}
                            onChange={(e) => setPriceUpdate(e.target.value)}
                            placeholder="New price"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={handleUpdateProduct}
                            disabled={isUpdating || !priceUpdate}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:bg-gray-400"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <RecentOrdersSection
                    recentOrders={recentOrders}
                    loadingOrders={loadingOrders}
                    product={product}
                  />
                </div>

                {/* Sidebar - Analytics & Actions */}
                <div className="space-y-6">
                  {/* Performance Stats */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Performance
                      </h3>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Real-time data
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Total Sales */}
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <i className="fas fa-chart-line text-blue-600"></i>
                          <span className="text-2xl font-bold text-blue-600">
                            {product.performanceMetrics?.totalSales || 0}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Sales
                        </div>
                      </div>

                      {/* Total Revenue */}
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          $
                          {(
                            product.performanceMetrics?.totalRevenue || 0
                          ).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Revenue
                        </div>
                      </div>

                      {/* Average Rating */}
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {(product.averageRating || 0).toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Average Rating
                        </div>
                        <div className="flex justify-center mt-1">
                          <StarRating
                            rating={product.averageRating || 0}
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Total Reviews */}
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {product.reviewCount || product.totalReviews || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Reviews
                        </div>
                      </div>

                      {/* Average Order Value */}
                      {product.performanceMetrics?.averageOrderValue > 0 && (
                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            $
                            {product.performanceMetrics.averageOrderValue.toFixed(
                              2,
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Avg. Order Value
                          </div>
                        </div>
                      )}

                      {/* Total Orders */}
                      {product.performanceMetrics?.totalOrders > 0 && (
                        <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-indigo-600">
                            {product.performanceMetrics.totalOrders}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total Orders
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Performance Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        {product.performanceMetrics?.totalSales > 0
                          ? "Your product is performing well!"
                          : "Start promoting your product to get your first sale!"}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Actions
                    </h3>

                    <div className="space-y-3">
                      {session?.user?.userType === "farmer" ? (
                        // Farmer-specific buttons
                        <>
                          <Link
                            href="/create"
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                          >
                            <i className="fas fa-plus mr-2"></i>
                            Add Product
                          </Link>
                          <Link
                            href="/manage"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                          >
                            <i className="fas fa-cog mr-2"></i>
                            Manage Orders
                          </Link>
                          <Link
                            href="/farmer-orders"
                            className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition flex items-center justify-center"
                          >
                            <i className="fas fa-clipboard-list mr-2"></i>
                            View My Orders
                          </Link>
                        </>
                      ) : (
                        // Customer buttons
                        <>
                          <button
                            onClick={handleBuyNow}
                            disabled={
                              product.stock <= 0 ||
                              session?.user?.userType === "farmer"
                            }
                            className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400"
                            title={
                              session?.user?.userType === "farmer"
                                ? "Farmers cannot purchase products"
                                : ""
                            }
                          >
                            <i className="fas fa-bolt mr-2"></i>
                            Buy Now
                          </button>
                          <button
                            onClick={handleAddToCart}
                            disabled={
                              isAddingToCart ||
                              product.stock <= 0 ||
                              session?.user?.userType === "farmer"
                            }
                            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition disabled:bg-gray-400"
                            title={
                              session?.user?.userType === "farmer"
                                ? "Farmers cannot purchase products"
                                : ""
                            }
                          >
                            <i className="fas fa-shopping-cart mr-2"></i>
                            {isAddingToCart ? "Adding..." : "Add to Cart"}
                          </button>
                          <button
                            onClick={handleFavoriteToggle}
                            className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition"
                          >
                            <i
                              className={`${isFavorite ? "fas" : "far"} fa-heart mr-2 ${isFavorite ? "text-red-500" : ""}`}
                            ></i>
                            Add to Favorite
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Regular Customer View */
            <>
              {/* Breadcrumb */}
              <nav className="mb-8">
                <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Link href="/" className="hover:text-primary-600">
                      Home
                    </Link>
                  </li>
                  <li>
                    <i className="fas fa-chevron-right text-xs"></i>
                  </li>
                  <li>
                    <Link href="/products" className="hover:text-primary-600">
                      Products
                    </Link>
                  </li>
                  <li>
                    <i className="fas fa-chevron-right text-xs"></i>
                  </li>
                  <li>
                    <span className="text-gray-900 dark:text-white">
                      {product.name}
                    </span>
                  </li>
                </ol>
              </nav>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Product Images */}
                <div className="space-y-4">
                  <div className="aspect-square bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
                    {(() => {
                      const allImages = imageData.allImages;

                      return (
                        <Image
                          src={
                            allImages[selectedImage] || "/placeholder-image.jpg"
                          }
                          alt={product.name}
                          width={600}
                          height={600}
                          className="w-full h-full object-cover"
                        />
                      );
                    })()}
                  </div>

                  {/* Thumbnail Images */}
                  {(() => {
                    const allImages = imageData.allImages;

                    return allImages.length > 1 ? (
                      <div className="grid grid-cols-5 gap-2">
                        {allImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 ${
                              selectedImage === index
                                ? "border-primary-500"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`${product.name} ${index + 1}`}
                              width={100}
                              height={100}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                  {/* Category and Features */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm font-medium">
                      {product.category}
                    </span>
                    {product.isOrganic && (
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                        Organic
                      </span>
                    )}
                    {product.isFresh && (
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                        Fresh
                      </span>
                    )}
                  </div>

                  {/* Product Name and Farmer */}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {product.name}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      Produced by{" "}
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        {product.farmer?.farmName ||
                          product.farmer?.name ||
                          "Unknown Farmer"}
                      </span>
                    </p>
                  </div>

                  {/* Rating and Reviews */}
                  <div className="flex items-center space-x-4">
                    {(() => {
                      // Calculate actual average rating and count from reviews if available
                      const actualReviewCount = reviews?.length || 0;
                      let displayRating = product.averageRating || 0;

                      // If we have reviews but no product rating, calculate from reviews
                      if (
                        actualReviewCount > 0 &&
                        (!product.averageRating || product.averageRating === 0)
                      ) {
                        const totalRating = reviews.reduce(
                          (sum, review) => sum + (review.rating || 0),
                          0,
                        );
                        displayRating = totalRating / actualReviewCount;
                      }

                      return (
                        <>
                          <StarRating rating={displayRating} showValue={true} />
                          <span className="text-gray-500 dark:text-gray-400">
                            ({actualReviewCount} reviews)
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  {/* Price and Stock */}
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                          ${product.price?.toFixed(2)}
                        </span>
                        <span className="text-lg text-gray-500 dark:text-gray-400">
                          /{product.unit || "kg"}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Available Stock
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {product.stock} {product.unit || "kg"}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      <span>
                        {product.farmer?.location || "Location not specified"}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quantity ({product.unit || "kg"})
                      </label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={session?.user?.userType === "farmer"}
                          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={product.stock}
                          value={quantity}
                          onChange={(e) =>
                            setQuantity(
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          disabled={session?.user?.userType === "farmer"}
                          className="w-20 text-center py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                          onClick={() =>
                            setQuantity(Math.min(product.stock, quantity + 1))
                          }
                          disabled={session?.user?.userType === "farmer"}
                          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      {session?.user?.userType === "farmer" && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                          <i className="fas fa-info-circle mr-1"></i>
                          Farmers can only view product details, not purchase
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {session?.user?.userType === "farmer" ? (
                      // Farmer-specific buttons
                      <>
                        <Link
                          href="/create"
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                        >
                          <i className="fas fa-plus mr-2"></i>
                          Add Product
                        </Link>
                        <Link
                          href="/manage"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                        >
                          <i className="fas fa-cog mr-2"></i>
                          Manage Orders
                        </Link>
                        <Link
                          href="/farmer-orders"
                          className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition flex items-center justify-center"
                        >
                          <i className="fas fa-clipboard-list mr-2"></i>
                          View My Orders
                        </Link>
                      </>
                    ) : (
                      // Customer buttons
                      <>
                        <button
                          onClick={handleBuyNow}
                          disabled={
                            product.stock <= 0 ||
                            session?.user?.userType === "farmer"
                          }
                          className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400"
                          title={
                            session?.user?.userType === "farmer"
                              ? "Farmers cannot purchase products"
                              : ""
                          }
                        >
                          <i className="fas fa-bolt mr-2"></i>
                          Buy Now
                        </button>
                        <button
                          onClick={handleAddToCart}
                          disabled={
                            isAddingToCart ||
                            product.stock <= 0 ||
                            session?.user?.userType === "farmer"
                          }
                          className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition disabled:bg-gray-400"
                          title={
                            session?.user?.userType === "farmer"
                              ? "Farmers cannot purchase products"
                              : ""
                          }
                        >
                          <i className="fas fa-shopping-cart mr-2"></i>
                          {isAddingToCart ? "Adding..." : "Add to Cart"}
                        </button>
                        <button
                          onClick={handleFavoriteToggle}
                          className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition"
                        >
                          <i
                            className={`${isFavorite ? "fas" : "far"} fa-heart mr-2 ${isFavorite ? "text-red-500" : ""}`}
                          ></i>
                          Add to Favorite
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="mt-16">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8">
                    {TAB_OPTIONS.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab
                            ? "border-primary-500 text-primary-600 dark:text-primary-400"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="py-8">
                  {/* Description Tab */}
                  {activeTab === "description" && (
                    <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-xl font-semibold mb-4">
                        Product Description
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {product.description ||
                          "No description available for this product."}
                      </p>

                      {product.features && product.features.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-lg font-medium mb-3">
                            Key Features
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {product.features.map((feature, index) => (
                              <li
                                key={index}
                                className="text-gray-600 dark:text-gray-400"
                              >
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Nutrition Tab */}
                  {activeTab === "nutrition" && (
                    <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-xl font-semibold mb-6">
                        Nutritional Information
                      </h3>

                      {product.nutritionalInformation ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                          <p className="text-gray-600 dark:text-gray-400">
                            {product.nutritionalInformation}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <i className="fas fa-apple-alt text-4xl text-gray-400 mb-4"></i>
                          <p className="text-gray-600 dark:text-gray-400">
                            Nutritional information is not available for this
                            product.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Storage Instructions Tab */}
                  {activeTab === "storage" && (
                    <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-xl font-semibold mb-6">
                        Storage Instructions
                      </h3>

                      {product.storageInstructions ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                          <p className="text-gray-600 dark:text-gray-400">
                            {product.storageInstructions}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <i className="fas fa-warehouse text-4xl text-gray-400 mb-4"></i>
                          <p className="text-gray-600 dark:text-gray-400">
                            Storage instructions are not available for this
                            product.
                          </p>
                        </div>
                      )}

                      {/* General storage tips */}
                      <div className="mt-8">
                        <h4 className="text-lg font-medium mb-4">
                          General Storage Tips
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-lg p-4">
                            <h5 className="font-medium mb-2">
                              <i className="fas fa-thermometer-half mr-2"></i>
                              Temperature
                            </h5>
                            <p className="text-sm">
                              Store in a cool, dry place away from direct
                              sunlight
                            </p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900 text-green-900 dark:text-green-100 rounded-lg p-4">
                            <h5 className="font-medium mb-2">
                              <i className="fas fa-tint mr-2"></i>
                              Humidity
                            </h5>
                            <p className="text-sm">
                              Keep in low humidity environment to prevent
                              spoilage
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === "reviews" && (
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Customer Reviews (
                          {product.reviewCount || product.totalReviews || 0})
                        </h2>
                        {/* Show review button only for customers who have purchased and received the product */}
                        {session &&
                          session?.user?.userType !== "farmer" &&
                          hasPurchasedProduct && (
                            <button
                              onClick={() => setShowReviewForm(true)}
                              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition"
                            >
                              <i className="fas fa-plus mr-2"></i>
                              Write Review
                            </button>
                          )}
                        {session &&
                          session?.user?.userType !== "farmer" &&
                          !hasPurchasedProduct &&
                          !checkingPurchase && (
                            <div className="text-center">
                              <p className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">
                                You need to purchase and receive this product to
                                write a review
                              </p>
                              <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 text-sm">
                                <i className="fas fa-shopping-cart mr-2"></i>
                                Purchase required for reviews
                              </div>
                            </div>
                          )}
                        {session &&
                          session?.user?.userType !== "farmer" &&
                          checkingPurchase && (
                            <div className="text-center">
                              <div className="inline-flex items-center text-gray-500 dark:text-gray-400 text-sm">
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Checking purchase history...
                              </div>
                            </div>
                          )}
                        {session && session?.user?.userType === "farmer" && (
                          <div className="text-center">
                            <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 text-sm">
                              <i className="fas fa-info-circle mr-2"></i>
                              Farmers can view reviews but cannot write them
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Review Summary */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-lg border border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Overall Rating Section */}
                          <div className="text-center">
                            <div className="mb-4">
                              {(() => {
                                // Calculate actual average rating from reviews if available
                                const actualReviewCount = reviews?.length || 0;
                                let displayRating = product.averageRating || 0;

                                // If we have reviews but no product rating, calculate from reviews
                                if (
                                  actualReviewCount > 0 &&
                                  (!product.averageRating ||
                                    product.averageRating === 0)
                                ) {
                                  const totalRating = reviews.reduce(
                                    (sum, review) => sum + (review.rating || 0),
                                    0,
                                  );
                                  displayRating =
                                    totalRating / actualReviewCount;
                                }

                                return (
                                  <>
                                    <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                                      {displayRating.toFixed(1)}
                                    </div>
                                    <StarRating
                                      rating={displayRating}
                                      size="lg"
                                    />
                                    <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg font-medium">
                                      Based on{" "}
                                      <span className="text-primary-600 dark:text-primary-400 font-bold">
                                        {actualReviewCount}
                                      </span>{" "}
                                      {actualReviewCount === 1
                                        ? "review"
                                        : "reviews"}
                                    </p>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Review Quality Indicator */}
                            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                              <div className="flex items-center justify-center space-x-2 text-sm">
                                <i className="fas fa-shield-alt text-green-600"></i>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {(reviews?.length || 0) > 0
                                    ? `${reviews.length} verified review${reviews.length === 1 ? "" : "s"}`
                                    : "No reviews yet"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Rating Distribution */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                              Rating Breakdown
                            </h4>
                            {(() => {
                              // Calculate rating distribution
                              const ratingDistribution = {
                                5: 0,
                                4: 0,
                                3: 0,
                                2: 0,
                                1: 0,
                              };
                              if (reviews && reviews.length > 0) {
                                reviews.forEach((review) => {
                                  const rating = Math.floor(review.rating);
                                  if (rating >= 1 && rating <= 5) {
                                    ratingDistribution[rating]++;
                                  }
                                });
                              }
                              const totalReviews = reviews?.length || 0;

                              return [5, 4, 3, 2, 1].map((rating) => {
                                const count = ratingDistribution[rating];
                                const percentage =
                                  totalReviews > 0
                                    ? (count / totalReviews) * 100
                                    : 0;

                                return (
                                  <div
                                    key={rating}
                                    className="flex items-center space-x-3"
                                  >
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                                      {rating} star{rating === 1 ? "" : "s"}
                                    </span>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                      <div
                                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                                      {count}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                                      {percentage.toFixed(0)}%
                                    </span>
                                  </div>
                                );
                              });
                            })()}

                            {/* Total Reviews Summary */}
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">
                                  {(reviews?.length || 0) === 0 &&
                                    "Be the first to review this product!"}
                                  {(reviews?.length || 0) === 1 &&
                                    "1 customer has reviewed this product"}
                                  {(reviews?.length || 0) > 1 &&
                                    `${reviews.length} customers have reviewed this product`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Review Modal */}
                      <EnhancedReviewModal
                        isOpen={showReviewForm}
                        onClose={() => {
                          setShowReviewForm(false);
                          setEditingReview(null);
                          setReviewForm(DEFAULT_REVIEW_FORM);
                        }}
                        product={product}
                        user={session?.user}
                        existingReview={editingReview}
                        onSubmit={handleEnhancedReviewSubmit}
                        isSubmitting={isSubmittingReview}
                      />

                      {/* Individual Reviews */}
                      <div className="space-y-8">
                        {reviews && reviews.length > 0 ? (
                          reviews.map((review, index) => (
                            <div
                              key={`${review._id}-${review.userId}-${index}`}
                              className="group bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800"
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                  <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-500 dark:to-primary-700 flex items-center justify-center shadow-lg">
                                      <span className="text-white font-bold text-lg">
                                        {(review.reviewer || "Anonymous")
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                      <i className="fas fa-check text-white text-xs"></i>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                        {review.reviewer || "Anonymous"}
                                      </h4>
                                      <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
                                        Verified Buyer
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <div className="flex items-center space-x-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <span
                                            key={star}
                                            className={`text-lg transition-all duration-200 ${
                                              star <= review.rating
                                                ? "text-yellow-400 drop-shadow-sm"
                                                : "text-gray-300 dark:text-gray-600"
                                            }`}
                                          >
                                            ★
                                          </span>
                                        ))}
                                      </div>
                                      <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                                        {review.rating}/5
                                      </span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        {new Date(
                                          review.createdAt || review.date,
                                        ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  {/* Show edit/delete buttons only for user's own review */}
                                  {session?.user?.userId === review.userId ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingReview(review);
                                          setReviewForm({
                                            rating: review.rating,
                                            comment: review.comment,
                                          });
                                          setShowReviewForm(true);
                                        }}
                                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Edit Review"
                                      >
                                        <i className="fas fa-edit text-blue-500 hover:text-blue-600"></i>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteReview(review._id)
                                        }
                                        disabled={isDeletingReview}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete Review"
                                      >
                                        <i className="fas fa-trash text-red-500 hover:text-red-600"></i>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                        <i className="fas fa-thumbs-up text-gray-400 hover:text-primary-500"></i>
                                      </button>
                                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                        <i className="fas fa-share text-gray-400 hover:text-primary-500"></i>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="relative">
                                <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary-400 to-primary-600 rounded-full opacity-20"></div>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-6 text-base">
                                  "{review.comment}"
                                </p>
                              </div>

                              {/* Review actions footer */}
                              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center space-x-1">
                                    <i className="fas fa-heart text-red-400"></i>
                                    <span>Helpful</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <i className="fas fa-comment text-blue-400"></i>
                                    <span>Reply</span>
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex -space-x-1">
                                    {[1, 2, 3].map((i) => (
                                      <div
                                        key={i}
                                        className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800"
                                      ></div>
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    +2 found helpful
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <div className="relative inline-block mb-6">
                              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <i className="fas fa-star text-3xl text-primary-500 dark:text-primary-400"></i>
                              </div>
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                                <i className="fas fa-plus text-white text-sm"></i>
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                              No Reviews Yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                              Be the first to share your experience with this
                              amazing product! Your review helps other customers
                              make informed decisions.
                            </p>
                            {session && hasPurchasedProduct && (
                              <button
                                onClick={() => setShowReviewForm(true)}
                                className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                              >
                                <i className="fas fa-edit mr-2"></i>
                                Write First Review
                              </button>
                            )}
                          </div>
                        )}

                        {/* Load More Reviews Button */}
                        {hasMoreReviews && (
                          <div className="text-center pt-8">
                            <button
                              onClick={loadMoreReviews}
                              className="group inline-flex items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                            >
                              <i className="fas fa-chevron-down mr-3 group-hover:animate-bounce"></i>
                              Load More Reviews
                              <span className="ml-3 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm rounded-full">
                                +{Math.min(5, reviews?.length || 0)}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Farmer Tab */}
                  {activeTab === "farmer" && (
                    <div>
                      <h3 className="text-xl font-semibold mb-6">
                        About the Farmer
                      </h3>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-user text-2xl text-primary-600 dark:text-primary-400"></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {product.farmer?.farmName ||
                                product.farmer?.name ||
                                "Farm Name"}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {product.farmer?.email ||
                                "Farmer contact not available"}
                            </p>

                            {product.farmer?.location && (
                              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
                                <i className="fas fa-map-marker-alt mr-2"></i>
                                <span>{product.farmer.location}</span>
                              </div>
                            )}

                            {product.farmer?.phone && (
                              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                                <i className="fas fa-phone mr-2"></i>
                                <span>{product.farmer.phone}</span>
                              </div>
                            )}

                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                              {product.farmer?.description ||
                                "A dedicated farmer committed to providing fresh, quality produce to the community."}
                            </p>

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <Link
                                href={`/details?id=${product.farmerId || product.farmer?.id}`}
                                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                              >
                                <i className="fas fa-external-link-alt mr-2"></i>
                                View All Products from this Farmer
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Products Section - Enhanced */}
              {relatedProducts.length > 0 && (
                <div className="mt-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
                  {/* Section Header */}
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-4 shadow-lg">
                      <i className="fas fa-box-open text-2xl text-white"></i>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                      Related Products
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      Discover similar high-quality products from our trusted
                      farmers. Each item is carefully selected to meet our
                      quality standards.
                    </p>
                    <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <i className="fas fa-leaf text-green-500"></i>
                      <span>{relatedProducts.length} products found</span>
                      <span>•</span>
                      <i className="fas fa-truck text-blue-500"></i>
                      <span>Fast delivery available</span>
                    </div>
                  </div>

                  {/* Enhanced Product Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {relatedProducts.map((relatedProduct, index) => (
                      <div
                        key={relatedProduct._id}
                        className="group transform transition-all duration-300 hover:-translate-y-2"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-600 overflow-hidden">
                          {/* Product Image */}
                          <div className="relative aspect-square overflow-hidden">
                            <Image
                              src={
                                relatedProduct.image ||
                                relatedProduct.images?.[0] ||
                                "/placeholder-image.jpg"
                              }
                              alt={relatedProduct.name}
                              width={300}
                              height={300}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />

                            {/* Product Badges */}
                            <div className="absolute top-3 left-3 flex flex-col space-y-2">
                              {relatedProduct.isOrganic && (
                                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                  Organic
                                </span>
                              )}
                              {relatedProduct.isFresh && (
                                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                  Fresh
                                </span>
                              )}
                            </div>

                            {/* Quick Actions Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <Link
                                href={`/details?id=${relatedProduct._id}`}
                                className="bg-white text-gray-900 px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors transform hover:scale-105"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="p-6">
                            <div className="mb-3">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {relatedProduct.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                by{" "}
                                {relatedProduct.farmer?.name ||
                                  relatedProduct.farmer?.farmName ||
                                  "Unknown Farmer"}
                              </p>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center space-x-1 mb-3">
                              <StarRating
                                rating={relatedProduct.averageRating || 0}
                                size="sm"
                              />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                (
                                {relatedProduct.reviewCount ||
                                  relatedProduct.totalReviews ||
                                  0}
                                )
                              </span>
                            </div>

                            {/* Price and Stock */}
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                  ${(relatedProduct.price || 0).toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  /{relatedProduct.unit || "kg"}
                                </span>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`text-xs font-medium ${
                                    (relatedProduct.stock || 0) > 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {(relatedProduct.stock || 0) > 0
                                    ? `${relatedProduct.stock} ${relatedProduct.unit || "kg"} left`
                                    : "Out of stock"}
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            <Link
                              href={`/details?id=${relatedProduct._id}`}
                              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 text-center block group-hover:shadow-lg transform group-hover:scale-[1.02]"
                            >
                              <i className="fas fa-eye mr-2"></i>
                              View Product
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Browse More Section */}
                  <div className="mt-12 text-center">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Looking for more products?
                      </p>
                      <Link
                        href="/products"
                        className="inline-flex items-center bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                      >
                        <i className="fas fa-shopping-bag mr-2"></i>
                        Browse All Products
                        <i className="fas fa-arrow-right ml-2"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
