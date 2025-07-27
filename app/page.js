import Image from "next/image";
import Navigation from "./components/Navigation";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navigation />

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
                />
                <select className="px-4 py-4 text-gray-900 border-l border-gray-300 focus:outline-none">
                  <option>All Categories</option>
                  <option>Vegetables</option>
                  <option>Fruits</option>
                  <option>Grains</option>
                  <option>Dairy</option>
                </select>
                <button className="bg-primary-700 hover:bg-primary-800 px-8 py-4 transition">
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
            <div className="group cursor-pointer">
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
            <div className="group cursor-pointer">
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
            <div className="group cursor-pointer">
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
            <div className="group cursor-pointer">
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
            <div className="group cursor-pointer">
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
            <div className="group cursor-pointer">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Product Card 1 - Fresh Tomatoes */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop"
                  alt="Fresh Tomatoes"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Organic
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <button className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <i className="far fa-heart text-gray-600 dark:text-gray-400"></i>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Fresh Tomatoes
                  </h3>
                  <div className="flex items-center text-yellow-400">
                    <i className="fas fa-star text-sm"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      4.8
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  By Rahim's Farm • Sylhet
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      45
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /kg
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: 50kg
                  </span>
                </div>
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product Card 2 - Fresh Carrots */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop"
                  alt="Fresh Carrots"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <button className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <i className="far fa-heart text-gray-600 dark:text-gray-400"></i>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Fresh Carrots
                  </h3>
                  <div className="flex items-center text-yellow-400">
                    <i className="fas fa-star text-sm"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      4.9
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  By Shumi's Garden • Rangpur
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      35
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /kg
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: 30kg
                  </span>
                </div>
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product Card 3 - Fresh Spinach */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop"
                  alt="Fresh Spinach"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Organic
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <button className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <i className="fas fa-heart text-red-500"></i>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Fresh Spinach
                  </h3>
                  <div className="flex items-center text-yellow-400">
                    <i className="fas fa-star text-sm"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      4.7
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  By Sakib's Organics • Dhaka
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      25
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /kg
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: 20kg
                  </span>
                </div>
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product Card 4 - Fresh Broccoli */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop"
                  alt="Fresh Broccoli"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <button className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <i className="far fa-heart text-gray-600 dark:text-gray-400"></i>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Fresh Broccoli
                  </h3>
                  <div className="flex items-center text-yellow-400">
                    <i className="fas fa-star text-sm"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      4.6
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  By Anika's Garden • Chittagong
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      55
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /kg
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: 15kg
                  </span>
                </div>
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product Card 5 - More Broccoli */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop"
                  alt="Fresh Broccoli"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <button className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <i className="far fa-heart text-gray-600 dark:text-gray-400"></i>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Fresh Broccoli
                  </h3>
                  <div className="flex items-center text-yellow-400">
                    <i className="fas fa-star text-sm"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      4.6
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  By Anika's Garden • Chittagong
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      55
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /kg
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: 15kg
                  </span>
                </div>
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product Card 6 - More Broccoli */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop"
                  alt="Fresh Broccoli"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <button className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <i className="far fa-heart text-gray-600 dark:text-gray-400"></i>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Fresh Broccoli
                  </h3>
                  <div className="flex items-center text-yellow-400">
                    <i className="fas fa-star text-sm"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      4.6
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  By Anika's Garden • Chittagong
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      55
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /kg
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: 15kg
                  </span>
                </div>
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product Card 7 - More Carrots */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop"
                  alt="Fresh Carrots"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <button className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <i className="far fa-heart text-gray-600 dark:text-gray-400"></i>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Fresh Carrots
                  </h3>
                  <div className="flex items-center text-yellow-400">
                    <i className="fas fa-star text-sm"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      4.9
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  By Shumi's Garden • Rangpur
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      35
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /kg
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: 30kg
                  </span>
                </div>
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Product Card 8 - More Tomatoes */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop"
                  alt="Fresh Tomatoes"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Organic
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <button className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <i className="far fa-heart text-gray-600 dark:text-gray-400"></i>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Fresh Tomatoes
                  </h3>
                  <div className="flex items-center text-yellow-400">
                    <i className="fas fa-star text-sm"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      4.8
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  By Rahim's Farm • Sylhet
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      45
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /kg
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: 50kg
                  </span>
                </div>
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
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
