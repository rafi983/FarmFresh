export const formatPrice = (price) => {
  const v = typeof price === "number" ? price : parseFloat(price) || 0;
  return `৳${v.toFixed(0)}`;
};

export const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

export const getStatusBadge = (status) => {
  const statusConfig = {
    confirmed: {
      bg: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200",
      icon: "fas fa-check",
      pulse: false,
    },
    pending: {
      bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200",
      icon: "fas fa-clock",
      pulse: true,
    },
    delivered: {
      bg: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200",
      icon: "fas fa-check-circle",
      pulse: false,
    },
    cancelled: {
      bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200",
      icon: "fas fa-times-circle",
      pulse: false,
    },
    shipped: {
      bg: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200",
      icon: "fas fa-truck",
      pulse: true,
    },
  };
  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${config.bg} ${config.pulse ? "animate-pulse" : ""}`}
    >
      <i className={`${config.icon} mr-1.5 text-xs`}></i>
      {status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"}
    </span>
  );
};
