"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { use } from "react";
import { useQueryClient } from "@tanstack/react-query";
import globalCache from "@/lib/cache";
import { sessionCache } from "@/lib/cache";

export default function EditProduct({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params); // Fix Next.js 15 params warning
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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

      // Fetch product data for editing
      if (id) {
        fetchProductForEdit(id);
      }
    }
  }, [session, status, router, id]);

  const fetchProductForEdit = async (productId) => {
    try {
      setInitialLoading(true);
      const response = await fetch(`/api/products/${productId}`);

      if (response.ok) {
        const data = await response.json();
        const product = data.product;

        // Pre-populate form with existing product data
        setFormData({
          name: product.name || "",
          category: product.category || "",
          description: product.description || "",
          price: product.price?.toString() || "",
          stock: product.stock?.toString() || "",
          unit: product.unit || "",
          features: product.features || [],
          images: product.images || (product.image ? [product.image] : []),
          farmLocation: product.farmLocation || "",
          harvestDate: product.harvestDate
            ? product.harvestDate.split("T")[0]
            : "",
        });

        // Set image previews if product has images
        if (product.images && product.images.length > 0) {
          setImagePreviews(product.images);
        } else if (product.image) {
          setImagePreviews([product.image]);
        }
      } else {
        console.error("Failed to fetch product for editing");
        alert("Failed to load product data. Redirecting to manage products.");
        router.push("/manage");
      }
    } catch (error) {
      console.error("Error fetching product for edit:", error);
      alert("Error loading product data. Redirecting to manage products.");
      router.push("/manage");
    } finally {
      setInitialLoading(false);
    }
  };

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

    // Check if adding new images would exceed the limit
    const currentImageCount = imagePreviews.length;
    const newImageCount = files.length;
    const totalImages = currentImageCount + newImageCount;

    if (totalImages > 5) {
      alert(
        `You can only have a maximum of 5 images. You currently have ${currentImageCount} images. You can add ${5 - currentImageCount} more.`,
      );
      return;
    }

    // Validate each file
    const validFiles = [];
    const newPreviews = [];
    const newBase64Images = [];

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
      newPreviews.push(URL.createObjectURL(file));

      // Convert image to base64 for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        newBase64Images.push(event.target.result);

        // When all files are processed, append to existing images
        if (newBase64Images.length === validFiles.length) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...newBase64Images], // Append to existing
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    // Append new files and previews to existing ones
    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
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
        updatedAt: new Date().toISOString(),
        // Keep backward compatibility with single image
        image: formData.images[0] || "",
      };

      console.log(
        "🔄 [Edit] Starting product update with optimistic strategy...",
      );
      console.log("📊 [Edit] Product data:", productData);

      // OPTIMISTIC UPDATE: Apply changes to cache immediately (same as bulk update)
      const userIds = {
        userId: session.user.userId || session.user.id || session.user._id,
        userEmail: session.user.email,
      };

      console.log("🔄 [Edit] Applying optimistic cache update...");
      queryClient.setQueryData(
        ["dashboard", userIds.userId, userIds.userEmail],
        (oldData) => {
          if (!oldData) return oldData;

          const updatedProducts = oldData.products.map((product) => {
            return product._id === id || product.id === id
              ? { ...product, ...productData }
              : product;
          });

          console.log("✅ [Edit] Optimistic update applied to dashboard cache");
          return {
            ...oldData,
            products: updatedProducts,
          };
        },
      );

      // Also update other product queries optimistically
      const productsQueryKeys = queryClient.getQueryCache().findAll({
        queryKey: ["products"],
      });

      productsQueryKeys.forEach((query) => {
        queryClient.setQueryData(query.queryKey, (oldData) => {
          if (!oldData?.products) return oldData;

          const updatedProducts = oldData.products.map((product) => {
            return product._id === id || product.id === id
              ? { ...product, ...productData }
              : product;
          });

          return {
            ...oldData,
            products: updatedProducts,
          };
        });
      });

      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const result = await response.json();

        alert("Product updated successfully!");

        // CRITICAL FIX: Only clear API service cache patterns, not all cache
        // This preserves our optimistic updates while preventing stale API data

        try {
          // Clear specific patterns instead of all cache
          globalCache.clearPattern("products");
          globalCache.clearPattern("product");
          globalCache.clearPattern("dashboard");
          globalCache.clearPattern("farmers");

          sessionCache.clearPattern("products");
          sessionCache.clearPattern("product");
          sessionCache.clearPattern("dashboard");
          sessionCache.clearPattern("farmers");

          // Clear browser storage
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("products-cache");
            sessionStorage.removeItem("dashboard-cache");
            sessionStorage.removeItem("farmfresh-products");
            sessionStorage.removeItem("farmfresh-dashboard");
          }
        } catch (cacheError) {
          console.warn("Cache clearing warning:", cacheError);
        }

        // FIXED: Use the same delayed invalidation strategy as bulk update
        setTimeout(async () => {
          // Use gentle invalidation that doesn't immediately refetch (same as bulk update)
          queryClient.invalidateQueries({
            queryKey: ["dashboard", userIds.userId, userIds.userEmail],
            exact: true,
            refetchType: "none", // Don't refetch immediately - keep optimistic updates
          });

          queryClient.invalidateQueries({
            queryKey: ["products"],
            exact: false,
            refetchType: "none", // Don't refetch immediately
          });

          console.log("✅ [Edit] Gentle background invalidation completed");
        }, 5000); // Wait 5 seconds before background sync (same as bulk update)

        // Redirect to manage products page
        router.push("/manage");
      } else {
        const errorData = await response.json();
        console.error("❌ [Edit] Failed to update product:", errorData);

        // Revert optimistic updates on error (same as bulk update)
        console.log(
          "🔄 [Edit] Reverting optimistic updates due to API error...",
        );
        queryClient.invalidateQueries({
          queryKey: ["dashboard", userIds.userId, userIds.userEmail],
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: ["products"],
          exact: false,
        });

        alert(
          `Failed to update product: ${errorData.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("❌ [Edit] Error updating product:", error);

      // Revert optimistic updates on error
      const userIds = {
        userId: session.user.userId || session.user.id || session.user._id,
        userEmail: session.user.email,
      };

      console.log("🔄 [Edit] Reverting optimistic updates due to error...");
      queryClient.invalidateQueries({
        queryKey: ["dashboard", userIds.userId, userIds.userEmail],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: ["products"],
        exact: false,
      });

      alert("Failed to update product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary-600 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">
            Loading product data...
          </p>
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
            <li className="text-gray-900 dark:text-white">Edit Product</li>
          </ol>
        </nav>
      </div>

      {/* Edit Product Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 text-white px-8 py-6">
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-primary-100 mt-2">
              Update your product information
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
                    Upload Images (Max 5 images)
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
                        Click to upload new images
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
                        Current Images ({imagePreviews.length}/5)
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
            <div className="flex space-x-4">
              <Link
                href="/manage"
                className="flex-1 py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <i className="fas fa-times mr-2"></i>
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Updating Product...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Update Product
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
