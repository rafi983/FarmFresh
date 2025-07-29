"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ManageProducts() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("products"); // "products" or "orders"

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
      fetchProducts();
      fetchOrders();
    }
  }, [session, status, router]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  useEffect(() => {
    filterOrders();
  }, [orders, orderSearchTerm, selectedOrderStatus]);

  // Auto-refresh when returning from create page
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user && status === "authenticated") {
        fetchProducts();
        if (activeTab === "orders") {
          fetchOrders();
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [session, status, activeTab]);

  const fetchProducts = async () => {
    try {
      // Get user ID from multiple possible sources
      const userId = session.user.userId || session.user.id || session.user._id;
      const userEmail = session.user.email;

      if (!userId && !userEmail) {
        console.error("No user ID or email found in session");
        setLoading(false);
        return;
      }

      console.log(
        "Session user object:",
        JSON.stringify(session.user, null, 2),
      );
      console.log("Using userId for filtering:", userId);
      console.log("Using userEmail for filtering:", userEmail);

      // Fetch all products and filter by farmer (disable pagination for manage page)
      const response = await fetch("/api/products?limit=1000", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Total products fetched:", data.products.length);

        // Log first few products to see their structure
        if (data.products.length > 0) {
          console.log("Sample products structure:");
          data.products.slice(0, 3).forEach((product, index) => {
            console.log(`Product ${index + 1}:`, {
              name: product.name,
              farmerId: product.farmerId,
              farmerEmail: product.farmerEmail,
              farmer: product.farmer,
              _id: product._id,
            });
          });
        }

        // Filter products that belong to this farmer
        const farmerProducts = data.products.filter((product) => {
          // Primary checks
          const matchesByFarmerId = product.farmerId === userId;
          const matchesByFarmerIdString = product.farmerId === String(userId);
          const matchesByEmail = product.farmerEmail === userEmail;
          const matchesByFarmerObjectEmail =
            product.farmer?.email === userEmail;
          const matchesByFarmerObjectId = product.farmer?.id === userId;

          const isMatch =
            matchesByFarmerId ||
            matchesByFarmerIdString ||
            matchesByEmail ||
            matchesByFarmerObjectEmail ||
            matchesByFarmerObjectId;

          if (isMatch) {
            console.log(`✅ MATCHED Product "${product.name}"`);
          } else {
            // Log why this product didn't match
            console.log(`❌ NO MATCH for "${product.name}":`, {
              productFarmerId: product.farmerId,
              productFarmerEmail: product.farmerEmail,
              expectedUserId: userId,
              expectedEmail: userEmail,
              hasValidFarmerId: !!product.farmerId,
              hasValidFarmerEmail: !!product.farmerEmail,
            });
          }

          return isMatch;
        });

        console.log("Farmer products found:", farmerProducts.length);

        // TEMPORARY: For debugging, let's also show newly created products
        const newlyCreatedProducts = data.products.filter(
          (product) =>
            product.farmerId === userId || product.farmerEmail === userEmail,
        );

        console.log(
          "Newly created products (with farmerId/farmerEmail):",
          newlyCreatedProducts.length,
        );

        if (newlyCreatedProducts.length > 0) {
          console.log(
            "New products found:",
            newlyCreatedProducts.map((p) => ({
              name: p.name,
              farmerId: p.farmerId,
              farmerEmail: p.farmerEmail,
            })),
          );
        }

        setProducts(farmerProducts);
        setFilteredProducts(farmerProducts);
      } else {
        console.error("Failed to fetch products");
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const userId = session.user.userId || session.user.id || session.user._id;
      const userEmail = session.user.email;

      if (!userId && !userEmail) {
        console.error("No user ID or email found in session");
        return;
      }

      // Fetch orders for this farmer using farmerId and farmerEmail parameters
      const params = new URLSearchParams();
      if (userId) params.append("farmerId", userId);
      if (userEmail) params.append("farmerEmail", userEmail);

      const response = await fetch(`/api/orders?${params.toString()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Farmer orders fetched:", data.orders?.length || 0);
        setOrders(data.orders || []);
        setFilteredOrders(data.orders || []);
      } else {
        console.error("Failed to fetch orders");
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, "i");
      filtered = filtered.filter(
        (product) =>
          searchRegex.test(product.name) ||
          searchRegex.test(product.description) ||
          searchRegex.test(product.category),
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) =>
          product.category.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // Apply status filter
    if (selectedStatus) {
      switch (selectedStatus) {
        case "active":
          filtered = filtered.filter(
            (product) => product.stock > 0 && product.status !== "inactive",
          );
          break;
        case "inactive":
          filtered = filtered.filter(
            (product) => product.status === "inactive",
          );
          break;
        case "out-of-stock":
          filtered = filtered.filter((product) => product.stock === 0);
          break;
      }
    }

    setFilteredProducts(filtered);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (orderSearchTerm) {
      const searchRegex = new RegExp(orderSearchTerm, "i");
      filtered = filtered.filter((order) => {
        // Search in order items and customer info
        const orderItemsMatch = order.items?.some(
          (item) =>
            searchRegex.test(item.name) || searchRegex.test(item.productName),
        );
        const customerMatch =
          searchRegex.test(order.customerName) ||
          searchRegex.test(order.customerEmail);
        const statusMatch = searchRegex.test(order.status);
        const orderIdMatch = searchRegex.test(order._id);

        return orderItemsMatch || customerMatch || statusMatch || orderIdMatch;
      });
    }

    // Apply status filter
    if (selectedOrderStatus) {
      filtered = filtered.filter(
        (order) => order.status === selectedOrderStatus,
      );
    }

    setFilteredOrders(filtered);
  };

  const handleStatusToggle = async (productId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setProducts((prev) =>
          prev.map((product) =>
            product._id === productId
              ? { ...product, status: newStatus }
              : product,
          ),
        );
        alert(
          `Product ${newStatus === "active" ? "activated" : "deactivated"} successfully!`,
        );
      } else {
        throw new Error("Failed to update product status");
      }
    } catch (error) {
      console.error("Error updating product status:", error);
      alert("Failed to update product status");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts((prev) =>
          prev.filter((product) => product._id !== productId),
        );
        alert("Product deleted successfully!");
      } else {
        throw new Error("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    await fetchOrders();
    setRefreshing(false);
  };

  const handleCancelOrder = async (orderId) => {
    if (
      !confirm(
        "Are you sure you want to cancel this order? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, status: "cancelled" } : order,
          ),
        );
        alert("Order cancelled successfully!");
        // Refresh orders to get updated data
        fetchOrders();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(`Failed to cancel order: ${error.message}`);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (product) => {
    if (product.status === "inactive") {
      return "bg-red-500 text-white";
    } else if (product.stock === 0) {
      return "bg-orange-500 text-white";
    } else {
      return "bg-green-500 text-white";
    }
  };

  const getStatusText = (product) => {
    if (product.status === "inactive") {
      return "Inactive";
    } else if (product.stock === 0) {
      return "Out of Stock";
    } else {
      return "Active";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary-600 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Manage Products Content */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
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
              <li className="text-gray-900 dark:text-white">Manage Products</li>
            </ol>
          </nav>
        </div>

        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Manage Products
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                You have {products.length} product
                {products.length !== 1 ? "s" : ""} • Showing{" "}
                {filteredProducts.length} after filters
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
              >
                <i
                  className={`fas fa-sync-alt mr-2 ${refreshing ? "fa-spin" : ""}`}
                ></i>
                Refresh
              </button>
              <Link
                href="/create"
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              >
                <i className="fas fa-plus mr-2"></i>
                Add New Product
              </Link>
              <Link
                href="/farmer-orders"
                className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
              >
                <i className="fas fa-clipboard-list mr-2"></i>
                Manage Orders
              </Link>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Grains">Grains</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Honey">Honey</option>
                  <option value="Herbs">Herbs</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                    setSelectedStatus("");
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <i className="fas fa-box-open text-6xl text-gray-400 mb-6"></i>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {products.length === 0
                  ? "No products yet"
                  : "No products match your filters"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {products.length === 0
                  ? "Start by adding your first product to begin selling"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {products.length === 0 && (
                <Link
                  href="/create"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Your First Product
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="relative">
                    <Image
                      src={
                        product.images?.[0] ||
                        product.image ||
                        "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=200&fit=crop"
                      }
                      alt={product.name}
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product)}`}
                      >
                        {getStatusText(product)}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleStatusToggle(product._id, product.status)
                          }
                          className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          title={
                            product.status === "active"
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          <i
                            className={`fas ${product.status === "active" ? "fa-eye-slash" : "fa-eye"} text-gray-600 dark:text-gray-300`}
                          ></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </h3>
                      <div className="flex items-center text-yellow-400">
                        <i className="fas fa-star text-sm"></i>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                          {product.averageRating?.toFixed(1) || "0.0"} (
                          {product.totalRatings || 0})
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {product.category} • Stock: {product.stock}{" "}
                      {product.unit || "kg"}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          /{product.unit || "kg"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Sold: {product.purchaseCount || 0}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Link
                        href={`/edit/${product._id}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </Link>
                      <Link
                        href={`/details?id=${product._id}`}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition"
                      >
                        <i className="fas fa-eye mr-1"></i>
                        View
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Orders Section */}
          <div className="mt-16">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Manage Orders
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab("products")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === "products"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === "orders"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Orders
                </button>
              </div>
            </div>

            {activeTab === "orders" && (
              <>
                {/* Order Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label
                        htmlFor="order-search"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Search
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="order-search"
                          placeholder="Search orders..."
                          value={orderSearchTerm}
                          onChange={(e) => setOrderSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="order-status"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Status
                      </label>
                      <select
                        id="order-status"
                        value={selectedOrderStatus}
                        onChange={(e) => setSelectedOrderStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="canceled">Canceled</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setOrderSearchTerm("");
                          setSelectedOrderStatus("");
                        }}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>

                {/* Orders Table */}
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <i className="fas fa-box-open text-6xl text-gray-400 mb-6"></i>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No orders found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                      There are no orders matching your criteria.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredOrders.map((order) => (
                        <div
                          key={order._id}
                          className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-4">
                                  Order #{order._id.slice(-6)}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    order.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : order.status === "confirmed"
                                        ? "bg-blue-100 text-blue-800"
                                        : order.status === "delivered"
                                          ? "bg-green-100 text-green-800"
                                          : order.status === "cancelled"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {order.status.charAt(0).toUpperCase() +
                                    order.status.slice(1)}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <p>
                                  <span className="font-medium">Customer:</span>{" "}
                                  {order.customerName || "N/A"}
                                </p>
                                <p>
                                  <span className="font-medium">Email:</span>{" "}
                                  {order.customerEmail || "N/A"}
                                </p>
                                <p>
                                  <span className="font-medium">Phone:</span>{" "}
                                  {order.customerPhone || "N/A"}
                                </p>
                                <p>
                                  <span className="font-medium">Total:</span>{" "}
                                  {formatPrice(
                                    order.farmerSubtotal || order.total || 0,
                                  )}
                                </p>
                                <p>
                                  <span className="font-medium">Date:</span>{" "}
                                  {new Date(
                                    order.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 sm:mt-0 sm:ml-6 flex flex-col space-y-2">
                              <Link
                                href={`/bookings?orderId=${order._id}`}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition"
                              >
                                <i className="fas fa-eye mr-1"></i>
                                View Details
                              </Link>
                              {(order.status === "pending" ||
                                order.status === "confirmed") && (
                                <button
                                  onClick={() => handleCancelOrder(order._id)}
                                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
                                >
                                  <i className="fas fa-times mr-1"></i>
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Order Items */}
                          {order.items && order.items.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                Order Items:
                              </h4>
                              <div className="space-y-2">
                                {order.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {item.name || item.productName}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Quantity: {item.quantity}{" "}
                                        {item.unit || "kg"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {formatPrice(
                                          item.price * item.quantity,
                                        )}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatPrice(item.price)}/
                                        {item.unit || "kg"}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
