"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import StarRating from "@/components/StarRating";
import Footer from "@/components/Footer";

export default function ProductDetails() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
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

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
      fetchReviews();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
        setRelatedProducts(data.relatedProducts);
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
                <Image
                  src={
                    product.images?.[selectedImage] ||
                    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&h=600&fit=crop"
                  }
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {product.images.map((image, index) => (
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
                      />
                    </button>
                  ))}
                </div>
              )}
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
                  ({product.reviewCount || product.totalReviews || 0} reviews)
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
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
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
                          {product.nutritionalInformation.servingSize || "100g"}{" "}
                          serving
                        </h4>
                      </div>

                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Main nutrients */}
                          <div className="space-y-3">
                            {product.nutritionalInformation.calories && (
                              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                <span className="font-medium">Calories</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {product.nutritionalInformation.calories} kcal
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
                            {product.nutritionalInformation.carbohydrates && (
                              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                <span className="font-medium">
                                  Carbohydrates
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {product.nutritionalInformation.carbohydrates}
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
                                <span className="font-medium">Vitamin B1</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {product.nutritionalInformation.vitaminB1}
                                </span>
                              </div>
                            )}
                            {product.nutritionalInformation.vitaminC && (
                              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                                <span className="font-medium">Vitamin C</span>
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
                        Storage instructions are not available for this product.
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
                          Keep at recommended temperature to maintain freshness
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
                              return (totalRating / allReviews.length).toFixed(
                                1,
                              );
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
                                  avgRating = totalRating / allReviews.length;
                                } else {
                                  avgRating =
                                    product.averageRating ||
                                    product.rating ||
                                    0;
                                }

                                console.log(
                                  "Star rendering - Average rating:",
                                  avgRating,
                                  "Star index:",
                                  i,
                                );

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
                                isSubmittingReview || !reviewForm.comment.trim()
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
                                  Helpful ({Math.floor(Math.random() * 15) + 1})
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
                          {product.farmer?.location || "Location not specified"}
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
        </div>
      </div>
      <Footer />
    </>
  );
}
