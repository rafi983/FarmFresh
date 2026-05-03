import { NextResponse } from "next/server";
import { getMongooseConnection } from "@/lib/mongoose";
import { enhanceProductsWithRatings } from "@/lib/reviewUtils";
import Product from "@/models/Product";
import Farmer from "@/models/Farmer";
import Review from "@/models/Review";
import Order from "@/models/Order";
import User from "@/models/User";

const DEFAULT_LIMITS = {
  featuredProducts: 8,
  farmerSpotlights: 3,
  testimonials: 3,
  highlights: 3,
};

const CATEGORY_STYLE_MAP = {
  Vegetables: { icon: "🥕", bgColor: "green" },
  Fruits: { icon: "🍎", bgColor: "red" },
  Grains: { icon: "🌾", bgColor: "yellow" },
  Dairy: { icon: "🥛", bgColor: "blue" },
  Honey: { icon: "🍯", bgColor: "orange" },
  Herbs: { icon: "🌿", bgColor: "green" },
};

function buildInitials(value = "") {
  const parts = value.split(" ").filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  const initials = `${first}${second}`.toUpperCase();
  return initials || "FF";
}

function buildCategoryData(products) {
  const counts = new Map();
  for (const product of products) {
    const category = product.category || "Other";
    counts.set(category, (counts.get(category) || 0) + 1);
  }

  const categoryDetails = {};
  counts.forEach((count, name) => {
    const style = CATEGORY_STYLE_MAP[name] || {
      icon: "🧺",
      bgColor: "gray",
    };
    categoryDetails[name] = {
      name,
      icon: style.icon,
      bgColor: style.bgColor,
      count,
    };
  });

  const categories = Object.values(categoryDetails).sort(
    (a, b) => b.count - a.count,
  );

  return {
    categories,
    categoryData: categories.slice(0, 6),
  };
}

function formatCount(value) {
  if (typeof value !== "number") return "0";
  if (value >= 1000) return `${Math.round(value / 100) / 10}k+`;
  return `${value}+`;
}

