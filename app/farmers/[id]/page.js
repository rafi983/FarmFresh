"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import FarmerHero from "@/components/farmers/FarmerHero";
import FarmerTabsNav from "@/components/farmers/FarmerTabsNav";
import StoryTab from "@/components/farmers/tabs/StoryTab";
import ProductsTab from "@/components/farmers/tabs/ProductsTab";
import ReviewsTab from "@/components/farmers/tabs/ReviewsTab";
import StatsTab from "@/components/farmers/tabs/StatsTab";
import ActionSection from "@/components/farmers/ActionSection";
import { ORDER_STATUS } from "@/components/farmers/constants";

export default function FarmerPage() {
  const router = useRouter();
  const params = useParams();
  const identifier = params.id;

  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("story");

  const calculateYearsOfExperience = (joinedDate, createdAt) => {
    const joinDate = new Date(joinedDate || createdAt);
    const currentDate = new Date();
    return Math.max(1, currentDate.getFullYear() - joinDate.getFullYear());
  };

  const fetchFarmerData = useCallback(async () => {
    if (!identifier) return;
    try {
      setLoading(true);
      setError(null);
      const timestamp = Date.now();
      const farmerRes = await fetch(
        `/api/farmers/${identifier}?t=${timestamp}`,
        {
          headers: { "Cache-Control": "no-cache" },
        },
      );
      if (!farmerRes.ok) throw new Error("Farmer not found");
      const farmerData = await farmerRes.json();
      const farmerEmail = farmerData.farmer?.email || "";

      // Canonical redirect: if path param isn't email but we have one, replace URL
      if (farmerEmail && identifier !== farmerEmail) {
        // Avoid redirect loop if identifier already equals decoded email
        const decoded = decodeURIComponent(identifier);
        if (decoded !== farmerEmail) {
          router.replace(`/farmers/${encodeURIComponent(farmerEmail)}`);
        }
      }

      // Fetch all products (could be optimized server-side later)
      const productsRes = await fetch(
        `/api/products?limit=1000&t=${timestamp}`,
        { headers: { "Cache-Control": "no-cache" } },
      );
      const productsJson = await productsRes.json();
      const allProducts = productsJson.products || [];

      // Email-only product association
      const farmerProducts = farmerEmail
        ? allProducts.filter((product) => product.farmer?.email === farmerEmail)
        : [];

      // Orders filtered by email only
      const ordersRes = await fetch(
        `/api/orders?farmerEmail=${encodeURIComponent(farmerEmail)}`,
        { headers: { "Cache-Control": "no-cache" } },
      );
      const ordersJson = await ordersRes.json();
      const allOrders = ordersJson.orders || [];

      setFarmer(farmerData.farmer);
      setProducts(farmerProducts);

      // Stats calculations
      const totalProducts = farmerProducts.length;
      const activeProducts = farmerProducts.filter((p) => p.stock > 0).length;
      const totalStock = farmerProducts.reduce((s, p) => s + (p.stock || 0), 0);
      const averagePrice = totalProducts
        ? (
            farmerProducts.reduce((s, p) => s + (p.price || 0), 0) /
            totalProducts
          ).toFixed(2)
        : 0;
      let averageRating = 0;
      const productsWithRatings = farmerProducts.filter(
        (p) => parseFloat(p.averageRating) > 0,
      );
      if (productsWithRatings.length) {
        const totalRating = productsWithRatings.reduce(
          (s, p) => s + parseFloat(p.averageRating),
          0,
        );
        averageRating = (totalRating / productsWithRatings.length).toFixed(1);
      }
      const categories = [
        ...new Set(farmerProducts.map((p) => p.category).filter(Boolean)),
      ];

      // Local product-embedded reviews (if any embedded structure exists)
      const productReviews = farmerProducts.flatMap((p) =>
        (p.reviews || []).map((r) => ({
          ...r,
          productName: p.name,
          productId: p._id,
          source: "product",
          createdAt: r.createdAt || r.date || new Date().toISOString(),
        })),
      );

      // Separate reviews fetched by farmerEmail only
      let separateReviews = [];
      if (farmerEmail) {
        try {
          const reviewsRes = await fetch(
            `/api/reviews?farmerEmail=${encodeURIComponent(farmerEmail)}`,
            { headers: { "Cache-Control": "no-cache" } },
          );
          if (reviewsRes.ok) {
            const reviewsJson = await reviewsRes.json();
            separateReviews = (reviewsJson.reviews || []).map((r) => {
              const related = farmerProducts.find(
                (p) => p._id === r.productId || p._id === r.product?._id,
              );
              return {
                ...r,
                source: "reviews_collection",
                productName:
                  r.productName || related?.name || "Unknown Product",
                productId: r.productId || r.product?._id || related?._id,
                createdAt: r.createdAt || r.date || new Date().toISOString(),
              };
            });
          }
        } catch (e) {
          console.warn("Separate reviews fetch failed", e);
        }
      }

      const allReviews = [...productReviews, ...separateReviews]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      // Orders already filtered by email at API; still guard by items
      const farmerOrders = farmerEmail
        ? allOrders.filter((order) =>
            order.items?.some(
              (item) =>
                item.farmerEmail === farmerEmail ||
                item.farmer?.email === farmerEmail,
            ),
          )
        : [];

      const deliveredOrders = farmerOrders.filter(
        (o) => o.status === ORDER_STATUS.DELIVERED,
      );
      const totalRevenue = deliveredOrders.reduce(
        (s, o) => s + (o.farmerSubtotal || o.total || 0),
        0,
      );
      const now = new Date();
      const monthlyRevenue = deliveredOrders
        .filter((o) => {
          const d = new Date(o.createdAt);
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        })
        .reduce((s, o) => s + (o.farmerSubtotal || o.total || 0), 0);

      const uniqueCustomers = new Set();
      deliveredOrders.forEach((o) => {
        if (o.userId) uniqueCustomers.add(o.userId);
        if (o.email) uniqueCustomers.add(o.email);
      });

      setReviews(allReviews);
      setStats({
        totalProducts,
        activeProducts,
        totalStock,
        averagePrice,
        averageRating,
        categories,
        totalReviews: allReviews.length,
        familiesServed: uniqueCustomers.size,
        farmSize: farmerData.farmer.farmSize || 0,
        farmSizeUnit: farmerData.farmer.farmSizeUnit || "acres",
        yearsOfExperience:
          farmerData.farmer.yearsOfExperience ||
          calculateYearsOfExperience(
            farmerData.farmer.joinedDate,
            farmerData.farmer.createdAt,
          ),
        certificationStatus: farmerData.farmer.isCertified
          ? "Certified"
          : "In Progress",
        farmingMethods: farmerData.farmer.farmingMethods || [
          "Organic",
          "Sustainable",
        ],
        monthlyRevenue: monthlyRevenue.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        inventoryValue: (parseFloat(averagePrice) * totalStock).toFixed(2),
      });
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [identifier, router]);

  useEffect(() => {
    fetchFarmerData();
  }, [fetchFarmerData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 dark:border-gray-600 border-t-green-600 dark:border-t-green-400 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-user-tie text-green-600 dark:text-green-400 text-2xl" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Loading Farmer Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discovering their story...
          </p>
        </div>
      </div>
    );
  }

  if (error || !farmer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-6">
            <i className="fas fa-exclamation-triangle" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Farmer Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {error ||
              "The farmer you're looking for doesn't exist or has been removed."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              <i className="fas fa-arrow-left mr-2" />
              Go Back
            </button>
            <Link
              href="/farmers"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              <i className="fas fa-users mr-2" />
              Browse Farmers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <FarmerHero farmer={farmer} stats={stats} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <FarmerTabsNav activeTab={activeTab} onChange={setActiveTab} />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {activeTab === "story" && (
              <StoryTab farmer={farmer} stats={stats} />
            )}
            {activeTab === "products" && (
              <ProductsTab
                stats={stats}
                products={products}
                farmerEmail={farmer?.email}
              />
            )}
            {activeTab === "reviews" && (
              <ReviewsTab reviews={reviews} stats={stats} />
            )}
            {activeTab === "stats" && (
              <StatsTab stats={stats} farmer={farmer} />
            )}
          </div>
        </div>
        <ActionSection
          farmer={farmer}
          stats={stats}
          farmerEmail={farmer?.email}
        />
      </div>
      <Footer />
    </>
  );
}
