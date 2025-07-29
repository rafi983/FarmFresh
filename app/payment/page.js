"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function Payment() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items: cartItems, getCartTotal, loading: cartLoading } = useCart();
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    instructions: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
    mobileNumber: "",
    paymentMethod: "card",
    sameAsDelivery: true,
  });

  const [editQuantities, setEditQuantities] = useState({});

  useEffect(() => {
    console.log("Payment - Session status:", status, "Session:", session);

    if (status === "loading") {
      return; // Wait for session to load
    }

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Pre-fill user data if available
      if (session.user) {
        setDeliveryAddress((prev) => ({
          ...prev,
          name: session.user.name || "",
          phone: session.user.phone || "",
        }));
        setPaymentForm((prev) => ({
          ...prev,
          cardName: session.user.name || "",
        }));
      }

      // Initialize edit quantities when cart items are available
      if (cartItems && cartItems.length > 0) {
        const quantities = {};
        cartItems.forEach((item) => {
          quantities[item.id || item._id] = item.quantity;
        });
        setEditQuantities(quantities);
      }

      setLoading(false);
    }
  }, [session, status, router, cartItems]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0 && status === "authenticated") {
      router.push("/cart");
    }
  }, [cartItems, cartLoading, status, router]);

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

  const deliveryFee = 50;
  const serviceFee = 25;
  const subtotal = calculateSubtotal();
  const total = subtotal + deliveryFee + serviceFee;

  const handleEditQuantity = (itemId, newQuantity) => {
    if (newQuantity >= 1) {
      setEditQuantities((prev) => ({
        ...prev,
        [itemId]: newQuantity,
      }));
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (paymentForm.paymentMethod === "card") {
      if (
        !paymentForm.cardNumber ||
        !paymentForm.expiryDate ||
        !paymentForm.cvv ||
        !paymentForm.cardName
      ) {
        alert("Please fill in all required card fields");
        return false;
      }
    } else if (
      paymentForm.paymentMethod === "bkash" ||
      paymentForm.paymentMethod === "nagad"
    ) {
      if (!paymentForm.mobileNumber) {
        alert("Please enter your mobile number");
        return false;
      }
    }
    return true;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Use flexible user ID detection - same as other pages
      const userId =
        session.user.userId ||
        session.user.id ||
        session.user._id ||
        session.user.email;

      console.log("Creating order with userId:", userId);
      console.log("Cart items structure:", cartItems);
      console.log(
        "Cart items farmer info:",
        cartItems.map((item) => ({
          name: item.name,
          farmer: item.farmer,
          farmerId:
            typeof item.farmer === "object"
              ? item.farmer?.id || item.farmer?._id
              : null,
          farmerEmail:
            typeof item.farmer === "object" ? item.farmer?.email : null,
        })),
      );

      // Extract unique farmer information from cart items
      const farmerIds = [];
      const farmerEmails = [];

      cartItems.forEach((item) => {
        const farmerId =
          typeof item.farmer === "object"
            ? item.farmer?.id || item.farmer?._id
            : null;
        const farmerEmail =
          typeof item.farmer === "object" ? item.farmer?.email : null;

        console.log(
          `Item ${item.name} - farmerId: ${farmerId}, farmerEmail: ${farmerEmail}`,
        );

        if (farmerId && !farmerIds.includes(farmerId)) {
          farmerIds.push(farmerId);
        }
        if (farmerEmail && !farmerEmails.includes(farmerEmail)) {
          farmerEmails.push(farmerEmail);
        }
      });

      console.log("Extracted farmerIds:", farmerIds);
      console.log("Extracted farmerEmails:", farmerEmails);

      // Create order with farmer information at both order and item levels
      const orderData = {
        userId: userId,
        customerName: session.user.name || deliveryAddress.name,
        customerEmail: session.user.email,
        customerPhone: deliveryAddress.phone,
        // Add farmer information at order level for filtering
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
        deliveryAddress,
        subtotal,
        deliveryFee,
        serviceFee,
        total,
        paymentMethod: paymentForm.paymentMethod,
        status: "pending", // Start with pending status for farmer workflow
      };

      console.log("Order data being sent:", orderData);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Order created successfully:", data);

        // Clear cart using the same user ID format
        await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, {
          method: "DELETE",
        });

        // Redirect to success page
        router.push(`/success?orderId=${data.orderId}`);
      } else {
        const errorText = await response.text();
        console.error("Order creation failed:", response.status, errorText);
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary-600 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">
            Loading payment details...
          </p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-shopping-cart text-6xl text-gray-400 mb-6"></i>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Your cart is empty
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Add some products to your cart before proceeding to payment
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-primary-600">
                Home
              </Link>
            </li>
            <li>
              <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
            </li>
            <li>
              <Link
                href="/cart"
                className="text-gray-500 hover:text-primary-600"
              >
                Cart
              </Link>
            </li>
            <li>
              <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
            </li>
            <li className="text-gray-900 dark:text-white">Payment</li>
          </ol>
        </nav>
      </div>

      {/* Payment Content */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Order Summary
              </h2>

              {/* Product Details */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => {
                  const quantity =
                    editQuantities[item.id || item._id] || item.quantity;
                  return (
                    <div
                      key={item.id || item._id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <img
                        src={
                          item.images?.[0] ||
                          item.image ||
                          "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=80&h=80&fit=crop"
                        }
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          By{" "}
                          {typeof item.farmer === "object" && item.farmer?.name
                            ? item.farmer.name
                            : typeof item.farmer === "string"
                              ? item.farmer
                              : "Local Farmer"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Quantity: {quantity} {item.unit || "kg"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice((item.price || 0) * quantity)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatPrice(item.price || 0)}/{item.unit || "kg"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Booking Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Booking Date:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Delivery Date:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(
                      Date.now() + 2 * 24 * 60 * 60 * 1000,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Delivery Address:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white text-right">
                    {deliveryAddress.address && deliveryAddress.city
                      ? `${deliveryAddress.address}, ${deliveryAddress.city}`
                      : "To be filled"}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Delivery Fee:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Service Fee:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(serviceFee)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-2">
                  <span>Total:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full mt-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition"
              >
                <i className="fas fa-edit mr-2"></i>Edit Order Details
              </button>
            </div>

            {/* Payment Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Payment Information
              </h2>

              <div className="space-y-6">
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Payment Method
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
                  disabled={processing}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-lg transition duration-200 transform hover:scale-105 ${
                    processing
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {processing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock mr-2"></i>
                      Complete Payment - {formatPrice(total)}
                    </>
                  )}
                </button>

                {/* Security Notice */}
                <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  <i className="fas fa-shield-alt mr-2"></i>
                  Your payment information is secure and encrypted
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Order Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Edit Order Details
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {cartItems.map((item) => (
                <div
                  key={item.id || item._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatPrice(item.price || 0)} each
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleEditQuantity(
                          item.id || item._id,
                          (editQuantities[item.id || item._id] ||
                            item.quantity) - 1,
                        )
                      }
                      disabled={
                        (editQuantities[item.id || item._id] ||
                          item.quantity) <= 1
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center disabled:opacity-50"
                    >
                      <i className="fas fa-minus text-sm"></i>
                    </button>
                    <span className="font-medium min-w-[2rem] text-center">
                      {editQuantities[item.id || item._id] || item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleEditQuantity(
                          item.id || item._id,
                          (editQuantities[item.id || item._id] ||
                            item.quantity) + 1,
                        )
                      }
                      disabled={
                        (editQuantities[item.id || item._id] ||
                          item.quantity) >= (item.stock || 999)
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center disabled:opacity-50"
                    >
                      <i className="fas fa-plus text-sm"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
