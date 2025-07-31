// components/dashboard/tabs/ProductsTab.js
import Link from "next/link";
import StatCard from "../StatCard";
import ProductCard from "../ProductCard";
import ProductList from "../ProductList";

export default function ProductsTab({
                                        products,
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
                                        formatDate
                                    }) {
    // Calculate product stats
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const inactiveCount = products.filter(p => p.status === "inactive").length;
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const activeProductsCount = products.filter(p => p.stock > 0 && p.status !== "inactive").length;

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("");
        setSelectedStatus("");
        setSelectedSort("");
    };

    return (
        <div className="space-y-6">
            {/* Products Header with Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Product Management
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage your product listings, inventory, and availability
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={clearFilters}
                            className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
                            disabled={!searchTerm && !selectedCategory && !selectedStatus && !selectedSort}
                        >
                            <i className="fas fa-filter mr-2"></i>
                            Clear Filters
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
                        >
                            <i className={`fas fa-sync-alt mr-2 ${refreshing ? "fa-spin" : ""}`}></i>
                            Refresh
                        </button>
                        <Link
                            href="/create"
                            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Add Product
                        </Link>
                    </div>
                </div>
            </div>

            {/* Product Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon="fas fa-box"
                    bgColor="bg-blue-100 dark:bg-blue-900"
                    textColor="text-blue-600 dark:text-blue-300"
                    title="Total Products"
                    value={products.length}
                />

                <StatCard
                    icon="fas fa-check-circle"
                    bgColor="bg-green-100 dark:bg-green-900"
                    textColor="text-green-600 dark:text-green-300"
                    title="Active Products"
                    value={activeProductsCount}
                />

                <StatCard
                    icon="fas fa-exclamation-triangle"
                    bgColor="bg-yellow-100 dark:bg-yellow-900"
                    textColor="text-yellow-600 dark:text-yellow-300"
                    title="Low Stock"
                    value={lowStockCount}
                />

                <StatCard
                    icon="fas fa-times-circle"
                    bgColor="bg-red-100 dark:bg-red-900"
                    textColor="text-red-600 dark:text-red-300"
                    title="Out of Stock/Inactive"
                    value={outOfStockCount + inactiveCount}
                />
            </div>

            {/* Enhanced Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Filter & Search
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Search Products
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or description..."
                                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Category
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Categories</option>
                            <option value="Vegetables">🥬 Vegetables</option>
                            <option value="Fruits">🍎 Fruits</option>
                            <option value="Grains">🌾 Grains</option>
                            <option value="Dairy">🥛 Dairy</option>
                            <option value="Herbs">🌿 Herbs</option>
                            <option value="Other">📦 Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">✅ Active</option>
                            <option value="inactive">⏸️ Inactive</option>
                            <option value="out-of-stock">❌ Out of Stock</option>
                            <option value="low-stock">⚠️ Low Stock (≤5)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Sort By
                        </label>
                        <select
                            value={selectedSort || ""}
                            onChange={(e) => setSelectedSort(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Default Order</option>
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="price-asc">Price (Low to High)</option>
                            <option value="price-desc">Price (High to Low)</option>
                            <option value="stock-asc">Stock (Low to High)</option>
                            <option value="stock-desc">Stock (High to Low)</option>
                            <option value="date-desc">Newest First</option>
                            <option value="date-asc">Oldest First</option>
                        </select>
                    </div>
                </div>

                {/* Filter Summary */}
                {(searchTerm || selectedCategory || selectedStatus || selectedSort) && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Showing filtered results
                                {searchTerm ? ` matching "${searchTerm}"` : ""}
                                {selectedCategory ? ` in ${selectedCategory}` : ""}
                                {selectedStatus ? ` that are ${selectedStatus}` : ""}
                                {selectedSort ? ` sorted by ${selectedSort.replace("-", " ")}` : ""}
                            </p>
                            <button
                                onClick={clearFilters}
                                className="text-xs text-red-600 dark:text-red-400 hover:underline"
                            >
                                <i className="fas fa-times mr-1"></i>
                                Clear all filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              View:
            </span>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`px-3 py-1 rounded ${
                                    viewMode === "grid"
                                        ? "bg-white dark:bg-gray-600 shadow"
                                        : "text-gray-600 dark:text-gray-400"
                                }`}
                            >
                                <i className="fas fa-th-large"></i>
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-3 py-1 rounded ${
                                    viewMode === "list"
                                        ? "bg-white dark:bg-gray-600 shadow"
                                        : "text-gray-600 dark:text-gray-400"
                                }`}
                            >
                                <i className="fas fa-list"></i>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Results per page:</span>
                        <select
                            value={productsPerPage}
                            onChange={(e) => setProductsPerPage(Number(e.target.value))}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value={12}>12</option>
                            <option value={24}>24</option>
                            <option value={48}>48</option>
                            <option value={96}>96</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Products Display */}
            {paginatedProducts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                    <i className="fas fa-search text-6xl text-gray-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {products.length === 0
                            ? "No products found"
                            : "No products match your filters"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {products.length === 0
                            ? "Start by adding your first product to your store"
                            : "Try adjusting your search criteria or clear the filters"}
                    </p>
                    {products.length === 0 ? (
                        <Link
                            href="/create"
                            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Add Your First Product
                        </Link>
                    ) : (
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                        >
                            <i className="fas fa-filter mr-2"></i>
                            Clear All Filters
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Grid View */}
                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {paginatedProducts.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    handleStatusToggle={handleStatusToggle}
                                    handleDeleteProduct={handleDeleteProduct}
                                    actionLoading={actionLoading}
                                    getProductStatusBadge={getProductStatusBadge}
                                    formatPrice={formatPrice}
                                />
                            ))}
                        </div>
                    )}

                    {/* List View */}
                    {viewMode === "list" && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                            <ProductList
                                products={paginatedProducts}
                                handleStatusToggle={handleStatusToggle}
                                handleDeleteProduct={handleDeleteProduct}
                                actionLoading={actionLoading}
                                getProductStatusBadge={getProductStatusBadge}
                                formatPrice={formatPrice}
                                formatDate={formatDate}
                            />
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-8">
                            <nav className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 disabled:opacity-50"
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 rounded ${
                                            currentPage === page
                                                ? "bg-green-600 text-white"
                                                : "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 disabled:opacity-50"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </nav>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}