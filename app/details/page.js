import Link from "next/link";

export default function ProductDetails() {
  return (
    <>
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <i className="fas fa-seedling text-white text-xl"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    FarmFresh
                  </h1>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400">
                <i className="fas fa-moon dark:hidden"></i>
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
              <Link href="/" className="text-gray-500 hover:text-green-600">
                Home
              </Link>
            </li>
            <li>
              <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
            </li>
            <li>
              <Link
                href="/products"
                className="text-gray-500 hover:text-green-600"
              >
                Products
              </Link>
            </li>
            <li>
              <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
            </li>
            <li className="text-gray-900 dark:text-white">Fresh Tomatoes</li>
          </ol>
        </nav>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <img
                id="mainImage"
                src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&h=600&fit=crop"
                alt="Fresh Tomatoes"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-5 gap-2">
              <button className="aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-green-500">
                <img
                  src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1000&h=1000&fit=crop"
                  alt="Tomatoes 1"
                  className="w-full h-full object-cover"
                />
              </button>
              <button className="aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500">
                <img
                  src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=10000&h=10000&fit=crop"
                  alt="Tomatoes 2"
                  className="w-full h-full object-cover"
                />
              </button>
              <button className="aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500">
                <img
                  src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1000&h=1000&fit=crop"
                  alt="Tomatoes 3"
                  className="w-full h-full object-cover"
                />
              </button>
              <button className="aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500">
                <img
                  src="https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=1000&h=1000&fit=crop"
                  alt="Tomatoes 4"
                  className="w-full h-full object-cover"
                />
              </button>
              <button className="aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500">
                <img
                  src="https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=1000&h=1000&fit=crop"
                  alt="Tomatoes 5"
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                  Organic
                </span>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                  Fresh
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Fresh Tomatoes
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Produced by
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {" "}
                  Rahim's Farm
                </span>
              </p>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="flex text-yellow-400">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  4.8
                </span>
              </div>
              <span className="text-gray-500 dark:text-gray-400">
                (127 reviews)
              </span>
              <button className="text-green-600 dark:text-green-400 hover:underline">
                Write a review
              </button>
            </div>

            {/* Price and Stock */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ৳45
                  </span>
                  <span className="text-lg text-gray-500 dark:text-gray-400">
                    /kg
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Available Stock
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    50 kg
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                <i className="fas fa-map-marker-alt mr-2"></i>
                <span>Sylhet, Bangladesh</span>
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity (kg)
                </label>
                <div className="flex items-center space-x-3">
                  <button className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
                    <i className="fas fa-minus text-sm"></i>
                  </button>
                  <input
                    type="number"
                    defaultValue="1"
                    min="1"
                    max="50"
                    className="w-20 text-center py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <button className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
                    <i className="fas fa-plus text-sm"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg">
                <i className="fas fa-bolt mr-2"></i>
                Buy Now
              </button>
              <button className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition">
                <i className="fas fa-shopping-cart mr-2"></i>
                Add to Cart
              </button>
              <button className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition">
                <i className="far fa-heart mr-2"></i>
                Add to Favorite
              </button>
            </div>

            {/* Farmer Contact */}
            <div className="bg-green-50 dark:bg-green-900 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face"
                  alt="Rahim"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Rahim Ahmed
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Farmer since 2015
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-16">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button className="border-b-2 border-green-500 text-green-600 dark:text-green-400 py-4 px-1 text-sm font-medium">
                Description
              </button>
              <button className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-4 px-1 text-sm font-medium">
                Reviews (127)
              </button>
              <button className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-4 px-1 text-sm font-medium">
                Farmer Info
              </button>
            </nav>
          </div>

          <div className="py-8">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <h3>About This Product</h3>
              <p>
                Our fresh, organic tomatoes are grown with care in the fertile
                soils of Sylhet. These vine-ripened tomatoes are picked at peak
                freshness and delivered within 24 hours of harvest to ensure
                maximum flavor and nutritional value.
              </p>

              <h4>Key Features:</h4>
              <ul>
                <li>100% Organic - No pesticides or chemical fertilizers</li>
                <li>Vine-ripened for optimal taste and nutrition</li>
                <li>Harvested within 24 hours of delivery</li>
                <li>Rich in vitamins C, K, and antioxidants</li>
                <li>Perfect for salads, cooking, and sauces</li>
              </ul>

              <h4>Storage Instructions:</h4>
              <p>
                Store at room temperature for best flavor. Refrigerate only when
                fully ripe to extend shelf life. Use within 5-7 days for optimal
                freshness.
              </p>

              <h4>Nutritional Information (per 100g):</h4>
              <ul>
                <li>Calories: 18</li>
                <li>Vitamin C: 14mg</li>
                <li>Potassium: 237mg</li>
                <li>Folate: 15mcg</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Customer Reviews
            </h2>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition">
              Write a Review
            </button>
          </div>

          {/* Review Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    4.8
                  </span>
                  <div>
                    <div className="flex text-yellow-400 mb-1">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Based on 127 reviews
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm w-8">5★</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
                    95
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm w-8">4★</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: "20%" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
                    25
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm w-8">3★</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: "4%" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
                    5
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm w-8">2★</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: "1%" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
                    1
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm w-8">1★</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: "1%" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
                    1
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Reviews */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face"
                  alt="Sarah"
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Sarah Johnson
                      </h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex text-yellow-400 text-sm">
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          2 days ago
                        </span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Absolutely amazing tomatoes! The taste is incredible - so
                    fresh and flavorful. You can really tell the difference when
                    they're picked ripe and delivered quickly. Will definitely
                    order again!
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <button className="hover:text-green-600 dark:hover:text-green-400">
                      <i className="far fa-thumbs-up mr-1"></i>Helpful (12)
                    </button>
                    <button className="hover:text-green-600 dark:hover:text-green-400">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
                  alt="Mike"
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Mike Chen
                      </h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex text-yellow-400 text-sm">
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="far fa-star"></i>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          1 week ago
                        </span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Great quality tomatoes, very fresh and organic as
                    advertised. Delivery was on time. Only minor issue was that
                    a couple of tomatoes were slightly overripe, but overall
                    very satisfied.
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <button className="hover:text-green-600 dark:hover:text-green-400">
                      <i className="far fa-thumbs-up mr-1"></i>Helpful (8)
                    </button>
                    <button className="hover:text-green-600 dark:hover:text-green-400">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <img
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face"
                  alt="Lisa"
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Lisa Rahman
                      </h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex text-yellow-400 text-sm">
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          2 weeks ago
                        </span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Perfect for making fresh salsa! The tomatoes were juicy,
                    flavorful, and had the perfect texture. Rahim's farm
                    consistently delivers high-quality produce. Highly
                    recommend!
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <button className="hover:text-green-600 dark:hover:text-green-400">
                      <i className="far fa-thumbs-up mr-1"></i>Helpful (15)
                    </button>
                    <button className="hover:text-green-600 dark:hover:text-green-400">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Load More Reviews */}
          <div className="text-center mt-8">
            <button className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition">
              Load More Reviews
            </button>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Related Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Related Product 1 */}
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
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Fresh Carrots
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  By Shumi's Garden
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    ৳35/kg
                  </span>
                  <div className="flex items-center text-yellow-400 text-sm">
                    <i className="fas fa-star"></i>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      4.9
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Product 2 */}
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
                    <i className="far fa-heart text-gray-600 dark:text-gray-400"></i>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Fresh Spinach
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  By Sakib's Organics
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    ৳25/kg
                  </span>
                  <div className="flex items-center text-yellow-400 text-sm">
                    <i className="fas fa-star"></i>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      4.7
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Product 3 */}
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
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Fresh Broccoli
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  By Anika's Garden
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    ৳55/kg
                  </span>
                  <div className="flex items-center text-yellow-400 text-sm">
                    <i className="fas fa-star"></i>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      4.6
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Product 4 */}
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
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Fresh Lettuce
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  By Green Valley Farm
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    ৳30/kg
                  </span>
                  <div className="flex items-center text-yellow-400 text-sm">
                    <i className="fas fa-star"></i>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      4.5
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-500 p-2 rounded-lg">
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
                  <Link href="/create" className="hover:text-white">
                    Add Products
                  </Link>
                </li>
                <li>
                  <Link href="/manage" className="hover:text-white">
                    Manage Listings
                  </Link>
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
