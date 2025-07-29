"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export default function Favorites() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Favorites - Session status:", status, "Session:", session);

    if (status === "loading") {
      return; // Wait for session to load
    }

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      fetchFavorites();
    }
  }, [session, status, router]);

  const fetchFavorites = async () => {
    if (!session?.user) {
      console.log("No session user found in favorites");
      setLoading(false);
      return;
    }

    try {
      // Use consistent user ID format - prioritize userId from session (same as ProductCard)
      const userId =
        session.user.userId ||
        session.user.id ||
        session.user._id ||
        session.user.email;

      if (!userId) {
        console.error("No user ID found in session");
        setLoading(false);
        return;
      }

      console.log("Fetching favorites for userId:", userId);
      console.log("Session user:", session.user);
      const response = await fetch(
        `/api/favorites?userId=${encodeURIComponent(userId)}`,
      );

      console.log("Favorites API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Favorites data received:", data);
        console.log("Number of favorites:", data.favorites?.length || 0);
        setFavorites(data.favorites || []);
      } else {
        console.error("Failed to fetch favorites:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary-600 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your favorites...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-primary-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">
            <i className="fas fa-heart mr-3"></i>
            My Favorites
          </h1>
          <p className="text-primary-100">
            {favorites.length} favorite product
            {favorites.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <i className="fas fa-heart text-6xl text-gray-400 mb-6"></i>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No favorites yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Start adding products to your favorites to see them here
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition"
            >
              <i className="fas fa-shopping-bag mr-2"></i>
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Favorites Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((favorite) => (
                <ProductCard
                  key={favorite._id}
                  product={favorite.product}
                  showAddToCart={true}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-12 text-center space-y-4">
              <Link
                href="/products"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition mr-4"
              >
                <i className="fas fa-plus mr-2"></i>
                Add More Favorites
              </Link>
              <Link
                href="/cart"
                className="inline-block border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white px-8 py-3 rounded-lg font-medium transition"
              >
                <i className="fas fa-shopping-cart mr-2"></i>
                View Cart
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
