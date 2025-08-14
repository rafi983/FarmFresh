"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import { useOrdersQuery } from "@/hooks/useOrdersQuery";

const COLORS = [
  "#10B981", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#F59E0B", // Orange
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange-600
  "#EC4899", // Pink
  "#6366F1", // Indigo
];

export default function CustomerAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Use the same data fetching approach as bookings page
  const userId =
    session?.user?.userId || session?.user?.id || session?.user?._id;
  console.log("ANALYTICS DEBUG - Session:", session);
  console.log("ANALYTICS DEBUG - Session.user:", session?.user);
  console.log("ANALYTICS DEBUG - Status:", status);
  console.log("ANALYTICS DEBUG - UserId:", userId);
  console.log(
    "ANALYTICS DEBUG - Available user fields:",
    Object.keys(session?.user || {}),
  );

  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
  } = useOrdersQuery(userId, {
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  console.log("ANALYTICS DEBUG - useOrdersQuery state:", {
    ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    enabled: !!userId,
  });

  const [timeRange, setTimeRange] = useState("all");

  // Handle authentication redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Get orders from React Query and memoize to prevent dependency issues
  const orders = useMemo(() => {
    console.log("ANALYTICS DEBUG - Orders data:", ordersData);
    console.log("ANALYTICS DEBUG - Orders array:", ordersData?.orders);
    console.log("ANALYTICS DEBUG - Orders length:", ordersData?.orders?.length);
    return ordersData?.orders || [];
  }, [ordersData?.orders]);

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    // If "all" is selected, return ALL orders without any date filtering (like bookings page)
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
        return orders; // Default to all orders
    }

    return orders.filter((order) => new Date(order.createdAt) >= cutoffDate);
  }, [orders, timeRange]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    console.log("Calculating analytics from filtered orders:", filteredOrders);
    if (!filteredOrders.length) return null;

    // Monthly spending data
    const monthlyData = {};
    const categoryData = {};
    const farmerData = {};
    const dailyData = {};

    // Calculate totals first - MATCH BOOKINGS PAGE EXACTLY
    // Bookings page counts ALL orders regardless of status for total count
    const totalOrders = filteredOrders.length;
    const totalSpending = filteredOrders.reduce(
      (sum, order) => sum + (parseFloat(order.total) || 0), // Use order.total like bookings page
      0,
    );

    console.log("ANALYTICS DEBUG - Total calculation:");
    console.log(`Total orders: ${totalOrders}`);
    console.log(`Total spending: ${totalSpending}`);
    console.log(
      "Order totals:",
      filteredOrders.map((order) => ({
        id: order._id,
        total: order.total,
        status: order.status,
      })),
    );

    filteredOrders.forEach((order) => {
      // For charts, we still filter by completed statuses to show meaningful trends
      const isCompletedOrder =
        order.status === "delivered" ||
        order.status === "completed" ||
        order.status === "confirmed";

      const date = new Date(order.createdAt);
      const month = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const day = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      // Use order.total exactly like bookings page
      const total = parseFloat(order.total) || 0;

      // Monthly aggregation - only for completed orders (for meaningful charts)
      if (isCompletedOrder) {
        if (!monthlyData[month]) {
          monthlyData[month] = { month, spending: 0, orders: 0, items: 0 };
        }
        monthlyData[month].spending += total;
        monthlyData[month].orders += 1;
        monthlyData[month].items += order.items?.length || 0;

        // Daily aggregation (last 30 days) - only for completed orders
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

      // Category and farmer aggregation - include ALL orders like bookings
      order.items?.forEach((item) => {
        // Handle different category field locations
        const category =
          item.product?.category ||
          item.category ||
          item.productCategory ||
          "Other";
        // Handle different price/subtotal fields
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

        // Farmer aggregation
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

    // Convert to arrays and sort
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
      .map((farmer) => ({
        ...farmer,
        products: farmer.products.size,
      }))
      .sort((a, b) => b.spending - a.spending);

    const avgOrderValue = totalOrders > 0 ? totalSpending / totalOrders : 0;
    const totalItems = filteredOrders.reduce(
      (sum, order) => sum + (order.items?.length || 0),
      0,
    );

    console.log("Analytics calculated (MATCHING BOOKINGS):", {
      totalSpending,
      totalOrders,
      avgOrderValue,
      totalItems,
      monthlyData: monthlyArray.length,
      categories: categoryArray.length,
      farmers: farmerArray.length,
    });

    return {
      monthly: monthlyArray,
      daily: dailyArray,
      categories: categoryArray,
      farmers: farmerArray,
      totals: {
        spending: totalSpending, // This should now match bookings exactly
        orders: totalOrders, // This should now match bookings exactly
        avgOrderValue,
        items: totalItems,
        avgItemsPerOrder: totalOrders > 0 ? totalItems / totalOrders : 0,
      },
    };
  }, [filteredOrders]);

  // Custom tooltip formatter
  const formatPrice = (value) => `৳${value?.toFixed(0) || 0}`;

  if (ordersLoading) return <Loading />;
  if (ordersError)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Shopping Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Insights into your shopping patterns and preferences
                </p>
              </div>

              {/* Time Range Selector */}
              <div className="flex flex-wrap gap-3">
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

        {analyticsData ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Spending
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatPrice(analyticsData.totals.spending)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                    <i className="fas fa-wallet text-green-600 text-xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Orders
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {analyticsData.totals.orders}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                    <i className="fas fa-shopping-bag text-blue-600 text-xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Avg Order Value
                    </p>
                    <p className="text-3xl font-bold text-purple-600">
                      {formatPrice(analyticsData.totals.avgOrderValue)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                    <i className="fas fa-chart-line text-purple-600 text-xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Items
                    </p>
                    <p className="text-3xl font-bold text-orange-600">
                      {analyticsData.totals.items}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                    <i className="fas fa-box text-orange-600 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Monthly Spending Trend */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-chart-line mr-3 text-green-600"></i>
                  Monthly Spending Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis tickFormatter={formatPrice} stroke="#6b7280" />
                    <Tooltip
                      formatter={(value) => [formatPrice(value), "Spending"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="spending"
                      stroke="#10B981"
                      fill="url(#spendingGradient)"
                      strokeWidth={3}
                    />
                    <defs>
                      <linearGradient
                        id="spendingGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Orders vs Spending Correlation */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-chart-bar mr-3 text-blue-600"></i>
                  Orders vs Spending
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analyticsData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={formatPrice}
                      stroke="#6b7280"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#6b7280"
                    />
                    <Tooltip />
                    <Bar
                      yAxisId="left"
                      dataKey="spending"
                      fill="#3B82F6"
                      name="Spending"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#EF4444"
                      strokeWidth={3}
                      name="Orders"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Analysis */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Category Distribution Pie Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-chart-pie mr-3 text-purple-600"></i>
                  Spending by Category
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categories.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="spending"
                      nameKey="category"
                      label={({ category, spending }) =>
                        `${category}: ${formatPrice(spending)}`
                      }
                    >
                      {analyticsData.categories
                        .slice(0, 8)
                        .map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatPrice(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Quantity Analysis */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-boxes mr-3 text-orange-600"></i>
                  Items by Category
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analyticsData.categories.slice(0, 6)}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" />
                    <YAxis
                      dataKey="category"
                      type="category"
                      width={80}
                      stroke="#6b7280"
                    />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Activity & Farmer Analysis */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Daily Spending Pattern (Last 30 Days) */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-calendar-day mr-3 text-cyan-600"></i>
                  Daily Activity (Last 30 Days)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#6b7280" />
                    <YAxis tickFormatter={formatPrice} stroke="#6b7280" />
                    <Tooltip
                      formatter={(value) => [
                        formatPrice(value),
                        "Daily Spending",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="spending"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      dot={{ fill: "#06B6D4", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "#06B6D4" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Farmers */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-user-friends mr-3 text-green-600"></i>
                  Favorite Farmers
                </h3>
                <div className="space-y-4">
                  {analyticsData.farmers.slice(0, 5).map((farmer, index) => (
                    <div
                      key={farmer.farmer}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`}
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {farmer.farmer}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {farmer.orders} orders • {farmer.products} products
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-green-600">
                        {formatPrice(farmer.spending)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Shopping Pattern Radar */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-radar mr-3 text-indigo-600"></i>
                  Shopping Pattern Analysis
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart
                    data={analyticsData.categories.slice(0, 6).map((cat) => ({
                      category: cat.category,
                      spending: cat.spending / 100, // Normalize for better visualization
                      frequency: cat.orders,
                      quantity: cat.quantity / 10, // Normalize
                    }))}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Spending"
                      dataKey="spending"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Frequency"
                      dataKey="frequency"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                    />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Order Value Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <i className="fas fa-chart-scatter mr-3 text-pink-600"></i>
                  Order Value vs Items
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={analyticsData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="items" name="Items" stroke="#6b7280" />
                    <YAxis
                      dataKey="spending"
                      name="Spending"
                      tickFormatter={formatPrice}
                      stroke="#6b7280"
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "spending" ? formatPrice(value) : value,
                        name === "spending" ? "Spending" : "Items",
                      ]}
                    />
                    <Scatter dataKey="spending" fill="#EC4899" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Insights Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <i className="fas fa-lightbulb mr-3 text-yellow-500"></i>
                Shopping Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    Most Purchased Category
                  </h4>
                  <p className="text-green-700 dark:text-green-400">
                    {analyticsData.categories[0]?.category || "N/A"} -{" "}
                    {formatPrice(analyticsData.categories[0]?.spending || 0)}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    Favorite Farmer
                  </h4>
                  <p className="text-blue-700 dark:text-blue-400">
                    {analyticsData.farmers[0]?.farmer || "N/A"} -{" "}
                    {formatPrice(analyticsData.farmers[0]?.spending || 0)}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">
                    Shopping Frequency
                  </h4>
                  <p className="text-purple-700 dark:text-purple-400">
                    {(
                      analyticsData.totals.orders /
                      (analyticsData.monthly.length || 1)
                    ).toFixed(1)}{" "}
                    orders/month
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-xl border border-gray-200 dark:border-gray-700">
              <i className="fas fa-chart-line text-6xl text-gray-400 mb-6"></i>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Data Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Start shopping to see your analytics and insights!
              </p>
              <button
                onClick={() => router.push("/products")}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200"
              >
                Start Shopping
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
