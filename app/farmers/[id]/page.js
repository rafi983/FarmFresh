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
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-6">
                    💬 Customer Testimonials 💬
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
                    Discover what our valued customers are saying about their
                    experience with our fresh, quality produce and exceptional
                    service.
                  </p>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-8">
                    {/* Reviews Statistics Banner */}
                    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-3xl p-8 mb-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white text-center">
                        <div className="group">
                          <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                            {reviews.length}
                          </div>
                          <div className="text-white/90 text-lg">
                            Total Reviews
                          </div>
                          <div className="w-16 h-1 bg-white/30 mx-auto mt-2 rounded-full"></div>
                        </div>
                        <div className="group">
                          <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                            {stats.averageRating}★
                          </div>
                          <div className="text-white/90 text-lg">
                            Average Rating
                          </div>
                          <div className="flex justify-center mt-2">
                            {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className={`fas fa-star text-lg ${
                                  i < Math.floor(stats.averageRating || 0)
                                    ? "text-yellow-300"
                                    : "text-white/30"
                                }`}
                              ></i>
                            ))}
                          </div>
                        </div>
                        <div className="group">
                          <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                            98%
                          </div>
                          <div className="text-white/90 text-lg">
                            Satisfaction Rate
                          </div>
                          <div className="w-16 h-1 bg-white/30 mx-auto mt-2 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Reviews Grid with Different Layouts */}
                    <div className="space-y-8">
                      {reviews.map((review, index) => {
                        const layoutVariants = [
                          "premium-testimonial",
                          "modern-review",
                          "elegant-feedback",
                          "vibrant-comment",
                          "classic-review",
                        ];
                        const variant =
                          layoutVariants[index % layoutVariants.length];

                        // Premium Testimonial Layout
                        if (variant === "premium-testimonial") {
                          return (
                            <div
                              key={index}
                              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 p-8 hover:shadow-2xl transition-all duration-700 border-2 border-indigo-200 dark:border-indigo-800"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              <div className="absolute top-4 right-4 w-20 h-20 bg-indigo-100 dark:bg-indigo-800/30 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>

                              <div className="relative z-10">
                                <div className="flex items-start space-x-6">
                                  {/* Avatar Section */}
                                  <div className="flex-shrink-0">
                                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:rotate-12 transition-transform duration-500">
                                      {(review.userName || "A")
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                    <div className="text-center mt-3">
                                      <div className="flex justify-center space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                          <i
                                            key={i}
                                            className={`fas fa-star text-lg ${
                                              i < review.rating
                                                ? "text-yellow-400"
                                                : "text-gray-300 dark:text-gray-600"
                                            }`}
                                          ></i>
                                        ))}
                                      </div>
                                      <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                                        {review.rating}/5 Stars
                                      </div>
                                    </div>
                                  </div>

                                  {/* Content Section */}
                                  <div className="flex-1">
                                    <div className="mb-4">
                                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {review.userName ||
                                          "Anonymous Customer"}
                                      </h4>
                                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center">
                                          <i className="fas fa-box mr-2 text-purple-500"></i>
                                          {review.productName}
                                        </span>
                                        <span className="flex items-center">
                                          <i className="fas fa-calendar mr-2 text-indigo-500"></i>
                                          {new Date(
                                            review.createdAt,
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="relative">
                                      <div className="absolute -top-2 -left-2 text-6xl text-indigo-200 dark:text-indigo-800 opacity-50">
                                        <i className="fas fa-quote-left"></i>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed italic pl-8 pr-4">
                                        {review.comment}
                                      </p>
                                      <div className="absolute -bottom-2 -right-2 text-6xl text-indigo-200 dark:text-indigo-800 opacity-50 transform rotate-180">
                                        <i className="fas fa-quote-left"></i>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Modern Review Layout
                        if (variant === "modern-review") {
                          return (
                            <div
                              key={index}
                              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 border-l-8 border-emerald-500"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                              <div className="relative z-10 p-8">
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                      {(review.userName || "A")
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                    <div>
                                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {review.userName ||
                                          "Anonymous Customer"}
                                      </h4>
                                      <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                                        Verified Purchase
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="flex items-center space-x-1 justify-end mb-2">
                                      {[...Array(5)].map((_, i) => (
                                        <i
                                          key={i}
                                          className={`fas fa-star text-xl ${
                                            i < review.rating
                                              ? "text-yellow-400"
                                              : "text-gray-300 dark:text-gray-600"
                                          }`}
                                        ></i>
                                      ))}
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                                      {new Date(
                                        review.createdAt,
                                      ).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <div className="inline-flex items-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-sm font-medium">
                                    <i className="fas fa-leaf mr-2"></i>
                                    {review.productName}
                                  </div>
                                </div>

                                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                                  {review.comment}
                                </p>
                              </div>
                            </div>
                          );
                        }

                        // Elegant Feedback Layout
                        if (variant === "elegant-feedback") {
                          return (
                            <div
                              key={index}
                              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 dark:from-rose-900/20 dark:via-pink-900/20 dark:to-red-900/20 p-8 hover:shadow-2xl transition-all duration-700 border border-rose-200 dark:border-rose-800"
                            >
                              <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-100 dark:bg-rose-800/30 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-700"></div>

                              <div className="relative z-10">
                                <div className="text-center mb-6">
                                  <div className="w-24 h-24 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:rotate-12 transition-transform duration-500">
                                    <i className="fas fa-heart text-white text-2xl"></i>
                                  </div>
                                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {review.userName || "Happy Customer"}
                                  </h4>
                                  <div className="flex justify-center space-x-1 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                      <i
                                        key={i}
                                        className={`fas fa-star text-2xl ${
                                          i < review.rating
                                            ? "text-yellow-400"
                                            : "text-gray-300 dark:text-gray-600"
                                        }`}
                                      ></i>
                                    ))}
                                  </div>
                                  <div className="inline-flex items-center bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 px-4 py-2 rounded-full text-sm font-medium">
                                    <i className="fas fa-apple-alt mr-2"></i>
                                    {review.productName}
                                  </div>
                                </div>

                                <div className="text-center">
                                  <p className="text-gray-700 dark:text-gray-300 text-xl leading-relaxed italic font-light">
                                    "{review.comment}"
                                  </p>
                                  <div className="mt-6 text-gray-500 dark:text-gray-400 text-sm">
                                    <i className="fas fa-calendar-alt mr-2"></i>
                                    {new Date(
                                      review.createdAt,
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Vibrant Comment Layout
                        if (variant === "vibrant-comment") {
                          return (
                            <div
                              key={index}
                              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 p-8 hover:shadow-2xl transition-all duration-500 text-white"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full transform translate-x-20 -translate-y-20 group-hover:scale-150 transition-transform duration-700"></div>

                              <div className="relative z-10">
                                <div className="flex items-start space-x-6">
                                  <div className="flex-shrink-0">
                                    <div className="w-18 h-18 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                                      {(review.userName || "A")
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                      <div>
                                        <h4 className="text-xl font-bold mb-1">
                                          {review.userName || "Valued Customer"}
                                        </h4>
                                        <div className="flex items-center space-x-1">
                                          {[...Array(5)].map((_, i) => (
                                            <i
                                              key={i}
                                              className={`fas fa-star ${
                                                i < review.rating
                                                  ? "text-yellow-300"
                                                  : "text-white/30"
                                              }`}
                                            ></i>
                                          ))}
                                          <span className="ml-2 text-white/90">
                                            ({review.rating}/5)
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right text-white/80 text-sm">
                                        {new Date(
                                          review.createdAt,
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>

                                    <div className="mb-4">
                                      <span className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                                        <i className="fas fa-tag mr-2"></i>
                                        {review.productName}
                                      </span>
                                    </div>

                                    <p className="text-white/95 text-lg leading-relaxed">
                                      {review.comment}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Classic Review Layout (Default)
                        return (
                          <div
                            key={index}
                            className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-700/50 dark:to-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <div className="relative z-10 p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-slate-500 rounded-lg flex items-center justify-center text-white font-bold">
                                    {(review.userName || "A")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                      {review.userName || "Anonymous Customer"}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {review.productName}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="flex items-center space-x-1 mb-1">
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
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(
                                      review.createdAt,
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {review.comment}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Customer Satisfaction Footer */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-8 mt-12 border border-green-200 dark:border-green-800">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                          <i className="fas fa-thumbs-up text-white text-3xl"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          Thank You for Your Trust! 🙏
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                          Your feedback helps us grow better produce and serve
                          our community with excellence. Every review makes a
                          difference in our farming journey.
                        </p>
                        <div className="mt-6 flex justify-center space-x-8">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                              100%
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-sm">
                              Fresh Guarantee
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                              24/7
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-sm">
                              Customer Support
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                              Fast
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-sm">
                              Delivery
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                      <i className="fas fa-comment-dots text-6xl text-purple-400 dark:text-purple-300"></i>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      No Reviews Yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xl max-w-md mx-auto leading-relaxed mb-8">
                      Be the first to share your experience with our fresh
                      produce! Your feedback helps us serve you better.
                    </p>
                    <div className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <i className="fas fa-star mr-3"></i>
                      Leave the First Review
                      <i className="fas fa-arrow-right ml-3"></i>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "stats" && (
              <div className="space-y-8">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6">
                    🌟 Farm Analytics Dashboard 🌟
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
                    Discover the comprehensive insights behind our farm's
                    productivity, community impact, and sustainable growth
                    journey.
                  </p>
                </div>

                {/* Primary Statistics Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                  {/* Holographic Products Card */}
                  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20 p-8 hover:shadow-2xl transition-all duration-700 border border-emerald-200 dark:border-emerald-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-4 right-4 w-16 h-16 bg-emerald-100 dark:bg-emerald-800/30 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 shadow-lg">
                          <i className="fas fa-seedling text-2xl text-white"></i>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                            {stats.totalProducts}
                          </div>
                          <div className="text-emerald-500 dark:text-emerald-300 text-sm font-medium">
                            Total Products
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                          <span>Active Items</span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {stats.activeProducts}
                          </span>
                        </div>
                        <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-1000 shadow-sm"
                            style={{
                              width: `${(stats.activeProducts / stats.totalProducts) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                          {(
                            (stats.activeProducts / stats.totalProducts) *
                            100
                          ).toFixed(0)}
                          % availability rate
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Crystal Inventory Card */}
                  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-indigo-900/20 p-8 hover:shadow-2xl transition-all duration-700 border border-blue-200 dark:border-blue-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 dark:bg-blue-800/30 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-700"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 shadow-lg">
                          <i className="fas fa-boxes text-2xl text-white"></i>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                            {stats.totalStock}
                          </div>
                          <div className="text-blue-500 dark:text-blue-300 text-sm font-medium">
                            Items in Stock
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-white/50 dark:bg-blue-900/20 rounded-xl">
                          <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                            {stats.categories?.length || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Categories
                          </div>
                        </div>
                        <div className="text-center p-3 bg-white/50 dark:bg-blue-900/20 rounded-xl">
                          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            ${stats.averagePrice}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Avg Price
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prismatic Community Impact */}
                  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20 p-8 hover:shadow-2xl transition-all duration-700 border border-purple-200 dark:border-purple-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 bg-purple-100 dark:bg-purple-800/30 rounded-full opacity-30 group-hover:animate-pulse"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-45 transition-transform duration-500 shadow-lg">
                          <i className="fas fa-users text-2xl text-white"></i>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                            {stats.familiesServed}+
                          </div>
                          <div className="text-purple-500 dark:text-purple-300 text-sm font-medium">
                            Families Served
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                          <span>Monthly Impact</span>
                          <span className="font-bold text-pink-600 dark:text-pink-400">
                            Community
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                          </div>
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                            Growing
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Luminous Performance */}
                  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20 p-8 hover:shadow-2xl transition-all duration-700 border border-amber-200 dark:border-amber-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-0 left-0 w-24 h-24 bg-amber-100 dark:bg-amber-800/30 rounded-full opacity-20 transform -translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 shadow-lg">
                          <i className="fas fa-star text-2xl text-white"></i>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                            {stats.averageRating || "N/A"}
                          </div>
                          <div className="text-amber-500 dark:text-amber-300 text-sm font-medium">
                            Average Rating
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                          <span>Total Reviews</span>
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            {stats.totalReviews}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`fas fa-star text-lg ${
                                i < Math.floor(stats.averageRating || 0)
                                  ? "text-amber-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            ></i>
                          ))}
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            ({stats.averageRating}/5.0)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Farm Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                  {/* Experience Showcase */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 hover:shadow-xl transition-all duration-500 border-l-4 border-indigo-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                          <i className="fas fa-clock text-white text-lg"></i>
                        </div>
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {stats.yearsOfExperience}+
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Years of Experience
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Dedicated farming expertise
                      </p>
                    </div>
                  </div>

                  {/* Farm Size Display */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-6 hover:shadow-xl transition-all duration-500 border-l-4 border-green-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <i className="fas fa-map text-white text-lg"></i>
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {stats.farmSize || "5"} {stats.farmSizeUnit}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Farm Size
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Total cultivated area
                      </p>
                    </div>
                  </div>

                  {/* Certification Status */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 p-6 hover:shadow-xl transition-all duration-500 border-l-4 border-blue-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center transform group-hover:bounce transition-transform duration-300">
                          <i className="fas fa-certificate text-white text-lg"></i>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            stats.certificationStatus === "Certified"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {stats.certificationStatus}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Certification
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Quality assurance status
                      </p>
                    </div>
                  </div>

                  {/* Farming Methods */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 p-6 hover:shadow-xl transition-all duration-500 border-l-4 border-orange-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center transform group-hover:rotate-45 transition-transform duration-300">
                          <i className="fas fa-leaf text-white text-lg"></i>
                        </div>
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                          {stats.farmingMethods?.length || 2}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Methods Used
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Sustainable practices
                      </p>
                    </div>
                  </div>
                </div>

                {/* Revenue Analytics Section */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/50 rounded-3xl p-8 mb-12 border border-slate-200 dark:border-slate-700">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      📊 Revenue Analytics
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Financial performance and growth metrics
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Monthly Revenue */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                            <i className="fas fa-calendar-alt text-emerald-600 dark:text-emerald-400"></i>
                          </div>
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-medium">
                            This Month
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                          ${stats.monthlyRevenue}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          Monthly Revenue
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Current month earnings
                        </p>
                      </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full transform -translate-x-12 translate-y-12 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <i className="fas fa-chart-line text-blue-600 dark:text-blue-400"></i>
                          </div>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                            All Time
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          ${stats.totalRevenue}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          Total Revenue
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Lifetime earnings
                        </p>
                      </div>
                    </div>

                    {/* Inventory Value */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="absolute top-1/2 right-0 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                            <i className="fas fa-warehouse text-purple-600 dark:text-purple-400"></i>
                          </div>
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full font-medium">
                            Current
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                          ${stats.inventoryValue}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          Inventory Value
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Stock worth
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Farming Methods Showcase */}
                {stats.farmingMethods && stats.farmingMethods.length > 0 && (
                  <div className="mb-12">
                    <div className="text-center mb-8">
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        🌱 Our Farming Philosophy
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Sustainable and innovative agricultural practices
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {stats.farmingMethods.map((method, index) => {
                        const config = methodConfig[method] || {
                          icon: "fas fa-tractor",
                          color: "text-gray-600 dark:text-gray-400",
                          description: "Specialized farming technique",
                        };

                        return (
                          <div
                            key={index}
                            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border-t-4 border-green-500"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10 text-center">
                              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <i
                                  className={`${config.icon} text-4xl ${config.color}`}
                                ></i>
                              </div>
                              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                {method}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {config.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Growth Metrics Footer */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-6">
                      🚀 Growth Trajectory
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="group">
                        <div className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                          {(
                            (stats.activeProducts / stats.totalProducts) *
                            100
                          ).toFixed(0)}
                          %
                        </div>
                        <div className="text-white/90">
                          Product Availability
                        </div>
                      </div>
                      <div className="group">
                        <div className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                          {stats.familiesServed}+
                        </div>
                        <div className="text-white/90">Community Reach</div>
                      </div>
                      <div className="group">
                        <div className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                          {stats.averageRating || "4.8"}★
                        </div>
                        <div className="text-white/90">
                          Customer Satisfaction
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
