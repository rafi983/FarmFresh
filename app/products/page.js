import Navigation from "../components/Navigation";
import Link from "next/link";

export default function Products() {
  return (
    <>
      <Navigation />

      {/* Page Header */}
      <div className="bg-primary-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Fresh Products</h1>
          <p className="text-xl text-primary-100">
            Discover fresh, locally-sourced produce from our trusted farmers
          </p>
        </div>
      </div>

      {/* Filters and Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filters
              </h3>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Category
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Vegetables (45)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Fruits (32)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Grains (18)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Dairy (12)
                    </span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Price Range
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      className="border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Under ৳30
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      className="border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      ৳30 - ৳50
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      className="border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      ৳50 - ৳100
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      className="border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Over ৳100
                    </span>
                  </label>
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Location
                </h4>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                  <option>All Locations</option>
                  <option>Dhaka</option>
                  <option>Chittagong</option>
                  <option>Sylhet</option>
                  <option>Rangpur</option>
                </select>
              </div>

              {/* Organic Filter */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Organic Only
                  </span>
                </label>
              </div>

              <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                Apply Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Sort and View Options */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Showing 1-12 of 48 products
              </p>
              <div className="flex items-center space-x-4">
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                  <option>Sort by: Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest First</option>
                  <option>Rating</option>
                </select>
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
                  <button className="p-2 bg-primary-600 text-white rounded-l-lg">
                    <i className="fas fa-th"></i>
                  </button>
                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg">
                    <i className="fas fa-list"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    By Rahim&apos;s Farm • Sylhet
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        ৳45
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
                    By Shumi&apos;s Garden • Rangpur
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        ৳35
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
                    By Sakib&apos;s Organics • Dhaka
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        ৳25
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
                    By Anika&apos;s Garden • Chittagong
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        ৳55
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

              {/* Product Card 5 - Fresh Lettuce */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop"
                    alt="Fresh Lettuce"
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
                      Fresh Lettuce
                    </h3>
                    <div className="flex items-center text-yellow-400">
                      <i className="fas fa-star text-sm"></i>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                        4.5
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    By Green Valley Farm • Sylhet
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        ৳30
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        /kg
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Stock: 25kg
                    </span>
                  </div>
                  <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Product Card 6 - Fresh Cucumber */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop"
                    alt="Fresh Cucumber"
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
                      Fresh Cucumber
                    </h3>
                    <div className="flex items-center text-yellow-400">
                      <i className="fas fa-star text-sm"></i>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                        4.4
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    By Fresh Fields • Dhaka
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        ৳20
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        /kg
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Stock: 40kg
                    </span>
                  </div>
                  <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                    Add to Cart
                  </button>
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
                      className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      1
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="px-3 py-2 leading-tight text-white bg-primary-600 border border-primary-600 hover:bg-primary-700 hover:text-white"
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
                      className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      4
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
        </div>
      </div>

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
