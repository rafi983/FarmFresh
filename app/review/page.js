"use client";
import Link from "next/link";

export default function Review() {
  return (
    <>
      {/* Remove inline navigation - use global Navigation component instead */}

      {/* Review Content */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        {/* Review Modal Container */}
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-800">
          {/* Modal Container */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <h2 className="text-2xl font-semibold mb-4">Write a Review</h2>
            <form className="space-y-4" id="reviewForm">
              {/* Star Rating Section */}
              <div>
                <label
                  htmlFor="rating"
                  className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
                >
                  Rate this product
                </label>
                <div
                  className="star-rating flex items-center gap-1 mb-2"
                  id="starRating"
                >
                  <input
                    type="radio"
                    id="star5"
                    name="rating"
                    value="5"
                    className="hidden"
                  />
                  <label
                    htmlFor="star5"
                    title="5 stars - Excellent"
                    className="star-label cursor-pointer text-3xl transition-all duration-200 hover:scale-110 text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400"
                  >
                    <i className="far fa-star"></i>
                  </label>
                  <input
                    type="radio"
                    id="star4"
                    name="rating"
                    value="4"
                    className="hidden"
                  />
                  <label
                    htmlFor="star4"
                    title="4 stars - Very Good"
                    className="star-label cursor-pointer text-3xl transition-all duration-200 hover:scale-110 text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400"
                  >
                    <i className="far fa-star"></i>
                  </label>
                  <input
                    type="radio"
                    id="star3"
                    name="rating"
                    value="3"
                    className="hidden"
                  />
                  <label
                    htmlFor="star3"
                    title="3 stars - Good"
                    className="star-label cursor-pointer text-3xl transition-all duration-200 hover:scale-110 text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400"
                  >
                    <i className="far fa-star"></i>
                  </label>
                  <input
                    type="radio"
                    id="star2"
                    name="rating"
                    value="2"
                    className="hidden"
                  />
                  <label
                    htmlFor="star2"
                    title="2 stars - Fair"
                    className="star-label cursor-pointer text-3xl transition-all duration-200 hover:scale-110 text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400"
                  >
                    <i className="far fa-star"></i>
                  </label>
                  <input
                    type="radio"
                    id="star1"
                    name="rating"
                    value="1"
                    className="hidden"
                  />
                  <label
                    htmlFor="star1"
                    title="1 star - Poor"
                    className="star-label cursor-pointer text-3xl transition-all duration-200 hover:scale-110 text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400"
                  >
                    <i className="far fa-star"></i>
                  </label>
                </div>
                <p
                  className="text-sm text-gray-600 dark:text-gray-400 mb-1"
                  id="ratingText"
                >
                  Click to rate this product
                </p>
                <p
                  className="text-red-500 text-xs italic hidden"
                  id="ratingError"
                >
                  Please select a rating.
                </p>
              </div>

              {/* Comment Section */}
              <div>
                <label htmlFor="comment" className="block mb-1 font-medium">
                  Comment
                </label>
                <textarea
                  id="comment"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Write your review here..."
                  required
                ></textarea>
                <p
                  className="text-red-500 text-xs italic hidden"
                  id="commentError"
                >
                  Please enter your comment.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-800 dark:hover:bg-green-900 text-white py-2 rounded-md font-semibold transition"
              >
                Submit Review
              </button>
            </form>

            {/* Close Button */}
            <button
              aria-label="Close modal"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.history.back();
                }
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
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
