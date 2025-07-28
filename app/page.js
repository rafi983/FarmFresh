"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const categoryOptions = [
    "All Categories",
    "Vegetables",
    "Fruits",
    "Grains",
    "Dairy",
    "Honey",
    "Herbs",
  ];

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCategories();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch("/api/products?featured=true&limit=8");
      if (response.ok) {
        const data = await response.json();
        setFeaturedProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching featured products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        // Get unique categories from products
        const uniqueCategories = [
          ...new Set(data.products.map((p) => p.category)),
        ];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (selectedCategory !== "All Categories")
      params.append("category", selectedCategory);
    router.push(`/products?${params.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCategoryClick = (category) => {
    router.push(`/products?category=${encodeURIComponent(category)}`);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Fresh from Farm to Your Table
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
              Connect directly with local farmers and get the freshest produce
              delivered to your doorstep
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex rounded-lg overflow-hidden shadow-lg">
                <input
                  type="text"
                  placeholder="Search for vegetables, fruits, farmers..."
                  className="flex-1 px-6 py-4 text-gray-900 text-lg focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <select
                  className="px-4 py-4 text-gray-900 border-l border-gray-300 focus:outline-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSearch}
                  className="bg-primary-700 hover:bg-primary-800 px-8 py-4 transition"
                >
                  <i className="fas fa-search text-xl"></i>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-green-200">Local Farmers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">2000+</div>
                <div className="text-green-200">Fresh Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">10k+</div>
                <div className="text-green-200">Happy Customers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover fresh, locally-sourced produce across various categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div
              className="group cursor-pointer"
              onClick={() => handleCategoryClick("Vegetables")}
            >
              <div className="bg-green-100 dark:bg-green-900 rounded-2xl p-6 text-center group-hover:bg-green-200 dark:group-hover:bg-green-800 transition">
                <i className="fas fa-carrot text-3xl text-green-600 dark:text-green-400 mb-3"></i>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Vegetables
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  150+ items
                </p>
              </div>
            </div>
            <div
              className="group cursor-pointer"
              onClick={() => handleCategoryClick("Fruits")}
            >
              <div className="bg-red-100 dark:bg-red-900 rounded-2xl p-6 text-center group-hover:bg-red-200 dark:group-hover:bg-red-800 transition">
                <i className="fas fa-apple-alt text-3xl text-red-600 dark:text-red-400 mb-3"></i>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Fruits
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  80+ items
                </p>
              </div>
            </div>
            <div
              className="group cursor-pointer"
              onClick={() => handleCategoryClick("Grains")}
            >
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-2xl p-6 text-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800 transition">
                <i className="fas fa-seedling text-3xl text-yellow-600 dark:text-yellow-400 mb-3"></i>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Grains
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  45+ items
                </p>
              </div>
            </div>
            <div
              className="group cursor-pointer"
              onClick={() => handleCategoryClick("Dairy")}
            >
              <div className="bg-blue-100 dark:bg-blue-900 rounded-2xl p-6 text-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition">
                <i className="fas fa-cheese text-3xl text-blue-600 dark:text-blue-400 mb-3"></i>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Dairy
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  25+ items
                </p>
              </div>
            </div>
            <div
              className="group cursor-pointer"
              onClick={() => handleCategoryClick("Honey")}
            >
              <div className="bg-purple-100 dark:bg-purple-900 rounded-2xl p-6 text-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition">
                <i className="fas fa-jar text-3xl text-purple-600 dark:text-purple-400 mb-3"></i>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Honey
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  15+ items
                </p>
              </div>
            </div>
            <div
              className="group cursor-pointer"
              onClick={() => handleCategoryClick("Herbs")}
            >
              <div className="bg-orange-100 dark:bg-orange-900 rounded-2xl p-6 text-center group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition">
                <i className="fas fa-leaf text-3xl text-orange-600 dark:text-orange-400 mb-3"></i>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Herbs
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  30+ items
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Featured Products
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Fresh picks from our local farmers
              </p>
            </div>
            <Link
              href="/products"
              className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300"
            >
              View All <i className="fas fa-arrow-right ml-1"></i>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden animate-pulse"
                >
                  <div className="w-full h-48 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-3 w-3/4"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-1/2"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {featuredProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No featured products available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose FarmFresh?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We connect you directly with local farmers for the freshest
              produce
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 dark:bg-primary-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-truck text-2xl text-primary-600 dark:text-primary-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Fast Delivery
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Fresh produce delivered within 24 hours of harvest
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 dark:bg-primary-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-2xl text-primary-600 dark:text-primary-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Quality Guaranteed
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                100% organic and pesticide-free produce
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 dark:bg-primary-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-handshake text-2xl text-primary-600 dark:text-primary-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Support Local
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Direct support to local farmers and communities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-primary-100 mb-8">
            Get notified about new farmers, seasonal produce, and special offers
          </p>

          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button className="bg-primary-800 hover:bg-primary-900 text-white px-6 py-3 rounded-r-lg font-medium transition">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
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
