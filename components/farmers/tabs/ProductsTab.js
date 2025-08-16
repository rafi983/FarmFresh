"use client";
import Link from "next/link";

export default function ProductsTab({ stats, products, farmerId }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Our Product Categories
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
          We grow a diverse range of fresh produce across{" "}
          {stats.categories?.length || 0} categories.
        </p>
      </div>
      {stats.categories?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {stats.categories.map((category, index) => {
            const categoryProducts = products.filter(
              (p) => p.category === category,
            );
            const avgPrice = categoryProducts.length
              ? (
                  categoryProducts.reduce((s, p) => s + (p.price || 0), 0) /
                  categoryProducts.length
                ).toFixed(2)
              : 0;
            return (
              <div
                key={category + index}
                className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-xl shadow-lg"
              >
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-leaf text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-4">
                  {category}
                </h3>
                <div className="text-center space-y-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    {categoryProducts.length} products
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    Avg: ${avgPrice}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <i className="fas fa-seedling text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No products available yet. Check back soon!
          </p>
        </div>
      )}
      {products.length > 0 && (
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Featured Products
          </h3>
          <div className="space-y-6">
            {products.slice(0, 3).map((product, index) => (
              <div
                key={product._id || index}
                className={`flex ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"} items-center gap-8 bg-gradient-to-r ${index % 3 === 0 ? "from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30" : index % 3 === 1 ? "from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30" : "from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30"} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]`}
              >
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <i className="fas fa-image text-gray-400 text-3xl"></i>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {product.name}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        Category: {product.category}
                      </p>
                      {product.averageRating && (
                        <div className="flex items-center mb-3">
                          <div className="flex text-yellow-400 mr-2">
                            {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className={`fas fa-star text-sm ${i < Math.floor(product.averageRating) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                              ></i>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({product.averageRating}/5)
                          </span>
                        </div>
                      )}
                      {product.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-4 ml-6">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          ${product.price}
                        </div>
                        <div
                          className={`text-sm ${product.stock > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}
                        >
                          {product.stock > 0
                            ? `${product.stock} available`
                            : "Out of stock"}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          className={`px-6 py-3 rounded-lg font-medium transition-all ${product.stock > 0 ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                          disabled={product.stock === 0}
                        >
                          <i className="fas fa-cart-plus mr-2"></i>
                          {product.stock > 0 ? "Add to Cart" : "Sold Out"}
                        </button>
                        <button className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-all">
                          <i className="fas fa-heart"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href={`/farmers/${farmerId}/details`}
              className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <i className="fas fa-store mr-3"></i>View All{" "}
              {stats.totalProducts} Products
              <i className="fas fa-arrow-right ml-3"></i>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
