import Link from "next/link";
import Footer from "@/components/Footer";

const FarmerProfileView = ({ farmer, farmerProducts }) => (
    <>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{farmer.name}</h1>
                            <p className="text-green-100 mb-4">{farmer.email}</p>
                            <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                    {farmer.location || "Location not specified"}
                </span>
                                <span className="flex items-center">
                  <i className="fas fa-phone mr-1"></i>
                                    {farmer.phone || "Phone not specified"}
                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-green-100 mb-1">Products Available</div>
                            <div className="text-2xl font-bold">{farmerProducts.length}</div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Products from {farmer.name}
                    </h2>

                    {farmerProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {farmerProducts.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-seedling text-2xl text-gray-400"></i>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No Products Available
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                This farmer hasn&apos;t listed any products yet.
                            </p>
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <Link
                        href="/products"
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Browse All Products
                    </Link>
                </div>
            </div>
        </div>
        <Footer />
    </>
);


export default FarmerProfileView
