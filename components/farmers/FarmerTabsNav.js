"use client";
export default function FarmerTabsNav({ activeTab, onChange }) {
  const tabs = [
    { id: "story", label: "Our Story", icon: "fas fa-book-open" },
    { id: "products", label: "Product Overview", icon: "fas fa-seedling" },
    { id: "reviews", label: "Customer Reviews", icon: "fas fa-star" },
    { id: "stats", label: "Farm Statistics", icon: "fas fa-chart-bar" },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-12">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center ${
            activeTab === tab.id
              ? "bg-green-600 text-white shadow-lg"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700"
          }`}
        >
          <i className={`${tab.icon} mr-2`}></i>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
