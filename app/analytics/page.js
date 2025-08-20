"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  FunnelChart,
  Funnel,
  LabelList,
  ScatterChart,
  Scatter,
  Line,
} from "recharts";

// Nivo imports
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ArcElement,
  RadialLinearScale,
  BarElement,
} from "chart.js";
import { Doughnut, PolarArea, Bubble } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement,
  RadialLinearScale,
  BarElement,
);

import Footer from "@/components/Footer";
import AnalyticsLoadingSkeleton from "@/components/analytics/AnalyticsLoadingSkeleton";
import { useOrdersQuery } from "@/hooks/useOrdersQuery";

const COLORS = [
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
];

export default function CustomerAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [productCategories, setProductCategories] = useState({});

  const userId =
    session?.user?.userId || session?.user?.id || session?.user?._id;

  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
  } = useOrdersQuery(userId, {
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const [timeRange, setTimeRange] = useState("all");

  // Fetch product categories for mapping
  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        console.log("Analytics: Fetching product categories...");
        const response = await fetch("/api/products?limit=1000", {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Analytics: Product categories fetched successfully");
          console.log("Analytics: Product categories response:", data); // Add debugging
          const categoryMap = {};
          data.products?.forEach((product) => {
            if (product._id && product.category) {
              categoryMap[product._id] = product.category;
            }
          });
          console.log("Analytics: Category mapping created:", categoryMap); // Add debugging
          setProductCategories(categoryMap);
        } else {
          console.error(
            "Analytics: Failed to fetch product categories:",
            response.status,
            response.statusText,
          );
        }
      } catch (error) {
        console.error("Error fetching product categories:", error);
      }
    };

    fetchProductCategories();
  }, []);

  // Debug: Log orders data to compare with bookings page
  useEffect(() => {
    if (ordersData?.orders) {
      console.log("Analytics: Total orders fetched:", ordersData.orders.length);
      console.log("Analytics: Sample order data:", ordersData.orders[0]);

      // Check for any orders without valid data
      const invalidOrders = ordersData.orders.filter(
        (order) => !order._id || !order.createdAt || !order.items?.length,
      );
      if (invalidOrders.length > 0) {
        console.warn("Analytics: Found invalid orders:", invalidOrders.length);
      }
    }
  }, [ordersData]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const orders = useMemo(() => {
    return ordersData?.orders || [];
  }, [ordersData]);

  const filteredOrders = useMemo(() => {
    if (timeRange === "all") {
      return orders;
    }

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case "1month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "1year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return orders;
    }

    return orders.filter((order) => new Date(order.createdAt) >= cutoffDate);
  }, [orders, timeRange]);

  // Enhanced analytics data with more complex calculations
  const analyticsData = useMemo(() => {
    // Don't return null during loading - let the loading skeleton show instead
    if (ordersLoading) return null;
    if (!filteredOrders.length) return null;

    const monthlyData = {};
    const categoryData = {};
    const farmerData = {};
    const dailyData = {};
    const hourlyData = {};
    const seasonalData = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };
    const priceRangeData = {};

    const totalOrders = filteredOrders.length;
    const totalSpending = filteredOrders.reduce(
      (sum, order) => sum + (parseFloat(order.total) || 0),
      0,
    );

    // Heat map data for order patterns - Fixed structure for Nivo
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hourLabels = Array.from({ length: 24 }, (_, i) => i);

    // Initialize heat map with proper Nivo structure
    const heatMapMatrix = {};
    dayNames.forEach((day) => {
      heatMapMatrix[day] = {};
      hourLabels.forEach((hour) => {
        heatMapMatrix[day][hour] = 0;
      });
    });

    filteredOrders.forEach((order) => {
      const isCompletedOrder = ["delivered", "completed", "confirmed"].includes(
        order.status,
      );
      const date = new Date(order.createdAt);
      const month = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const day = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const weekDay = dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1];
      const hour = date.getHours();
      const total = parseFloat(order.total) || 0;

      // Heat map data - increment count for this day/hour combination
      if (
        heatMapMatrix[weekDay] &&
        heatMapMatrix[weekDay][hour] !== undefined
      ) {
        heatMapMatrix[weekDay][hour] += 1;
      }

      // Seasonal analysis
      const month_num = date.getMonth();
      if (month_num >= 2 && month_num <= 4) seasonalData.Spring += total;
      else if (month_num >= 5 && month_num <= 7) seasonalData.Summer += total;
      else if (month_num >= 8 && month_num <= 10) seasonalData.Fall += total;
      else seasonalData.Winter += total;

      // Price range analysis
      const priceRange =
        total < 500
          ? "<৳500"
          : total < 1000
            ? "৳500-1000"
            : total < 2000
              ? "৳1000-2000"
              : total < 5000
                ? "৳2000-5000"
                : "৳5000+";

      if (!priceRangeData[priceRange]) {
        priceRangeData[priceRange] = {
          range: priceRange,
          orders: 0,
          spending: 0,
        };
      }
      priceRangeData[priceRange].orders += 1;
      priceRangeData[priceRange].spending += total;

      // Hour analysis
      const hourKey = `${hour}:00`;
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { hour: hourKey, orders: 0, spending: 0 };
      }
      hourlyData[hourKey].orders += 1;
      hourlyData[hourKey].spending += total;

      if (isCompletedOrder) {
        if (!monthlyData[month]) {
          monthlyData[month] = { month, spending: 0, orders: 0, items: 0 };
        }
        monthlyData[month].spending += total;
        monthlyData[month].orders += 1;
        monthlyData[month].items += order.items?.length || 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (date >= thirtyDaysAgo) {
          if (!dailyData[day]) {
            dailyData[day] = { day, spending: 0, orders: 0 };
          }
          dailyData[day].spending += total;
          dailyData[day].orders += 1;
        }
      }

      order.items?.forEach((item) => {
        // Enhanced category extraction using fetched product categories
        console.log("DEBUG - Item structure:", item); // Add debugging

        // First try to get category from the productCategories mapping using productId
        let category = null;

        if (item.productId && productCategories[item.productId]) {
          category = productCategories[item.productId];
        } else {
          // Enhanced fallback logic with intelligent categorization
          category =
            item.product?.category ||
            item.category ||
            item.productCategory ||
            item.product?.productCategory ||
            item.categoryName ||
            item.product?.categoryName ||
            item.type ||
            item.product?.type;

          // If still no category, try to infer from product name
          if (!category) {
            const productName = (
              item.product?.name ||
              item.name ||
              item.productName ||
              ""
            ).toLowerCase();

            // Intelligent category inference based on product names
            if (
              productName.includes("egg") ||
              productName.includes("milk") ||
              productName.includes("cheese") ||
              productName.includes("dairy")
            ) {
              category = "Dairy & Protein";
            } else if (
              productName.includes("mango") ||
              productName.includes("guava") ||
              productName.includes("fruit") ||
              productName.includes("apple") ||
              productName.includes("banana")
            ) {
              category = "Fruits";
            } else if (
              productName.includes("cucumber") ||
              productName.includes("cauliflower") ||
              productName.includes("corn") ||
              productName.includes("vegetable") ||
              productName.includes("carrot") ||
              productName.includes("tomato")
            ) {
              category = "Vegetables";
            } else if (
              productName.includes("wheat") ||
              productName.includes("grain") ||
              productName.includes("rice") ||
              productName.includes("oat")
            ) {
              category = "Grains";
            } else if (
              productName.includes("herb") ||
              productName.includes("spice") ||
              productName.includes("mint") ||
              productName.includes("basil")
            ) {
              category = "Herbs & Spices";
            } else {
              category = "Other";
            }
          }
        }

        console.log("DEBUG - Extracted category:", category); // Add debugging

        const itemPrice =
          parseFloat(item.price) || parseFloat(item.subtotal) || 0;
        const itemQuantity = parseInt(item.quantity) || 1;
        const itemTotal = itemPrice * itemQuantity;

        if (!categoryData[category]) {
          categoryData[category] = {
            category,
            spending: 0,
            quantity: 0,
            orders: 0,
          };
        }
        categoryData[category].spending += itemTotal;
        categoryData[category].quantity += itemQuantity;
        categoryData[category].orders += 1;

        const farmerName =
          item.farmerName ||
          item.farmer?.name ||
          item.product?.farmer?.name ||
          item.product?.farmerName ||
          "Unknown Farmer";
        if (!farmerData[farmerName]) {
          farmerData[farmerName] = {
            farmer: farmerName,
            spending: 0,
            orders: 0,
            products: new Set(),
          };
        }
        farmerData[farmerName].spending += itemTotal;
        farmerData[farmerName].orders += 1;
        farmerData[farmerName].products.add(
          item.product?.name ||
            item.name ||
            item.productName ||
            "Unknown Product",
        );
      });
    });

    // Convert heat map matrix to Nivo format
    const heatMapData = dayNames.map((day) => ({
      id: day,
      data: hourLabels.map((hour) => ({
        x: hour,
        y: heatMapMatrix[day][hour] || 0,
      })),
    }));

    // Convert to arrays
    const monthlyArray = Object.values(monthlyData).sort(
      (a, b) => new Date(a.month) - new Date(b.month),
    );
    const dailyArray = Object.values(dailyData).sort(
      (a, b) => new Date(a.day) - new Date(b.day),
    );
    const categoryArray = Object.values(categoryData).sort(
      (a, b) => b.spending - a.spending,
    );
    const farmerArray = Object.values(farmerData)
      .map((farmer) => ({ ...farmer, products: farmer.products.size }))
      .sort((a, b) => b.spending - a.spending);
    const hourlyArray = Object.values(hourlyData).sort(
      (a, b) => parseInt(a.hour) - parseInt(b.hour),
    );
    const priceRangeArray = Object.values(priceRangeData);
    const seasonalArray = Object.entries(seasonalData).map(
      ([season, spending]) => ({ season, spending }),
    );

    const avgOrderValue = totalOrders > 0 ? totalSpending / totalOrders : 0;
    const totalItems = filteredOrders.reduce(
      (sum, order) => sum + (order.items?.length || 0),
      0,
    );

    return {
      monthly: monthlyArray,
      daily: dailyArray,
      categories: categoryArray,
      farmers: farmerArray,
      hourly: hourlyArray,
      seasonal: seasonalArray,
      priceRanges: priceRangeArray,
      heatMap: heatMapData,
      totals: {
        spending: totalSpending,
        orders: totalOrders,
        avgOrderValue,
        items: totalItems,
        avgItemsPerOrder: totalOrders > 0 ? totalItems / totalOrders : 0,
      },
    };
  }, [filteredOrders, productCategories]);

  const formatPrice = (value) => `৳${value?.toFixed(0) || 0}`;

  // Chart.js configurations
  const doughnutData = {
    labels:
      analyticsData?.categories.slice(0, 6).map((cat) => cat.category) || [],
    datasets: [
      {
        data:
          analyticsData?.categories.slice(0, 6).map((cat) => cat.spending) ||
          [],
        backgroundColor: COLORS.slice(0, 6),
        borderColor: COLORS.slice(0, 6),
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const polarAreaData = {
    labels: analyticsData?.seasonal.map((s) => s.season) || [],
    datasets: [
      {
        data: analyticsData?.seasonal.map((s) => s.spending) || [],
        backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"],
        borderColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"],
        borderWidth: 2,
      },
    ],
  };

  const bubbleData = {
    datasets: [
      {
        label: "Farmer Performance",
        data:
          analyticsData?.farmers.slice(0, 10).map((farmer, index) => ({
            x: farmer.orders,
            y: farmer.spending,
            r: farmer.products * 3,
          })) || [],
        backgroundColor: COLORS.slice(0, 10).map((color) => color + "80"),
        borderColor: COLORS.slice(0, 10),
        borderWidth: 2,
      },
    ],
  };

  if (ordersLoading || status === "loading")
    return <AnalyticsLoadingSkeleton />;
  if (ordersError)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Error loading analytics data
      </div>
    );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Enhanced Header */}
        <div className="bg-white dark:bg-gray-800 shadow-2xl border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Advanced Analytics Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Deep insights into your shopping patterns with advanced
                  visualizations
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* Chart Type Selector */}
                <div className="flex gap-3">
                  {[
                    { value: "overview", label: "Overview" },
                    { value: "advanced", label: "Advanced" },
                    { value: "patterns", label: "Patterns" },
                    { value: "comparison", label: "Comparison" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setActiveTab(type.value)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        activeTab === type.value
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-3">
                  {[
                    { value: "all", label: "All Time" },
                    { value: "1month", label: "1 Month" },
                    { value: "3months", label: "3 Months" },
                    { value: "6months", label: "6 Months" },
                    { value: "1year", label: "1 Year" },
                  ].map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setTimeRange(range.value)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        timeRange === range.value
                          ? "bg-green-600 text-white shadow-lg"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {analyticsData ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Enhanced Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-3xl p-6 shadow-xl border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Total Spending
                    </p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                      {formatPrice(analyticsData.totals.spending)}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Avg: {formatPrice(analyticsData.totals.avgOrderValue)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-200 dark:bg-green-800 rounded-2xl">
                    <i className="fas fa-wallet text-green-700 text-2xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-3xl p-6 shadow-xl border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total Orders
                    </p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                      {analyticsData.totals.orders}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {analyticsData.categories.length} categories
                    </p>
                  </div>
                  <div className="p-4 bg-blue-200 dark:bg-blue-800 rounded-2xl">
                    <i className="fas fa-shopping-bag text-blue-700 text-2xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-3xl p-6 shadow-xl border border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Items Bought
                    </p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                      {analyticsData.totals.items}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      {analyticsData.totals.avgItemsPerOrder.toFixed(1)} per
                      order
                    </p>
                  </div>
                  <div className="p-4 bg-purple-200 dark:bg-purple-800 rounded-2xl">
                    <i className="fas fa-box text-purple-700 text-2xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-3xl p-6 shadow-xl border border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Active Farmers
                    </p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                      {analyticsData.farmers.length}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      {analyticsData.farmers[0]?.farmer.split(" ")[0] || "None"}{" "}
                      is top
                    </p>
                  </div>
                  <div className="p-4 bg-orange-200 dark:bg-orange-800 rounded-2xl">
                    <i className="fas fa-users text-orange-700 text-2xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-3xl p-6 shadow-xl border border-pink-200 dark:border-pink-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-pink-600 dark:text-pink-400">
                      Top Category
                    </p>
                    <p className="text-lg font-bold text-pink-700 dark:text-pink-300">
                      {analyticsData.categories[0]?.category || "N/A"}
                    </p>
                    <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                      {formatPrice(analyticsData.categories[0]?.spending || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-pink-200 dark:bg-pink-800 rounded-2xl">
                    <i className="fas fa-crown text-pink-700 text-2xl"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Nivo Treemap for Categories */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-sitemap mr-3 text-green-600"></i>
                    Category Spending Treemap
                  </h3>
                  <div style={{ height: "400px" }}>
                    <ResponsiveTreeMap
                      data={{
                        id: "categories",
                        children: analyticsData.categories
                          .slice(0, 10)
                          .map((cat, index) => ({
                            id: cat.category,
                            value: cat.spending,
                            // Remove the custom color property to let Nivo handle it
                          })),
                      }}
                      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      labelSkipSize={12}
                      labelTextColor="#ffffff"
                      parentLabelTextColor="#ffffff"
                      borderColor="#ffffff"
                      borderWidth={3}
                      colors={{ scheme: "dark2" }}
                      colorBy="id"
                      animate={true}
                      motionConfig="gentle"
                      enableLabel={true}
                      labelFormat={(value) => formatPrice(value)}
                      tooltip={({ id, value }) => (
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg">
                          <strong>{id}</strong>
                          <br />
                          Spending: {formatPrice(value)}
                        </div>
                      )}
                    />
                  </div>
                </div>

                {/* Chart.js Doughnut Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-chart-pie mr-3 text-purple-600"></i>
                    Advanced Category Distribution
                  </h3>
                  <div
                    style={{
                      height: "400px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Doughnut
                      data={doughnutData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: {
                              padding: 20,
                              usePointStyle: true,
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                `${context.label}: ${formatPrice(context.parsed)}`,
                            },
                          },
                        },
                        cutout: "60%",
                        animation: {
                          animateRotate: true,
                          animateScale: true,
                        },
                      }}
                    />
                  </div>
                </div>

                {/* Nivo Radar Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-radar mr-3 text-blue-600"></i>
                    Shopping Pattern Radar
                  </h3>
                  <div style={{ height: "400px" }}>
                    <ResponsiveRadar
                      data={analyticsData.categories.slice(0, 6).map((cat) => ({
                        category: cat.category,
                        spending: Math.min(cat.spending / 100, 100),
                        orders: cat.orders * 10,
                        quantity: Math.min(cat.quantity, 100),
                      }))}
                      keys={["spending", "orders", "quantity"]}
                      indexBy="category"
                      maxValue="auto"
                      margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
                      curve="linearClosed"
                      borderWidth={2}
                      borderColor={{ from: "color" }}
                      gridLevels={5}
                      gridShape="circular"
                      gridLabelOffset={36}
                      enableDots={true}
                      dotSize={8}
                      dotColor={{ theme: "background" }}
                      dotBorderWidth={2}
                      colors={{ scheme: "nivo" }}
                      blendMode="multiply"
                      animate={true}
                      motionConfig="wobbly"
                      legends={[
                        {
                          anchor: "top-left",
                          direction: "column",
                          translateX: -50,
                          translateY: -40,
                          itemWidth: 80,
                          itemHeight: 20,
                          itemTextColor: "#999",
                          symbolSize: 12,
                          symbolShape: "circle",
                        },
                      ]}
                    />
                  </div>
                </div>

                {/* Chart.js Polar Area */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-sun mr-3 text-orange-600"></i>
                    Seasonal Spending Analysis
                  </h3>
                  <div
                    style={{
                      height: "400px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <PolarArea
                      data={polarAreaData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: {
                              padding: 20,
                              usePointStyle: true,
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                `${context.label}: ${formatPrice(context.parsed.r)}`,
                            },
                          },
                        },
                        scales: {
                          r: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => formatPrice(value),
                            },
                          },
                        },
                        animation: {
                          animateRotate: true,
                          animateScale: true,
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "advanced" && (
              <div className="space-y-8">
                {/* Heat Map */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-fire mr-3 text-red-600"></i>
                    Order Activity Heatmap
                  </h3>
                  <div style={{ height: "400px" }}>
                    {analyticsData.heatMap &&
                    analyticsData.heatMap.length > 0 ? (
                      <ResponsiveHeatMap
                        data={analyticsData.heatMap}
                        margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
                        valueFormat=">-.0f"
                        axisTop={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: -90,
                          legend: "Hours",
                          legendPosition: "middle",
                          legendOffset: -50,
                        }}
                        axisRight={null}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: -90,
                          legend: "Hours",
                          legendPosition: "middle",
                          legendOffset: 50,
                        }}
                        axisLeft={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: "Days of Week",
                          legendPosition: "middle",
                          legendOffset: -60,
                        }}
                        colors={{
                          type: "sequential",
                          scheme: "blues",
                          minValue: 0,
                          maxValue: "auto",
                        }}
                        emptyColor="#f3f4f6"
                        borderRadius={3}
                        borderWidth={1}
                        borderColor="#ffffff"
                        labelTextColor="#ffffff"
                        animate={true}
                        motionConfig="gentle"
                        hoverTarget="cell"
                        cellHoverOthersOpacity={0.25}
                        tooltip={({ xKey, yKey, value }) => (
                          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg">
                            <strong>
                              {yKey} at {xKey}:00
                            </strong>
                            <br />
                            Orders: {value}
                          </div>
                        )}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <i className="fas fa-chart-line text-4xl mb-4"></i>
                          <p>No activity data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bubble Chart and Advanced Bar Chart */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                      <i className="fas fa-circle-nodes mr-3 text-cyan-600"></i>
                      Farmer Performance Bubble Chart
                    </h3>
                    <div
                      style={{
                        height: "400px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Bubble
                        data={bubbleData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const farmer =
                                    analyticsData.farmers[context.dataIndex];
                                  return [
                                    `Farmer: ${farmer.farmer}`,
                                    `Orders: ${context.parsed.x}`,
                                    `Spending: ${formatPrice(context.parsed.y)}`,
                                    `Products: ${farmer.products}`,
                                  ];
                                },
                              },
                            },
                          },
                          scales: {
                            x: {
                              title: {
                                display: true,
                                text: "Number of Orders",
                              },
                            },
                            y: {
                              title: {
                                display: true,
                                text: "Total Spending",
                              },
                              ticks: {
                                callback: (value) => formatPrice(value),
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                      <i className="fas fa-chart-column mr-3 text-indigo-600"></i>
                      Price Range Analysis
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={analyticsData.priceRanges}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="range" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          formatter={(value, name) => [
                            name === "spending" ? formatPrice(value) : value,
                            name === "spending"
                              ? "Total Spending"
                              : "Number of Orders",
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="orders" fill="#3B82F6" name="Orders" />
                        <Bar
                          dataKey="spending"
                          fill="#10B981"
                          name="Spending"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Funnel Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-filter mr-3 text-purple-600"></i>
                    Purchase Funnel Analysis
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <FunnelChart>
                      <Tooltip
                        formatter={(value, name) => [formatPrice(value), name]}
                      />
                      <Funnel
                        dataKey="spending"
                        data={analyticsData.categories
                          .slice(0, 5)
                          .map((cat, index) => ({
                            name: cat.category,
                            spending: cat.spending,
                            fill: COLORS[index],
                          }))}
                        isAnimationActive
                      >
                        <LabelList
                          position="center"
                          fill="#fff"
                          stroke="none"
                        />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === "patterns" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Hourly Pattern */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-clock mr-3 text-blue-600"></i>
                    Hourly Shopping Pattern
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={analyticsData.hourly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="hour" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "spending" ? formatPrice(value) : value,
                          name === "spending" ? "Spending" : "Orders",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="spending"
                        stackId="1"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stackId="2"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.8}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Trend Analysis */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-chart-line mr-3 text-green-600"></i>
                    Monthly Trend Analysis
                  </h3>
                  <div style={{ height: "400px" }}>
                    <ResponsiveLine
                      data={[
                        {
                          id: "spending",
                          data: analyticsData.monthly.map((month) => ({
                            x: month.month,
                            y: month.spending,
                          })),
                        },
                        {
                          id: "orders",
                          data: analyticsData.monthly.map((month) => ({
                            x: month.month,
                            y: month.orders * 100, // Scale for visibility
                          })),
                        },
                      ]}
                      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                      xScale={{ type: "point" }}
                      yScale={{
                        type: "linear",
                        min: "auto",
                        max: "auto",
                        stacked: false,
                        reverse: false,
                      }}
                      curve="cardinal"
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        orient: "bottom",
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: -45,
                        legend: "Month",
                        legendOffset: 45,
                        legendPosition: "middle",
                      }}
                      axisLeft={{
                        orient: "left",
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: "Value",
                        legendOffset: -40,
                        legendPosition: "middle",
                      }}
                      pointSize={10}
                      pointColor={{ theme: "background" }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: "serieColor" }}
                      pointLabelYOffset={-12}
                      useMesh={true}
                      colors={{ scheme: "category10" }}
                      animate={true}
                      motionConfig="gentle"
                      legends={[
                        {
                          anchor: "bottom-right",
                          direction: "column",
                          justify: false,
                          translateX: 100,
                          translateY: 0,
                          itemsSpacing: 0,
                          itemDirection: "left-to-right",
                          itemWidth: 80,
                          itemHeight: 20,
                          itemOpacity: 0.75,
                          symbolSize: 12,
                          symbolShape: "circle",
                          symbolBorderColor: "rgba(0, 0, 0, .5)",
                          effects: [
                            {
                              on: "hover",
                              style: {
                                itemBackground: "rgba(0, 0, 0, .03)",
                                itemOpacity: 1,
                              },
                            },
                          ],
                        },
                      ]}
                    />
                  </div>
                </div>

                {/* Complex Scatter Plot */}
                <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i className="fas fa-project-diagram mr-3 text-purple-600"></i>
                    Order Complexity vs Value Analysis
                  </h3>
                  <ResponsiveContainer width="100%" height={500}>
                    <ScatterChart
                      data={filteredOrders.map((order, index) => ({
                        orderId: `Order ${index + 1}`,
                        items: order.items?.length || 0,
                        spending: parseFloat(order.total) || 0,
                        month: new Date(order.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            year: "2-digit",
                          },
                        ),
                      }))}
                      margin={{ top: 20, right: 20, bottom: 80, left: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="items"
                        name="Items Count"
                        stroke="#6b7280"
                        label={{
                          value: "Number of Items per Order",
                          position: "insideBottom",
                          offset: -20,
                          style: { textAnchor: "middle" },
                        }}
                      />
                      <YAxis
                        dataKey="spending"
                        name="Order Value"
                        stroke="#6b7280"
                        tickFormatter={formatPrice}
                        label={{
                          value: "Order Value (৳)",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle" },
                        }}
                      />
                      <Tooltip
                        formatter={(value, name, props) => {
                          if (name === "spending") {
                            return [formatPrice(value), "Order Value"];
                          }
                          return [value, "Items Count"];
                        }}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return `${payload[0].payload.orderId} (${payload[0].payload.month})`;
                          }
                          return label;
                        }}
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Scatter
                        dataKey="spending"
                        fill="#8B5CF6"
                        fillOpacity={0.8}
                        stroke="#7C3AED"
                        strokeWidth={2}
                        r={6}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                    <p>
                      Each dot represents an order. Larger values indicate
                      higher-value orders with more items.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "comparison" && (
              <div className="space-y-8">
                {/* Multi-dimensional comparison */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                      <i className="fas fa-balance-scale mr-3 text-green-600"></i>
                      Category Performance Comparison
                    </h3>
                    <div style={{ height: "400px" }}>
                      <ResponsiveBar
                        data={analyticsData.categories.slice(0, 8)}
                        keys={["spending", "quantity"]}
                        indexBy="category"
                        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                        padding={0.3}
                        valueScale={{ type: "linear" }}
                        indexScale={{ type: "band", round: true }}
                        colors={{ scheme: "nivo" }}
                        borderColor={{
                          from: "color",
                          modifiers: [["darker", 1.6]],
                        }}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: -45,
                          legend: "Category",
                          legendPosition: "middle",
                          legendOffset: 45,
                        }}
                        axisLeft={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: "Value",
                          legendPosition: "middle",
                          legendOffset: -40,
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor={{
                          from: "color",
                          modifiers: [["darker", 1.6]],
                        }}
                        legends={[
                          {
                            dataFrom: "keys",
                            anchor: "bottom-right",
                            direction: "column",
                            justify: false,
                            translateX: 120,
                            translateY: 0,
                            itemsSpacing: 2,
                            itemWidth: 100,
                            itemHeight: 20,
                            itemDirection: "left-to-right",
                            itemOpacity: 0.85,
                            symbolSize: 20,
                            effects: [
                              {
                                on: "hover",
                                style: {
                                  itemOpacity: 1,
                                },
                              },
                            ],
                          },
                        ]}
                        animate={true}
                        motionConfig="gentle"
                      />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                      <i className="fas fa-chart-area mr-3 text-blue-600"></i>
                      Farmer Revenue Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={analyticsData.farmers.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="farmer"
                          stroke="#6b7280"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#6b7280"
                          tickFormatter={formatPrice}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#6b7280"
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            name === "spending" ? formatPrice(value) : value,
                            name === "spending"
                              ? "Total Spending"
                              : name === "orders"
                                ? "Orders"
                                : "Products",
                          ]}
                        />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="spending"
                          fill="#10B981"
                          name="Total Spending"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="orders"
                          stroke="#3B82F6"
                          strokeWidth={3}
                          name="Orders"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="products"
                          stroke="#8B5CF6"
                          strokeWidth={3}
                          name="Products"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Advanced Insights Panel */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 shadow-2xl border border-indigo-200 dark:border-indigo-700">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                    <i className="fas fa-brain mr-4 text-indigo-600"></i>
                    AI-Powered Shopping Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center">
                        <i className="fas fa-trophy mr-2"></i>
                        Top Performing Category
                      </h4>
                      <p className="text-green-700 dark:text-green-400 text-lg font-semibold">
                        {analyticsData.categories[0]?.category || "N/A"}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                        {formatPrice(
                          analyticsData.categories[0]?.spending || 0,
                        )}{" "}
                        total
                      </p>
                      <div className="mt-3 bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                        <p className="text-xs text-green-700 dark:text-green-400">
                          Represents{" "}
                          {(
                            (analyticsData.categories[0]?.spending /
                              analyticsData.totals.spending) *
                            100
                          ).toFixed(1)}
                          % of total spending
                        </p>
                      </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                        <i className="fas fa-user-star mr-2"></i>
                        Preferred Farmer
                      </h4>
                      <p className="text-blue-700 dark:text-blue-400 text-lg font-semibold">
                        {analyticsData.farmers[0]?.farmer || "N/A"}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-500 mt-2">
                        {analyticsData.farmers[0]?.orders || 0} orders
                      </p>
                      <div className="mt-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          {analyticsData.farmers[0]?.products || 0} different
                          products purchased
                        </p>
                      </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center">
                        <i className="fas fa-chart-trending-up mr-2"></i>
                        Shopping Frequency
                      </h4>
                      <p className="text-purple-700 dark:text-purple-400 text-lg font-semibold">
                        {analyticsData.monthly.length > 0
                          ? (
                              analyticsData.totals.orders /
                              analyticsData.monthly.length
                            ).toFixed(1)
                          : 0}{" "}
                        orders/month
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-500 mt-2">
                        Average activity
                      </p>
                      <div className="mt-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
                        <p className="text-xs text-purple-700 dark:text-purple-400">
                          {analyticsData.totals.avgItemsPerOrder.toFixed(1)}{" "}
                          items per order on average
                        </p>
                      </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-bold text-orange-800 dark:text-orange-300 mb-3 flex items-center">
                        <i className="fas fa-calendar-alt mr-2"></i>
                        Peak Season
                      </h4>
                      <p className="text-orange-700 dark:text-orange-400 text-lg font-semibold">
                        {analyticsData.seasonal.reduce(
                          (max, season) =>
                            season.spending > max.spending ? season : max,
                          analyticsData.seasonal[0],
                        )?.season || "N/A"}
                      </p>
                      <p className="text-sm text-orange-600 dark:text-orange-500 mt-2">
                        Highest spending season
                      </p>
                      <div className="mt-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg p-3">
                        <p className="text-xs text-orange-700 dark:text-orange-400">
                          {formatPrice(
                            analyticsData.seasonal.reduce(
                              (max, season) =>
                                season.spending > max.spending ? season : max,
                              analyticsData.seasonal[0],
                            )?.spending || 0,
                          )}{" "}
                          spent
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : !ordersLoading && !ordersError ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-2xl border border-gray-200 dark:border-gray-700">
              <i className="fas fa-chart-line text-8xl text-gray-400 mb-8"></i>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                No Analytics Data Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                Start your shopping journey to unlock powerful insights and
                visualizations!
              </p>
              <button
                onClick={() => router.push("/products")}
                className="px-10 py-4 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white rounded-2xl font-medium hover:from-green-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                Explore Products
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <Footer />
    </>
  );
}
