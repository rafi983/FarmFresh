// components/dashboard/NavigationTabs.js
export default function NavigationTabs({ activeTab, setActiveTab, productsCount, ordersCount }) {
    const tabs = [
        { id: "dashboard", label: "Dashboard", icon: "fas fa-chart-line" },
        {
            id: "products",
            label: "Products",
            icon: "fas fa-box",
            count: productsCount
        },
        {
            id: "orders",
            label: "Orders",
            icon: "fas fa-clipboard-list",
            count: ordersCount
        },
        { id: "analytics", label: "Analytics", icon: "fas fa-chart-bar" },
        { id: "settings", label: "Settings", icon: "fas fa-cog" }
    ];

    return (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === tab.id
                                    ? "border-green-500 text-green-600 dark:text-green-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                        >
                            <i className={`${tab.icon} mr-2`}></i>
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}
