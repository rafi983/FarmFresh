// components/dashboard/StatCard.js
export default function StatCard({ icon, bgColor, textColor, title, value, iconClass }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
                <div className={`p-3 ${bgColor} rounded-lg`}>
                    <i className={`${icon} ${textColor} text-xl`}></i>
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {title}
                    </p>
                    <p className={`text-2xl font-bold ${iconClass || "text-gray-900 dark:text-white"}`}>
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}