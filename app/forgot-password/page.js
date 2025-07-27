import Link from "next/link";

export default function ForgotPassword() {
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
              </button>

              {/* Mobile Menu Button */}
              <button className="md:hidden p-2 text-gray-700 dark:text-gray-300">
                <i className="fas fa-bars"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Forgot Password Form Section */}
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-500 p-3 rounded-full">
                <i className="fas fa-key text-white text-2xl"></i>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reset your password
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your
              password
            </p>
          </div>

          {/* Reset Password Form */}
          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl">
            <form className="space-y-6" action="#" method="POST">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="john@example.com"
                  />
                  <i className="fas fa-envelope absolute left-3 top-3.5 text-gray-400"></i>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition duration-200 transform hover:scale-105"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Send Reset Link
              </button>

              {/* Success Message (hidden by default) */}
              <div className="hidden bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <div className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-3"></i>
                  <div>
                    <h4 className="text-green-800 dark:text-green-200 font-medium">
                      Email sent successfully!
                    </h4>
                    <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                      Check your email for password reset instructions.
                    </p>
                  </div>
                </div>
              </div>
            </form>

            {/* Back to Login Link */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to login
              </Link>
            </div>
          </div>

          {/* Additional Help */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              <i className="fas fa-info-circle mr-2"></i>
              Need help?
            </h3>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p>
                • Check your spam/junk folder if you don't receive the email
              </p>
              <p>• Make sure you entered the correct email address</p>
              <p>• Contact support if you continue having issues</p>
            </div>
            <div className="mt-3">
              <a
                href="#"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                Contact Support
              </a>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 font-medium"
              >
                Create account
              </Link>
            </p>
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
                  <h3 className="text-lg font-bold">FarmFresh</h3>
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
                  <a href="#" className="hover:text-white">
                    Farmer Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Sell Products
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Resources
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
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
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
