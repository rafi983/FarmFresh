import Navigation from "../components/Navigation";
import Link from "next/link";

export default function Cart() {
  return (
    <>
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Shopping Cart</h1>
            <p className="text-xl text-primary-100">
              Review your selected items
            </p>
          </div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Cart Items (3)
                </h2>

                {/* Cart Item */}
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-6 mb-6 last:border-b-0 last:mb-0"
                  >
                    <img
                      src={`https://images.unsplash.com/photo-${item % 2 === 0 ? "1592924357228-91a4daadcfea" : "1619566636858-adf3ef46400b"}?w=100&h=100&fit=crop`}
                      alt="Product"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 ml-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Fresh {item % 2 === 0 ? "Tomatoes" : "Carrots"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        By {item % 2 === 0 ? "Rahim's Farm" : "Shumi's Garden"}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Organic
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded">
                        <button className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                          -
                        </button>
                        <span className="px-3 py-1 border-x border-gray-300 dark:border-gray-600">
                          {item}
                        </span>
                        <button className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          ৳{(40 + item * 10) * item}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ৳{40 + item * 10}/kg
                        </p>
                      </div>
                      <button className="text-red-500 hover:text-red-700 p-2">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ৳210
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Delivery Fee
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ৳50
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Discount
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      -৳20
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        Total
                      </span>
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        ৳240
                      </span>
                    </div>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Promo Code
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-r-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition">
                      Apply
                    </button>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Delivery Information
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    123 Main Street, Dhaka
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <i className="fas fa-clock mr-2"></i>
                    Expected: Tomorrow, 2-4 PM
                  </p>
                </div>

                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium text-lg transition mb-3">
                  Proceed to Checkout
                </button>

                <Link
                  href="/products"
                  className="block w-full text-center py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
