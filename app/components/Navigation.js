import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
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
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#"
              className="text-primary-600 dark:text-primary-400 font-medium"
            >
              Home
            </a>
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

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden sm:block relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>

            {/* Cart */}
            <button className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              <i className="fas fa-shopping-cart text-xl"></i>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </button>

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
              <i className="fas fa-moon text-lg"></i>
            </button>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-gray-700 dark:text-gray-300">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
