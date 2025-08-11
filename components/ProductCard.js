"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import StarRating from "./StarRating";
import MessageButton from "./messaging/MessageButton";

export default function ProductCard({ product, showAddToCart = true }) {
  const { data: session } = useSession();
  const { addToFavorites, removeFromFavorites, isProductFavorited } =
    useFavorites();
  const { addToCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  // Check if this product is favorited
  const isFavorite = isProductFavorited(product._id);

  const handleFavoriteToggle = async () => {
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setIsLoadingFavorite(true);
    try {
      if (isFavorite) {
        await removeFromFavorites(product._id);
      } else {
        await addToFavorites(product._id);
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const handleAddToCart = async () => {
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    // Check if user is a farmer and show appropriate message
    if (session?.user?.userType === "farmer") {
      alert(
        "Farmers cannot purchase products. You can only sell your own products on this platform. Use the 'Manage' section to add your products.",
      );
      return;
    }

    setIsAddingToCart(true);
    try {
      // Pass the complete product object with normalized id field
      const productForCart = {
        id: product._id, // Normalize _id to id for cart
        _id: product._id,
        name: product.name,
        price: product.price,
        image:
          product.images?.[0] ||
          product.image ||
          "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop", // Use first image from images array
        farmer: product.farmer,
        category: product.category,
        unit: product.unit || "kg",
        stock: product.stock || 0, // Add missing stock field
        farmerId: product.farmerId, // Add farmerId for consistency
        farmerName:
          product.farmer?.name || product.farmer?.farmName || "Unknown Farmer", // Add farmerName
      };

      const success = await addToCart(productForCart, 1);
      if (success !== false) {
        // Success message is handled by CartContext
      } else {
        alert("Failed to add product to cart. Please try again.");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      // Error message is handled by CartContext, but show user-friendly alert
      alert(
        error.message || "Failed to add product to cart. Please try again.",
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isOutOfStock = product.stock === 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
      <div className="relative">
        {/* Product Image */}
        <Link href={`/details?id=${product._id}`}>
          <Image
            src={
              product.images?.[0] ||
              product.image ||
              "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop"
            }
            alt={product.name}
            width={400}
            height={300}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
          />
        </Link>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteToggle}
          disabled={isLoadingFavorite}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isFavorite
              ? "bg-red-500 text-white"
              : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-500"
          } ${isLoadingFavorite ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <i
            className={`${
              isFavorite ? "fas" : "far"
            } fa-heart text-sm ${isLoadingFavorite ? "fa-spin fa-spinner" : ""}`}
          ></i>
        </button>

        {/* Stock Status Badge */}
        {isOutOfStock && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Out of Stock
          </div>
        )}

        {/* Featured Badge */}
        {product.featured && (
          <div className="absolute top-3 left-3 bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Featured
          </div>
        )}

        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            {Math.round(
              ((product.originalPrice - product.price) /
                product.originalPrice) *
                100,
            )}
            % OFF
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Category */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900 px-2 py-1 rounded-full">
            {product.category}
          </span>
          {product.tags && product.tags.includes("Organic") && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
              Organic
            </span>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/details?id=${product._id}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Farmer Name */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          <i className="fas fa-user-tie mr-1"></i>
          by{" "}
          {typeof product.farmer === "object" && product.farmer?.name
            ? product.farmer.name
            : typeof product.farmer === "string"
              ? product.farmer
              : product.farmerName || "Unknown Farmer"}
        </p>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <StarRating
            rating={product.averageRating || 0}
            size="sm"
            showCount={false}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
            ({product.reviewCount || product.totalRatings || 0} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            per {product.unit || "kg"}
          </span>
        </div>

        {/* Stock Info */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Stock:</span>
            <span
              className={`font-medium ${
                product.stock > 50
                  ? "text-green-600"
                  : product.stock > 10
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {product.stock} {product.unit || "kg"} available
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                product.stock > 50
                  ? "bg-green-500"
                  : product.stock > 10
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{
                width: `${Math.min((product.stock / 100) * 100, 100)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        {showAddToCart && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || isOutOfStock}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isOutOfStock
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700 text-white"
                } ${isAddingToCart ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isAddingToCart ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Adding...
                  </>
                ) : isOutOfStock ? (
                  "Out of Stock"
                ) : (
                  <>
                    <i className="fas fa-cart-plus mr-2"></i>
                    Add to Cart
                  </>
                )}
              </button>

              <Link
                href={`/details?id=${product._id}`}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center"
              >
                <i className="fas fa-eye"></i>
              </Link>
            </div>

            {/* Message Farmer Button */}
            {session?.user?.userType !== "farmer" && product.farmerId && (
              <MessageButton
                recipientId={product.farmerId}
                recipientName={
                  product.farmer?.name ||
                  product.farmer?.farmName ||
                  product.farmerName ||
                  "Farmer"
                }
                recipientType="farmer"
                productName={product.name}
                variant="secondary"
                className="w-full"
              />
            )}
          </div>
        )}

        {/* Purchase Count - Show for all products, handle missing field */}
        {(product.purchaseCount || 0) >= 0 && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            <i className="fas fa-shopping-bag mr-1"></i>
            {product.purchaseCount || 0} purchases
          </div>
        )}
      </div>
    </div>
  );
}
