"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function FarmerPage() {
  const router = useRouter();
  const params = useParams();
  const farmerId = params.id;

  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("story");

  // Helper function to calculate years of experience (used only once)
  const calculateYearsOfExperience = (joinedDate, createdAt) => {
    const joinDate = new Date(joinedDate || createdAt);
    const currentDate = new Date();
    return Math.max(1, currentDate.getFullYear() - joinDate.getFullYear());
  };

  // Configuration objects to reduce repetition
  const specializationConfig = {
    Grains: {
      icon: "fas fa-seedling",
      color: "bg-amber-500",
      description: "Premium grain production",
    },
    Fruits: {
      icon: "fas fa-apple-alt",
      color: "bg-red-500",
      description: "Fresh seasonal fruits",
    },
    Vegetables: {
      icon: "fas fa-carrot",
      color: "bg-orange-500",
      description: "Organic vegetables",
    },
    Herbs: {
      icon: "fas fa-leaf",
      color: "bg-green-500",
      description: "Natural herbs & spices",
    },
    Honey: {
      icon: "fas fa-bug",
      color: "bg-yellow-500",
      description: "Pure natural honey",
    },
    Dairy: {
      icon: "fas fa-glass-whiskey",
      color: "bg-blue-500",
      description: "Fresh dairy products",
    },
  };

  const methodConfig = {
    Organic: {
      icon: "fas fa-leaf",
      color: "text-green-600 dark:text-green-400",
      description: "Chemical-free farming practices",
    },
    Traditional: {
      icon: "fas fa-seedling",
      color: "text-brown-600 dark:text-yellow-400",
      description: "Time-tested farming wisdom",
    },
    Sustainable: {
      icon: "fas fa-recycle",
      color: "text-blue-600 dark:text-blue-400",
      description: "Environmentally conscious methods",
    },
    "Natural Ripening": {
      icon: "fas fa-sun",
      color: "text-orange-600 dark:text-orange-400",
      description: "Natural maturation process",
    },
    "Fruit Cultivation": {
      icon: "fas fa-apple-alt",
      color: "text-red-600 dark:text-red-400",
      description: "Specialized fruit growing",
    },
    "Sun-dried": {
      icon: "fas fa-sun",
      color: "text-yellow-600 dark:text-yellow-400",
      description: "Solar-powered processing",
    },
  };

  const ORDER_STATUS = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    RETURNED: "returned",
  };

  // Helper function to render specialization cards
  const renderSpecializationCard = (specialization, index) => {
    const config = specializationConfig[specialization] || {
      icon: "fas fa-tractor",
      color: "bg-purple-500",
      description: "Farm specialization",
    };

    return (
      <div key={index} className="text-center">
        <div
          className={`w-12 h-12 ${config.color} rounded-full flex items-center justify-center mx-auto mb-3`}
        >
          <i className={`${config.icon} text-white`}></i>
        </div>
        <h3 className="text-white font-semibold mb-2">{specialization}</h3>
        <p className="text-white/70 text-sm">{config.description}</p>
      </div>
    );
  };

  // Helper function to render farming method cards
  const renderMethodCard = (method, index) => {
    const config = methodConfig[method] || {
      icon: "fas fa-tractor",
      color: "text-gray-600 dark:text-gray-400",
      description: "Specialized farming technique",
    };

    return (
      <div
        key={index}
        className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl text-center"
      >
        <i className={`${config.icon} text-4xl ${config.color} mb-4`}></i>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          {method}
        </h4>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {config.description}
        </p>
      </div>
    );
  };

  // Helper function to render generic fallback core values
  const renderFallbackCoreValues = () => (
    <>
      <div className="text-center">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <i className="fas fa-leaf text-white"></i>
        </div>
        <h3 className="text-white font-semibold mb-2">Sustainable</h3>
        <p className="text-white/70 text-sm">Eco-friendly farming practices</p>
      </div>
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <i className="fas fa-shield-alt text-white"></i>
        </div>
        <h3 className="text-white font-semibold mb-2">Quality</h3>
        <p className="text-white/70 text-sm">Premium fresh produce</p>
      </div>
      <div className="text-center">
        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <i className="fas fa-users text-white"></i>
        </div>
        <h3 className="text-white font-semibold mb-2">Community</h3>
        <p className="text-white/70 text-sm">Supporting local families</p>
      </div>
    </>
  );

  useEffect(() => {
    fetchFarmerData();
  }, [farmerId]);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First fetch farmer data
      const farmerResponse = await fetch(`/api/farmers/${farmerId}`, {
        headers: { "Cache-Control": "no-cache" },
      });

      if (!farmerResponse.ok) {
        throw new Error("Farmer not found");
      }

      const farmerData = await farmerResponse.json();

      // Now fetch products and orders with farmer information
      const [ordersResponse] = await Promise.all([
        fetch(
          `/api/orders?farmerId=${farmerId}&farmerEmail=${farmerData.farmer?.email || ""}`,
          {
            headers: { "Cache-Control": "no-cache" },
          },
        ),
      ]);

      const ordersData = await ordersResponse.json();

      setFarmer(farmerData.farmer);
      setProducts(farmerData.farmer.products || []); // Use products from farmer data

      // Use the stats already calculated by the API instead of recalculating
      const farmerProducts = farmerData.farmer.products || [];
      const totalProducts = farmerProducts.length;
      const activeProducts = farmerProducts.filter((p) => p.stock > 0).length;
      const totalStock = farmerProducts.reduce(
        (sum, p) => sum + (p.stock || 0),
        0,
      );
      const averagePrice =
        farmerProducts.length > 0
          ? (
              farmerProducts.reduce((sum, p) => sum + (p.price || 0), 0) /
              farmerProducts.length
            ).toFixed(2)
          : 0;
      const averageRating =
        farmerProducts.length > 0
          ? (
              farmerProducts.reduce(
                (sum, p) => sum + (p.averageRating || 0),
                0,
              ) / farmerProducts.length
            ).toFixed(1)
          : 0;

      // Get categories from products
      const categories = [
        ...new Set(farmerProducts.map((p) => p.category).filter(Boolean)),
      ];

      // Get recent reviews from products
      const allReviews = farmerProducts
        .flatMap((p) =>
          (p.reviews || []).map((review) => ({
            ...review,
            productName: p.name,
            productId: p._id,
          })),
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Calculate revenue from orders
      const farmerOrders = (ordersData.orders || []).filter((order) => {
        return (
          order.items &&
          order.items.some(
            (item) =>
              item.farmerId === farmerId ||
              item.farmer?.id === farmerId ||
              item.farmer?._id === farmerId ||
              item.farmerEmail === farmerData.farmer?.email,
          )
        );
      });

      // Use exact same filtering logic as dashboard
      const validOrders = farmerOrders.filter(
        (order) =>
          order.status !== ORDER_STATUS.CANCELLED &&
          order.status !== ORDER_STATUS.RETURNED,
      );

      // Calculate total revenue using the same method as dashboard analytics
      const actualTotalRevenue = validOrders.reduce(
        (sum, order) => sum + (order.farmerSubtotal || order.total || 0),
        0,
      );

      // Calculate monthly revenue using the same method as dashboard
      const thisMonthValidOrders = validOrders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        const currentDate = new Date();
        return (
          orderDate.getMonth() === currentDate.getMonth() &&
          orderDate.getFullYear() === currentDate.getFullYear()
        );
      });

      const monthlyRevenue = thisMonthValidOrders.reduce(
        (sum, order) => sum + (order.farmerSubtotal || order.total || 0),
        0,
      );

      setReviews(allReviews);
      setStats({
        totalProducts,
        activeProducts,
        totalStock,
        averagePrice,
        averageRating,
        categories,
        totalReviews: allReviews.length,
        familiesServed: Math.floor(totalProducts * 50 + Math.random() * 200),
        farmSize: farmerData.farmer.farmSize || 0,
        farmSizeUnit: farmerData.farmer.farmSizeUnit || "acres",
        yearsOfExperience:
          farmerData.farmer.yearsOfExperience ||
          calculateYearsOfExperience(
            farmerData.farmer.joinedDate,
            farmerData.farmer.createdAt,
          ),
        certificationStatus: farmerData.farmer.isCertified
          ? "Certified"
          : "In Progress",
        farmingMethods: farmerData.farmer.farmingMethods || [
          "Organic",
          "Sustainable",
        ],
        monthlyRevenue: monthlyRevenue.toFixed(2),
        totalRevenue: actualTotalRevenue.toFixed(2),
        inventoryValue: (parseFloat(averagePrice) * totalStock).toFixed(2),
      });
    } catch (error) {
      console.error("Error fetching farmer data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 dark:border-gray-600 border-t-green-600 dark:border-t-green-400 mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-user-tie text-green-600 dark:text-green-400 text-2xl"></i>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Loading Farmer Profile
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Discovering their story...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !farmer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-6">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Farmer Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {error ||
                "The farmer you're looking for doesn't exist or has been removed."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Go Back
              </button>
              <Link
                href="/farmers"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                <i className="fas fa-users mr-2"></i>
                Browse Farmers
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section with Dynamic Farmer Story */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600"></div>
          <div className="absolute inset-0 bg-black/20"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            {/* Breadcrumb */}
            <nav className="flex mb-8" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-white/80 hover:text-white transition-colors flex items-center"
                  >
                    <i className="fas fa-home mr-1"></i>
                    Home
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-white/60 text-xs"></i>
                </li>
                <li>
                  <Link
                    href="/farmers"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Farmers
                  </Link>
                </li>
                <li>
                  <i className="fas fa-chevron-right text-white/60 text-xs"></i>
                </li>
                <li className="text-white font-medium">{farmer.name}</li>
              </ol>
            </nav>

            {/* Dynamic Farmer Profile Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              {/* Profile Image and Basic Info */}
              <div className="text-center lg:text-left">
                <div className="relative inline-block mb-6">
                  <div className="w-48 h-48 mx-auto lg:mx-0 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-4 border-white/30 overflow-hidden shadow-2xl">
                    {farmer.profilePicture ? (
                      <img
                        src={farmer.profilePicture}
                        alt={farmer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-user-tie text-6xl text-white/80"></i>
                      </div>
                    )}
                  </div>
                  {farmer.verified && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-3 shadow-lg">
                      <i className="fas fa-check text-lg"></i>
                    </div>
                  )}
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  {farmer.name}
                </h1>
                <p className="text-xl text-white/90 mb-4">
                  {farmer.farmName || `${farmer.name}'s Farm`}
                </p>
                <div className="flex items-center justify-center lg:justify-start text-white/80 mb-6">
                  <i className="fas fa-map-marker-alt mr-2 text-yellow-400"></i>
                  <span className="text-lg">{farmer.location}</span>
                </div>

                {/* Dynamic Quick Stats - Use stats.yearsOfExperience instead of recalculating */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-2xl font-bold text-white">
                      {stats.yearsOfExperience}+
                    </div>
                    <div className="text-white/80 text-sm">
                      Years Experience
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-2xl font-bold text-white">
                      {stats.totalProducts}
                    </div>
                    <div className="text-white/80 text-sm">Products</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-2xl font-bold text-white">
                      {stats.averageRating || "N/A"}
                    </div>
                    <div className="text-white/80 text-sm">Avg Rating</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-2xl font-bold text-white">
                      {stats.categories?.length || 0}
                    </div>
                    <div className="text-white/80 text-sm">Categories</div>
                  </div>
                </div>
              </div>

              {/* Dynamic Farmer's Mission & Values */}
              <div className="lg:col-span-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                    <i className="fas fa-heart mr-3 text-red-400"></i>
                    Our Mission
                  </h2>
                  <p className="text-white/90 text-lg leading-relaxed mb-6">
                    {farmer.bio ||
                      `${farmer.name} is dedicated to providing the freshest, highest-quality produce through sustainable farming practices. Our farm has been serving the community with passion and commitment to environmental stewardship.`}
                  </p>
                  {/* Dynamic Specializations - Only show once here */}
                  {farmer.specializations &&
                    farmer.specializations.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-white font-semibold mb-3">
                          Our Specializations:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {farmer.specializations.map((spec, index) => (
                            <span
                              key={index}
                              className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium border border-white/30"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  {/* Dynamic Core Values based on farmer's specializations and methods */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {farmer.specializations && farmer.specializations.length > 0
                      ? farmer.specializations
                          .slice(0, 3)
                          .map((specialization, index) =>
                            renderSpecializationCard(specialization, index),
                          )
                      : renderFallbackCoreValues()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Main Content Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {[
              { id: "story", label: "Our Story", icon: "fas fa-book-open" },
              {
                id: "products",
                label: "Product Overview",
                icon: "fas fa-seedling",
              },
              { id: "reviews", label: "Customer Reviews", icon: "fas fa-star" },
              {
                id: "stats",
                label: "Farm Statistics",
                icon: "fas fa-chart-bar",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center ${
                  activeTab === tab.id
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700"
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Tab Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {activeTab === "story" && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Our Farming Journey
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
                    Every farm has a story. Here&apos;s ours - a tale of
                    passion, dedication, and love for the land.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                      The Beginning
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                      {farmer.bio ||
                        `${farmer.name} started their farming journey in ${new Date(
                          farmer.joinedDate || farmer.createdAt,
                        ).getFullYear()} with a simple dream: to grow the best produce possible while caring for the environment. What began as a small family operation has grown into a trusted source of fresh, healthy food for our community.`}
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                          <i className="fas fa-calendar text-green-600 dark:text-green-400"></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            Farm Established
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {new Date(
                              farmer.joinedDate || farmer.createdAt,
                            ).getFullYear()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                          <i className="fas fa-heart text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            Our Mission
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            Providing fresh, sustainable produce to our
                            community
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-4">
                          <i className="fas fa-leaf text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            Farming Philosophy
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {stats.farmingMethods?.length > 0
                              ? `${stats.farmingMethods.join(", ")} practices`
                              : "Sustainable and eco-friendly methods"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Show farming achievements and highlights instead of repeating stats */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 p-6 rounded-xl">
                      <i className="fas fa-certificate text-3xl text-green-600 dark:text-green-400 mb-4"></i>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {farmer.isCertified
                          ? "Certified Organic"
                          : "Quality Farming"}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {farmer.isCertified
                          ? "Officially certified organic farming"
                          : "Committed to quality and safety standards"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 p-6 rounded-xl">
                      <i className="fas fa-users text-3xl text-blue-600 dark:text-blue-400 mb-4"></i>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Community Impact
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Proudly serving {stats.familiesServed}+ families monthly
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 p-6 rounded-xl">
                      <i className="fas fa-star text-3xl text-purple-600 dark:text-purple-400 mb-4"></i>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Customer Satisfaction
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {stats.averageRating > 0
                          ? `${stats.averageRating}/5 average rating`
                          : "Building trust with every harvest"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 p-6 rounded-xl">
                      <i className="fas fa-seedling text-3xl text-yellow-600 dark:text-yellow-400 mb-4"></i>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Product Variety
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {stats.totalProducts} products across{" "}
                        {stats.categories?.length || 0} categories
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "products" && (
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

                {stats.categories && stats.categories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {stats.categories.map((category, index) => {
                      const categoryProducts = products.filter(
                        (p) => p.category === category,
                      );
                      const avgPrice =
                        categoryProducts.length > 0
                          ? (
                              categoryProducts.reduce(
                                (sum, p) => sum + (p.price || 0),
                                0,
                              ) / categoryProducts.length
                            ).toFixed(2)
                          : 0;

                      return (
                        <div
                          key={index}
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

                {/* Featured Products Preview */}
                {products.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                      Featured Products
                    </h3>
                    <div className="space-y-6">
                      {products.slice(0, 3).map((product, index) => (
                        <div
                          key={product._id}
                          className={`flex ${
                            index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                          } items-center gap-8 bg-gradient-to-r ${
                            index % 3 === 0
                              ? "from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30"
                              : index % 3 === 1
                                ? "from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30"
                                : "from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30"
                          } p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]`}
                        >
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg">
                              {product.images && product.images[0] ? (
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

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                  {product.name}
                                </h4>
                                <p className="text-gray-600 dark:text-gray-400 mb-3">
                                  Category: {product.category}
                                </p>

                                {/* Rating */}
                                {product.averageRating && (
                                  <div className="flex items-center mb-3">
                                    <div className="flex text-yellow-400 mr-2">
                                      {[...Array(5)].map((_, i) => (
                                        <i
                                          key={i}
                                          className={`fas fa-star text-sm ${
                                            i <
                                            Math.floor(product.averageRating)
                                              ? "text-yellow-400"
                                              : "text-gray-300 dark:text-gray-600"
                                          }`}
                                        ></i>
                                      ))}
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      ({product.averageRating}/5)
                                    </span>
                                  </div>
                                )}

                                {/* Product Description */}
                                {product.description && (
                                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                    {product.description}
                                  </p>
                                )}
                              </div>

                              {/* Price and Actions */}
                              <div className="flex flex-col items-end gap-4 ml-6">
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    ${product.price}
                                  </div>
                                  <div
                                    className={`text-sm ${
                                      product.stock > 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {product.stock > 0
                                      ? `${product.stock} available`
                                      : "Out of stock"}
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <button
                                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                      product.stock > 0
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                                    disabled={product.stock === 0}
                                  >
                                    <i className="fas fa-cart-plus mr-2"></i>
                                    {product.stock > 0
                                      ? "Add to Cart"
                                      : "Sold Out"}
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

                    {/* View All Products Button */}
                    <div className="text-center mt-8">
                      <Link
                        href={`/farmers/${farmerId}/details`}
                        className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        <i className="fas fa-store mr-3"></i>
                        View All {stats.totalProducts} Products
                        <i className="fas fa-arrow-right ml-3"></i>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Customer Reviews
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
                    See what our customers are saying about our products and
                    service.
                  </p>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-xl shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {review.userName || "Anonymous Customer"}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Review for: {review.productName}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className={`fas fa-star text-sm ${
                                  i < review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                              ></i>
                            ))}
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              ({review.rating}/5)
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {review.comment}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="fas fa-star text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      No reviews yet. Be the first to leave a review!
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "stats" && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Farm Statistics
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
                    Real-time data about our farm's productivity and community
                    impact.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-xl shadow-lg text-center">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {stats.totalProducts}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Total Products
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Available in our catalog
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-xl shadow-lg text-center">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {stats.activeProducts}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      In Stock
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Ready for purchase
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-xl shadow-lg text-center">
                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                      {stats.totalStock}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Total Stock
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Items available
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-xl shadow-lg text-center">
                    <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                      {stats.familiesServed}+
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Families Served
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Monthly community impact
                    </p>
                  </div>
                </div>

                {/* Additional Stats - Use stats values consistently */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Farm Size
                    </h3>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {stats.farmSize} {stats.farmSizeUnit}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Experience
                    </h3>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.yearsOfExperience}+ Years
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Total Revenue
                    </h3>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${stats.totalRevenue}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Monthly Revenue
                    </h3>
                    <div className="text-3xl font-bold text-yellow-500">
                      ${stats.monthlyRevenue}
                    </div>
                  </div>
                </div>

                {/* Dynamic Farming Methods Section */}
                {stats.farmingMethods && stats.farmingMethods.length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                      Our Farming Methods
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {stats.farmingMethods.map((method, index) =>
                        renderMethodCard(method, index),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Action Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-8">
                Ready to Experience {farmer.farmName || `${farmer.name}'s Farm`}
                ?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Link
                  href={`/farmers/${farmerId}/details`}
                  className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-8 rounded-2xl transition-all duration-300 border border-white/30 transform hover:scale-105"
                >
                  <i className="fas fa-store text-4xl mb-4 group-hover:scale-110 transition-transform"></i>
                  <h3 className="text-xl font-bold mb-2">
                    Browse {stats.totalProducts} Products
                  </h3>
                  <p className="text-white/90">
                    Explore our full product catalog
                  </p>
                </Link>

                <div className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-8 rounded-2xl transition-all duration-300 border border-white/30 transform hover:scale-105 cursor-pointer">
                  <i className="fas fa-star text-4xl mb-4 group-hover:scale-110 transition-transform"></i>
                  <h3 className="text-xl font-bold mb-2">
                    {stats.averageRating}/5 Rating
                  </h3>
                  <p className="text-white/90">See what customers say</p>
                </div>

                <div className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-8 rounded-2xl transition-all duration-300 border border-white/30 transform hover:scale-105 cursor-pointer">
                  <i className="fas fa-envelope text-4xl mb-4 group-hover:scale-110 transition-transform"></i>
                  <h3 className="text-xl font-bold mb-2">
                    Contact {farmer.name}
                  </h3>
                  <p className="text-white/90">Get in touch with questions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
