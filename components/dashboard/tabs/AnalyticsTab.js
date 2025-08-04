// components/dashboard/tabs/AnalyticsTab.js
import { useMemo, useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Radar, PolarArea, Bubble, Chart } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function AnalyticsTab({
  analytics,
  orders,
  products,
  formatPrice,
  formatDate,
}) {
  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const validOrders = orders.filter(
      (order) => order.status !== "cancelled" && order.status !== "returned",
    );

    // First, group products by category
    const categorizedProducts = products.reduce((acc, product) => {
      const category = product.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});

    // Calculate stats for each category
    return Object.entries(categorizedProducts).reduce(
      (acc, [category, categoryProducts]) => {
        // Calculate basic product stats
        const count = categoryProducts.length;
        const active = categoryProducts.filter(
          (p) => p.status !== "inactive" && p.stock > 0,
        ).length;
        const totalStock = categoryProducts.reduce(
          (sum, p) => sum + (p.stock || 0),
          0,
        );

        // Calculate simple average price to match Top Categories display
        const avgPrice =
          count > 0
            ? categoryProducts.reduce((sum, p) => sum + (p.price || 0), 0) /
              count
            : 0;

        // Calculate revenue for this category from actual orders
        const categoryRevenue = validOrders.reduce((sum, order) => {
          if (!order.items) return sum;

          const categoryOrderItems = order.items.filter((item) => {
            // Check if this order item belongs to any product in this category
            return categoryProducts.some(
              (product) =>
                item.product?._id === product._id ||
                item.productId === product._id,
            );
          });

          return (
            sum +
            categoryOrderItems.reduce(
              (itemSum, item) =>
                itemSum + (item.price || 0) * (item.quantity || 0),
              0,
            )
          );
        }, 0);

        acc[category] = {
          count,
          active,
          revenue: categoryRevenue,
          avgPrice,
          totalStock,
        };

        return acc;
      },
      {},
    );
  }, [products, orders]);

  // Calculate last 30 days performance with more data points
  const last30Days = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));

      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
        const isToday = orderDate === date.toISOString().split("T")[0];
        const isValidOrder =
          order.status !== "cancelled" && order.status !== "returned";
        return isToday && isValidOrder;
      });

      return {
        date: date.toISOString().split("T")[0],
        day: date.getDate(),
        orders: dayOrders.length,
        revenue: dayOrders.reduce(
          (sum, order) => sum + (order.farmerSubtotal || order.total || 0),
          0,
        ),
        customers: new Set(dayOrders.map((order) => order.userId)).size,
      };
    });
  }, [orders]);

  // Product performance bubble chart data
  const productBubbleData = useMemo(() => {
    const validOrders = orders.filter(
      (order) => order.status !== "cancelled" && order.status !== "returned",
    );

    const productData = products.slice(0, 20).map((product) => {
      const productOrders = validOrders.filter((order) =>
        order.items?.some(
          (item) =>
            item.product?._id === product._id || item.productId === product._id,
        ),
      );

      const totalQuantitySold = productOrders.reduce((sum, order) => {
        const matchingItems =
          order.items?.filter(
            (item) =>
              item.product?._id === product._id ||
              item.productId === product._id,
          ) || [];
        return (
          sum +
          matchingItems.reduce(
            (itemSum, item) => itemSum + (item.quantity || 0),
            0,
          )
        );
      }, 0);

      const totalRevenue = productOrders.reduce((sum, order) => {
        const matchingItems =
          order.items?.filter(
            (item) =>
              item.product?._id === product._id ||
              item.productId === product._id,
          ) || [];
        return (
          sum +
          matchingItems.reduce(
            (itemSum, item) =>
              itemSum + (item.price || 0) * (item.quantity || 0),
            0,
          )
        );
      }, 0);

      return {
        x: product.price || 0, // Price
        y: totalQuantitySold, // Quantity sold
        r: Math.max(Math.sqrt(totalRevenue / 10), 5), // Revenue (bubble size)
        label: product.name,
        revenue: totalRevenue,
      };
    });

    return {
      datasets: [
        {
          label: "Product Performance",
          data: productData,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
        },
      ],
    };
  }, [products, orders]);

  // Radar chart data for category performance
  const categoryRadarData = useMemo(() => {
    const categories = Object.keys(categoryStats);

    // If no categories, return empty chart
    if (categories.length === 0) {
      return {
        labels: [
          "Product Count",
          "Revenue ($)",
          "Active Products",
          "Avg Price ($)",
          "Total Stock",
        ],
        datasets: [],
      };
    }

    // Calculate actual maximums for scaling (use actual values, not normalized)
    const allStats = Object.values(categoryStats);

    // Find reasonable scale maximums based on actual data
    const maxValues = {
      count: Math.max(...allStats.map((s) => s.count), 1),
      revenue: Math.max(...allStats.map((s) => s.revenue), 1),
      active: Math.max(...allStats.map((s) => s.active), 1),
      avgPrice: Math.max(...allStats.map((s) => s.avgPrice), 1),
      totalStock: Math.max(...allStats.map((s) => s.totalStock), 1),
    };

    // Use a scale that makes sense for comparison
    const getScaledValue = (value, maxValue, targetMax = 100) => {
      if (maxValue === 0) return 0;
      return Math.min((value / maxValue) * targetMax, targetMax);
    };

    return {
      labels: [
        "Product Count",
        "Revenue ($)",
        "Active Products",
        "Avg Price ($)",
        "Total Stock",
      ],
      datasets: categories.slice(0, 5).map((category, index) => {
        const stats = categoryStats[category];
        const colors = [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 205, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
        ];
        const borderColors = [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 205, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ];

        // Use actual values scaled proportionally
        const scaledData = [
          getScaledValue(stats.count, maxValues.count),
          getScaledValue(stats.revenue, maxValues.revenue),
          getScaledValue(stats.active, maxValues.active),
          getScaledValue(stats.avgPrice, maxValues.avgPrice),
          getScaledValue(stats.totalStock, maxValues.totalStock),
        ];

        // Create accurate label with actual values
        const labelText = `${category} (${stats.count} products, $${stats.revenue.toFixed(2)} revenue, ${stats.totalStock} stock)`;

        return {
          label: labelText,
          data: scaledData,
          backgroundColor: colors[index % colors.length],
          borderColor: borderColors[index % borderColors.length],
          borderWidth: 2,
          pointBackgroundColor: borderColors[index % borderColors.length],
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: borderColors[index % borderColors.length],
        };
      }),
    };
  }, [categoryStats]);

  // Mixed chart data (revenue and orders)
  const mixedChartData = useMemo(() => {
    const recentData = last30Days.slice(-14); // Last 14 days

    return {
      labels: recentData.map((d) => `${d.day}`),
      datasets: [
        {
          type: "line",
          label: "Revenue",
          data: recentData.map((d) => d.revenue),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          yAxisID: "y",
        },
        {
          type: "bar",
          label: "Orders",
          data: recentData.map((d) => d.orders),
          backgroundColor: "rgba(255, 99, 132, 0.8)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
          yAxisID: "y1",
        },
        {
          type: "line",
          label: "Customers",
          data: recentData.map((d) => d.customers),
          borderColor: "rgba(153, 102, 255, 1)",
          backgroundColor: "rgba(153, 102, 255, 0.1)",
          borderWidth: 2,
          borderDash: [5, 5],
          yAxisID: "y1",
        },
      ],
    };
  }, [last30Days]);

  // Polar area chart for order status distribution
  const orderStatusData = useMemo(() => {
    const statusCounts = orders.reduce((acc, order) => {
      const status = order.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 205, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)",
            "rgba(255, 159, 64, 0.8)",
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    };
  }, [orders]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "rgb(156, 163, 175)",
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
        },
      },
      y: {
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
        },
      },
    },
  };

  const mixedChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
          callback: function (value) {
            return formatPrice(value);
          },
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "rgb(156, 163, 175)",
        },
      },
    },
  };

  const bubbleChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        title: {
          display: true,
          text: "Product Price",
          color: "rgb(156, 163, 175)",
        },
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
          callback: function (value) {
            return formatPrice(value);
          },
        },
      },
      y: {
        title: {
          display: true,
          text: "Quantity Sold",
          color: "rgb(156, 163, 175)",
        },
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
        },
      },
    },
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            const point = context.raw;
            return `${point.label}: Price ${formatPrice(point.x)}, Sold ${point.y}, Revenue ${formatPrice(point.revenue)}`;
          },
        },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "rgb(156, 163, 175)",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const datasetLabel = context.dataset.label;
            const categoryName = datasetLabel.split(" (")[0];
            const stats = categoryStats[categoryName];
            const pointIndex = context.dataIndex;

            if (!stats) return context.formattedValue;

            const labels = [
              `Products: ${stats.count}`,
              `Revenue: ${formatPrice(stats.revenue)}`,
              `Active: ${stats.active}`,
              `Avg Price: ${formatPrice(stats.avgPrice)}`,
              `Stock: ${stats.totalStock}`,
            ];

            return labels[pointIndex] || context.formattedValue;
          },
        },
      },
    },
    scales: {
      r: {
        angleLines: {
          color: "rgba(156, 163, 175, 0.2)",
        },
        grid: {
          color: "rgba(156, 163, 175, 0.2)",
        },
        pointLabels: {
          color: "rgb(156, 163, 175)",
          font: {
            size: 11,
          },
        },
        ticks: {
          color: "rgba(156, 163, 175, 0.8)",
          backdropColor: "transparent",
          stepSize: 20,
          min: 0,
          max: 100,
        },
      },
    },
  };

  const polarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "rgb(156, 163, 175)",
          font: {
            size: 12,
          },
        },
      },
    },
    scales: {
      r: {
        grid: {
          color: "rgba(156, 163, 175, 0.2)",
        },
        ticks: {
          color: "rgba(156, 163, 175, 0.8)",
          backdropColor: "transparent",
        },
      },
    },
  };

  // Calculate actual performance metrics
  const performanceMetrics = useMemo(() => {
    const validOrders = orders.filter(
      (order) => order.status !== "cancelled" && order.status !== "returned",
    );

    // Calculate conversion rate (delivered orders / total orders)
    const conversionRate =
      orders.length > 0
        ? (
            (orders.filter((o) => o.status === "delivered").length /
              orders.length) *
            100
          ).toFixed(1)
        : 0;

    // Calculate revenue growth (compare last 30 days with previous 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentRevenue = validOrders
      .filter((order) => new Date(order.createdAt) >= thirtyDaysAgo)
      .reduce(
        (sum, order) => sum + (order.farmerSubtotal || order.total || 0),
        0,
      );

    const previousRevenue = validOrders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
      })
      .reduce(
        (sum, order) => sum + (order.farmerSubtotal || order.total || 0),
        0,
      );

    let revenueGrowth = 0;
    if (previousRevenue > 0 && recentRevenue > 0) {
      revenueGrowth = (
        ((recentRevenue - previousRevenue) / previousRevenue) *
        100
      ).toFixed(1);
    } else if (recentRevenue > 0 && previousRevenue === 0) {
      revenueGrowth = 100; // 100% growth when starting from 0
    }

    // Calculate customer retention (customers who made repeat orders)
    const uniqueCustomers = [
      ...new Set(validOrders.map((order) => order.userId)),
    ];
    const repeatCustomers = uniqueCustomers.filter((customerId) => {
      const customerOrders = validOrders.filter(
        (order) => order.userId === customerId,
      );
      return customerOrders.length > 1;
    });

    const customerRetention =
      uniqueCustomers.length > 0
        ? ((repeatCustomers.length / uniqueCustomers.length) * 100).toFixed(1)
        : 0;

    return {
      conversionRate,
      revenueGrowth,
      customerRetention,
      hasActivity: validOrders.length > 0 || products.length > 0,
    };
  }, [orders, products]);

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold">
                {formatPrice(analytics.totalRevenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <i className="fas fa-dollar-sign text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold">{analytics.totalOrders || 0}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <i className="fas fa-shopping-cart text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                Active Products
              </p>
              <p className="text-3xl font-bold">
                {analytics.activeProducts || 0}
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <i className="fas fa-box text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">
                Avg Order Value
              </p>
              <p className="text-3xl font-bold">
                {formatPrice(analytics.averageOrderValue || 0)}
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <i className="fas fa-chart-line text-2xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mixed Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <i className="fas fa-chart-area mr-3 text-blue-500"></i>
            Revenue & Orders Trend (14 Days)
          </h3>
          <div className="h-80">
            <Chart
              type="bar"
              data={mixedChartData}
              options={mixedChartOptions}
            />
          </div>
        </div>

        {/* Bubble Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <i className="fas fa-circle-notch mr-3 text-green-500"></i>
            Product Performance Matrix
          </h3>
          <div className="h-80">
            <Bubble data={productBubbleData} options={bubbleChartOptions} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            X: Price, Y: Quantity Sold, Bubble Size: Revenue
          </p>
        </div>
      </div>

      {/* Advanced Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <i className="fas fa-spider mr-3 text-purple-500"></i>
            Category Performance Analysis
          </h3>
          <div className="h-80">
            <Radar data={categoryRadarData} options={radarOptions} />
          </div>
        </div>

        {/* Polar Area Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <i className="fas fa-chart-pie mr-3 text-pink-500"></i>
            Order Status Distribution
          </h3>
          <div className="h-80">
            <PolarArea data={orderStatusData} options={polarOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <i className="fas fa-tags mr-3 text-indigo-500"></i>
            Top Categories
          </h3>
          <div className="space-y-4">
            {Object.entries(categoryStats)
              .sort(([, a], [, b]) => b.revenue - a.revenue)
              .slice(0, 5)
              .map(([category, stats]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {category}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.count} products
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(stats.revenue)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {formatPrice(stats.avgPrice)} avg
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <i className="fas fa-tachometer-alt mr-3 text-yellow-500"></i>
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Conversion Rate
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {performanceMetrics.conversionRate}%
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Revenue Growth
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                +{performanceMetrics.revenueGrowth}%
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Customer Retention
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {performanceMetrics.customerRetention}%
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <i className="fas fa-clock mr-3 text-red-500"></i>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {last30Days
              .slice(-7)
              .reverse()
              .map((day, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${day.orders > 0 ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Day {day.day}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {day.orders} orders
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatPrice(day.revenue)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