export async function GET() {
  try {
    await getMongooseConnection();

    const baseProductFilter = { status: { $ne: "deleted" } };

    const [
      productsForCategories,
      featuredProductsRaw,
      farmerDocs,
      reviewDocs,
      farmersCount,
      productsCount,
      ordersCount,
      certifiedCount,
      customerCount,
    ] = await Promise.all([
      Product.find(baseProductFilter).select("category").lean(),
      Product.find(baseProductFilter)
        .sort({ purchaseCount: -1, averageRating: -1 })
        .limit(DEFAULT_LIMITS.featuredProducts)
        .lean(),
      Farmer.find({})
        .sort({ verified: -1, isCertified: -1, name: 1 })
        .lean(),
      Review.find({ comment: { $ne: "" } })
        .sort({ rating: -1, createdAt: -1 })
        .limit(12)
        .lean(),
      Farmer.countDocuments({}),
      Product.countDocuments(baseProductFilter),
      Order.countDocuments({}),
      Farmer.countDocuments({ $or: [{ verified: true }, { isCertified: true }] }),
      User.countDocuments({ userType: "customer" }),
    ]);

    const featuredNeedsFallback =
      !featuredProductsRaw.length ||
      !featuredProductsRaw.some((product) => (product.purchaseCount || 0) > 0);

    const featuredProducts = featuredNeedsFallback
      ? await Product.find(baseProductFilter)
          .sort({ createdAt: -1 })
          .limit(DEFAULT_LIMITS.featuredProducts)
          .lean()
      : featuredProductsRaw;

    const featuredProductsEnhanced = await enhanceProductsWithRatings(
      featuredProducts,
    );

    const { categories, categoryData } = buildCategoryData(productsForCategories);

    const categoryOptions = ["All Categories", ...categories.map((c) => c.name)];

    const farmerEmails = farmerDocs.map((f) => f.email).filter(Boolean);
    const farmerProducts = farmerEmails.length
      ? await Product.find({ "farmer.email": { $in: farmerEmails } })
          .select("farmer.email averageRating purchaseCount stock")
          .lean()
      : [];

    const farmerStatsMap = new Map();
    for (const product of farmerProducts) {
      const email = product.farmer?.email;
      if (!email) continue;
      if (!farmerStatsMap.has(email)) {
        farmerStatsMap.set(email, {
          totalProducts: 0,
          ratingSum: 0,
          ratingCount: 0,
          totalSales: 0,
        });
      }
      const stats = farmerStatsMap.get(email);
      stats.totalProducts += 1;
      stats.totalSales += product.purchaseCount || 0;
      if (product.averageRating) {
        stats.ratingSum += product.averageRating;
        stats.ratingCount += 1;
      }
    }

    const farmerSpotlights = farmerDocs
      .map((farmer) => {
        const stats = farmerStatsMap.get(farmer.email) || null;
        const averageRating = stats?.ratingCount
          ? Math.round((stats.ratingSum / stats.ratingCount) * 10) / 10
          : 0;
        const specialization = farmer.specializations?.filter(Boolean) || [];
        return {
          name: farmer.farmName || farmer.name || "",
          location: farmer.location || "",
          specialty:
            specialization.length > 0
              ? specialization.join(", ")
              : farmer.bio || farmer.description || "",
          rating: averageRating ? averageRating.toFixed(1) : "0.0",
          initials: buildInitials(farmer.farmName || farmer.name || "Farm"),
          totalSales: stats?.totalSales || 0,
          totalProducts: stats?.totalProducts || 0,
        };
      })
      .sort((a, b) => {
        if (b.totalSales !== a.totalSales) return b.totalSales - a.totalSales;
        if (b.rating !== a.rating)
          return parseFloat(b.rating) - parseFloat(a.rating);
        return b.totalProducts - a.totalProducts;
      });

    const topSellingFarmer = farmerSpotlights[0] || null;
    const spotlightFarmers = farmerSpotlights
      .slice(0, DEFAULT_LIMITS.farmerSpotlights)
      .map(({ totalSales, totalProducts, ...rest }) => rest);

    const reviewProductIds = reviewDocs
      .map((review) => review.productId)
      .filter(Boolean);
    const reviewedProducts = reviewProductIds.length
      ? await Product.find({ _id: { $in: reviewProductIds } })
          .select("_id name")
          .lean()
      : [];
    const productNameMap = new Map(
      reviewedProducts.map((p) => [p._id.toString(), p.name]),
    );

    const testimonials = reviewDocs
      .filter((review) => (review.comment || "").trim())
      .map((review) => {
        const productName = productNameMap.get(review.productId?.toString?.());
        return {
          quote: review.comment,
          name: review.reviewer || "Customer",
          title: productName || "Verified buyer",
          rating: review.rating || 0,
        };
      })
      .slice(0, DEFAULT_LIMITS.testimonials);

    const highlights = categoryData.slice(0, DEFAULT_LIMITS.highlights).map((cat) => ({
      title: cat.name,
      description: `${cat.count} items available right now.`,
      icon: cat.icon,
    }));

    const averageRatingAll = reviewDocs.length
      ? (
          reviewDocs.reduce((sum, review) => sum + (review.rating || 0), 0) /
          reviewDocs.length
        ).toFixed(1)
      : "0.0";

    const heroStats = [
      { label: "Local Farmers", value: formatCount(farmersCount) },
      { label: "Fresh Products", value: formatCount(productsCount) },
      {
        label: "Happy Customers",
        value: formatCount(customerCount || ordersCount),
      },
    ];

    const trustMetrics = [
      { label: "Registered Farmers", value: `${farmersCount}` },
      { label: "Orders Delivered", value: `${ordersCount}` },
      { label: "Active Products", value: `${productsCount}` },
      { label: "Avg Rating", value: averageRatingAll },
    ];

    return NextResponse.json({
      featuredProducts: featuredProductsEnhanced,
      categories,
      categoryData,
      categoryOptions,
      highlights,
      farmerSpotlights: spotlightFarmers,
      topSellingFarmer,
      testimonials,
      trustMetrics,
      heroStats,
      stats: {
        farmersCount,
        productsCount,
        ordersCount,
        customerCount,
        averageRating: averageRatingAll,
        certifiedCount,
      },
    });
  } catch (error) {
    console.error("Error building home data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch home data",
        featuredProducts: [],
        categories: [],
        categoryData: [],
        categoryOptions: ["All Categories"],
        highlights: [],
        farmerSpotlights: [],
        topSellingFarmer: null,
        testimonials: [],
        trustMetrics: [],
        heroStats: [],
        stats: {},
      },
      { status: 500 },
    );
  }
}
