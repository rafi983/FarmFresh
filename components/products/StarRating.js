"use client";

import { useState } from "react";

export default function StarRating({
  rating,
  size = "text-sm",
  showValue = true,
  interactive = false,
  onRatingChange = null,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  // Size configurations
  const sizeConfig = {
    small: "text-sm",
    medium: "text-base",
    large: "text-2xl",
    "text-sm": "text-sm",
    "text-base": "text-base",
    "text-lg": "text-lg",
    "text-xl": "text-xl",
    "text-2xl": "text-2xl",
  };

  const currentSize = sizeConfig[size] || size;

  // Handle the fractional star logic according to your requirements
  const getStarDisplay = (rating) => {
    const fullStars = Math.floor(rating);
    const decimal = rating - fullStars;

    let hasHalfStar = false;
    let totalFullStars = fullStars;

    // Handle fractional part logic
    if (decimal >= 0.5) {
      if (decimal > 0.5) {
        // If decimal > 0.5, round up to next full star
        totalFullStars = fullStars + 1;
      } else {
        // If decimal = 0.5, show half star
        hasHalfStar = true;
      }
    } else if (decimal >= 0.4) {
      // If decimal is 0.4-0.49, show as half star
      hasHalfStar = true;
    }
    // If decimal < 0.4, just show full stars (no change needed)

    return {
      fullStars: totalFullStars,
      hasHalfStar,
      emptyStars: 5 - totalFullStars - (hasHalfStar ? 1 : 0),
    };
  };

  const displayRating = interactive ? hoverRating || rating : rating;
  const { fullStars, hasHalfStar, emptyStars } = getStarDisplay(displayRating);

  const handleStarClick = (starIndex) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex);
    }
  };

  const handleStarHover = (starIndex) => {
    if (interactive) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  if (interactive) {
    return (
      <div className="flex items-center space-x-2">
        <div
          className="flex items-center space-x-1"
          onMouseLeave={handleMouseLeave}
        >
          {[1, 2, 3, 4, 5].map((starIndex) => (
            <button
              key={starIndex}
              type="button"
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleStarHover(starIndex)}
              className={`transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded ${
                starIndex <= displayRating
                  ? "text-yellow-400 hover:text-yellow-500"
                  : "text-gray-300 dark:text-gray-600 hover:text-yellow-300"
              }`}
            >
              <i className={`fas fa-star ${currentSize}`}></i>
            </button>
          ))}
        </div>
        {showValue && (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            ({displayRating}/5)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center text-yellow-400">
      {/* Render full stars */}
      {[...Array(fullStars)].map((_, index) => (
        <i key={`full-${index}`} className={`fas fa-star ${currentSize}`}></i>
      ))}

      {/* Render half star if needed */}
      {hasHalfStar && <i className={`fas fa-star-half-alt ${currentSize}`}></i>}

      {/* Render empty stars */}
      {[...Array(emptyStars)].map((_, index) => (
        <i key={`empty-${index}`} className={`far fa-star ${currentSize}`}></i>
      ))}

      {/* Show rating value if requested */}
      {showValue && (
        <span className="ml-2 text-gray-600 dark:text-gray-400 font-medium">
          ({rating?.toFixed(1) || "0.0"})
        </span>
      )}
    </div>
  );
}
