// filepath: components/details/constants.js
"use client";

export const TAB_OPTIONS = [
  "description",
  "nutrition",
  "storage",
  "reviews",
  "farmer",
];
export const DEFAULT_REVIEW_FORM = { rating: 5, comment: "" };

export const formatPrice = (price) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(price || 0);
};
