"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function CreateProduct() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addProduct } = useDashboardData(); // Use the optimistic addProduct function
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    stock: "",
    unit: "",
    features: [],
    images: [],
    farmLocation: "",
    harvestDate: "",
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate number of files
    if (files.length > 5) {
      alert("You can upload a maximum of 5 images");
      return;
    }

    // Validate each file
    const validFiles = [];
    const previews = [];
    const base64Images = [];

    files.forEach((file) => {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image ${file.name} is too large. Maximum size is 5MB`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not a valid image file`);
        return;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));

      // Convert image to base64 for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        base64Images.push(event.target.result);

        // When all files are processed, update state
        if (base64Images.length === validFiles.length) {
          setFormData((prev) => ({
            ...prev,
            images: base64Images,
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    setImageFiles(validFiles);
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newImages = formData.images.filter((_, i) => i !== index);

    setImagePreviews(newPreviews);
    setImageFiles(newFiles);
    setFormData((prev) => ({
      ...prev,
      images: newImages,
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
        updatedAt: new Date().toISOString(),
        // Keep backward compatibility with single image
        image: formData.images[0] || "",
      };

      console.log("Creating product:", productData);

      // Use the addProduct function from hook with optimistic updates
      const result = await addProduct(productData);

      if (!result.success) {
        throw new Error("Failed to create product");
      }

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
        images: [],
        farmLocation: "",
        harvestDate: "",
      });
      setImagePreviews([]);
      setImageFiles([]);

      // Redirect to manage products page
      router.push("/manage");
    } catch (error) {
      console.error("Error creating product:", error);
      alert(`Failed to add product: ${error.message || "Please try again."}`);
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
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-primary-600">
                Home
              </Link>
            </li>
            <li>
              <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
            </li>
            <li>
              <Link
                href="/manage"
                className="text-gray-500 hover:text-primary-600"
              >
                Manage Products
              </Link>
            </li>
            <li>
              <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
            </li>
            <li className="text-gray-900 dark:text-white">Add Product</li>
          </ol>
        </nav>
      </div>

      {/* Add Product Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 text-white px-8 py-6">
            <h1 className="text-3xl font-bold">Add New Product</h1>
            <p className="text-primary-100 mt-2">
              Share your fresh produce with customers
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Fresh Tomatoes"
                  />
                </div>

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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Herbs">Herbs</option>
                    <option value="Honey">Honey</option>
                  </select>
                </div>

                <div className="md:col-span-2">
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Describe your product, growing methods, quality, etc."
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Pricing & Inventory
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Price per Unit (৳) *
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="45.00"
                  />
                </div>

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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Unit</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="piece">Piece</option>
                    <option value="bunch">Bunch</option>
                    <option value="liter">Liter</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="dozen">Dozen</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Available Stock *
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="100"
                  />
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Product Images
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="images"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Upload Images (Max 5 images) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-500 transition">
                    <input
                      type="file"
                      id="images"
                      name="images"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label htmlFor="images" className="cursor-pointer">
                      <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Click to upload images
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        PNG, JPG, WebP up to 5MB each
                      </p>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Selected Images ({imagePreviews.length}/5)
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div
                            key={index}
                            className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
                          >
                            <Image
                              src={preview}
                              alt={`Product Image ${index + 1}`}
                              width={200}
                              height={150}
                              className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 shadow-lg"
                                title="Remove image"
                              >
                                <i className="fas fa-times text-sm"></i>
                              </button>
                            </div>
                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}

                        {/* Add more images placeholder */}
                        {imagePreviews.length < 5 && (
                          <div
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-24 flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors"
                            onClick={() =>
                              document.getElementById("images").click()
                            }
                          >
                            <div className="text-center">
                              <i className="fas fa-plus text-gray-400 text-xl mb-1"></i>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Add More
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Farm Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Farm Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="farmLocation"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Farm Location
                  </label>
                  <input
                    type="text"
                    id="farmLocation"
                    name="farmLocation"
                    value={formData.farmLocation}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Sylhet, Bangladesh"
                  />
                </div>

                <div>
                  <label
                    htmlFor="harvestDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Harvest Date
                  </label>
                  <input
                    type="date"
                    id="harvestDate"
                    name="harvestDate"
                    value={formData.harvestDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Product Features */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Product Features
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "organic",
                  "pesticide-free",
                  "fresh",
                  "non-gmo",
                  "local",
                  "sustainable",
                  "fair-trade",
                  "gluten-free",
                ].map((feature) => (
                  <label
                    key={feature}
                    className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      name="features"
                      value={feature}
                      checked={formData.features.includes(feature)}
                      onChange={handleFeatureChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm capitalize">
                      {feature.replace("-", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-primary-600 text-white hover:bg-primary-700"
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
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}
