"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import StarRating from "@/components/StarRating";
import Footer from "@/components/Footer";
import RecentOrdersSection from "@/components/RecentOrdersSection";

export default function ProductDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");
  const viewMode = searchParams.get("view"); // Check for view parameter
  const { data: session } = useSession();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Farmer-specific states
  const [editMode, setEditMode] = useState(false);
  const [stockUpdate, setStockUpdate] = useState("");
  const [priceUpdate, setPriceUpdate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
      fetchReviews();
    }
  }, [productId]);

  // Add a separate effect to refresh performance metrics periodically
  useEffect(() => {
    if (productId && isOwner && viewMode !== "customer") {
      // Refresh performance data every 30 seconds when viewing as owner
      const interval = setInterval(() => {
        fetchProductDetails();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [productId, isOwner, viewMode]);

  // Add a separate effect to fetch recent orders for farmers
  useEffect(() => {
    if (productId && isOwner && viewMode !== "customer") {
      fetchRecentOrders();
    }
  }, [productId, isOwner, viewMode]);

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);

      if (response.ok) {
        const data = await response.json();

        setProduct(data.product);
        setRelatedProducts(data.relatedProducts);

        // Check ownership only if not forcing customer view
        if (viewMode !== "customer") {
          setIsOwner(checkOwnership(data.product));
        } else {
          setIsOwner(false); // Force customer view
        }
      } else {
        console.error(
          "API Response Error:",
          response.status,
          response.statusText,
        );
        const errorData = await response.text();
        console.error("Error Response Body:", errorData);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page = 1, append = false) => {
    try {
      const response = await fetch(
        `/api/products/${productId}/reviews?page=${page}`,
      );
      if (response.ok) {
        const data = await response.json();

        if (append) {
          setReviews((prev) => [...prev, ...data.reviews]);
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

  const handleAddToCart = async () => {
    if (!session?.user) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    setIsAddingToCart(true);
    try {
      // Use consistent user ID format
      const userId =
        session.user.userId ||
        session.user.id ||
        session.user._id ||
        session.user.email;

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: productId,
          quantity: quantity,
          userId: userId,
        }),
      });

      if (response.ok) {
        alert("Product added to cart successfully!");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add product to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!session?.user) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    // First add to cart, then navigate to payment
    setIsAddingToCart(true);
    try {
      // Use consistent user ID format
      const userId =
        session.user.userId ||
        session.user.id ||
        session.user._id ||
        session.user.email;

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: productId,
          quantity: quantity,
          userId: userId,
        }),
      });

      if (response.ok) {
        // Navigate to payment page
        window.location.href = "/payment";
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error processing buy now:", error);
      alert("Failed to process order. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleFavoriteToggle = async () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement favorite API call
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!session) {
      alert("Please login to submit a review");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewForm),
      });

      if (response.ok) {
        setShowReviewForm(false);
        setReviewForm({ rating: 5, comment: "" });
        fetchReviews(); // Refresh reviews
        fetchProductDetails(); // Refresh product rating
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

  const loadMoreReviews = () => {
    fetchReviews(reviewsPage + 1, true);
  };

  // Check if current user owns this product
  const checkOwnership = (productData) => {
    if (!session?.user || !productData) return false;

    const userId = session.user.userId || session.user.id || session.user._id;
    const userEmail = session.user.email;

    return (
      productData.farmerId === userId ||
      productData.farmerId === String(userId) ||
      productData.farmerEmail === userEmail ||
      productData.farmer?.email === userEmail ||
      productData.farmer?.id === userId
    );
  };

  const handleUpdateProduct = async () => {
    if (!isOwner) return;

    // Validate input
    if (!stockUpdate && !priceUpdate) {
      alert("Please enter a value to update");
      return;
    }

    setIsUpdating(true);
    try {
      const updateData = {};

      // Only include fields that have values
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        alert("Product updated successfully!");
        fetchProductDetails(); // Refresh product details
        setStockUpdate(""); // Clear input
        setPriceUpdate(""); // Clear input
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

  const handleStockUpdate = async () => {
    if (!stockUpdate || !stockUpdate.trim()) {
      alert("Please enter a stock value");
      return;
    }

    const stockValue = parseInt(stockUpdate);
    if (isNaN(stockValue) || stockValue < 0) {
      alert("Please enter a valid stock number");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stock: stockValue }),
      });

      if (response.ok) {
        alert("Stock updated successfully!");
        fetchProductDetails();
        setStockUpdate("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update stock");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriceUpdate = async () => {
    if (!priceUpdate || !priceUpdate.trim()) {
      alert("Please enter a price value");
      return;
    }

    const priceValue = parseFloat(priceUpdate);
    if (isNaN(priceValue) || priceValue <= 0) {
      alert("Please enter a valid price");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ price: priceValue }),
      });

      if (response.ok) {
        alert("Price updated successfully!");
        fetchProductDetails();
        setPriceUpdate("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update price");
      }
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Failed to update price. Please try again.");
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
        headers: {
          "Content-Type": "application/json",
        },
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
        window.location.href = "/manage"; // Redirect to dashboard
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
    // Redirect to edit page where they can add more images
    router.push(`/create?edit=${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="aspect-square bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-300 dark:bg-gray-600 rounded-lg"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Product not found
          </h1>
          <Link
            href="/products"
            className="text-primary-600 hover:text-primary-700"
          >
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Show farmer view only if isOwner is true AND viewMode is not "customer" */}
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

              {/* Add Customer View Notice */}
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
                        className={`fas ${product.status === "active" ? "fa-check-circle" : "fa-pause-circle"} mr-1`}
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
                        Product Images ({product.images?.length || 0})
                      </h3>
                      <button
                        onClick={handleAddImages}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <i className="fas fa-plus mr-1"></i>
                        Add Images
                      </button>
                    </div>

                    {/* Current Images Display */}
                    {(() => {
                      // Get all images from the product
                      const allImages =
                        product.images && product.images.length > 0
                          ? product.images
                          : product.image
                            ? [product.image]
                            : [];

                      return allImages.length > 0 ? (
                        <div className="space-y-4">
                          {/* Main Image Display */}
                          <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden max-w-md mx-auto">
                            <Image
                              src={allImages[selectedImage] || allImages[0]}
                              alt={`${product.name} - Image ${selectedImage + 1}`}
                              width={400}
                              height={250}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=250&fit=crop";
                              }}
                            />
                            <div className="absolute top-2 left-2">
                              <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                                {selectedImage + 1} of {allImages.length}
                              </span>
                            </div>
                            {allImages.length > 1 && (
                              <>
                                <button
                                  onClick={() =>
                                    setSelectedImage(
                                      selectedImage > 0
                                        ? selectedImage - 1
                                        : allImages.length - 1,
                                    )
                                  }
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1.5 rounded-full transition"
                                >
                                  <i className="fas fa-chevron-left text-sm"></i>
                                </button>
                                <button
                                  onClick={() =>
                                    setSelectedImage(
                                      selectedImage < allImages.length - 1
                                        ? selectedImage + 1
                                        : 0,
                                    )
                                  }
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1.5 rounded-full transition"
                                >
                                  <i className="fas fa-chevron-right text-sm"></i>
                                </button>
                              </>
                            )}
                          </div>

                          {/* Thumbnail Gallery */}
                          {allImages.length > 1 && (
                            <div className="grid grid-cols-6 gap-2 max-w-md mx-auto">
                              {allImages.map((image, index) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedImage(index)}
                                  className={`relative aspect-square bg-gray-100 dark:bg-gray-700 rounded overflow-hidden border-2 transition ${
                                    selectedImage === index
                                      ? "border-blue-500"
                                      : "border-transparent hover:border-gray-300"
                                  }`}
                                >
                                  <Image
                                    src={image}
                                    alt={`${product.name} thumbnail ${index + 1}`}
                                    width={60}
                                    height={60}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src =
                                        "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=60&h=60&fit=crop";
                                    }}
                                  />
                                  {selectedImage === index && (
                                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                      <i className="fas fa-check text-blue-600 text-xs"></i>
                                    </div>
                                  )}
                                </button>
                              ))}

                              {/* Add more images placeholder for farmers */}
                              {allImages.length < 5 && (
                                <button className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                                  <div className="text-center">
                                    <i className="fas fa-plus text-gray-400 text-xs"></i>
                                  </div>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-image text-2xl text-gray-400"></i>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No Images Uploaded
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Add product images to make your listing more
                            attractive to customers
                          </p>
                          <Link
                            href={`/create?edit=${productId}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition inline-flex items-center"
                          >
                            <i className="fas fa-upload mr-2"></i>
                            Upload Images
                          </Link>
                        </div>
                      );
                    })()}

                    {/* Enhanced Debug info for farmer view */}
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
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {product.name}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {product.category}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            Current Price
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            ৳{product.price}
                          </div>
                          <div className="text-sm text-gray-500">
                            per {product.unit || "kg"}
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            Current Stock
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {product.stock}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.unit || "kg"} available
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Description
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {product.description || "No description available"}
                        </p>
                      </div>

                      {product.features && (
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Features
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {product.features.map((feature, index) => (
                              <span
                                key={index}
                                className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
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
                            placeholder={product.stock.toString()}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            onClick={handleUpdateProduct}
                            disabled={!stockUpdate || isUpdating}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition"
                          >
                            {isUpdating ? "Updating..." : "Update"}
                          </button>
                        </div>
                      </div>

                      {/* Price Update */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Update Price (৳)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={priceUpdate}
                            onChange={(e) => setPriceUpdate(e.target.value)}
                            placeholder={product.price.toString()}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            onClick={handleUpdateProduct}
                            disabled={!priceUpdate || isUpdating}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition"
                          >
                            {isUpdating ? "Updating..." : "Update"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders - Enhanced */}
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
                          <div className="text-2xl font-bold text-blue-600">
                            {product.performanceMetrics?.totalSales || 0}
                          </div>
                          {product.performanceMetrics?.salesTrend === "up" && (
                            <i className="fas fa-arrow-up text-green-500 text-sm"></i>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Sales (Units)
                        </div>
                        {product.performanceMetrics?.recentSales > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            +{product.performanceMetrics.recentSales} this month
                          </div>
                        )}
                      </div>

                      {/* Total Revenue */}
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ৳
                          {product.performanceMetrics?.totalRevenue?.toLocaleString() ||
                            0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Revenue
                        </div>
                        {product.performanceMetrics?.recentRevenue > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            +৳
                            {product.performanceMetrics.recentRevenue.toLocaleString()}{" "}
                            this month
                          </div>
                        )}
                      </div>

                      {/* Average Rating */}
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {product.performanceMetrics?.averageRating
                            ? product.performanceMetrics.averageRating.toFixed(
                                1,
                              )
                            : "0.0"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Average Rating
                        </div>
                        <div className="flex justify-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`fas fa-star text-xs ${
                                i <
                                Math.round(
                                  product.performanceMetrics?.averageRating ||
                                    0,
                                )
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            ></i>
                          ))}
                        </div>
                      </div>

                      {/* Total Reviews */}
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {product.performanceMetrics?.totalReviews || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Reviews
                        </div>
                      </div>

                      {/* Average Order Value */}
                      {product.performanceMetrics?.averageOrderValue > 0 && (
                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            ৳
                            {product.performanceMetrics.averageOrderValue.toFixed(
                              0,
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
                          ? "📈 Active product with sales history"
                          : "📊 New product - building performance data"}
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
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white"
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
                        {isUpdating
                          ? "Updating..."
                          : product.status === "active"
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
                        {isUpdating ? "Deleting..." : "Delete Product"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Regular Customer View */
            <>
              {/* Regular breadcrumb and customer interface here */}
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
                      // Combine both image sources for customer view
                      const allImages = [];
                      if (product.image) {
                        allImages.push(product.image);
                      }
                      if (product.images && product.images.length > 0) {
                        allImages.push(...product.images);
                      }

                      return (
                        <Image
                          src={
                            allImages[selectedImage] ||
                            "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&h=600&fit=crop"
                          }
                          alt={product.name}
                          width={600}
                          height={600}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&h=600&fit=crop";
                          }}
                          onLoad={(e) => {
                            console.log(
                              "Customer view main image loaded successfully:",
                              e.target.src,
                            );
                          }}
                        />
                      );
                    })()}
                  </div>

                  {/* Thumbnail Images */}
                  {(() => {
                    // Combine both image sources for thumbnails
                    const allImages = [];
                    if (product.image) {
                      allImages.push(product.image);
                    }
                    if (product.images && product.images.length > 0) {
                      allImages.push(...product.images);
                    }

                    return allImages.length > 1 ? (
                      <div className="grid grid-cols-5 gap-2">
                        {allImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 transition ${
                              selectedImage === index
                                ? "border-primary-500"
                                : "border-transparent hover:border-primary-300"
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`${product.name} ${index + 1}`}
                              width={100}
                              height={100}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&h=100&fit=crop";
                              }}
                              onLoad={() => {
                                console.log(
                                  `Customer view thumbnail ${index + 1} loaded successfully`,
                                );
                              }}
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
                    <div className="flex items-center space-x-2 mb-2">
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {product.name}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      Produced by{" "}
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        {product.farmer?.farmName ||
                          product.farmer?.name ||
                          "Unknown Farm"}
                      </span>
                    </p>
                  </div>

                  {/* Rating and Reviews */}
                  <div className="flex items-center space-x-4">
                    <StarRating
                      rating={product.averageRating || 0}
                      showValue={true}
                    />
                    <span className="text-gray-500 dark:text-gray-400">
                      ({product.reviewCount || product.totalReviews || 0}{" "}
                      reviews)
                    </span>
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
                          ৳{product.price}
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
                          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <i className="fas fa-minus text-sm"></i>
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) =>
                            setQuantity(
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          min="1"
                          max={product.stock}
                          className="w-20 text-center py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={() =>
                            setQuantity(Math.min(product.stock, quantity + 1))
                          }
                          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <i className="fas fa-plus text-sm"></i>
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
                          {product.farmer?.name || "Unknown Farmer"}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Farmer since{" "}
                          {new Date().getFullYear() -
                            (product.farmer?.experience || 5)}
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
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                          activeTab === tab
                            ? "border-primary-500 text-primary-600 dark:text-primary-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                      >
                        {tab === "nutrition"
                          ? "Nutrition"
                          : tab === "storage"
                            ? "Storage"
                            : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                          <h4 className="text-lg font-medium mb-3">Features</h4>
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
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              Per{" "}
                              {product.nutritionalInformation.servingSize ||
                                "100g"}{" "}
                              serving
                            </h4>
                          </div>

                          <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Main nutrients */}
                              <div className="space-y-3">
                                {product.nutritionalInformation.calories && (
                                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                    <span className="font-medium">
                                      Calories
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {product.nutritionalInformation.calories}{" "}
                                      kcal
                                    </span>
                                  </div>
                                )}
                                {product.nutritionalInformation.protein && (
                                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                    <span className="font-medium">Protein</span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {product.nutritionalInformation.protein}
                                    </span>
                                  </div>
                                )}
                                {product.nutritionalInformation
                                  .carbohydrates && (
                                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                    <span className="font-medium">
                                      Carbohydrates
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {
                                        product.nutritionalInformation
                                          .carbohydrates
                                      }
                                    </span>
                                  </div>
                                )}
                                {product.nutritionalInformation.fiber && (
                                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                    <span className="font-medium">Fiber</span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {product.nutritionalInformation.fiber}
                                    </span>
                                  </div>
                                )}
                                {product.nutritionalInformation.fat && (
                                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                    <span className="font-medium">Fat</span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {product.nutritionalInformation.fat}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Vitamins and Minerals */}
                              <div className="space-y-3">
                                {product.nutritionalInformation.iron && (
                                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                    <span className="font-medium">Iron</span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {product.nutritionalInformation.iron}
                                    </span>
                                  </div>
                                )}
                                {product.nutritionalInformation.vitaminB1 && (
                                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                    <span className="font-medium">
                                      Vitamin B1
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {product.nutritionalInformation.vitaminB1}
                                    </span>
                                  </div>
                                )}
                                {product.nutritionalInformation.vitaminC && (
                                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                    <span className="font-medium">
                                      Vitamin C
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {product.nutritionalInformation.vitaminC}
                                    </span>
                                  </div>
                                )}
                                {product.nutritionalInformation.gluten && (
                                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                    <span className="font-medium text-orange-600">
                                      Allergen Info
                                    </span>
                                    <span className="text-orange-600 dark:text-orange-400">
                                      {product.nutritionalInformation.gluten}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
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
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <i className="fas fa-snowflake text-blue-600 dark:text-blue-400 text-xl"></i>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
                                How to Store This Product
                              </h4>
                              <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                                {product.storageInstructions}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
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
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <i className="fas fa-thermometer-half text-green-600"></i>
                              <span className="font-medium">Temperature</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Keep at recommended temperature to maintain
                              freshness
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <i className="fas fa-tint text-blue-600"></i>
                              <span className="font-medium">Moisture</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Control humidity levels to prevent spoilage
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <i className="fas fa-sun text-yellow-600"></i>
                              <span className="font-medium">Light</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Store away from direct sunlight when specified
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <i className="fas fa-clock text-purple-600"></i>
                              <span className="font-medium">Freshness</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Consume within recommended timeframe
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
                          Customer Reviews
                        </h2>
                        {session && (
                          <button
                            onClick={() => setShowReviewForm(true)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition"
                          >
                            Write a Review
                          </button>
                        )}
                      </div>

                      {/* Review Summary */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <div className="flex items-center space-x-2 mb-4">
                              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                {(() => {
                                  // Use reviews from API call, which should contain the product's reviews array
                                  const allReviews = reviews || [];
                                  if (allReviews.length === 0) {
                                    // Fallback to product's original rating if no reviews from API
                                    return (
                                      product.averageRating ||
                                      product.rating ||
                                      0
                                    ).toFixed(1);
                                  }
                                  const totalRating = allReviews.reduce(
                                    (sum, review) =>
                                      sum + Number(review.rating || 0),
                                    0,
                                  );
                                  return (
                                    totalRating / allReviews.length
                                  ).toFixed(1);
                                })()}
                              </span>
                              <div>
                                <div className="flex text-yellow-400 mb-1">
                                  {[...Array(5)].map((_, i) => {
                                    // Calculate average rating from API reviews or fallback to product rating
                                    const allReviews = reviews || [];
                                    let avgRating = 0;
                                    if (allReviews.length > 0) {
                                      const totalRating = allReviews.reduce(
                                        (sum, review) =>
                                          sum + Number(review.rating || 0),
                                        0,
                                      );
                                      avgRating =
                                        totalRating / allReviews.length;
                                    } else {
                                      avgRating =
                                        product.averageRating ||
                                        product.rating ||
                                        0;
                                    }

                                    return (
                                      <i
                                        key={i}
                                        className={`fas fa-star ${
                                          i < Math.round(avgRating)
                                            ? "text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      ></i>
                                    );
                                  })}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Based on{" "}
                                  {reviews?.length ||
                                    product.totalReviews ||
                                    product.reviewCount ||
                                    0}{" "}
                                  reviews
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {/* Dynamic Rating breakdown using API reviews */}
                            {[5, 4, 3, 2, 1].map((star) => {
                              const allReviews = reviews || [];
                              const totalReviews = allReviews.length;

                              // Count reviews that fall within the star range (e.g., 4.0-4.9 for 4 stars)
                              const starCount = allReviews.filter((review) => {
                                const rating = Number(review.rating || 0);
                                return rating >= star && rating < star + 1;
                              }).length;

                              const percentage =
                                totalReviews > 0
                                  ? (starCount / totalReviews) * 100
                                  : 0;

                              return (
                                <div
                                  key={star}
                                  className="flex items-center space-x-2"
                                >
                                  <span className="text-sm w-8">{star}★</span>
                                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
                                    {starCount}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Review Form Modal */}
                      {showReviewForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                            <h4 className="text-lg font-semibold mb-4">
                              Write a Review
                            </h4>
                            <form onSubmit={handleSubmitReview}>
                              <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                  Rating
                                </label>
                                <div className="flex gap-1">
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
                                      className={`text-2xl transition-colors ${
                                        star <= reviewForm.rating
                                          ? "text-yellow-400 hover:text-yellow-500"
                                          : "text-gray-300 hover:text-gray-400"
                                      }`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
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
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                                  rows="4"
                                  placeholder="Share your experience with this product..."
                                  required
                                />
                              </div>

                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setShowReviewForm(false)}
                                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={
                                    isSubmittingReview ||
                                    !reviewForm.comment.trim()
                                  }
                                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                  {isSubmittingReview
                                    ? "Submitting..."
                                    : "Submit Review"}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* Individual Reviews */}
                      <div className="space-y-6">
                        {/* Only display reviews from API call */}
                        {(() => {
                          const allReviews = reviews || [];

                          if (allReviews.length === 0) {
                            return (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <i className="fas fa-comment-alt text-2xl text-gray-400"></i>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                  No reviews yet
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                  Be the first to share your thoughts about this
                                  product.
                                </p>
                                {session && (
                                  <button
                                    onClick={() => setShowReviewForm(true)}
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition"
                                  >
                                    Write the First Review
                                  </button>
                                )}
                              </div>
                            );
                          }

                          return allReviews.map((review, index) => (
                            <div
                              key={review._id || index}
                              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
                            >
                              <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                  <i className="fas fa-user text-primary-600 dark:text-primary-400"></i>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                          {review.userName || "Anonymous"}
                                        </h4>
                                        {review.isCurrentUser && (
                                          <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded text-xs">
                                            Your Review
                                          </span>
                                        )}
                                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                                          Verified Purchase
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <div className="flex text-yellow-400 text-sm">
                                          {[...Array(5)].map((_, i) => {
                                            const reviewRating = Number(
                                              review.rating || 0,
                                            );
                                            console.log(
                                              `Review by ${review.userName} - Rating: ${reviewRating}, Star ${i + 1}: ${i < Math.floor(reviewRating) ? "filled" : "empty"}`,
                                            );

                                            return (
                                              <i
                                                key={i}
                                                className={`fas fa-star ${
                                                  i < Math.floor(reviewRating)
                                                    ? "text-yellow-400"
                                                    : "text-gray-300"
                                                }`}
                                              ></i>
                                            );
                                          })}
                                        </div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {review.createdAt
                                            ? new Date(
                                                review.createdAt,
                                              ).toLocaleDateString()
                                            : "Unknown date"}
                                        </span>
                                      </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                                      <i className="fas fa-ellipsis-v"></i>
                                    </button>
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                                    {review.comment}
                                  </p>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <button className="hover:text-primary-600 dark:hover:text-primary-400 transition">
                                      <i className="far fa-thumbs-up mr-1"></i>
                                      Helpful (
                                      {Math.floor(Math.random() * 15) + 1})
                                    </button>
                                    <button className="hover:text-primary-600 dark:hover:text-primary-400 transition">
                                      Reply
                                    </button>
                                    {review.isCurrentUser && (
                                      <button className="hover:text-red-600 dark:hover:text-red-400 transition">
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}

                        {/* Load More Reviews Button */}
                        {hasMoreReviews && (
                          <div className="text-center mt-8">
                            <button
                              onClick={loadMoreReviews}
                              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition"
                            >
                              Load More Reviews
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Farmer Info Tab */}
                  {activeTab === "farmer" && (
                    <div>
                      <h3 className="text-xl font-semibold mb-6">
                        About the Farmer
                      </h3>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                            <i className="fas fa-user text-2xl text-primary-600 dark:text-primary-400"></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {product.farmer?.name || "Unknown Farmer"}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              <i className="fas fa-map-marker-alt mr-2"></i>
                              {product.farmer?.location ||
                                "Location not specified"}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              {product.farmer?.bio ||
                                "No farmer information available."}
                            </p>

                            {product.farmer?.experience && (
                              <div className="mt-4">
                                <span className="text-sm text-gray-500">
                                  Experience:{" "}
                                </span>
                                <span className="font-medium">
                                  {product.farmer.experience} years
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="mt-16">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                    Related Products
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedProducts.map((relatedProduct) => (
                      <ProductCard
                        key={relatedProduct._id}
                        product={relatedProduct}
                      />
                    ))}
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
