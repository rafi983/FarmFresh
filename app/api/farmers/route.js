import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { getMongooseConnection } from "@/lib/mongoose";
import Farmer from "@/models/Farmer";
import Product from "@/models/Product";

// Response cache for identical requests (5 minutes)
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Generate cache key for request
function generateCacheKey(searchParams) {
  const params = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return JSON.stringify(params);
}

// Get cached response if available and not expired
function getCachedResponse(cacheKey) {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  responseCache.delete(cacheKey);
  return null;
}

// Set response in cache
function setCachedResponse(cacheKey, data) {
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  // Clear cache if it gets too large
  if (responseCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
      if (now - value.timestamp >= CACHE_TTL) {
        responseCache.delete(key);
      }
    }
  }
}

// Enhanced farmer data with product statistics
async function enhanceFarmersWithStatsMongoose(farmers, includeStats) {
  if (!includeStats || farmers.length === 0) {
    return farmers.map((f) => ({
      ...f,
      profilePicture: f.profilePicture || f.profileImage,
      bio: f.bio || f.description,
      verified: f.verified || f.isCertified || false,
      stats: {
        totalProducts: 0,
        activeProducts: 0,
        averageRating: 0,
        totalSales: 0,
        featuredProducts: 0,
      },
    }));
  }

  const emails = farmers.map((f) => f.email).filter(Boolean);
  const products = await Product.find({ "farmer.email": { $in: emails } })
    .select("farmer.email stock averageRating purchaseCount featured")
    .lean();

  const statsMap = new Map();
  for (const p of products) {
    const key = p.farmer?.email;
    if (!key) continue;
    if (!statsMap.has(key)) {
      statsMap.set(key, {
        totalProducts: 0,
        activeProducts: 0,
        ratingSum: 0,
        ratingCount: 0,
        totalSales: 0,
        featuredProducts: 0,
      });
    }
    const s = statsMap.get(key);
    s.totalProducts += 1;
    if ((p.stock || 0) > 0) s.activeProducts += 1;
    if (p.averageRating) {
      s.ratingSum += p.averageRating;
      s.ratingCount += 1;
    }
    s.totalSales += p.purchaseCount || 0;
    if (p.featured) s.featuredProducts += 1;
  }

  return farmers.map((f) => {
    const stat = statsMap.get(f.email) || null;
    const computed = stat
      ? {
          totalProducts: stat.totalProducts,
          activeProducts: stat.activeProducts,
          averageRating: stat.ratingCount
            ? Math.round((stat.ratingSum / stat.ratingCount) * 10) / 10
            : 0,
          totalSales: stat.totalSales,
          featuredProducts: stat.featuredProducts,
        }
      : {
          totalProducts: 0,
          activeProducts: 0,
          averageRating: 0,
          totalSales: 0,
          featuredProducts: 0,
        };
    return {
      ...f,
      profilePicture: f.profilePicture || f.profileImage,
      bio: f.bio || f.description,
      verified: f.verified || f.isCertified || false,
      stats: computed,
    };
  });
}

export async function GET(request) {
  try {
    await getMongooseConnection();
    const { searchParams } = new URL(request.url);
    const cacheKey = generateCacheKey(searchParams);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      const resp = NextResponse.json(cached);
      resp.headers.set("X-Cache", "HIT");
      resp.headers.set("Cache-Control", "public, max-age=300");
      return resp;
    }

    const search = searchParams.get("search");
    const specialization = searchParams.get("specialization");
    const location = searchParams.get("location");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit"))
      : 50;
    const page = parseInt(searchParams.get("page")) || 1;
    const includeStats = searchParams.get("includeStats") !== "false";

    const filter = {};
    // Only direct farmer docs (schema-based) expected
    if (search) filter.$text = { $search: search };
    if (specialization)
      filter.specializations = { $regex: specialization, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };

    const totalCount = await Farmer.countDocuments(filter);
    const farmersDocs = await Farmer.find(filter)
      .sort({ verified: -1, isCertified: -1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const enhancedFarmers = await enhanceFarmersWithStatsMongoose(
      farmersDocs,
      includeStats,
    );

    const responseData = {
      farmers: enhancedFarmers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
      filters: {
        search: search || "",
        specialization: specialization || "",
        location: location || "",
      },
    };

    setCachedResponse(cacheKey, responseData);
    const resp = NextResponse.json(responseData);
    resp.headers.set("X-Cache", "MISS");
    resp.headers.set("Cache-Control", "public, max-age=300");
    return resp;
  } catch (error) {
    console.error("Error in farmers API:", error);
    return NextResponse.json(
      { error: "Failed to fetch farmers" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    await getMongooseConnection();
    const session = await getServerSession(authOptions);
    if (!session || !session.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.userType !== "farmer")
      return NextResponse.json(
        { error: "Access denied. Farmers only." },
        { status: 403 },
      );

    const body = await request.json();
    const farmer = await Farmer.findOne({ email: session.user.email }).lean();
    if (!farmer)
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

    const updateData = { updatedAt: new Date() };
    if (body.name) updateData.name = body.name;
    if (body.phone) updateData.phone = body.phone;
    if (body.farmInfo)
      updateData.farmInfo = { ...(farmer.farmInfo || {}), ...body.farmInfo };
    if (body.address) {
      updateData.address = { ...(farmer.address || {}), ...body.address };
      const parts = [];
      ["street", "city", "state", "country"].forEach((k) => {
        if (body.address[k]) parts.push(body.address[k]);
      });
      if (parts.length) updateData.location = parts.join(", ");
    }
    if (body.businessInfo)
      updateData.businessInfo = {
        ...(farmer.businessInfo || {}),
        ...body.businessInfo,
      };
    if (body.preferences)
      updateData.preferences = {
        ...(farmer.preferences || {}),
        ...body.preferences,
      };
    if (body.specializations) updateData.specializations = body.specializations;

    await Farmer.updateOne({ _id: farmer._id }, { $set: updateData });

    if (body.name) {
      try {
        await Product.updateMany(
          {
            $or: [
              { farmerId: farmer._id.toString() },
              { farmerEmail: farmer.email },
              { "farmer._id": farmer._id },
              { "farmer.email": farmer.email },
            ],
          },
          {
            $set: {
              "farmer.name": body.name,
              farmerName: body.name,
              updatedAt: new Date(),
            },
          },
        );
      } catch (e) {
        /* ignore product update failure */
      }
    }

    responseCache.clear();
    const updatedFarmer = await Farmer.findById(farmer._id)
      .select("-password")
      .lean();
    return NextResponse.json(
      {
        success: true,
        message: "Farmer profile updated successfully",
        farmer: updatedFarmer,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Error updating farmer profile:", error);
    return NextResponse.json(
      { error: "Failed to update farmer profile", details: error.message },
      { status: 500 },
    );
  }
}
