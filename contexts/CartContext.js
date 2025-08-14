"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true); // Start with loading true to prevent flash
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [recentlyOrderedItems, setRecentlyOrderedItems] = useState([]);
  const [cartInitialized, setCartInitialized] = useState(false);

  // New states for better UX
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState(null); // { type: 'success' | 'error' | 'info', message: string }
  const [addingItemId, setAddingItemId] = useState(null); // Track which item is being added

  // Helper function to extract URL from various image formats
  const extractImageUrl = (imageData) => {
    if (!imageData) return null;

    // Direct string URL
    if (typeof imageData === "string" && imageData.trim()) {
      return imageData.trim();
    }

    // Object with url property
    if (typeof imageData === "object" && imageData.url) {
      return imageData.url;
    }

    // Object with src property
    if (typeof imageData === "object" && imageData.src) {
      return imageData.src;
    }

    // Object with path property
    if (typeof imageData === "object" && imageData.path) {
      return imageData.path;
    }

    return null;
  };

  // Helper function to process cart item images
  const processItemImage = (item) => {
    let productImage = null;

    // Priority 1: Direct image field
    if (item.image) {
      if (Array.isArray(item.image) && item.image.length > 0) {
        productImage = extractImageUrl(item.image[0]);
      } else {
        productImage = extractImageUrl(item.image);
      }
    }

    // Priority 2: images array field
    if (
      !productImage &&
      item.images &&
      Array.isArray(item.images) &&
      item.images.length > 0
    ) {
      productImage = extractImageUrl(item.images[0]);
    }

    // Priority 3: Category-based default images
    if (!productImage && item.category) {
      const categoryImages = {
        Vegetables:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=300&fit=crop",
        Fruits:
          "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&h=300&fit=crop",
        Dairy:
          "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop",
        Herbs:
          "https://images.unsplash.com/photo-1462536943532-57a629f6cc60?w=300&h=300&fit=crop",
        Honey:
          "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop",
        Grains:
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop",
        Spices:
          "https://images.unsplash.com/photo-1596040033229-a9821ebc227d?w=300&h=300&fit=crop",
        Meat: "https://images.unsplash.com/photo-1588347818505-d0e4dfe81f30?w=300&h=300&fit=crop",
        Leafy:
          "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=300&fit=crop",
        Root: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=300&fit=crop",
        Citrus:
          "https://images.unsplash.com/photo-1557800634-7bf3c7e2d5ae?w=300&h=300&fit=crop",
        Berries:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop",
      };

      productImage =
        categoryImages[item.category] || categoryImages["Vegetables"];
    }

    // Priority 4: Ultimate fallback
    if (!productImage) {
      productImage =
        "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&h=300&fit=crop";
    }

    return {
      ...item,
      enrichedImage: productImage,
    };
  };

  // Initialize cart from localStorage immediately
  useEffect(() => {
    const initializeCart = () => {
      console.log("CartContext Debug - Initializing cart from localStorage");
      try {
        const savedCart = localStorage.getItem("farmfresh-cart");
        console.log(
          "CartContext Debug - Saved cart from localStorage:",
          savedCart,
        );

        if (savedCart) {
          const items = JSON.parse(savedCart);
          console.log("CartContext Debug - Parsed items:", items);

          // Process images for all loaded items
          const processedItems = items.map((item) => processItemImage(item));

          setCartItems(processedItems);
          updateCartCount(processedItems);
          console.log(
            "CartContext Debug - Cart initialized with processed items count:",
            processedItems.length,
          );
        } else {
          console.log(
            "CartContext Debug - No saved cart found in localStorage",
          );
        }
      } catch (error) {
        console.error(
          "CartContext Debug - Error loading cart from localStorage:",
          error,
        );
      } finally {
        setCartInitialized(true);
        console.log("CartContext Debug - Cart initialization completed");
      }
    };

    // Only initialize once
    if (!cartInitialized) {
      console.log("CartContext Debug - Starting cart initialization");
      initializeCart();
    }
  }, []); // Empty dependency array to run only once

  // Handle session-based cart loading and set loading to false
  useEffect(() => {
    console.log("CartContext Debug - Session effect triggered", {
      status,
      cartInitialized,
      sessionUserId: session?.user?.id,
    });

    if (status === "loading" || !cartInitialized) return;

    if (session?.user) {
      console.log(
        "CartContext Debug - User is logged in, fetching and merging cart",
      );
      // User is logged in - fetch from server and merge with localStorage
      fetchCartAndMerge();
    } else {
      console.log(
        "CartContext Debug - No user session, using localStorage cart only",
      );
      // For non-authenticated users, set loading to false only here
      setLoading(false);
    }
  }, [session?.user?.id, status, cartInitialized]); // More specific dependencies

  // Helper function to safely store data in localStorage with size management
  const safeLocalStorageSet = (key, data) => {
    try {
      // First, clean and optimize the data - PRESERVE FARMER DATA
      const cleanedData = data.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        stock: item.stock,
        unit: item.unit,
        image: Array.isArray(item.image) ? item.image[0] : item.image, // Take only first image
        images: item.images, // Keep images array too
        category: item.category,
        description: item.description,
        // PRESERVE FARMER DATA - This was missing!
        farmerId: item.farmerId,
        farmerName: item.farmerName,
        farmer: item.farmer, // Keep the full farmer object if it exists
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

          // Try minimal cart storage but still preserve essential farmer data
          const minimalData = data.slice(-5).map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            farmerId: item.farmerId, // Keep farmer ID even in minimal data
            farmerName: item.farmerName, // Keep farmer name
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

        // Process images for all merged items
        const processedItems = mergedItems.map((item) =>
          processItemImage(item),
        );

        setCartItems(processedItems);

        // Save merged cart back to server if there were local items
        if (
          localItems.length > 0 &&
          mergedItems.length !== serverItems.length
        ) {
          saveCart(processedItems);
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
    setLoading(true);
    try {
      // Clear cart items first
      setCartItems([]);
      setCartCount(0); // Explicitly reset cart count

      // Clear localStorage immediately
      try {
        localStorage.removeItem("farmfresh-cart");
      } catch (error) {
        console.error("Error clearing localStorage:", error);
      }

      // Clear server cart if user is authenticated
      if (session?.user) {
        const userId =
          session.user.userId ||
          session.user.id ||
          session.user._id ||
          session.user.email;
        try {
          const response = await fetch(
            `/api/cart?userId=${encodeURIComponent(userId)}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          if (!response.ok) {
            console.error(
              "Failed to clear server cart:",
              response.status,
              response.statusText,
            );
          }
        } catch (error) {
          console.error("Error clearing server cart:", error);
        }
      }

      setCartMessage({
        type: "success",
        message: "Cart cleared successfully",
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      setCartMessage({
        type: "error",
        message: "Failed to clear cart completely",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCartAfterPayment = () => {
    // Store recently ordered items before clearing
    setRecentlyOrderedItems([...cartItems]);

    // Clear cart state
    setCartItems([]);
    setCartCount(0); // Explicitly reset cart count

    // Clear localStorage
    try {
      localStorage.removeItem("farmfresh-cart");
    } catch (error) {
      console.error("Error clearing localStorage after payment:", error);
    }

    setCartMessage({
      type: "success",
      message: "Order placed successfully! Cart cleared.",
    });
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
