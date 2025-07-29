"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function FarmerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State management
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [productsPerPage, setProductsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSort, setSelectedSort] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  // Authentication and authorization
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const userType = session.user.userType || session.user.role || "user";
      if (userType !== "farmer") {
        router.push("/");
        return;
      }
      initializeDashboard();
    }
  }, [session, status, router]);

  const initializeDashboard = useCallback(async () => {
    if (!session?.user) return;

    setLoading(true);
    await Promise.all([fetchProducts(), fetchOrders()]);
    setLoading(false);
  }, [session?.user]);

  const fetchProducts = useCallback(async () => {
    if (!session?.user) return;

    try {
      const userId = session.user.userId || session.user.id || session.user._id;
      const userEmail = session.user.email;

      if (!userId && !userEmail) {
        console.error("No user ID or email found in session");
        return;
      }

      const response = await fetch("/api/products?limit=1000", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const farmerProducts = data.products.filter((product) => {
          return (
            product.farmerId === userId ||
            product.farmerId === String(userId) ||
            product.farmerEmail === userEmail ||
            product.farmer?.email === userEmail ||
            product.farmer?.id === userId
          );
        });

        setProducts(farmerProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, [session?.user]);

  const fetchOrders = useCallback(async () => {
    if (!session?.user) return;

    try {
      const userId = session.user.userId || session.user.id || session.user._id;
      const userEmail = session.user.email;

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
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }, [session?.user]);

  // Calculate analytics whenever products or orders change
  const calculatedAnalytics = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter(
      (p) => p.stock > 0 && p.status !== "inactive",
    ).length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.farmerSubtotal || order.total || 0),
      0,
    );
    const thisMonthOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }).length;

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      thisMonthOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }, [products, orders]);

  // Update analytics state when calculated analytics change
  useEffect(() => {
    setAnalytics(calculatedAnalytics);
  }, [calculatedAnalytics]);

  // Filter and sort products using useMemo to prevent unnecessary recalculations
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Apply filters
    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, "i");
      filtered = filtered.filter(
        (product) =>
          searchRegex.test(product.name) ||
          searchRegex.test(product.description) ||
          searchRegex.test(product.category),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) =>
          product.category.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

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
        case "low-stock":
          filtered = filtered.filter(
            (product) => product.stock > 0 && product.stock <= 5,
          );
          break;
      }
    }

    // Apply sorting
    if (selectedSort) {
      const [key, order] = selectedSort.split("-");
      filtered.sort((a, b) => {
        if (key === "price") {
          return order === "asc" ? a.price - b.price : b.price - a.price;
        }
        if (key === "name") {
          return order === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        if (key === "stock") {
          return order === "asc" ? a.stock - b.stock : b.stock - a.stock;
        }
        if (key === "date") {
          return order === "asc"
            ? new Date(a.createdAt) - new Date(b.createdAt)
            : new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
      });
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedStatus, selectedSort]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, selectedSort]);

  // Product management functions
  const handleStatusToggle = async (productId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const actionText = newStatus === "active" ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${actionText} this product?`)) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [productId]: "status" }));

    try {
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

        // Show success message
        const successMsg =
          newStatus === "active"
            ? "Product activated successfully!"
            : "Product deactivated successfully!";
        alert(successMsg);

        // Refresh analytics
        fetchAnalytics();
      } else {
        throw new Error("Failed to update product status");
      }
    } catch (error) {
      console.error("Error updating product status:", error);
      alert(`Failed to ${actionText} product. Please try again.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [productId]: null }));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (
      !confirm(
        "⚠️ Are you sure you want to delete this product?\n\nThis action cannot be undone and will remove:\n• The product listing\n• All associated data\n• Product from any pending orders",
      )
    ) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [productId]: "delete" }));

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts((prev) =>
          prev.filter((product) => product._id !== productId),
        );
        alert("Product deleted successfully!");

        // Refresh analytics
        fetchAnalytics();
      } else {
        // Handle different error responses
        const errorData = await response.json();

        if (response.status === 409) {
          // Product has pending orders
          alert(
            "❌ Cannot Delete Product\n\n" +
              "This product has pending orders and cannot be deleted.\n" +
              "Please wait for all orders to be completed or cancelled before deleting this product.\n\n" +
              "You can temporarily deactivate the product instead by clicking the pause button.",
          );
        } else if (response.status === 404) {
          alert("❌ Product not found. It may have already been deleted.");
        } else {
          alert(
            `❌ Failed to delete product: ${errorData.error || "Unknown error"}`,
          );
        }
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("❌ Network error. Please check your connection and try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [productId]: null }));
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Calculate analytics from existing data
      const totalProducts = products.length;
      const activeProducts = products.filter(
        (p) => p.stock > 0 && p.status !== "inactive",
      ).length;
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const totalRevenue = orders.reduce(
        (sum, order) => sum + (order.farmerSubtotal || order.total || 0),
        0,
      );
      const thisMonthOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }).length;

      setAnalytics({
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        thisMonthOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      });
    } catch (error) {
      console.error("Error calculating analytics:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeDashboard();
    setRefreshing(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProductStatusBadge = (product) => {
    if (product.status === "inactive") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <i className="fas fa-pause mr-1"></i>
          Inactive
        </span>
      );
    }
    if (product.stock === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <i className="fas fa-exclamation-triangle mr-1"></i>
          Out of Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <i className="fas fa-check-circle mr-1"></i>
        Active
      </span>
    );
  };

  // Pagination and sorting logic
  const totalPages = Math.ceil(
    filteredAndSortedProducts.length / productsPerPage,
  );
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-green-600 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Farmer Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Welcome back, {session?.user?.name || "Farmer"}! Manage your
                  farm business.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
                >
                  <i
                    className={`fas fa-sync-alt mr-2 ${refreshing ? "fa-spin" : ""}`}
                  ></i>
                  Refresh
                </button>
                <Link
                  href="/create"
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Product
                </Link>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {[
                  {
                    id: "dashboard",
                    label: "Dashboard",
                    icon: "fas fa-chart-line",
                  },
                  {
                    id: "products",
                    label: "Products",
                    icon: "fas fa-box",
                    count: products.length,
                  },
                  {
                    id: "orders",
                    label: "Orders",
                    icon: "fas fa-clipboard-list",
                    count: orders.length,
                  },
                  {
                    id: "analytics",
                    label: "Analytics",
                    icon: "fas fa-chart-bar",
                  },
                  { id: "settings", label: "Settings", icon: "fas fa-cog" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-green-500 text-green-600 dark:text-green-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    <i className={`${tab.icon} mr-2`}></i>
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 py-0.5 px-2.5 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <i className="fas fa-box text-blue-600 dark:text-blue-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Products
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics.totalProducts || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <i className="fas fa-check-circle text-green-600 dark:text-green-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Active Products
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics.activeProducts || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <i className="fas fa-shopping-cart text-yellow-600 dark:text-yellow-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Orders
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics.totalOrders || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <i className="fas fa-dollar-sign text-purple-600 dark:text-purple-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(analytics.totalRevenue || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/create"
                    className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                  >
                    <i className="fas fa-plus text-green-600 dark:text-green-400 text-xl mr-3"></i>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Add New Product
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Create a new product listing
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/farmer-orders"
                    className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                  >
                    <i className="fas fa-clipboard-list text-blue-600 dark:text-blue-400 text-xl mr-3"></i>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Manage Orders
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View and update order status
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => setActiveTab("analytics")}
                    className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
                  >
                    <i className="fas fa-chart-bar text-purple-600 dark:text-purple-400 text-xl mr-3"></i>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        View Analytics
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Check your performance metrics
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Orders
                  </h3>
                  <Link
                    href="/farmer-orders"
                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-shopping-bag text-6xl text-gray-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No orders yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      You haven't received any orders for your products yet.
                      Keep promoting your products to attract customers!
                    </p>
                    <Link
                      href="/create"
                      className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add More Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 10).map((order) => (
                      <div
                        key={order._id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <i className="fas fa-shopping-bag text-green-600 dark:text-green-400"></i>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                Order #{order._id?.slice(-8)?.toUpperCase()}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Customer:{" "}
                                {order.customerName ||
                                  order.userName ||
                                  "Customer"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Date: {formatDate(order.createdAt)}
                              </p>
                              {order.items && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Items: {order.items.length} product(s)
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatPrice(
                                order.farmerSubtotal || order.total || 0,
                              )}
                            </p>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : order.status === "confirmed"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : order.status === "shipped"
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                      : order.status === "delivered"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {order.status?.charAt(0).toUpperCase() +
                                order.status?.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        {order.items && order.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex flex-wrap gap-2">
                              {order.items.slice(0, 3).map((item, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300"
                                >
                                  {item.name || item.productName} ×{" "}
                                  {item.quantity}
                                </span>
                              ))}
                              {order.items.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                                  +{order.items.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                          <Link
                            href={`/farmer-orders`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                          >
                            <i className="fas fa-eye mr-1"></i>
                            View Details
                          </Link>

                          {order.status === "pending" && (
                            <div className="flex space-x-2">
                              <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition">
                                <i className="fas fa-check mr-1"></i>
                                Quick Confirm
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {orders.length > 10 && (
                      <div className="text-center pt-4">
                        <Link
                          href="/farmer-orders"
                          className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                        >
                          <i className="fas fa-external-link-alt mr-2"></i>
                          View All {orders.length} Orders
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Products Header with Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Product Management
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Manage your product listings, inventory, and availability
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("");
                        setSelectedStatus("");
                      }}
                      className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
                    >
                      <i className="fas fa-filter mr-2"></i>
                      Clear Filters
                    </button>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
                    >
                      <i
                        className={`fas fa-sync-alt mr-2 ${refreshing ? "fa-spin" : ""}`}
                      ></i>
                      Refresh
                    </button>
                    <Link
                      href="/create"
                      className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add Product
                    </Link>
                  </div>
                </div>
              </div>

              {/* Product Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <i className="fas fa-box text-blue-600 dark:text-blue-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Products
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {products.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <i className="fas fa-check-circle text-green-600 dark:text-green-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Active Products
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {
                          products.filter(
                            (p) => p.stock > 0 && p.status !== "inactive",
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <i className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Low Stock
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {
                          products.filter((p) => p.stock > 0 && p.stock <= 5)
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                      <i className="fas fa-times-circle text-red-600 dark:text-red-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Out of Stock
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {products.filter((p) => p.stock === 0).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Filter & Search
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Products
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Product name, description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Categories</option>
                      <option value="Vegetables">🥬 Vegetables</option>
                      <option value="Fruits">🍎 Fruits</option>
                      <option value="Grains">🌾 Grains</option>
                      <option value="Dairy">🥛 Dairy</option>
                      <option value="Herbs">🌿 Herbs</option>
                      <option value="Other">📦 Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">✅ Active</option>
                      <option value="inactive">⏸️ Inactive</option>
                      <option value="out-of-stock">❌ Out of Stock</option>
                      <option value="low-stock">⚠️ Low Stock (≤5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sort By
                    </label>
                    <select
                      value={selectedSort || ""}
                      onChange={(e) => setSelectedSort(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Default Order</option>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                      <option value="price-asc">Price (Low to High)</option>
                      <option value="price-desc">Price (High to Low)</option>
                      <option value="stock-asc">Stock (Low to High)</option>
                      <option value="stock-desc">Stock (High to Low)</option>
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                    </select>
                  </div>
                </div>

                {/* Filter Summary */}
                {(searchTerm || selectedCategory || selectedStatus) && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredAndSortedProducts.length} of{" "}
                        {products.length} products
                        {searchTerm && ` matching "${searchTerm}"`}
                        {selectedCategory && ` in ${selectedCategory}`}
                        {selectedStatus && ` with ${selectedStatus} status`}
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("");
                          setSelectedStatus("");
                          setSelectedSort("");
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* View Toggle */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      View:
                    </span>
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition ${
                          viewMode === "grid"
                            ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <i className="fas fa-th mr-2"></i>
                        Grid
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition ${
                          viewMode === "list"
                            ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <i className="fas fa-list mr-2"></i>
                        List
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Results per page:</span>
                    <select
                      value={productsPerPage}
                      onChange={(e) =>
                        setProductsPerPage(parseInt(e.target.value))
                      }
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                      <option value={96}>96</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Display */}
              {filteredAndSortedProducts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                  <i className="fas fa-search text-6xl text-gray-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {products.length === 0
                      ? "No products found"
                      : "No products match your filters"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {products.length === 0
                      ? "Start by adding your first product to showcase your farm offerings."
                      : "Try adjusting your search criteria or clearing the filters."}
                  </p>
                  {products.length === 0 ? (
                    <Link
                      href="/create"
                      className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add Your First Product
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("");
                        setSelectedStatus("");
                        setSelectedSort("");
                      }}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                    >
                      <i className="fas fa-filter mr-2"></i>
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Enhanced Grid View with Unique Design */}
                  {viewMode === "grid" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {paginatedProducts.map((product) => (
                        <div
                          key={product._id}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
                        >
                          {/* Product Image */}
                          <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                            <Image
                              src={
                                product.image ||
                                "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop"
                              }
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-3 right-3">
                              {getProductStatusBadge(product)}
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 line-clamp-2">
                                  {product.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  {product.category}
                                </p>
                              </div>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                              {product.description}
                            </p>

                            <div className="space-y-3">
                              {/* Price and Stock */}
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatPrice(product.price)}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                                    /{product.unit || "kg"}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Stock
                                  </div>
                                  <div
                                    className={`font-semibold ${
                                      product.stock === 0
                                        ? "text-red-600 dark:text-red-400"
                                        : product.stock <= 5
                                          ? "text-yellow-600 dark:text-yellow-400"
                                          : "text-green-600 dark:text-green-400"
                                    }`}
                                  >
                                    {product.stock} {product.unit || "kg"}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                                <Link
                                  href={`/products/${product._id}`}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                                >
                                  <i className="fas fa-eye mr-1"></i>
                                  View Details
                                </Link>
                                {product.status === "inactive" && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() =>
                                        handleStatusToggle(
                                          product._id,
                                          product.status,
                                        )
                                      }
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition"
                                    >
                                      <i className="fas fa-check mr-1"></i>
                                      Activate
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* List View */}
                  {viewMode === "list" && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                      <div className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <div className="bg-gray-50 dark:bg-gray-900">
                          <div className="flex justify-between items-center py-3 px-4 sm:px-6 lg:px-8">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Product List
                            </h3>
                            <div className="flex-shrink-0">
                              <Link
                                href="/create"
                                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                              >
                                <i className="fas fa-plus mr-2"></i>
                                Add Product
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div>
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {paginatedProducts.map((product) => (
                                <tr key={product._id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="h-10 w-10 rounded-full overflow-hidden">
                                        <Image
                                          src={
                                            product.image ||
                                            "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop"
                                          }
                                          alt={product.name}
                                          width={40}
                                          height={40}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                          {product.name}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                          {product.category}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {formatPrice(product.price)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {getProductStatusBadge(product)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span
                                      className={`font-medium ${
                                        product.stock === 0
                                          ? "text-red-600 dark:text-red-400"
                                          : product.stock <= 5
                                            ? "text-yellow-600 dark:text-yellow-400"
                                            : "text-green-600 dark:text-green-400"
                                      }`}
                                    >
                                      {product.stock} {product.unit || "kg"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                      <Link
                                        href={`/create?edit=${product._id}`}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                        title="Edit Product"
                                      >
                                        <i className="fas fa-edit"></i>
                                      </Link>
                                      <button
                                        onClick={() =>
                                          handleStatusToggle(
                                            product._id,
                                            product.status,
                                          )
                                        }
                                        className={`text-sm rounded-full transition ${
                                          product.status === "active"
                                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200"
                                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200"
                                        }`}
                                        title={
                                          product.status === "active"
                                            ? "Deactivate"
                                            : "Activate"
                                        }
                                      >
                                        <i
                                          className={`fas ${product.status === "active" ? "fa-pause" : "fa-play"}`}
                                        ></i>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteProduct(product._id)
                                        }
                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                        title="Delete Product"
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="px-4 py-3 flex items-center justify-between sm:px-6 lg:px-8">
                            <div className="flex-1 flex justify-between sm:hidden">
                              <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                              >
                                <i className="fas fa-angle-double-left"></i>
                              </button>
                              <button
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.max(prev - 1, 1),
                                  )
                                }
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                              >
                                <i className="fas fa-angle-left"></i>
                              </button>
                              <button
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages),
                                  )
                                }
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                              >
                                <i className="fas fa-angle-right"></i>
                              </button>
                              <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                              >
                                <i className="fas fa-angle-double-right"></i>
                              </button>
                            </div>
                            <div className="hidden sm:flex sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                  Page{" "}
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {currentPage}
                                  </span>{" "}
                                  of{" "}
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {totalPages}
                                  </span>
                                </p>
                              </div>
                              <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                  <div className="flex space-x-1">
                                    {[...Array(Math.min(5, totalPages))].map(
                                      (_, index) => {
                                        const pageNumber =
                                          Math.max(1, currentPage - 2) + index;
                                        if (pageNumber > totalPages)
                                          return null;

                                        return (
                                          <button
                                            key={pageNumber}
                                            onClick={() =>
                                              setCurrentPage(pageNumber)
                                            }
                                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                              currentPage === pageNumber
                                                ? "bg-green-600 text-white"
                                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                            }`}
                                          >
                                            {pageNumber}
                                          </button>
                                        );
                                      },
                                    )}
                                  </div>

                                  <button
                                    onClick={() =>
                                      setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages),
                                      )
                                    }
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                  >
                                    Next
                                  </button>
                                </nav>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Orders Header */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Order Management
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      View and manage all orders for your products
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
                    >
                      <i
                        className={`fas fa-sync-alt mr-2 ${refreshing ? "fa-spin" : ""}`}
                      ></i>
                      Refresh
                    </button>
                    <Link
                      href="/farmer-orders"
                      className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                    >
                      <i className="fas fa-external-link-alt mr-2"></i>
                      Full Order Management
                    </Link>
                  </div>
                </div>
              </div>

              {/* Order Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <i className="fas fa-shopping-cart text-gray-600 dark:text-gray-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Orders
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {orders.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <i className="fas fa-clock text-yellow-600 dark:text-yellow-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {orders.filter((o) => o.status === "pending").length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <i className="fas fa-check text-blue-600 dark:text-blue-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Confirmed
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {orders.filter((o) => o.status === "confirmed").length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <i className="fas fa-check-circle text-green-600 dark:text-green-300 text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {orders.filter((o) => o.status === "delivered").length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Orders
                  </h3>
                  <Link
                    href="/farmer-orders"
                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium"
                  >
                    View All Orders
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-shopping-bag text-6xl text-gray-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No orders yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      You haven't received any orders for your products yet.
                      Keep promoting your products to attract customers!
                    </p>
                    <Link
                      href="/create"
                      className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add More Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 10).map((order) => (
                      <div
                        key={order._id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <i className="fas fa-shopping-bag text-green-600 dark:text-green-400"></i>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                Order #{order._id?.slice(-8)?.toUpperCase()}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Customer:{" "}
                                {order.customerName ||
                                  order.userName ||
                                  "Customer"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Date: {formatDate(order.createdAt)}
                              </p>
                              {order.items && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Items: {order.items.length} product(s)
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatPrice(
                                order.farmerSubtotal || order.total || 0,
                              )}
                            </p>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : order.status === "confirmed"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : order.status === "shipped"
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                      : order.status === "delivered"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {order.status?.charAt(0).toUpperCase() +
                                order.status?.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        {order.items && order.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex flex-wrap gap-2">
                              {order.items.slice(0, 3).map((item, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300"
                                >
                                  {item.name || item.productName} ×{" "}
                                  {item.quantity}
                                </span>
                              ))}
                              {order.items.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                                  +{order.items.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                          <Link
                            href={`/farmer-orders`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                          >
                            <i className="fas fa-eye mr-1"></i>
                            View Details
                          </Link>

                          {order.status === "pending" && (
                            <div className="flex space-x-2">
                              <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition">
                                <i className="fas fa-check mr-1"></i>
                                Quick Confirm
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {orders.length > 10 && (
                      <div className="text-center pt-4">
                        <Link
                          href="/farmer-orders"
                          className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                        >
                          <i className="fas fa-external-link-alt mr-2"></i>
                          View All {orders.length} Orders
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Analytics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Revenue Overview
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatPrice(analytics.totalRevenue || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Average Order Value
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatPrice(analytics.averageOrderValue || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This Month Revenue
                      </p>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {formatPrice(
                          orders
                            .filter((order) => {
                              const orderDate = new Date(order.createdAt);
                              const now = new Date();
                              return (
                                orderDate.getMonth() === now.getMonth() &&
                                orderDate.getFullYear() === now.getFullYear()
                              );
                            })
                            .reduce(
                              (sum, order) =>
                                sum +
                                (order.farmerSubtotal || order.total || 0),
                              0,
                            ),
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Product Performance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Active Products
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {analytics.activeProducts || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Products
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {analytics.totalProducts || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Low Stock Items
                      </p>
                      <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                        {
                          products.filter((p) => p.stock > 0 && p.stock <= 5)
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Order Metrics
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This Month Orders
                      </p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {analytics.thisMonthOrders || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pending Orders
                      </p>
                      <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                        {analytics.pendingOrders || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Completion Rate
                      </p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {orders.length > 0
                          ? `${Math.round((orders.filter((o) => o.status === "delivered").length / orders.length) * 100)}%`
                          : "0%"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Categories Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Products by Category
                  </h3>
                  {(() => {
                    const categoryStats = products.reduce((acc, product) => {
                      const category = product.category || "Other";
                      if (!acc[category]) {
                        acc[category] = {
                          count: 0,
                          revenue: 0,
                          active: 0,
                        };
                      }
                      acc[category].count++;
                      if (product.status !== "inactive" && product.stock > 0) {
                        acc[category].active++;
                      }

                      // Calculate revenue for this category
                      const categoryRevenue = orders.reduce((sum, order) => {
                        if (order.items) {
                          const categoryItems = order.items.filter((item) =>
                            products.find(
                              (p) =>
                                (p._id === item.productId ||
                                  p.name === item.name) &&
                                p.category === category,
                            ),
                          );
                          return (
                            sum +
                            categoryItems.reduce(
                              (itemSum, item) =>
                                itemSum + item.price * item.quantity,
                              0,
                            )
                          );
                        }
                        return sum;
                      }, 0);
                      acc[category].revenue = categoryRevenue;

                      return acc;
                    }, {});

                    const totalProducts = products.length;
                    const sortedCategories = Object.entries(categoryStats).sort(
                      ([, a], [, b]) => b.count - a.count,
                    );

                    return sortedCategories.length > 0 ? (
                      <div className="space-y-4">
                        {sortedCategories.map(([category, stats]) => {
                          const percentage =
                            totalProducts > 0
                              ? (stats.count / totalProducts) * 100
                              : 0;
                          return (
                            <div key={category} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {category}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ({stats.count} products)
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {percentage.toFixed(1)}%
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {stats.active} active
                                  </div>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>
                                  Revenue: {formatPrice(stats.revenue)}
                                </span>
                                <span>
                                  Stock:{" "}
                                  {products
                                    .filter((p) => p.category === category)
                                    .reduce(
                                      (sum, p) => sum + (p.stock || 0),
                                      0,
                                    )}{" "}
                                  units
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <i className="fas fa-chart-pie text-4xl text-gray-400 mb-4"></i>
                        <p className="text-gray-600 dark:text-gray-400">
                          No products to analyze yet. Add some products to see
                          category analytics.
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Recent Performance Trends
                  </h3>
                  {(() => {
                    const last7Days = Array.from({ length: 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      return {
                        date: date.toISOString().split("T")[0],
                        day: date.toLocaleDateString("en-US", {
                          weekday: "short",
                        }),
                        orders: orders.filter((order) => {
                          const orderDate = new Date(order.createdAt);
                          return (
                            orderDate.toISOString().split("T")[0] ===
                            date.toISOString().split("T")[0]
                          );
                        }).length,
                        revenue: orders
                          .filter((order) => {
                            const orderDate = new Date(order.createdAt);
                            return (
                              orderDate.toISOString().split("T")[0] ===
                              date.toISOString().split("T")[0]
                            );
                          })
                          .reduce(
                            (sum, order) =>
                              sum + (order.farmerSubtotal || order.total || 0),
                            0,
                          ),
                      };
                    });

                    const maxOrders = Math.max(
                      ...last7Days.map((d) => d.orders),
                      1,
                    );
                    const maxRevenue = Math.max(
                      ...last7Days.map((d) => d.revenue),
                      1,
                    );

                    return (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Daily Orders (Last 7 Days)
                          </h4>
                          <div className="flex items-end space-x-2 h-24">
                            {last7Days.map((day, index) => (
                              <div
                                key={index}
                                className="flex-1 flex flex-col items-center"
                              >
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative">
                                  <div
                                    className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-500"
                                    style={{
                                      height: `${Math.max((day.orders / maxOrders) * 80, day.orders > 0 ? 8 : 0)}px`,
                                    }}
                                  ></div>
                                </div>
                                <div className="text-center mt-2">
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    {day.orders}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {day.day}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Daily Revenue (Last 7 Days)
                          </h4>
                          <div className="flex items-end space-x-2 h-24">
                            {last7Days.map((day, index) => (
                              <div
                                key={index}
                                className="flex-1 flex flex-col items-center"
                              >
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative">
                                  <div
                                    className="bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all duration-500"
                                    style={{
                                      height: `${Math.max((day.revenue / maxRevenue) * 80, day.revenue > 0 ? 8 : 0)}px`,
                                    }}
                                  ></div>
                                </div>
                                <div className="text-center mt-2">
                                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                                    ৳{Math.round(day.revenue)}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {day.day}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Top Performing Products */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Top Performing Products
                </h3>
                {(() => {
                  const productPerformance = products
                    .map((product) => {
                      const productOrders = orders.filter((order) =>
                        order.items?.some(
                          (item) =>
                            item.productId === product._id ||
                            item.name === product.name ||
                            item.productName === product.name,
                        ),
                      );

                      const totalQuantitySold = productOrders.reduce(
                        (sum, order) => {
                          const productItems =
                            order.items?.filter(
                              (item) =>
                                item.productId === product._id ||
                                item.name === product.name ||
                                item.productName === product.name,
                            ) || [];
                          return (
                            sum +
                            productItems.reduce(
                              (itemSum, item) => itemSum + (item.quantity || 0),
                              0,
                            )
                          );
                        },
                        0,
                      );

                      const totalRevenue = productOrders.reduce(
                        (sum, order) => {
                          const productItems =
                            order.items?.filter(
                              (item) =>
                                item.productId === product._id ||
                                item.name === product.name ||
                                item.productName === product.name,
                            ) || [];
                          return (
                            sum +
                            productItems.reduce(
                              (itemSum, item) =>
                                itemSum +
                                (item.price || 0) * (item.quantity || 0),
                              0,
                            )
                          );
                        },
                        0,
                      );

                      return {
                        ...product,
                        orderCount: productOrders.length,
                        quantitySold: totalQuantitySold,
                        revenue: totalRevenue,
                        performance: totalRevenue + totalQuantitySold * 10, // Simple performance score
                      };
                    })
                    .sort((a, b) => b.performance - a.performance)
                    .slice(0, 5);

                  return productPerformance.length > 0 ? (
                    <div className="space-y-4">
                      {productPerformance.map((product, index) => (
                        <div
                          key={product._id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {product.category} • Stock: {product.stock}{" "}
                                {product.unit || "kg"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatPrice(product.revenue)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {product.quantitySold} sold • {product.orderCount}{" "}
                              orders
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-chart-line text-4xl text-gray-400 mb-4"></i>
                      <p className="text-gray-600 dark:text-gray-400">
                        No sales data available yet. Your product performance
                        will appear here once you start receiving orders.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Farmer Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Farm Name
                    </label>
                    <input
                      type="text"
                      defaultValue={session?.user?.name || ""}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      defaultValue={session?.user?.email || ""}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="pt-4">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
