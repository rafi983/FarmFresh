// Centralized configuration and constants for Farmer related components
export const specializationConfig = {
  Grains: {
    icon: "fas fa-seedling",
    color: "bg-amber-500",
    description: "Premium grain production",
  },
  Fruits: {
    icon: "fas fa-apple-alt",
    color: "bg-red-500",
    description: "Fresh seasonal fruits",
  },
  Vegetables: {
    icon: "fas fa-carrot",
    color: "bg-orange-500",
    description: "Organic vegetables",
  },
  Herbs: {
    icon: "fas fa-leaf",
    color: "bg-green-500",
    description: "Natural herbs & spices",
  },
  Honey: {
    icon: "fas fa-bug",
    color: "bg-yellow-500",
    description: "Pure natural honey",
  },
  Dairy: {
    icon: "fas fa-glass-whiskey",
    color: "bg-blue-500",
    description: "Fresh dairy products",
  },
};

export const methodConfig = {
  Organic: {
    icon: "fas fa-leaf",
    color: "text-green-600 dark:text-green-400",
    description: "Chemical-free farming practices",
  },
  Traditional: {
    icon: "fas fa-seedling",
    color: "text-brown-600 dark:text-yellow-400",
    description: "Time-tested farming wisdom",
  },
  Sustainable: {
    icon: "fas fa-recycle",
    color: "text-blue-600 dark:text-blue-400",
    description: "Environmentally conscious methods",
  },
  "Natural Ripening": {
    icon: "fas fa-sun",
    color: "text-orange-600 dark:text-orange-400",
    description: "Natural maturation process",
  },
  "Fruit Cultivation": {
    icon: "fas fa-apple-alt",
    color: "text-red-600 dark:text-red-400",
    description: "Specialized fruit growing",
  },
  "Sun-dried": {
    icon: "fas fa-sun",
    color: "text-yellow-600 dark:text-yellow-400",
    description: "Solar-powered processing",
  },
};

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned",
};
