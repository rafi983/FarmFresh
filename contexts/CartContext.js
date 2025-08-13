"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [recentlyOrderedItems, setRecentlyOrderedItems] = useState([]);
  const [cartInitialized, setCartInitialized] = useState(false);

  // New states for better UX
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState(null); // { type: 'success' | 'error' | 'info', message: string }
  const [addingItemId, setAddingItemId] = useState(null); // Track which item is being added

  // Initialize cart from localStorage immediately
  useEffect(() => {
    const initializeCart = () => {
      try {
        const savedCart = localStorage.getItem("farmfresh-cart");
        if (savedCart) {
          const items = JSON.parse(savedCart);
          setCartItems(items);
          updateCartCount(items);
        }
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      } finally {
        setCartInitialized(true);
      }
    };

    // Only initialize once
    if (!cartInitialized) {
      initializeCart();
    }
  }, []); // Empty dependency array to run only once

  // Handle session-based cart loading
  useEffect(() => {
    if (status === "loading" || !cartInitialized) return;

    if (session?.user) {
      // User is logged in - fetch from server and merge with localStorage
      fetchCartAndMerge();
    }
    // For non-authenticated users, cart is already loaded from localStorage
  }, [session?.user?.id, status, cartInitialized]); // More specific dependencies

  // Helper function to safely store data in localStorage with size management
  const safeLocalStorageSet = (key, data) => {
    try {
      // First, clean and optimize the data
      const cleanedData = data.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        stock: item.stock,
        unit: item.unit,
        image: Array.isArray(item.image) ? item.image[0] : item.image, // Take only first image
        farmerId: item.farmerId,
        farmerName: item.farmerName,
        category: item.category,
      }));

      const dataString = JSON.stringify(cleanedData);

      // Check size before attempting to store (500KB limit for safety)
      if (dataString.length > 512 * 1024) {
        console.warn("Cart data too large, reducing items");
        // Keep only the 20 most recent items
        const reducedData = cleanedData.slice(-20);
        localStorage.setItem(key, JSON.stringify(reducedData));
        return reducedData;
      }

      // Try to store the full dataset
      localStorage.setItem(key, dataString);
      return cleanedData;
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.warn(
          "localStorage quota exceeded, implementing aggressive cleanup",
        );

        // Clear other potentially large items first
        try {
          // Clear any other farmfresh related storage
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("farmfresh-") && key !== "farmfresh-cart") {
              localStorage.removeItem(key);
            }
          });

          // Try minimal cart storage (only 5 most recent items)
          const minimalData = data.slice(-5).map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }));

          localStorage.setItem(key, JSON.stringify(minimalData));
          return minimalData;
        } catch (secondError) {
          console.error("Critical storage error, clearing cart storage");
          localStorage.removeItem(key);
          return [];
        }
      }
      throw error;
    }
  };

  // Save to localStorage whenever cart changes (for both authenticated and non-authenticated users)
  useEffect(() => {
    if (!cartInitialized) return; // Don't save until cart is initialized

    if (cartItems.length > 0) {
      const storedData = safeLocalStorageSet("farmfresh-cart", cartItems);

      // If the stored data was reduced, update the cart state to match
      if (storedData.length < cartItems.length) {
        setCartItems(storedData);
        setCartMessage({
          type: "info",
          message: `Cart was reduced to ${storedData.length} items due to storage limits.`,
        });
      }

      updateCartCount(cartItems);

      // Also save to server if user is authenticated (debounced to prevent excessive calls)
      if (session?.user) {
        const timeoutId = setTimeout(() => saveCart(cartItems), 500);
        return () => clearTimeout(timeoutId);
      }
    } else {
      // Clear localStorage when cart is empty
      try {
        localStorage.removeItem("farmfresh-cart");
      } catch (error) {
        console.error("Error clearing empty cart:", error);
      }
    }
  }, [cartItems, session?.user?.id, cartInitialized]);

  const updateCartCount = (items) => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    setCartCount(count);
  };

  const fetchCartAndMerge = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/cart");

      if (response.ok) {
        const data = await response.json();
        const serverItems = data.items || [];

        // Get current localStorage items
        const localStorageCart = localStorage.getItem("farmfresh-cart");
        let localItems = [];

        if (localStorageCart) {
          try {
            localItems = JSON.parse(localStorageCart);
          } catch (error) {
            console.error("Error parsing localStorage cart:", error);
          }
        }

        // Merge logic: prefer server data, but include local items not on server
        const mergedItems = [...serverItems];

        localItems.forEach((localItem) => {
          const existsOnServer = serverItems.find(
            (serverItem) => serverItem.id === localItem.id,
          );
          if (!existsOnServer) {
            mergedItems.push(localItem);
          }
        });

        setCartItems(mergedItems);

        // Save merged cart back to server if there were local items
        if (
          localItems.length > 0 &&
          mergedItems.length !== serverItems.length
        ) {
          saveCart(mergedItems);
        }
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
      // Check if user is a farmer and prevent them from adding to cart
      if (session?.user?.userType === "farmer") {
        throw new Error(
          "Farmers cannot purchase products. You can only sell your own products on this platform.",
        );
      }

      setAddingToCart(true);
      setAddingItemId(product.id);

      // Stock validation logic
      const currentStock = product.stock || 0;
      const existingCartItem = cartItems.find((item) => item.id === product.id);
      const currentCartQuantity = existingCartItem
        ? existingCartItem.quantity
        : 0;
      const totalRequestedQuantity = currentCartQuantity + quantity;

      // Check if there's enough stock available
      if (totalRequestedQuantity > currentStock) {
        const availableQuantity = Math.max(
          0,
          currentStock - currentCartQuantity,
        );

        if (availableQuantity === 0) {
          throw new Error(
            `${product.name} is out of stock. Cannot add more items to cart.`,
          );
        } else {
          throw new Error(
            `Only ${availableQuantity} ${product.unit || "units"} of ${product.name} available. You already have ${currentCartQuantity} in your cart.`,
          );
        }
      }

      // Check stock against purchase count validation for bundle/kg products
      if (
        product.unit &&
        (product.unit.toLowerCase() === "bundle" ||
          product.unit.toLowerCase() === "kg")
      ) {
        // For bundles and kg products, validate against exact stock numbers
        if (quantity > currentStock) {
          throw new Error(
            `Cannot add ${quantity} ${product.unit}${quantity > 1 ? "s" : ""} of ${product.name}. Only ${currentStock} ${product.unit}${currentStock !== 1 ? "s" : ""} available.`,
          );
        }
      }

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

        setCartMessage({
          type: "success",
          message: `${quantity} ${product.unit || "unit"}${quantity > 1 ? "s" : ""} of ${product.name} added to cart.`,
        });

        return newItems;
      });

      return true; // Return success
    } catch (error) {
      console.error("Error adding to cart:", error);
      setCartMessage({
        type: "error",
        message: error.message || "Error adding item to cart.",
      });
      throw error; // Re-throw to let calling components handle the error
    } finally {
      setAddingToCart(false);
      setAddingItemId(null);
    }
  };

  const updateQuantity = (productId, quantity) => {
    setCartItems((prevItems) => {
      // Find the product to validate stock
      const cartItem = prevItems.find((item) => item.id === productId);
      if (cartItem && quantity > cartItem.stock) {
        setCartMessage({
          type: "error",
          message: `Cannot set quantity to ${quantity}. Only ${cartItem.stock} ${cartItem.unit || "units"} available.`,
        });
        return prevItems; // Return unchanged items
      }

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
    setCartCount(0); // Add this line to reset cart count

    // Also clear localStorage
    try {
      localStorage.removeItem("farmfresh-cart");
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }

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

  // Function to clear cart messages
  const clearCartMessage = () => {
    setCartMessage(null);
  };

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (cartMessage) {
      const timer = setTimeout(() => {
        setCartMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [cartMessage]);

  const value = {
    items: cartItems,
    cartCount,
    loading,
    paymentProcessing,
    recentlyOrderedItems,
    addingToCart,
    cartMessage,
    addingItemId,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearCartAfterPayment,
    getCartTotal,
    getCartItemsCount,
    fetchCart: fetchCartAndMerge,
    clearCartMessage,
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
