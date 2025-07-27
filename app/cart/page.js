import Link from "next/link";

export default function Cart() {
  return (
    <>
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
          <div className="max-w-4xl mx-auto">
            {/* Cart Items */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Shopping Cart (3 items)
                </h2>
                <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                  <i className="fas fa-trash mr-1"></i>
                  Clear Cart
                </button>
              </div>

              {/* Cart Items List */}
              <div className="space-y-4 mb-8">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                        Organic • Available
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Unit Price: ৳{40 + item * 10}/kg
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                        <button className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                          <i className="fas fa-minus text-sm"></i>
                        </button>
                        <span className="px-4 py-2 border-x border-gray-300 dark:border-gray-600 min-w-[60px] text-center">
                          {item} kg
                        </span>
                        <button className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                          <i className="fas fa-plus text-sm"></i>
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right min-w-[80px]">
                        <p className="font-bold text-lg text-gray-900 dark:text-white">
                          ৳{(40 + item * 10) * item}
                        </p>
                      </div>

                      {/* Remove Item */}
                      <button className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900 rounded transition">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  {/* Cart Total */}
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      ৳210
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <Link
                      href="/products"
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition"
                    >
                      <i className="fas fa-arrow-left mr-2"></i>
                      Continue Shopping
                    </Link>
                    <Link
                      href="/payment"
                      className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition transform hover:scale-105"
                    >
                      Proceed to Checkout
                      <i className="fas fa-arrow-right ml-2"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Cart Information */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="text-green-500 text-2xl mb-2">
                  <i className="fas fa-truck"></i>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Free Delivery
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  On orders over ৳500
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="text-blue-500 text-2xl mb-2">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Secure Payment
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  100% secure transactions
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="text-orange-500 text-2xl mb-2">
                  <i className="fas fa-undo"></i>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Easy Returns
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  7-day return policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
