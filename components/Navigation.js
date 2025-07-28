"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();

  // Pages that should have simplified navigation (no search/cart)
  const simplifiedPages = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/cart",
    "/create",
    "/manage",
    "/payment",
    "/bookings",
    "/review",
  ];

  // Details page gets minimal navigation (only logo + dark mode)
  const isDetailsPage = pathname === "/details";
  const isFarmersPage = pathname === "/farmers";
  const shouldShowSearchAndCart =
    !simplifiedPages.includes(pathname) && !isDetailsPage;
  const shouldShowNavLinks = !isDetailsPage;
  const shouldShowUserAuth = !isDetailsPage;

  // Different search placeholders based on page
  const getSearchPlaceholder = () => {
    if (isFarmersPage) {
      return "Search farmers...";
    }
    return "Search products...";
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    logout();
    setShowUserMenu(false);
  };

  return (
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
                {/* Hide subtitle on details page to match static version */}
                {!isDetailsPage && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Local Farmer Booking
                  </p>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Hide on details page */}
          {shouldShowNavLinks && (
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
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search - Show on main pages and farmers page */}
            {shouldShowSearchAndCart && (
              <div className="hidden sm:block relative">
                <input
                  type="text"
                  placeholder={getSearchPlaceholder()}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
            )}

            {/* Cart - Only show on main pages, not on farmers page */}
            {shouldShowSearchAndCart && !isFarmersPage && (
              <button className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                <i className="fas fa-shopping-cart text-xl"></i>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>
            )}

            {/* User Menu - Hide on details page */}
            {shouldShowUserAuth && isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                    {user?.name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                  <span className="hidden sm:block">
                    {user?.name || user?.email}
                  </span>
                  <i className="fas fa-chevron-down text-sm"></i>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/bookings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Bookings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              shouldShowUserAuth && (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Sign up
                  </Link>
                </div>
              )
            )}

            {/* Dark Mode Toggle - Always show */}
            <button className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              <i className="fas fa-moon text-lg dark:hidden"></i>
              {/*<i className="fas fa-sun text-lg hidden dark:block"></i>*/}
            </button>

            {/* Mobile Menu Button - Hide on details page */}
            {shouldShowNavLinks && (
              <button className="md:hidden p-2 text-gray-700 dark:text-gray-300">
                <i className="fas fa-bars text-xl"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
