import Link from "next/link";

export default function Bookings() {
  return (
    <>
      {/* Simplified Navigation for Bookings Page */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="bg-primary-500 p-2 rounded-lg">
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
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
              >
                Home
              </Link>
              <Link
                href="/products"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
              >
                Products
              </Link>
              <Link
                href="/farmers"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
              >
                Farmers
              </Link>
              <Link
                href="/about"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
              >
                About
              </Link>
            </div>

            {/* User Actions - Simplified for Bookings */}
            <div className="flex items-center space-x-4">
              {/* User Menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                    alt="User"
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="hidden sm:block">John Doe</span>
                  <i className="fas fa-chevron-down text-sm"></i>
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
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
            <li className="text-gray-900 dark:text-white">My Orders</li>
          </ol>
        </nav>
      </div>

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Orders
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track and manage your orders
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
              <option>All Orders</option>
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {/* Order 1 - Delivered */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order #FB-2024-001234
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Placed on Dec 20, 2024
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <i className="fas fa-check-circle mr-1"></i>
                    Delivered
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ৳300
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=80&h=80&fit=crop"
                    alt="Fresh Tomatoes"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Fresh Tomatoes
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      By Rahim&apos;s Farm
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quantity: 5 kg • ৳45/kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      ৳225
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Status Timeline */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Order Status
                </h4>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <i className="fas fa-check-circle mr-1"></i>
                    <span>Order Placed</span>
                  </div>
                  <div className="w-8 h-0.5 bg-green-500"></div>
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <i className="fas fa-check-circle mr-1"></i>
                    <span>Confirmed</span>
                  </div>
                  <div className="w-8 h-0.5 bg-green-500"></div>
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <i className="fas fa-check-circle mr-1"></i>
                    <span>Shipped</span>
                  </div>
                  <div className="w-8 h-0.5 bg-green-500"></div>
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <i className="fas fa-check-circle mr-1"></i>
                    <span>Delivered</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 flex flex-wrap gap-3">
                <button className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition">
                  <i className="fas fa-download mr-2"></i>
                  Download Receipt
                </button>
                <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition">
                  <i className="fas fa-star mr-2"></i>
                  Write Review
                </button>
                <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition">
                  <i className="fas fa-redo mr-2"></i>
                  Reorder
                </button>
              </div>
            </div>
          </div>

          {/* Order 2 - Pending */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order #FB-2024-001236
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Placed on Dec 15, 2024
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <i className="fas fa-clock mr-1"></i>
                    Pending
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ৳120
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=80&h=80&fit=crop"
                    alt="Fresh Broccoli"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Fresh Broccoli
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      By Anika&apos;s Garden
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quantity: 2 kg • ৳55/kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      ৳110
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Status Timeline */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Order Status
                </h4>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                    <i className="fas fa-clock mr-1"></i>
                    <span>Order Placed</span>
                  </div>
                  <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center text-gray-400">
                    <i className="fas fa-circle mr-1"></i>
                    <span>Confirmed</span>
                  </div>
                  <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center text-gray-400">
                    <i className="fas fa-circle mr-1"></i>
                    <span>Shipped</span>
                  </div>
                  <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center text-gray-400">
                    <i className="fas fa-circle mr-1"></i>
                    <span>Delivered</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Waiting for farmer confirmation
                </p>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 flex flex-wrap gap-3">
                <button className="flex items-center px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg font-medium transition">
                  <i className="fas fa-times mr-2"></i>
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-12">
          <nav aria-label="Pagination">
            <ul className="inline-flex items-center -space-x-px text-gray-600 dark:text-gray-300">
              <li>
                <a
                  href="#"
                  className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  <i className="fas fa-chevron-left"></i>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="px-3 py-2 leading-tight text-white bg-primary-600 border border-primary-600 hover:bg-primary-700 hover:text-white"
                >
                  1
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  2
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  3
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  <i className="fas fa-chevron-right"></i>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary-500 p-2 rounded-lg">
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
                  <a href="#" className="hover:text-white">
                    Add Products
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Manage Listings
                  </a>
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
