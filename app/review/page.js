"use client";
import Link from "next/link";

export default function Review() {
  const handleStarClick = (rating) => {
    const stars = document.querySelectorAll(".star-label i");
    const ratingText = document.getElementById("ratingText");

    stars.forEach((star, index) => {
      if (index < rating) {
        star.className = "fas fa-star";
      } else {
        star.className = "far fa-star";
      }
    });

    const ratingTexts = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };

    ratingText.textContent = `${rating} star${rating > 1 ? "s" : ""} - ${ratingTexts[rating]}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const rating = document.querySelector('input[name="rating"]:checked');
    const comment = document.getElementById("comment").value;

    if (!rating) {
      document.getElementById("ratingError").classList.remove("hidden");
      return;
    }

    if (!comment.trim()) {
      document.getElementById("commentError").classList.remove("hidden");
      return;
    }

    // Hide error messages
    document.getElementById("ratingError").classList.add("hidden");
    document.getElementById("commentError").classList.add("hidden");

    // Submit review logic here
    console.log("Review submitted:", {
      rating: rating.value,
      comment: comment,
    });

    alert("Review submitted successfully!");
    window.history.back();
  };

  return (
    <>
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <i className="fas fa-seedling text-white text-xl"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    FarmFresh
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Local Farmer Booking
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                Home
              </Link>
              <Link
                href="/products"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                Products
              </Link>
              <Link
                href="/farmers"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                Farmers
              </Link>
              <Link
                href="/about"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                About
              </Link>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button className="p-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400">
                <i className="fas fa-moon dark:hidden"></i>
                <i className="fas fa-sun hidden dark:block"></i>
              </button>

              {/* Mobile Menu Button */}
              <button className="md:hidden p-2 text-gray-700 dark:text-gray-300">
                <i className="fas fa-bars"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Review Modal Container */}
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-800">
        {/* Modal Container */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6 relative">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Write a Review
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Star Rating Section */}
            <div>
              <label
                htmlFor="rating"
                className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
              >
                Rate this product
              </label>
              <div className="star-rating flex items-center gap-1 mb-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating}>
                    <input
                      type="radio"
                      id={`star${rating}`}
                      name="rating"
                      value={rating}
                      className="hidden"
                      onChange={() => handleStarClick(rating)}
                    />
                    <label
                      htmlFor={`star${rating}`}
                      title={`${rating} star${rating > 1 ? "s" : ""}`}
                      className="star-label cursor-pointer text-3xl transition-all duration-200 hover:scale-110 text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400"
                    >
                      <i className="far fa-star"></i>
                    </label>
                  </div>
                ))}
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
              <label
                htmlFor="comment"
                className="block mb-1 font-medium text-gray-700 dark:text-gray-300"
              >
                Comment
              </label>
              <textarea
                id="comment"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}
