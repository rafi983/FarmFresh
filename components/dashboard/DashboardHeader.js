import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardHeader({
  session,
  handleRefresh,
  refreshing,
}) {
  const [currentFarmerName, setCurrentFarmerName] = useState(
    session?.user?.name || "Farmer",
  );

  // Fetch the current farmer name from database when component mounts or refreshes
  useEffect(() => {
    async function fetchCurrentFarmerName() {
      if (!session?.user?.email) return;

      try {
        const response = await fetch(
          `/api/farmers?email=${encodeURIComponent(
            session.user.email,
          )}&exactMatch=true&_t=${Date.now()}`,
          {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
            cache: "no-store",
          },
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Farmer data received:", data);

          // Check if we have farmer data and extract the name
          if (data && data.farmers && data.farmers.length > 0) {
            // Find the farmer with the matching email
            const farmer = data.farmers.find(
              (f) => f.email === session.user.email,
            );
            if (farmer) {
              setCurrentFarmerName(farmer.name);
            } else {
            }
          }
        } else {
          console.error("Failed to fetch farmer data:", response.status);
        }
      } catch (error) {
        console.error("Error fetching current farmer name:", error);
      }
    }

    fetchCurrentFarmerName();
  }, [session?.user?.email, refreshing]);

  // Log when the component renders with the current name
  useEffect(() => {}, [currentFarmerName]);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Farmer Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Welcome back, {currentFarmerName}! Manage your farm business.
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
