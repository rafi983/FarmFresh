import React from "react";
import { CATEGORY_OPTIONS, TAG_OPTIONS } from "./constants";
import { PRICE_RANGE_OPTIONS } from "./constants";

function SectionHeader({ title, badge }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      {badge ? (
        <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function FilterRadioGroup({ title, icon, options, value, onChange }) {
  return (
    <div className="mb-6">
      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
        <i className={`fas fa-${icon} mr-2 text-primary-600`} />
        {title}
      </h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
          >
            <input
              type="radio"
              name={title}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function PriceFilter({ filters, onChange }) {
  const [min, max] = filters.priceRangeSlider;
  return (
    <div className="mb-6">
      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
        <i className="fas fa-dollar-sign mr-2 text-primary-600" />
        Price Range (৳)
      </h4>
      <div className="mb-4">
        <div className="relative h-2 bg-gray-200 rounded-lg">
          <div
            className="absolute h-2 bg-primary-600 rounded-lg"
            style={{
              left: `${(min / 10000) * 100}%`,
              width: `${((max - min) / 10000) * 100}%`,
            }}
          />
          <input
            type="range"
            min="0"
            max="10000"
            step="10"
            value={min}
            onChange={(e) => onChange("priceSlider", [+e.target.value, max])}
            className="absolute w-full h-2 opacity-0 cursor-pointer"
          />
          <input
            type="range"
            min="0"
            max="10000"
            step="10"
            value={max}
            onChange={(e) => onChange("priceSlider", [min, +e.target.value])}
            className="absolute w-full h-2 opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
          <span>৳{min}</span>
          <span>৳{max}</span>
        </div>
      </div>
      <div className="space-y-2">
        {PRICE_RANGE_OPTIONS.map((opt) => (
          <label
            key={opt.label}
            className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={filters.selectedPriceRanges.includes(opt.label)}
              onChange={() => onChange("priceRange", opt.label)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function RatingFilter({ selected, onChange }) {
  return (
    <div className="mb-6">
      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
        <i className="fas fa-star mr-2 text-primary-600" />
        Rating
      </h4>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((r) => (
          <label
            key={r}
            className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(r)}
              onChange={() => onChange("rating", r)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
              {[...Array(r)].map((_, i) => (
                <i
                  key={i}
                  className="fas fa-star text-yellow-400 text-xs mr-1"
                />
              ))}
              {r < 5 && <span className="ml-1">& Up</span>}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function CheckboxGroup({
  title,
  icon,
  options,
  selected,
  onToggle,
  scrollable,
}) {
  return (
    <div className="mb-6">
      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
        <i className={`fas fa-${icon} mr-2 text-primary-600`} />
        {title}
      </h4>
      <div
        className={`space-y-2 ${scrollable ? "max-h-32 overflow-y-auto" : ""}`}
      >
        {options.length ? (
          options.map((opt) => (
            <label
              key={opt}
              className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 truncate">
                {opt}
              </span>
            </label>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
            Loading...
          </p>
        )}
      </div>
    </div>
  );
}

export default function FilterSidebar({
  filters,
  onFilterChange,
  availableFarmers,
  activeFilterCount,
  clearAllFilters,
}) {
  return (
    <aside className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-24">
      <SectionHeader title="Filters" badge={activeFilterCount || null} />
      <FilterRadioGroup
        title="Category"
        icon="th-large"
        options={CATEGORY_OPTIONS}
        value={filters.selectedCategory}
        onChange={(v) => onFilterChange("category", v)}
      />
      <PriceFilter filters={filters} onChange={onFilterChange} />
      <RatingFilter
        selected={filters.selectedRatings}
        onChange={(v) => onFilterChange("rating", v)}
      />
      <CheckboxGroup
        title="Farmer"
        icon="user"
        options={availableFarmers}
        selected={filters.selectedFarmers}
        onToggle={(v) => onFilterChange("farmer", v)}
        scrollable
      />
      <CheckboxGroup
        title="Tags"
        icon="tags"
        options={TAG_OPTIONS}
        selected={filters.selectedTags}
        onToggle={(v) => onFilterChange("tag", v)}
      />
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={clearAllFilters}
          disabled={!activeFilterCount}
          className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-times mr-2" />
          Clear All Filters
        </button>
      </div>
    </aside>
  );
}
