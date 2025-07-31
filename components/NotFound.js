import Link from "next/link";

const NotFound = ({ responseType }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {responseType === "farmer" ? "Farmer not found" : "Product not found"}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {responseType === "farmer"
          ? "The farmer profile you are looking for could not be found."
          : "The product you are looking for could not be found."}
      </p>
      <Link
        href="/products"
        className="text-primary-600 hover:text-primary-700"
      >
        Browse all products
      </Link>
    </div>
  </div>
);

export default NotFound;
