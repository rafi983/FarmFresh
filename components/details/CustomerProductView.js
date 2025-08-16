// filepath: components/details/CustomerProductView.js
"use client";
import Link from "next/link";
import Image from "next/image";
import StarRating from "@/components/StarRating";
import EnhancedReviewModal from "@/components/EnhancedReviewModal";
import ReviewSection from "@/components/details/ReviewSection";

export default function CustomerProductView({
  product,
  productId,
  imageData,
  selectedImage,
  setSelectedImage,
  quantity,
  setQuantity,
  handleBuyNow,
  handleAddToCart,
  handleFavoriteToggle,
  isAddingToCart,
  isFavorite,
  activeTab,
  setActiveTab,
  session,
  reviews,
  hasPurchasedProduct,
  hasReviewedProduct,
  userExistingReview,
  checkingPurchase,
  showReviewForm,
  setShowReviewForm,
  editingReview,
  setEditingReview,
  reviewForm,
  setReviewForm,
  handleEnhancedReviewSubmit,
  isSubmitting,
  isUpdating,
  hasMoreReviews,
  loadMoreReviews,
  handleDeleteReview,
  relatedProducts,
  formatPrice,
  TAB_OPTIONS,
  DEFAULT_REVIEW_FORM,
  isDeletingReview,
}) {
  if (!product) return null;

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <Link href="/" className="hover:text-primary-600">
              Home
            </Link>
          </li>
          <li>
            <i className="fas fa-chevron-right text-xs"></i>
          </li>
          <li>
            <Link href="/products" className="hover:text-primary-600">
              Products
            </Link>
          </li>
          <li>
            <i className="fas fa-chevron-right text-xs"></i>
          </li>
          <li>
            <span className="text-gray-900 dark:text-white">
              {product.name}
            </span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={
                imageData.allImages[selectedImage] || "/placeholder-image.jpg"
              }
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-full object-cover"
            />
          </div>
          {imageData.allImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {imageData.allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${selectedImage === index ? "border-primary-500" : "border-gray-300 dark:border-gray-600"}`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm font-medium">
              {product.category}
            </span>
            {product.isOrganic && (
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                Organic
              </span>
            )}
            {product.isFresh && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                Fresh
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {product.name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Produced by{" "}
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                {product.farmer?.farmName ||
                  product.farmer?.name ||
                  "Unknown Farmer"}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {(() => {
              const actualReviewCount = reviews?.length || 0;
              let displayRating = product.averageRating || 0;
              if (
                actualReviewCount > 0 &&
                (!product.averageRating || product.averageRating === 0)
              ) {
                const totalRating = reviews.reduce(
                  (sum, r) => sum + (r.rating || 0),
                  0,
                );
                displayRating = totalRating / actualReviewCount;
              }
              return (
                <>
                  <StarRating rating={displayRating} showValue={true} />
                  <span className="text-gray-500 dark:text-gray-400">
                    ({actualReviewCount} reviews)
                  </span>
                </>
              );
            })()}
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {formatPrice(product.price)}
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-400">
                  /{product.unit || "kg"}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Available Stock
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {product.stock} {product.unit || "kg"}
                </p>
              </div>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
              <i className="fas fa-map-marker-alt mr-2"></i>
              <span>
                {product.farmer?.location || "Location not specified"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity ({product.unit || "kg"})
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={session?.user?.userType === "farmer"}
                className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <i className="fas fa-minus"></i>
              </button>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                disabled={session?.user?.userType === "farmer"}
                className="w-20 text-center py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              />
              <button
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                disabled={session?.user?.userType === "farmer"}
                className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            {session?.user?.userType === "farmer" && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                <i className="fas fa-info-circle mr-1"></i>
                Farmers can only view product details, not purchase
              </p>
            )}
          </div>

          <div className="space-y-3">
            {session?.user?.userType === "farmer" ? (
              <>
                <Link
                  href="/create"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <i className="fas fa-plus mr-2"></i> Add Product
                </Link>
                <Link
                  href="/manage"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <i className="fas fa-cog mr-2"></i> Manage Orders
                </Link>
                <Link
                  href="/farmer-orders"
                  className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition flex items-center justify-center"
                >
                  <i className="fas fa-clipboard-list mr-2"></i> View My Orders
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={handleBuyNow}
                  disabled={
                    product.stock <= 0 || session?.user?.userType === "farmer"
                  }
                  className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400"
                >
                  <i className="fas fa-bolt mr-2"></i> Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={
                    isAddingToCart ||
                    product.stock <= 0 ||
                    session?.user?.userType === "farmer"
                  }
                  className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition disabled:bg-gray-400"
                >
                  <i className="fas fa-shopping-cart mr-2"></i>{" "}
                  {isAddingToCart ? "Adding..." : "Add to Cart"}
                </button>
                <button
                  onClick={handleFavoriteToggle}
                  className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-medium transition"
                >
                  <i
                    className={`${isFavorite ? "fas" : "far"} fa-heart mr-2 ${isFavorite ? "text-red-500" : ""}`}
                  ></i>
                  Add to Favorite
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-16">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {TAB_OPTIONS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          {activeTab === "description" && (
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-xl font-semibold mb-4">
                Product Description
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {product.description ||
                  "No description available for this product."}
              </p>
              {product.features && product.features.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium mb-3">Key Features</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {product.features.map((feature, index) => (
                      <li
                        key={index}
                        className="text-gray-600 dark:text-gray-400"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "nutrition" && (
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-xl font-semibold mb-6">
                Nutritional Information
              </h3>
              {product.nutritionalInformation ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  {typeof product.nutritionalInformation === "string" ? (
                    <p className="text-gray-600 dark:text-gray-400">
                      {product.nutritionalInformation}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(product.nutritionalInformation).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium">
                              {key.charAt(0).toUpperCase() + key.slice(1)}:
                            </span>
                            <span>{value}</span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-apple-alt text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600 dark:text-gray-400">
                    Nutritional information is not available for this product.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "storage" && (
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-xl font-semibold mb-6">
                Storage Instructions
              </h3>
              {product.storageInstructions ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    {product.storageInstructions}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-warehouse text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600 dark:text-gray-400">
                    Storage instructions are not available for this product.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <ReviewSection
              product={product}
              reviews={reviews}
              session={session}
              hasPurchasedProduct={hasPurchasedProduct}
              hasReviewedProduct={hasReviewedProduct}
              userExistingReview={userExistingReview}
              checkingPurchase={checkingPurchase}
              showReviewForm={showReviewForm}
              setShowReviewForm={setShowReviewForm}
              editingReview={editingReview}
              setEditingReview={setEditingReview}
              reviewForm={reviewForm}
              setReviewForm={setReviewForm}
              handleEnhancedReviewSubmit={handleEnhancedReviewSubmit}
              isSubmitting={isSubmitting}
              isUpdating={isUpdating}
              hasMoreReviews={hasMoreReviews}
              loadMoreReviews={loadMoreReviews}
              handleDeleteReview={handleDeleteReview}
              isDeletingReview={isDeletingReview}
              DEFAULT_REVIEW_FORM={DEFAULT_REVIEW_FORM}
            />
          )}

          {activeTab === "farmer" && (
            <div>
              <h3 className="text-xl font-semibold mb-6">About the Farmer</h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user text-2xl text-primary-600 dark:text-primary-400"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {product.farmer?.farmName ||
                        product.farmer?.name ||
                        "Farm Name"}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {product.farmer?.email || "Farmer contact not available"}
                    </p>
                    {product.farmer?.location && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        <span>{product.farmer.location}</span>
                      </div>
                    )}
                    {product.farmer?.phone && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                        <i className="fas fa-phone mr-2"></i>
                        <span>{product.farmer.phone}</span>
                      </div>
                    )}
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {product.farmer?.description ||
                        "A dedicated farmer committed to providing fresh, quality produce to the community."}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        href={`/details?id=${product.farmerId || product.farmer?.id}`}
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <i className="fas fa-external-link-alt mr-2"></i>
                        View All Products from this Farmer
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-4 shadow-lg">
              <i className="fas fa-box-open text-2xl text-white"></i>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Related Products
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover similar high-quality products from our trusted farmers.
            </p>
            <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <i className="fas fa-leaf text-green-500"></i>
              <span>{relatedProducts.length} products found</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {relatedProducts.map((relatedProduct) => (
              <div
                key={relatedProduct._id}
                className="group transform transition-all duration-300 hover:-translate-y-2"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-600 overflow-hidden">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={
                        relatedProduct.image ||
                        relatedProduct.images?.[0] ||
                        "/placeholder-image.jpg"
                      }
                      alt={relatedProduct.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Link
                        href={`/details?id=${relatedProduct._id}`}
                        className="bg-white text-gray-900 px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-3">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {relatedProduct.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        by{" "}
                        {relatedProduct.farmer?.name ||
                          relatedProduct.farmer?.farmName ||
                          "Unknown Farmer"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 mb-3">
                      <StarRating
                        rating={relatedProduct.averageRating || 0}
                        size="sm"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (
                        {relatedProduct.reviewCount ||
                          relatedProduct.totalReviews ||
                          0}
                        )
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                          {formatPrice(relatedProduct.price || 0)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          /{relatedProduct.unit || "kg"}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-right">
                        {(relatedProduct.stock || 0) > 0 ? (
                          <span className="text-green-600 dark:text-green-400">
                            {relatedProduct.stock} {relatedProduct.unit || "kg"}{" "}
                            left
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">
                            Out of stock
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/details?id=${relatedProduct._id}`}
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 text-center block group-hover:shadow-lg"
                    >
                      <i className="fas fa-eye mr-2"></i> View Product
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Looking for more products?
              </p>
              <Link
                href="/products"
                className="inline-flex items-center bg-gray-700 hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl"
              >
                <i className="fas fa-shopping-bag mr-2"></i> Browse All Products{" "}
                <i className="fas fa-arrow-right ml-2"></i>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
