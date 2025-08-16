import React from "react";

export const ProductCardSkeleton = ({ index = 0 }) => (
  <div
    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 relative"
    style={{
      animationDelay: `${index * 120}ms`,
      animation: "fadeInUp 0.6s ease-out forwards",
    }}
  >
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    <div className="relative aspect-square bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-700 dark:to-gray-600 overflow-hidden" />
    <div className="p-6 space-y-4">
      <div className="h-5 w-1/2 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 bg-yellow-200 dark:bg-yellow-700 rounded animate-pulse"
          />
        ))}
      </div>
      <div className="h-6 w-24 bg-primary-200 dark:bg-primary-700 rounded animate-pulse" />
      <div className="h-10 w-full bg-primary-300 dark:bg-primary-600 rounded-lg animate-pulse" />
    </div>
  </div>
);

export const FilterSidebarSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
    {[...Array(5)].map((_, s) => (
      <div key={s} className="space-y-2 animate-pulse">
        <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-600 rounded" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const HeaderSkeleton = () => (
  <div className="bg-gradient-to-r from-primary-600 to-emerald-600 text-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-10 w-64 bg-white/20 rounded-lg animate-pulse mb-4" />
      <div className="h-6 w-96 bg-white/15 rounded animate-pulse" />
    </div>
  </div>
);

export function GlobalLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
      <HeaderSkeleton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:hidden mb-6">
          <div className="w-full h-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <FilterSidebarSkeleton />
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <ProductCardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default {
  ProductCardSkeleton,
  FilterSidebarSkeleton,
  HeaderSkeleton,
  GlobalLoadingSkeleton,
};
