"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";

// Component imports
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import NavigationTabs from "@/components/dashboard/NavigationTabs";
import DashboardTab from "@/components/dashboard/tabs/DashboardTab";
import ProductsTab from "@/components/dashboard/tabs/ProductsTab";
import OrdersTab from "@/components/dashboard/tabs/OrdersTab";
import AnalyticsTab from "@/components/dashboard/tabs/AnalyticsTab";
import SettingsTab from "@/components/dashboard/tabs/SettingsTab";

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

  // Pagination logic
  const totalPages = Math.ceil(
      filteredAndSortedProducts.length / productsPerPage,
  );
  const paginatedProducts = filteredAndSortedProducts.slice(
      (currentPage - 1) * productsPerPage,
      currentPage * productsPerPage,
  );

  // Collect all functions and data to pass to components
  const dashboardProps = {
    session,
    products,
    orders,
    analytics,
    handleRefresh,
    refreshing,
    formatPrice,
    formatDate,
  };

  const productProps = {
    products,
    filteredAndSortedProducts,
    paginatedProducts,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedSort,
    setSelectedSort,
    viewMode,
    setViewMode,
    productsPerPage,
    setProductsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    handleStatusToggle,
    handleDeleteProduct,
    actionLoading,
    getProductStatusBadge,
    handleRefresh,
    refreshing,
    formatPrice,
    formatDate,
  };

  const orderProps = {
    orders,
    handleRefresh,
    refreshing,
    formatPrice,
    formatDate,
  };

  const analyticsProps = {
    analytics,
    products,
    orders,
    formatPrice,
  };

  const settingsProps = {
    session,
  };

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
          <DashboardHeader
              session={session}
              handleRefresh={handleRefresh}
              refreshing={refreshing}
          />

          <NavigationTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              productsCount={products.length}
              ordersCount={orders.length}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === "dashboard" && (
                <DashboardTab {...dashboardProps} />
            )}

            {activeTab === "products" && (
                <ProductsTab {...productProps} />
            )}

            {activeTab === "orders" && (
                <OrdersTab {...orderProps} />
            )}

            {activeTab === "analytics" && (
                <AnalyticsTab {...analyticsProps} />
            )}

            {activeTab === "settings" && (
                <SettingsTab {...settingsProps} />
            )}
          </div>
        </div>
        <Footer />
      </>
  );
}

// Ensure all components are imported correct