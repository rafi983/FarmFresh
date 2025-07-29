"use client";
import Link from "next/link";

export default function Success() {
  const downloadReceipt = () => {
    // This would integrate with a PDF generation library
    alert(
      "PDF receipt download functionality will be implemented with a PDF library like jsPDF or server-side PDF generation.",
    );
  };

  const copyTransactionId = () => {
    const transactionId = "TXN-FB-20241220-001234";
    navigator.clipboard.writeText(transactionId).then(() => {
      alert("Transaction ID copied to clipboard!");
    });
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Success Icon and Message */}
        <div className="text-center mb-12">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900 mb-6">
            <i className="fas fa-check text-4xl text-green-600 dark:text-green-400"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Thank you for your order
          </p>
          <p className="text-gray-500 dark:text-gray-500">
            Order #FB-2024-001234
          </p>
        </div>

        {/* Email Confirmation Notice */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fas fa-envelope text-blue-600 dark:text-blue-400 mr-3"></i>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Email Confirmation Sent
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                We've sent your order confirmation and receipt to your email
                address.
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Order Details
            </h2>

            {/* Product */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <img
                src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=80&h=80&fit=crop"
                alt="Fresh Tomatoes"
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Fresh Tomatoes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  By Rahim's Farm
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quantity: 5 kg
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  ৳225
                </p>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Delivery Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Delivery Date:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    Dec 22, 2024
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Delivery Time:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    10:00 AM - 12:00 PM
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Address:
                  </span>
                  <span className="text-gray-900 dark:text-white text-right">
                    123 Main St, Dhaka 1000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Payment Summary
            </h2>

            {/* Payment Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal:
                </span>
                <span className="text-gray-900 dark:text-white">৳225</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Delivery Fee:
                </span>
                <span className="text-gray-900 dark:text-white">৳50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Service Fee:
                </span>
                <span className="text-gray-900 dark:text-white">৳25</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total Paid:</span>
                  <span>৳300</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Payment Method
              </h3>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <i className="fas fa-credit-card text-lg text-gray-600 dark:text-gray-400"></i>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Visa ending in 1234
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Paid on Dec 20, 2024
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction ID */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Transaction ID
                  </p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">
                    TXN-FB-20241220-001234
                  </p>
                </div>
                <button
                  onClick={copyTransactionId}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={downloadReceipt}
            className="flex items-center justify-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            <i className="fas fa-download mr-2"></i>
            Download Receipt (PDF)
          </button>
          <Link
            href="/bookings"
            className="flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition"
          >
            <i className="fas fa-list mr-2"></i>
            View All Orders
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center px-8 py-3 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition"
          >
            <i className="fas fa-home mr-2"></i>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-500 p-2 rounded-lg">
                  <i className="fas fa-seedling text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold">FarmFresh</h3>
                  <p className="text-sm text-gray-400">Local Farmer Booking</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Connecting communities with fresh, local produce directly from
                farmers.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/" className="hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-white">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/farmers" className="hover:text-white">
                    Farmers
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Farmers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/register" className="hover:text-white">
                    Join as Farmer
                  </Link>
                </li>
                <li>
                  <Link href="/create" className="hover:text-white">
                    Add Products
                  </Link>
                </li>
                <li>
                  <Link href="/manage" className="hover:text-white">
                    Manage Listings
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Farmer Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2025 FarmFresh - Local Farmer Booking. All rights reserved
              by LWS.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
