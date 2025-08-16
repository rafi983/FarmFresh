"use client";
import { useMemo } from "react";
import CompactListRow from "./CompactListRow";
import GridTile from "./GridTile";
import AlternativeProductLayout from "./AlternativeProductLayout";
import { formatPrice, getDisplayRating } from "./utils"; // eslint-disable-line no-unused-vars

// Handles sorting + choosing view type
export default function ProductDisplayLayout({ products, viewType, sortBy }) {
  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-high":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "rating":
        return sorted.sort(
          (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
        );
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "stock":
        return sorted.sort((a, b) => (b.stock || 0) - (a.stock || 0));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  if (!sortedProducts.length) return null;

  if (viewType === "list") {
    return (
      <div className="max-w-4xl mx-auto space-y-3">
        {sortedProducts.map((p, i) => (
          <CompactListRow key={p._id || i} product={p} index={i} />
        ))}
      </div>
    );
  }

  if (viewType === "masonry") {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {sortedProducts.map((p, i) => (
          <div key={p._id || i} className="break-inside-avoid mb-6">
            <AlternativeProductLayout product={p} index={i} />
          </div>
        ))}
      </div>
    );
  }

  // grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sortedProducts.map((p, i) => (
        <GridTile key={p._id || i} product={p} index={i} />
      ))}
    </div>
  );
}
