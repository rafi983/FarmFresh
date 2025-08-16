import React from "react";
import {
  ORDER_STATUSES,
  DATE_FILTERS,
  SORT_OPTIONS,
  VIEW_MODES,
} from "./constants";

export default function FiltersBar({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  handleRefresh,
  refreshing,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, products, or farmers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value={ORDER_STATUSES.ALL}>{ORDER_STATUSES.ALL}</option>
            <option value={ORDER_STATUSES.PENDING}>Pending</option>
            <option value={ORDER_STATUSES.CONFIRMED}>Confirmed</option>
            <option value={ORDER_STATUSES.SHIPPED}>Shipped</option>
            <option value={ORDER_STATUSES.DELIVERED}>Delivered</option>
            <option value={ORDER_STATUSES.CANCELLED}>Cancelled</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value={DATE_FILTERS.ALL}>All Time</option>
            <option value={DATE_FILTERS.TODAY}>Today</option>
            <option value={DATE_FILTERS.WEEK}>Last Week</option>
            <option value={DATE_FILTERS.MONTH}>Last Month</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value={SORT_OPTIONS.NEWEST}>Newest First</option>
            <option value={SORT_OPTIONS.OLDEST}>Oldest First</option>
            <option value={SORT_OPTIONS.HIGHEST}>Highest Value</option>
            <option value={SORT_OPTIONS.LOWEST}>Lowest Value</option>
          </select>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode(VIEW_MODES.CARDS)}
              className={`px-4 py-2 rounded-lg ${viewMode === VIEW_MODES.CARDS ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm" : "text-gray-600 dark:text-gray-400"}`}
            >
              <i className="fas fa-th-large" />
            </button>
            <button
              onClick={() => setViewMode(VIEW_MODES.LIST)}
              className={`px-4 py-2 rounded-lg ${viewMode === VIEW_MODES.LIST ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm" : "text-gray-600 dark:text-gray-400"}`}
            >
              <i className="fas fa-list" />
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 flex items-center"
          >
            <i
              className={`fas fa-sync-alt mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
