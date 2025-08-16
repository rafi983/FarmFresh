"use client";

export default function ControlPanel({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  viewType,
  onViewTypeChange,
}) {
  return (
    <div className="flex flex-wrap justify-center gap-8 mb-16">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-3 shadow-2xl border border-gray-200 dark:border-gray-600">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-8 py-4 bg-transparent border-none focus:outline-none text-gray-700 dark:text-gray-300 font-semibold text-lg"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Products" : cat}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-3 shadow-2xl border border-gray-200 dark:border-gray-600">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-8 py-4 bg-transparent border-none focus:outline-none text-gray-700 dark:text-gray-300 font-semibold text-lg"
        >
          <option value="default">Sort By</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Rating</option>
          <option value="name">Name</option>
          <option value="stock">Stock</option>
        </select>
      </div>

      <div className="flex gap-4">
        {[
          { id: "grid", icon: "fa-th", label: "Grid View" },
          { id: "list", icon: "fa-list", label: "List View" },
          { id: "masonry", icon: "fa-columns", label: "Masonry View" },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => onViewTypeChange(v.id)}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              viewType === v.id
                ? "bg-emerald-500 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <i className={`fas ${v.icon}`} />
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
