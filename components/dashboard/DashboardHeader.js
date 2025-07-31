// components/dashboard/DashboardHeader.js
import Link from "next/link";

export default function DashboardHeader({ session, handleRefresh, refreshing }) {
    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Farmer Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Welcome back, {session?.user?.name || "Farmer"}! Manage your
                            farm business.
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
                        >
                            <i
                                className={`fas fa-sync-alt mr-2 ${refreshing ? "fa-spin" : ""}`}
                            ></i>
                            Refresh
                        </button>
                        <Link
                            href="/create"
                            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Add Product
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}