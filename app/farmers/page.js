import Navigation from "../components/Navigation";
import Link from "next/link";

export default function Farmers() {
  return (
    <>
      <Navigation />

      {/* Page Header */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Meet Our Farmers</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Discover the passionate farmers who grow fresh, organic produce with
            care and dedication
          </p>
        </div>
      </div>

      {/* Farmers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              500+
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Active Farmers
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              50+
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Districts Covered
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              2000+
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Products Available
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              95%
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Organic Certified
            </div>
          </div>
        </div>

        {/* Farmers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Farmer Card 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face"
                alt="Rahim Ahmed"
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <i className="fas fa-certificate mr-1"></i>Certified
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Rahim Ahmed
                </h3>
                <div className="flex items-center text-yellow-400">
                  <i className="fas fa-star"></i>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    4.8
                  </span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                <i className="fas fa-map-marker-alt mr-2"></i>Sylhet, Bangladesh
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Specializes in organic vegetables and has been farming for over
                15 years. Known for premium tomatoes and leafy greens.
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Farm Size:</span> 5 acres
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Products:</span> 12
                </div>
              </div>
              <div className="flex space-x-2 mb-4">
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs">
                  Vegetables
                </span>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                  Organic
                </span>
              </div>
              <div className="flex space-x-3">
                <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  View Products
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <i className="fas fa-phone"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Farmer Card 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=300&fit=crop&crop=face"
                alt="Shumi Rahman"
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <i className="fas fa-certificate mr-1"></i>Certified
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Shumi Rahman
                </h3>
                <div className="flex items-center text-yellow-400">
                  <i className="fas fa-star"></i>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    4.9
                  </span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                <i className="fas fa-map-marker-alt mr-2"></i>Rangpur,
                Bangladesh
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Expert in root vegetables and herbs. Uses traditional farming
                methods combined with modern organic practices.
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Farm Size:</span> 8 acres
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Products:</span> 18
                </div>
              </div>
              <div className="flex space-x-2 mb-4">
                <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-xs">
                  Root Vegetables
                </span>
                <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-xs">
                  Herbs
                </span>
              </div>
              <div className="flex space-x-3">
                <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  View Products
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <i className="fas fa-phone"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Farmer Card 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=300&fit=crop&crop=face"
                alt="Sakib Hassan"
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <i className="fas fa-certificate mr-1"></i>Certified
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Sakib Hassan
                </h3>
                <div className="flex items-center text-yellow-400">
                  <i className="fas fa-star"></i>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    4.7
                  </span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                <i className="fas fa-map-marker-alt mr-2"></i>Dhaka, Bangladesh
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Focuses on leafy greens and microgreens. Pioneer in urban
                farming techniques and hydroponic systems.
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Farm Size:</span> 3 acres
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Products:</span> 15
                </div>
              </div>
              <div className="flex space-x-2 mb-4">
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs">
                  Leafy Greens
                </span>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                  Hydroponic
                </span>
              </div>
              <div className="flex space-x-3">
                <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  View Products
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <i className="fas fa-phone"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Farmer Card 4 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop&crop=face"
                alt="Anika Begum"
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <i className="fas fa-certificate mr-1"></i>Certified
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Anika Begum
                </h3>
                <div className="flex items-center text-yellow-400">
                  <i className="fas fa-star"></i>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    4.6
                  </span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                <i className="fas fa-map-marker-alt mr-2"></i>Chittagong,
                Bangladesh
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Specializes in cruciferous vegetables and seasonal fruits. Known
                for sustainable farming practices.
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Farm Size:</span> 6 acres
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Products:</span> 20
                </div>
              </div>
              <div className="flex space-x-2 mb-4">
                <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-xs">
                  Cruciferous
                </span>
                <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs">
                  Fruits
                </span>
              </div>
              <div className="flex space-x-3">
                <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  View Products
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <i className="fas fa-phone"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Farmer Card 5 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop&crop=face"
                alt="Karim Uddin"
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <i className="fas fa-certificate mr-1"></i>Certified
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Karim Uddin
                </h3>
                <div className="flex items-center text-yellow-400">
                  <i className="fas fa-star"></i>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    4.5
                  </span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                <i className="fas fa-map-marker-alt mr-2"></i>Rajshahi,
                Bangladesh
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Expert in grain production and legumes. Uses crop rotation and
                natural pest control methods.
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Farm Size:</span> 12 acres
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Products:</span> 8
                </div>
              </div>
              <div className="flex space-x-2 mb-4">
                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-xs">
                  Grains
                </span>
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs">
                  Legumes
                </span>
              </div>
              <div className="flex space-x-3">
                <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  View Products
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <i className="fas fa-phone"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Farmer Card 6 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&crop=face"
                alt="Tariq Ali"
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <i className="fas fa-certificate mr-1"></i>Certified
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tariq Ali
                </h3>
                <div className="flex items-center text-yellow-400">
                  <i className="fas fa-star"></i>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    4.9
                  </span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                <i className="fas fa-map-marker-alt mr-2"></i>Barisal,
                Bangladesh
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Multi-crop farmer specializing in tropical fruits and spices.
                Practices permaculture and biodiversity farming.
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Farm Size:</span> 10 acres
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Products:</span> 25
                </div>
              </div>
              <div className="flex space-x-2 mb-4">
                <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs">
                  Tropical Fruits
                </span>
                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-xs">
                  Spices
                </span>
              </div>
              <div className="flex space-x-3">
                <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition">
                  View Products
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <i className="fas fa-phone"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition">
            Load More Farmers
          </button>
        </div>
      </div>

      {/* Join as Farmer CTA */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Want to Join Our Farmer Community?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Share your fresh produce with thousands of customers and grow your
            business
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Join as Farmer
          </Link>
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
