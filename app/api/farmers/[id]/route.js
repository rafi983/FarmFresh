import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongooseConnection } from "@/lib/mongoose";
import Farmer from "@/models/Farmer";
import Product from "@/models/Product";

// Simple in-memory cache (5 min) for farmer details
const farmerCache = new Map();
const TTL = 5 * 60 * 1000;
function cacheKey(id) {
  return `farmer:${id}`;
}
function getCache(id) {
  const k = cacheKey(id);
  const e = farmerCache.get(k);
  if (e && Date.now() - e.t < TTL) return e.v;
  farmerCache.delete(k);
  return null;
}
function setCache(id, v) {
  farmerCache.set(cacheKey(id), { v, t: Date.now() });
  if (farmerCache.size > 200) farmerCache.clear();
}

async function buildFarmerStats(farmerId, farmerDoc) {
  const idStr = farmerId.toString();
  const email = farmerDoc?.email;
  const name = farmerDoc?.name;
  const orMatch = [
    { farmerId: idStr },
    { "farmer._id": farmerId },
    { "farmer.id": idStr },
  ];
  if (email) orMatch.push({ farmerEmail: email }, { "farmer.email": email });
  if (name) orMatch.push({ "farmer.name": name });
  const products = await Product.find({ $or: orMatch })
    .select("stock averageRating purchaseCount featured")
    .lean();
  let totalProducts = products.length;
  let activeProducts = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  let totalSales = 0;
  let totalStock = 0;
  let featuredProducts = 0;
  for (const p of products) {
    totalStock += p.stock || 0;
    if ((p.stock || 0) > 0) activeProducts += 1;
    if (p.averageRating) {
      ratingSum += p.averageRating;
      ratingCount += 1;
    }
    totalSales += p.purchaseCount || 0;
    if (p.featured) featuredProducts += 1;
  }
  return {
    totalProducts,
    activeProducts,
    averageRating: ratingCount
      ? Math.round((ratingSum / ratingCount) * 10) / 10
      : 0,
    totalSales,
    totalStock,
    featuredProducts,
  };
}

async function fetchFarmerProducts(farmerId, farmerDoc) {
  const idStr = farmerId.toString();
  const email = farmerDoc?.email;
  const name = farmerDoc?.name;
  const match = {
    $or: [
      { farmerId: idStr },
      { "farmer._id": farmerId },
      { "farmer.id": idStr },
    ],
  };
  if (email) match.$or.push({ farmerEmail: email });
  if (name) match.$or.push({ "farmer.name": name });
  return Product.find(match)
    .select(
      "name price stock category image images farmer farmerId farmerEmail averageRating reviewCount purchaseCount status featured createdAt",
    )
    .lean();
}

export async function GET(_req, { params }) {
  try {
    await getMongooseConnection();
    const { id } = params;
    if (!id)
      return NextResponse.json({ error: "Invalid farmer ID" }, { status: 400 });

    const cached = getCache(id);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("X-Cache", "HIT");
      return res;
    }

    // Try direct ID (string _id) then ObjectId
    let farmer = await Farmer.findOne({ _id: id }).lean();
    if (!farmer && ObjectId.isValid(id))
      farmer = await Farmer.findById(id).lean();
    if (!farmer)
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

    const stats = await buildFarmerStats(farmer._id, farmer);
    const products = await fetchFarmerProducts(farmer._id, farmer);

    const enhanced = {
      ...farmer,
      profilePicture: farmer.profilePicture || farmer.profileImage,
      bio: farmer.bio || farmer.description,
      verified: farmer.verified || farmer.isCertified || false,
      stats,
      products,
    };

    const payload = { success: true, farmer: enhanced };
    setCache(id, payload);
    const res = NextResponse.json(payload);
    res.headers.set("X-Cache", "MISS");
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch farmer data", details: e.message },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await getMongooseConnection();
    const { id } = params;
    if (!id)
      return NextResponse.json({ error: "Invalid farmer ID" }, { status: 400 });
    const body = await request.json();

    // Only allow updating known fields
    const updatable = [
      "name",
      "phone",
      "location",
      "bio",
      "description",
      "farmName",
      "profilePicture",
      "profileImage",
      "specializations",
      "verified",
      "isCertified",
      "address",
      "farmInfo",
      "businessInfo",
      "preferences",
      "farmSize",
      "farmSizeUnit",
    ];
    const updateObj = { updatedAt: new Date() };
    for (const k of updatable)
      if (body[k] !== undefined) updateObj[k] = body[k];

    // Compute location if address provided
    if (body.address) {
      const parts = [];
      ["street", "city", "state", "country"].forEach((k) => {
        if (body.address[k]) parts.push(body.address[k]);
      });
      if (parts.length) updateObj.location = parts.join(", ");
    }

    let farmer = await Farmer.findOneAndUpdate(
      { _id: id },
      { $set: updateObj },
      { new: true },
    ).lean();
    if (!farmer && ObjectId.isValid(id))
      farmer = await Farmer.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateObj },
        { new: true },
      ).lean();
    if (!farmer)
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

    // Propagate name change to products if applicable
    if (body.name) {
      try {
        await Product.updateMany(
          {
            $or: [
              { farmerId: farmer._id.toString() },
              { "farmer._id": farmer._id },
              { "farmer.id": farmer._id.toString() },
              { farmerEmail: farmer.email },
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
      } catch {}
    }

    farmerCache.delete(cacheKey(id));
    return NextResponse.json({
      success: true,
      farmer,
      message: "Farmer updated successfully",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to update farmer", details: e.message },
      { status: 500 },
    );
  }
}
