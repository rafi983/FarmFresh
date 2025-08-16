import React from "react";

const colorMap = {
  primary:
    "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200",
  green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  yellow:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  purple:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  orange:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function Chip({ label, onRemove, color }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorMap[color]}`}
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-2 opacity-70 hover:opacity-100"
        aria-label="Remove filter"
      >
        ×
      </button>
    </span>
  );
}

export default Chip;
