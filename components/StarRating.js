"use client";

export default function StarRating({
  rating,
  size = "text-sm",
  showValue = true,
}) {
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

  const { fullStars, hasHalfStar, emptyStars } = getStarDisplay(rating);

  return (
    <div className="flex items-center text-yellow-400">
      {/* Render full stars */}
      {[...Array(fullStars)].map((_, index) => (
        <i key={`full-${index}`} className={`fas fa-star ${size}`}></i>
      ))}

      {/* Render half star if needed */}
      {hasHalfStar && <i className={`fas fa-star-half-alt ${size}`}></i>}

      {/* Render empty stars */}
      {[...Array(emptyStars)].map((_, index) => (
        <i
          key={`empty-${index}`}
          className={`far fa-star ${size} text-gray-300`}
        ></i>
      ))}

      {/* Show numeric value if requested */}
      {showValue && (
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
