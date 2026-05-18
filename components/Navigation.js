"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useMessaging } from "@/contexts/MessagingContext";
import { useTheme } from "@/contexts/ThemeContext";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navigation() {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { isDarkMode, toggleDarkMode, isLoaded } = useTheme();
  const { favorites } = useFavorites();
  const { cartItems, cartCount } = useCart();
  const { totalUnreadCount } = useMessaging();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [updatedUserName, setUpdatedUserName] = useState(user?.name || "");
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Prevent hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch updated name from the database for farmers
  useEffect(() => {
    async function fetchUpdatedUserName() {
      if (!user?.email || user?.userType !== "farmer") return;

      try {
        console.log("Navigation: Fetching updated name for:", user.email);

        // Fetch the latest farmer data with cache busting
        const response = await fetch(
          `/api/farmers?email=${encodeURIComponent(user.email)}&exactMatch=true&_t=${Date.now()}`,
          {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
            cache: "no-store",
          },
        );

        if (response.ok) {
          const data = await response.json();

          if (data && data.farmers && data.farmers.length > 0) {
            // Find the farmer with the matching email
            const farmer = data.farmers.find((f) => f.email === user.email);
            if (farmer && farmer.name !== user.name) {
              console.log(
                "Navigation: Updating user name from",
                user.name,
                "to",
                farmer.name,
              );
              setUpdatedUserName(farmer.name);

              // Also update the Auth context
              updateUser({
                ...user,
                name: farmer.name,
              });
            }
          }
        }
      } catch (error) {
        console.error("Navigation: Error fetching updated name:", error);
      }
    }

    fetchUpdatedUserName();
  }, [user?.email, user?.userType]);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [pathname]);

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
    "/farmer-orders",
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
    try {
      // Close the user menu first
      setShowUserMenu(false);

      // Sign out from NextAuth and clear context
      await signOut({ redirect: false });
      logout();

      // Navigate client-side to home without hard refresh
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback to client-side navigation
      router.replace("/");
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="bg-primary-500 p-2 rounded-lg">
              <i className="fas fa-seedling text-white text-xl"></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                FarmFresh
              </h1>
              <p className="hidden sm:block text-xs text-gray-600 dark:text-gray-400 truncate">
                Local Farmer Booking
              </p>
            </div>
          </Link>

          {/* Search Bar (conditional) */}
          {shouldShowSearchAndCart && (
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder={getSearchPlaceholder()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links (conditional) */}
          {shouldShowNavLinks && (
            <div className="hidden lg:flex items-center space-x-8">
              <Link
                href="/"
                className={`text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition ${
                  pathname === "/"
                    ? "text-primary-600 dark:text-primary-400"
                    : ""
                }`}
              >
                Home
              </Link>
              <Link
                href="/products"
                className={`text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition ${
                  pathname === "/products"
                    ? "text-primary-600 dark:text-primary-400"
                    : ""
                }`}
              >
                Products
              </Link>
              <Link
                href="/farmers"
                className={`text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition ${
                  pathname === "/farmers"
                    ? "text-primary-600 dark:text-primary-400"
                    : ""
                }`}
              >
                Farmers
              </Link>

              {/* Show different menu items based on user type */}
              {isAuthenticated && user?.userType === "farmer" && (
                <>
                  <Link
                    href="/create"
                    className={`text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition ${
                      pathname === "/create"
                        ? "text-primary-600 dark:text-primary-400"
                        : ""
                    }`}
                  >
                    Add Product
                  </Link>
                  <Link
                    href="/manage"
                    className={`text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition ${
                      pathname === "/manage"
                        ? "text-primary-600 dark:text-primary-400"
                        : ""
                    }`}
                  >
                    Manage Products
                  </Link>
                </>
              )}

              {/* Show My Orders for regular users */}
              {isAuthenticated && user?.userType !== "farmer" && (
                <Link
                  href="/bookings"
                  className={`text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition ${
                    pathname === "/bookings"
                      ? "text-primary-600 dark:text-primary-400"
                      : ""
                  }`}
                >
                  My Orders
                </Link>
              )}

              <Link
                href="/about"
                className={`text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition ${
                  pathname === "/about"
                    ? "text-primary-600 dark:text-primary-400"
                    : ""
                }`}
              >
                About
              </Link>
            </div>
          )}

          {/* Right side icons and user menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Cart and Favorites (only for authenticated users and not on simplified pages) */}
            {shouldShowSearchAndCart && isAuthenticated && (
              <>
                {/* Messages */}
                <Link
                  href="/messages"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition relative"
                  title="Messages"
                >
                  <i className="far fa-envelope text-xl"></i>
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/favorites"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition relative"
                >
                  <i className="far fa-heart text-xl"></i>
                  {favorites.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </Link>
                <Link
                  href="/cart"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition relative"
                >
                  <i className="fas fa-shopping-cart text-xl"></i>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
              title={
                isMounted && isLoaded
                  ? isDarkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                  : "Toggle theme"
              }
            >
              {isMounted && isLoaded ? (
                isDarkMode ? (
                  <i className="fas fa-sun text-xl"></i>
                ) : (
                  <i className="fas fa-moon text-xl"></i>
                )
              ) : (
                <i className="fas fa-moon text-xl"></i>
              )}
            </button>

            {/* User Authentication (conditional) */}
            {shouldShowUserAuth && (
              <>
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
                    >
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <span className="hidden md:block">{user?.name}</span>
                      <i className="fas fa-chevron-down text-sm"></i>
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {user?.email}
                          </p>
                          <p className="text-xs text-primary-600 dark:text-primary-400 capitalize">
                            {user?.userType || "User"}
                          </p>
                        </div>

                        {/* Farmer-specific menu items */}
                        {user?.userType === "farmer" && (
                          <>
                            <Link
                              href="/farmer-orders"
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <i className="fas fa-clipboard-list mr-2"></i>
                              Order Management
                            </Link>
                            <Link
                              href="/create"
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <i className="fas fa-plus mr-2"></i>
                              Add Product
                            </Link>
                            <Link
                              href="/manage"
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <i className="fas fa-cog mr-2"></i>
                              Manage Products
                            </Link>
                          </>
                        )}

                        {/* Regular user menu items */}
                        {user?.userType !== "farmer" && (
                          <>
                            <Link
                              href="/bookings"
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <i className="fas fa-list mr-2"></i>
                              My Orders
                            </Link>
                            <Link
                              href="/analytics"
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <i className="fas fa-chart-bar mr-2"></i>
                              Analytics
                            </Link>
                            <Link
                              href="/cart"
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <i className="fas fa-shopping-cart mr-2"></i>
                              Cart
                            </Link>
                          </>
                        )}

                        {/* Common menu items */}
                        <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                          <Link
                            href="/messages"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <i className="fas fa-envelope mr-2"></i>
                            Messages
                            {totalUnreadCount > 0 && (
                              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center inline-flex">
                                {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
                              </span>
                            )}
                          </Link>
                          <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <i className="fas fa-user mr-2"></i>
                            Profile Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <i className="fas fa-sign-out-alt mr-2"></i>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center space-x-3">
                    <Link
                      href="/login"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden text-gray-700 dark:text-gray-300 w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowMobileMenu((prev) => !prev)}
              aria-label="Toggle mobile menu"
              aria-expanded={showMobileMenu}
            >
              <i className={`fas ${showMobileMenu ? "fa-times" : "fa-bars"} text-xl`}></i>
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4 space-y-4">
            {shouldShowSearchAndCart && (
              <div className="px-1">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder={getSearchPlaceholder()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                  </div>
                </div>
              </div>
            )}

            {shouldShowNavLinks && (
              <div className="flex flex-col gap-1">
                <Link href="/" className="px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Home</Link>
                <Link href="/products" className="px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Products</Link>
                <Link href="/farmers" className="px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Farmers</Link>
                {isAuthenticated && user?.userType === "farmer" && (
                  <>
                    <Link href="/create" className="px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Add Product</Link>
                    <Link href="/manage" className="px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Manage Products</Link>
                  </>
                )}
                {isAuthenticated && user?.userType !== "farmer" && (
                  <Link href="/bookings" className="px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">My Orders</Link>
                )}
                <Link href="/about" className="px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">About</Link>
              </div>
            )}

            {shouldShowSearchAndCart && isAuthenticated && (
              <div className="grid grid-cols-3 gap-2">
                <Link href="/messages" className="px-3 py-2 rounded-lg text-center border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">Messages</Link>
                <Link href="/favorites" className="px-3 py-2 rounded-lg text-center border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">Favorites</Link>
                <Link href="/cart" className="px-3 py-2 rounded-lg text-center border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">Cart</Link>
              </div>
            )}

            {shouldShowUserAuth && !isAuthenticated && (
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/login"
                  className="flex-1 text-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="flex-1 text-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
