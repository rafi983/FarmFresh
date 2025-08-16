import React from "react";

export default function StatsCards({ orderStats, formatPrice }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
      <StatCard value={orderStats.total} label="Total Orders" color="blue" />
      <StatCard value={orderStats.delivered} label="Delivered" color="green" />
      <StatCard value={orderStats.pending} label="Pending" color="yellow" />
      <StatCard
        value={
          formatPrice
            ? formatPrice(orderStats.totalSpent)
            : orderStats.totalSpent
        }
        label="Total Spent"
        color="purple"
        smaller
      />
    </div>
  );
}

function StatCard({ value, label, color, smaller }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
      <div className="text-center">
        <div
          className={`font-bold ${smaller ? "text-xl" : "text-2xl"} text-${color}-600 dark:text-${color}-400`}
        >
          {value}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
      </div>
    </div>
  );
}
