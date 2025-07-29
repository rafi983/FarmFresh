"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateProduct() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    stock: "",
    unit: "",
    features: [],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Check if user is a farmer
      const userType = session.user.userType || session.user.role || "user";
      if (userType !== "farmer") {
        router.push("/");
        return;
      }
    }
  }, [session, status, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFeatureChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      features: checked
        ? [...prev.features, value]
        : prev.features.filter((feature) => feature !== value),
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert("Product name is required");
      return false;
    }
    if (!formData.category) {
      alert("Category is required");
      return false;
    }
    if (!formData.description.trim()) {
      alert("Description is required");
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert("Valid price is required");
      return false;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      alert("Valid stock quantity is required");
      return false;
    }
    if (!formData.unit) {
      alert("Unit is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Use the same user ID logic as in manage page
      const userId = session.user.userId || session.user.id || session.user._id;
      const userEmail = session.user.email;

      console.log(
        "Creating product with session user:",
        JSON.stringify(session.user, null, 2),
      );
      console.log("Using userId:", userId);
      console.log("Using userEmail:", userEmail);

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        farmerId: userId,
        farmerEmail: userEmail,
        farmer: {
          id: userId,
          email: userEmail,
          name: session.user.name,
        },
        status: "active",
        createdAt: new Date().toISOString(),
      };

      console.log("Creating product with data:", productData);

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Product created successfully:", result);
        alert("Product added successfully!");

        // Reset form
        setFormData({
          name: "",
          category: "",
          description: "",
          price: "",
          stock: "",
          unit: "",
          features: [],
        });

        // Redirect to manage products page
        router.push("/manage");
      } else {
        const errorData = await response.json();
        console.error("Failed to create product:", errorData);
        alert(`Failed to add product: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary-600 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <i className="fas fa-seedling text-white text-xl"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    FarmFresh
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Local Farmer Booking
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                Home
              </Link>
              <Link
                href="/products"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                Products
              </Link>
              <Link
                href="/farmers"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                Farmers
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Add New Product
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter product name"
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Category</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Grains">Grains</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Honey">Honey</option>
                  <option value="Herbs">Herbs</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Describe your product..."
                />
              </div>

              {/* Price and Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Price (৳) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Unit */}
              <div>
                <label
                  htmlFor="unit"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Unit *
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Unit</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="piece">Piece</option>
                  <option value="bunch">Bunch</option>
                  <option value="liter">Liter</option>
                  <option value="ml">Milliliter (ml)</option>
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label
                  htmlFor="images"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Product Images
                </label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  multiple
                  accept="image/*"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Upload up to 5 images (JPG, PNG, WebP)
                </p>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Features
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {["organic", "fresh", "local", "seasonal", "premium"].map(
                    (feature) => (
                      <label key={feature} className="flex items-center">
                        <input
                          type="checkbox"
                          name="features"
                          value={feature}
                          checked={formData.features.includes(feature)}
                          onChange={handleFeatureChange}
                          className="mr-2 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                          {feature}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Adding Product...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Add Product
                    </>
                  )}
                </button>

                <Link
                  href="/manage"
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium text-center transition"
                >
                  <i className="fas fa-list mr-2"></i>
                  Manage Products
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
