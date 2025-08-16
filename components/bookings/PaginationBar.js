import React from "react";

export default function PaginationBar({
  totalPages,
  currentPage,
  setCurrentPage,
  indexOfFirst,
  indexOfLast,
  totalItems,
}) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-12 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
        Showing {indexOfFirst + 1} to {Math.min(indexOfLast, totalItems)} of{" "}
        {totalItems} orders
      </div>
      <nav aria-label="Pagination" className="flex items-center space-x-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-chevron-left" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          if (
            p === currentPage ||
            p === 1 ||
            p === totalPages ||
            (p >= currentPage - 1 && p <= currentPage + 1)
          ) {
            return (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  p === currentPage
                    ? "bg-blue-600 text-white shadow-lg transform scale-110"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                }`}
              >
                {p}
              </button>
            );
          }
          if (p === currentPage - 2 || p === currentPage + 2) {
            return (
              <span key={p} className="px-2 text-gray-400">
                ...
              </span>
            );
          }
          return null;
        })}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-chevron-right" />
        </button>
      </nav>
    </div>
  );
}
