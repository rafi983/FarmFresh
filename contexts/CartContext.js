"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { data: session } = useSession();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [recentlyOrderedItems, setRecentlyOrderedItems] = useState([]);

  // Fetch cart when session changes
  useEffect(() => {
    if (session?.user) {
      fetchCart();
    } else {
      // Load from localStorage for non-authenticated users
      const savedCart = localStorage.getItem("farmfresh-cart");
      if (savedCart) {
        try {
          const items = JSON.parse(savedCart);
          setCartItems(items);
          updateCartCount(items);
        } catch (error) {
          console.error("Error loading cart from localStorage:", error);
        }
      }
    }
  }, [session]);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (!session?.user) {
      localStorage.setItem("farmfresh-cart", JSON.stringify(cartItems));
    }
    updateCartCount(cartItems);
  }, [cartItems, session]);

  const updateCartCount = (items) => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    setCartCount(count);
  };

  const fetchCart = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      // Remove the Authorization header since NextAuth uses cookies
      const response = await fetch("/api/cart");

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
      } else {
        console.error(
          "Failed to fetch cart:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async (items) => {
    if (!session?.user) return;

    try {
      // Remove the Authorization header since NextAuth uses cookies
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        console.error(
          "Failed to save cart:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    try {
      setCartItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.id === product.id);
        let newItems;

        if (existingItem) {
          newItems = prevItems.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        } else {
          newItems = [...prevItems, { ...product, quantity }];
        }

        if (session?.user) {
          saveCart(newItems);
        }

        return newItems;
      });

      return true; // Return success
    } catch (error) {
      console.error("Error adding to cart:", error);
      return false; // Return failure
    }
  };

  const updateQuantity = (productId, quantity) => {
    setCartItems((prevItems) => {
      const newItems = prevItems
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item,
        )
        .filter((item) => item.quantity > 0);

      if (session?.user) {
        saveCart(newItems);
      }

      return newItems;
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== productId);

      if (session?.user) {
        saveCart(newItems);
      }

      return newItems;
    });
  };

  const clearCart = async () => {
    setCartItems([]);

    if (session?.user) {
      try {
        await fetch("/api/cart", {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    }
  };

  const clearCartAfterPayment = async () => {
    // Store current cart items for display purposes
    setRecentlyOrderedItems([...cartItems]);
    setPaymentProcessing(true);

    // Clear the cart
    await clearCart();

    // After a delay, reset the payment processing state
    setTimeout(() => {
      setPaymentProcessing(false);
      setRecentlyOrderedItems([]);
    }, 5000); // 5 seconds delay
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const getCartItemsCount = () => {
    return cartCount;
  };

  const value = {
    items: cartItems,
    cartCount,
    loading,
    paymentProcessing,
    recentlyOrderedItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearCartAfterPayment,
    getCartTotal,
    getCartItemsCount,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
