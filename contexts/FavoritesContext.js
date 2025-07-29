"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch favorites when session changes
  useEffect(() => {
    if (session?.user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setFavoritesCount(0);
    }
  }, [session]);

  const fetchFavorites = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const userId =
        session.user.userId ||
        session.user.id ||
        session.user._id ||
        session.user.email;

      if (!userId) return;

      const response = await fetch(
        `/api/favorites?userId=${encodeURIComponent(userId)}`,
      );

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
        setFavoritesCount(data.favorites?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (productId) => {
    if (!session?.user) return false;

    try {
      const userId =
        session.user.userId ||
        session.user.id ||
        session.user._id ||
        session.user.email;

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, userId }),
      });

      if (response.ok) {
        await fetchFavorites(); // Refresh favorites
        return true;
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
    }
    return false;
  };

  const removeFromFavorites = async (productId) => {
    if (!session?.user) return false;

    try {
      const userId =
        session.user.userId ||
        session.user.id ||
        session.user._id ||
        session.user.email;

      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, userId }),
      });

      if (response.ok) {
        await fetchFavorites(); // Refresh favorites
        return true;
      }
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
    return false;
  };

  const isProductFavorited = (productId) => {
    return favorites.some((fav) => fav.productId === productId);
  };

  const value = {
    favorites,
    favoritesCount,
    loading,
    addToFavorites,
    removeFromFavorites,
    isProductFavorited,
    refreshFavorites: fetchFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
