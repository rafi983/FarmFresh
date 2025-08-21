"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api-service";
import { useOrderUpdates } from "@/contexts/OrderUpdateContext";
import { useQueryClient } from "@tanstack/react-query";
import { useFarmersData } from "@/hooks/useFarmerData";
import Link from "next/link";
import Footer from "@/components/Footer";
import { safeInsertOrderIntoCache } from "@/lib/order-cache-utils";

export default function Payment() {
  const { data: session, status } = useSession();
  const { updateUser } = useAuth();
  const router = useRouter();
  const {
    items: cartItems,
    loading: cartLoading,
    clearCartAfterPayment,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const queryClient = useQueryClient();
  const { broadcastNewOrder } = useOrderUpdates();

  // Enhanced state management
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [redirectingToSuccess, setRedirectingToSuccess] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [newsletterSubscribe, setNewsletterSubscribe] = useState(false);
  const [paymentProcessingStep, setPaymentProcessingStep] = useState(0);

  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    instructions: "",
    addressType: "home", // home, office, other
    landmark: "",
    alternatePhone: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
    mobileNumber: "",
    paymentMethod: "card",
    sameAsDelivery: true,
    saveCard: false,
    installments: "1",
  });

  const [editQuantities, setEditQuantities] = useState({});
  const [, setRemovedItems] = useState([]);

  // Extract unique farmer IDs from cart items
  const farmerIds = useMemo(() => {
    const ids = cartItems
      .map((item) => {
        if (typeof item.farmer === "object" && item.farmer?._id) {
          return item.farmer._id;
        } else if (item.farmerId) {
          return item.farmerId;
        }
        return null;
      })
      .filter(Boolean);

    return [...new Set(ids)];
  }, [cartItems]);

  // Fetch farmer data dynamically
  const {
    farmers: farmersData,
    loading: farmersLoading,
    getFarmer,
  } = useFarmersData(farmerIds);

  // Enhanced cart items processing with proper farmer name extraction
  const enrichedCartItems = useMemo(() => {
    return cartItems.map((item) => {
      // Extract farmer information with proper loading states
      let farmerName = "Loading...";
      let farmerId = null;

      // Priority 1: Direct farmer object with name
      if (typeof item.farmer === "object" && item.farmer?.name) {
        farmerName = item.farmer.name;
        farmerId = item.farmer._id || item.farmer.id;
      }
      // Priority 2: Direct farmer name string
      else if (typeof item.farmer === "string" && item.farmer.trim()) {
        farmerName = item.farmer;
      }
      // Priority 3: farmerName field (from localStorage simplified data)
      else if (item.farmerName && item.farmerName.trim()) {
        farmerName = item.farmerName;
        farmerId = item.farmerId;
      }
      // Priority 4: farmerId field - get from database
      else if (item.farmerId) {
        farmerId = item.farmerId;

        if (farmersLoading) {
          farmerName = "Loading...";
        } else {
          const farmerData = getFarmer(item.farmerId);
          if (farmerData && farmerData.name) {
            farmerName = farmerData.name;
          } else {
            farmerName = "Unknown Farmer";
          }
        }
      } else {
        farmerName = "Unknown Farmer";
      }

      // Enhanced image handling with better fallbacks
      let productImage = null;

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
      if (!productImage) {
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
        };

        productImage =
          categoryImages[item.category] ||
          categoryImages["Vegetables"] ||
          "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&h=300&fit=crop";
      }

      return {
        ...item,
        enrichedFarmerName: farmerName,
        enrichedFarmerId: farmerId || item.farmerId,
        enrichedImage: productImage,
        quantity: editQuantities[item.id] || item.quantity,
      };
    });
  }, [cartItems, editQuantities, getFarmer, farmersLoading]);

  const previousOrdersSnapshotRef = useRef(null);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Fetch user profile data to get saved address
      const fetchUserProfile = async () => {
        try {
          const response = await fetch("/api/auth/users");
          if (response.ok) {
            const userData = await response.json();
            const currentUser = userData.users?.find(
              (u) => u.email === session.user.email,
            );

            if (currentUser) {
              // Update the user context with complete profile data
              const extendedUserData = {
                ...session.user,
                ...currentUser,
                // Ensure we don't lose session-specific data
                email: session.user.email,
                id: session.user.id || currentUser._id,
              };

              // Update context with extended data (this will also persist to localStorage)
              updateUser(extendedUserData);

              // Populate delivery address with saved profile data
              if (currentUser.address) {
                setDeliveryAddress((prev) => ({
                  ...prev,
                  name: currentUser.name || session.user.name || "",
                  phone: currentUser.phone || session.user.phone || "",
                  address: currentUser.address?.street || "",
                  city: currentUser.address?.city || "",
                  postalCode: currentUser.address?.zipCode || "",
                  // Keep existing fields that aren't in profile
                  instructions: prev.instructions,
                  addressType: prev.addressType,
                  landmark: prev.landmark,
                  alternatePhone: prev.alternatePhone,
                }));
              } else {
                // No saved address, just populate name and phone
                setDeliveryAddress((prev) => ({
                  ...prev,
                  name: currentUser.name || session.user.name || "",
                  phone: currentUser.phone || session.user.phone || "",
                }));
              }
            } else {
              // Fallback to session data if profile not found
              setDeliveryAddress((prev) => ({
                ...prev,
                name: session.user.name || "",
                phone: session.user.phone || "",
              }));
            }
          } else {
            // Fallback to session data if API call fails
            setDeliveryAddress((prev) => ({
              ...prev,
              name: session.user.name || "",
              phone: session.user.phone || "",
            }));
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback to session data on error
          setDeliveryAddress((prev) => ({
            ...prev,
            name: session.user.name || "",
            phone: session.user.phone || "",
          }));
        }
      };

      // Fetch user profile for saved address
      fetchUserProfile();

      setPaymentForm((prev) => ({
        ...prev,
        cardName: session.user.name || "",
      }));

      if (cartItems && cartItems.length > 0) {
        const quantities = {};
        cartItems.forEach((item) => {
          quantities[item.id || item._id] = item.quantity;
        });
        setEditQuantities(quantities);
      }

      // Set default delivery date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDeliveryDate(tomorrow.toISOString().split("T")[0]);

      setLoading(false);
    }
  }, [session, status, router, cartItems]);

  useEffect(() => {
    if (
      !cartLoading &&
      cartItems.length === 0 &&
      status === "authenticated" &&
      !processing &&
      !redirectingToSuccess
    ) {
      const timer = setTimeout(() => {
        if (cartItems.length === 0 && !processing && !redirectingToSuccess) {
          router.push("/cart");
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    cartItems,
    cartLoading,
    status,
    router,
    processing,
    redirectingToSuccess,
  ]);

  // Notification system
  const addNotification = (message, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // Enhanced calculations
  const formatPrice = (price) => {
    const numericPrice =
      typeof price === "number" ? price : parseFloat(price) || 0;
    return `৳${numericPrice.toFixed(0)}`;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const quantity = editQuantities[item.id || item._id] || item.quantity;
      return total + (item.price || 0) * quantity;
    }, 0);
  };

  const deliveryFee =
    selectedDeliveryDate === new Date().toISOString().split("T")[0] ? 100 : 50;
  const serviceFee = 25;
  const subtotal = calculateSubtotal();
  const discountAmount = (subtotal * promoDiscount) / 100;
  const total = subtotal + deliveryFee + serviceFee - discountAmount;

  // Enhanced handlers
  const handleEditQuantity = (itemId, newQuantity) => {
    if (newQuantity >= 1) {
      setEditQuantities((prev) => ({
        ...prev,
        [itemId]: newQuantity,
      }));
      // Update cart context as well
      updateQuantity(itemId, newQuantity);
      addNotification("Quantity updated successfully", "success");
    }
  };

  const handleRemoveItem = (itemId) => {
    if (confirm("Are you sure you want to remove this item from your cart?")) {
      setRemovedItems((prev) => [...prev, itemId]);
      removeFromCart(itemId);
      addNotification("Item removed from cart", "info");
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const applyPromoCode = async () => {
    // Simulate promo code validation
    const validCodes = {
      SAVE10: 10,
      FIRST20: 20,
      WELCOME15: 15,
      FARMER5: 5,
    };

    if (validCodes[promoCode.toUpperCase()]) {
      setPromoDiscount(validCodes[promoCode.toUpperCase()]);
      addNotification(
        `Promo code applied! ${validCodes[promoCode.toUpperCase()]}% discount`,
        "success",
      );
    } else {
      addNotification("Invalid promo code", "error");
    }
  };

  const validateForm = () => {
    // Enhanced validation
    if (
      !deliveryAddress.name ||
      !deliveryAddress.phone ||
      !deliveryAddress.address ||
      !deliveryAddress.city
    ) {
      addNotification(
        "Please fill in all required delivery address fields",
        "error",
      );
      return false;
    }

    if (!selectedDeliveryDate) {
      addNotification("Please select a delivery date", "error");
      return false;
    }

    if (!agreementChecked) {
      addNotification("Please agree to terms and conditions", "error");
      return false;
    }

    if (paymentForm.paymentMethod === "card") {
      if (
        !paymentForm.cardNumber ||
        !paymentForm.expiryDate ||
        !paymentForm.cvv ||
        !paymentForm.cardName
      ) {
        addNotification("Please fill in all required card fields", "error");
        return false;
      }
    } else if (
      paymentForm.paymentMethod === "bkash" ||
      paymentForm.paymentMethod === "nagad"
    ) {
      if (!paymentForm.mobileNumber) {
        addNotification("Please enter your mobile number", "error");
        return false;
      }
    }
    return true;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;
    if (cartItems.length === 0) {
      addNotification("Your cart is empty", "error");
      return;
    }

    setProcessing(true);
    setPaymentProcessingStep(1);
    // Capture existing orders cache snapshot before createOrder invalidates
    if (queryClient && session?.user) {
      const existing = queryClient.getQueryData([
        "orders",
        session.user.userId || session.user.id,
      ]);
      if (existing) previousOrdersSnapshotRef.current = existing;
    }

    try {
      // Simulate multi-step payment processing
      await new Promise((resolve) =>
        setTimeout(() => {
          setPaymentProcessingStep(2);
          resolve();
        }, 1000),
      );

      await new Promise((resolve) =>
        setTimeout(() => {
          setPaymentProcessingStep(3);
          resolve();
        }, 1500),
      );

      await new Promise((resolve) =>
        setTimeout(() => {
          setPaymentProcessingStep(4);
          resolve();
        }, 1000),
      );

      // Add a final step for redirection
      await new Promise((resolve) =>
        setTimeout(() => {
          setPaymentProcessingStep(5);
          resolve();
        }, 800),
      );

      const userId =
        session.user.userId ||
        session.user.id ||
        session.user._id ||
        session.user.email;

      const farmerIds = [];
      const farmerEmails = [];

      cartItems.forEach((item) => {
        const farmerId =
          typeof item.farmer === "object"
            ? item.farmer?.id || item.farmer?._id
            : null;
        const farmerEmail =
          typeof item.farmer === "object" ? item.farmer?.email : null;

        if (farmerId && !farmerIds.includes(farmerId)) {
          farmerIds.push(farmerId);
        }
        if (farmerEmail && !farmerEmails.includes(farmerEmail)) {
          farmerEmails.push(farmerEmail);
        }
      });

      const orderData = {
        userId: userId,
        customerName: session.user.name || deliveryAddress.name,
        customerEmail: session.user.email,
        customerPhone: deliveryAddress.phone,
        farmerIds: farmerIds,
        farmerEmails: farmerEmails,
        items: cartItems.map((item) => ({
          productId: item.id || item._id,
          name: item.name,
          productName: item.name,
          quantity: editQuantities[item.id || item._id] || item.quantity,
          price: item.price || 0,
          unit: item.unit || "kg",
          image: item.image,
          farmerName:
            typeof item.farmer === "object" && item.farmer?.name
              ? item.farmer.name
              : typeof item.farmer === "string"
                ? item.farmer
                : "Local Farmer",
          farmerId:
            typeof item.farmer === "object"
              ? item.farmer?.id || item.farmer?._id
              : null,
          farmerEmail:
            typeof item.farmer === "object" ? item.farmer?.email : null,
        })),
        deliveryAddress: {
          ...deliveryAddress,
          deliveryDate: selectedDeliveryDate,
          timeSlot: selectedTimeSlot,
        },
        orderNotes,
        promoCode: promoCode || null,
        promoDiscount,
        subtotal,
        deliveryFee,
        serviceFee,
        discountAmount,
        total,
        paymentMethod: paymentForm.paymentMethod,
        status: "pending",
        newsletterSubscribe,
      };

      const data = await apiService.createOrder(orderData);
      const orderId = data.orderId || data.order?._id;

      // Prepare full order object for optimistic UI
      const createdOrder = {
        _id: orderId,
        id: orderId,
        userId,
        status: orderData.status || "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: orderData.items,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        serviceFee: orderData.serviceFee,
        total: orderData.total,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        deliveryAddress: orderData.deliveryAddress,
        paymentMethod: orderData.paymentMethod,
        orderNotes: orderData.orderNotes,
      };

      // Optimistically update orders query cache immediately
      if (orderId && queryClient) {
        const cacheKey = ["orders", userId];
        queryClient.setQueryData(cacheKey, (oldData) => {
          const base = oldData || previousOrdersSnapshotRef.current || null;
          return safeInsertOrderIntoCache(base, createdOrder);
        });

        // If we had no previous snapshot (user never visited bookings this session), eagerly fetch full list to avoid showing only new order
        if (!previousOrdersSnapshotRef.current) {
          try {
            const resp = await fetch(
              `/api/orders?userId=${encodeURIComponent(userId)}&limit=1000`,
              { headers: { "Content-Type": "application/json" } },
            );
            if (resp.ok) {
              const full = await resp.json();
              const existingInserted = queryClient.getQueryData(cacheKey);
              const existingArray = existingInserted?.orders || [];
              const merged = [];
              const seen = new Set();
              // Ensure new order stays at top
              [createdOrder, ...full.orders].forEach((o) => {
                const id = o._id || o.id;
                if (!seen.has(id)) {
                  seen.add(id);
                  merged.push(o);
                }
              });
              // Add any other locally cached orders not in full list
              existingArray.forEach((o) => {
                const id = o._id || o.id;
                if (!seen.has(id)) {
                  seen.add(id);
                  merged.push(o);
                }
              });
              queryClient.setQueryData(cacheKey, { orders: merged });
            }
          } catch (e) {
            // swallow
          }
        }
        // Mark query stale to ensure background refetch merges authoritative data
        queryClient.invalidateQueries({
          queryKey: cacheKey,
          refetchType: "inactive",
        });
      }

      // Broadcast via context for any live listeners
      try {
        broadcastNewOrder(data.order || createdOrder);
      } catch {}

      if (orderId) {
        setRedirectingToSuccess(true);

        // Store order data temporarily to pass to success page
        const orderSummary = {
          orderId,
          orderNumber: orderId,
          createdAt: new Date().toISOString(),
          paymentMethod: paymentForm.paymentMethod,
          status: "confirmed",
          deliveryAddress: {
            ...deliveryAddress,
            deliveryDate: selectedDeliveryDate,
            timeSlot: selectedTimeSlot,
          },
          items: cartItems.map((item) => ({
            ...item,
            quantity: editQuantities[item.id || item._id] || item.quantity,
            image: item.enrichedImage || item.image || item.images?.[0],
            farmerName:
              item.enrichedFarmerName || item.farmerName || "Local Farmer",
          })),
          subtotal,
          deliveryFee,
          serviceFee,
          discountAmount,
          total,
          orderNotes,
          promoCode: promoCode || null,
          promoDiscount,
        };

        // Store order data in sessionStorage for immediate access on success page
        try {
          sessionStorage.setItem("pendingOrder", JSON.stringify(orderSummary));
        } catch (e) {
          console.warn("Could not store order in sessionStorage:", e);
        }

        // Navigate to success page first, then clear cart
        router.push(`/success?orderId=${orderId}`);

        // Clear cart AFTER navigation to prevent empty cart page flash
        setTimeout(async () => {
          try {
            await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, {
              method: "DELETE",
            });
            clearCartAfterPayment();
          } catch (cartError) {
            console.error("Error clearing cart:", cartError);
          }
        }, 1000);
      } else {
        addNotification(
          "Order created successfully! Redirecting...",
          "success",
        );
        setTimeout(() => {
          router.push("/");
        }, 100);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      addNotification("Payment failed. Please try again.", "error");
      setProcessing(false);
      setPaymentProcessingStep(0);
    }
  };

  // Get available time slots
  const getTimeSlots = () => {
    const slots = [
      "9:00 AM - 12:00 PM",
      "12:00 PM - 3:00 PM",
      "3:00 PM - 6:00 PM",
      "6:00 PM - 9:00 PM",
    ];
    return slots;
  };

  // Get next 7 days for delivery
  const getDeliveryDates = () => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        isToday: i === 1,
      });
    }
    return dates;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Loading your enhanced payment experience...
          </p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <i className="fas fa-shopping-cart text-6xl text-gray-400 mb-6"></i>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Add some fresh products to your cart before proceeding to payment
            </p>
            <Link
              href="/products"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition transform hover:scale-105"
            >
              <i className="fas fa-leaf mr-2"></i>
              Browse Fresh Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Notification System */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-6 py-4 rounded-lg shadow-lg text-white transform transition-all duration-500 animate-slide-in ${
              notification.type === "success"
                ? "bg-green-600"
                : notification.type === "error"
                  ? "bg-red-600"
                  : notification.type === "warning"
                    ? "bg-yellow-600"
                    : "bg-blue-600"
            }`}
          >
            <div className="flex items-center">
              <i
                className={`fas ${
                  notification.type === "success"
                    ? "fa-check-circle"
                    : notification.type === "error"
                      ? "fa-exclamation-circle"
                      : notification.type === "warning"
                        ? "fa-exclamation-triangle"
                        : "fa-info-circle"
                } mr-2`}
              ></i>
              {notification.message}
            </div>
          </div>
        ))}
      </div>

      {/* Payment Processing Modal */}
      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Processing Payment
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {paymentProcessingStep === 1 && "Validating payment details..."}
                {paymentProcessingStep === 2 && "Contacting payment gateway..."}
                {paymentProcessingStep === 3 && "Securing transaction..."}
                {paymentProcessingStep === 4 && "Finalizing order..."}
                {paymentProcessingStep === 5 &&
                  "Redirecting to success page..."}
              </p>
            </div>

            {/* Processing Steps */}
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= paymentProcessingStep
                      ? "bg-green-600"
                      : "bg-gray-300"
                  } transition-colors duration-300`}
                ></div>
              ))}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please do not close this window or navigate away
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav
            className="flex justify-between items-center"
            aria-label="Breadcrumb"
          >
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-gray-500 hover:text-green-600 transition"
                >
                  <i className="fas fa-home mr-1"></i>Home
                </Link>
              </li>
              <li>
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="text-gray-500 hover:text-green-600 transition"
                >
                  <i className="fas fa-shopping-cart mr-1"></i>Cart
                </Link>
              </li>
              <li>
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
              </li>
              <li className="text-gray-900 dark:text-white font-medium">
                <i className="fas fa-credit-card mr-1"></i>Secure Checkout
              </li>
            </ol>

            {/* Progress Indicator */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center text-green-600">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                  ✓
                </div>
                <span className="text-sm font-medium">Cart</span>
              </div>
              <div className="w-8 h-px bg-green-600"></div>
              <div className="flex items-center text-green-600">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                  2
                </div>
                <span className="text-sm font-medium">Checkout</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center text-gray-400">
                <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                  3
                </div>
                <span className="text-sm">Confirmation</span>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Payment Content */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Your Order
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review your items and proceed with secure payment
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Order Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 h-fit">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  <i className="fas fa-receipt mr-2 text-green-600"></i>
                  Order Summary
                </h2>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {cartItems.length} items
                </span>
              </div>

              {/* Product Details with Enhanced Design */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cartItems.map((item) => {
                  const quantity =
                    editQuantities[item.id || item._id] || item.quantity;
                  return (
                    <div
                      key={item.id || item._id}
                      className="group relative flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      <div className="relative">
                        <img
                          src={
                            item.images?.[0] ||
                            item.image ||
                            "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=80&h=80&fit=crop"
                          }
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover shadow-md"
                        />
                        <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                          {quantity}
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <i className="fas fa-user-tie mr-1"></i>
                          {typeof item.farmer === "object" && item.farmer?.name
                            ? item.farmer.name
                            : typeof item.farmer === "string"
                              ? item.farmer
                              : "Local Farmer"}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {quantity} {item.unit || "kg"}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-sm text-green-600 font-medium">
                            {formatPrice(item.price || 0)}/{item.unit || "kg"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatPrice((item.price || 0) * quantity)}
                        </p>
                        <button
                          onClick={() => setShowEditModal(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 transition opacity-0 group-hover:opacity-100"
                        >
                          <i className="fas fa-edit mr-1"></i>Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo Code Section */}
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <i className="fas fa-tags mr-2 text-green-600"></i>
                  Have a promo code?
                </h4>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={!promoCode}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
                  >
                    Apply
                  </button>
                </div>
                {promoDiscount > 0 && (
                  <div className="mt-3 flex items-center text-green-600">
                    <i className="fas fa-check-circle mr-2"></i>
                    <span className="text-sm font-medium">
                      {promoDiscount}% discount applied!
                    </span>
                  </div>
                )}
              </div>

              {/* Enhanced Delivery Information */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <i className="fas fa-truck mr-2 text-blue-600"></i>
                  Delivery Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Delivery Date:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedDeliveryDate
                        ? new Date(selectedDeliveryDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "Tomorrow"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Time Slot:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedTimeSlot || "12:00 PM - 3:00 PM"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Address:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white text-right max-w-xs">
                      {deliveryAddress.address && deliveryAddress.city
                        ? `${deliveryAddress.address}, ${deliveryAddress.city}`
                        : "Please fill address below"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Price Breakdown */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal ({cartItems.length} items):</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <span>Delivery Fee:</span>
                      {selectedDeliveryDate ===
                        new Date().toISOString().split("T")[0] && (
                        <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                          Same day
                        </span>
                      )}
                    </div>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Service Fee:</span>
                    <span>{formatPrice(serviceFee)}</span>
                  </div>

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({promoDiscount}%):</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                      <span>Total:</span>
                      <span className="text-green-600">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Notes & Additional Information */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mb-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <i className="fas fa-sticky-note mr-2 text-yellow-600"></i>
                  Additional Information
                </h4>

                <div className="space-y-4">
                  {/* Order Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows="3"
                      maxLength="200"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Any special requests or notes for your order..."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {orderNotes.length}/200 characters
                    </p>
                  </div>

                  {/* Newsletter Subscription */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={newsletterSubscribe}
                        onChange={(e) =>
                          setNewsletterSubscribe(e.target.checked)
                        }
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 mt-1"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Subscribe to our newsletter
                        </span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Get updates on fresh products, seasonal offers, and
                          farming tips directly to your inbox.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Terms and Conditions - Required */}
                  <div
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      agreementChecked
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
                    }`}
                  >
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={agreementChecked}
                        onChange={(e) => setAgreementChecked(e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 mt-1"
                        required
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          I agree to the Terms & Conditions *
                          {!agreementChecked && (
                            <i className="fas fa-exclamation-triangle text-red-500 ml-2"></i>
                          )}
                          {agreementChecked && (
                            <i className="fas fa-check-circle text-green-500 ml-2"></i>
                          )}
                        </span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          By checking this box, you agree to our{" "}
                          <Link
                            href="/terms"
                            className="text-green-600 hover:text-green-700 underline font-medium"
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="/privacy"
                            className="text-green-600 hover:text-green-700 underline font-medium"
                          >
                            Privacy Policy
                          </Link>
                          .
                          {!agreementChecked && (
                            <span className="text-red-600 font-medium">
                              {" "}
                              This agreement is required to proceed.
                            </span>
                          )}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Quick Edit Button */}
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition transform hover:scale-105 flex items-center justify-center"
              >
                <i className="fas fa-edit mr-2"></i>
                Edit Order Details
              </button>
            </div>

            {/* Enhanced Payment & Delivery Form */}
            <div className="space-y-6">
              {/* Delivery Address Form */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-map-marker-alt mr-2 text-green-600"></i>
                  Delivery Address
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={deliveryAddress.name}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={deliveryAddress.phone}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="+880 1234 567890"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={deliveryAddress.address}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="House/Building number, Street name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={deliveryAddress.city}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={deliveryAddress.postalCode}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Postal code"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Delivery Instructions
                    </label>
                    <textarea
                      name="instructions"
                      value={deliveryAddress.instructions}
                      onChange={handleAddressChange}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Any special delivery instructions..."
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Scheduling */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>
                  Delivery Schedule
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Choose Delivery Date
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getDeliveryDates().map((date) => (
                        <label
                          key={date.value}
                          className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                            selectedDeliveryDate === date.value
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : "border-gray-300 dark:border-gray-600 hover:border-green-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryDate"
                            value={date.value}
                            checked={selectedDeliveryDate === date.value}
                            onChange={(e) =>
                              setSelectedDeliveryDate(e.target.value)
                            }
                            className="sr-only"
                          />
                          <div className="text-center">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {date.label}
                            </div>
                            {date.isToday && (
                              <div className="text-xs text-orange-600 font-medium">
                                +৳50 express
                              </div>
                            )}
                          </div>
                          {selectedDeliveryDate === date.value && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <i className="fas fa-check text-white text-xs"></i>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Preferred Time Slot
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getTimeSlots().map((slot) => (
                        <label
                          key={slot}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                            selectedTimeSlot === slot
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-300 dark:border-gray-600 hover:border-blue-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="timeSlot"
                            value={slot}
                            checked={selectedTimeSlot === slot}
                            onChange={(e) =>
                              setSelectedTimeSlot(e.target.value)
                            }
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 font-medium text-gray-900 dark:text-white">
                            {slot}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-credit-card mr-2 text-purple-600"></i>
                  Payment Method
                </h3>

                <div className="space-y-6">
                  {/* Payment Method Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Select Payment Method
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentForm.paymentMethod === "card"}
                          onChange={handlePaymentChange}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <div className="ml-3 flex items-center">
                          <i className="fas fa-credit-card text-lg mr-2"></i>
                          <span className="font-medium">Credit/Debit Card</span>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bkash"
                          checked={paymentForm.paymentMethod === "bkash"}
                          onChange={handlePaymentChange}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <div className="ml-3 flex items-center">
                          <i className="fas fa-mobile-alt text-lg mr-2"></i>
                          <span className="font-medium">bKash</span>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="nagad"
                          checked={paymentForm.paymentMethod === "nagad"}
                          onChange={handlePaymentChange}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <div className="ml-3 flex items-center">
                          <i className="fas fa-wallet text-lg mr-2"></i>
                          <span className="font-medium">Nagad</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Card Details */}
                  {paymentForm.paymentMethod === "card" && (
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="cardName"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Name on Card
                        </label>
                        <input
                          type="text"
                          id="cardName"
                          name="cardName"
                          value={paymentForm.cardName}
                          onChange={handlePaymentChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="cardNumber"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Card Number
                        </label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          value={paymentForm.cardNumber}
                          onChange={handlePaymentChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="expiryDate"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            id="expiryDate"
                            name="expiryDate"
                            value={paymentForm.expiryDate}
                            onChange={handlePaymentChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="cvv"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            CVV
                          </label>
                          <input
                            type="password"
                            id="cvv"
                            name="cvv"
                            value={paymentForm.cvv}
                            onChange={handlePaymentChange}
                            maxLength="4"
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile Payment Details */}
                  {(paymentForm.paymentMethod === "bkash" ||
                    paymentForm.paymentMethod === "nagad") && (
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="mobileNumber"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          id="mobileNumber"
                          name="mobileNumber"
                          value={paymentForm.mobileNumber}
                          onChange={handlePaymentChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="+880 1234 567890"
                        />
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          You will be redirected to{" "}
                          {paymentForm.paymentMethod === "bkash"
                            ? "bKash"
                            : "Nagad"}{" "}
                          payment gateway to complete your payment.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Billing Address */}
                  <div>
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        name="sameAsDelivery"
                        checked={paymentForm.sameAsDelivery}
                        onChange={handlePaymentChange}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        Same as delivery address
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitOrder}
                    disabled={processing || !agreementChecked}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-lg transition duration-200 transform ${
                      processing || !agreementChecked
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-green-600 hover:bg-green-700 text-white hover:scale-105"
                    }`}
                  >
                    {processing ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Processing Payment...
                      </>
                    ) : !agreementChecked ? (
                      <>
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Please agree to Terms & Conditions
                      </>
                    ) : (
                      <>
                        <i className="fas fa-lock mr-2"></i>
                        Complete Payment - {formatPrice(total)}
                      </>
                    )}
                  </button>

                  {/* Agreement Reminder */}
                  {!agreementChecked && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <div className="flex items-center text-red-700 dark:text-red-300">
                        <i className="fas fa-info-circle mr-2"></i>
                        <span className="text-sm">
                          You must agree to the Terms & Conditions in the order
                          summary to proceed with payment.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Edit Order Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <i className="fas fa-edit mr-3 text-blue-600"></i>
                Edit Order Details
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-6">
                {cartItems.map((item) => {
                  const quantity =
                    editQuantities[item.id || item._id] || item.quantity;
                  const itemTotal = (item.price || 0) * quantity;

                  return (
                    <div
                      key={item.id || item._id}
                      className="group relative bg-gray-50 dark:bg-gray-700 rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id || item._id)}
                        className="absolute top-4 right-4 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove item"
                      >
                        <i className="fas fa-trash text-sm"></i>
                      </button>

                      <div className="flex items-start space-x-6">
                        {/* Product Image */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={
                              item.images?.[0] ||
                              item.image ||
                              "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=120&h=120&fit=crop"
                            }
                            alt={item.name}
                            className="w-24 h-24 rounded-xl object-cover shadow-md"
                          />
                          <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                            {quantity}
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {item.name}
                          </h4>

                          <div className="space-y-2 text-sm">
                            <p className="text-gray-600 dark:text-gray-400 flex items-center">
                              <i className="fas fa-user-tie mr-2"></i>
                              Farmer:{" "}
                              {typeof item.farmer === "object" &&
                              item.farmer?.name
                                ? item.farmer.name
                                : typeof item.farmer === "string"
                                  ? item.farmer
                                  : "Local Farmer"}
                            </p>

                            <p className="text-gray-600 dark:text-gray-400 flex items-center">
                              <i className="fas fa-tag mr-2"></i>
                              Unit Price: {formatPrice(
                                item.price || 0,
                              )} per {item.unit || "kg"}
                            </p>

                            {item.description && (
                              <p className="text-gray-600 dark:text-gray-400 flex items-start">
                                <i className="fas fa-info-circle mr-2 mt-0.5"></i>
                                {item.description.length > 100
                                  ? `${item.description.substring(0, 100)}...`
                                  : item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls & Price */}
                        <div className="flex flex-col items-end space-y-4">
                          {/* Price Display */}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatPrice(itemTotal)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {quantity} × {formatPrice(item.price || 0)}
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
                            <button
                              onClick={() =>
                                handleEditQuantity(
                                  item.id || item._id,
                                  Math.max(1, quantity - 1),
                                )
                              }
                              disabled={quantity <= 1}
                              className="w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
                            >
                              <i className="fas fa-minus"></i>
                            </button>

                            <div className="text-center min-w-[3rem]">
                              <div className="text-xl font-bold text-gray-900 dark:text-white">
                                {quantity}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {item.unit || "kg"}
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                handleEditQuantity(
                                  item.id || item._id,
                                  quantity + 1,
                                )
                              }
                              disabled={quantity >= (item.stock || 999)}
                              className="w-10 h-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
                            >
                              <i className="fas fa-plus"></i>
                            </button>
                          </div>

                          {/* Stock Status */}
                          {item.stock && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                              {item.stock} {item.unit || "kg"} available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                        <div className="flex space-x-2">
                          {[1, 2, 5, 10].map((preset) => (
                            <button
                              key={preset}
                              onClick={() =>
                                handleEditQuantity(item.id || item._id, preset)
                              }
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
                            >
                              {preset} {item.unit || "kg"}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id || item._id)}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center transition"
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-600 p-6 bg-gray-50 dark:bg-gray-700">
              {/* Updated Total */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  Updated Subtotal:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(calculateSubtotal())}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 font-medium transition"
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setShowEditModal(false);
                    addNotification("Order updated successfully!", "success");
                  }}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition transform hover:scale-105"
                >
                  <i className="fas fa-check mr-2"></i>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
