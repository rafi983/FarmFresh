import { PRICE_RANGE_OPTIONS } from "./constants";

export function applyFiltersAndSorting(products, filters) {
  let filtered = products.filter(
    (p) => p.status !== "deleted" && p.status !== "inactive",
  );
  const {
    searchTerm,
    selectedCategory,
    selectedPriceRanges,
    selectedRatings,
    selectedFarmers,
    selectedTags,
    priceRangeSlider,
    sortBy,
  } = filters;
  if (searchTerm?.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filtered = filtered.filter((p) =>
      [p.name, p.description, p.category, p.farmerName]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term)),
    );
  }
  if (selectedCategory && selectedCategory !== "All Categories") {
    const cat = selectedCategory.toLowerCase();
    filtered = filtered.filter((p) => p.category?.toLowerCase() === cat);
  }
  if (selectedPriceRanges.length) {
    filtered = filtered.filter((p) => {
      const price = +p.price || 0;
      return selectedPriceRanges.some((label) => {
        const opt = PRICE_RANGE_OPTIONS.find((o) => o.label === label);
        return opt && price >= opt.min && price <= opt.max;
      });
    });
  }
  filtered = filtered.filter((p) => {
    const price = +p.price || 0;
    return price >= priceRangeSlider[0] && price <= priceRangeSlider[1];
  });
  if (selectedRatings.length) {
    filtered = filtered.filter((p) => {
      const r = +p.averageRating || 0;
      return selectedRatings.some((min) => r >= min);
    });
  }
  if (selectedFarmers.length) {
    filtered = filtered.filter((p) =>
      selectedFarmers.includes(p.farmer?.name || p.farmerName || ""),
    );
  }
  if (selectedTags.length) {
    filtered = filtered.filter((p) =>
      selectedTags.some((tag) => tagMatch(tag, p)),
    );
  }
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (+a.price || 0) - (+b.price || 0);
      case "price-high":
        return (+b.price || 0) - (+a.price || 0);
      case "rating":
        return (+b.averageRating || 0) - (+a.averageRating || 0);
      case "popular":
        return (+b.purchaseCount || 0) - (+a.purchaseCount || 0);
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      default:
        return 0;
    }
  });
  return filtered;
}

function tagMatch(tag, p) {
  const lcTags = (p.tags || []).map((t) => t.toLowerCase());
  switch (tag) {
    case "Organic":
      return p.isOrganic === true || lcTags.includes("organic");
    case "Fresh":
      return p.isFresh === true || lcTags.includes("fresh");
    case "Local":
      return true; // placeholder for future geo logic
    case "Premium":
      return (+p.price || 0) > 200;
    case "Seasonal":
      return (+p.stock || 0) < 100;
    case "Limited Stock":
      return (+p.stock || 0) < 50;
    default:
      return lcTags.includes(tag.toLowerCase());
  }
}

export function countActiveFilters(f) {
  let c = 0;
  if (f.selectedCategory !== "All Categories") c++;
  if (f.selectedPriceRanges.length) c++;
  if (f.selectedRatings.length) c++;
  if (f.selectedFarmers.length) c++;
  if (f.selectedTags.length) c++;
  if (f.priceRangeSlider[0] !== 0 || f.priceRangeSlider[1] !== 10000) c++;
  return c;
}
