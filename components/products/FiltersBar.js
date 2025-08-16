import React from "react";

export default function FiltersBar({
  filters,
  onFilterChange,
  loading,
  totalProducts,
}) {
  return (
    <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <div className="flex items-center space-x-4">
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          <i className="fas fa-box mr-2 text-primary-600" />
          {totalProducts} products
        </span>
        {loading && (
          <div className="flex items-center text-primary-600">
            <i className="fas fa-spinner fa-spin mr-2" />
            <span className="text-sm">Loading...</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <label className="text-sm text-gray-700 dark:text-gray-300">
          Sort by:
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange("sortBy", e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>
    </div>
  );
}
