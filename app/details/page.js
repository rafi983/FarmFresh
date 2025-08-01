"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import StarRating from "@/components/StarRating";
import Footer from "@/components/Footer";
import RecentOrdersSection from "@/components/RecentOrdersSection";
import FarmerProfileView from "@/components/FarmerProfileView";
import useProductData from "@/hooks/useProductData";
import useOwnership from "@/hooks/useOwnership";
import useReviews from "@/hooks/useReviews";

import Loading from "@/components/Loading";
import NotFound from "@/components/NotFound";

export default function ProductDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");
  const viewMode = searchParams.get("view");
  const { data: session } = useSession();
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
    session?.user?.id, // Pass userId to prioritize user's review
  );
  const isOwner = useOwnership(product, session, viewMode);

  // State management
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Review edit/delete state
  const [editingReview, setEditingReview] = useState(null);
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  // Purchase verification state
  const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  // Farmer-specific states
  const [stockUpdate, setStockUpdate] = useState("");
  const [priceUpdate, setPriceUpdate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Effects
  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  useEffect(() => {
    if (productId && isOwner && viewMode !== "customer") {
      const interval = setInterval(() => {
        fetchProductDetails();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [productId, isOwner, viewMode]);

  useEffect(() => {
    if (productId && isOwner && viewMode !== "customer") {
      fetchRecentOrders();
    }
  }, [productId, isOwner, viewMode]);

  // Check if product is favorited when productId changes
  useEffect(() => {
    if (productId) {
      setIsFavorite(isProductFavorited(productId));
    }
  }, [productId, isProductFavorited]);

  // Check if user has purchased this product
  useEffect(() => {
    if (session?.user?.id && productId) {
      checkUserPurchase();
    }
  }, [session?.user?.id, productId]);

  const checkUserPurchase = async () => {
    if (!session?.user?.id) return;

    setCheckingPurchase(true);
    try {
      const response = await fetch(
        `/api/orders?userId=${session.user.id}&productId=${productId}`,
      );
      if (response.ok) {
        const data = await response.json();
        // Check if user has any order with this product that's confirmed/delivered/pending
        const hasPurchased = data.orders?.some(
          (order) =>
            order.items?.some((item) => item.productId === productId) &&
            ["delivered", "confirmed", "pending"].includes(order.status),
        );
        setHasPurchasedProduct(hasPurchased);
      }
    } catch (error) {
      console.error("Error checking purchase history:", error);
      setHasPurchasedProduct(false);
    } finally {
      setCheckingPurchase(false);
    }
  };

  // API calls
  const fetchRecentOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch(
        `/api/orders?productId=${productId}&limit=5`,
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
  };

  // Event handlers
  const handleAddToCart = async () => {
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setIsAddingToCart(true);
    try {
      const item = {
        productId: productId,
        id: productId, // Add id field for cart context
        name: product.name,
        price: product.price,
        quantity: quantity,
        stock: product.stock, // Include stock information
        image:
          product.image ||
          (product.images && product.images[0]) ||
          "/placeholder-image.jpg",
        unit: product.unit || "kg",
        farmerId: product.farmerId,
        farmerName:
          product.farmer?.name || product.farmer?.farmName || "Unknown Farmer",
      };

      await addToCart(item, quantity);
      alert("Product added to cart successfully!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      // Show user-friendly error message for stock issues
      if (
        error.message.includes("Only") &&
        error.message.includes("available in stock")
      ) {
        alert(error.message);
      } else {
        alert("Failed to add product to cart. Please try again.");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setIsAddingToCart(true);
    try {
      // Create a product object that matches the CartContext expectations
      const productForCart = {
        id: productId,
        name: product.name,
        price: product.price,
        image:
          product.image ||
          (product.images && product.images[0]) ||
          "/placeholder-image.jpg",
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

      // Use CartContext's addToCart function
      await addToCart(productForCart, quantity);

      // Immediately redirect to payment - let the payment page handle the cart state
      // The payment page should wait for cart loading to complete before checking if empty
      router.push("/payment");
    } catch (error) {
      console.error("Error processing buy now:", error);
      alert(error.message || "Failed to process order. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    try {
      if (isFavorite) {
        // Remove from favorites
        const success = await removeFromFavorites(productId);
        if (success) {
          setIsFavorite(false);
          alert("Product removed from favorites!");
        } else {
          alert("Failed to remove from favorites. Please try again.");
        }
      } else {
        // Add to favorites
        const success = await addToFavorites(productId);
        if (success) {
          setIsFavorite(true);
          alert("Product added to favorites!");
        } else {
          alert("Failed to add to favorites. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorites. Please try again.");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!session) {
      alert("Please login to submit a review");
      return;
    }

    setIsSubmittingReview(true);
    try {
      // Include userId in the review submission
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
        setReviewForm({ rating: 5, comment: "" });
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
  };

  const handleUpdateReview = async () => {
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
        setReviewForm({ rating: 5, comment: "" });
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
  };

  const handleDeleteReview = async (reviewId) => {
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
        {
          method: "DELETE",
        },
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
  };

  const loadMoreReviews = () => {
    fetchReviews(reviewsPage + 1, true);
  };

  const handleUpdateProduct = async () => {
    if (!isOwner) return;

    if (!stockUpdate && !priceUpdate) {
      alert("Please enter a value to update");
      return;
    }

    setIsUpdating(true);
    try {
      const updateData = {};

      if (stockUpdate && stockUpdate.trim() !== "") {
        const stockValue = parseInt(stockUpdate);
        if (isNaN(stockValue) || stockValue < 0) {
          alert("Please enter a valid stock number");
          setIsUpdating(false);
          return;
        }
        updateData.stock = stockValue;
      }

      if (priceUpdate && priceUpdate.trim() !== "") {
        const priceValue = parseFloat(priceUpdate);
        if (isNaN(priceValue) || priceValue <= 0) {
          alert("Please enter a valid price");
          setIsUpdating(false);
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
  };

  const handleToggleStatus = async () => {
    if (!isOwner) return;

    const newStatus = product.status === "active" ? "inactive" : "active";
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
        alert(error.error || `Failed to ${actionText} product`);
      }
    } catch (error) {
      console.error(`Error ${actionText}ing product:`, error);
      alert(`Failed to ${actionText} product. Please try again.`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!isOwner) return;

    if (
      !confirm(
        "⚠️ Are you sure you want to delete this product?\n\nThis action cannot be undone and will remove:\n• The product listing\n• All associated data\n• Product from any pending orders",
      )
    ) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Product deleted successfully!");
        window.location.href = "/manage";
      } else {
        const error = await response.json();
        if (response.status === 409) {
          alert(
            "❌ Cannot Delete Product\n\nThis product has pending orders and cannot be deleted.\nPlease wait for all orders to be completed or cancelled before deleting this product.\n\nYou can temporarily deactivate the product instead.",
          );
        } else {
          alert(error.error || "Failed to delete product");
        }
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddImages = () => {
    router.push(`/create?edit=${productId}`);
  };

  // Helper function to get all images
  const getAllImages = () => {
    const allImages = [];
    if (product?.image) {
      allImages.push(product.image);
    }
    if (product?.images && product.images.length > 0) {
      allImages.push(...product.images);
    }
    return allImages;
  };

  // Calculate rating distribution from reviews
  const calculateRatingDistribution = () => {
    if (!reviews || reviews.length === 0) {
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((review) => {
      const rating = Math.floor(review.rating); // Round down to nearest integer
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    return distribution;
  };

  const getRatingPercentage = (rating, distribution) => {
    const totalReviews = reviews?.length || 0;
    if (totalReviews === 0) return 0;
    return (distribution[rating] / totalReviews) * 100;
  };

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
                      const allImages = getAllImages();

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
                      <Link
                        href={`/create?edit=${productId}`}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition flex items-center justify-center"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Edit Product
                      </Link>

                      <Link
                        href={`/details?id=${productId}&view=customer`}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition flex items-center justify-center"
                      >
                        <i className="fas fa-eye mr-2"></i>
                        View as Customer
                      </Link>

                      <button
                        onClick={handleToggleStatus}
                        disabled={isUpdating}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition flex items-center justify-center ${
                          product.status === "active"
                            ? "bg-orange-600 hover:bg-orange-700 text-white"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isUpdating ? (
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                        ) : (
                          <i
                            className={`fas ${product.status === "active" ? "fa-pause" : "fa-play"} mr-2`}
                          ></i>
                        )}
                        {product.status === "active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                      <button
                        onClick={handleDeleteProduct}
                        disabled={isUpdating}
                        className={`w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition flex items-center justify-center ${
                          isUpdating ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {isUpdating ? (
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                        ) : (
                          <i className="fas fa-trash mr-2"></i>
                        )}
                        Delete Product
                      </button>
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
                      const allImages = getAllImages();

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
                    const allImages = getAllImages();

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
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Write a review
                    </button>
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
                          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
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
                          className="w-20 text-center py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          onClick={() =>
                            setQuantity(Math.min(product.stock, quantity + 1))
                          }
                          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleBuyNow}
                      disabled={product.stock <= 0}
                      className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400"
                    >
                      <i className="fas fa-bolt mr-2"></i>
                      Buy Now
                    </button>
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || product.stock <= 0}
                      className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition disabled:bg-gray-400"
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
                  </div>

                  {/* Farmer Contact */}
                  <div className="bg-primary-50 dark:bg-primary-900 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                        <i className="fas fa-user text-primary-600 dark:text-primary-400"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {product.farmer?.name || "Farmer"}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {product.farmer?.email ||
                            "Contact information not available"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="mt-16">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8">
                    {[
                      "description",
                      "nutrition",
                      "storage",
                      "reviews",
                      "farmer",
                    ].map((tab) => (
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
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                              <i className="fas fa-thermometer-half mr-2"></i>
                              Temperature
                            </h5>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Store in a cool, dry place away from direct
                              sunlight
                            </p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">
                              <i className="fas fa-tint mr-2"></i>
                              Humidity
                            </h5>
                            <p className="text-sm text-green-700 dark:text-green-300">
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
                        {session && hasPurchasedProduct && (
                          <button
                            onClick={() => setShowReviewForm(true)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition"
                          >
                            <i className="fas fa-plus mr-2"></i>
                            Write Review
                          </button>
                        )}
                        {session &&
                          !hasPurchasedProduct &&
                          !checkingPurchase && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                              You need to purchase this product to write a
                              review
                            </div>
                          )}
                        {checkingPurchase && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Checking purchase history...
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
                              const ratingDistribution =
                                calculateRatingDistribution();
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

                      {/* Review Form Modal */}
                      {showReviewForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Write a Review
                              </h3>
                              <button
                                onClick={() => setShowReviewForm(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>

                            <form
                              onSubmit={
                                editingReview
                                  ? (e) => {
                                      e.preventDefault();
                                      handleUpdateReview();
                                    }
                                  : handleSubmitReview
                              }
                              className="space-y-4"
                            >
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Rating
                                </label>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() =>
                                        setReviewForm({
                                          ...reviewForm,
                                          rating: star,
                                        })
                                      }
                                      className={`text-2xl ${
                                        star <= reviewForm.rating
                                          ? "text-yellow-400"
                                          : "text-gray-300 dark:text-gray-600"
                                      }`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Comment
                                </label>
                                <textarea
                                  value={reviewForm.comment}
                                  onChange={(e) =>
                                    setReviewForm({
                                      ...reviewForm,
                                      comment: e.target.value,
                                    })
                                  }
                                  rows={4}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                                  placeholder="Share your experience with this product..."
                                  required
                                />
                              </div>

                              <div className="flex space-x-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowReviewForm(false);
                                    setEditingReview(null);
                                    setReviewForm({ rating: 5, comment: "" });
                                  }}
                                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={
                                    editingReview
                                      ? isUpdatingReview
                                      : isSubmittingReview
                                  }
                                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                  {editingReview
                                    ? isUpdatingReview
                                      ? "Updating..."
                                      : "Update Review"
                                    : isSubmittingReview
                                      ? "Submitting..."
                                      : "Submit Review"}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* Individual Reviews */}
                      <div className="space-y-8">
                        {reviews && reviews.length > 0 ? (
                          reviews.map((review, index) => (
                            <div
                              key={review._id}
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
                                  {/* Debug information */}
                                  {console.log("DEBUG Review comparison:", {
                                    sessionUserId: session?.user?.userId,
                                    reviewUserId: review.userId,
                                    areEqual:
                                      session?.user?.userId === review.userId,
                                    sessionUser: session?.user,
                                  })}

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
                            {session && (
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
                          Discover similar high-quality products from our
                          trusted farmers. Each item is carefully selected to
                          meet our quality standards.
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
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
