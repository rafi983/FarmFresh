"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import StarRating from "./StarRating";

export default function ProductCard({ product, showAddToCart = true }) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement favorite functionality
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      // TODO: Implement add to cart API call
      console.log("Adding to cart:", product._id);
    } catch (error) {
      console.error("Error adding to cart:", error);
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
      <div className="relative">
        <Link href={`/details?id=${product._id}`}>
          <Image
            src={
              product.images?.[0] ||
              "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop"
            }
            alt={product.name}
            width={400}
            height={300}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isOrganic && (
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Organic
            </span>
          )}
          {product.isFresh && (
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Fresh
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <div className="absolute top-3 right-3">
          <button
            onClick={handleFavoriteToggle}
            className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <i
              className={`${isFavorite ? "fas fa-heart text-red-500" : "far fa-heart text-gray-600 dark:text-gray-400"}`}
            ></i>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Link href={`/details?id=${product._id}`}>
            <h3 className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 cursor-pointer">
              {product.name}
            </h3>
          </Link>

          {product.averageRating && (
            <div className="flex items-center text-yellow-400">
              <i className="fas fa-star text-sm"></i>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                {product.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          By {product.farmer?.name || "Unknown Farmer"} •{" "}
          {product.farmer?.location || "Location N/A"}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              ৳{product.price}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              /{product.unit || "kg"}
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Stock: {product.stock}
            {product.unit || "kg"}
          </span>
        </div>

        {showAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || product.stock <= 0}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition"
          >
            {isAddingToCart
              ? "Adding..."
              : product.stock <= 0
                ? "Out of Stock"
                : "Add to Cart"}
          </button>
        )}
      </div>
    </div>
  );
}
